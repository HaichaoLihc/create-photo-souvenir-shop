import * as T from "./assets/three.module.js";
const refs = new WeakMap();
const hiddenMatrix = new T.Matrix4().makeScale(0, 0, 0);
// Share repeated geometry on the GPU while retaining each gift's original
// scene subtree for close inspection, identification and correct placement.
export function instanceRepeatedItems(room, objects) {
  room.updateMatrixWorld(true);
  const inv = room.matrixWorld.clone().invert(),
    groups = new Map(),
    geoCache = new Map();
  let originalCalls = 0;
  function geometryKey(geo) {
    if (geoCache.has(geo.uuid)) return geoCache.get(geo.uuid);
    let h = 2166136261,
      h2 = 5381;
    const feed = (v) => {
      const n = Math.round(v * 1000000);
      h = Math.imul(h ^ n, 16777619);
      h2 = Math.imul(h2, 33) ^ n;
    };
    for (const key of ["position", "normal", "uv"]) {
      const a = geo.attributes[key];
      if (a) for (const v of a.array) feed(v);
    }
    if (geo.index) for (const v of geo.index.array) feed(v);
    const k = [
      geo.attributes.position.count,
      geo.index?.count || 0,
      h,
      h2,
    ].join(":");
    geoCache.set(geo.uuid, k);
    return k;
  }
  for (const item of objects)
    item.traverse((m) => {
      if (m.isMesh && !Array.isArray(m.material)) {
        originalCalls++;
        const key =
          geometryKey(m.geometry) + ":" + m.material.uuid + ":" + m.castShadow;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({
          mesh: m,
          item,
          matrix: new T.Matrix4().multiplyMatrices(inv, m.matrixWorld),
        });
      }
    });
  const batches = [];
  for (const group of groups.values()) {
    // Swaying paper must retain its independent animation transform.
    if (
      group.length < 3 ||
      group.some(
        (v) =>
          v.item.userData.type.startsWith("mobile-") ||
          v.item.userData.type === "banner",
      )
    )
      continue;
    const first = group[0].mesh,
      batch = new T.InstancedMesh(first.geometry, first.material, group.length);
    batch.castShadow = first.castShadow;
    batch.receiveShadow = true;
    batch.userData.giftInstances = group.map((v) => v.item);
    group.forEach(({ mesh, item, matrix }, i) => {
      batch.setMatrixAt(i, matrix);
      mesh.layers.set(2);
      if (!refs.has(item)) refs.set(item, []);
      refs.get(item).push({ batch, index: i, matrix });
    });
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
    room.add(batch);
    batches.push(batch);
  }
  return {
    batches: batches.length,
    drawCallsSaved: [...groups.values()].reduce(
      (n, g) => n + (g[0].mesh.layers.mask === 4 ? g.length - 1 : 0),
      0,
    ),
    originalCalls,
  };
}
export function instanceOwner(hit) {
  return hit.object.isInstancedMesh
    ? hit.object.userData.giftInstances?.[hit.instanceId]
    : null;
}
export function showItem(item, visible) {
  item.visible = visible;
  for (const ref of refs.get(item) || []) {
    ref.batch.setMatrixAt(ref.index, visible ? ref.matrix : hiddenMatrix);
    ref.batch.instanceMatrix.needsUpdate = true;
  }
}
export function prepareInspectionClone(clone) {
  clone.traverse((m) => {
    m.layers.set(0);
  });
  return clone;
}
