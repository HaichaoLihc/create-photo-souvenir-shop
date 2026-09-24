import * as THREE from "./assets/three.module.js";

function mergeMeshes(root, meshes) {
  const groups = new Map();
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  for (const mesh of meshes) {
    const key = mesh.material.uuid + ":" + mesh.castShadow;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(mesh);
  }
  for (const list of groups.values()) {
    if (list.length < 2) {
      list[0].geometry.computeBoundingBox();
      continue;
    }
    // Keep indexed geometry. Expanding spheres and tubes to triangle soup used
    // several times as much GPU memory and vertex processing on mobile.
    const parts = [];
    let vertexCount = 0,
      indexCount = 0;
    for (const mesh of list) {
      const geo = mesh.geometry.clone();
      geo.applyMatrix4(
        new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld),
      );
      parts.push(geo);
      vertexCount += geo.attributes.position.count;
      indexCount += geo.index ? geo.index.count : geo.attributes.position.count;
    }
    const geometry = new THREE.BufferGeometry();
    for (const [name, size] of [
      ["position", 3],
      ["normal", 3],
      ["uv", 2],
    ]) {
      const values = new Float32Array(vertexCount * size);
      let offset = 0;
      for (const part of parts) {
        if (part.attributes[name])
          values.set(part.attributes[name].array, offset);
        offset += part.attributes.position.count * size;
      }
      geometry.setAttribute(name, new THREE.BufferAttribute(values, size));
    }
    const indices =
      vertexCount > 65535
        ? new Uint32Array(indexCount)
        : new Uint16Array(indexCount);
    let nextIndex = 0,
      baseVertex = 0;
    for (const part of parts) {
      const count = part.index
        ? part.index.count
        : part.attributes.position.count;
      for (let i = 0; i < count; i++)
        indices[nextIndex++] =
          baseVertex + (part.index ? part.index.getX(i) : i);
      baseVertex += part.attributes.position.count;
    }
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const merged = new THREE.Mesh(geometry, list[0].material);
    merged.castShadow = list[0].castShadow;
    merged.receiveShadow = true;
    root.add(merged);
    list.forEach((mesh) => mesh.removeFromParent());
    parts.forEach((geo) => geo.dispose());
  }
}
export function optimize(room, items) {
  room.updateMatrixWorld(true);
  // Independently merge every souvenir: its identity and transform survive.
  for (const item of items) {
    const meshes = [];
    item.traverse((o) => {
      if (o.isMesh) meshes.push(o);
    });
    mergeMeshes(item, meshes);
  }
  const staticMeshes = [];
  room.traverse((mesh) => {
    if (!mesh.isMesh) return;
    let parent = mesh;
    while (parent && parent !== room) {
      if (parent.userData.id) return;
      parent = parent.parent;
    }
    staticMeshes.push(mesh);
  });
  mergeMeshes(room, staticMeshes);
}
