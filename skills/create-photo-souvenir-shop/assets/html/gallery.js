import * as T from "./assets/three.module.js";
import { box, plane, mat, tube, cream, postcardBack } from "./materials.js";
import { PERSONAL_CATALOG, buildPersonal } from "./personal.js";
import { CRAFT_CATALOG, buildCraft } from "./sculpted-crafts.js";
import { BOOK_CATALOG, BOOK_TYPE, buildTripBook } from "./trip-book.js";
import { COLLECTION } from "./collection.js";
import {
  buildRoom,
  buildFixture,
  fixtureCollider,
  seededRandom,
} from "./fixtures.js";
import { decorateShop } from "./custom-shop.js";
export const CATALOG = {
  ...PERSONAL_CATALOG,
  ...CRAFT_CATALOG,
  ...BOOK_CATALOG,
};
for (const [i, a] of COLLECTION.artworks.entries())
  CATALOG["card-" + i] = {
    name: a.title,
    category: a.style,
    material: "印刷纸",
    description: a.scene,
    zone: "纸品",
    tripRelated: true,
    sourcePhoto: a.photo,
    artwork: a.src,
    artIndex: i,
  };
for (let i = 0; i < 16; i++) {
  const a = COLLECTION.artworks[i % COLLECTION.artworks.length];
  CATALOG["mobile-" + i] = {
    name: a.title + " · 纸饰",
    category: "悬挂纸饰",
    material: "纸 · 细线",
    description: a.scene,
    zone: "悬挂",
    tripRelated: true,
    sourcePhoto: COLLECTION.ornaments?.photos[i] || a.photo,
    artIndex: i % COLLECTION.artworks.length,
  };
}
export function buildShop(textures) {
  const room = new T.Group(),
    objects = [],
    colliders = [],
    mobiles = [],
    personal = [],
    postcardWall = [],
    crafted = [];
  const scene = COLLECTION.scene,
    fixtures = new Map(),
    random = seededRandom(scene.seed);
  buildRoom(room, scene.room);
  for (const f of scene.fixtures) {
    fixtures.set(f.id, buildFixture(room, f, textures, COLLECTION));
    const c = fixtureCollider(f);
    if (c) colliders.push(c);
  }
  for (const [i, p] of scene.placements.entries()) {
    const g = new T.Group(),
      definition = CATALOG[p.type];
    if (!definition) throw new Error("Unknown product " + p.type);
    g.name = p.type;
    g.userData = { id: "gift-" + i, type: p.type, definition };
    (p.fixture ? fixtures.get(p.fixture) : room).add(g);
    g.position.set(...p.at);
    g.rotation.set(...(p.rotation || [0, 0, 0]));
    g.scale.setScalar(p.scale || 1);
    // Optional shelf-level irregularity is repeatable, bounded and never moves fixtures/aisles.
    if (p.variation) g.rotation.y += (random() - 0.5) * p.variation;
    objects.push(g);
    if (p.type === BOOK_TYPE) {
      buildTripBook(g, textures);
      personal.push(g);
    } else if (p.type.startsWith("memory-")) {
      buildPersonal(g, p.type, textures);
      personal.push(g);
    } else if (p.type.startsWith("craft-")) {
      buildCraft(g, p.type);
      personal.push(g);
      crafted.push(g);
    } else if (p.type.startsWith("card-")) {
      const tex = textures["art-" + definition.artIndex],
        ratio = tex.image.width / tex.image.height;
      const w = Math.min(0.38, 0.255 * ratio),
        h = w / ratio;
      box(g, w + 0.012, h + 0.012, 0.004, 0, h / 2, 0, cream);
      plane(g, w, h, tex, 0, h / 2, 0.0025);
      postcardBack(g, w, h, h / 2, -0.0026, definition.name);
      if (p.wall) postcardWall.push(g);
    } else if (p.type.startsWith("mobile-")) {
      let tex = textures["art-" + definition.artIndex];
      if (textures.mobiles) {
        const index = Number(p.type.slice(7));
        tex = textures.mobiles.clone();
        tex.repeat.set(0.25, 0.25);
        tex.offset.set(
          (index % 4) * 0.25,
          1 - (Math.floor(index / 4) + 1) * 0.25,
        );
        tex.needsUpdate = true;
      }
      const cutout = plane(g, 0.24, 0.28, tex, 0, -0.14, 0);
      cutout.material = cutout.material.clone();
      cutout.material.alphaTest = 0.45;
      if (p.drop)
        tube(
          g,
          [
            [0, 0, 0],
            [0, p.drop, 0],
          ],
          0.001,
          mat(scene.room.trim),
        );
      g.userData.restY = g.rotation.y;
      g.userData.restZ = g.rotation.z;
      mobiles.push(g);
    }
  }
  decorateShop({ room, colliders, fixtures, textures, collection: COLLECTION });
  room.updateMatrixWorld(true);
  return {
    room,
    objects,
    colliders,
    mobiles,
    personal,
    postcardWall,
    crafted,
    tripRelated: objects.filter((o) => o.userData.definition.tripRelated),
  };
}
