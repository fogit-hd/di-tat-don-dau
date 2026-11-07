"""Source-pixel wardrobe registration shared by the local asset builders."""
from pathlib import Path
from PIL import Image, ImageDraw
import math

ART = Path(__file__).resolve().parents[1] / 'frontend/public/assets/duck-race'
BILL = {(170, 127, 56), (236, 198, 135), (103, 67, 9), (37, 23, 0)}
# Native pupil centres, including the closed left eye in the leaning run cel.
EYES = {
    'idle': [((27.5, 35.5), (35.5, 35.5)), ((27.5, 34.5), (35.5, 34.5)),
             ((27.5, 35.5), (35.5, 35.5)), ((27.5, 36.5), (35.5, 36.5))],
    'walk_run': [((27.5, 36.5), (35.5, 36.5)), ((29.5, 35.5), (37, 35.5)),
                 ((27.5, 38), (33.5, 36.5)), ((29.5, 35.5), (37, 35.5))],
    'take_damage': [((26, 33.5), (34, 33.5)), ((30, 33.5), (38, 33.5))],
    'fall': [((32, 25), (41, 25))],
    'knockout': [None, ((30, 33.5), (38, 33.5))],
    'land': [((23.5, 42), (42.5, 42)), ((25.5, 35.5), (36.5, 35.5))],
    'crouch': [((24, 42), (41, 42)), ((24, 42), (41, 42))],
    'air': [((32, 25), (41, 25)), ((32, 24), (41, 24))],
}


def fitted_glasses(item, pose, frame, body):
    """Bind each original lens to its pupil; bridge length follows the pose."""
    eyes = EYES[pose][frame]
    result = Image.new('RGBA', (64, 64))
    draw = ImageDraw.Draw(result)
    rim = '#9e702e' if item == 'brass' else '#38343c'
    strap = '#68472b'
    if eyes is None:
        # This native knockout cel faces away. Only the rear strap is visible.
        draw.line([(23, 38), (28, 37), (37, 37), (40, 38)], fill=strap)
    else:
        left_eye, right_eye = eyes
        angle = math.degrees(math.atan2(right_eye[1] - left_eye[1], right_eye[0] - left_eye[0]))
        flattened = pose == 'crouch' or pose == 'land' and frame == 0
        width, height = (6, 2) if flattened else (7, 7) if pose in ('fall', 'air') else (6, 6)
        draw.line([(round(left_eye[0] - 7), round(left_eye[1] + 2)),
                   (round(left_eye[0] - 3), round(left_eye[1]))], fill=strap)
        draw.line([tuple(round(v) for v in left_eye), tuple(round(v) for v in right_eye)], fill=rim)
        source = Image.open(ART / f'experience-v4/gear-{item}.webp').convert('RGBA')
        crops = [(43, 3, 97, 56), (106, 3, 158, 56)] if item == 'brass' else [(40, 3, 97, 55), (105, 3, 158, 55)]
        for eye, crop in zip(eyes, crops):
            lens = source.crop(crop).resize((width, height), Image.Resampling.NEAREST)
            layer = Image.new('RGBA', (64, 64))
            layer.alpha_composite(lens, (round(eye[0] - (width - 1) / 2), round(eye[1] - (height - 1) / 2)))
            if angle and not flattened:
                layer = layer.rotate(-angle, Image.Resampling.NEAREST, center=eye)
            result.alpha_composite(layer)
    for y in range(64):
        for x in range(64):
            pixel = body.getpixel((x, y))
            if pixel[3] and pixel[:3] in BILL:
                result.putpixel((x, y), (0, 0, 0, 0))
    return result


def fitted_crown(image, cx, base, width=12, height=6, angle=0):
    """Approved three-point crown and curved forehead band, in native pixels."""
    shape = Image.new('RGBA', (64, 64))
    draw = ImageDraw.Draw(shape)

    def point(x, y):
        return round(cx + x * width / 12), round(base + y * height / 6)

    draw.polygon([point(-6, -1), point(-6, -5), point(-3, -3), point(0, -6),
                  point(3, -3), point(6, -5), point(6, -1), point(3, 1),
                  point(-3, 1)], fill='#e6b844', outline='#644219')
    draw.line([point(-5, -3), point(-3, -2), point(0, -4), point(3, -2), point(5, -3)], fill='#ffe8a3')
    draw.line([point(-5, -1), point(-3, 0), point(3, 0), point(5, -1)], fill='#a96d24')
    draw.line([point(-4, -1), point(0, 0), point(4, -1)], fill='#ffdb73')
    draw.point(point(0, -1), fill='#bc4338')
    if angle:
        shape = shape.rotate(angle, Image.Resampling.NEAREST, center=(cx, base))
    image.alpha_composite(shape)
