import * as T from "./assets/three.module.js";
import {
  box,
  cyl,
  sphere,
  ring,
  tube,
  mesh,
  mat,
  plane,
  textured,
  label,
  timber,
  millwork,
} from "./materials.js";

// Components, not floor plans: the agent authors positions, proportions and combinations.
export function seededRandom(seed) {
  let n = 2166136261;
  for (const c of String(seed))
    n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
export function buildRoom(parent, r) {
  const { width: w, depth: d, height: h } = r;
  const wall = mat(r.wall, 0.93),
    floor = mat(r.floor, 0.85),
    trim = mat(r.trim, 0.7);
  box(parent, w, 0.1, d, 0, -0.06, 0, floor);
  box(parent, w, h, 0.1, 0, h / 2, -d / 2, wall);
  for (const x of [-w / 2, w / 2]) {
    box(parent, 0.1, h, d, x, h / 2, 0, wall);
    box(parent, 0.07, 0.12, d, x * 0.988, 0.06, 0, trim);
  }
  box(parent, w, 0.08, d, 0, h + 0.04, 0, mat(r.ceiling, 0.98));
  // The open front is the entry. Windows and internal partitions are authored fixtures.
  if (r.floorPattern === "checker") {
    const nx = Math.ceil(w / 0.55),
      nz = Math.ceil(d / 0.55);
    for (let x = 0; x < nx; x++)
      for (let z = 0; z < nz; z++)
        box(
          parent,
          w / nx - 0.006,
          0.009,
          d / nz - 0.006,
          -w / 2 + ((x + 0.5) * w) / nx,
          0,
          -d / 2 + ((z + 0.5) * d) / nz,
          (x + z) % 2 ? trim : floor,
        );
  } else if (r.floorPattern === "planks") {
    const nx = Math.ceil(w / 0.24),
      nz = Math.ceil(d / 1.4);
    for (let x = 0; x < nx; x++)
      for (let z = 0; z < nz; z++) {
        const m = timber(
          new T.Color(r.floor)
            .multiplyScalar(0.88 + ((x * 7 + z * 3) % 9) * 0.025)
            .getHex(),
        );
        box(
          parent,
          w / nx - 0.009,
          0.009,
          d / nz - 0.008,
          -w / 2 + ((x + 0.5) * w) / nx,
          0,
          -d / 2 + ((z + 0.5) * d) / nz,
          m,
        );
      }
  }
  if (r.wallTreatment === "slats")
    for (let x = -w / 2 + 0.08; x < w / 2; x += 0.16)
      box(parent, 0.035, h, 0.045, x, h / 2, -d / 2 + 0.07, trim);
}
export function buildFixture(parent, f, textures, collection) {
  const g = new T.Group();
  g.name = "fixture-" + f.id;
  g.position.set(...f.at);
  g.rotation.y = f.rotation || 0;
  parent.add(g);
  const [w, h, d] = f.size,
    tone = f.color || collection.scene.room.trim;
  const color = f.surface === "paint" ? mat(tone, 0.6) : timber(tone, "x");
  const frame = mat(
    f.frameColor || f.color || collection.scene.room.trim,
    0.48,
    0.25,
  );
  const plank = (ww, hh, dd, x, y, z, m = color) =>
    millwork(g, ww, hh, dd, x, y, z, m);
  const top = (y, ww = w, dd = d) => plank(ww, 0.035, dd, 0, y - 0.0175, 0);
  const legs = (height = h) => {
    for (const x of [-w / 2 + 0.055, w / 2 - 0.055])
      for (const z of [-d / 2 + 0.055, d / 2 - 0.055])
        plank(0.035, height, 0.035, x, height / 2, z, frame);
  };
  switch (f.kind) {
    case "table":
    case "trestle":
      top(h);
      if (f.kind === "table") {
        legs(h - 0.035);
        top(0.2, w - 0.08, d - 0.08);
        for (const z of [-d / 2 + 0.055, d / 2 - 0.055])
          plank(w - 0.1, 0.095, 0.024, 0, h - 0.083, z);
        for (const x of [-w / 2 + 0.055, w / 2 - 0.055])
          plank(0.024, 0.095, d - 0.1, x, h - 0.083, 0);
      } else
        for (const x of [-w * 0.34, w * 0.34]) {
          plank(0.05, 0.045, d * 1.05, x, 0.08, 0, frame);
          for (const sign of [-1, 1]) {
            const leg = plank(0.04, h, 0.045, x, h / 2, sign * d * 0.27, frame);
            leg.rotation.x = sign * 0.2;
          }
        }
      break;
    case "shelf":
    case "card-rack": {
      const levels = f.levels || 4;
      for (const x of [-w / 2 + 0.02, w / 2 - 0.02])
        plank(0.035, h, d, x, h / 2, 0, frame);
      if (f.backed) plank(w, h, 0.025, 0, h / 2, -d / 2, color);
      for (let i = 0; i < levels; i++) {
        const y = 0.12 + (i * (h - 0.18)) / (levels - 1);
        top(y);
        if (f.kind === "card-rack")
          plank(w, 0.035, 0.014, 0, y + 0.015, d / 2, color);
        // Recessed shelf brackets, legible close up without changing stock coordinates.
        for (const x of [-w * 0.36, w * 0.36]) {
          plank(0.018, 0.1, 0.024, x, y - 0.065, -d / 2 + 0.027, frame);
          plank(0.018, 0.018, d * 0.66, x, y - 0.045, -d * 0.13, frame);
        }
      }
      break;
    }
    case "ledge":
      top(h);
      for (const x of [-w * 0.35, w * 0.35]) {
        plank(0.022, 0.15, 0.022, x, h - 0.095, -d / 2 + 0.025, frame);
        plank(0.022, 0.022, d * 0.8, x, h - 0.045, -d * 0.05, frame);
      }
      break;
    case "plinth":
      plank(w, h, d, 0, h / 2, 0);
      break;
    case "crate":
      top(0.025);
      for (let row = 0; row < 4; row++) {
        const y = ((row + 0.5) * h) / 4;
        for (const z of [-d / 2, d / 2])
          plank(w, h / 4 - 0.015, 0.025, 0, y, z);
        for (const x of [-w / 2, w / 2])
          plank(0.025, h / 4 - 0.015, d, x, y, 0);
      }
      break;
    case "basket": {
      const r = Math.min(w, d) / 2;
      cyl(g, r * 0.83, r * 0.72, 0.02, 0, 0.012, 0, color);
      for (let i = 0; i < 10; i++)
        ring(
          g,
          r * (0.76 + (0.24 * i) / 9),
          0.012,
          0,
          0.025 + (i * (h - 0.025)) / 9,
          0,
          color,
        );
      for (let i = 0; i < 20; i++) {
        const a = (i * Math.PI) / 10;
        tube(
          g,
          [
            [Math.cos(a) * r * 0.76, 0.02, Math.sin(a) * r * 0.76],
            [Math.cos(a) * r, h, Math.sin(a) * r],
          ],
          0.008,
          frame,
        );
      }
      break;
    }
    case "pegboard":
      plank(w, h, 0.025, 0, h / 2, -d / 2);
      for (let y = 0.12; y < h; y += 0.2)
        for (let x = -w / 2 + 0.1; x < w / 2; x += 0.2)
          tube(
            g,
            [
              [x, y, -d / 2],
              [x, y, d / 2 - 0.01],
              [x, y + 0.025, d / 2],
            ],
            0.007,
            frame,
          );
      break;
    case "rail":
      for (const x of [-w / 2, w / 2]) {
        cyl(g, 0.018, 0.018, h, x, h / 2, 0, frame);
        plank(0.1, 0.025, d, x, 0.012, 0, frame);
      }
      tube(
        g,
        [
          [-w / 2, h, 0],
          [w / 2, h, 0],
        ],
        0.018,
        frame,
      );
      break;
    case "lantern":
    case "pendant": {
      tube(
        g,
        [
          [0, h, 0],
          [0, h * 0.62, 0],
        ],
        0.002,
        frame,
      );
      if (f.kind === "lantern") {
        sphere(
          g,
          w / 2,
          h * 0.3,
          d / 2,
          0,
          h * 0.32,
          0,
          mat(f.color || "#f2dfb5", 0.88),
        );
        for (let i = 1; i < 13; i++) {
          const a = (i * Math.PI) / 14;
          const rib = ring(
            g,
            (Math.sin(a) * w) / 2,
            0.003,
            0,
            h * 0.32 + Math.cos(a) * h * 0.3,
            0,
            frame,
          );
          rib.scale.y = d / w;
        }
      } else {
        mesh(
          g,
          new T.ConeGeometry(w / 2, h * 0.45, 40, 1, true),
          mat(f.color || "#df763c", 0.45),
          0,
          h * 0.4,
          0,
        );
      }
      sphere(
        g,
        0.035,
        0.04,
        0.035,
        0,
        h * 0.2,
        0,
        new T.MeshStandardMaterial({
          color: "#fff1bd",
          emissive: "#ffc87c",
          emissiveIntensity: 2,
          roughness: 0.4,
        }),
      );
      break;
    }
    case "canopy": {
      const geometry = new T.PlaneGeometry(w, d, 12, 24),
        p = geometry.attributes.position;
      for (let i = 0; i < p.count; i++)
        p.setZ(i, -Math.sin((p.getY(i) / d + 0.5) * Math.PI) * h);
      geometry.computeVertexNormals();
      const art = collection.artworks.findIndex((a) => a.id === f.artwork);
      const m =
        art >= 0
          ? textured(textures["art-" + art], 0.96, { side: T.DoubleSide })
          : mat(f.color || collection.palette[0], 0.96).clone();
      m.side = T.DoubleSide;
      const o = mesh(g, geometry, m);
      o.rotation.x = -Math.PI / 2;
      break;
    }
    case "window":
      plank(w, h, 0.02, 0, h / 2, 0, mat(f.color || "#bfd7dd", 0.38));
      for (const x of [-w / 2, 0, w / 2])
        plank(0.035, h, 0.07, x, h / 2, 0.025, frame);
      for (const y of [0, h / 2, h]) plank(w, 0.035, 0.07, 0, y, 0.025, frame);
      break;
    default:
      throw new Error("Unknown fixture " + f.kind);
  }
  if (f.label)
    plane(
      g,
      Math.min(w * 0.8, 0.65),
      0.065,
      label(f.label, collection.scene.room.ceiling, collection.scene.room.wall),
      0,
      Math.min(h, 0.75),
      d / 2 + 0.005,
    );
  return g;
}
export function fixtureCollider(f) {
  if (
    f.collision === false ||
    ["lantern", "pendant", "canopy", "window"].includes(f.kind) ||
    f.at[1] > 1.9
  )
    return null;
  return {
    x: f.at[0],
    z: f.at[2],
    w: f.size[0],
    d: f.size[2],
    rotation: f.rotation || 0,
  };
}
