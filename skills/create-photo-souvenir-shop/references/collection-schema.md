# Manifest reference

Use UTF-8 JSON and local image paths relative to the manifest. Normalize photos first with `prepare_photos.py`. The builder copies selected assets, strips source paths from image URLs and refuses to overwrite an output directory.

Required top-level fields: `title`, `photos`, `artworks`, `gifts`, `scene`. `palette` is a list of six-digit hex colors.

```json
{
  "photos":[{"id":"p1","src":"photos/p1.jpg","reviewed":true}],
  "artworks":[{"id":"a1","photo":"p1","src":"art/a1.png","title":"Shade","scene":"Striped umbrella","style":"Cut paper"}],
  "gifts":[{"id":"umbrella-key","kind":"keychain","artwork":"a1","name":"Umbrella keychain","description":"A striped umbrella charm","material":"Enamel and metal","color":"#437f86"}]
}
```

This fragment shows fields, not a complete assortment. Mark photos reviewed only after viewing them. Use 1–100 distinct artwork files linked to known sources. Each gift needs `id`, `kind`, `artwork`, `name`, `description`, `material`. Each distinct design gets a unique lowercase `id`; create many entries with the same `kind`. Repeated stock uses multiple placements of the same `memory-<id>`. Follow the per-type design and stock counts in `SKILL.md`; do not collapse a whole category into one entry.

## The eleven required items

| Item | Runtime kind / custom model |
| --- | --- |
| Keychain | `keychain` |
| Fridge magnet | `magnet` |
| Small badge | `pins` |
| Postcard | `postcards` |
| Plate | `custom`, `model:"plate"` |
| Small dish | `custom`, `model:"dish"` |
| Wall art | `print`, placed on a wall |
| Tablecloth | `custom`, `model:"tablecloth"` |
| Small notebook | `journal` |
| Pen | `custom`, `model:"pen"` |
| Coaster | `coasters` |

For custom models provide top-level `customModule:"my-products.js"`; see [runtime](runtime.md). Every gift must be placed. Designs may share maker code, but their resulting form and treatment must pass the visual variety check; changing IDs or textures is insufficient. Count only visually approved distinct designs toward the per-type design requirement, and actual placements separately as stock. A multi-part mesh or a set counts as one pickable placement; its internal parts do not inflate the stock count. The runtime retains other makers for compatibility; they do not belong in this collection unless the user requests them.

Optional gift fields: `category`, hex `color`, `finish`, `derivation`, `model`. `outline` is 3–100 simple `[x,y]` contour points in 0–1 for keychains/magnets/pins. `profile` is a radius/height contour for compatible lathe makers. Check source fit and shape visually.

## Scene

- `seed`: saved string/integer. `concept`: one sentence. `evidence`: `[{"photo":"p1","observation":"Striped umbrella","decisions":["Blue painted fixtures"]}]`.
- `room`: `width` 3–20, `depth` 3–24, `height` 2.5–8 meters; hex `wall`, `floor`, `ceiling`, `trim`. Optional `floorPattern`: `plain|planks|checker`; `wallTreatment`: `plain|slats`.
- `fixtures`: unique `id`, `kind`, `at:[x,y,z]`, `size:[width,height,depth]`; optional yaw `rotation`, `color`, `frameColor`, `label`, `collision`.
- `placements`: `type:"memory-<gift-id>"`, `at:[x,y,z]`; optional parent `fixture`, Euler `rotation:[x,y,z]`, positive `scale`, seeded yaw `variation` 0–0.5. Coordinates become fixture-local when parented. Intentional stock repetitions are allowed.
- `views`: required `overview`, optional `memories|cards|ceiling|crafts|photobook|back`. Each has `pos`, `target`, `title`, `copy`, optional button `label`. All camera stops must connect through walkable floor.
- Optional `subtitle`; `lighting` with hex `color`, `sun:[x,y,z]`, `intensity` and `pendantPower` 0–20.

Entry is at +z, y points up; rotations are radians. Fixture kinds:

| Fixtures | Placement details |
| --- | --- |
| `table`, `trestle`, `plinth` | Bottom center; top at local height |
| `shelf`, `card-rack` | Bottom center; `levels` 2–12; optional `backed`; shelf tops at `0.12 + row*(height-0.18)/(levels-1)` |
| `ledge` | Board top at local height |
| `crate`, `basket`, `pegboard`, `rail` | Bottom center; manually position supported or hanging stock |
| `lantern`, `pendant` | Bottom of lamp assembly; normally noncolliding |
| `canopy` | Upper center; height is sag; optional `artwork` supplies fabric pattern |
| `window` | Bottom center of visual window panel; normally noncolliding |

`card-<artwork index>` places an individual print; optional `wall:true` enforces uniqueness in a curated card display. `mobile-0`…`mobile-15` place thin ceiling cutouts; optional `drop` adds a suspension line. These do not replace the eleven featured gifts. No automatic stock or mandatory ceiling count.

## Optional existing assets

`reference` is a local shop-style image for the reference dialog. `ornaments:{src,photos}` imports a transparent 4×4 cutout atlas with 16 source IDs in row-major order; it places nothing automatically.

`book:{name,description,sourcePhoto,directory,index,cover,back}` imports a finished static book website. Paths stay inside its directory; raster cover proportions are preserved. Place as `journey-photobook`. Do not redesign supplied pages. Optional legacy `crafts` are available in the runtime code; they are not part of the required assortment.

Keep the editable input manifest and custom module beside the generated shop. Build into a new directory when revising.


## Quality and reproducible custom models

Optional `brief`: `{ "scope": "full", "artDirection": "stylized" }`. Set `scope: "pilot"` only for the internal pilot or a user-requested small sample; the final default remains all eleven categories. `artDirection: "photographic"` is for a user-requested documentary/photo-preserving collection. `requiredFamilies` may override the list when the user changes scope, not as a shortcut around missing designs.

Each gift may include `family` (one of `keychain`, `magnet`, `pin`, `postcard`, `plate`, `dish`, `wall-art`, `tablecloth`, `notebook`, `pen`, `coaster`), `construction` (specific fabrication description), and `designDifferences` (actual differences from its closest sibling). These are design records, not machine proof of beauty. Set `model` to an authored maker key for **any** kind; `customModule` is then required and the custom hook must return true. Without a model, compatible kinds use their simple default scaffold.

`customFiles` is an optional mapping from site-relative `custom/*.js` destinations to local source modules, for example `{ "custom/motifs.js": "motifs.js" }`. Import from `./custom/motifs.js` in the copied `custom-shop.js`; import `../craft.js` inside the helper. Only files explicitly listed are copied. Do not overwrite core runtime files or depend on files outside the built site.

Artworks may record `treatment` (`illustration`, `pattern`, `photographic-collage`, `original-photo`), `medium` (e.g. `gouache`, `woodcut`, `paper-collage`), and `generation` (a concise provenance note without private absolute paths). The final audit expects 70% interpreted paper/textile artwork and, for 12+ works, three media in a stylized brief. Labels are declarations: visually check source correspondence and actual treatment.

Fixtures accept `surface: "wood"` (default, grain) or `"paint"` (solid). Lighting additionally accepts `target: [x,y,z]`, `hemisphere`, `ambient`, `fill`, `environment` (0–20), and `exposure` (0.2–3). Keep indirect fill weaker than the key when modeling form. Authors still choose geometry, palette, layout and lighting; these controls impose no fixed floor plan.

A gift may also supply a local `preview` raster file. Use the actual model's `preview-memory-ID.png` from the review renderer for the collection browser; do not substitute a generated product concept that differs from the implemented object. It is copied and sanitized just like artwork. After adding previews, rebuild and render again so the final evidence matches.
