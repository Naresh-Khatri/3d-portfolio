# Keyboard assets

`keycaps.glb` is the reusable geometry kit extracted from the existing Chibi
keyboard demo export. Child 0 is the centered keycap; children 1–9 form a
nine-slice case. Portfolio's scene generator places and scales these pieces.
The file has no skill content and needs no hosted Spline scene.

The local monochrome brand SVGs were copied from the existing keyboard logo
collection or downloaded from `https://thesvg.org/icons/<slug>/mono.svg`.
`aws.svg` came from Simple Icons 13.21.0 (`amazonwebservices.svg`). Files have
explicit 512×512 dimensions for browser texture loading and white artwork.
Preserve transparency and viewBox when replacing them. Existing HTML skill
icons remain configured separately in `src/data/constants.ts`.

`bongo-frame-1.png` and `bongo-frame-2.png` are the unchanged embedded PNGs
from the `frame-1` and `frame-2` objects in `../skills-keyboard.spline`. Both
are 457×289 and retain their original transparency. They are alternated as
scene planes, rather than decoded as a GIF or rebuilt as geometry.

`../../fonts/helvetiker_regular.typeface.json` serves Archivo Black at the
fixed font URL expected by Chibi 0.4.0. The TTF is the original Spline font;
its OFL license is included under `public/fonts/`. Regenerate the typeface and
heading metrics with `python scripts/prepare-keyboard-font.py` using fontTools.

Run `node scripts/extract-bongo-frames.mjs` to re-extract the original PNGs and
write `bongo-frames.glb`. The GLB wraps those images in two flat quads with
`KHR_materials_unlit`, retaining the illustration's colors under scene lighting.
Its child paths 0 and 1 are the animation frames. No cat shape is modeled.
