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
        data = {
            "title": 'Test <memory> "shop"',
            "photos": [
                {"id": f"p{i}", "src": f"photo-{i}.jpg", "reviewed": True}
                for i in range(3)
            ],
            "artworks": arts,
            "gifts": [
                dict(
                    id="print",
                    kind="print",
                    name="A print",
                    artwork="a0",
                    description="Study",
                    material="paper",
                ),
                dict(
                    id="bowl",
                    kind="bowl",
                    name="A bowl",
                    artwork="a0",
                    description="Study",
                    material="ceramic",
                ),
            ],
        }
        self.arrange(data)
        return data

    def arrange(self, data):
        placements = [
            dict(
                type=f"card-{i}",
                fixture="paper",
                at=[
                    -(min(25, len(data["artworks"])) - 1) * 0.115 + (i % 25) * 0.23,
                    0.3 + (i // 25) * 0.40,
                    0.05,
                ],
                scale=0.8,
                wall=True,
            )
            for i in range(len(data["artworks"]))
        ]
        types = ["memory-" + g.get("id", g["kind"]) for g in data["gifts"]] + [
            "craft-" + c["slug"] for c in data.get("crafts", [])
        ]
        if data.get("book"):
            types.append("journey-photobook")
        for i, t in enumerate(types):
            placements.append(
                dict(
                    type=t,
                    fixture="table",
                    at=[-1.6 + i % 6 * 0.62, 0.84, -0.9 + (i // 6) * 0.55],
                    variation=0.16,
                )
            )
        data["scene"] = dict(
            seed="test-source-9",
            concept="An open paper and ceramic study shop",
            evidence=[
                dict(
                    photo="p0",
                    observation="Fictional blue shape",
                    decisions=["Blue walls and low object tables"],
                )
            ],
            room=dict(
                width=8,
                depth=8,
                height=3.4,
                wall="#596f77",
                floor="#aa9c7e",
                ceiling="#ece7d8",
                trim="#ba905d",
                floorPattern="planks",
            ),
            fixtures=[
                dict(
                    id="paper",
                    kind="card-rack",
                    at=[0, 0, -3.65],
                    size=[6.2, 2.3, 0.3],
                    levels=5,
                ),
                dict(id="table", kind="table", at=[0, 0, 0], size=[4, 0.83, 2.6]),
            ],
            placements=placements,
            views=dict(
                overview=dict(
                    pos=[0, 1.65, 3.4],
                    target=[0, 1.2, -1],
                    title="Overview",
                    copy="A test shop",
                ),
                cards=dict(
                    pos=[0, 1.6, -2.7],
                    target=[0, 1, -3.65],
                    title="Cards",
                    copy="Test prints",
                ),
            ),
        )

    def build(self, data, name="site"):
        m = self.root / "input.json"
        m.write_text(json.dumps(data))
        builder.build(m, self.root / name)
        return self.root / name

    def validate(self, site):
        p = subprocess.run(
            ["node", str(SKILL / "scripts/validate_shop.mjs"), str(site)],
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(p.returncode, 0, p.stderr)
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
        self.assertEqual(report["personal"], 2)
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
        self.arrange(data)
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

    def test_no_automatic_room_or_assortment(self):
        for field in ["scene", "gifts"]:
            data = self.manifest()
            del data[field]
            with self.assertRaises(ValueError):
                self.build(data, "missing-" + field)

    def test_multiple_designs_per_family_and_extended_forms(self):
        data = self.manifest()
        data["gifts"] = [
            dict(
                id=f"design-{i}",
                kind=k,
                name=k,
                artwork="a0",
                description="Source-derived test",
                material="test",
            )
            for i, k in enumerate(
                [k for k in builder.KINDS if k != "custom"] + ["vase"]
            )
        ]
        self.arrange(data)
        result = self.validate(self.build(data))
        self.assertEqual(result["personal"], len(data["gifts"]))
        self.assertEqual(result["hanging"], 0)

    def test_curated_wall_can_be_small_and_aisle_must_connect(self):
        data = self.manifest(12)
        data["scene"]["placements"] = [
            p
            for p in data["scene"]["placements"]
            if not p.get("wall") or p["type"] == "card-0"
        ]
        self.assertEqual(
            self.validate(self.build(data, "sparse"))["uniquePostcards"], 1
        )
        data["scene"]["fixtures"].append(
            dict(id="barrier", kind="plinth", at=[0, 0, 2.2], size=[8, 1, 0.3])
        )
        site = self.build(data, "blocked")
        result = subprocess.run(
            ["node", str(SKILL / "scripts/validate_shop.mjs"), str(site)],
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Connected aisle", result.stderr)

    def test_invalid_layout_fails_before_copy(self):
        cases = []
        data = self.manifest()
        data["scene"]["placements"][0]["fixture"] = "missing"
        cases.append(data)
        data = self.manifest()
        data["scene"]["room"]["width"] = float("nan")
        cases.append(data)
        data = self.manifest()
        data["scene"]["placements"].append(data["scene"]["placements"][0].copy())
        cases.append(data)
        data = self.manifest()
        data["scene"]["evidence"][0]["photo"] = "unknown"
        cases.append(data)
        data = self.manifest()
        data["gifts"].append(data["gifts"][0].copy())
        cases.append(data)
        for i, data in enumerate(cases):
            with self.subTest(i=i), self.assertRaises(ValueError):
                self.build(data, f"invalid-{i}")
            self.assertFalse((self.root / f"invalid-{i}").exists())

    def custom_manifest(self):
        data = self.manifest(1)
        data["customModule"] = "products.js"
        data["customFiles"] = {"custom/motif.js": "motif.js"}
        (self.root / "products.js").write_text(
            "import {make} from './custom/motif.js'; export function buildCustomProduct(g,d){ if(d.model!=='sculpture')return false; make(g,d); return true; } export function decorateShop(){}"
        )
        (self.root / "motif.js").write_text(
            "import {roundBlock,enamel,splitRing} from '../craft.js'; export function make(g,d){ const o=roundBlock(g,.17,.12,.03,0,.09,0,enamel('#287c78')); o.userData.sourcePhoto=d.sourcePhoto; splitRing(g,0,.22,0); g.userData.customMakerRan=true; }"
        )
        data["gifts"] = [
            dict(
                id="key",
                kind="keychain",
                family="keychain",
                model="sculpture",
                name="Authored key",
                artwork="a0",
                description="Sculpted test",
                material="enamel",
                construction="Layered body",
                designDifferences=["volume", "assembly"],
            )
        ]
        data["artworks"][0].update(treatment="illustration", medium="gouache")
        self.arrange(data)
        return data

    def test_authored_model_dispatches_for_normal_kind_and_packages_helpers(self):
        data = self.custom_manifest()
        data["gifts"][0]["preview"] = "art-0.png"
        site = self.build(data)
        report = self.validate(site)
        self.assertEqual(report["authoredModels"], 1)
        self.assertEqual(report["postcardDesigns"], 1)
        self.assertTrue((site / "custom/motif.js").is_file())
        c = json.loads((site / "collection.json").read_text())
        self.assertEqual(c["gifts"][0]["family"], "keychain")
        self.assertTrue((site / c["gifts"][0]["preview"]).is_file())
        self.assertEqual(c["artworks"][0]["treatment"], "illustration")
        # If dispatch silently falls through, an unsupported model used to pass as a flat keychain.
        data["gifts"][0]["model"] = "missing-maker"
        bad = self.build(data, "unimplemented")
        r = subprocess.run(
            ["node", str(SKILL / "scripts/validate_shop.mjs"), str(bad)],
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("Authored product has no maker", r.stderr)

    def test_custom_module_cannot_overwrite_runtime_and_model_requires_module(self):
        data = self.custom_manifest()
        data["customFiles"] = {"../gallery.js": "motif.js"}
        with self.assertRaisesRegex(ValueError, "customFiles"):
            self.build(data)
        self.assertFalse((self.root / "site").exists())
        data = self.custom_manifest()
        del data["customModule"]
        with self.assertRaisesRegex(ValueError, "Authored models"):
            self.build(data)

    def test_quality_audit_rejects_raw_photo_shortcuts_and_stale_evidence(self):
        audit = module("audit_collection")
        data = self.manifest(1)
        data["brief"] = {"scope": "pilot", "artDirection": "stylized"}
        data["artworks"][0]["src"] = "photo-0.jpg"
        site = self.build(data)
        report = audit.audit(site, final=True)
        self.assertFalse(report["mechanicalChecksPassed"])
        self.assertTrue(any("raw source" in x for x in report["errors"]))
        self.assertTrue(report["visualReviewRequired"])
        # Render manifests are bound to every module and image, not just collection.json.
        digest = audit.site_digest(site)
        review = self.root / "review"
        review.mkdir()
        items = [
            dict(type=p["type"], geometryHash=p["type"])
            for p in data["scene"]["placements"]
        ]
        (review / "render-report.json").write_text(
            json.dumps(
                dict(
                    siteDigest=digest,
                    complete=True,
                    items=items,
                    errors=[],
                    scenes=[],
                    sheets=[],
                )
            )
        )
        self.assertTrue(audit.audit(site, review)["evidenceCurrent"])
        (site / "custom-shop.js").write_text("// changed model")
        report = audit.audit(site, review)
        self.assertFalse(report["evidenceCurrent"])
        self.assertTrue(any("stale" in x for x in report["errors"]))

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
