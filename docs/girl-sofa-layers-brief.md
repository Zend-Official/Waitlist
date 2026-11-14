# Brief: split the Zend footer "girl on the sofa" into 2 animation layers

You will receive **one image**: a happy cartoon girl (curly hair in a high puff, gold hoop earrings, lilac jacket over a white Zend top, purple trousers, sneakers) sitting on a purple sofa. She's laughing with her eyes closed and hugging a purple "Vox Bags" bag. The sofa has two lilac cushions and a pink blanket draped over its right arm.

## Goal

Split the picture into **two layers** so the website can animate the girl on her own:
- every few seconds she gives a happy **giggle bounce**
- now and then she **squeezes the bag** a little tighter

The sofa stays still while she moves. When both layers are stacked (sofa first, girl on top), they must look **exactly like the original image**.

## Rules for both layers

1. **Same canvas:** both layers use exactly the original image's size, with a transparent background (PNG with alpha).
2. **Same position:** don't move, resize, rotate or crop anything. Each part stays exactly where it is in the original, so the layers line up perfectly.
3. **Same art:** keep the identical style (bold black cartoon outlines, flat cel shading), colours, proportions and details: the Zend logo on her top, the "Vox Bags" label, earrings, hair, laces, cushions and blanket.
4. **Nothing extra:** no ground shadow, text or new objects.

### Base prompt (start both requests with this, and attach the original image)

```
Use the attached image as the exact reference. Keep the identical art style (bold black cartoon outlines, flat cel shading), the same colours, proportions and scale, and the exact same position on the same canvas size. Do not move, resize, redraw or restyle anything. Transparent background (PNG with alpha). No shadows on the ground, no text, no extra objects.

I need ONLY one layer of this picture, for animation, so it can be stacked with the other layer and line up perfectly:
```

---

## Layer 1: `girl-sofa-sofa.png` (the sofa, without the girl)

```
LAYER: the sofa only, with the girl completely removed.
Keep the purple sofa exactly as it is: both arms, the back, the seat, the legs, the two lilac cushions and the pink blanket over the right arm.
Where the girl was sitting, paint the empty sofa naturally: the seat cushions, the backrest and the inner sides of the arms, continuing their shapes, colours, outlines and shading, so there is NO hole or gap where she was.
Remove her completely, including her feet and sneakers in front of the sofa: paint the sofa's front and legs behind them.
```

## Layer 2: `girl-sofa-girl.png` (the girl, without the sofa)

```
LAYER: the girl only, with the sofa removed.
Keep her exactly as she is: hair puff, face, earrings, jacket, top with the Zend logo, the Vox Bags bag in her arms, trousers and sneakers.
Remove the sofa, cushions and blanket. Where the sofa covered parts of her (for example behind her back, under her legs, or her lower back and hips against the seat), paint those parts of her naturally (jacket, trousers) so she is complete, with NO holes, as if she were sitting on an invisible seat.
```

---

## How to check the result

- Put `girl-sofa-girl.png` on top of `girl-sofa-sofa.png`: it must look identical to the original, with no visible edges, lines or halos.
- Hide the girl layer: the sofa must look complete and empty, with no hole where she sat.
- Move the girl layer up by a few pixels: nothing on the sofa should show a gap.

Send both PNGs back with exactly these file names. Place them in `assets/img/` with the original as `girl-sofa.png`.
