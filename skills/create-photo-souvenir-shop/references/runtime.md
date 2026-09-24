# Runtime map

The template is under `assets/html/`. Serve it with any static HTTP server; it contains fictional geometric SVG examples and no personal photographs. Do not use `file://`, because browsers restrict local ES modules.

| File | Responsibility |
| --- | --- |
| `collection.js` | Generated portable catalog; the normal customization boundary |
| `main.js` | Renderer, input, raycasting, inspection and collection tray |
| `gallery.js` | Room, furnishings and merchandise placements |
| `personal.js`, `mug.js` | Ten featured gift families, silhouettes and hollow mugs |
| `sculpted-crafts.js` | Optional motif-based sculptures and hardware |
| `trip-art.js` | Source provenance, artwork selection and postcard ordering |
| `trip-book.js`, `book-reader.js` | Original-cover model, lazy iframe, close/focus lifecycle |
| `texture-sources.js` | GPU-loaded art, atlas and optional book textures |
| `materials.js`, `lighting.js` | Cached materials and warm lighting |
| `navigation.js`, `settings.js` | Viewpoints, collisions and shared keyboard/touch speed |
| `optimize.js`, `instances.js` | Merge/batch while preserving individual item identity |

The floor plan uses roughly meter-like units: x across the aisle, y up, z along the shop. Ceiling y≈3.25. The stable left-shelf book position is intentional. All object makers return geometry under a group registered by `object()` in `gallery.js`. Add pickable merchandise through that function, not as anonymous room meshes. Keep `definition.sourcePhoto` and actual artwork/model derivation in sync.

To add a sculptural motif, implement its geometry in `sculpted-crafts.js`, add a branch in `buildCraft`, and register its slug/kind in `scripts/build_shop.py`'s `MODELS`. Use the existing three-column cabinet: at most three designs per kind. Include real depth, rear fastening/hardware and open mug cavities. Validate bounds, visibility and raycast access; a pretty isolated model can still be hidden behind a shelf. If adding a fourth item of a kind, extend placement logic first. Do not silently reuse a different subject's model.

When changing geometry or instancing, rerun `validate_shop.mjs`. Mesh clones used for inspection must be on render layer 0, and temporarily hiding one instance must not hide all copies. Transparent ornament hit testing and frozen shadows are performance-sensitive. The reader checks both origin and iframe source for Esc messages, retains its loaded page, and restores focus after closing.

Runtime uses no network dependencies. Keep `THREE-LICENSE.txt` with the vendored Three.js files. Never reformat vendored code merely to match application style. Node 22+ is used for scene validation; Python 3.10+ plus Pillow for source preparation/building. Optional `pillow-heif` is needed for HEIC on systems without `sips`.

Validation is intentionally CPU-side and cannot certify colors, GPU compatibility or animation smoothness. Report only checks actually performed. A generated artwork requires visual inspection even if every automated check passes.
