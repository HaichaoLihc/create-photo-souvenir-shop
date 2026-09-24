#!/usr/bin/env python3
"""Crop an evenly gridded image into individual artworks without changing their content."""
import argparse
from pathlib import Path
from PIL import Image


def split(source, output, columns=5, rows=2, inset=0):
    if columns < 1 or rows < 1 or inset < 0:
        raise ValueError("Invalid grid or inset")
    output = Path(output)
    output.mkdir(parents=True, exist_ok=False)
    with Image.open(source) as image:
        width, height = image.size
        for row in range(rows):
            for col in range(columns):
                bounds = (
                    round(col * width / columns) + inset,
                    round(row * height / rows) + inset,
                    round((col + 1) * width / columns) - inset,
                    round((row + 1) * height / rows) - inset,
                )
                if bounds[0] >= bounds[2] or bounds[1] >= bounds[3]:
                    raise ValueError("Inset is larger than a tile")
                image.crop(bounds).save(output / f"art-{row*columns+col+1:02d}.png")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source")
    parser.add_argument("output")
    parser.add_argument("--columns", type=int, default=5)
    parser.add_argument("--rows", type=int, default=2)
    parser.add_argument("--inset", type=int, default=0)
    args = parser.parse_args()
    split(args.source, args.output, args.columns, args.rows, args.inset)
