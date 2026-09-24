import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills/create-photo-souvenir-shop"


def module(name):
    spec = importlib.util.spec_from_file_location(
        name, SKILL / "scripts" / f"{name}.py"
    )
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj


prepare = module("prepare_photos").prepare
builder = module("build_shop")
split = module("split_atlas").split


class SouvenirShopTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def image(self, name, index=0, size=(120, 200)):
        p = self.root / name
        p.parent.mkdir(parents=True, exist_ok=True)
        image = Image.new("RGB", size, (20 + index % 200, 80, 130))
        ImageDraw.Draw(image).text((10, 10), str(index), fill="white")
        image.save(p)
        return p

    def manifest(self, count=3):
        for i in range(3):
            self.image(f"photo-{i}.jpg", i)
        arts = []
        for i in range(count):
            self.image(f"art-{i}.png", i)
            arts.append(
                {
                    "id": f"a{i}",
                    "photo": f"p{i%3}",
                    "src": f"art-{i}.png",
                    "title": f"Form {i}",
                    "scene": f"Fictional test shape {i}",
                    "style": ["paper", "pencil", "print"][i % 3],
                }
            )
        return {
            "title": 'Test <memory> "shop"',
            "photos": [
                {"id": f"p{i}", "src": f"photo-{i}.jpg", "reviewed": True}
                for i in range(3)
            ],
            "artworks": arts,
        }

    def build(self, data, name="site"):
        m = self.root / "input.json"
        m.write_text(json.dumps(data))
        builder.build(m, self.root / name)
        return self.root / name

    def validate(self, site):
        p = subprocess.run(
            ["node", str(SKILL / "scripts/validate_shop.mjs"), str(site)],
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(p.stdout)

    def test_review_paginates_every_input_and_rotates_exif(self):
        photos = self.root / "input"
        photos.mkdir()
        for i in range(21):
            self.image(f"input/{i:02}.jpg", i)
        original = Image.new("RGB", (30, 60), "red")
        exif = original.getexif()
        exif[274] = 6
        original.save(photos / "21.jpg", exif=exif)
        review = prepare(photos, self.root / "review")
        self.assertEqual(len(review["photos"]), 22)
        self.assertEqual(len(review["contactSheets"]), 2)
        self.assertEqual(len({p["id"] for p in review["photos"]}), 22)
        self.assertTrue(all(not p["reviewed"] for p in review["photos"]))
        with Image.open(self.root / "review" / review["photos"][-1]["src"]) as image:
            self.assertEqual(image.size, (60, 30))
        with Image.open(photos / "21.jpg") as image:
            self.assertEqual(image.size, (30, 60))
        (photos / "bad.jpg").write_text("not a photograph")
        with self.assertRaises(ValueError):
            prepare(photos, self.root / "review-errors")
        self.assertEqual(
            len(
                json.loads((self.root / "review-errors/review.json").read_text())[
                    "failures"
                ]
            ),
            1,
        )

    def test_small_collection_builds_without_book_or_crafts(self):
        site = self.build(self.manifest())
        report = self.validate(site)
        self.assertEqual(report["uniquePostcards"], 3)
        self.assertEqual(report["personal"], 10)
        self.assertGreaterEqual(report["photoDerivedPercent"], 70)
        data = (site / "collection.json").read_text()
        self.assertNotIn(str(self.root), data)
        self.assertFalse((site / "assets/demo").exists())
        with self.assertRaisesRegex(ValueError, "already exists"):
            self.build(self.manifest())
        self.assertTrue((site / "index.html").exists())

    def test_full_collection_models_and_optional_book(self):
        data = self.manifest(100)
        self.image("book/cover.png", 4, (300, 200))
        self.image("book/back.png", 5, (300, 200))
        (self.root / "book/index.html").write_text(
            "<!doctype html><html><body><h1>Fixture book</h1></body></html>"
        )
        (self.root / "book/private.zip").write_bytes(b"not needed")
        data["book"] = {
            "directory": "book",
            "index": "index.html",
            "cover": "cover.png",
            "back": "back.png",
            "name": "Test book",
            "description": "Book fixture",
            "sourcePhoto": "p0",
        }
        data["crafts"] = [
            {
                "slug": slug,
                "name": slug,
                "description": "Fictional fixture, not a real photo claim",
                "material": "enamel",
                "motif": "fixture motif",
                "sourcePhoto": "p0",
                "preview": "art-0.png",
            }
            for slug in builder.MODELS
        ]
        data["gifts"] = [
            {
                "kind": "magnet",
                "name": "Shaped magnet",
                "artwork": "a0",
                "description": "A shape",
                "material": "Enamel",
                "outline": [[0, 0], [1, 0], [0.8, 0.8], [0.5, 1], [0, 0.6]],
            }
        ]
        atlas = Image.new("RGBA", (400, 400), (0, 0, 0, 0))
        ImageDraw.Draw(atlas).ellipse((5, 5, 395, 395), fill=(0, 120, 150, 255))
        atlas.save(self.root / "atlas.png")
        data["ornaments"] = {"src": "atlas.png", "photos": ["p0"] * 16}
        site = self.build(data)
        report = self.validate(site)
        self.assertEqual(report["uniquePostcards"], 100)
        self.assertEqual(report["personal"], 14)
        self.assertTrue(report["book"])
        self.assertFalse((site / "books/memory/private.zip").exists())
        self.assertEqual(
            (site / "books/memory/cover.png").read_bytes(),
            (self.root / "book/cover.png").read_bytes(),
        )
        self.assertIn(
            "travel-book-close", (site / "books/memory/index.html").read_text()
        )

    def test_bad_manifests_never_produce_partial_sites(self):
        cases = []
        data = self.manifest()
        data["photos"][0]["reviewed"] = False
        cases.append(data)
        data = self.manifest()
        data["artworks"][0]["photo"] = "missing"
        cases.append(data)
        data = self.manifest()
        data["artworks"][1]["src"] = data["artworks"][0]["src"]
        cases.append(data)
        data = self.manifest()
        data["palette"] = ["not-a-color"]
        cases.append(data)
        data = self.manifest()
        data["artworks"][0]["src"] = "https://example.com/private.png"
        cases.append(data)
        for i, data in enumerate(cases):
            with self.subTest(i=i), self.assertRaises(ValueError):
                self.build(data, f"bad-{i}")
            self.assertFalse((self.root / f"bad-{i}").exists())

    def test_atlas_crops_exact_tiles(self):
        atlas = Image.new("RGB", (500, 200))
        draw = ImageDraw.Draw(atlas)
        for i in range(10):
            draw.rectangle(
                (
                    (i % 5) * 100,
                    (i // 5) * 100,
                    (i % 5 + 1) * 100 - 1,
                    (i // 5 + 1) * 100 - 1,
                ),
                fill=(i * 20, 30, 50),
            )
        atlas.save(self.root / "atlas.png")
        split(self.root / "atlas.png", self.root / "tiles")
        for i in range(10):
            with Image.open(self.root / f"tiles/art-{i+1:02}.png") as tile:
                self.assertEqual(tile.size, (100, 100))
                self.assertEqual(tile.getpixel((50, 50)), (i * 20, 30, 50))


if __name__ == "__main__":
    unittest.main()
