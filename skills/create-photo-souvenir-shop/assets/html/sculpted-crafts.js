import * as T from "./assets/three.module.js";
import { mesh, box, sphere, cyl, ring, lathe, rounded } from "./materials.js";
import { COLLECTION } from "./collection.js";
export const CRAFT_CATALOG = Object.fromEntries(
  COLLECTION.crafts.map((d, i) => [
    "craft-" + d.slug,
    {
      ...d,
      personal: true,
      tripRelated: true,
      sculpted: true,
      category: d.kind,
      zone: "造物陈列",
      number: 11 + i,
    },
  ]),
);
export const CRAFT_TYPES = Object.keys(CRAFT_CATALOG);
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
function enamel(color, roughness = 0.23) {
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
const brass = new T.MeshStandardMaterial({
  color: "#bd995c",
  metalness: 0.83,
  roughness: 0.29,
});
const steel = new T.MeshStandardMaterial({
  color: "#c5cfce",
  metalness: 0.9,
  roughness: 0.22,
});
const rubber = new T.MeshStandardMaterial({
  color: "#253136",
  roughness: 0.69,
});
const magnetMetal = new T.MeshStandardMaterial({
  color: "#4c5654",
  metalness: 0.7,
  roughness: 0.4,
});
const thread = new T.MeshStandardMaterial({
  color: "#b88c55",
  roughness: 0.72,
});
function tube(p, points, r, m) {
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
function group(p, x = 0, y = 0, z = 0) {
  const g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  return g;
}
function roundBlock(p, w, h, d, x, y, z, m, r = 0.006) {
  const o = rounded(p, w, h, d, Math.min(r, w / 2 - 0.0001, h / 2 - 0.0001), m);
  o.position.set(x, y - h / 2, z - d / 2);
  return o;
}
function polygon(points, soft = false) {
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
function ellipse(w, h) {
  const s = new T.Shape();
  s.absellipse(0, 0, w / 2, h / 2, 0, Math.PI * 2, false, 0);
  return s;
}
function relief(p, shape, depth, m, x = 0, y = 0, z = 0, bevel = 0.002) {
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
function jewel(p, shape, color, x, y, z = 0, depth = 0.01) {
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
function arch(w, h) {
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
function link(p, x, y, z, r = 0.008, m = brass, turn = false) {
  return ring(p, r, 0.0019, x, y, z, m, turn);
}
function splitRing(p, x, y, z, m = brass, r = 0.039) {
  for (const dz of [-0.0016, 0.0016]) {
    const o = ring(p, r, 0.0025, x, y, z + dz, m, false);
    o.rotation.z = dz < 0 ? 0.14 : -0.12;
  }
  cyl(p, 0.004, 0.004, 0.014, x, y - r - 0.01, z, m, 12);
}
function chainPath(p, points, m = brass) {
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
function chain(p, x, yTop, yBottom, z, m = brass) {
  chainPath(
    p,
    [
      [x, yTop, z],
      [x, yBottom, z],
    ],
    m,
  );
}
function magnetBack(p, y, w = 0.16, z = -0.023) {
  for (const x of [-w * 0.27, w * 0.27]) {
    const o = cyl(p, 0.022, 0.022, 0.008, x, y, z, magnetMetal, 32);
    o.rotation.x = Math.PI / 2;
    const lip = ring(p, 0.0225, 0.0014, x, y, z - 0.004, steel, false);
  }
}
function pinBack(p, y, w = 0.11) {
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
function gull(p, x = 0, y = 0, z = 0, s = 1) {
  const g = group(p, x, y, z);
  g.scale.setScalar(s);
  sphere(g, 0.034, 0.022, 0.019, 0, 0.03, 0, enamel("white"));
  sphere(g, 0.017, 0.018, 0.015, -0.03, 0.048, 0, enamel("white"));
  const beak = mesh(
    g,
    new T.ConeGeometry(0.006, 0.023, 4),
    enamel("orange"),
    -0.052,
    0.046,
    0,
  );
  beak.rotation.z = Math.PI / 2;
  for (const side of [-1, 1]) {
    const wing = sphere(
      g,
      0.032,
      0.012,
      0.004,
      0.01,
      0.036,
      side * 0.018,
      enamel("gray"),
    );
    wing.rotation.z = -0.19;
    sphere(
      g,
      0.0025,
      0.0025,
      0.0015,
      -0.035,
      0.054,
      side * 0.014,
      enamel("ink"),
    );
    tube(
      g,
      [
        [side * 0.012, 0.012, 0],
        [side * 0.012, 0, 0.001],
        [side * 0.012 - 0.01, 0, 0.009],
      ],
      0.0016,
      brass,
    );
  }
  const tail = relief(
    g,
    polygon([
      [0.022, 0.022],
      [0.057, 0.015],
      [0.042, 0.035],
    ]),
    0.014,
    enamel("gray"),
  );
  return g;
}
function cap(p) {
  const g = group(p, 0, 0.055, 0);
  const top = mesh(
    g,
    new T.SphereGeometry(0.06, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    enamel("ink", 0.36),
  );
  top.scale.y = 0.6;
  const brim = sphere(
    g,
    0.067,
    0.005,
    0.046,
    -0.016,
    0.001,
    0.036,
    enamel("ink", 0.32),
  );
  ring(g, 0.058, 0.0011, 0, 0.003, 0, thread);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    const pts = Array.from({ length: 9 }, (_, k) => {
      const t = ((k / 8) * Math.PI) / 2;
      return [
        0.06 * Math.sin(t) * Math.cos(a),
        0.037 * Math.cos(t) + 0.001,
        0.06 * Math.sin(t) * Math.sin(a),
      ];
    });
    tube(g, pts, 0.0007, thread);
  }
  sphere(g, 0.005, 0.003, 0.005, 0, 0.037, 0, enamel("ink"));
  return g;
}
function chair(p, x = 0, y = 0, z = 0, s = 1) {
  const g = group(p, x, y, z);
  g.scale.setScalar(s);
  for (const a of [-1, 1]) {
    tube(
      g,
      [
        [a * 0.028, 0, 0.026],
        [a * 0.028, 0.038, -0.022],
        [a * 0.028, 0.084, -0.022],
      ],
      0.0022,
      brass,
    );
    tube(
      g,
      [
        [a * 0.028, 0, -0.025],
        [a * 0.028, 0.038, 0.023],
        [a * 0.028, 0.053, 0.022],
        [a * 0.028, 0.055, -0.026],
      ],
      0.0022,
      brass,
    );
    sphere(g, 0.0035, 0.0035, 0.0035, a * 0.028, 0.02, 0, brass);
  }
  roundBlock(g, 0.051, 0.005, 0.047, 0, 0.037, 0, enamel("jade"));
  roundBlock(g, 0.05, 0.033, 0.004, 0, 0.065, -0.024, enamel("ivory"));
  tube(
    g,
    [
      [-0.029, 0.083, -0.024],
      [0.029, 0.083, -0.024],
    ],
    0.0022,
    brass,
  );
  return g;
}
function tinyCar(p, x = 0, y = 0, z = 0, s = 1) {
  const g = group(p, x, y, z);
  g.scale.setScalar(s);
  roundBlock(g, 0.204, 0.052, 0.089, 0, 0.056, 0, enamel("red"), 0.008);
  roundBlock(g, 0.139, 0.055, 0.082, -0.002, 0.101, 0, enamel("red"), 0.007);
  roundBlock(g, 0.084, 0.023, 0.084, -0.061, 0.078, 0, enamel("red"), 0.005);
  for (const side of [-1, 1]) {
    for (const xx of [-0.028, 0.026])
      roundBlock(
        g,
        0.046,
        0.034,
        0.002,
        xx,
        0.106,
        side * 0.042,
        enamel("ink"),
        0.002,
      );
    roundBlock(
      g,
      0.113,
      0.009,
      0.004,
      0.012,
      0.073,
      side * 0.046,
      brass,
      0.002,
    );
    for (const xx of [-0.063, 0.066]) {
      const wh = cyl(
        g,
        0.025,
        0.025,
        0.017,
        xx,
        0.031,
        side * 0.045,
        rubber,
        32,
      );
      wh.rotation.x = Math.PI / 2;
      const hub = cyl(
        g,
        0.014,
        0.014,
        0.018,
        xx,
        0.031,
        side * 0.05,
        steel,
        24,
      );
      hub.rotation.x = Math.PI / 2;
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        tube(
          g,
          [
            [xx, 0.031, side * 0.06],
            [
              xx + Math.cos(a) * 0.013,
              0.031 + Math.sin(a) * 0.013,
              side * 0.06,
            ],
          ],
          0.0012,
          brass,
        );
      }
    }
    tube(
      g,
      [
        [-0.068, 0.134, side * 0.035],
        [0.069, 0.134, side * 0.035],
      ],
      0.0025,
      steel,
    );
  }
  roundBlock(g, 0.004, 0.026, 0.07, -0.105, 0.052, 0, steel, 0.001);
  for (const zz of [-0.027, 0.027])
    sphere(g, 0.004, 0.007, 0.011, -0.108, 0.068, zz, enamel("ivory"));
  for (const xx of [-0.055, 0.055])
    tube(
      g,
      [
        [xx, 0.134, -0.038],
        [xx, 0.134, 0.038],
      ],
      0.0024,
      steel,
    );
  const spare = cyl(g, 0.023, 0.023, 0.018, 0.108, 0.087, 0, rubber, 32);
  spare.rotation.z = Math.PI / 2;
  chair(g, 0, 0.138, 0, 0.9);
  return g;
}
function cupRadius(r, h, y) {
  if (y < 0.034) return 0.066 + ((y - 0.008) / 0.026) * 0.013;
  if (y < h * 0.47)
    return 0.079 + ((r - 0.079) * (y - 0.034)) / (h * 0.47 - 0.034);
  return r;
}
// Subdivide relief faces before bending them, so the middle of a triangle cannot cut through the cup.
function curvedSurfaceGeometry(geometry) {
  const src = geometry.index ? geometry.toNonIndexed() : geometry,
    p = src.attributes.position,
    out = [];
  function triangle(a, b, c) {
    const edges = [
        a.distanceToSquared(b),
        b.distanceToSquared(c),
        c.distanceToSquared(a),
      ],
      longest = Math.max(...edges);
    if (longest < 0.013 ** 2) {
      out.push(...a, ...b, ...c);
      return;
    }
    const edge = edges.indexOf(longest);
    if (edge === 0) {
      const mid = a.clone().add(b).multiplyScalar(0.5);
      triangle(a, mid, c);
      triangle(mid, b, c);
    } else if (edge === 1) {
      const mid = b.clone().add(c).multiplyScalar(0.5);
      triangle(a, b, mid);
      triangle(a, mid, c);
    } else {
      const mid = c.clone().add(a).multiplyScalar(0.5);
      triangle(a, b, mid);
      triangle(mid, b, c);
    }
  }
  for (let i = 0; i < p.count; i += 3)
    triangle(
      new T.Vector3().fromBufferAttribute(p, i),
      new T.Vector3().fromBufferAttribute(p, i + 1),
      new T.Vector3().fromBufferAttribute(p, i + 2),
    );
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(out, 3));
  geo.setAttribute(
    "uv",
    new T.Float32BufferAttribute(new Float32Array((out.length / 3) * 2), 2),
  );
  return geo;
}
function cupBody(
  p,
  outer,
  inner,
  height = 0.21,
  radius = 0.089,
  fluted = false,
) {
  const body = lathe(
    p,
    [
      [0.058, 0],
      [0.066, 0.008],
      [0.079, 0.034],
      [radius, height * 0.47],
      [radius, height - 0.02],
      [radius - 0.002, height - 0.002],
      [radius - 0.009, height],
    ],
    outer,
  );
  if (fluted) {
    const pos = body.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getZ(i),
        y = pos.getY(i),
        k =
          1 +
          0.025 *
            Math.cos(Math.atan2(z, x) * 9) *
            Math.sin((Math.PI * y) / height);
      pos.setXYZ(i, x * k, y, z * k);
    }
    body.geometry.computeVertexNormals();
  }
  lathe(
    p,
    [
      [radius - 0.009, height],
      [radius - 0.015, height - 0.006],
      [radius - 0.017, 0.032],
      [0.054, 0.023],
      [0, 0.023],
    ],
    inner,
  );
  cyl(p, radius - 0.018, radius - 0.018, 0.003, 0, 0.025, 0, inner, 48);
  cyl(p, 0.059, 0.059, 0.006, 0, 0.004, 0, outer, 48);
  ring(p, 0.061, 0.003, 0, 0.004, 0, outer);
  ring(p, radius - 0.008, 0.0022, 0, height, 0, outer);
  return body;
}
function makeLakeCup(p) {
  cupBody(p, enamel("jade"), enamel("ivory"));
  for (let i = 0; i < 4; i++)
    ring(
      p,
      cupRadius(0.089, 0.21, 0.047 + i * 0.034) + 0.0007,
      0.0015,
      0,
      0.047 + i * 0.034,
      0,
      enamel(i % 2 ? "#64a59a" : "#2e7c78"),
    );
  tube(
    p,
    [
      [0.08, 0.17, 0],
      [0.126, 0.196, 0],
      [0.151, 0.154, 0],
      [0.144, 0.083, 0],
      [0.108, 0.049, 0],
      [0.078, 0.065, 0],
    ],
    0.013,
    enamel("jade"),
  );
  gull(p, -0.038, 0.211, 0.028, 0.55);
}
function makeRidgeCup(p) {
  cupBody(p, enamel("ivory"), enamel("blue"), 0.214, 0.091);
  const ridge = polygon([
    [-0.072, -0.047],
    [-0.072, 0.004],
    [-0.046, 0.025],
    [-0.033, 0.003],
    [-0.006, 0.057],
    [0.024, 0.012],
    [0.04, 0.028],
    [0.072, -0.006],
    [0.072, -0.047],
  ]);
  const wrapped = (shape, depth, material, angle, lift) => {
    const o = relief(p, shape, depth, material, 0, 0, 0, 0.0015),
      old = o.geometry;
    o.geometry = curvedSurfaceGeometry(old);
    old.dispose();
    const v = o.geometry.attributes.position;
    for (let i = 0; i < v.count; i++) {
      const y = 0.09 + v.getY(i),
        r = cupRadius(0.091, 0.214, y) + lift + v.getZ(i),
        a = angle + v.getX(i) / 0.091;
      v.setXYZ(i, Math.sin(a) * r, y, Math.cos(a) * r);
    }
    o.geometry.computeVertexNormals();
    const n = o.geometry.attributes.normal,
      shared = new Map(),
      keys = [];
    for (let i = 0; i < v.count; i++) {
      const key = [v.getX(i), v.getY(i), v.getZ(i)]
        .map((x) => Math.round(x * 1e6))
        .join();
      keys.push(key);
      if (!shared.has(key)) shared.set(key, new T.Vector3());
      shared.get(key).add(new T.Vector3().fromBufferAttribute(n, i));
    }
    for (let i = 0; i < n.count; i++) {
      const normal = shared.get(keys[i]).clone().normalize();
      n.setXYZ(i, normal.x, normal.y, normal.z);
    }
  };
  for (const a of [0, 2.12, -2.12]) {
    wrapped(ridge, 0.005, enamel("blue"), a, 0.004);
    wrapped(
      polygon([
        [-0.021, 0.033],
        [-0.006, 0.057],
        [0.009, 0.034],
        [0, 0.04],
        [-0.006, 0.035],
        [-0.012, 0.041],
      ]),
      0.002,
      enamel("white"),
      a,
      0.008,
    );
  }

  tube(
    p,
    [
      [0.083, 0.169, 0],
      [0.108, 0.203, 0],
      [0.15, 0.181, 0],
      [0.151, 0.065, 0],
      [0.108, 0.047, 0],
      [0.081, 0.074, 0],
    ],
    0.01,
    enamel("blue"),
  );
  tube(
    p,
    [
      [0.148, 0.157, 0.001],
      [0.148, 0.085, 0.001],
    ],
    0.006,
    brass,
  );
  for (const y of [0.158, 0.085])
    sphere(p, 0.008, 0.01, 0.008, 0.148, y, 0, brass);
  const peak = mesh(
    p,
    new T.ConeGeometry(0.016, 0.02, 3),
    enamel("ivory"),
    0,
    0.037,
    0,
  );
  peak.rotation.y = 0.3;
}
function makeKoiCup(p) {
  cupBody(p, enamel("#a0c1aa"), enamel("ivory"), 0.18, 0.092, true);
  for (const y of [0.046, 0.077, 0.11]) {
    const pts = Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2,
        r =
          cupRadius(0.092, 0.18, y) *
            (1 + 0.025 * Math.cos(a * 9) * Math.sin((Math.PI * y) / 0.18)) +
          0.0007;
      return [Math.cos(a) * r, y, Math.sin(a) * r];
    });
    tube(p, pts, 0.0009, enamel("#709a88"));
  }
  tube(
    p,
    [
      [0.08, 0.151, 0],
      [0.126, 0.174, 0],
      [0.164, 0.142, 0],
      [0.163, 0.088, 0],
      [0.126, 0.037, 0],
      [0.082, 0.041, 0],
    ],
    0.013,
    enamel("orange"),
  );
  sphere(p, 0.023, 0.017, 0.017, 0.092, 0.155, 0, enamel("orange"));
  for (const z of [-0.018, 0.018]) {
    sphere(p, 0.003, 0.003, 0.0018, 0.086, 0.161, z, enamel("ink"));
    const fin = relief(
      p,
      polygon(
        [
          [0, 0],
          [0.023, 0.015],
          [0.03, -0.013],
          [0.011, -0.019],
        ],
        true,
      ),
      0.003,
      enamel("orange"),
      0.152,
      0.101,
      z,
      0.001,
    );
    fin.rotation.z = 0.6;
  }
  sphere(p, 0.02, 0.008, 0.014, 0.132, 0.169, 0, enamel("ivory"));
  sphere(p, 0.011, 0.026, 0.013, 0.162, 0.119, 0, enamel("ivory"));
  for (const sign of [-1, 1]) {
    const tail = relief(
      p,
      polygon(
        [
          [0, 0],
          [-0.032, 0.023],
          [-0.03, -0.01],
          [-0.012, -0.018],
        ],
        true,
      ),
      0.004,
      enamel("orange"),
      0.09,
      0.043,
      sign * 0.007,
      0.001,
    );
    tail.rotation.z = sign * 0.65;
  }
  tube(
    p,
    [
      [0.077, 0.156, 0.006],
      [0.068, 0.163, 0.012],
      [0.064, 0.161, 0.017],
    ],
    0.001,
    brass,
  );
}
function lakeLayers(p, frameColor = "gold") {
  const shape = arch(0.233, 0.237);
  relief(
    p,
    shape,
    0.027,
    frameColor === "gold" ? brass : enamel(frameColor),
    0,
    0.125,
    0,
    0.004,
  );
  const sky = relief(p, shape, 0.007, enamel("ivory"), 0, 0.127, 0.018, 0.002);
  sky.scale.set(0.92, 0.92, 1);
  const mountains = polygon([
    [-0.102, -0.081],
    [-0.102, 0.009],
    [-0.079, 0.036],
    [-0.055, 0.016],
    [-0.023, 0.071],
    [0.009, 0.023],
    [0.032, 0.05],
    [0.063, 0.012],
    [0.1, 0.023],
    [0.1, -0.081],
  ]);
  relief(p, mountains, 0.009, enamel("ink"), 0, 0.151, 0.025);
  relief(
    p,
    polygon([
      [-0.041, 0.041],
      [-0.023, 0.071],
      [-0.007, 0.037],
      [-0.019, 0.046],
      [-0.025, 0.041],
      [-0.031, 0.049],
    ]),
    0.003,
    enamel("white"),
    0,
    0.151,
    0.032,
    0.001,
  );
  relief(
    p,
    polygon(
      [
        [-0.101, -0.06],
        [-0.102, -0.005],
        [-0.065, 0.01],
        [-0.01, -0.012],
        [0.065, 0.026],
        [0.104, 0.022],
        [0.104, -0.06],
      ],
      true,
    ),
    0.01,
    enamel("blue"),
    0,
    0.1,
    0.034,
  );
  relief(
    p,
    polygon(
      [
        [-0.102, -0.061],
        [-0.101, -0.034],
        [-0.045, -0.023],
        [0.002, -0.039],
        [0.052, -0.006],
        [0.104, 0.011],
        [0.104, -0.061],
      ],
      true,
    ),
    0.009,
    enamel("jade"),
    0,
    0.096,
    0.046,
  );
  relief(
    p,
    polygon(
      [
        [-0.102, -0.062],
        [-0.099, -0.046],
        [-0.035, -0.037],
        [0.023, -0.049],
        [0.07, -0.025],
        [0.104, -0.018],
        [0.104, -0.062],
      ],
      true,
    ),
    0.005,
    enamel("ivory"),
    0,
    0.097,
    0.055,
    0.001,
  );
  magnetBack(p, 0.112, 0.18, -0.022);
}
function makeCampMagnet(p) {
  lakeLayers(p, "orange");
  tinyCar(p, 0, 0.027, 0.074, 0.68);
}
function makeFlags(p) {
  const g = group(p, 0, 0.143, 0);
  const base = polygon(
    [
      [-0.12, -0.076],
      [-0.13, 0.02],
      [-0.097, 0.084],
      [-0.04, 0.113],
      [0.04, 0.113],
      [0.098, 0.078],
      [0.126, 0.013],
      [0.119, -0.076],
    ],
    true,
  );
  relief(g, base, 0.012, brass, 0, 0, -0.006, 0.003);
  const colors = ["blue", "ivory", "red", "jade", "orange"];
  const center = new T.Vector2(0, -0.032);
  for (let i = 0; i < 13; i++) {
    const a = 0.1 + (i / 12) * (Math.PI - 0.2),
      end = new T.Vector2(Math.cos(a) * 0.117, Math.sin(a) * 0.131 - 0.005);
    tube(
      g,
      [
        [center.x, center.y, 0.008],
        [end.x, end.y, 0.008],
      ],
      0.0015,
      brass,
    );
    for (let j = 0; j < 3; j++) {
      const t = 0.3 + j * 0.25,
        c = center.clone().lerp(end, t),
        v = end.clone().sub(center).normalize(),
        n = new T.Vector2(-v.y, v.x),
        len = 0.025,
        w = 0.0035 + j * 0.002;
      const shape = polygon([
        [c.x - (v.x * len) / 2 + n.x * w, c.y - (v.y * len) / 2 + n.y * w],
        [c.x + (v.x * len) / 2 + n.x * w, c.y + (v.y * len) / 2 + n.y * w],
        [c.x + (v.x * len) / 2 - n.x * w, c.y + (v.y * len) / 2 - n.y * w],
        [c.x - (v.x * len) / 2 - n.x * w, c.y - (v.y * len) / 2 - n.y * w],
      ]);
      relief(
        g,
        shape,
        0.003,
        enamel(colors[(i + j) % 5]),
        0,
        0,
        0.012 + j * 0.003,
        0.0007,
      );
    }
  }
  sphere(g, 0.011, 0.011, 0.005, 0, -0.032, 0.018, brass);
  roundBlock(g, 0.112, 0.025, 0.038, 0, -0.078, 0.014, enamel("jade"));
  for (const x of [-0.038, 0.038])
    tube(
      g,
      [
        [x, -0.073, 0.01],
        [x, -0.029, 0.01],
      ],
      0.002,
      brass,
    );
  magnetBack(p, 0.139, 0.18, -0.025);
}
function makeGullPin(p) {
  jewel(
    p,
    polygon(
      [
        [-0.077, -0.031],
        [-0.085, -0.006],
        [-0.067, 0.011],
        [-0.045, 0.043],
        [0.012, 0.05],
        [0.045, 0.019],
        [0.039, -0.004],
        [0.096, -0.01],
        [0.097, -0.029],
        [0.041, -0.04],
      ],
      true,
    ),
    "ink",
    0,
    0.068,
  );
  jewel(
    p,
    polygon(
      [
        [-0.058, 0.023],
        [-0.07, 0.041],
        [-0.065, 0.064],
        [-0.039, 0.073],
        [-0.023, 0.053],
        [0.043, 0.044],
        [0.07, 0.052],
        [0.057, 0.021],
        [0.026, 0.007],
        [-0.037, 0.01],
      ],
      true,
    ),
    "white",
    0,
    0.098,
    0.009,
    0.008,
  );
  jewel(
    p,
    polygon([
      [-0.064, 0.056],
      [-0.086, 0.05],
      [-0.064, 0.043],
    ]),
    "orange",
    0,
    0.098,
    0.014,
    0.006,
  );
  jewel(
    p,
    polygon(
      [
        [-0.011, 0.036],
        [0.042, 0.037],
        [0.05, 0.024],
        [0.004, 0.02],
      ],
      true,
    ),
    "gray",
    0,
    0.098,
    0.019,
    0.004,
  );
  sphere(p, 0.0025, 0.0025, 0.002, -0.052, 0.156, 0.021, enamel("ink"));
  for (const x of [-0.01, 0.018])
    tube(
      p,
      [
        [x, 0.104, 0.021],
        [x, 0.082, 0.023],
        [x - 0.009, 0.081, 0.023],
      ],
      0.0015,
      brass,
    );
  pinBack(p, 0.079, 0.125);
}
function makeCloudPin(p) {
  jewel(p, cloud(0.17, 0.07), "ivory", 0, 0.051, 0, 0.01);
  chair(p, 0, 0.08, 0.019, 1.25);
  roundBlock(p, 0.027, 0.042, 0.022, 0.06, 0.112, 0.027, enamel("orange"));
  tube(
    p,
    [
      [0.05, 0.119, 0.04],
      [0.072, 0.119, 0.04],
    ],
    0.0014,
    brass,
  );
  tube(
    p,
    [
      [0.052, 0.134, 0.024],
      [0.052, 0.154, 0.006],
      [0.068, 0.147, 0.006],
      [0.065, 0.134, 0.024],
    ],
    0.0016,
    brass,
  );
  pinBack(p, 0.056, 0.125);
}
function makeCairnPin(p) {
  const shapes = [
    polygon(
      [
        [-0.07, -0.018],
        [-0.062, 0.017],
        [-0.004, 0.028],
        [0.065, 0.014],
        [0.07, -0.019],
        [0.012, -0.028],
      ],
      true,
    ),
    polygon(
      [
        [-0.051, -0.022],
        [-0.039, 0.025],
        [0.021, 0.033],
        [0.052, 0.01],
        [0.045, -0.025],
        [-0.007, -0.032],
      ],
      true,
    ),
    polygon(
      [
        [-0.039, -0.015],
        [-0.023, 0.025],
        [0.028, 0.022],
        [0.04, -0.004],
        [0.009, -0.022],
      ],
      true,
    ),
  ];
  const colors = ["blue", "sage", "ivory"];
  for (let i = 0; i < 3; i++) {
    const o = jewel(
      p,
      shapes[i],
      colors[i],
      [-0.004, 0.01, 0.007][i],
      0.043 + i * 0.045,
      i * 0.002,
      0.014,
    );
    o.rotation.z = [-0.1, 0.14, -0.16][i];
  }
  pinBack(p, 0.082, 0.092);
}
export function buildCraft(g, type) {
  const slug = CRAFT_CATALOG[type].slug;
  g.userData.sculpted = true;
  g.userData.motif = CRAFT_CATALOG[type].motif;
  if (slug === "gull-key") {
    cap(g);
    gull(g, -0.006, 0.096, -0.001, 0.86);
    splitRing(g, 0.01, 0.29, 0);
    chain(g, 0.01, 0.244, 0.15, -0.004);
    chainPath(g, [
      [0.012, 0.244, 0],
      [0.078, 0.226, 0],
      [0.085, 0.141, 0],
    ]);
    sphere(g, 0.019, 0.025, 0.012, 0.085, 0.114, 0, enamel("jade"));
    ring(g, 0.019, 0.0014, 0.085, 0.114, 0, brass, false);
  } else if (slug === "camp-key") {
    tinyCar(g, 0, 0.003, 0);
    splitRing(g, 0, 0.32, -0.025, steel);
    chain(g, 0, 0.273, 0.218, -0.025, steel);
    chainPath(
      g,
      [
        [0.002, 0.273, -0.025],
        [0.099, 0.249, 0],
        [0.112, 0.185, 0],
      ],
      steel,
    );
    jewel(g, cloud(0.066, 0.028), "ivory", 0.112, 0.164, 0, 0.006);
  } else if (slug === "pack-key") {
    roundBlock(
      g,
      0.117,
      0.151,
      0.065,
      0,
      0.112,
      0,
      enamel("orange", 0.43),
      0.027,
    );
    roundBlock(
      g,
      0.082,
      0.065,
      0.016,
      0,
      0.078,
      0.039,
      enamel("#d46436", 0.4),
      0.014,
    );
    for (const x of [-0.038, 0.038]) {
      roundBlock(g, 0.01, 0.12, 0.004, x, 0.115, 0.035, enamel("ink"));
      roundBlock(g, 0.017, 0.023, 0.007, x, 0.115, 0.04, brass, 0.002);
      tube(
        g,
        [
          [x, 0.177, -0.018],
          [x, 0.15, -0.058],
          [x, 0.059, -0.063],
          [x, 0.055, -0.019],
        ],
        0.006,
        enamel("ink", 0.65),
      );
    }
    tube(
      g,
      [
        [-0.032, 0.099, 0.05],
        [0.032, 0.099, 0.05],
      ],
      0.0014,
      brass,
    );
    link(g, 0.02, 0.09, 0.052, 0.007);
    tube(
      g,
      [
        [-0.029, 0.182, 0],
        [-0.025, 0.209, 0],
        [0.025, 0.209, 0],
        [0.029, 0.182, 0],
      ],
      0.006,
      enamel("ink"),
    );
    const o = ring(g, 0.04, 0.004, 0, 0.287, 0, brass, false);
    o.scale.x = 0.69;
    box(g, 0.006, 0.049, 0.007, 0.027, 0.287, 0, steel);
    chain(g, 0, 0.245, 0.214, 0);
    chain(g, 0.061, 0.181, 0.128, 0);
    jewel(g, ellipse(0.032, 0.044), "jade", 0.067, 0.099, 0.015, 0.009);
  } else if (slug === "lake-cup") makeLakeCup(g);
  else if (slug === "ridge-cup") makeRidgeCup(g);
  else if (slug === "koi-cup") makeKoiCup(g);
  else if (slug === "lake-magnet") lakeLayers(g);
  else if (slug === "camp-magnet") makeCampMagnet(g);
  else if (slug === "flags-magnet") makeFlags(g);
  else if (slug === "gull-pin") makeGullPin(g);
  else if (slug === "cloud-pin") makeCloudPin(g);
  else if (slug === "cairn-pin") makeCairnPin(g);
}
