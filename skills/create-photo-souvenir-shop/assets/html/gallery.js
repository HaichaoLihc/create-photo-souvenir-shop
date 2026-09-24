import * as T from "./assets/three.module.js";
import {
  mat,
  mesh,
  box,
  sphere,
  cyl,
  ring,
  tube,
  lathe,
  rounded,
  plane,
  canvasTexture,
  woodTexture,
  stripeTexture,
  textured,
  label,
  cream,
  gold,
  silver,
} from "./materials.js";
import {
  PERSONAL_CATALOG,
  PERSONAL_TYPES,
  buildPersonal,
  makeMug,
} from "./personal.js";
import { CRAFT_CATALOG, CRAFT_TYPES, buildCraft } from "./sculpted-crafts.js";
import { BOOK_CATALOG, BOOK_TYPE, buildTripBook } from "./trip-book.js";
import {
  TRIP_ART,
  MOBILE_SOURCE_IDS,
  MOBILE_TITLES,
  artUrl,
  postcardOrder,
} from "./trip-art.js";
import { COLLECTION } from "./collection.js";
export const CATALOG = {
  ...PERSONAL_CATALOG,
  ...CRAFT_CATALOG,
  ...BOOK_CATALOG,
};
const PRINTED_TYPES = new Set([
  "book",
  "box",
  "tin",
  "candle",
  "mug",
  "espresso",
]);
const colors = [
  "#e9ad27",
  "#e36b65",
  "#257b72",
  "#df93ae",
  "#2853a4",
  "#efdf9d",
  "#679355",
  "#cf582f",
];
const names = [
  "金盏黄",
  "珊瑚红",
  "孔雀绿",
  "玫瑰粉",
  "湖泊蓝",
  "奶油白",
  "草叶绿",
  "柿子橙",
];
const extras = [
  [
    "stripe-vase",
    "条纹耳朵花瓶",
    "彩釉陶瓷",
    "像阳光一样明亮的黄白条纹，两侧带着小小的环形把手。",
  ],
  [
    "wave-vase",
    "波浪花器",
    "彩釉陶瓷",
    "一圈一圈起伏的轮廓，摆一枝花也很好看。",
  ],
  [
    "flower-dish",
    "煎蛋花朵碟",
    "釉面陶瓷",
    "奶油色的花瓣围住一颗明亮的黄心，像花，也像一枚荷包蛋。",
  ],
  [
    "cabbage",
    "卷心菜小碗",
    "浮雕陶瓷",
    "绿色叶片卷成一只小碗，边缘带着轻轻的起伏。",
  ],
  [
    "candle",
    "花纹烛台",
    "陶瓷 · 蜡",
    "彩色印花包住小小的烛台，放在桌角就有一点节日的气息。",
  ],
  [
    "mug",
    "彩色条纹杯",
    "釉面陶瓷",
    "带着厚厚圆杯柄的条纹杯。内壁和外侧用不同颜色上釉。",
  ],
  [
    "espresso",
    "掌心浓缩杯",
    "釉面陶瓷",
    "小小一杯咖啡的尺寸，圆润的杯口和饱满的色彩。",
  ],
  [
    "mushroom",
    "小蘑菇",
    "彩绘木作",
    "一颗带斑点的小蘑菇，留给书架上的空位置。",
  ],
  ["bird", "桌边小鸟", "彩釉陶瓷", "圆肚子、小翅膀，抬头站在木底座上。"],
  [
    "candleholder",
    "弯弯烛台",
    "釉面陶瓷",
    "两根彩色烛台弯出不同的弧度，细长蜡烛向上生长。",
  ],
  ["book", "花与日常", "印刷纸 · 布面", "把植物和颜色收进一本小书里。"],
  ["box", "纸上花园", "印花纸盒", "花鸟图案的礼盒，盒盖与侧边保留不同的配色。"],
  [
    "tin",
    "小小收藏罐",
    "彩绘金属",
    "圆角铁罐，可以装下别针、票根和细碎的小记忆。",
  ],
  [
    "boot",
    "花园靴花瓶",
    "彩釉陶瓷",
    "一只珊瑚红的小雨靴，也是一只插花的花器。",
  ],
];
for (const [key, name, material, description] of extras)
  CATALOG[key] = {
    name,
    category: "店里的小物",
    material,
    description,
    zone: "彩色杂货",
    expanded: true,
  };
for (const [key, def] of Object.entries(CATALOG))
  if (PRINTED_TYPES.has(key)) def.tripRelated = true;
for (let i = 0; i < TRIP_ART.length; i++)
  CATALOG["card-" + i] = {
    name: TRIP_ART[i].title + " · 旅行明信片",
    category: TRIP_ART[i].style || "旅途版画",
    material: "棉纸 · " + (TRIP_ART[i].style || "水粉版画"),
    description:
      "来自你的照片：" +
      TRIP_ART[i].scene +
      "。以" +
      (TRIP_ART[i].style || "水粉版画") +
      "重新创作，留住画面里的旅途细节。",
    zone: "旅行明信片墙",
    tripRelated: true,
    sourcePhoto: TRIP_ART[i].photo,
    artwork: artUrl(i),
    artIndex: i,
  };
for (let i = 0; i < 16; i++)
  CATALOG["mobile-" + i] = {
    name: MOBILE_TITLES[i] + " · 记忆纸饰",
    category: "挂在空中的旅途",
    material: "彩印纸雕 · 细线",
    description: "从照片提取形状与颜色，变成悬挂纸饰。拿近后可以对照来源。",
    zone: "天花板",
    tripRelated: true,
    sourcePhoto: MOBILE_SOURCE_IDS[i],
  };
CATALOG.banner = {
  name: "风里的记忆 · 挂旗",
  category: "挂在空中的旅途",
  material: "印花卡纸 · 细线",
  description: "来自收藏中的照片。用纸张、线条和色彩做成悬挂版画。",
  zone: "天花板",
  tripRelated: true,
  sourcePhoto: TRIP_ART[10 % TRIP_ART.length].photo,
  artwork: artUrl(10),
};
export function buildShop(textures) {
  const room = new T.Group(),
    objects = [],
    colliders = [],
    mobiles = [],
    personal = [],
    postcardWall = [],
    crafted = [];
  let serial = 0;
  const woodmap = woodTexture(),
    wood = textured(woodmap, 0.63),
    edge = mat("#c19d63", 0.68),
    dark = mat("#303c33", 0.96),
    wall = mat("#3b4438", 0.94),
    white = mat("#e9e6db", 0.77),
    ink = mat("#263a32");
  const patterns = colors.map((c, i) =>
    stripeTexture([c, "#f2ead8", c, "#f2ead8", colors[(i + 2) % 8], "#f2ead8"]),
  );
  const cardMats = new Map(),
    mobileMats = new Map();
  function imageMaterial(i, transparent = false) {
    const index = transparent ? i : i % TRIP_ART.length,
      cache = transparent ? mobileMats : cardMats;
    if (!cache.has(index)) {
      let tex;
      if (transparent && textures.mobiles) {
        tex = textures.mobiles.clone();
        tex.repeat.set(0.25, 0.25);
        tex.offset.set(
          (index % 4) * 0.25,
          1 - (Math.floor(index / 4) + 1) * 0.25,
        );
        tex.needsUpdate = true;
      } else tex = textures["art-" + (index % TRIP_ART.length)];
      cache.set(
        index,
        textured(tex, transparent ? 0.86 : 0.7, {
          side: T.DoubleSide,
          ...(transparent ? { alphaTest: 0.45, transparent: false } : {}),
        }),
      );
    }
    return cache.get(index);
  }
  function art(p, w, h, i, x = 0, y = 0, z = 0, transparent = false) {
    if (!transparent || !textures.mobiles) {
      const img = textures["art-" + (i % TRIP_ART.length)].image,
        ratio = img.width / img.height;
      const width = Math.min(w, h * ratio);
      h = width / ratio;
      w = width;
    }
    return mesh(
      p,
      new T.PlaneGeometry(w, h),
      imageMaterial(i, transparent),
      x,
      y,
      z,
    );
  }
  function object(
    type,
    x,
    y,
    z,
    scale = 1,
    rot = 0,
    parent = room,
    variant = 0,
  ) {
    const g = new T.Group();
    g.name = type;
    const definition = PRINTED_TYPES.has(type)
      ? {
          ...CATALOG[type],
          name:
            TRIP_ART[variant % TRIP_ART.length].title +
            " · " +
            CATALOG[type].name,
          sourcePhoto: TRIP_ART[variant % TRIP_ART.length].photo,
          artwork: artUrl(variant % TRIP_ART.length),
          artIndex: variant % TRIP_ART.length,
          description:
            "来自你的照片：" +
            TRIP_ART[variant % TRIP_ART.length].scene +
            "。以" +
            (TRIP_ART[variant % TRIP_ART.length].style || "水粉版画") +
            "印在这件小物上。",
        }
      : CATALOG[type];
    g.userData = { id: "gift-" + ++serial, type, definition };
    g.position.set(x, y, z);
    g.rotation.y = rot;
    g.scale.setScalar(scale);
    parent.add(g);
    objects.push(g);
    const col = colors[variant % 8],
      glaze = mat(col, 0.24);
    if (type === BOOK_TYPE) {
      buildTripBook(g, textures);
      personal.push(g);
      return g;
    }
    if (type.startsWith("craft-")) {
      buildCraft(g, type);
      personal.push(g);
      crafted.push(g);
      return g;
    }
    if (type.startsWith("memory-")) {
      buildPersonal(g, type, textures);
      personal.push(g);
      return g;
    }
    if (type.startsWith("card-")) {
      const i = Number(type.slice(5));
      box(g, 0.17, 0.255, 0.005, 0, 0.1275, 0, cream);
      art(g, 0.149, 0.248, i, 0, 0.1275, 0.0027);
      const back = plane(
        g,
        0.155,
        0.22,
        label("FOR YOU", "#f4efdf", "#617259", 256, 384),
        0,
        0.1175,
        -0.0028,
      );
      back.rotation.y = Math.PI;
    } else if (type.startsWith("mobile-")) {
      const i = Number(type.slice(7));
      art(g, 0.4, 0.4, i, 0, -0.2, 0, true);
    } else if (type === "banner") {
      box(g, 0.26, 0.012, 0.004, 0, -0.012, 0, glaze);
      for (let i = 0; i < 5; i++)
        for (let j = 0; j < 8; j++) {
          const xx = (i - 2) * 0.052,
            yy = -0.047 - j * 0.045;
          box(
            g,
            0.018,
            0.027,
            0.003,
            xx,
            yy,
            0,
            mat(colors[(i + j + variant) % 8], 0.9),
          );
          box(g, 0.052, 0.004, 0.003, xx, yy - 0.019, 0, glaze);
        }
      for (let i = 0; i < 6; i++)
        box(g, 0.004, 0.39, 0.003, (i - 2.5) * 0.052, -0.2, 0, glaze);
      for (let i = 0; i < 5; i++) {
        const s = mesh(
          g,
          new T.ConeGeometry(0.022, 0.055, 3),
          glaze,
          (i - 2) * 0.052,
          -0.42,
          0,
        );
        s.rotation.z = Math.PI;
      }
      art(g, 0.225, 0.369, 10, 0, -0.201, 0.005);
    } else if (type === "stripe-vase") {
      const body = textured(patterns[variant % 8], 0.26);
      lathe(
        g,
        [
          [0.08, 0],
          [0.097, 0.015],
          [0.115, 0.09],
          [0.11, 0.3],
          [0.085, 0.41],
          [0.091, 0.43],
          [0.083, 0.44],
          [0.075, 0.414],
          [0.095, 0.3],
          [0.095, 0.09],
          [0.06, 0.02],
        ],
        body,
      );
      for (const s of [-1, 1]) {
        const r = ring(g, 0.065, 0.012, s * 0.113, 0.285, 0, glaze, false);
        r.scale.set(0.65, 1, 1);
      }
      ring(g, 0.086, 0.005, 0, 0.435, 0, glaze);
    } else if (type === "wave-vase") {
      const pts = [];
      for (let j = 0; j <= 24; j++) {
        const y = j * 0.015;
        pts.push([0.08 + Math.sin(j * 0.85) * 0.013, y]);
      }
      pts.push([0.062, 0.36], [0.06, 0.03], [0.01, 0.03]);
      lathe(g, pts, glaze);
      ring(g, 0.07, 0.007, 0, 0.36, 0, cream);
    } else if (type === "flower-dish") {
      const s = new T.Shape();
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2,
          r = 0.123 + Math.cos(a * 6) * 0.018,
          x = Math.cos(a) * r,
          y = Math.sin(a) * r;
        i ? s.lineTo(x, y) : s.moveTo(x, y);
      }
      const o = mesh(
        g,
        new T.ExtrudeGeometry(s, {
          depth: 0.009,
          bevelEnabled: true,
          bevelSize: 0.005,
          bevelThickness: 0.005,
          bevelSegments: 3,
        }),
        cream,
      );
      o.rotation.x = -Math.PI / 2;
      o.position.y = 0.016;
      sphere(g, 0.055, 0.027, 0.053, 0, 0.043, 0, mat("#edbd29", 0.17));
    } else if (type === "cabbage") {
      lathe(
        g,
        [
          [0.035, 0],
          [0.07, 0.01],
          [0.11, 0.045],
          [0.13, 0.1],
          [0.124, 0.111],
          [0.106, 0.092],
          [0.057, 0.028],
          [0.005, 0.026],
        ],
        mat("#81a94b", 0.27),
      );
      for (let j = 0; j < 9; j++) {
        const a = (j * Math.PI * 2) / 9,
          l = sphere(
            g,
            0.048,
            0.014,
            0.086,
            Math.cos(a) * 0.068,
            0.075,
            Math.sin(a) * 0.068,
            mat(j % 2 ? "#a1bc64" : "#8aad55", 0.25),
          );
        l.rotation.set(Math.cos(a) * 0.5, -a, Math.sin(a) * 0.5);
      }
    } else if (type === "mug" || type === "espresso") {
      makeMug(
        g,
        variant % 2 ? textured(patterns[variant % 8], 0.24) : cream,
        glaze,
        textures["art-" + (variant % TRIP_ART.length)],
      );
      if (type === "espresso") g.scale.multiplyScalar(0.62);
    } else if (type === "candle") {
      const tex = textures["art-" + (variant % TRIP_ART.length)];
      cyl(g, 0.07, 0.065, 0.155, 0, 0.078, 0, cream);
      mesh(
        g,
        new T.CylinderGeometry(0.0705, 0.066, 0.139, 40, 1, true, -0.66, 1.32),
        textured(tex, 0.38),
        0,
        0.082,
        0,
      );
      ring(g, 0.066, 0.004, 0, 0.157, 0, cream);
      cyl(g, 0.063, 0.063, 0.006, 0, 0.151, 0, mat("#ece4d2"));
      cyl(g, 0.0017, 0.0017, 0.012, 0, 0.159, 0, ink, 6);
    } else if (type === "mushroom") {
      lathe(
        g,
        [
          [0.035, 0],
          [0.044, 0.009],
          [0.035, 0.05],
          [0.027, 0.13],
        ],
        cream,
      );
      const cap = mesh(
        g,
        new T.SphereGeometry(0.089, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2),
        glaze,
        0,
        0.105,
        0,
      );
      cap.scale.y = 0.65;
      for (let j = 0; j < 11; j++) {
        const a = j * 2.399,
          r = 0.018 + 0.058 * (j / 11),
          yy = 0.105 + Math.sqrt(0.089 ** 2 - r ** 2) * 0.65;
        sphere(
          g,
          0.01,
          0.002,
          0.011,
          Math.cos(a) * r,
          yy + 0.001,
          Math.sin(a) * r,
          cream,
        );
      }
    } else if (type === "bird") {
      sphere(g, 0.086, 0.059, 0.047, 0, 0.11, 0, glaze);
      sphere(g, 0.041, 0.043, 0.037, -0.056, 0.17, 0, glaze);
      for (const s of [-1, 1]) {
        sphere(g, 0.037, 0.029, 0.009, 0.014, 0.132, s * 0.043, cream);
        sphere(g, 0.005, 0.005, 0.003, -0.072, 0.18, s * 0.032, ink);
        tube(
          g,
          [
            [s * 0.028, 0.077, 0],
            [s * 0.028, 0.013, 0],
            [s * 0.045, 0.008, 0.02],
          ],
          0.004,
          gold,
        );
      }
      const beak = mesh(
        g,
        new T.ConeGeometry(0.015, 0.04, 4),
        gold,
        -0.109,
        0.168,
        0,
      );
      beak.rotation.z = Math.PI / 2;
      const tail = mesh(
        g,
        new T.ConeGeometry(0.031, 0.086, 3),
        glaze,
        0.09,
        0.134,
        0,
      );
      tail.rotation.z = -1.04;
    } else if (type === "candleholder") {
      lathe(
        g,
        [
          [0.073, 0],
          [0.082, 0.014],
          [0.056, 0.038],
          [0.017, 0.052],
        ],
        glaze,
      );
      tube(
        g,
        [
          [0, 0.043, 0],
          [-0.026, 0.11, 0],
          [0.015, 0.21, 0],
          [-0.01, 0.27, 0],
        ],
        0.025,
        glaze,
      );
      cyl(g, 0.035, 0.032, 0.035, -0.01, 0.278, 0, glaze);
      cyl(
        g,
        0.012,
        0.012,
        0.23,
        -0.01,
        0.402,
        0,
        mat(colors[(variant + 3) % 8], 0.55),
      );
    } else if (type === "book" || type === "box" || type === "tin") {
      const w = type === "book" ? 0.24 : 0.22,
        h = type === "book" ? 0.31 : 0.22,
        d = type === "book" ? 0.035 : type === "tin" ? 0.05 : 0.15;
      box(g, w, h, d, 0, h / 2, 0, glaze);
      art(
        g,
        w - 0.012,
        h - 0.012,
        variant % TRIP_ART.length,
        0,
        h / 2,
        d / 2 + 0.0006,
      );
      if (type === "book") {
        box(g, w - 0.008, h - 0.017, d * 0.64, 0.002, h / 2, 0, cream);
        box(g, 0.013, h, d, -w / 2 + 0.005, h / 2, 0, glaze);
        for (let j = 0; j < 12; j++)
          box(
            g,
            0.001,
            h - 0.025,
            0.0005,
            w / 2 - 0.003,
            h / 2,
            -0.01 + j * 0.002,
            mat("#c2b79d"),
          );
      }
      if (type === "tin")
        for (const y of [0.002, h - 0.002])
          box(g, w + 0.004, 0.003, d + 0.004, 0, y, 0, silver);
    } else if (type === "boot") {
      sphere(g, 0.068, 0.037, 0.13, 0, 0.04, 0.035, glaze);
      lathe(
        g,
        [
          [0.047, 0.023],
          [0.061, 0.04],
          [0.059, 0.21],
          [0.062, 0.23],
          [0.048, 0.23],
          [0.045, 0.065],
        ],
        glaze,
      );
      ring(g, 0.056, 0.007, 0, 0.225, 0, cream);
      box(g, 0.12, 0.012, 0.24, 0, 0.008, 0.04, mat("#2c4240"));
    }
    return g;
  }
  function collision(x, z, w, d) {
    colliders.push({ x, z, w, d });
  }
  function wb(p, w, h, d, x, y, z) {
    return box(p, w, h, d, x, y, z, wood);
  }
  function tag(p, x, y, z, text = "little things", w = 0.13) {
    plane(p, w, 0.028, label(text, "#ece8db", "#6a705a", 512, 112), x, y, z);
  }
  function sign(text, x, y, z, w = 0.55) {
    return plane(
      room,
      w,
      0.085,
      label(text, "#263a33", "#ebe9d2", 800, 120),
      x,
      y,
      z,
    );
  }
  function table(x, z, w, d, h) {
    wb(room, w, 0.047, d, x, h, z);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const leg = wb(
          room,
          0.048,
          h,
          0.055,
          x + sx * (w / 2 - 0.09),
          h / 2,
          z + sz * (d / 2 - 0.085),
        );
        leg.rotation.z = -sx * 0.048;
      }
    wb(room, w - 0.1, 0.032, d - 0.1, x, 0.2, z);
    collision(x, z, w, d);
  }
  function cardRack(p, w, h, d = 0.22) {
    for (const x of [-w / 2, w / 2]) wb(p, 0.032, h, 0.04, x, h / 2, -0.06);
    for (let row = 0; row < 5; row++) {
      const y = 0.23 + row * 0.28;
      wb(p, w, 0.028, d, 0, y, 0);
      wb(p, w, 0.045, 0.016, 0, y + 0.018, d / 2);
      for (let c = 0; c < Math.floor(w / 0.187); c++) {
        const g = object(
          "card-" + ((21 + row * 17 + c * 29) % TRIP_ART.length),
          -w / 2 + 0.108 + c * 0.187,
          y + 0.015,
          0.01,
          0.9,
          0,
          p,
        );
        g.rotation.x = -0.17;
      }
    }
  }
  // Long, narrow room matching the reference: dark walls, pale ceiling, wood underfoot.
  box(room, 5.9, 0.1, 11.6, 0, -0.075, 0, mat("#574431"));
  const floorMats = Array.from({ length: 9 }, (_, i) => {
    const m = textured(woodmap, 0.58);
    m.color.set(
      [
        "#976d43",
        "#a7794d",
        "#ad8358",
        "#967049",
        "#b38b5b",
        "#9d754d",
        "#b48d61",
        "#b48e67",
        "#9e774f",
      ][i],
    );
    return m;
  });
  const floor = new T.Group();
  floor.rotation.y = 0.4;
  room.add(floor);
  for (let row = -30; row <= 30; row++)
    for (let col = -5; col <= 5; col++) {
      const x = col * 1.13 + (row % 2) * 0.56,
        z = row * 0.18;
      const wx = Math.cos(0.4) * x + Math.sin(0.4) * z,
        wz = -Math.sin(0.4) * x + Math.cos(0.4) * z;
      if (Math.abs(wx) > 3.3 || Math.abs(wz) > 6) continue;
      box(
        floor,
        1.125,
        0.018,
        0.177,
        x,
        -0.011,
        z,
        floorMats[Math.abs(row * 7 + col * 3) % 9],
      );
    }
  for (const x of [-2.91, 2.91]) {
    box(room, 0.12, 3.28, 11.5, x, 1.62, 0, wall);
    box(room, 0.025, 0.12, 11.4, x + (x < 0 ? 0.065 : -0.065), 0.06, 0, dark);
  }
  box(room, 5.9, 3.28, 0.12, 0, 1.62, -5.73, wall);
  box(room, 5.9, 0.08, 11.6, 0, 3.3, 0, mat("#d9dcda", 0.96));
  // Back window, softly blue daylight, fine painted mullions.
  box(room, 2.0, 1.61, 0.026, -0.79, 1.61, -5.645, mat("#b8d7d6", 0.7));
  const win = mesh(
    room,
    new T.PlaneGeometry(1.93, 1.54),
    new T.MeshBasicMaterial({ color: "#9ecacf" }),
    -0.79,
    1.61,
    -5.624,
  );
  win.castShadow = false;
  for (let n = 0; n < 10; n++)
    box(
      room,
      0.012,
      1.53,
      0.017,
      -1.69 + n * 0.201,
      1.61,
      -5.596,
      mat("#708e85"),
    );
  for (const x of [-1.82, 0.24])
    box(room, 0.06, 1.77, 0.09, x, 1.6, -5.57, white);
  for (const y of [0.745, 1.64, 2.49])
    box(room, 2.13, 0.052, 0.11, -0.79, y, -5.57, white);
  // Every face on the postcard wall is a different artwork. Larger cards leave room to see the prints.
  const right = new T.Group();
  right.position.set(2.71, 0, -0.2);
  right.rotation.y = -Math.PI / 2;
  room.add(right);
  box(right, 9.8, 2.2, 0.055, 0, 1.32, -0.1, dark);
  const wallOrder = postcardOrder(),
    columns = Math.min(25, Math.ceil(wallOrder.length / 4));
  for (let row = 0; row < 4; row++) {
    const y = 0.815 + row * 0.393;
    wb(right, 9.8, 0.031, 0.26, 0, y, 0);
    wb(right, 9.8, 0.026, 0.016, 0, y + 0.012, 0.132);
    for (let col = 0; col < columns; col++) {
      const slot = row * columns + col,
        id = wallOrder[slot];
      if (id === undefined) continue;
      const g = object(
        "card-" + id,
        -4.644 + (col + 0.5) * (9.288 / columns),
        y + 0.018,
        0.014,
        1.35 + (col % 3) * 0.025,
        0,
        right,
      );
      g.rotation.x = -0.13;
      g.rotation.z = (((slot * 7) % 5) - 2) * 0.01;
      g.userData.wallSlot = slot;
      postcardWall.push(g);
    }
    if (row === 0)
      for (let j = 0; j < 8; j++)
        tag(
          right,
          -4.35 + j * 1.24,
          y - 0.03,
          0.143,
          [
            "FIELD NOTES",
            "COLOUR STUDIES",
            "COLLECTED MOMENTS",
            "PAPER JOURNEYS",
          ][j % 4],
          0.25,
        );
  }
  wb(right, 9.86, 0.04, 0.42, 0, 2.4, 0);
  for (let i = 0; i < 27; i++) {
    const type = ["wave-vase", "stripe-vase", "book", "box"][i % 4];
    object(
      type,
      -4.6 + i * 0.35,
      2.42,
      0.01,
      0.58,
      0,
      right,
      (i * 7 + 22) % TRIP_ART.length,
    );
  }
  // Pale cabinetry and a lower counter along the card wall.
  for (let i = 0; i < 5; i++) {
    const z = -4.2 + i * 1.96;
    box(room, 0.53, 0.65, 1.9, 2.52, 0.325, z, white);
    wb(room, 0.68, 0.05, 1.95, 2.46, 0.69, z);
    for (let k = 0; k < 2; k++) {
      box(
        room,
        0.018,
        0.58,
        0.92,
        2.245,
        0.335,
        z + (k - 0.5) * 0.95,
        mat("#e2e2d4"),
      );
      box(
        room,
        0.024,
        0.15,
        0.012,
        2.229,
        0.43,
        z + (k - 0.5) * 0.95 + 0.3,
        mat("#767c68", 0.3, 0.4),
      );
    }
    collision(2.53, z, 0.6, 1.94);
  }
  for (let i = 0; i < 31; i++) {
    const typ = [
      "espresso",
      "cabbage",
      "boot",
      "mushroom",
      "candleholder",
      "bird",
      "flower-dish",
    ][i % 7];
    object(typ, 2.33, 0.72, 4.5 - i * 0.3, 0.67, -Math.PI / 2, room, i % 8);
  }
  // Left side, deep olive shelving and a rhythm of wood compartments.
  const left = new T.Group();
  left.position.set(-2.69, 0, -0.1);
  left.rotation.y = Math.PI / 2;
  room.add(left);
  box(left, 9.95, 2.54, 0.05, 0, 1.4, -0.11, dark);
  for (let i = 0; i < 7; i++) {
    wb(left, 0.035, 2.57, 0.36, -4.88 + i * 1.62, 1.36, 0.035);
  }
  for (const y of [0.16, 0.7, 1.25, 1.84, 2.42])
    wb(left, 9.8, 0.035, 0.38, 0, y, 0.04);
  for (let row = 0; row < 4; row++)
    for (let i = 0; i < 31; i++) {
      const type = [
        "box",
        "mug",
        "candle",
        "book",
        "mushroom",
        "tin",
        "wave-vase",
        "bird",
      ][(i + row * 3) % 8];
      const x =
        row === 2 && i >= 5 && i <= 9
          ? [-3.11, -2.88, -2.65, -2.015, -1.79][i - 5]
          : -4.7 + i * 0.307;
      object(
        type,
        x,
        [0.18, 0.72, 1.27, 1.86][row],
        0.07,
        [0.82, 0.83, 0.88, 0.78][row],
        ((i % 3) - 1) * 0.1,
        left,
        (i * 13 + row * 29 + 21) % TRIP_ART.length,
      );
    }
  // Make room among the left-shelf books, with the original cover facing the aisle.
  if (COLLECTION.book) {
    object(BOOK_TYPE, -2.32, 1.2675, 0.1, 1, 0, left);
    tag(left, -2.32, 1.222, 0.234, COLLECTION.book.name + " · 点击翻阅", 0.4);
  }
  collision(-2.68, -0.1, 0.46, 10.1);
  // Round wall mirror and glazed entrance complete the reverse view.
  const mirror = new T.MeshPhysicalMaterial({
    color: "#b4cbc1",
    metalness: 1,
    roughness: 0.07,
  });
  const lookingGlass = mesh(
    room,
    new T.CircleGeometry(0.31, 64),
    mirror,
    -2.435,
    1.67,
    3.86,
  );
  lookingGlass.rotation.y = Math.PI / 2;
  const mirrorRim = ring(room, 0.324, 0.025, -2.432, 1.67, 3.86, gold, false);
  mirrorRim.rotation.y = Math.PI / 2;
  const entranceMat = new T.MeshStandardMaterial({
    color: "#c4d6ce",
    roughness: 0.25,
    metalness: 0.2,
  });
  for (const x of [-1.82, 1.82]) {
    box(room, 1.52, 2.8, 0.03, x, 1.46, 5.72, entranceMat);
    for (const dx of [-0.78, 0.78])
      box(room, 0.038, 2.98, 0.09, x + dx, 1.49, 5.68, ink);
    box(room, 1.59, 0.055, 0.08, x, 0.2, 5.68, ink);
    box(room, 1.59, 0.055, 0.08, x, 3.0, 5.68, ink);
  }
  box(room, 1.1, 2.73, 0.032, 0, 1.45, 5.72, entranceMat);
  for (const x of [-0.58, 0.58])
    box(room, 0.06, 2.96, 0.095, x, 1.48, 5.67, ink);
  box(room, 1.2, 0.07, 0.095, 0, 2.98, 5.67, ink);
  tube(
    room,
    [
      [0.38, 1.15, 5.61],
      [0.38, 1.52, 5.61],
    ],
    0.014,
    gold,
  );
  // The two height wooden display tables in the exact foreground rhythm.
  table(0.48, 2.75, 1.63, 1.18, 0.73);
  table(0.55, 1.27, 1.65, 1.73, 1.01);
  // Open riser and tall peg rack with hanging cups across the top.
  wb(room, 1.31, 0.034, 0.47, 0.57, 1.4, 0.83);
  for (const x of [0.005, 1.13]) wb(room, 0.045, 0.38, 0.41, x, 1.205, 0.83);
  for (const x of [-0.31, 1.38]) wb(room, 0.045, 1.3, 0.046, x, 1.7, 0.42);
  const rod = cyl(room, 0.024, 0.024, 1.86, 0.54, 2.31, 0.42, wood);
  rod.rotation.z = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const x = -0.22 + i * 0.219;
    tube(
      room,
      [
        [x, 2.33, 0.41],
        [x, 2.28, 0.42],
        [x, 2.26, 0.51],
      ],
      0.0027,
      gold,
    );
    const cup = object("mug", x, 2.067, 0.44, 0.83, 0, room, i);
    cup.rotation.x = -0.96;
    cup.rotation.z = ((i % 3) - 1) * 0.09;
  }
  // A brass-and-oak cabinet for the twelve sculptural travel objects, at the entrance.
  if (CRAFT_TYPES.length) {
    const craftStand = new T.Group();
    craftStand.name = "travel-craft-display";
    craftStand.position.set(-1.95, 0, 3.64);
    craftStand.rotation.y = Math.PI / 2;
    room.add(craftStand);
    wb(craftStand, 1.23, 0.035, 0.4, 0, 0.727, 0.04);
    wb(craftStand, 1.23, 0.035, 0.4, 0, 0.19, 0.04);
    for (const x of [-0.588, 0.588]) {
      wb(craftStand, 0.035, 2.17, 0.04, x, 1.085, -0.13);
      wb(craftStand, 0.035, 0.71, 0.038, x, 0.355, 0.2);
    }
    box(craftStand, 1.17, 1.39, 0.02, 0, 1.47, -0.155, mat("#a9ae8e", 0.91));
    for (const x of [-0.558, 0.558])
      box(craftStand, 0.007, 1.38, 0.008, x, 1.47, -0.14, gold);
    for (const y of [1.105, 1.385, 1.635]) {
      wb(craftStand, 1.19, 0.016, 0.125, 0, y, -0.066);
      box(craftStand, 1.19, 0.007, 0.008, 0, y + 0.006, 0.001, gold);
    }
    plane(
      craftStand,
      0.91,
      0.06,
      label("OBJECTS OF A JOURNEY", "#a9ae8e", "#374333", 1024, 100),
      0,
      2.115,
      -0.137,
    );
    const craftX = [-0.39, 0, 0.39];
    const craftColumns = {};
    for (let i = 0; i < CRAFT_TYPES.length; i++) {
      const type = CRAFT_TYPES[i],
        kind = CRAFT_CATALOG[type].kind,
        col = craftColumns[kind] || 0;
      craftColumns[kind] = col + 1;
      const y =
        kind === "keychain"
          ? 1.67
          : kind === "mug"
            ? 0.75
            : kind === "magnet"
              ? 1.12
              : 1.401;
      const scale =
        kind === "keychain"
          ? 0.9
          : kind === "mug"
            ? 0.97
            : kind === "magnet"
              ? 0.94
              : 0.97;
      const g = object(
        type,
        craftX[col],
        y,
        kind === "mug" ? 0.076 : kind === "magnet" ? -0.111 : -0.06,
        scale,
        kind === "mug" ? (col - 1) * 0.14 : 0,
        craftStand,
      );
      if (kind === "mug" || kind === "magnet") {
        g.updateWorldMatrix(true, true);
        const bottom = new T.Box3().setFromObject(g).min.y;
        g.position.y += (kind === "mug" ? 0.7445 : 1.113) - bottom;
      }
      if (kind === "pin") {
        box(
          craftStand,
          0.265,
          0.219,
          0.006,
          craftX[col],
          1.5025,
          -0.098,
          cream,
        );
        plane(
          craftStand,
          0.211,
          0.026,
          label(CRAFT_CATALOG[type].name, "#f5efe0", "#65785a", 512, 80),
          craftX[col],
          1.593,
          -0.094,
        );
      }
      if (kind === "keychain") {
        const top = [0.328, 0.359, 0.331][col] * scale;
        tube(
          craftStand,
          [
            [craftX[col], y + top, -0.14],
            [craftX[col], y + top, 0.008],
            [craftX[col], y + top + 0.012, 0.018],
          ],
          0.003,
          gold,
        );
      }
    }
    tag(craftStand, 0, 0.704, 0.244, "LITTLE MEMORIES", 0.47);
    collision(-1.94, 3.64, 0.51, 1.27);
  }
  // Reference centerpiece: yellow-striped handled vase, branches, flower plate.
  object("stripe-vase", 0.91, 1.04, 1.65, 1.04, 0, room, 0);
  const plate = object("flower-dish", 0.4, 1.11, 1.99, 1.2);
  plate.rotation.x = 1.19;
  const leaves = mat("#547a55", 0.64),
    leafLight = mat("#7b996b", 0.71),
    branch = mat("#65744a", 0.78);
  for (let n = 0; n < 6; n++) {
    const bx = 0.91,
      bz = 1.65,
      angle = n * 2.39;
    const top = [
      bx + Math.sin(angle) * 0.35,
      2.15 + (n % 3) * 0.095,
      bz + Math.cos(angle) * 0.24,
    ];
    tube(
      room,
      [
        [bx, 1.42, bz],
        [bx + Math.sin(angle) * 0.12, 1.8, bz + Math.cos(angle) * 0.1],
        top,
      ],
      0.006,
      branch,
    );
    for (let j = 0; j < 5; j++) {
      const t = 0.36 + j * 0.14,
        l = sphere(
          room,
          0.085,
          0.01,
          0.051,
          bx + (top[0] - bx) * t,
          1.42 + (top[1] - 1.42) * t,
          bz + (top[2] - bz) * t,
          j % 2 ? leaves : leafLight,
        );
      l.rotation.set(0.35 + j * 0.2, angle + j * 0.9, 0.2);
    }
  }
  object("box", 0.24, 1.045, 0.78, 1.38, 0, room, 13);
  object("box", 0.74, 1.047, 0.9, 1.03, 0, room, 7);
  object("wave-vase", 1.08, 1.44, 0.85, 0.65, 0, room, 3);
  object("stripe-vase", 0.69, 1.44, 0.84, 0.62, 0, room, 2);
  object("candleholder", 0.02, 1.04, 1.45, 0.85, 0, room, 1);
  // Travel collection integrated among the objects, with originals accessible from the collection tray.
  const memoryPlacement = [
    [-0.055, 0.762, 2.82, 1.14, 0],
    [0.39, 0.764, 2.83, 1.15, -0.08],
    [1.01, 1.05, 1.17, 1.2, 0.18],
    [0.1, 1.045, 1.53, 1.04, 0],
    [0.98, 0.766, 2.59, 1.12, 0],
    [0.99, 0.769, 3.0, 1.05, 0],
    [-1.35, 1.05, -1.65, 1.24, Math.PI / 2],
    [-0.1, 1.045, 0.93, 1.12, 0],
    [0.23, 0.765, 3.1, 1.15, 0],
    [0.67, 0.761, 2.34, 1.22, -0.1],
  ];
  PERSONAL_TYPES.forEach((t, i) => {
    const [x, y, z, s, r] = memoryPlacement[PERSONAL_CATALOG[t].number - 1],
      o = object(t, x, y, z, s, r);
    const slot = PERSONAL_CATALOG[t].number - 1;
    if (slot === 3 || slot === 8) o.rotation.x = -Math.PI / 2;
    if (slot === 5) o.rotation.y = 0.15;
  });
  // An oak peg supports the tote at its handle height.
  cyl(room, 0.022, 0.032, 1.84, -1.66, 0.92, -1.65, wood, 20);
  cyl(room, 0.19, 0.22, 0.032, -1.66, 0.016, -1.65, wood, 32);
  const totePeg = cyl(room, 0.014, 0.014, 0.43, -1.48, 1.79, -1.65, wood, 16);
  totePeg.rotation.z = Math.PI / 2;
  colliders.push({ x: -1.66, z: -1.65, r: 0.19 });
  // Foreground packaging and smaller repeated items from the reference.
  for (let i = 0; i < 6; i++) {
    object(
      "candle",
      -0.11 + (i % 3) * 0.24,
      0.762 + Math.floor(i / 3) * 0.165,
      2.4,
      0.95,
      0,
      room,
      i + 3,
    );
  }
  const egg = object("flower-dish", 0.59, 0.79, 3.26, 1.2);
  egg.rotation.x = 1.2;
  for (let i = 0; i < 5; i++) {
    object(
      "box",
      -0.09 + (i % 3) * 0.49,
      0.22,
      2.64 + Math.floor(i / 3) * 0.33,
      1.62,
      0,
      room,
      i * 2 + 1,
    );
  }
  for (let i = 0; i < 5; i++)
    object(
      "box",
      -0.06 + (i % 3) * 0.48,
      0.22,
      1.3 + Math.floor(i / 3) * 0.4,
      1.45,
      0,
      room,
      i + 8,
    );
  // Easels in the left aisle, behind the foreground passage.
  for (let i = 0; i < 3; i++) {
    const x = -1.04,
      z = 0.5 - i * 0.72;
    for (const s of [-1, 1]) {
      const a = wb(room, 0.035, 1.49, 0.034, x + s * 0.28, 0.74, z);
      a.rotation.z = -s * 0.12;
      a.rotation.x = -0.09;
    }
    wb(room, 0.69, 0.032, 0.14, x, 0.95, z + 0.08);
    const strut = wb(room, 0.031, 1.15, 0.03, x, 0.57, z - 0.3);
    strut.rotation.x = 0.4;
    const pic = new T.Group();
    pic.position.set(x, 0.98, z + 0.01);
    pic.rotation.x = -0.1;
    room.add(pic);
    wb(pic, 0.58, 0.41, 0.026, 0, 0.205, 0);
    art(pic, 0.52, 0.35, [1, 6, 15][i], 0, 0.205, 0.015);
    collision(x, z, 0.66, 0.5);
  }
  // Back area: more densely filled cabinetry and a narrow return counter.
  for (let i = 0; i < 3; i++) {
    const x = 0.77 + i * 0.66;
    wb(room, 0.61, 2.17, 0.06, x, 1.2, -5.5);
    for (const y of [0.23, 0.74, 1.28, 1.85, 2.31])
      wb(room, 0.65, 0.028, 0.43, x, y, -5.31);
    for (let row = 0; row < 4; row++)
      for (let c = 0; c < 3; c++)
        object(
          ["box", "mug", "bird", "candle"][row],
          x - 0.2 + c * 0.2,
          [0.25, 0.76, 1.3, 1.87][row],
          -5.29,
          0.69,
          0,
          room,
          (31 + i * 17 + c * 23 + row * 11) % TRIP_ART.length,
        );
    collision(x, -5.32, 0.65, 0.43);
  }
  table(-0.87, -4.64, 1.59, 0.76, 0.79);
  for (let i = 0; i < 5; i++)
    object(
      ["stripe-vase", "bird", "candle", "wave-vase", "mushroom"][i],
      -1.46 + i * 0.29,
      0.817,
      -4.65,
      0.86,
      0,
      room,
      i + 2,
    );
  // Small freestanding stationery rack; clean left aisle remains walkable.
  const stand = new T.Group();
  stand.position.set(-1.62, 0, -2.14);
  stand.rotation.y = Math.PI / 2;
  room.add(stand);
  cardRack(stand, 0.7, 1.7);
  collision(-1.62, -2.14, 0.31, 0.76);
  sign("FIELD NOTES · 旅途系列", 0.5, 0.665, 3.35, 0.75);
  // White ceiling tracks and warm spotlights in staggered rows.
  const lightMat = new T.MeshBasicMaterial({ color: "#fff2cf" });
  for (const x of [-1.85, 1.8]) {
    box(room, 0.05, 0.032, 11.25, x, 3.238, 0, white);
    for (let i = 0; i < 7; i++) {
      const z = 4.55 - i * 1.47;
      cyl(room, 0.018, 0.018, 0.1, x, 3.174, z, white, 12);
      const bulb = new T.Group();
      bulb.position.set(x, 3.065, z);
      bulb.rotation.z = x > 0 ? 0.25 : -0.25;
      room.add(bulb);
      cyl(bulb, 0.048, 0.048, 0.14, 0, 0, 0, white, 24);
      cyl(bulb, 0.043, 0.043, 0.003, 0, -0.072, 0, lightMat, 24);
    }
  }
  // Multiple layers of hanging paper, spanning the entire room rather than a single garland.
  const threadMat = mat("#8b9286", 0.8);
  for (let row = 0; row < 12; row++) {
    const z = 4.78 - row * 0.88;
    const points = [];
    for (let i = 0; i <= 12; i++)
      points.push([
        -2.67 + (i * 5.34) / 12,
        3.1 - 0.1 * Math.sin((i / 12) * Math.PI),
        z,
      ]);
    tube(room, points, 0.0011, threadMat);
    for (let j = 0; j < 9; j++) {
      const x = -2.45 + j * 0.605 + Math.sin(row * 2.1 + j) * 0.1;
      const top = 3.1 - 0.1 * Math.sin(((x + 2.67) / 5.34) * Math.PI),
        drop = 0.1 + ((row * 5 + j * 3) % 7) * 0.034,
        y = top - drop;
      const type =
          (row + j * 3) % 9 === 0
            ? "banner"
            : "mobile-" + ((row * 7 + j * 3) % 16),
        s = type === "banner" ? 1.03 : 0.73 + ((row * 3 + j) % 4) * 0.18;
      const o = object(
        type,
        x,
        y,
        z,
        s,
        (j * 1.19 + row * 0.81) % Math.PI,
        room,
        row % 8,
      );
      tube(
        room,
        [
          [x, top, z],
          [x, y, z],
        ],
        0.00065,
        threadMat,
      );
      o.userData.restY = o.rotation.y;
      o.userData.restZ = ((j % 3) - 1) * 0.11;
      o.rotation.z = o.userData.restZ;
      mobiles.push(o);
    }
  }
  // A lower festoon towards the back, with small round medallions.
  for (let j = 0; j < 12; j++) {
    const x = -2.4 + j * 0.432,
      y = 2.67 - Math.sin((j / 11) * Math.PI) * 0.22;
    const o = object(
      "mobile-" + [9, 8, 13, 11][j % 4],
      x,
      y,
      -3.78,
      0.4,
      j * 0.41,
    );
    mobiles.push(o);
    o.userData.restY = o.rotation.y;
    o.userData.restZ = 0;
  }
  room.updateMatrixWorld(true);
  const tripRelated = objects.filter(
    (o) => o.userData.definition.tripRelated || o.userData.definition.personal,
  );
  return {
    room,
    objects,
    colliders,
    mobiles,
    personal,
    tripRelated,
    postcardWall,
    crafted,
  };
}
