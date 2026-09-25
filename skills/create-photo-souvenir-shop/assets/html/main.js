import * as THREE from "./assets/three.module.js";
import { buildShop, CATALOG } from "./gallery.js";
import { optimize } from "./optimize.js";
import {
  instanceRepeatedItems,
  instanceOwner,
  showItem,
  prepareInspectionClone,
} from "./instances.js";
import { createShopEnvironment, lightShop } from "./lighting.js";
import { ZONES, positionAllowed } from "./navigation.js";
import { TRIP_ART, sourceUrl } from "./trip-art.js";
import { TEXTURE_SOURCES } from "./texture-sources.js";
import { SETTINGS } from "./settings.js";
import { createBookReader } from "./book-reader.js";

import { COLLECTION } from "./collection.js";
const $ = (id) => document.getElementById(id);
document.title = COLLECTION.title;
document.querySelector("h1").textContent = COLLECTION.title;
document.querySelector(".loading-mark").textContent = COLLECTION.title;
for (const button of document.querySelectorAll("[data-zone]")) {
  const zone = ZONES[button.dataset.zone];
  button.hidden = !zone;
  if (zone) button.textContent = zone.label || zone.title;
}
document.querySelector(".brand p").textContent =
  COLLECTION.scene.subtitle || "PHOTO SOUVENIRS";
document.querySelector(".place .eyebrow").textContent =
  COLLECTION.scene.subtitle || "COLLECTED MOMENTS";
$("reference-btn").hidden = !COLLECTION.reference;
if (COLLECTION.reference) $("reference-image").src = COLLECTION.reference;
const canvas = $("world");
const dialogs = [...document.querySelectorAll("dialog")];
const keys = new Set(),
  pointer = new THREE.Vector2(0, 0),
  ray = new THREE.Raycaster();
let world,
  camera,
  renderer,
  inspectRenderer,
  inspectScene,
  inspectCamera,
  held = null,
  heldClone = null,
  hovered = null,
  outline,
  previousTime = 0,
  lastPick = 0;
let yaw = -0.167,
  pitch = 0.073,
  drag = null,
  moved = false,
  joystick = { x: 0, y: 0 },
  touchMoveId = null,
  transition = null,
  inspecting = false,
  lookPointers = new Map(),
  pinchDistance = 0,
  zoom = 1;
const inspectOrbit = { yaw: 0.36, pitch: 0.16 };
let objects = [],
  colliders = [],
  objectById = new Map(),
  lastFocused = null;
let toastTimer;
let environmentTarget, shopSun;
let mobiles = [],
  personalObjects = [];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let pickSignature = "";
const toast = (message) => {
  $("toast").textContent = message;
  $("toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 2500);
};
function isModal() {
  return dialogs.some((d) => d.open);
}
function setCamera() {
  camera.rotation.set(pitch, yaw, 0, "YXZ");
}
function clearKeys() {
  keys.clear();
  joystick = { x: 0, y: 0 };
  $("stick").style.transform = "";
  drag = null;
}
async function init() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, SETTINGS.maxPixelRatio));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = COLLECTION.scene.lighting?.exposure ?? 1.03;
    world = new THREE.Scene();
    world.background = new THREE.Color(COLLECTION.scene.room.wall);
    world.fog = new THREE.Fog(COLLECTION.scene.room.wall, 24, 48);
    camera = new THREE.PerspectiveCamera(
      62,
      innerWidth / innerHeight,
      0.04,
      40,
    );
    const entry = ZONES.overview;
    camera.position.set(...entry.pos);
    const direction = new THREE.Vector3(...entry.target).sub(camera.position);
    yaw = Math.atan2(-direction.x, -direction.z);
    pitch = Math.atan2(direction.y, Math.hypot(direction.x, direction.z));
    $("place-title").textContent = entry.title;
    $("place-copy").textContent = entry.copy;
    setCamera();
    const sources = TEXTURE_SOURCES;
    const loader = new THREE.TextureLoader();
    const textures = {};
    let loaded = 0;
    await Promise.all(
      sources.map(async ([key, path]) => {
        textures[key] = await loader.loadAsync(path);
        textures[key].colorSpace = THREE.SRGBColorSpace;
        if (key.startsWith("art-"))
          textures[key].userData.tripArtwork =
            TRIP_ART[Number(key.slice(4))].photo;
        if (key === "mobiles") textures[key].userData.tripOrnaments = true;
        textures[key].anisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy(),
        );
        $("load-bar").style.width = `${(++loaded / sources.length) * 75}%`;
      }),
    );
    $("load-status").textContent = "把每一件小物摆回原位…";
    await new Promise((resolve) => setTimeout(resolve, 20));
    const shop = buildShop(textures);
    objects = shop.objects;
    colliders = shop.colliders;
    mobiles = shop.mobiles;
    personalObjects = shop.personal;
    objectById = new Map(objects.map((o) => [o.userData.id, o]));
    optimize(shop.room, objects);
    const batching = instanceRepeatedItems(shop.room, objects);
    world.add(shop.room);
    environmentTarget = createShopEnvironment(renderer);
    world.environment = environmentTarget.texture;
    world.environmentIntensity = COLLECTION.scene.lighting?.environment ?? 0.39;
    shopSun = lightShop(world);
    outline = new THREE.Box3Helper(
      new THREE.Box3(),
      new THREE.Color("#fff3bc"),
    );
    outline.material.transparent = true;
    outline.material.opacity = 0.72;
    outline.visible = false;
    world.add(outline);
    setupInspector();
    setupCollection();
    resize();
    $("load-bar").style.width = "100%";
    renderer.render(world, camera);
    shopSun.shadow.autoUpdate = false;
    $("loading").classList.add("done");
    setTimeout(() => ($("loading").hidden = true), 700);
    document.body.dataset.ready = "true";
    window.shopStatus = {
      objects: objects.length,
      types: Object.keys(CATALOG).length,
      sourceImages: sources.length,
      personalTypes: personalObjects.length,
      sculptedObjects: shop.crafted.length,
      hangingObjects: mobiles.length,
      tripRelatedObjects: shop.tripRelated.length,
      tripRelatedPercent: Math.round(
        (shop.tripRelated.length / objects.length) * 100,
      ),
      artworks: TRIP_ART.length,
      postcardWall: shop.postcardWall.length,
      uniqueWallArtworks: new Set(
        shop.postcardWall.map((o) => o.userData.definition.artIndex),
      ).size,
      ...batching,
    };
    requestAnimationFrame(animate);
  } catch (err) {
    console.error("Shop initialization failed", err);
    $("load-status").textContent =
      "店门暂时没有打开。请使用支持 WebGL 2 的浏览器并重新载入。";
    const retry = document.createElement("button");
    retry.className = "primary-button";
    retry.style.width = "180px";
    retry.textContent = "重新载入";
    retry.onclick = () => location.reload();
    $("loading").append(retry);
  }
}
function setupInspector() {
  inspectRenderer = new THREE.WebGLRenderer({
    canvas: $("object-view"),
    antialias: true,
    alpha: true,
  });
  inspectRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  inspectRenderer.setClearColor(0x000000, 0);
  inspectRenderer.outputColorSpace = THREE.SRGBColorSpace;
  inspectRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  inspectRenderer.toneMappingExposure = 1.12;
  inspectScene = new THREE.Scene();
  inspectScene.environment = environmentTarget.texture;
  inspectScene.environmentIntensity = 0.58;
  inspectCamera = new THREE.PerspectiveCamera(
    36,
    innerWidth / innerHeight,
    0.01,
    50,
  );
  inspectCamera.position.set(0, 0, 3.2);
  inspectScene.add(new THREE.HemisphereLight("#fff2db", "#997c5c", 2.15));
  const key = new THREE.DirectionalLight("#ffe2b6", 3);
  key.position.set(-2, 4, 5);
  inspectScene.add(key);
  const rim = new THREE.DirectionalLight("#ffe9c8", 1.8);
  rim.position.set(3, 2, -2);
  inspectScene.add(rim);
}
function resize() {
  if (!renderer) return;
  const w = innerWidth,
    h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (inspectRenderer) {
    inspectRenderer.setSize(w, h, false);
    inspectCamera.aspect = w / h;
    inspectCamera.updateProjectionMatrix();
    if (heldClone) positionInspection();
  }
}
addEventListener("resize", resize);
function owner(o) {
  let p = o;
  while (p) {
    if (objectById.has(p.userData.id)) return p;
    p = p.parent;
  }
  return null;
}
function pick(p = pointer) {
  if (!camera) return null;
  ray.setFromCamera(p, camera);
  const hits = ray.intersectObject(world, true);
  for (const hit of hits) {
    if (!hit.object.isMesh || hit.object === outline) continue;
    const material = hit.object.material;
    if (material.transparent && material.opacity < 0.5) continue;
    const o = instanceOwner(hit) || owner(hit.object);
    if (o && !o.visible) continue;
    if (hit.object.material.alphaTest > 0 && hit.uv) {
      const map = hit.object.material.map;
      if (map?.image) {
        const uv = hit.uv.clone();
        map.transformUv(uv);
        if (!map.userData.alpha) {
          const c = document.createElement("canvas");
          c.width = map.image.width;
          c.height = map.image.height;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(map.image, 0, 0);
          map.userData.alpha = ctx.getImageData(0, 0, c.width, c.height);
        }
        const data = map.userData.alpha;
        const x = Math.min(
            data.width - 1,
            Math.max(0, Math.floor(uv.x * data.width)),
          ),
          y = Math.min(
            data.height - 1,
            Math.max(0, Math.floor(uv.y * data.height)),
          );
        if (data.data[(y * data.width + x) * 4 + 3] < 100) continue;
      }
    }
    if (o) return o;
    return null;
  }
  return null;
}
function updateHover() {
  const obj = pick();
  hovered = obj;
  if (obj) {
    outline.box.setFromObject(obj);
    outline.visible = true;
    $("target-name").textContent = obj.userData.definition.name;
    $("target-action").textContent = obj.userData.definition.reader
      ? "点击翻阅 · E"
      : "点击拿起 · E";
    $("target").hidden = false;
    canvas.style.cursor = obj.userData.definition.reader ? "pointer" : "grab";
  } else {
    outline.visible = false;
    $("target").hidden = true;
    canvas.style.cursor = drag ? "grabbing" : "default";
  }
}
function positionInspection() {
  if (!heldClone) return;
  const mobile = innerWidth < 700;
  heldClone.position.x = mobile ? 0 : -0.46;
  heldClone.position.y = mobile ? 0.27 : 0;
  heldClone.scale.setScalar(zoom);
  inspectCamera.position.z = mobile ? 4.5 : 3.2;
}
function hasInspectableBack(d) {
  return (
    [
      "keychain",
      "magnet",
      "pin",
      "pins",
      "postcard",
      "postcards",
      "wall-art",
      "print",
      "notebook",
      "journal",
    ].includes(d.family || d.kind) ||
    (d.sculpted && d.kind !== "mug")
  );
}
function inspect(obj) {
  if (!obj || inspecting || !inspectScene) return;
  if (obj.userData.definition.reader) {
    openBookReader(obj);
    return;
  }
  if ($("collection").open) $("collection").close();
  held = obj;
  showItem(held, false);
  hovered = null;
  outline.visible = false;
  $("target").hidden = true;
  clearKeys();
  transition = null;
  const def = obj.userData.definition;
  const clone = prepareInspectionClone(obj.clone(true));
  clone.visible = true;
  clone.position.set(0, 0, 0);
  clone.rotation.set(0, 0, 0);
  clone.scale.setScalar(1);
  clone.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(clone);
  const center = bounds.getCenter(new THREE.Vector3()),
    size = bounds.getSize(new THREE.Vector3());
  clone.position.sub(center);
  const normalization = 1.25 / Math.max(size.x, size.y, size.z);
  const pivot = new THREE.Group();
  const normal = new THREE.Group();
  normal.scale.setScalar(normalization);
  normal.add(clone);
  pivot.add(normal);
  heldClone = pivot;
  inspectOrbit.yaw = 0.3;
  inspectOrbit.pitch = 0.12;
  zoom = 1;
  inspectScene.add(pivot);
  positionInspection();
  $("object-title").textContent = def.name;
  $("object-category").textContent = def.category;
  $("object-description").textContent = def.description;
  $("object-zone").textContent = def.zone;
  $("object-material").textContent = def.material;
  $("inspect-bottom-view").textContent = hasInspectableBack(def)
    ? "看背面"
    : "看底部";
  const related = !!(def.tripRelated || def.personal),
    sourcePanel = document.querySelector(".source-preview");
  sourcePanel.hidden = !related;
  $("object-origin").textContent = def.sculpted
    ? "照片里的记忆 → 立体造物"
    : def.personal
      ? "旅途原作 · " + String(def.number).padStart(2, "0")
      : related
        ? "你的照片 → " + (TRIP_ART[def.artIndex]?.style || "旅行插画")
        : "店铺精选";
  $("object-origin").classList.toggle("expanded", !related);
  $("object-detail-note").textContent = def.sculpted
    ? "从照片提炼造型、颜色与细节。拖动查看侧面和背面。"
    : related
      ? "内容来自你提供的旅行照片，可与下方原照对照。"
      : "作为店铺风格搭配的陶器与小摆件。";
  if (related && def.sourcePhoto) {
    $("object-source").style.backgroundImage =
      `url('${sourceUrl(def.sourcePhoto)}')`;
    $("object-source").style.backgroundSize = "contain";
    $("object-source").style.backgroundPosition = "center";
  }
  if (shopSun) shopSun.shadow.needsUpdate = true;
  lastFocused = document.activeElement.closest("#collection")
    ? $("collection-btn")
    : document.activeElement;
  inspecting = true;
  $("inspector").showModal();
  $("close-inspect").focus();
}
function setupCollection() {
  const grid = $("collection-grid");
  const collection = Object.entries(CATALOG)
    .filter(([, d]) => d.personal)
    .sort(
      (a, b) =>
        Number(!!b[1].reader) - Number(!!a[1].reader) ||
        Number(!!b[1].sculpted) - Number(!!a[1].sculpted),
    );
  $("collection-count").textContent = collection.length;
  for (const [type, def] of collection) {
    const button = document.createElement("button");
    button.className =
      "collection-card" +
      (def.sculpted ? " sculpted" : "") +
      (def.reader ? " readable-book" : "");
    const image = document.createElement("img");
    image.src = def.preview || def.prototype;
    image.alt = `${def.name} · ${def.category}`;
    image.loading = "lazy";
    const caption = document.createElement("span");
    const category = document.createElement("small");
    category.textContent = `${def.reader ? "点击翻阅" : String(def.number).padStart(2, "0")} / ${def.category}`;
    const title = document.createElement("strong");
    title.textContent = def.name;
    caption.append(category, title);
    button.append(image, caption);
    button.onclick = () =>
      inspect(personalObjects.find((o) => o.userData.type === type));
    grid.append(button);
  }
  $("collection-btn").onclick = () => openModal("collection");
}
const bookReader = createBookReader({
  dialog: $("book-reader"),
  frame: $("book-frame"),
  loading: $("reader-loading"),
  closeButton: $("close-reader"),
  collection: $("collection"),
  collectionButton: $("collection-btn"),
  fallbackFocus: canvas,
  beforeOpen() {
    clearKeys();
    transition = null;
    $("travel-veil").style.opacity = "0";
    hovered = null;
    outline.visible = false;
    $("target").hidden = true;
  },
  afterClose() {
    clearKeys();
    pickSignature = "";
  },
});
function openBookReader(obj) {
  bookReader.open(obj.userData.definition.reader);
}
function closeInspection() {
  if (!inspecting) return;
  inspecting = false;
  if (held) showItem(held, true);
  if (shopSun) shopSun.shadow.needsUpdate = true;
  if (heldClone) inspectScene.remove(heldClone);
  held = null;
  heldClone = null;
  pickSignature = "";
  lookPointers.clear();
  $("inspector").close();
  clearKeys();
  (lastFocused || canvas).focus({ preventScroll: true });
}
$("close-inspect").onclick = closeInspection;
$("inspector").addEventListener("cancel", (e) => {
  e.preventDefault();
  closeInspection();
});
function changeZoom(delta) {
  zoom = THREE.MathUtils.clamp(zoom + delta, 0.55, 1.9);
  positionInspection();
}
$("inspect-bottom-view").onclick = () => {
  const d = held?.userData.definition;
  const back = d && hasInspectableBack(d);
  inspectOrbit.pitch = back ? 0.08 : -Math.PI / 2;
  inspectOrbit.yaw = back ? Math.PI : 0;
};
$("zoom-in").onclick = () => changeZoom(0.15);
$("zoom-out").onclick = () => changeZoom(-0.15);
$("reset-object").onclick = () => {
  inspectOrbit.yaw = 0.3;
  inspectOrbit.pitch = 0.12;
  zoom = 1;
  positionInspection();
};
const inspectCanvas = $("object-view");
inspectCanvas.addEventListener("pointerdown", (e) => {
  inspectCanvas.setPointerCapture(e.pointerId);
  lookPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  pinchDistance = 0;
});
inspectCanvas.addEventListener("pointermove", (e) => {
  if (!lookPointers.has(e.pointerId)) return;
  const old = lookPointers.get(e.pointerId);
  lookPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (lookPointers.size === 2) {
    const [a, b] = [...lookPointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDistance) changeZoom((d - pinchDistance) * 0.007);
    pinchDistance = d;
  } else {
    inspectOrbit.yaw += (e.clientX - old.x) * 0.009;
    inspectOrbit.pitch = THREE.MathUtils.clamp(
      inspectOrbit.pitch + (e.clientY - old.y) * 0.009,
      -Math.PI,
      Math.PI,
    );
  }
});
for (const event of ["pointerup", "pointercancel"])
  inspectCanvas.addEventListener(event, (e) => {
    lookPointers.delete(e.pointerId);
    pinchDistance = 0;
  });
inspectCanvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    changeZoom(-e.deltaY * 0.001);
  },
  { passive: false },
);
function pointerPosition(e) {
  pointer.set(
    (e.clientX / innerWidth) * 2 - 1,
    (-e.clientY / innerHeight) * 2 + 1,
  );
}
canvas.addEventListener("pointerdown", (e) => {
  if (isModal()) return;
  canvas.focus({ preventScroll: true });
  canvas.setPointerCapture(e.pointerId);
  pointerPosition(e);
  drag = {
    x: e.clientX,
    y: e.clientY,
    startX: e.clientX,
    startY: e.clientY,
    id: e.pointerId,
  };
  moved = false;
  transition = null;
});
canvas.addEventListener("pointermove", (e) => {
  pointerPosition(e);
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x,
    dy = e.clientY - drag.y;
  if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4)
    moved = true;
  if (moved) {
    yaw -= dx * 0.0032;
    pitch = THREE.MathUtils.clamp(pitch - dy * 0.0032, -1.35, 1.1);
    setCamera();
    $("target").hidden = true;
  }
  drag.x = e.clientX;
  drag.y = e.clientY;
});
canvas.addEventListener("pointerup", (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  pointerPosition(e);
  if (!moved) {
    const obj = pick();
    if (obj) inspect(obj);
  }
  drag = null;
});
canvas.addEventListener("pointercancel", () => {
  drag = null;
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerleave", () => {
  if (!drag) pointer.set(0, 0);
});
const movementKeys = [
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyQ",
  "KeyR",
  "ShiftLeft",
  "ShiftRight",
];
addEventListener("keydown", (e) => {
  if (inspecting) {
    const actions = {
      ArrowLeft: () => (inspectOrbit.yaw -= 0.15),
      ArrowRight: () => (inspectOrbit.yaw += 0.15),
      ArrowUp: () => (inspectOrbit.pitch -= 0.15),
      ArrowDown: () => (inspectOrbit.pitch += 0.15),
      Equal: () => changeZoom(0.1),
      Minus: () => changeZoom(-0.1),
      Digit0: () => {
        $("reset-object").click();
      },
    };
    if (actions[e.code]) {
      e.preventDefault();
      actions[e.code]();
    }
    return;
  }
  if (isModal()) return;
  if (movementKeys.includes(e.code)) {
    e.preventDefault();
    keys.add(e.code);
    transition = null;
    pointer.set(0, 0);
  }
  if (e.code === "KeyE") {
    e.preventDefault();
    inspect(pick(new THREE.Vector2(0, 0)));
  }
  if (e.code === "KeyH") openModal("help");
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", clearKeys);
document.addEventListener("visibilitychange", () => {
  clearKeys();
  previousTime = 0;
});
function canStand(x, z) {
  return positionAllowed(x, z, colliders);
}

function movePlayer(dt) {
  let side =
    (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0) + joystick.x;
  let forward =
    (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
    (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
    joystick.y;
  if (keys.has("ArrowLeft")) yaw += dt * 1.25;
  if (keys.has("ArrowRight")) yaw -= dt * 1.25;
  if (keys.has("KeyQ")) pitch += dt * 0.8;
  if (keys.has("KeyR")) pitch -= dt * 0.8;
  pitch = THREE.MathUtils.clamp(pitch, -1.35, 1.1);
  const length = Math.hypot(side, forward);
  if (length > 1) {
    side /= length;
    forward /= length;
  }
  const speed =
    (keys.has("ShiftLeft") ? SETTINGS.sprintSpeed : SETTINGS.walkingSpeed) * dt;
  const dx = (Math.cos(yaw) * side - Math.sin(yaw) * forward) * speed,
    dz = (-Math.sin(yaw) * side - Math.cos(yaw) * forward) * speed;
  if (canStand(camera.position.x + dx, camera.position.z))
    camera.position.x += dx;
  if (canStand(camera.position.x, camera.position.z + dz))
    camera.position.z += dz;
  setCamera();
}
const zones = ZONES;
function gotoZone(name) {
  const z = zones[name];
  clearKeys();
  const dest = new THREE.Vector3(...z.pos),
    target = new THREE.Vector3(...z.target),
    delta = target.clone().sub(dest);
  const newYaw = Math.atan2(-delta.x, -delta.z),
    newPitch = Math.atan2(delta.y, Math.hypot(delta.x, delta.z));
  transition = {
    from: camera.position.clone(),
    to: dest,
    yawFrom: yaw,
    yawTo: yaw + Math.atan2(Math.sin(newYaw - yaw), Math.cos(newYaw - yaw)),
    pitchFrom: pitch,
    pitchTo: newPitch,
    start: performance.now(),
  };
  document
    .querySelectorAll("[data-zone]")
    .forEach((b) => b.classList.toggle("active", b.dataset.zone === name));
  $("place-title").textContent = z.title;
  $("place-copy").textContent = z.copy;
  document.querySelector(`[data-zone="${name}"]`)?.scrollIntoView({
    block: "nearest",
    inline: "nearest",
    behavior: "smooth",
  });
  pointer.set(0, 0);
  canvas.focus({ preventScroll: true });
}
document.querySelectorAll("[data-zone]").forEach(
  (b) =>
    (b.onclick = () => {
      if (camera) gotoZone(b.dataset.zone);
    }),
);
function openModal(id) {
  clearKeys();
  $(id).showModal();
}
$("help-btn").onclick = () => openModal("help");
$("reference-btn").onclick = () => openModal("reference");
document
  .querySelectorAll("[data-close]")
  .forEach((b) => (b.onclick = () => $(b.dataset.close).close()));
for (const d of dialogs)
  d.addEventListener("click", (e) => {
    if (e.target === d && d.id !== "inspector") {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  });
$("fullscreen-btn").onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    toast("当前浏览器暂不支持全屏。");
  }
};
const joy = $("joystick");
function updateJoystick(e) {
  const r = joy.getBoundingClientRect(),
    x = (e.clientX - r.left - r.width / 2) / 34,
    y = (e.clientY - r.top - r.height / 2) / 34,
    mag = Math.max(1, Math.hypot(x, y));
  joystick = { x: x / mag, y: y / mag };
  $("stick").style.transform =
    `translate(${joystick.x * 27}px,${joystick.y * 27}px)`;
  transition = null;
  pointer.set(0, 0);
}
joy.addEventListener("pointerdown", (e) => {
  joy.setPointerCapture(e.pointerId);
  touchMoveId = e.pointerId;
  updateJoystick(e);
});
joy.addEventListener("pointermove", (e) => {
  if (e.pointerId === touchMoveId) updateJoystick(e);
});
for (const ev of ["pointerup", "pointercancel"])
  joy.addEventListener(ev, () => {
    touchMoveId = null;
    joystick = { x: 0, y: 0 };
    $("stick").style.transform = "";
  });
$("touch-pick").onclick = () => {
  const o = pick(new THREE.Vector2(0, 0));
  if (o) inspect(o);
  else toast("把画面中央的小圆点对准一件纪念品。");
};
function animate(time) {
  requestAnimationFrame(animate);
  if (document.hidden) return;
  const dt = Math.min((time - (previousTime || time)) / 1000, 0.05);
  previousTime = time;
  if ($("book-reader").open) return;
  if (inspecting && heldClone) {
    heldClone.rotation.set(inspectOrbit.pitch, inspectOrbit.yaw, 0, "YXZ");
    inspectRenderer.render(inspectScene, inspectCamera);
    return;
  }
  if (!isModal()) {
    if (transition) {
      const t = THREE.MathUtils.clamp((time - transition.start) / 440, 0, 1);
      $("travel-veil").style.opacity = String(Math.sin(t * Math.PI));
      if (t >= 0.5 && !transition.arrived) {
        camera.position.copy(transition.to);
        yaw = transition.yawTo;
        pitch = transition.pitchTo;
        setCamera();
        transition.arrived = true;
        pickSignature = "";
      }
      if (t === 1) {
        transition = null;
        $("travel-veil").style.opacity = "0";
      }
    } else {
      $("travel-veil").style.opacity = "0";
      movePlayer(dt);
    }
    if (time - lastPick > 100 && !drag) {
      const signature = [
        pointer.x,
        pointer.y,
        camera.position.x,
        camera.position.z,
        pitch,
        yaw,
      ]
        .map((n) => n.toFixed(4))
        .join();
      if (signature !== pickSignature) {
        updateHover();
        pickSignature = signature;
      }
      lastPick = time;
    }
  }
  if (!reducedMotion)
    mobiles.forEach((o, i) => {
      o.rotation.y =
        (o.userData.restY || 0) + Math.sin(time * 0.00045 + i * 1.39) * 0.075;
      o.rotation.z =
        (o.userData.restZ || 0) + Math.sin(time * 0.00065 + i * 0.93) * 0.023;
    });
  renderer.render(world, camera);
}
init();
