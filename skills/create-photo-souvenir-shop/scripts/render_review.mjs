#!/usr/bin/env node
// Usage: node render_review.mjs SITE NEW_REVIEW_DIR [--limit N]
// Requires Playwright. SHOP_PLAYWRIGHT_MODULE and SHOP_CHROME are optional local paths.
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const [siteArg, outArg, ...args] = process.argv.slice(2);
if (!siteArg || !outArg)
  throw Error("Usage: render_review.mjs SITE NEW_REVIEW_DIR [--limit N]");
const root = await fs.realpath(siteArg),
  out = path.resolve(outArg);
if (out === root || out.startsWith(root + path.sep))
  throw Error("Review output must be outside the site");
const c = JSON.parse(
  await fs.readFile(path.join(root, "collection.json"), "utf8"),
);
const limitIndex = args.indexOf("--limit"),
  limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) : Infinity;
if (!(limit > 0)) throw Error("--limit must be positive");
await fs.mkdir(out); // Never overwrite a previous review.
const client = await fs.readFile(
  new URL("./review-client.js", import.meta.url),
);
const mime = {
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".html": "text/html",
  ".css": "text/css",
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/__review/client.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(client);
      return;
    }
    if (url.pathname === "/__review/") {
      res.setHeader("Content-Type", "text/html");
      res.end(
        '<!doctype html><body style="margin:0"><script type="module" src="/__review/client.js"></script>',
      );
      return;
    }
    const file = await fs.realpath(
      path.resolve(root, "." + decodeURIComponent(url.pathname)),
    );
    if (!file.startsWith(root + path.sep)) throw Error("outside site");
    res.setHeader(
      "Content-Type",
      mime[path.extname(file)] || "application/octet-stream",
    );
    res.end(await fs.readFile(file));
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});
// Fingerprint ALL render inputs so later edits invalidate the evidence.
async function digestSite() {
  const hash = createHash("sha256");
  async function visit(dir) {
    for (const name of (await fs.readdir(dir)).sort()) {
      if (name.startsWith(".") || name === "node_modules") continue;
      const file = path.join(dir, name),
        s = await fs.lstat(file);
      if (s.isSymbolicLink())
        throw Error("Review inputs cannot be symlinks: " + file);
      if (s.isDirectory()) await visit(file);
      else if (/\.(js|json|html|css|png|jpe?g|webp|svg)$/i.test(name))
        hash.update(path.relative(root, file)).update(await fs.readFile(file));
    }
  }
  await visit(root);
  return hash.digest("hex");
}
let browser;
try {
  const { chromium } = await import(
    process.env.SHOP_PLAYWRIGHT_MODULE
      ? pathToFileURL(process.env.SHOP_PLAYWRIGHT_MODULE).href
      : "playwright"
  );
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  browser = await chromium.launch({
    headless: true,
    ...(process.env.SHOP_CHROME
      ? { executablePath: process.env.SHOP_CHROME }
      : {}),
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().endsWith("/favicon.ico"))
      errors.push(r.status() + " " + r.url());
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/__review/`);
  await page.waitForFunction(() => window.reviewReady, {}, { timeout: 120000 });
  const list = await page.evaluate(() => window.review.list()),
    selected = list.slice(0, limit),
    report = {
      siteDigest: await digestSite(),
      complete: selected.length === list.length,
      items: [],
      scenes: [],
      sheets: [],
      errors,
    };
  async function save(file, data) {
    await fs.writeFile(
      path.join(out, file),
      Buffer.from(data.split(",")[1], "base64"),
    );
  }
  for (const key of Object.keys(c.scene.views)) {
    const file = "scene-" + key + ".png";
    await save(file, await page.evaluate((k) => window.review.scene(k), key));
    report.scenes.push(file);
  }
  const views = ["front", "oblique", "back", "clay"];
  for (let start = 0; start < selected.length; start += 9) {
    const batch = selected.slice(start, start + 9),
      tiles = Object.fromEntries(views.map((v) => [v, []]));
    for (const item of batch) {
      const measured = await page.evaluate(
        (t) => window.review.measure(t),
        item.type,
      );
      report.items.push({ ...item, ...measured });
      for (const view of views) {
        const src = await page.evaluate(
          ({ t, v }) => window.review.product(t, v),
          { t: item.type, v: view },
        );
        if (view === "oblique") {
          const file =
            "preview-" + item.type.replace(/[^a-zA-Z0-9_-]/g, "_") + ".png";
          await save(file, src);
          report.items.at(-1).preview = file;
        }
        tiles[view].push({ src, label: item.type + " / " + item.name });
      }
    }
    for (const view of views) {
      const file = `products-${String(start / 9 + 1).padStart(2, "0")}-${view}.png`;
      await save(
        file,
        await page.evaluate((t) => window.review.sheet(t), tiles[view]),
      );
      report.sheets.push(file);
    }
    console.log(
      `Rendered ${Math.min(start + 9, selected.length)}/${selected.length} unique types`,
    );
  }
  if (report.siteDigest !== (await digestSite()))
    throw Error(
      "Site changed during rendering; rerun review on a stable build",
    );
  await fs.writeFile(
    path.join(out, "render-report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  if (errors.length) throw Error("Browser errors: " + errors.join("; "));
  console.log(
    "Actual-model evidence saved to " +
      out +
      ". Open the images; this is not an aesthetic pass.",
  );
} finally {
  await browser?.close();
  server.close();
}
