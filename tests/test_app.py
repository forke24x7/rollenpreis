import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

class PackagingTests(unittest.TestCase):
    def test_offline_assets_exist(self):
        worker = (ROOT / 'static/sw.js').read_text()
        assets = re.search(r'const ASSETS = \[(.*?)\];', worker).group(1)
        for asset in re.findall(r"'\./([^']*)'", assets):
            if asset:
                self.assertTrue((ROOT / 'static' / asset).is_file(), asset)

    def test_manifest_icons_have_correct_sizes(self):
        manifest = json.loads((ROOT / 'static/manifest.webmanifest').read_text())
        self.assertEqual(manifest['display'], 'standalone')
        for icon in manifest['icons']:
            data = (ROOT / 'static' / icon['src']).read_bytes()
            self.assertEqual(data[:8], b'\x89PNG\r\n\x1a\n')
            self.assertEqual(int.from_bytes(data[16:20], 'big'), int(icon['sizes'].split('x')[0]))

    def test_app_and_image_version_match(self):
        version = re.search(r"APP_VERSION = '([^']+)'", (ROOT / 'static/version.js').read_text()).group(1)
        self.assertIn('ARG APP_VERSION=' + version, (ROOT / 'Dockerfile').read_text())

if __name__ == '__main__':
    unittest.main()
