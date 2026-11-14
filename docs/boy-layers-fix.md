# Fix request: Zend boy animation layers

Thank you. The 20 layers are the right size (1452 × 1452), transparent, correctly named, and they stack back into the originals pixel-perfectly.

**One rule was missed: rule 5, "paint the hidden parts".** The layers are straight cut-outs. Wherever a head or arm was removed, the BODY layer is empty underneath. On the website the head tilts and the arms move a little, and those empty areas show as holes.

Measured: **0% of the area under each head and arm has body painted beneath it.** It should be 100% wherever the part overlaps the body.

## What to redo

**Only the BODY layers need fixing.** Keep the heads, arms, eyes, bag, box front and phone layers as they are.

| File | Paint in (under the removed parts) |
|---|---|
| `boy-worried-body.png` | Neck base and collar; the right shoulder and the sweatshirt chest/sleeve area where the phone arm was; the left shoulder where the forehead arm was |
| `boy-wink-body.png` | Neck base and collar; the shoulder and sweatshirt side where the raised phone arm was |
| `boy-packing-body.png` | Neck base and collar; both shoulders; the whole sweatshirt chest and stomach where the arms and bag were; the **back and inside of the cardboard box** (the box itself is missing from this layer) and the lap behind it |
| `boy-peace-body.png` | Neck base and collar; both shoulders and the sweatshirt sides where the peace arm and phone arm were |

### Prompt to use (attach the ORIGINAL pose image and the current body layer)

```
Use the attached original image as the exact reference for style, colours, scale and position (1452×1452 px canvas, transparent background). The second attached image is the current BODY layer; its head and arms were cut out, leaving holes.

Repaint the BODY layer so it is complete underneath the removed parts, as if the head and arms were not there: draw the neck base and collar, both shoulders, and the full white sweatshirt (with its folds and shading) where the arms and head used to cover it. [For packing: also draw the full cardboard box including its back and inside, and the lap behind it.] Extend these painted areas about 40 px beyond where the removed parts' edges were, so nothing shows when the parts move slightly.

Keep everything that is already visible in the body layer exactly the same: same lines, colours, logo and position. Do not draw the head, the arms, the bag or the phone. Transparent background.
```

## Check before sending back

1. **Hole test:** open each new body layer alone on a coloured background. There should be no gaps at the neck, shoulders, chest, or (for packing) the box.
2. **Stack test:** stack it with the other layers of the pose (unchanged). It must still look identical to the original image.
