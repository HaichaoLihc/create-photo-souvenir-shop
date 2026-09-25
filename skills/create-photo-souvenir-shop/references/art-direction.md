# Product design

For each required item, connect a visible photo detail to a physical design: source → motif → shape/material → artwork. Use the fixed eleven-item list in `SKILL.md`; do not substitute easier categories.

- Simplify a distinctive silhouette for a keychain, magnet or badge; model its edge and fastening.
- Compose postcard, wall-art and notebook graphics for their different proportions. Preserve recognizable people and details when they are used.
- Design plate and dish as different sizes/forms, with shallow cavities and rims. Pattern placement should follow their surfaces.
- Recompose photo-derived colors and motifs into a textile pattern. A tablecloth must lie on a table and hang over its edges.
- Give the pen a proper tip and clip/cap; use a motif on its barrel or a small shaped finial. Coasters need real thickness and material.

Different designs need substantive differences in form and treatment, not only different photo-derived motifs. A new picture on the same charm/plate/notebook is a variant, not a new design. Apply the two-difference rule in `SKILL.md`. For example, source-compatible keychains can explore relief, sculpted charms, layered silhouettes and multi-part assemblies; plates can vary profile, rim, outline and surface technique. These are possibilities, not another fixed template. A small photo set can support genuinely different treatments without invented memories.

Merchandise in composed groups: occupied keychain hooks, magnets/badges in shallow trays, staggered plate/dish stacks with visible faces, fanned postcards, flat and upright notebooks, pen holders and coaster sets. Vary group height, depth, spacing and orientation with purpose; balance a denser group with a quieter patch. Local racks can have orderly rows, but do not apply one grid or random jitter across the shop. Copies provide stock depth, not design variety. Keep examples of every design visible and accessible; follow the spatial guidance in `shop-design.md`.

Built-in geometry is a starting point. Customize or replace it when its shape does not express the source. Do not present raw primitives as finished products.

For image generation, pass the reviewed photo references. Generate flat artwork, patterns or transparent cutouts separately from concept mockups. Inspect the actual results. Atlas cropping with `split_atlas.py` is optional; never print an entire product board on one object. Keep all eleven designs coherent without pasting the same image onto every surface.

## Final variety check

1. View **every finished design** together by category in front and oblique views, at comparable scale. Use rendered models from the actual shop, not concept art. Also inspect solid objects with image textures and labels hidden to expose repeated geometry.
2. Compare each design with its closest-looking sibling. Identify at least two visible design differences under the rule in `SKILL.md`. If removing the picture/color leaves a dozen identical solid objects, that category fails. For flat goods, compare the actual composition, format and treatment; a renamed file or changed photo is insufficient. IDs, image hashes and provenance checks cannot establish visual variety.
3. Merge or exclude near-duplicates from the design count, then author genuinely different replacements until quantities and variety both pass. Recheck replacements beside the full category. Repeated inventory keeps the same design ID and is counted only as stock; do not let copies dominate the shop and disguise too few designs. Do not lower this standard to save generation or modeling effort.
