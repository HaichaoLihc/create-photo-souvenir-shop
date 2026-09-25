# Reproduce the quality, not a remembered conversation

Everything required for a fresh session lives in this skill. Do not depend on the author's previous chat, original photo library, local project paths or an unshipped runtime patch. The five shop photos are spatial references, not product artwork. The runtime demo is a wiring example, not the visual target.

## Why a technically valid shop can still be weak

The original shop's strengths came from authored image treatments, real small-object fabrication, densely composed display groups and repeated visual revision. Quantity alone did not create them. These are different failure modes:

| Weak result | Concrete correction | Evidence to inspect |
| --- | --- | --- |
| Original photos inside colored borders; one style on every postcard | Generate new photo-referenced **flat artwork**, using several intentional media and compositions. Preserve supplied finished art. A border or filter is not an illustration. | Original/finished-art contact sheets; inspect at readable resolution |
| Identical rectangles, discs or cylinders with swapped textures | Change photo-derived silhouette, modeled volume, assembly and material; share fabrication components, not the motif | Oblique and untextured clay views |
| Attractive front, empty or physically impossible back | Add actual chain connections, pin catch, rear magnet, ceramic foot, paper reverse, spine or seam | Back/bottom and oblique views |
| Spacious plain room, oversized bare displays | Compose nested groups and stepped stock at three heights; match fixture size to stock; add a varied overhead layer where the concept supports it | Entry, cross-aisle, reverse and shelf close-up |
| Flat brown/beige surfaces, uniformly bright geometry | Distinguish grain, painted structure, paper, enamel, ceramic and hardware; use a visible source for key light, weaker fill, grounded shadows | Actual scene and product renders, not a concept image |

The target is a shop worth exploring at both room and handheld-object scales. Do not claim it is equal to or better than a reference from counts, prompt strength or a test exit code.

## Make a quality pilot before scaling

After reviewing **all** source contact sheets and five shop references, record observations in `design/source-notes.md` using stable photo IDs. Note actual visible motifs, colors, people/poses and useful scenes; make no unsupported location or identity claims. Then create a small **internal** pilot: 6–10 distinct print artworks, three carefully fabricated solid gifts with different constructions, and one fully stocked display vignette including overhead/vertical context. This is the first phase of the full task, not permission to deliver fewer categories. Continue without asking for approval unless the user requested selection.

For a stylized collection, use the available **imagegen** skill/tool for authored raster reinterpretations. Actually load it and pass the source photo paths. Do not silently replace it with raw-photo framing, CSS filters, procedurally traced SVGs, or tiny vector icons to save effort. SVG is appropriate for intentionally vector-native details such as enamel cells and cutting contours; those still need photo-specific authorship. If image generation is unavailable, report that limitation and preserve a clearly labeled draft instead of asserting equal quality.

Use at least three distinct, photo-compatible medium/composition families across a normal print collection: e.g. gouache scenes with a large quiet shape, tactile paper collage with an integrated original fragment, and ink/woodcut compositions. Choose the actual media from the photos and user taste; do not force these examples or repeat the old shop's motifs. Keep a coherent palette while varying image structure, scale, crop logic, negative space and typography. Generally at least 70% of the displayed paper/textile art should be authored illustration/collage/pattern for a **stylized** brief. A user-requested documentary/photo-preserving album overrides that default.

An atlas call may produce ten assets **only when it is explicitly one composed contact sheet**: specify equal 5×2 cells, deterministic row-major mapping from source IDs, flat front-facing art, exact tile boundaries, no product mockups/perspective, no unwanted frames, no text crossing tiles. Use `split_atlas.py` to crop; inspect every extracted tile. Separate generation calls are better when aspect ratios, source fidelity or detail suffer. Never count a collage of ten product mockups as ten finished textures. Store final generated files under the project and record the source-to-tile mapping.

Suggested generation brief (adapt, do not paste unchanged):
> From these reviewed source photos, create flat print-ready souvenir illustrations. Preserve each specified scene's recognizable visible motif and relationship between people/objects. Reinterpret through the selected medium, simplify micro-detail, compose with deliberate negative space and a distinctive focal scale. No invented place/date/memory. No mockup, cast shadow, tabletop, product shape or 3D render. [Give each source ID, observed motif, medium, composition and tile position.]

## Fabricate real objects

**Open the three [actual original-model fabrication references](craft-quality/README.md).** They provide a portable visual baseline even in a new session. Their motifs are examples; derive new motifs from the supplied photos.

Import reusable components from `craft.js`: `enamel`, `brass`, `steel`, `relief`, `polygon`, `jewel`, `roundBlock`, `splitRing`, `chainPath`, `magnetBack`, `pinBack`. They carry the original shop's bevels, clearcoat, thickness and connections without carrying its old motifs. Read signatures before using. Also use `materials.js` for geometry and timber. Choose fabrication that fits the object; do not put gold hardware on everything.

A gift with a `model` field now routes to `buildCustomProduct` **regardless of kind**. Return `true` only when constructed. The runtime throws for unimplemented authored models instead of silently substituting a generic item. Set `family` to the canonical merchandise family. Keep any helper modules in explicit manifest `customFiles` so a rebuild preserves the design. Avoid patching an output's core runtime without updating its reproducible source.

The old `crafts` catalog contains finished example motifs; use one only when it actually matches the new source. The simple default `personal.js` shapes are fallback scaffolding, not evidence of a completed high-quality assortment. One detailed item does not excuse unfinished siblings.

## Inspect, revise, then scale

Build the pilot and run the commands below. **Open the generated images**, including clay and backs; do not review only a generated concept board. Compare the pilot to the five shop references on composition, material distinction, fabrication and density. Write specific findings and fixes in `design/review-notes.md`. Repair the weakest object and display before multiplying designs. Then author the full assortment, repeating the same review per family; share components and image-generation batches to avoid redundant work without reducing finish.

```bash
python3 scripts/build_shop.py /project/source/collection.json /project/build-01
node scripts/validate_shop.mjs /project/build-01
node scripts/render_review.mjs /project/build-01 /project/review-01
python3 scripts/audit_collection.py /project/build-01 --review /project/review-01 --final
```

`render_review.mjs` requires Playwright and Chromium. Use an existing installation if available: `SHOP_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs` and optionally `SHOP_CHROME=/absolute/path/to/browser-executable`. Otherwise install Playwright in the project's tooling folder and its Chromium browser. `--limit N` is only a quick diagnostic; it is marked incomplete and cannot pass final audit. The output directory must be new and outside the site. It renders all declared scene views and every distinct placed type, with front, oblique, back/bottom and clay contact sheets. It uses the site's actual builder and materials, without the interaction UI. Each item also gets an individual oblique `preview-*.png`; these can become manifest gift `preview` files for accurate collection thumbnails. Rebuild and rerender after adding them. Also test the real website's movement, picking, inspection, collection UI and optional book in a browser when available/authorized.

`audit_collection.py` measures designs separately from stock, checks source-image reuse and declared art diversity, flags **exact normalized** repeated solid geometry, and ties screenshots to the current build's content hash. It cannot identify all near-duplicates, certify beauty, or prove that a claimed motif is faithful. Therefore a mechanical pass always leaves `visualReviewRequired: true`. Inspect those things yourself; don't falsify or omit evidence to make a pass. Shared key rings or ceramic feet are fine; duplicate whole objects are not distinct designs.

Before delivery: all required types/quantities unless overridden; 70%+ meaningful photo connection; source truth; clearly distinct print treatments; whole-object variety; believable supports; layered density; no lost rear details; coherent light/material hierarchy; all views and interactions usable. Record remaining limitations honestly. A new session's quality depends on this observed build–review–revise loop, not a promise in the prompt.
