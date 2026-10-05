import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

import server


class WorkshopTests(unittest.TestCase):
    def test_edit_conflict_preserves_the_file(self):
        original = (server.ICON_DIR / "ramen.svg").read_text()
        edited = original.replace("<title>拉面</title>", "<title>热拉面</title>")
        with tempfile.TemporaryDirectory() as folder, patch.object(server, "ICON_DIR", Path(folder)):
            server.save_icon("ramen", original, None)
            server.save_icon("ramen", edited, original)
            with self.assertRaises(FileExistsError):
                server.save_icon("ramen", original, original)
            self.assertEqual((Path(folder) / "ramen.svg").read_text(), edited)
            with self.assertRaises(ValueError):
                server.save_icon("../outside", original, None)

    def test_export_contains_loadable_assets_in_both_appearances(self):
        for mode in ("duo", "mono"):
            with zipfile.ZipFile(io.BytesIO(server.export_ios(mode))) as archive:
                sets = [name for name in archive.namelist() if name.endswith(".imageset/Contents.json")]
                self.assertEqual(len(sets), len(list(server.ICON_DIR.glob("*.svg"))))
                for name in sets:
                    contents = json.loads(archive.read(name))
                    for image in contents["images"]:
                        source = archive.read(str(Path(name).parent / image["filename"])).decode()
                        root = server.validate(source)
                        self.assertGreater(len(list(root)), 1)
                    if mode == "duo":
                        light, dark = [archive.read(str(Path(name).parent / image["filename"])) for image in contents["images"]]
                        self.assertNotEqual(light, dark)

    def test_static_build_is_read_only_and_complete(self):
        with tempfile.TemporaryDirectory() as folder:
            server.build_site(folder)
            data = json.loads((Path(folder) / "api" / "icons").read_text())
            self.assertTrue(data["readonly"])
            self.assertEqual(len(data["icons"]), len(list(server.ICON_DIR.glob("*.svg"))))
            for mode in ("duo", "mono"):
                self.assertTrue(zipfile.is_zipfile(Path(folder) / "api" / f"MusubiIcons-{mode}.zip"))
            self.assertTrue((Path(folder) / "index.html").exists())

    def test_active_content_and_invalid_geometry_are_rejected(self):
        shell = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">{}</svg>'
        for child in ('<script>alert(1)</script>', '<path onclick="alert(1)"/>', '<image href="https://example.com/a.png"/>', '<path fill="url(https://example.com/a)"/>'):
            with self.assertRaises(ValueError):
                server.validate(shell.format(child))
        with self.assertRaises(ValueError):
            server.validate(shell.format("<path/>").replace("48 48", "0 48"))


if __name__ == "__main__":
    unittest.main()
