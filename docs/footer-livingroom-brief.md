# Brief: cozy living-room props for the Zend footer

The website footer shows a happy cartoon girl on a purple sofa (attached: `girl-sofa.png`, 818 × 386 px). We want to turn that into a **cozy living room** by adding four props around the sofa. Each prop is a **separate PNG**, so the website can place and animate it on its own.

| File | Prop | Size (px, transparent canvas) |
|---|---|---|
| `room-lamp.png` | Floor lamp (stands left of the sofa) | 220 × 480 |
| `room-plant.png` | Potted plant (stands right of the sofa) | 260 × 360 |
| `room-rug.png` | Round/oval rug (on the floor, under the sofa) | 900 × 140 |
| `room-frame.png` | Small framed picture (hangs on the wall above the sofa) | 180 × 140 |

## Rules for every prop

1. **Match the art exactly:** the same style as the attached sofa picture, with bold black cartoon outlines, flat cel shading and the same line thickness.
2. **Same scale:** draw each prop at the right size *next to that sofa*, as if they were in the same room. The sofa in the picture is about 592 px wide and 220 px tall.
3. **Palette:** stay in the Zend family, with purples, lilac (#C38FF8, #B163FE), warm white and a touch of warm yellow for light. The plant may use soft green, but keep it muted so purple stays the main colour.
4. **One prop per file:** transparent background (PNG with alpha), with nothing else on the canvas: no floor, no wall, no shadow outside the prop, no text.
5. **Front view:** the same straight-on camera angle as the sofa.

### Base prompt (start every request with this and attach `girl-sofa.png`)

```
Use the attached image only as the STYLE and SCALE reference: same bold black cartoon outlines, flat cel shading, line thickness and colour feel as the purple sofa. Draw ONLY the object described below, on its own, front view, at a size that matches the sofa in the reference as if they were in the same living room. Transparent background (PNG with alpha). No floor, no wall, no ground shadow, no text, no people.
```

## Prop prompts

**1. `room-lamp.png` (220 × 480)**
```
OBJECT: a tall modern floor lamp. Slim dark-purple stand on a round base, and a soft lilac drum lampshade on top. The shade glows warmly from inside, with a light warm-yellow tint at its bottom edge. It is a little taller than the sofa's back.
```

**2. `room-plant.png` (260 × 360)**
```
OBJECT: a potted monstera plant in a round lilac ceramic pot with a thin dark-purple rim. Large split leaves in muted soft green with dark outlines, a few leaves leaning outward. Roughly as tall as the sofa's back.
```

**3. `room-rug.png` (900 × 140)**
```
OBJECT: a flat oval rug seen from the front (so it looks like a wide, thin ellipse lying on the floor). Soft lilac with a darker purple border and a simple pattern of small Zend-arrow shapes. Short tassels on the left and right ends.
```

**4. `room-frame.png` (180 × 140)**
```
OBJECT: a small framed picture hanging on a wall. Thin dark-purple frame with a cream mat. Inside: a simple purple Zend-style arrow logo (a bold rounded "Z" arrow with a small dot at its top right), centred. Slightly rotated, about 2 degrees.
```

## How to check

- Put each prop next to the sofa picture: it should look like it belongs in the same drawing (same outline weight, same shading, sensible size).
- No white halos or edges around the transparent background.

Put all four PNGs in `assets/img/girl-sofa/` with exactly these file names.
