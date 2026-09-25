// Optional agent-authored extension. Export these same hooks when replacing this file.
// Return true after adding custom merchandise geometry to group; all picking/provenance
// registration and placement remain in gallery.js. Runtime helpers can be imported locally.
export function buildCustomProduct(group, definition, textures) { return false; }
// Add source-specific architectural details here. Register floor obstacles in colliders.
export function decorateShop({ room, colliders, fixtures, textures, collection }) {}
