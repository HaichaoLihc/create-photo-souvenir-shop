#!/usr/bin/env python3
"""Audit assortment and render evidence. Passing is NOT an aesthetic certification."""
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path

MINIMUM = {
    "keychain": (12, 24),
    "magnet": (8, 20),
    "pin": (8, 20),
    "postcard": (12, 24),
    "plate": (8, 16),
    "dish": (8, 16),
    "wall-art": (6, 6),
    "tablecloth": (2, 2),
    "notebook": (6, 12),
    "pen": (6, 18),
    "coaster": (8, 16),
}
ALIASES = {
    "pins": "pin",
    "postcards": "postcard",
    "print": "wall-art",
    "journal": "notebook",
    "coasters": "coaster",
}
PAPER = {"postcard", "wall-art", "notebook", "tablecloth"}


def site_digest(root):
    digest = hashlib.sha256()

    def visit(directory):
        for f in sorted(directory.iterdir(), key=lambda x: x.name):
            if f.name.startswith(".") or f.name == "node_modules":
                continue
            if f.is_symlink():
                raise ValueError("Review inputs cannot be symlinks")
            if f.is_dir():
                visit(f)
            elif f.suffix.lower() in {
                ".js",
                ".json",
                ".html",
                ".css",
                ".png",
                ".jpg",
                ".jpeg",
                ".webp",
                ".svg",
            }:
                digest.update(f.relative_to(root).as_posix().encode())
                digest.update(f.read_bytes())

    visit(root)
    return digest.hexdigest()


def audit(site, review=None, final=False):
    site = Path(site).resolve()
    c = json.loads((site / "collection.json").read_text())
    brief = c.get("brief", {})
    errors = []
    warnings = []
    types = {}
    art = {a["id"]: a for a in c["artworks"]}
    for g in c["gifts"]:
        family = g.get("family", ALIASES.get(g["kind"], g["kind"]))
        types["memory-" + g.get("id", g["kind"])] = (family, g)
    for i, a in enumerate(c["artworks"]):
        types["card-" + str(i)] = ("postcard", {"artwork": a["id"]})
    stock = Counter()
    designs = defaultdict(set)
    paper_art = set()
    for p in c["scene"]["placements"]:
        if p["type"] not in types:
            continue
        family, g = types[p["type"]]
        stock[family] += 1
        # One postcard illustration listed both as a gift and as card-N is one design.
        identity = g.get("artwork") if family == "postcard" else p["type"]
        designs[family].add(identity)
        if family in PAPER:
            paper_art.add(g["artwork"])
    required = brief.get("requiredFamilies", list(MINIMUM))
    if final and brief.get("scope", "full") == "full":
        for family in required:
            if family not in MINIMUM:
                errors.append("Unknown required family: " + family)
                continue
            n, s = MINIMUM[family]
            if len(designs[family]) < n or stock[family] < s:
                errors.append(
                    f"{family}: {len(designs[family])} designs/{stock[family]} stock; minimum {n}/{s}"
                )
    photos = {p["id"]: p["src"] for p in c["photos"]}
    unchanged = [a["id"] for a in c["artworks"] if a["src"] == photos.get(a["photo"])]
    interpreted = [
        a
        for a in paper_art
        if art[a].get("treatment")
        in ["illustration", "pattern", "photographic-collage"]
    ]
    media = sorted({art[a].get("medium", "") for a in interpreted} - {""})
    if final and brief.get("artDirection", "stylized") == "stylized" and paper_art:
        if len(interpreted) / len(paper_art) < 0.7:
            errors.append(
                "Fewer than 70% of paper/textile artworks are declared authored illustration/collage/pattern; inspect the actual images"
            )
        if len(paper_art) >= 12 and len(media) < 3:
            errors.append(
                "Fewer than three declared art media across the print collection"
            )
        if any(a in paper_art for a in unchanged):
            errors.append("A raw source photo is used as finished stylized print art")
    duplicates = []
    evidence = False
    if review:
        review = Path(review).resolve()
        r = json.loads((review / "render-report.json").read_text())
        evidence = r.get("siteDigest") == site_digest(site)
        if not evidence:
            errors.append("Render evidence is stale: the site changed; rerender")
        if not r.get("complete"):
            errors.append("Only a subset of placed designs was rendered")
        if r.get("errors"):
            errors.append("Browser errors were recorded")
        wanted = {p["type"] for p in c["scene"]["placements"]}
        if wanted != {i["type"] for i in r["items"]}:
            errors.append("Rendered inventory differs from placed inventory")
        for filename in r["scenes"] + r["sheets"]:
            f = (review / filename).resolve()
            if not f.is_relative_to(review) or not f.is_file():
                errors.append("Missing review image: " + filename)
        groups = defaultdict(list)
        for item in r["items"]:
            if item["type"] not in types:
                continue
            family = types[item["type"]][0]
            if family not in PAPER:
                groups[(family, item["geometryHash"])].append(item["type"])
        duplicates = [v for v in groups.values() if len(v) > 1]
        if duplicates:
            errors.append(
                "Exact normalized solid geometry repeats across design IDs; redesign or count as stock: "
                + str(duplicates)
            )
        if final and len(r["scenes"]) < 3:
            errors.append(
                "Need at least entry, cross-aisle and reverse rendered scene views"
            )
    elif final:
        errors.append("Missing actual-model render evidence; run render_review.mjs")
    if unchanged:
        warnings.append("Unchanged source artwork IDs: " + ", ".join(unchanged))
    warnings.append(
        "Source links, medium labels and counts are declarations; open the images to judge faithful photo interpretation, design quality and near-duplicates."
    )
    return {
        "mechanicalChecksPassed": not errors,
        "visualReviewRequired": True,
        "evidenceCurrent": evidence,
        "counts": {
            k: {"designs": len(designs[k]), "stock": stock[k]} for k in sorted(stock)
        },
        "printArtworks": len(paper_art),
        "declaredInterpretedPrints": len(interpreted),
        "declaredMedia": media,
        "exactSolidDuplicates": duplicates,
        "errors": errors,
        "warnings": warnings,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site")
    parser.add_argument("--review")
    parser.add_argument("--final", action="store_true")
    args = parser.parse_args()
    result = audit(args.site, args.review, args.final)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result["mechanicalChecksPassed"] else 1)
