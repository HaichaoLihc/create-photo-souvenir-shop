# Runtime

`assets/html/` supplies local Three.js, navigation, picking and inspection. Preserve those interactions; author the space and products. The fixture library and default lighting are starting points, not an architectural or aesthetic ceiling: extend `buildRoom`, fixtures, materials and `lighting.js` when the authored design requires it, keeping bounds/collision in sync. Serve over HTTP. Keep the Three.js license.

- `gallery.js`: registered products and placements.
- `fixtures.js`: room and fixture primitives. Extend for a different architecture.
- `personal.js`, `extended-products.js`: base product geometry.
- `custom-shop.js`: custom products and architectural details.
- `navigation.js`, `lighting.js`: authored views, collision and lights.
- `main.js`: input, picking and object inspection.

## Custom products

Supply a local `.js` file as `customModule`; it replaces `custom-shop.js`. Export both hooks below. A `kind:"custom"` gift selects a maker with `model`. **Plate, dish, tablecloth and pen currently need agent-authored makers**; they are not finished built-in products. Give each its own `id` and `model`.

```js
export function buildCustomProduct(group, definition, textures) {
  // Dispatch on definition.model; add finished geometry under group.
  // Available: definition.sourcePhoto, definition.artIndex, definition.color.
  // Artwork: textures['art-' + definition.artIndex].
  // Mark genuinely source-derived, unprinted meshes with:
  // mesh.userData.sourcePhoto = definition.sourcePhoto;
  // Return true when built, false for an unsupported model.
  return false;
}
export function decorateShop({ room, colliders, fixtures, textures, collection }) {
  // Optional architecture. Register floor obstacles: {x,z,w,d,rotation} or {x,z,r}.
}
```

Import local helpers from `./materials.js` and Three.js from `./assets/three.module.js`. The importer copies one custom module; include image assets through the manifest. Registered gifts receive picking, provenance and inspection automatically. Anonymous merchandise added in `decorateShop` does not.

Keep product bottoms near local y=0 and account for bounds when placing them. The wall-art maker is `print`; rotate/place it against a wall. Model tablecloth geometry around its intended table dimensions and include hanging edges in its bounds. Mesh provenance tags record a claim; visually verify the source relationship.

The CPU validator checks assets, geometry, sources, navigation connectivity, picking and instance identity. It does not certify appearance or completeness of the eleven-item assortment: check that list explicitly before delivery. Inspection clones stay on layer 0; hiding one instance must not hide its siblings. Runtime needs no backend or CDN.


## Finished models and visual evidence

See [quality workflow](quality-workflow.md) for the pilot, `craft.js` fabrication helpers, custom dispatch for every gift kind, reusable module packaging and the actual-model renderer. `render_review.mjs` renders the built site's scene and every distinct item from four directions/treatments. `audit_collection.py --final` checks the current build against that evidence and assortment requirements; it always leaves visual judgment to the reviewer. Geometry validation alone is insufficient. Avoid output-only runtime edits: use a manifest `model`, `customModule` and explicit `customFiles` so the next rebuild retains the work.

The runtime validator reports `postcardDesigns` across both custom postcard gifts and `card-N` placements, deduplicated by artwork. `authoredModels` counts unique placed gift types using custom makers. The retained legacy `uniquePostcards` field counts only `card-N` wall placements and may be zero in a fully authored postcard collection; use the canonical family audit for assortment totals.
