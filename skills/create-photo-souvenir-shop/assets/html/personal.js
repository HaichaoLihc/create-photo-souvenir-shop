import * as T from "./assets/three.module.js";
import {
  box,
  cyl,
  ring,
  tube,
  rounded,
  plane,
  mat,
  mesh,
  textured,
  cream,
  silver,
} from "./materials.js";
import { COLLECTION } from "./collection.js";
import { TRIP_ART } from "./trip-art.js";
import { makeMug } from "./mug.js";
export { makeMug } from "./mug.js";
export const FAMILIES = [
  "postcards",
  "magnet",
  "keychain",
  "desk-mat",
  "mug",
  "coasters",
  "tote",
  "pins",
  "stickers",
  "journal",
];
export const PERSONAL_CATALOG = Object.fromEntries(
  COLLECTION.gifts.map((gift) => {
    const artIndex = TRIP_ART.findIndex((a) => a.id === gift.artwork);
    const art = TRIP_ART[artIndex];
    return [
      "memory-" + gift.kind,
      {
        ...gift,
        slug: gift.kind,
        category: gift.category || gift.kind,
        personal: true,
        tripRelated: true,
        zone: "个人纪念品",
        artIndex,
        sourcePhoto: art.photo,
        prototype: art.src,
        number: FAMILIES.indexOf(gift.kind) + 1,
      },
    ];
  }),
);
export const PERSONAL_TYPES = Object.keys(PERSONAL_CATALOG);
function panel(p, tex, w, h, z, y = h / 2) {
  // Fit the print, never stretch a person's face to match the product.
  const aspect = tex.image.width / tex.image.height;
  const width = Math.min(w, h * aspect);
  return plane(p, width, width / aspect, tex, 0, y, z);
}
function silhouette(p, def, w, h, depth, material) {
  if (!def.outline) return rounded(p, w, h, depth, 0.025, material);
  const shape = new T.Shape();
  def.outline.forEach(([x, y], i) =>
    i ? shape.lineTo((x - 0.5) * w, y * h) : shape.moveTo((x - 0.5) * w, y * h),
  );
  shape.closePath();
  return mesh(
    p,
    new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 3,
    }),
    material,
    0,
    0,
    -depth / 2,
  );
}
export function buildPersonal(g, type, textures) {
  const d = PERSONAL_CATALOG[type],
    tex = textures["art-" + d.artIndex];
  const accent = mat(d.color || COLLECTION.palette[0], 0.28);
  if (d.slug === "mug") {
    makeMug(g, cream, accent, tex);
  } else if (d.slug === "postcards") {
    for (let i = 0; i < 3; i++) {
      const card = new T.Group();
      g.add(card);
      card.position.set((i - 1) * 0.085, i === 1 ? 0.055 : 0, -0.009 * i);
      card.rotation.z = (i - 1) * -0.13;
      box(card, 0.18, 0.27, 0.004, 0, 0.135, 0, cream);
      panel(
        card,
        textures["art-" + ((d.artIndex + i) % TRIP_ART.length)],
        0.164,
        0.244,
        0.0025,
        0.135,
      );
    }
  } else if (d.slug === "magnet") {
    silhouette(g, d, 0.27, 0.23, 0.018, accent);
    panel(g, tex, 0.22, 0.185, 0.011, 0.115);
    for (const x of [-0.07, 0.07]) {
      const disc = cyl(
        g,
        0.025,
        0.025,
        0.007,
        x,
        0.105,
        -0.014,
        mat("#343c39", 0.4, 0.7),
      );
      disc.rotation.x = Math.PI / 2;
    }
  } else if (d.slug === "keychain") {
    silhouette(g, d, 0.15, 0.17, 0.013, accent);
    panel(g, tex, 0.125, 0.139, 0.008, 0.085);
    ring(g, 0.031, 0.0036, 0, 0.267, 0, silver, false);
    for (let i = 0; i < 4; i++) {
      const link = ring(
        g,
        0.009,
        0.002,
        0,
        0.184 + i * 0.016,
        0,
        silver,
        false,
      );
      link.rotation.y = ((i % 2) * Math.PI) / 2;
    }
    ring(g, 0.009, 0.002, 0, 0.167, 0, silver, false);
  } else if (d.slug === "desk-mat" || d.slug === "stickers") {
    const w = d.slug === "desk-mat" ? 0.43 : 0.22,
      h = d.slug === "desk-mat" ? 0.26 : 0.29;
    rounded(g, w, h, 0.006, 0.015, d.slug === "desk-mat" ? accent : cream);
    if (d.slug === "stickers") {
      for (let i = 0; i < 4; i++) {
        const sticker = new T.Group();
        g.add(sticker);
        sticker.position.set(
          ((i % 2) - 0.5) * 0.1,
          0.026 + Math.floor(i / 2) * 0.137,
          0.006,
        );
        rounded(sticker, 0.083, 0.112, 0.001, 0.013, cream);
        panel(
          sticker,
          textures["art-" + ((d.artIndex + i) % TRIP_ART.length)],
          0.073,
          0.101,
          0.002,
          0.056,
        );
      }
    } else panel(g, tex, w - 0.016, h - 0.016, 0.004, h / 2);
  } else if (d.slug === "coasters") {
    for (let i = 0; i < 4; i++) {
      const coaster = new T.Group();
      g.add(coaster);
      coaster.position.set(
        ((i % 2) - 0.5) * 0.125,
        Math.floor(i / 2) * 0.009,
        (Math.floor(i / 2) - 0.5) * 0.06,
      );
      cyl(coaster, 0.063, 0.063, 0.006, 0, 0.004, 0, mat("#b49b72", 0.96));
      const disc = mesh(
        coaster,
        new T.CircleGeometry(0.061, 48),
        textured(textures["art-" + ((d.artIndex + i) % TRIP_ART.length)], 0.65),
        0,
        0.008,
        0,
      );
      disc.rotation.x = -Math.PI / 2;
    }
  } else if (d.slug === "tote") {
    rounded(g, 0.34, 0.39, 0.05, 0.025, mat("#e2d7bb", 0.96));
    for (const z of [-0.023, 0.023])
      tube(
        g,
        [
          [-0.12, 0.37, z],
          [-0.105, 0.56, z],
          [0.105, 0.56, z],
          [0.12, 0.37, z],
        ],
        0.014,
        cream,
      );
    panel(g, tex, 0.285, 0.325, 0.027, 0.2);
  } else if (d.slug === "pins") {
    silhouette(g, d, 0.14, 0.15, 0.009, accent);
    panel(g, tex, 0.115, 0.126, 0.006, 0.075);
    tube(
      g,
      [
        [-0.045, 0.078, -0.015],
        [0.048, 0.078, -0.015],
      ],
      0.002,
      silver,
    );
    box(g, 0.012, 0.018, 0.017, -0.047, 0.078, -0.012, silver);
    ring(g, 0.007, 0.002, 0.045, 0.078, -0.016, silver, false);
  } else if (d.slug === "journal") {
    box(g, 0.235, 0.305, 0.029, 0, 0.1525, 0, accent);
    box(g, 0.219, 0.287, 0.022, 0.004, 0.1525, 0, cream);
    panel(g, tex, 0.216, 0.286, 0.016, 0.1525);
    box(g, 0.019, 0.306, 0.033, -0.109, 0.153, 0, accent);
    for (let i = 0; i < 10; i++)
      box(
        g,
        0.001,
        0.28,
        0.0005,
        0.114,
        0.153,
        -0.01 + i * 0.002,
        mat("#bbae95", 0.9),
      );
  }
}
