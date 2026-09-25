// Served only by render_review.mjs. Render the site's actual geometry and textures.
import * as T from "/assets/three.module.js";
import { COLLECTION as c } from "/collection.js";
import { TEXTURE_SOURCES } from "/texture-sources.js";
import { buildShop } from "/gallery.js";
import { createShopEnvironment, lightShop } from "/lighting.js";
const renderer = new T.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
document.body.append(renderer.domElement);
const textures = {},
  loader = new T.TextureLoader();
await Promise.all(
  TEXTURE_SOURCES.map(async ([key, url]) => {
    const t = await loader.loadAsync("/" + url.replace(/^\.\//, ""));
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 8;
    textures[key] = t;
  }),
);
const shop = buildShop(textures),
  environment = createShopEnvironment(renderer);
const world = new T.Scene();
world.background = new T.Color(c.scene.room.ceiling);
world.environment = environment.texture;
world.environmentIntensity = c.scene.lighting?.environment ?? 0.39;
world.add(shop.room);
lightShop(world);
const studio = new T.Scene();
studio.background = new T.Color("#eeeae2");
studio.environment = environment.texture;
studio.environmentIntensity = 0.65;
studio.add(new T.HemisphereLight("#fffaf0", "#79777a", 1));
for (const [position, power] of [
  [[2, 3, 4], 3],
  [[-3, 1, -2], 1.3],
]) {
  const l = new T.DirectionalLight("#fff4e8", power);
  l.position.set(...position);
  studio.add(l);
}
const unique = new Map(shop.objects.map((o) => [o.userData.type, o]));
const camera = new T.PerspectiveCamera(48, 1, 0.01, 100);
let active;
const clayMaterial = new T.MeshStandardMaterial({
  color: "#b3afa7",
  roughness: 0.65,
});
function frame(scene, width, height, pos, target, exposure) {
  renderer.setSize(width, height);
  renderer.toneMappingExposure = exposure;
  camera.aspect = width / height;
  camera.position.set(...pos);
  camera.lookAt(...target);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL("image/png");
}
function product(type) {
  if (active) studio.remove(active);
  active = unique.get(type).clone(true);
  active.position.set(0, 0, 0);
  active.rotation.set(0, 0, 0);
  active.scale.setScalar(1);
  active.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(active),
    center = bounds.getCenter(new T.Vector3()),
    size = bounds.getSize(new T.Vector3());
  const scale = 1.65 / Math.max(size.x, size.y, size.z);
  active.position.copy(center.multiplyScalar(-scale));
  active.scale.setScalar(scale);
  studio.add(active);
  active.updateMatrixWorld(true);
  return { size: size.toArray() };
}
const flatFamilies = new Set(["plate", "dish", "coaster", "tablecloth"]);
async function fingerprint() {
  const points = new Set(),
    v = new T.Vector3();
  let triangles = 0,
    meshes = 0;
  active.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const p = o.geometry.attributes.position;
    triangles += (o.geometry.index?.count ?? p.count) / 3;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      points.add(
        v
          .toArray()
          .map((x) => Math.round(x * 10000))
          .join(","),
      );
    }
  });
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode([...points].sort().join(";")),
  );
  return {
    geometryHash: [...new Uint8Array(bytes)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join(""),
    triangles,
    meshes,
  };
}
window.review = {
  list() {
    return [...unique].map(([type, o]) => ({
      type,
      name: o.userData.definition.name,
      family:
        o.userData.definition.family ||
        o.userData.definition.kind ||
        "postcard",
      sourcePhoto: o.userData.definition.sourcePhoto,
    }));
  },
  async measure(type) {
    const m = product(type);
    return { ...m, ...(await fingerprint()) };
  },
  product(type, view) {
    product(type);
    const d = unique.get(type).userData.definition;
    const flat =
      flatFamilies.has(d.family) ||
      ["coasters", "bowl", "tray", "desk-mat"].includes(d.kind);
    if (view === "clay")
      active.traverse((o) => {
        if (o.isMesh) o.material = clayMaterial;
      });
    const pos =
      view === "front"
        ? flat
          ? [0, 3, 0.001]
          : [0, 0, 3]
        : view === "back"
          ? flat
            ? [0, -3, 0.001]
            : [0, 0, -3]
          : [2, 1.7, 3];
    return frame(studio, 480, 420, pos, [0, 0, 0], 1.05);
  },
  scene(key) {
    const v = c.scene.views[key];
    return frame(
      world,
      1440,
      1000,
      v.pos,
      v.target,
      c.scene.lighting?.exposure ?? 1.03,
    );
  },
  async sheet(tiles) {
    const canvas = document.createElement("canvas");
    canvas.width = 1440;
    canvas.height = Math.ceil(tiles.length / 3) * 340;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#eeeae2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < tiles.length; i++) {
      const img = new Image();
      img.src = tiles[i].src;
      await img.decode();
      const x = (i % 3) * 480,
        y = Math.floor(i / 3) * 340;
      ctx.drawImage(img, x + 40, y, 400, 290);
      ctx.fillStyle = "#303736";
      ctx.font = "15px sans-serif";
      ctx.fillText(tiles[i].label.slice(0, 56), x + 20, y + 316);
    }
    return canvas.toDataURL("image/png");
  },
};
window.reviewReady = true;
