"""Regression checks for eye alignment and the integrated fitted crown."""
from pathlib import Path
from PIL import Image
import json
import unittest
from duck_wardrobe_art import EYES

ART = Path(__file__).resolve().parents[1] / 'frontend/public/assets/duck-race'
ATLAS = Image.open(ART / 'experience-v4/cosmetics.png').convert('RGBA')
FRAMES = json.loads((ART / 'experience-v4/cosmetics.json').read_text())['frames']
RESULTS = ART / 'results-v1'
MANIFEST = json.loads((RESULTS / 'manifest.json').read_text())


def cel(image, frame, size, columns):
    x, y = frame % columns * size, frame // columns * size
    return image.crop((x, y, x + size, y + size))


class IntegratedWardrobe(unittest.TestCase):
    def test_lenses_cover_the_actual_native_eye_highlights(self):
        checked = 0
        for key, entry in FRAMES.items():
            item, pose, frame_text = key.split('/')
            if item not in ('brass', 'dark'):
                continue
            frame = int(frame_text)
            rect = entry['frame']
            overlay = ATLAS.crop((rect['x'], rect['y'], rect['x'] + 64, rect['y'] + 64))
            body = Image.open(ART / f'duckee/green/{pose}/{frame}.png').convert('RGBA')
            if EYES[pose][frame] is None:
                continue
            for y in range(64):
                for x in range(64):
                    if body.getpixel((x, y)) == (201, 237, 194, 255):
                        self.assertGreater(overlay.getpixel((x, y))[3], 0, (key, x, y))
                        checked += 1
        self.assertGreater(checked, 60)

    def test_back_facing_knockout_has_a_strap_instead_of_front_lenses(self):
        for item in ('brass', 'dark'):
            rect = FRAMES[f'{item}/knockout/0']['frame']
            overlay = ATLAS.crop((rect['x'], rect['y'], rect['x'] + 64, rect['y'] + 64))
            colours = {pixel[:3] for pixel in overlay.getdata() if pixel[3]}
            self.assertEqual(colours, {(104, 71, 43)})

    def test_final_crown_pose_matches_idle_with_every_colour_and_wardrobe_pair(self):
        for colour in MANIFEST['colors']:
            source = Image.open(RESULTS / colour / 'winner-coronation.png').convert('RGBA')
            idle = Image.open(RESULTS / colour / 'winner-crowned-idle.png').convert('RGBA')
            for scarf in ['', 'red', 'teal']:
                for glasses in ['', 'brass', 'dark']:
                    a, b = source.copy(), idle.copy()
                    for item in filter(None, [scarf, glasses]):
                        a.alpha_composite(Image.open(RESULTS / 'cosmetics' / item / 'winner-coronation.png').convert('RGBA'))
                        b.alpha_composite(Image.open(RESULTS / 'cosmetics' / item / 'winner-crowned-idle.png').convert('RGBA'))
                    self.assertEqual(cel(a, 39, 96, 8).tobytes(), cel(b, 0, 96, 4).tobytes(),
                                     (colour, scarf, glasses))

    def test_crown_is_fitted_and_source_body_scale_remains_fixed(self):
        sheet = next(sheet for sheet in MANIFEST['sheets'] if sheet['name'] == 'winner-coronation')
        self.assertEqual(sheet['columns'], 8)
        for frame in sheet['cels']:
            self.assertEqual(frame['foot'], [48, 88])
            self.assertLessEqual(frame['width'], 12)
            self.assertEqual(frame['height'], 6)
        self.assertEqual(sheet['cels'][-1]['crownBase'], [31, 31])


if __name__ == '__main__':
    unittest.main(verbosity=2)
