#!/usr/bin/env python3
"""Create EXIF-corrected previews and paginated, numbered contact sheets. Never edit inputs."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
from PIL import Image, ImageOps, ImageDraw

SUPPORTED = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff"}


def open_photo(path):
    if path.suffix.lower() in {".heic", ".heif"}:
        try:
            import pillow_heif

            pillow_heif.register_heif_opener()
        except ImportError:
            import shutil

            if not shutil.which("sips"):
                raise ValueError(
                    "Install pillow-heif to read HEIC/HEIF on this platform"
                )
            with tempfile.TemporaryDirectory() as temp:
                converted = Path(temp) / "image.png"
                subprocess.run(
                    ["sips", "-s", "format", "png", str(path), "--out", str(converted)],
                    check=True,
                    capture_output=True,
                )
                with Image.open(converted) as image:
                    return ImageOps.exif_transpose(image).convert("RGB")
    with Image.open(path) as image:
        return ImageOps.exif_transpose(image).convert("RGB")


def prepare(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if not source.is_dir():
        raise ValueError("The input must be a photo directory")
    if output == source or source in output.parents:
        raise ValueError("Keep the review output outside the input photo folder")
    output.mkdir(parents=True, exist_ok=False)
    (output / "photos").mkdir()
    files = sorted(
        p
        for p in source.rglob("*")
        if p.is_file()
        and not p.is_symlink()
        and p.suffix.lower() in SUPPORTED
        and not any(x.startswith(".") for x in p.relative_to(source).parts)
    )
    if not files:
        raise ValueError("No supported photographs found")
    entries, failures = [], []
    for index, path in enumerate(files, 1):
        try:
            digest = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
            photo_id = f"p{index:04d}-{digest}"
            image = open_photo(path)
            width, height = image.size
            image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
            rel = f"photos/{photo_id}.jpg"
            image.save(output / rel, quality=90, optimize=True)
            entries.append(
                {
                    "id": photo_id,
                    "src": rel,
                    "original": str(path),
                    "width": width,
                    "height": height,
                    "reviewed": False,
                    "scene": "",
                    "motifs": [],
                }
            )
        except Exception as error:
            failures.append({"file": str(path), "error": str(error)})
    sheets = []
    for offset in range(0, len(entries), 20):
        batch = entries[offset : offset + 20]
        sheet = Image.new("RGB", (2100, 4 * 370), "#f2eee5")
        draw = ImageDraw.Draw(sheet)
        for slot, entry in enumerate(batch):
            x, y = (slot % 5) * 420, (slot // 5) * 370
            with Image.open(output / entry["src"]) as image:
                thumb = ImageOps.contain(image, (396, 326), Image.Resampling.LANCZOS)
                sheet.paste(
                    thumb,
                    (
                        x + 12 + (396 - thumb.width) // 2,
                        y + 10 + (326 - thumb.height) // 2,
                    ),
                )
            draw.text((x + 12, y + 341), entry["id"], fill="#28382f")
            entry["sheet"] = f"contact-{offset//20+1:03d}.jpg"
        name = f"contact-{offset//20+1:03d}.jpg"
        sheet.save(output / name, quality=93)
        sheets.append(name)
    manifest = {
        "photos": entries,
        "contactSheets": sheets,
        "failures": failures,
        "inputCount": len(files),
    }
    (output / "review.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    )
    print(
        json.dumps(
            {
                "photos": len(entries),
                "sheets": len(sheets),
                "failed": len(failures),
                "review": str(output / "review.json"),
            },
            ensure_ascii=False,
        )
    )
    if failures:
        raise ValueError(
            "Some images could not be decoded; review.json records each failure. Resolve them before claiming complete review."
        )
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("photos")
    parser.add_argument("output")
    args = parser.parse_args()
    try:
        prepare(args.photos, args.output)
    except (ValueError, OSError) as error:
        parser.exit(1, f"{error}\n")
