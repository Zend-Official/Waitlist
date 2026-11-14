# Brief: Zend security shield, as an animatable SVG

## What this is

The **security shield** illustration from the Zend website's "Safe for buyers. Sure for sellers" section. It sits inside a phone mock-up, on a card captioned "Payment secured".

**Reference image:** `security-shield-reference.png`, attached.

The website will animate it:
- the shield pops in;
- the two orbit rings slowly spin;
- the dots travel round the rings;
- a soft glow pulses.

To make that possible, I need the illustration **redrawn as a clean vector SVG with each part in its own named group**, instead of one flat picture.

## What's in the reference

1. **Shield**
   - Classic shield shape: flat-ish top with a slight point in the middle, curving to a point at the bottom.
   - Split vertically into two tones: **left half `#7303FB`**, **right half `#5603C9`**.
   - Thick dark outline: **`#2F0850`**.
   - A small light highlight arc in the top-left corner (soft lilac, about `#B98CFF`).
   - The **white Zend logo** in the centre (`#FFFFFF`). Use the exact Zend mark if you have it: the stylised "Z" with a small dot top-right.
2. **Two orbit rings**
   - Two thin ellipses crossing each other in an X behind the shield, like an atom symbol.
   - Light purple stroke, about **`#B57CF7`**, around 4% of the illustration's width.
   - Each ring passes **behind** the shield, so only its left and right ends show.
3. **Dots**
   - **Four dots** (`#7303FB`), one at each visible end of the rings: top-left, bottom-left, top-right, bottom-right.
   - **One extra floating dot**, slightly larger, near the top-right of the shield.

## What to deliver

**One SVG file:** `security-shield.svg`

- **viewBox `0 0 470 340`**, the same proportions as the reference. Keep the drawing centred like the reference.
- **Flat vector shapes only.** No embedded images (no `<image>` or base64), no filters, no masks if avoidable, no text elements (draw the logo as paths).
- Colours as given above, as solid fills and strokes.
- **These exact group ids**, in this order from bottom to top:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 340">
  <g id="ring-a"> … first ellipse (stroke only, no fill) … </g>
  <g id="ring-b"> … second ellipse (stroke only, no fill) … </g>
  <g id="dots-a"> … the 2 dots that sit on ring A … </g>
  <g id="dots-b"> … the 2 dots that sit on ring B … </g>
  <g id="dot-float"> … the extra floating dot (top-right) … </g>
  <g id="shield">
    <g id="shield-left">  … left half, fill #7303FB … </g>
    <g id="shield-right"> … right half, fill #5603C9 … </g>
    <g id="shield-outline"> … the dark #2F0850 outline … </g>
    <g id="shield-shine"> … the small highlight arc … </g>
    <g id="shield-logo"> … the white Zend logo … </g>
  </g>
</svg>
```

### Important details

- **Draw each ring as a full ellipse.** Use one `<ellipse>`, or a single path, rotated with a `transform` such as `rotate(25 235 170)`. Draw the whole ring, not just the visible ends. The shield sits on top and hides the middle, and the website rotates the rings, so they must be complete.
- **Rotate both rings around the shield's centre, about (235, 170).** That way, spinning them keeps them around the shield.
- **Put each dot exactly on its ring's line,** so when a ring spins, its dots ride along with it.
- **Draw the shield's two halves as two shapes meeting at the vertical centre line,** with the outline drawn once on top of both.
- **Keep it simple and light:** aim for under 6 KB.

## Check before delivering

1. Opened in a browser, it should look like the reference image: same shapes, colours and layout.
2. Hide `#shield`: both rings must be **complete ellipses**, crossing in the middle.
3. Each group id above exists and contains only its part.
4. No `<image>`, `<filter>` or `<text>` elements anywhere in the file.
