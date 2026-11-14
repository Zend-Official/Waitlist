# Brief: split the Zend "boy" illustrations into animation layers

You will receive **four images** of the same cartoon character (a young man in a white Zend sweatshirt, dark joggers, glasses, sitting cross-legged). Each image is one pose:

| File you receive | Pose |
|---|---|
| `boy-worried.png` | Worried: one hand on his forehead, phone in the other hand |
| `boy-wink.png` | Winking and smiling: phone held up, other hand resting on his knee |
| `boy-packing.png` | Happy: both hands putting a purple bag into a cardboard box on his lap, phone on the floor |
| `boy-peace.png` | Big smile: one hand making a peace sign, phone in the other hand |

Each image is **1452 × 1452 px, PNG, transparent background**.

## Goal

Split every pose into separate **layers** (body, head, arms, eyes closed, …) so a website can animate the parts: blinking, head tilts, arms lifting the phone, the peace hand wiggling, the bag being pushed into the box.

When all the layers of a pose are stacked in order, they must look **exactly like the original image**.

---

## Rules for every layer (apply to all prompts)

1. **Same canvas:** every layer is **1452 × 1452 px**, transparent background, PNG with alpha.
2. **Same position:** do not move, resize, rotate or crop anything. Each part stays exactly where it is in the original, so the layers line up perfectly when stacked.
3. **Same art:** keep the identical style (bold black cartoon outlines, flat cel shading), the same colours, proportions and details: the purple Zend logo on the sweatshirt and joggers, the glasses, earring, hair, shoelaces and phone.
4. **One part per layer:** each layer contains only the part named, with nothing else in it. No shadows, ground, text or extra objects.
5. **Paint the hidden parts (very important):** where a removed part covered something (for example an arm in front of the shoulder, or the head over the neck), paint the covered area naturally so there are **no holes or gaps** when that part moves a little. This applies above all to the shoulders, the neck base, the sweatshirt behind the arms, the forehead under a hand, and the inside of the box.
6. **Eyes-closed layers:** draw only the eye area (eyes and the glasses lenses over them) with the eyes closed. Keep the same brows and expression, placed exactly over the open eyes so it covers them when shown.

### Base prompt (start every request with this, and attach the original pose image)

```
Use the attached image as the exact reference. Keep the identical art style (bold black cartoon outlines, flat cel shading), the same character, same colours, same proportions, same scale and the exact same position on a 1452×1452 px canvas. Do not move, resize, redraw or restyle anything. Transparent background (PNG with alpha). No shadows on the ground, no text, no extra objects.

I need ONLY one layer of this character, for animation, so it can be placed back on top of the other layers and line up perfectly:
```

Then add one of the layer prompts below.

---

## Pose 1 — Worried (`boy-worried.png`)

Stacking order, bottom to top: **body → phone arm → head → eyes closed → forehead arm**

**`boy-worried-body.png`**
```
Layer: BODY ONLY. Keep the torso (white sweatshirt with the purple logo), legs, joggers and sneakers. REMOVE the head, the arm touching the forehead, and the arm holding the phone. Where those parts covered the body, paint the hidden parts naturally: complete the neck base, both shoulders and the sweatshirt underneath, so there are no holes when the arms and head move.
```

**`boy-worried-head.png`**
```
Layer: HEAD ONLY, including hair, glasses, ears, earring and neck down to the collar. REMOVE the hand on the forehead and paint the forehead and hair underneath it complete. Worried expression, eyes open. Nothing else.
```

**`boy-worried-arm-forehead.png`**
```
Layer: ONLY the arm and hand that rests on the forehead, from the shoulder to the fingertips, exactly as in the reference. Nothing else.
```

**`boy-worried-arm-phone.png`**
```
Layer: ONLY the arm holding the phone, from the shoulder to the hand, including the phone. Nothing else.
```

**`boy-worried-eyes.png`**
```
Layer: ONLY the eye area (eyes and the glasses lenses over them), with the eyes CLOSED (a soft curved line, same worried brows). Same position as the open eyes so it covers them exactly. Nothing else.
```

---

## Pose 2 — Wink (`boy-wink.png`)

Stacking order, bottom to top: **body → head → eyes closed → phone arm**

**`boy-wink-body.png`**
```
Layer: BODY ONLY. Torso, legs, joggers, sneakers and the hand resting on the knee. REMOVE the head and the arm holding the phone up. Paint the hidden shoulder, neck base and sweatshirt underneath completely, no holes.
```

**`boy-wink-head.png`**
```
Layer: HEAD ONLY, including hair, glasses, ears, earring, neck down to the collar. Same winking, smiling expression. Nothing else.
```

**`boy-wink-arm-phone.png`**
```
Layer: ONLY the raised arm holding the phone, from the shoulder to the hand, including the phone. Nothing else.
```

**`boy-wink-eyes.png`**
```
Layer: ONLY the eye area with BOTH eyes closed in a happy smile (curved lines), same position as the eyes in the reference so it covers them exactly. Nothing else.
```

---

## Pose 3 — Packing (`boy-packing.png`)

Stacking order, bottom to top: **body (with box) → head → eyes closed → arms + bag → box front → phone on floor**

**`boy-packing-body.png`**
```
Layer: BODY ONLY. Torso, legs, joggers, sneakers and the cardboard box (keep the box). REMOVE the head, both arms and the purple bag. Paint the hidden shoulders, neck base, sweatshirt and the inside/back of the box completely, no holes.
```

**`boy-packing-head.png`**
```
Layer: HEAD ONLY, including hair, glasses, ears, earring, neck down to the collar, looking down with a happy smile. Nothing else.
```

**`boy-packing-arms-bag.png`**
```
Layer: ONLY both arms, both hands and the purple bag they are holding, exactly as in the reference. Nothing else (no box, no body).
```

**`boy-packing-box-front.png`**
```
Layer: ONLY the front flaps and front side of the cardboard box, so the bag can sink behind them. Nothing else.
```

**`boy-packing-phone.png`**
```
Layer: ONLY the phone lying on the floor. Nothing else.
```

**`boy-packing-eyes.png`**
```
Layer: ONLY the eye area with eyes closed (looking down, happy), same position as the eyes in the reference so it covers them exactly. Nothing else.
```

---

## Pose 4 — Peace sign (`boy-peace.png`)

Stacking order, bottom to top: **body → phone arm → head → eyes closed → peace arm**

**`boy-peace-body.png`**
```
Layer: BODY ONLY. Torso, legs, joggers, sneakers. REMOVE the head, the arm making the peace sign, and the arm holding the phone. Paint the hidden shoulders, neck base and sweatshirt underneath completely, no holes.
```

**`boy-peace-head.png`**
```
Layer: HEAD ONLY, including hair, glasses, ears, earring, neck down to the collar. Same big happy smile. Nothing else.
```

**`boy-peace-arm-peace.png`**
```
Layer: ONLY the arm and hand making the peace sign, from the shoulder to the fingertips. Nothing else.
```

**`boy-peace-arm-phone.png`**
```
Layer: ONLY the arm holding the phone, from the shoulder to the hand, including the phone. Nothing else.
```

**`boy-peace-eyes.png`**
```
Layer: ONLY the eye area with both eyes closed in a happy smile, same position as the eyes in the reference so it covers them exactly. Nothing else.
```

---

## Deliverables

21 PNG files in total, all **1452 × 1452 px with transparent backgrounds**, named exactly as above:

| Pose | Files |
|---|---|
| Worried | `boy-worried-body.png`, `boy-worried-head.png`, `boy-worried-arm-forehead.png`, `boy-worried-arm-phone.png`, `boy-worried-eyes.png` |
| Wink | `boy-wink-body.png`, `boy-wink-head.png`, `boy-wink-arm-phone.png`, `boy-wink-eyes.png` |
| Packing | `boy-packing-body.png`, `boy-packing-head.png`, `boy-packing-arms-bag.png`, `boy-packing-box-front.png`, `boy-packing-phone.png`, `boy-packing-eyes.png` |
| Peace | `boy-peace-body.png`, `boy-peace-head.png`, `boy-peace-arm-peace.png`, `boy-peace-arm-phone.png`, `boy-peace-eyes.png` |

Do **not** crop the layers to their content; keep the full canvas so they line up. (The website crops and compresses them automatically.)

## Quality check before handing over

For each pose:

1. **Stack test:** place all of the pose's layers on top of each other in the stacking order above, on a 1452 × 1452 canvas at 0,0. The result must look identical to the original image: no shifted edges, double outlines or gaps.
2. **Hole test:** hide the head layer, then each arm layer, one at a time. The body underneath must be fully painted, with no transparent holes at the neck, shoulders or sweatshirt.
3. **Detail check:** compare against the original. The Zend logos, glasses, earring, hair, shoelaces and phone must be unchanged. AI tools sometimes alter small details, so redo any layer that differs.
4. **Eyes check:** turn the eyes-closed layer on and off over the head. It must cover the open eyes completely and sit in exactly the same place.
5. **Transparency check:** every file has a transparent background, with no white or grey box around the part.

If a layer will not line up after generation, cut it out of the original image manually (lasso or pen tool in Figma or Photopea). Then use inpainting only to paint the hidden areas underneath.
