# Brief (v2): animation layers for the Zend hero girl, made by EDITING the originals

**Why a v2:** the first layers were drawn as new pictures. They came back as flat rectangles of skin with hard edges, sitting in the wrong places, and the "hands" layers showed trousers. That approach can't work. These layers must be made by **editing the original image** (inpainting / generative fill / "edit a selected area"), so everything outside the edited area stays pixel-for-pixel the same.

## The two originals

| File | Pose | Canvas |
|---|---|---|
| `girl-worried.png` | Worried, frowning at her phone | 2314 × 2002 px |
| `girl-happy.png` | Happy, smiling at her phone | 2064 × 1876 px |

## Method (use it for every layer)

1. Open the **original** image in an editor that can edit a selected area: Photoshop Generative Fill, Firefly, Krea/Leonardo "edit", or any inpainting tool.
2. **Select (mask) only the area named below**: a soft, generous selection around it. Don't select the rest of the picture.
3. Run the edit prompt below. The tool repaints only the selected area to match the surrounding art.
4. Export the **full edited image**: the whole picture at the same size, NOT a cut-out. It's fine to export the full picture, because the website takes just the changed area from it automatically.

So each file you send back is **the complete original picture with one small change**.

### Style line (add to every prompt)

```
Match the existing illustration exactly: same bold black cartoon outlines and line thickness, flat cel shading, same skin tone, eyeliner and lashes. Change nothing outside the selected area.
```

---

## Worried pose (`girl-worried.png`)

**`girl-worried-eyes.png`: blink**
Select both eyes and their lids (not the eyebrows).
```
Her eyes are closed in a natural blink: smooth closed upper lids with lashes along the lid line, the same worried expression. Keep the eyebrows exactly as they are.
```

**`girl-worried-frown.png`: frown harder**
Select both eyebrows and the skin between them (not the hair, not the eyes).
```
Her eyebrows pulled slightly lower and closer together in a deeper worried frown, with a small crease between them. Eyes unchanged.
```

**`girl-worried-tap-left.png` and `girl-worried-tap-right.png`: typing**
Select her hands on the phone, the phone screen area and a little around them (not the sleeves).
```
LEFT version: her left thumb is pressing on the phone screen as if typing, the right thumb resting. Same hands, same grip, same phone.
RIGHT version: her right thumb is pressing on the phone screen as if typing, the left thumb resting.
```

## Happy pose (`girl-happy.png`)

**`girl-happy-eyes.png`: blink**
Select both eyes and their lids (not the eyebrows).
```
Her eyes are closed in a happy blink: curved, smiling closed lids with lashes, the same happy expression. Eyebrows unchanged.
```

**`girl-happy-tap-left.png` and `girl-happy-tap-right.png`: typing**
Select her hands, the phone and a little around them (not the sleeves or trousers).
```
LEFT version: her left thumb is pressing on the phone screen as if typing, the right thumb resting. Same hands, same grip, same phone.
RIGHT version: her right thumb is pressing on the phone screen as if typing, the left thumb resting.
```

---

## Check before sending (please do all of these)

- [ ] Each file is the **whole picture**, the same size as its original (2314×2002 or 2064×1876).
- [ ] Flip between the original and the edit: **only the selected area changes**. No square or rectangular patches, no hard edges, no colour shift around it.
- [ ] Eyes layers: the eyebrows haven't moved and the eyes are fully closed.
- [ ] Tap layers: they show **hands and a thumb on the phone**, and the LEFT and RIGHT files are different.

Save them in `assets/hero/` with exactly these names (they replace the first versions).
