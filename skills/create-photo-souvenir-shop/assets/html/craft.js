// Fabrication components from the original shop. Author motifs from the new photos.
import * as T from "./assets/three.module.js";
import { mesh, cyl, ring, rounded } from "./materials.js";
const shades = {
  ivory: "#f3e8cc",
  white: "#fff7e8",
  ink: "#243943",
  jade: "#3f8f87",
  teal: "#246a75",
  blue: "#2c6096",
  sage: "#9eae7d",
  orange: "#dd7642",
  red: "#c84437",
  gold: "#c3a165",
  gray: "#89989b",
};
const surfaceCache = new Map();
export function enamel(color, roughness = 0.23) {
  const c = shades[color] || color,
    k = c + roughness;
  if (!surfaceCache.has(k))
    surfaceCache.set(
      k,
      new T.MeshPhysicalMaterial({
        color: c,
        roughness,
        metalness: 0.06,
        clearcoat: 0.78,
        clearcoatRoughness: 0.22,
      }),
    );
  return surfaceCache.get(k);
}
export const brass = new T.MeshStandardMaterial({
  color: "#bd995c",
  metalness: 0.83,
  roughness: 0.29,
});
export const steel = new T.MeshStandardMaterial({
  color: "#c5cfce",
  metalness: 0.9,
  roughness: 0.22,
});
export const rubber = new T.MeshStandardMaterial({
  color: "#253136",
  roughness: 0.69,
});
export const magnetMetal = new T.MeshStandardMaterial({
  color: "#4c5654",
  metalness: 0.7,
  roughness: 0.4,
});
export const thread = new T.MeshStandardMaterial({
  color: "#b88c55",
  roughness: 0.72,
});
export function tube(p, points, r, m) {
  return mesh(
    p,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map((v) => new T.Vector3(...v))),
      Math.max(32, points.length * 12),
      r,
      12,
      false,
    ),
    m,
  );
}
export function group(p, x = 0, y = 0, z = 0) {
  const g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  return g;
}
export function roundBlock(p, w, h, d, x, y, z, m, r = 0.006) {
  const o = rounded(p, w, h, d, Math.min(r, w / 2 - 0.0001, h / 2 - 0.0001), m);
  o.position.set(x, y - h / 2, z - d / 2);
  return o;
}
export function polygon(points, soft = false) {
  const s = new T.Shape();
  if (soft) {
    const last = points.at(-1),
      first = points[0];
    s.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
    points.forEach((v, i) => {
      const n = points[(i + 1) % points.length];
      s.quadraticCurveTo(v[0], v[1], (v[0] + n[0]) / 2, (v[1] + n[1]) / 2);
    });
  } else points.forEach((v, i) => (i ? s.lineTo(...v) : s.moveTo(...v)));
  s.closePath();
  return s;
}
export function ellipse(w, h) {
  const s = new T.Shape();
  s.absellipse(0, 0, w / 2, h / 2, 0, Math.PI * 2, false, 0);
  return s;
}
export function relief(p, shape, depth, m, x = 0, y = 0, z = 0, bevel = 0.002) {
  const geo = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel * 0.7,
    bevelSegments: 3,
    curveSegments: 24,
    steps: 1,
  });
  geo.translate(0, 0, -depth / 2);
  return mesh(p, geo, m, x, y, z);
}
export function jewel(p, shape, color, x, y, z = 0, depth = 0.01) {
  const g = group(p, x, y, z);
  relief(g, shape, depth, brass);
  const fill = relief(
    g,
    shape,
    0.005,
    enamel(color),
    0,
    0,
    depth / 2 + 0.001,
    0.0012,
  );
  fill.scale.set(0.94, 0.91, 1);
  return g;
}
export function arch(w, h) {
  const s = new T.Shape(),
    y = h / 2 - w / 2;
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, y);
  s.absarc(0, y, w / 2, 0, Math.PI, false);
  s.lineTo(-w / 2, -h / 2);
  s.closePath();
  return s;
}
function cloud(w = 0.17, h = 0.072) {
  return polygon(
    [
      [-0.5 * w, -0.34 * h],
      [-0.56 * w, 0.05 * h],
      [-0.4 * w, 0.35 * h],
      [-0.22 * w, 0.3 * h],
      [-0.1 * w, 0.66 * h],
      [0.15 * w, 0.58 * h],
      [0.23 * w, 0.26 * h],
      [0.4 * w, 0.36 * h],
      [0.57 * w, 0.04 * h],
      [0.48 * w, -0.34 * h],
    ],
    true,
  );
}
export function link(p, x, y, z, r = 0.008, m = brass, turn = false) {
  return ring(p, r, 0.0019, x, y, z, m, turn);
}
export function splitRing(p, x, y, z, m = brass, r = 0.039) {
  for (const dz of [-0.0016, 0.0016]) {
    const o = ring(p, r, 0.0025, x, y, z + dz, m, false);
    o.rotation.z = dz < 0 ? 0.14 : -0.12;
  }
  cyl(p, 0.004, 0.004, 0.014, x, y - r - 0.01, z, m, 12);
}
export function chainPath(p, points, m = brass) {
  const path = new T.CatmullRomCurve3(points.map((v) => new T.Vector3(...v))),
    n = Math.max(2, Math.ceil(path.getLength() / 0.01));
  for (let i = 0; i <= n; i++) {
    const v = path.getPointAt(i / n),
      o = link(p, v.x, v.y, v.z, 0.007, m);
    o.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      path.getTangentAt(i / n),
    );
    if (i % 2) o.rotateY(Math.PI / 2);
  }
}
export function chain(p, x, yTop, yBottom, z, m = brass) {
  chainPath(
    p,
    [
      [x, yTop, z],
      [x, yBottom, z],
    ],
    m,
  );
}
export function magnetBack(p, y, w = 0.16, z = -0.023) {
  for (const x of [-w * 0.27, w * 0.27]) {
    const o = cyl(p, 0.022, 0.022, 0.008, x, y, z, magnetMetal, 32);
    o.rotation.x = Math.PI / 2;
    const lip = ring(p, 0.0225, 0.0014, x, y, z - 0.004, steel, false);
  }
}
export function pinBack(p, y, w = 0.11) {
  roundBlock(p, w, 0.017, 0.006, 0, y, -0.012, brass, 0.005);
  const needle = cyl(p, 0.0015, 0.0015, w * 0.9, 0, y, -0.023, steel, 10);
  needle.rotation.z = Math.PI / 2;
  link(p, -w * 0.43, y, -0.021, 0.008, brass, true);
  tube(
    p,
    [
      [w * 0.44, y - 0.009, -0.015],
      [w * 0.5, y - 0.008, -0.025],
      [w * 0.47, y + 0.005, -0.027],
      [w * 0.4, y + 0.006, -0.021],
    ],
    0.0023,
    brass,
  );
}
