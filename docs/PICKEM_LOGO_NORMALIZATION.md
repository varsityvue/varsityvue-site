# Pick ’Em logo normalization

Pick ’Em uses generated logo derivatives so transparent padding and inconsistent
source canvases do not control the visible size of a school mark. Original assets
in `public/logos/schools/` remain unchanged. Generated transparent PNGs live in
`public/logos/schools/pickem/` and are used only by Pick ’Em.

## Algorithm

Each source is decoded with Sharp and converted to RGBA. Pixels with alpha of at
least 8/255 define the visible bounds; fractional alpha values define effective
ink area. The script crops to those measured bounds, preserves aspect ratio, and
calculates a hybrid occupied-area metric:

`sqrt(effective alpha area × visible bounding-box area)`

The mark is scaled toward a hybrid-area target of 18,000 pixels. A 156-pixel
minimum longest edge prevents dense compact crests from becoming conspicuously
small, while 176-pixel maximum width and height caps contain wide and tall marks.
The result is centered without cropping on a 192×192 transparent canvas, leaving
at least eight pixels of safety padding. Lanczos3 resizing and lossless RGBA PNG
output preserve edge quality, transparency, aspect ratio, and source colors.

Dark-logo contrast remains separate centralized Pick ’Em display metadata; it is
not baked into the generated images.

## Commands

Normalize every registered school logo:

```bash
npm run normalize:pickem-logos
```

Normalize one or more school slugs:

```bash
npm run normalize:pickem-logos -- winters jacksboro
```

Run focused normalization tests:

```bash
npm run test:pickem-logos
```

The command is deterministic and idempotent: unchanged outputs are reported as
`unchanged` and are not rewritten. Unknown slugs, missing/corrupt assets, and
assets without usable visible pixels fail with an explicit error.
