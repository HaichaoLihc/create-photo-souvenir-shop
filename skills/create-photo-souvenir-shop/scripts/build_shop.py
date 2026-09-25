#!/usr/bin/env python3
"""Build a standalone, local-only shop from a reviewed collection manifest."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import tempfile
from PIL import Image, ImageOps

TEMPLATE = Path(__file__).resolve().parents[1] / "assets" / "html"
KINDS = [
    "postcards",
    "magnet",
    "keychain",
    "desk-mat",
    "mug",
    "coasters",
    "tote",
    "pins",
    "stickers",
    "journal",
    "tray",
    "bowl",
    "vase",
    "candle",
    "tea-towel",
    "scarf",
    "pouch",
    "bookmark",
    "ornament",
    "print",
    "relief",
    "custom",
]
MODELS = {
    "gull-key": "keychain",
    "camp-key": "keychain",
    "pack-key": "keychain",
    "lake-cup": "mug",
    "ridge-cup": "mug",
    "koi-cup": "mug",
    "lake-magnet": "magnet",
    "camp-magnet": "magnet",
    "flags-magnet": "magnet",
    "gull-pin": "pin",
    "cloud-pin": "pin",
    "cairn-pin": "pin",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def local_file(base, value):
    require(isinstance(value, str) and bool(value), "Expected a local file path")
    require(
        "://" not in value and not value.startswith("data:"),
        "Remote/data URLs are not input files",
    )
    file = (base / value).resolve()
    require(file.is_file(), f"Missing input: {file}")
    return file


FIXTURES = {
    "table",
    "trestle",
    "shelf",
    "card-rack",
    "ledge",
    "plinth",
    "crate",
    "basket",
    "pegboard",
    "rail",
    "lantern",
    "pendant",
    "canopy",
    "window",
}
VIEW_KEYS = {"overview", "memories", "cards", "ceiling", "crafts", "photobook", "back"}


def finite(value):
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def vector(value, length=3):
    return (
        isinstance(value, list)
        and len(value) == length
        and all(finite(v) for v in value)
    )


def validate_scene(scene, photos, artworks, gift_ids, crafts, book):
    require(
        isinstance(scene, dict),
        "Author scene from reviewed photos: room, fixtures, placements, views, seed and evidence are required",
    )
    require(
        isinstance(scene.get("seed"), (str, int))
        and not isinstance(scene["seed"], bool),
        "Save an explicit scene seed",
    )
    require(
        isinstance(scene.get("concept"), str) and scene["concept"].strip(),
        "Explain the photo-derived spatial concept",
    )
    evidence = scene.get("evidence", [])
    require(
        isinstance(evidence, list)
        and evidence
        and all(
            e.get("photo") in photos
            and isinstance(e.get("observation"), str)
            and e["observation"].strip()
            and isinstance(e.get("decisions"), list)
            and e["decisions"]
            and all(isinstance(x, str) and x.strip() for x in e["decisions"])
            for e in evidence
        ),
        "scene.evidence needs reviewed photo IDs, observations and design decisions",
    )
    r = scene.get("room", {})
    for key, low, high in [("width", 3, 20), ("depth", 3, 24), ("height", 2.5, 8)]:
        require(
            finite(r.get(key)) and low <= r[key] <= high,
            f"room.{key} must be between {low} and {high} meters",
        )
    for key in ["wall", "floor", "ceiling", "trim"]:
        require(
            isinstance(r.get(key), str) and re.fullmatch(r"#[0-9a-fA-F]{6}", r[key]),
            f"room.{key} needs a six-digit hex color",
        )
    require(
        r.get("floorPattern", "plain") in ["plain", "planks", "checker"],
        "Unknown floorPattern",
    )
    require(
        r.get("wallTreatment", "plain") in ["plain", "slats"], "Unknown wallTreatment"
    )
    fixtures = scene.get("fixtures")
    require(isinstance(fixtures, list), "Author scene.fixtures")
    fixture_ids = [f.get("id") for f in fixtures]
    require(
        all(isinstance(x, str) and x for x in fixture_ids)
        and len(set(fixture_ids)) == len(fixture_ids),
        "Unique fixture IDs required",
    )
    for f in fixtures:
        require(
            f.get("kind") in FIXTURES,
            "Unknown fixture kind; use customModule for new geometry",
        )
        require(
            vector(f.get("at"))
            and vector(f.get("size"))
            and all(v > 0 for v in f["size"]),
            "Fixture at/size must be finite vectors with positive size",
        )
        require(finite(f.get("rotation", 0)), "Fixture rotation must be finite radians")
        require(
            isinstance(f.get("levels", 4), int) and 2 <= f.get("levels", 4) <= 12,
            "Shelf levels must be 2–12",
        )
        for key in ["color", "frameColor"]:
            if key in f:
                require(
                    isinstance(f[key], str)
                    and re.fullmatch(r"#[0-9a-fA-F]{6}", f[key]),
                    "Fixture colors need hex values",
                )
        require(
            f.get("surface", "wood") in ["wood", "paint"],
            "Fixture surface is wood or paint",
        )
        if "artwork" in f:
            require(f["artwork"] in artworks, "Unknown fixture artwork")
    types = {"memory-" + i for i in gift_ids} | {"craft-" + c["slug"] for c in crafts}
    if book:
        types.add("journey-photobook")
    # Keep in sync with trip-book.js's BOOK_TYPE.
    placements = scene.get("placements")
    require(
        isinstance(placements, list) and placements,
        "Place a curated selection of merchandise explicitly",
    )
    wall = []
    for p in placements:
        kind = p.get("type", "")
        card = re.fullmatch(r"card-(\d+)", kind)
        mobile = re.fullmatch(r"mobile-(\d+)", kind)
        require(
            kind in types
            or (card and int(card[1]) < len(artworks))
            or (mobile and int(mobile[1]) < 16),
            f"Unknown placement type: {kind}",
        )
        require(
            vector(p.get("at")) and vector(p.get("rotation", [0, 0, 0])),
            "Placement at/rotation must be finite vectors",
        )
        require(
            finite(p.get("scale", 1)) and 0 < p.get("scale", 1) <= 8,
            "Placement scale must be positive and at most 8",
        )
        require(
            finite(p.get("variation", 0)) and 0 <= p.get("variation", 0) <= 0.5,
            "variation is 0–0.5 radians of seeded yaw",
        )
        require(
            finite(p.get("drop", 0)) and 0 <= p.get("drop", 0) <= r["height"],
            "Invalid ornament drop",
        )
        require(
            "fixture" not in p or p["fixture"] in fixture_ids,
            "Placement references an unknown fixture",
        )
        if p.get("wall"):
            require(card, "Only cards can be marked wall")
            wall.append(kind)
    require(
        len(wall) == len(set(wall)), "The curated main wall must not repeat an artwork"
    )
    require(
        types <= {p["type"] for p in placements},
        "Place every selected gift, craft and book; remove unstocked designs from the catalog",
    )
    views = scene.get("views", {})
    require(
        isinstance(views, dict) and "overview" in views and set(views) <= VIEW_KEYS,
        "Provide overview and supported navigation views",
    )
    for v in views.values():
        require(
            vector(v.get("pos"))
            and vector(v.get("target"))
            and v["pos"] != v["target"],
            "View positions/targets must be finite and distinct",
        )
        require(
            all(isinstance(v.get(k), str) for k in ["title", "copy"]),
            "Each view needs title and copy",
        )
        require(
            0.3 <= v["pos"][1] <= r["height"] - 0.1,
            "View camera must be inside room height",
        )
    lights = scene.get("lighting", {})
    for key in ["sun", "target"]:
        if key in lights:
            require(vector(lights[key]), "Lighting position must be finite")
    if "exposure" in lights:
        require(
            finite(lights["exposure"]) and 0.2 <= lights["exposure"] <= 3,
            "Exposure must be 0.2–3",
        )
    for key in [
        "intensity",
        "pendantPower",
        "hemisphere",
        "ambient",
        "fill",
        "environment",
    ]:
        if key in lights:
            require(
                finite(lights[key]) and 0 <= lights[key] <= 20,
                "Lighting power must be between 0 and 20",
            )
    if "color" in lights:
        require(
            isinstance(lights["color"], str)
            and re.fullmatch(r"#[0-9a-fA-F]{6}", lights["color"]),
            "Lighting color needs a hex value",
        )


def build(manifest, output):
    manifest = Path(manifest).resolve()
    output = Path(output).resolve()
    base = manifest.parent
    data = json.loads(manifest.read_text())
    require(
        not output.exists(),
        "Output already exists; choose a new directory to preserve previous work",
    )
    require(
        isinstance(data.get("title"), str) and data["title"].strip(),
        "title is required",
    )
    photos = data.get("photos", [])
    artworks = data.get("artworks", [])
    require(
        photos and artworks, "Provide reviewed photos and at least one finished artwork"
    )
    require(
        len(artworks) <= 100,
        "The current wall holds at most 100 unique artworks; curate the collection before building",
    )
    ids = [p["id"] for p in photos]
    art_ids = [a["id"] for a in artworks]
    require(
        all(isinstance(x, str) and x for x in ids + art_ids), "Use nonempty string IDs"
    )
    require(
        len(set(ids)) == len(ids) and len(set(art_ids)) == len(art_ids),
        "IDs must be unique within each list",
    )
    require(
        all(p.get("reviewed") is True for p in photos),
        "Every selected source must be visually reviewed first",
    )
    palette = data.get("palette", ["#537e77", "#ce794d", "#e6ba55"])
    require(
        len(palette) >= 1 and all(re.fullmatch(r"#[0-9a-fA-F]{6}", c) for c in palette),
        "Palette entries must be six-digit hex colors",
    )
    seen_hashes = set()
    for a in artworks:
        require(a.get("photo") in ids, f'Unknown source for artwork {a["id"]}')
        require(
            all(
                isinstance(a.get(k), str) and a[k].strip()
                for k in ["title", "scene", "style"]
            ),
            "Each artwork needs a title, scene and style",
        )
        digest = hashlib.sha256(local_file(base, a["src"]).read_bytes()).hexdigest()
        require(
            digest not in seen_hashes,
            "Duplicate artwork files: create distinct treatments instead of renaming one image",
        )
        seen_hashes.add(digest)
    gifts = data.get("gifts")
    require(
        isinstance(gifts, list),
        "Choose gifts explicitly (use [] for a paper-only shop); no automatic assortment",
    )
    gift_ids = [g.get("id", g.get("kind")) for g in gifts]
    require(
        all(isinstance(i, str) and re.fullmatch(r"[a-z0-9-]+", i) for i in gift_ids),
        "Gift IDs need lowercase slugs",
    )
    require(
        len(set(gift_ids)) == len(gift_ids),
        "Use a unique id for each design, including same-family variants",
    )
    for g in gifts:
        require(
            g.get("kind") in KINDS and g.get("artwork") in art_ids,
            "Gift kind/artwork is invalid",
        )
        require(
            all(
                isinstance(g.get(k), str) and g[k]
                for k in ["name", "description", "material"]
            ),
            "Gift copy is required",
        )
        if g.get("color"):
            require(
                re.fullmatch(r"#[0-9a-fA-F]{6}", g["color"]),
                "Gift color must be a hex color",
            )
        if g.get("kind") == "custom" or g.get("model"):
            require(
                data.get("customModule"),
                "Authored models require an agent-authored customModule",
            )
        if "profile" in g:
            require(
                isinstance(g["profile"], list)
                and 4 <= len(g["profile"]) <= 80
                and all(
                    isinstance(p, list)
                    and len(p) == 2
                    and all(finite(v) and 0 <= v <= 1 for v in p)
                    for p in g["profile"]
                ),
                "profile needs 4–80 [radius,height] points in meters between 0 and 1",
            )
        if "outline" in g:
            points = g["outline"]
            require(
                3 <= len(points) <= 100
                and all(
                    len(p) == 2 and all(finite(v) and 0 <= v <= 1 for v in p)
                    for p in points
                ),
                "outline needs 3–100 normalized [x,y] points",
            )
    crafts = data.get("crafts", [])
    require(
        len({c["slug"] for c in crafts}) == len(crafts),
        "Sculptural models must be unique",
    )
    for c in crafts:
        require(
            c.get("slug") in MODELS,
            "Unknown sculptural model; extend sculpted-crafts.js for a new motif",
        )
        require(
            c.get("sourcePhoto") in ids
            and all(c.get(k) for k in ["name", "description", "material", "motif"]),
            "Crafts require a reviewed source and a specific visual motif",
        )
        c["kind"] = MODELS[c["slug"]]
    ornaments = data.get("ornaments")
    if ornaments:
        require(
            len(ornaments.get("photos", [])) == 16
            and all(p in ids for p in ornaments["photos"]),
            "The 4×4 ornament atlas needs exactly 16 source IDs, in row-major order",
        )
    book = data.get("book")
    if book:
        require(
            book.get("sourcePhoto") in ids
            and book.get("name")
            and book.get("description"),
            "Book needs its title, description and a source photo",
        )
    scene = data.get("scene")
    validate_scene(scene, ids, art_ids, gift_ids, crafts, bool(book))
    # Stage into a temporary sibling so any validation/copy failure leaves no partial shop.
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=output.parent, prefix=".shop-build-") as temp:
        stage = Path(temp) / "site"
        shutil.copytree(TEMPLATE, stage)
        shutil.rmtree(stage / "assets" / "demo", ignore_errors=True)
        if data.get("customModule"):
            custom = local_file(base, data["customModule"])
            require(
                custom.suffix == ".js",
                "customModule must be a local JavaScript ES module",
            )
            shutil.copy2(custom, stage / "custom-shop.js")
        # Explicit auxiliary modules survive a rebuild, without overwriting runtime code.
        for destination, source in data.get("customFiles", {}).items():
            relative = Path(destination)
            require(
                not relative.is_absolute()
                and len(relative.parts) > 1
                and relative.parts[0] == "custom"
                and ".." not in relative.parts
                and relative.suffix == ".js",
                "customFiles destinations must be custom/*.js",
            )
            target = stage / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(local_file(base, source), target)
        assets = stage / "assets" / "collection"
        assets.mkdir(exist_ok=True)
        image_sizes = {}

        def image_copy(value):
            file = local_file(base, value)
            with Image.open(file) as original:
                image = ImageOps.exif_transpose(original)
                image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
                alpha = image.mode in ("RGBA", "LA") or "transparency" in image.info
                image = image.convert("RGBA" if alpha else "RGB")
                # Content names are anonymous; saved images omit EXIF and source paths.
                raw = image.tobytes()
                name = hashlib.sha256(raw + str(image.size).encode()).hexdigest()[
                    :20
                ] + (".png" if alpha else ".jpg")
                image.save(
                    assets / name,
                    **({} if alpha else {"quality": 92, "optimize": True}),
                )
                url = "./assets/collection/" + name
                image_sizes[url] = list(image.size)
                return url

        result = {
            "title": data["title"],
            "scene": scene,
            "brief": data.get("brief", {}),
            "palette": palette,
            "photos": [{"id": p["id"], "src": image_copy(p["src"])} for p in photos],
            "artworks": [],
            "gifts": [
                {
                    k: g[k]
                    for k in [
                        "id",
                        "kind",
                        "name",
                        "category",
                        "artwork",
                        "description",
                        "material",
                        "color",
                        "outline",
                        "profile",
                        "finish",
                        "derivation",
                        "model",
                        "family",
                        "construction",
                        "designDifferences",
                    ]
                    if k in g
                }
                for g in gifts
            ],
            "crafts": [],
            "book": None,
            "ornaments": None,
            "reference": None,
        }
        for source_gift, built_gift in zip(gifts, result["gifts"]):
            if source_gift.get("preview"):
                built_gift["preview"] = image_copy(source_gift["preview"])
        for a in artworks:
            result["artworks"].append(
                {
                    k: a[k]
                    for k in [
                        "id",
                        "photo",
                        "title",
                        "scene",
                        "style",
                        "treatment",
                        "medium",
                        "generation",
                    ]
                    if k in a
                }
                | {"src": image_copy(a["src"])}
            )
        for c in crafts:
            result["crafts"].append(
                {
                    k: c[k]
                    for k in [
                        "slug",
                        "kind",
                        "name",
                        "description",
                        "material",
                        "motif",
                        "sourcePhoto",
                    ]
                }
                | {"preview": image_copy(c["preview"])}
            )
        if ornaments:
            result["ornaments"] = {
                "src": image_copy(ornaments["src"]),
                "photos": ornaments["photos"],
            }
        if data.get("reference"):
            result["reference"] = image_copy(data["reference"])
        if book:
            book_root = (base / book["directory"]).resolve()
            require(book_root.is_dir(), "Missing finished book directory")
            suffixes = {
                ".html",
                ".css",
                ".js",
                ".mjs",
                ".json",
                ".png",
                ".jpg",
                ".jpeg",
                ".webp",
                ".svg",
                ".woff",
                ".woff2",
                ".ttf",
                ".txt",
            }
            for file in book_root.rglob("*"):
                if file.is_symlink():
                    raise ValueError("Book imports must not contain symlinks")
                relative = file.relative_to(book_root)
                if (
                    file.is_file()
                    and not any(
                        p.startswith(".") or p == "node_modules" for p in relative.parts
                    )
                    and file.suffix.lower() in suffixes
                ):
                    target = stage / "books" / "memory" / relative
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(file, target)

            def book_url(key):
                relative = Path(book[key])
                resolved = (book_root / relative).resolve()
                require(
                    resolved.is_relative_to(book_root) and not relative.is_absolute(),
                    "Book paths must stay within the supplied book directory",
                )
                require(
                    (stage / "books" / "memory" / relative).is_file(),
                    f"Missing book {key}",
                )
                return "./books/memory/" + relative.as_posix()

            result["book"] = {
                k: book[k] for k in ["name", "description", "sourcePhoto"]
            } | {
                "reader": book_url("index"),
                "cover": book_url("cover"),
                "back": book_url("back"),
            }
            index = stage / result["book"]["reader"]
            html = index.read_text()
            bridge = '<script>addEventListener("keydown",e=>{if(e.key==="Escape")parent.postMessage({type:"travel-book-close"},location.origin);});</script>'
            index.write_text(
                html.replace("</body>", bridge + "\n</body>")
                if "</body>" in html
                else html + bridge
            )
        result["imageSizes"] = image_sizes
        if result["book"]:
            for key in ["cover", "back"]:
                with Image.open(stage / result["book"][key]) as cover:
                    image_sizes[result["book"][key]] = list(cover.size)
        (stage / "collection.js").write_text(
            "export const COLLECTION = "
            + json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False)
            + ";\n"
        )
        (stage / "collection.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
        )
        shutil.move(str(stage), output)
    print(
        f"Created {output}: {len(artworks)} artworks, {len(gifts)} gift designs "
        f"({sum(bool(g.get('model')) for g in gifts)} authored models), "
        f"{len(crafts)} legacy sculpted models"
    )
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest")
    parser.add_argument("output")
    args = parser.parse_args()
    try:
        build(args.manifest, args.output)
    except (ValueError, KeyError, TypeError, OSError) as error:
        parser.exit(1, f"{error}\n")
