# Photo Souvenir Shop

**English** · [简体中文](README.zh-CN.md)

Turn personal photographs into a warm, explorable **3D souvenir shop**. This Codex skill guides photo review, art direction, source-derived gift design and local website generation using a bundled vanilla JavaScript + Three.js runtime.

Walk through the shop, look up at hanging paper ornaments, pick up gifts, rotate them, and compare them with the photographs that inspired them. An optional book on the left shelf opens a supplied 2D flipbook.

## What is included

- Full photo review with large, paginated contact sheets and stable source IDs.
- Ten featured gift families: postcards, magnets, keychains, desk mats, mugs, coasters, totes, pins, stickers and journals.
- A postcard wall for up to 100 different artworks, with no repeated print on the main wall.
- Warm wood-and-olive interiors, dense shelving, 120 hanging ornaments, keyboard/touch movement and object inspection.
- Optional sculptural keepsakes, custom silhouettes and an existing photobook with its original cover.
- Local preparation/build scripts and automated scene checks. The default workflow targets at least 70% photo-derived merchandise.

The included demo uses **24 fictional geometric SVG artworks**. It contains no personal photographs or generated photo-based raster artwork. The skill is self-contained; a flipbook skill is not required.

## Install

Using Codex's skill installer:

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo HaichaoLihc/create-photo-souvenir-shop \
  --path skills/create-photo-souvenir-shop \
  --ref main
```

Alternatively, copy [`skills/create-photo-souvenir-shop/`](skills/create-photo-souvenir-shop/) into your local skill directory. Reload your agent's skills if required by your host application.

## Use

```text
Use $create-photo-souvenir-shop with the photos in /path/to/photos.
Review every photo and create a personal 3D souvenir shop with stylized
postcards, creative keychains, mugs, magnets and pins.
```

The agent first views all contact sheets and records recognizable details, then creates artwork and assembles a local site. Image generation uses the tools available to the agent; it is not performed by the Python builder. A finished-artwork collection can also be used. The website itself needs no API key, backend, CDN or JavaScript build step.

See the [Skill](skills/create-photo-souvenir-shop/SKILL.md),
[art direction](skills/create-photo-souvenir-shop/references/art-direction.md),
[collection schema](skills/create-photo-souvenir-shop/references/collection-schema.md),
and [runtime guide](skills/create-photo-souvenir-shop/references/runtime.md).

## Preview the fictional demo

From a local checkout:

```bash
python3 -m http.server 4173 --bind 127.0.0.1 \
  --directory skills/create-photo-souvenir-shop/assets/html
```

Open `http://127.0.0.1:4173/`. Use WASD to move, drag to look around, click an object to inspect it, and press Esc to put it back. Serve over HTTP rather than opening the HTML as a local file.

## Development and validation

Requirements: Python 3.10+, Pillow, and Node.js 22+ for validation. HEIC input additionally needs `pillow-heif` or the built-in macOS `sips` tool.

```bash
python3 -m pip install -r requirements.txt
python3 -m unittest discover -s tests -p 'test_*.py'
node --test tests/souvenir-reader.test.mjs
node skills/create-photo-souvenir-shop/scripts/validate_shop.mjs
```

Tests exercise photo pagination and orientation, atlas crops, small and large collections, optional sculptures/books, invalid manifests, reader focus, local assets, finite geometry, picking and instancing. These CPU-side checks do not replace visual review of generated artwork or browser interaction testing.

```text
skills/create-photo-souvenir-shop/
  SKILL.md           Agent workflow
  agents/            Skill metadata
  scripts/           Photo preparation, atlas cropping, site building, validation
  references/        Art direction, collection schema, runtime guide
  assets/html/       Self-contained 3D shop and fictional demo
tests/              Generator and reader regression tests
```

## License

Code and the original geometric SVG demo artworks use the [MIT License](LICENSE). Vendored Three.js retains its [MIT notice](skills/create-photo-souvenir-shop/assets/html/assets/THREE-LICENSE.txt). Photographs and artwork supplied by users retain their respective ownership and are not covered by this repository's code license. Generated personal shops remain local unless publication is authorized.
