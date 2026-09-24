#!/usr/bin/env python3
"""Build a standalone, local-only shop from a reviewed collection manifest."""
import argparse
import hashlib
import json
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
]
NAMES = [
    "明信片",
    "冰箱贴",
    "钥匙链",
    "桌垫",
    "马克杯",
    "杯垫",
    "帆布袋",
    "徽章",
    "贴纸",
    "手账",
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
    if gifts is None:
        gifts = [
            {
                "kind": kind,
                "name": artworks[i % len(artworks)]["title"] + " · " + NAMES[i],
                "category": NAMES[i],
                "artwork": artworks[i % len(artworks)]["id"],
                "description": artworks[i % len(artworks)]["scene"],
                "material": "纸、织物或釉面材质",
            }
            for i, kind in enumerate(KINDS)
        ]
    require(
        len({g["kind"] for g in gifts}) == len(gifts),
        "Choose at most one featured gift per family",
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
        if "outline" in g:
            points = g["outline"]
            require(
                3 <= len(points) <= 100
                and all(
                    len(p) == 2
                    and all(isinstance(v, (int, float)) and 0 <= v <= 1 for v in p)
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
    # Stage into a temporary sibling so any validation/copy failure leaves no partial shop.
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=output.parent, prefix=".shop-build-") as temp:
        stage = Path(temp) / "site"
        shutil.copytree(TEMPLATE, stage)
        shutil.rmtree(stage / "assets" / "demo", ignore_errors=True)
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
            "palette": palette,
            "photos": [{"id": p["id"], "src": image_copy(p["src"])} for p in photos],
            "artworks": [],
            "gifts": [
                {
                    k: g[k]
                    for k in [
                        "kind",
                        "name",
                        "category",
                        "artwork",
                        "description",
                        "material",
                        "color",
                        "outline",
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
        for a in artworks:
            result["artworks"].append(
                {k: a[k] for k in ["id", "photo", "title", "scene", "style"]}
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
            + json.dumps(result, ensure_ascii=False, indent=2)
            + ";\n"
        )
        (stage / "collection.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2) + "\n"
        )
        shutil.move(str(stage), output)
    print(
        f"Created {output}: {len(artworks)} artworks, {len(gifts)} featured gifts, {len(crafts)} sculpted gifts"
    )
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest")
    parser.add_argument("output")
    args = parser.parse_args()
    try:
        build(args.manifest, args.output)
    except (ValueError, KeyError, OSError) as error:
        parser.exit(1, f"{error}\n")
