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
  world.add(new THREE.HemisphereLight("#edf0e6", "#6e644b", 1.5));
  world.add(new THREE.AmbientLight("#fff1d6", 0.2));
  const sun = new THREE.DirectionalLight("#ffecd1", 2.55);
  sun.position.set(-0.8, 5.5, 3.2);
  sun.target.position.set(0.4, 0, -0.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -4,
    right: 4,
    top: 7,
    bottom: -7,
    near: 0.2,
    far: 18,
  });
  sun.shadow.normalBias = 0.014;
  sun.shadow.bias = -0.00012;
  world.add(sun, sun.target);
  const fill = new THREE.DirectionalLight("#d7edf0", 1.15);
  fill.position.set(-1, 2.3, -7);
  world.add(fill);
  for (const [x, z, power] of [
    [-1.3, 3.5, 6],
    [1.6, 1.4, 5.5],
    [-1.6, -0.4, 5],
    [1.6, -2.7, 5],
    [-0.8, -4.8, 4],
  ]) {
    const l = new THREE.PointLight("#ffe7c5", power, 5, 2);
    l.position.set(x, 2.8, z);
    world.add(l);
  }
  return sun;
}
