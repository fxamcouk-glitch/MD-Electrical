// pdf.js needs its standard fonts, CMaps, ICC profiles and wasm decoders at runtime
// to render CAD exports and scanned plans correctly. Copy them next to the app.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules', 'pdfjs-dist');
const to = join(root, 'public', 'pdfjs');

for (const dir of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  const src = join(from, dir);
  if (!existsSync(src)) continue;
  mkdirSync(join(to, dir), { recursive: true });
  cpSync(src, join(to, dir), { recursive: true });
}
