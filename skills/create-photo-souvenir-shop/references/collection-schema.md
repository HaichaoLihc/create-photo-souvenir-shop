# Collection manifest

Input is UTF-8 JSON. Image paths are local files, relative to the manifest (absolute input paths also work). Use prepared JPEG/PNG/WebP files; run HEIC through `prepare_photos.py`. IDs are nonempty strings. Never mark an image reviewed merely because the script decoded it.

Minimal example, after actually viewing this source and creating the print:

```json
{
  "title": "Days by the sea",
  "palette": ["#437f86", "#d38452", "#eee2c9"],
  "photos": [{"id": "p0001", "src": "photo-review/photos/p0001.jpg", "reviewed": true}],
  "artworks": [{
    "id": "umbrella-cut-paper", "photo": "p0001", "src": "prints/umbrella.png",
    "title": "A patch of shade", "scene": "A striped umbrella beside the water", "style": "Cut paper"
  }]
}
```

`photos`: selected, visually reviewed sources. `artworks`: 1–100 unique finished images, each linked to a known source. Every artwork appears once on the main wall; prints can recur on other merchandise. For a rich wall, curate 24–100 images, depending on the collection. Duplicate files and unknown IDs are rejected. Use diverse sources; a one-image manifest is supported for small pilots but is not a varied final collection.

`gifts` is optional. Omit it to populate all ten families using the artwork list. Supply a list to control the hero pieces; use `[]` for no featured gifts. Each family may appear once here. Regular merchandise remains elsewhere in the shop.

```json
{
  "kind": "magnet",
  "name": "Shade to take home",
  "category": "Layered magnet",
  "artwork": "umbrella-cut-paper",
  "description": "The umbrella's asymmetric outline, red stripes and pale sand become a small keepsake.",
  "material": "Enamel · two rear magnets",
  "color": "#437f86",
  "outline": [[0.1,0], [0.9,0], [1,0.6], [0.5,1], [0,0.6]]
}
```

Supported kinds: `postcards`, `magnet`, `keychain`, `desk-mat`, `mug`, `coasters`, `tote`, `pins`, `stickers`, `journal`. `name`, `artwork`, `description`, `material` and `kind` are required for explicit gifts. `color` and `category` are optional. `outline` is an optional simple non-self-intersecting contour of 3–100 `[x,y]` pairs from 0 to 1, with y increasing upward. It affects magnet, keychain and pin geometry; the builder checks ranges, while the agent must check shape validity and visual fit.

Optional `crafts`: one per model slug, up to twelve. Each needs `slug`, `name`, `description`, `material`, `motif` (observed visual feature), `sourcePhoto`, and `preview` (a local concept or rendered product image). The builder assigns kind from the model registry. Available slugs:

- keychains: `gull-key`, `camp-key`, `pack-key`
- mugs: `lake-cup`, `ridge-cup`, `koi-cup`
- magnets: `lake-magnet`, `camp-magnet`, `flags-magnet`
- pins: `gull-pin`, `cloud-pin`, `cairn-pin`

These are a vocabulary, not a default collection. Only select subjects present in the user's photos. Their existing colors/shapes are starting points; tailor them to the actual reference. The default template includes no sculptures.

Optional `ornaments`: `{"src":"prints/ornaments.png","photos":["p0001", "…16 actual IDs total…"]}`. Use a transparent 4×4 atlas with cells in left-to-right, top-to-bottom order. Without it, the ceiling displays finished artwork prints. Optional `reference`: a local shop-reference image used only in the reference dialog.

Optional `book` imports a **finished static book website**:

```json
{
  "name": "Days by the sea", "description": "Our finished travel album.", "sourcePhoto": "p0001",
  "directory": "finished-book", "index": "index.html",
  "cover": "assets/pages/cover.png", "back": "assets/pages/back.png"
}
```

Book paths stay within `directory`; use a finished export, not a source repository. The importer copies HTML/CSS/JS/fonts/images/JSON/licenses, excluding hidden files, node_modules, archives and videos. Covers must be raster images; their aspect ratios remain unchanged. The 3D book sits on the left shelf and opens the supplied 2D reader in a lazy iframe. Page order and artwork are not redesigned. If no book is supplied, the book model and navigation button are absent. Creating a new page-turning book is a separate optional task (the sibling `create-photo-flipbook-ui` skill can do it when available).

The builder creates `collection.js` for the runtime, a portable `collection.json`, and selected local assets. It refuses an existing output directory rather than deleting previous work. For subsequent additions, update the editable input manifest and build a new output, validate, then replace the served version deliberately.
