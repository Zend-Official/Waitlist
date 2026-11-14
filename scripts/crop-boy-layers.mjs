// Crops each boy animation layer (1452x1452 canvas) to its visible area and
// records where it sits, so phones only decode the pixels that exist.
// Input:  src/assets/sellers/layers/*.png
// Output: src/assets/sellers/parts/*.png + src/data/boy-parts.json
// Run: node scripts/crop-boy-layers.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const IN = 'src/assets/sellers/layers';
const OUT = 'src/assets/sellers/parts';
const CANVAS = 1452;
const PAD = 2;

fs.mkdirSync(OUT, { recursive: true });
const parts = {};
for (const file of fs.readdirSync(IN).filter((f) => f.endsWith('.png')).sort()) {
  const { data, info } = await sharp(path.join(IN, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 4) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
  // Same alpha clean-up as the other illustrations: near-opaque -> opaque.
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] >= 245) data[i] = 255;
    else if (data[i] <= 4) data[i] = 0;
  }
  const left = Math.max(0, x0 - PAD), top = Math.max(0, y0 - PAD);
  const width = Math.min(info.width, x1 + PAD + 1) - left, height = Math.min(info.height, y1 + PAD + 1) - top;
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left, top, width, height })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, file));
  parts[file.replace('.png', '')] = { x: left, y: top, w: width, h: height };
  console.log(file.padEnd(32), `${width}x${height} at ${left},${top}`);
}
fs.writeFileSync('src/data/boy-parts.json', JSON.stringify({ canvas: CANVAS, parts }, null, 2) + '\n');
