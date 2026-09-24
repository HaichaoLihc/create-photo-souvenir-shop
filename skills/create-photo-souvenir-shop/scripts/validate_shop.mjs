#!/usr/bin/env node
// CPU-side scene validation: no WebGL context or browser automation is required.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const root = path.resolve(
  process.argv[2] || new URL("../assets/html/", import.meta.url).pathname,
);
const local = (rel) => {
  const p = path.resolve(root, rel);
  assert(p.startsWith(root + path.sep), "Asset stays in site");
  assert(fs.statSync(p).size > 0, "Nonempty asset " + rel);
  return p;
};
const load = (file) => import(pathToFileURL(local(file)));
const { COLLECTION: c } = await load("collection.js");
const { TEXTURE_SOURCES } = await load("texture-sources.js");
const T = await load("assets/three.module.js");
const { buildShop, CATALOG } = await load("gallery.js");
const { ZONES, positionAllowed } = await load("navigation.js");
const { optimize } = await load("optimize.js");
const {
  instanceRepeatedItems,
  instanceOwner,
  showItem,
  prepareInspectionClone,
} = await load("instances.js");
for (const p of c.photos) local(p.src);
assert(c.artworks.length > 0 && c.artworks.length <= 100);
assert.equal(new Set(c.artworks.map((a) => a.id)).size, c.artworks.length);
assert.equal(
  new Set(c.artworks.map((a) => a.src)).size,
  c.artworks.length,
  "Different files for different artworks",
);
for (const a of c.artworks) {
  local(a.src);
  assert(c.photos.some((p) => p.id === a.photo));
}
for (const gift of c.crafts) local(gift.preview);
if (c.book) {
  local(c.book.reader);
  local(c.book.cover);
  local(c.book.back);
}
const visited = new Set();
function modules(file) {
  if (visited.has(file)) return;
  visited.add(file);
  for (const [, ref] of fs
    .readFileSync(file, "utf8")
    .matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g)) {
    const next = path.resolve(path.dirname(file), ref);
    assert(fs.existsSync(next), next);
    modules(next);
  }
}
modules(local("main.js"));
const html = fs.readFileSync(local("index.html"), "utf8");
for (const [, id] of fs
  .readFileSync(local("main.js"), "utf8")
  .matchAll(/\$\(['"]([^'"]+)['"]\)/g))
  assert(html.includes(`id="${id}"`), "DOM binding " + id);
const context = new Proxy(
  {},
  {
    get: (_, key) =>
      key === "getImageData"
        ? () => ({ data: new Uint8ClampedArray(16), width: 2, height: 2 })
        : () => {},
    set: () => true,
  },
);
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => context }),
};
const textures = {};
for (const [key, url] of TEXTURE_SOURCES) {
  local(url);
  const [width, height] = c.imageSizes[url];
  textures[key] = new T.Texture({ width, height });
  if (key.startsWith("art-")) textures[key].userData.tripArtwork = true;
  if (key === "mobiles") textures[key].userData.tripOrnaments = true;
}
const shop = buildShop(textures);
shop.room.updateMatrixWorld(true);
const ids = new Set(),
  before = shop.objects.map((o) => new T.Box3().setFromObject(o, true));
const sources = new Set(c.photos.map((p) => p.id));
for (const item of shop.objects) {
  assert(item.userData.definition, "Catalog entry " + item.name);
  assert(!ids.has(item.userData.id));
  ids.add(item.userData.id);
  const d = item.userData.definition;
  const b = new T.Box3().setFromObject(item, true);
  assert(b.max.y < 3.3 && b.min.y > -0.1, "Item inside room " + item.name);
  if (d.personal || d.tripRelated) {
    assert(sources.has(d.sourcePhoto), "Known source " + item.name);
    let print = false;
    item.traverse((m) => {
      if (
        m.isMesh &&
        (m.material.map?.userData.tripArtwork ||
          m.material.map?.userData.tripOrnaments)
      )
        print = true;
    });
    assert(
      print || d.sculpted || d.reader,
      "Personalization changes visible geometry or texture " + item.name,
    );
  }
}
shop.room.traverse((m) => {
  if (m.isMesh)
    assert(
      [...m.geometry.attributes.position.array].every(Number.isFinite),
      "Finite mesh " + m.name,
    );
});
assert.equal(shop.postcardWall.length, c.artworks.length);
assert.equal(
  new Set(shop.postcardWall.map((o) => o.userData.type)).size,
  c.artworks.length,
  "No repeated artwork on postcard wall",
);
assert(shop.mobiles.length >= 100, "Layered hanging collection");
assert(
  shop.tripRelated.length / shop.objects.length >= 0.7,
  "At least 70% source-derived placed objects",
);
assert.equal(
  shop.personal.length,
  c.gifts.length + c.crafts.length + Number(!!c.book),
);
const ray = new T.Raycaster(),
  camera = new T.PerspectiveCamera(62, 1.6, 0.04, 40);
const owner = (mesh) => {
  while (mesh) {
    if (ids.has(mesh.userData.id)) return mesh;
    mesh = mesh.parent;
  }
  return null;
};
for (const [name, z] of Object.entries(ZONES)) {
  if (
    (name === "crafts" && !c.crafts.length) ||
    (name === "photobook" && !c.book)
  )
    continue;
  assert(
    positionAllowed(z.pos[0], z.pos[2], shop.colliders),
    "Walkable " + name,
  );
  camera.position.set(...z.pos);
  camera.lookAt(...z.target);
  camera.updateMatrixWorld(true);
  const picked = new Set();
  for (let x = -5; x <= 5; x++)
    for (let y = -4; y <= 4; y++) {
      ray.setFromCamera(new T.Vector2(x / 6, y / 5), camera);
      const hit = ray
        .intersectObject(shop.room, true)
        .find((h) => h.object.isMesh);
      if (hit && owner(hit.object)) picked.add(owner(hit.object).userData.id);
    }
  assert(picked.size > 0, "Pickable zone " + name);
}
if (c.book) {
  const book = shop.personal.find((o) => o.userData.definition.reader);
  const cover = book.getObjectByName("original-book-front-cover");
  assert.equal(cover.material.map, textures["book-cover"]);
  const size = cover.geometry.parameters;
  assert(
    Math.abs(
      size.width / size.height -
        textures["book-cover"].image.width /
          textures["book-cover"].image.height,
    ) < 1e-8,
    "Exact cover aspect",
  );
}
optimize(shop.room, shop.objects);
shop.room.updateMatrixWorld(true);
for (const [i, o] of shop.objects.entries()) {
  const after = new T.Box3().setFromObject(o, true);
  assert(
    after.min.distanceTo(before[i].min) < 1e-4 &&
      after.max.distanceTo(before[i].max) < 1e-4,
    "Optimization preserves geometry",
  );
}
const batching = instanceRepeatedItems(shop.room, shop.objects);
assert(batching.drawCallsSaved > 200);
const batch = shop.room.children.find((o) => o.isInstancedMesh),
  item = batch.userData.giftInstances[0];
assert.equal(instanceOwner({ object: batch, instanceId: 0 }), item);
showItem(item, false);
assert.equal(item.visible, false);
showItem(item, true);
assert.equal(item.visible, true);
prepareInspectionClone(item.clone(true)).traverse((m) =>
  assert.equal(m.layers.mask, 1),
);
console.log(
  JSON.stringify({
    objects: shop.objects.length,
    personal: shop.personal.length,
    photoDerivedPercent: Math.round(
      (shop.tripRelated.length / shop.objects.length) * 100,
    ),
    uniquePostcards: shop.postcardWall.length,
    hanging: shop.mobiles.length,
    drawCallsSaved: batching.drawCallsSaved,
    modules: visited.size,
    book: !!c.book,
  }),
);
