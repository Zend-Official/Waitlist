// After `astro build`: write .br and .gz copies of text files in dist, so the
// VPS web server can send them pre-compressed (nginx: brotli_static/gzip_static).
// Brotli at max quality is ~10-15% smaller than on-the-fly gzip.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

const TEXT = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt', '.xml', '.webmanifest']);
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
let raw = 0;
let br = 0;
for (const f of walk('dist')) {
  if (!TEXT.has(extname(f)) || statSync(f).size < 1024) continue;
  const buf = readFileSync(f);
  const b = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
  writeFileSync(`${f}.br`, b);
  writeFileSync(`${f}.gz`, gzipSync(buf, { level: 9 }));
  raw += buf.length;
  br += b.length;
}
console.log(`precompress: ${(raw / 1024).toFixed(0)} KB of text -> ${(br / 1024).toFixed(0)} KB brotli`);
