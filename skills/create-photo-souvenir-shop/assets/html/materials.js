import * as T from "./assets/three.module.js";
const cache = new Map(),
  surfaceCache = new Map(),
  labelCache = new Map();
export function mat(color, roughness = 0.55, metalness = 0) {
  const k = [color, roughness, metalness].join();
  if (!cache.has(k))
    cache.set(k, new T.MeshStandardMaterial({ color, roughness, metalness }));
  return cache.get(k);
}
const cube = new T.BoxGeometry(1, 1, 1),
  ball = new T.SphereGeometry(1, 24, 16);
export function mesh(p, g, m, x = 0, y = 0, z = 0) {
  const o = new T.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  p.add(o);
  return o;
}
export function box(p, w, h, d, x, y, z, m) {
  const o = mesh(p, cube, m, x, y, z);
  o.scale.set(w, h, d);
  return o;
}
export function sphere(p, rx, ry, rz, x, y, z, m) {
  const o = mesh(p, ball, m, x, y, z);
  o.scale.set(rx, ry, rz);
  return o;
}
export function cyl(p, rt, rb, h, x, y, z, m, segments = 32) {
  return mesh(p, new T.CylinderGeometry(rt, rb, h, segments), m, x, y, z);
}
export function ring(p, r, t, x, y, z, m, horizontal = true) {
  const o = mesh(p, new T.TorusGeometry(r, t, 8, 40), m, x, y, z);
  if (horizontal) o.rotation.x = Math.PI / 2;
  return o;
}
export function tube(p, points, r, m) {
  return mesh(
    p,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
      Math.max(12, points.length * 5),
      r,
      6,
      false,
    ),
    m,
  );
}
export function lathe(p, points, m) {
  return mesh(
    p,
    new T.LatheGeometry(
      points.map((p) => new T.Vector2(...p)),
      48,
    ),
    m,
  );
}
export function roundedShape(w, h, r) {
  const s = new T.Shape(),
    x = -w / 2,
    y = 0;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
export function rounded(p, w, h, d, r, m) {
  const o = mesh(
    p,
    new T.ExtrudeGeometry(roundedShape(w, h, r), {
      depth: d,
      bevelEnabled: true,
      bevelSize: 0.0015,
      bevelThickness: 0.001,
      bevelSegments: 2,
      steps: 1,
    }),
    m,
  );
  o.position.z = -d / 2;
  return o;
}
export function canvasTexture(w, h, paint) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d"), w, h);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
export function textured(map, roughness = 0.6, extra = {}) {
  const key = map.uuid + roughness + JSON.stringify(extra);
  if (!surfaceCache.has(key))
    surfaceCache.set(
      key,
      new T.MeshStandardMaterial({
        map,
        color: "#ffffff",
        roughness,
        ...extra,
      }),
    );
  return surfaceCache.get(key);
}
export function plane(
  p,
  w,
  h,
  map,
  x,
  y,
  z,
  crop = [0, 0, 1, 1],
  roughness = 0.7,
) {
  const g = new T.PlaneGeometry(w, h),
    uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++)
    uv.setXY(
      i,
      crop[0] + uv.getX(i) * crop[2],
      1 - crop[1] - crop[3] + uv.getY(i) * crop[3],
    );
  return mesh(p, g, textured(map, roughness, { side: T.DoubleSide }), x, y, z);
}
export function imageCover(ctx, img, x, y, w, h) {
  const sw = img.width,
    sh = img.height,
    k = Math.max(w / sw, h / sh);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(
    img,
    x + (w - sw * k) / 2,
    y + (h - sh * k) / 2,
    sw * k,
    sh * k,
  );
  ctx.restore();
}
export function printTexture(
  photo,
  title = "",
  color = "#f5f0e5",
  vertical = false,
) {
  return canvasTexture(
    vertical ? 600 : 840,
    vertical ? 840 : 600,
    (c, w, h) => {
      c.fillStyle = color;
      c.fillRect(0, 0, w, h);
      imageCover(c, photo.image, 28, 28, w - 56, h - 94);
      c.fillStyle = "#3d453c";
      c.font = "14px Georgia";
      c.textAlign = "center";
      c.fillText(title, w / 2, h - 33);
    },
  );
}
export function label(text, bg = "#f2ecd9", fg = "#303b30", w = 512, h = 128) {
  const k = [text, bg, fg, w, h].join();
  if (labelCache.has(k)) return labelCache.get(k);
  const result = canvasTexture(w, h, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.fillStyle = fg;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = `${Math.min(36, w / (text.length * 0.8))}px Georgia`;
    c.fillText(text, w / 2, h / 2);
  });
  labelCache.set(k, result);
  return result;
}
export function woodTexture() {
  let seed = 884;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const t = canvasTexture(256, 1024, (c) => {
    c.fillStyle = "#c7a16b";
    c.fillRect(0, 0, 256, 1024);
    for (let i = 0; i < 1700; i++) {
      const x = rand() * 256,
        a = rand() * 0.16;
      c.strokeStyle = `rgba(${rand() > 0.5 ? "66,40,14" : "245,214,160"},${a})`;
      c.lineWidth = 0.2 + rand() * 1.8;
      c.beginPath();
      c.moveTo(x, 0);
      for (let y = 0; y <= 1024; y += 16)
        c.lineTo(x + Math.sin(y * 0.014 + i * 0.14) * (2 + Math.sin(i) * 2), y);
      c.stroke();
    }
  });
  t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
export function stripeTexture(colors) {
  return canvasTexture(512, 512, (c) => {
    colors.forEach((v, i) => {
      c.fillStyle = v;
      c.fillRect((i * 512) / colors.length, 0, 512 / colors.length + 1, 512);
    });
  });
}
export const cream = mat("#f5efe0", 0.27),
  navy = mat("#163743", 0.3),
  gold = mat("#b89c59", 0.25, 0.65),
  silver = mat("#ccd0cc", 0.22, 0.85);
