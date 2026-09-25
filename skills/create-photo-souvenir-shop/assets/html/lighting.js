import { COLLECTION } from "./collection.js";
import * as THREE from "./assets/three.module.js";
export function createShopEnvironment(renderer) {
  const room = new THREE.Scene();
  room.background = new THREE.Color("#91978b");
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(10, 6, 10),
    new THREE.MeshBasicMaterial({ color: "#9d9e8c", side: THREE.BackSide }),
  );
  shell.position.y = 2;
  room.add(shell);
  const panel = (w, h, color, position, rotation) => {
    const o = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(...color),
        side: THREE.DoubleSide,
      }),
    );
    o.position.set(...position);
    o.rotation.set(...rotation);
    room.add(o);
  };
  panel(2, 3, [2.8, 3.15, 3.1], [-1, 2, -4.7], [0, 0, 0]);
  panel(4, 2, [2.8, 2.65, 2.3], [0, 4.8, 0], [Math.PI / 2, 0, 0]);
  panel(2, 3, [1.6, 1.7, 1.6], [4.7, 2, 0], [0, -Math.PI / 2, 0]);
  const generator = new THREE.PMREMGenerator(renderer),
    target = generator.fromScene(room, 0.035, 0.1, 30);
  generator.dispose();
  room.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });
  return target;
}
export function lightShop(world) {
  const r = COLLECTION.scene.room,
    lights = COLLECTION.scene.lighting || {};
  world.add(
    new THREE.HemisphereLight("#edf0e6", "#6e644b", lights.hemisphere ?? 0.85),
  );
  world.add(new THREE.AmbientLight("#fff1d6", lights.ambient ?? 0.08));
  const sun = new THREE.DirectionalLight(
    lights.color || "#ffecd1",
    lights.intensity ?? 2.55,
  );
  sun.position.set(
    ...(lights.sun || [-r.width * 0.2, r.height + 2, r.depth * 0.4]),
  );
  sun.target.position.set(...(lights.target || [0, 0.7, 0]));
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -Math.hypot(r.width, r.depth) * 0.55,
    right: Math.hypot(r.width, r.depth) * 0.55,
    top: Math.hypot(r.width, r.depth) * 0.55,
    bottom: -Math.hypot(r.width, r.depth) * 0.55,
    near: 0.2,
    far: Math.max(r.width, r.depth) * 3,
  });
  sun.shadow.normalBias = 0.003;
  sun.shadow.bias = -0.00012;
  world.add(sun, sun.target);
  const fill = new THREE.DirectionalLight("#d7edf0", lights.fill ?? 0.5);
  fill.position.set(-1, 2.3, -7);
  world.add(fill);
  for (const f of COLLECTION.scene.fixtures.filter((f) =>
    ["lantern", "pendant"].includes(f.kind),
  )) {
    const l = new THREE.PointLight(
      lights.color || "#ffe7c5",
      lights.pendantPower ?? 4,
      6,
      2,
    );
    l.position.set(f.at[0], f.at[1] + f.size[1] * 0.2, f.at[2]);
    world.add(l);
  }
  return sun;
}
