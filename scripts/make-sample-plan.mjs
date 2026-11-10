// Generates samples/Sample-House-Extension-Plans.pdf: a fictional, to-scale (1:50 @ A3)
// two-sheet architectural set for testing the plan markup tool. Re-run with:
//   node scripts/make-sample-plan.mjs
import { PDFDocument, StandardFonts, rgb, degrees, LineCapStyle } from 'pdf-lib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'samples', 'Sample-House-Extension-Plans.pdf');

// A3 landscape; 1 m on the ground = 20 mm on paper at 1:50.
const W = 1190.55;
const H = 841.89;
const S = 56.693; // pt per metre
const OX = 95;
const OY = 100;
const px = (x) => OX + x * S;
const py = (y) => OY + y * S;

const INK = rgb(0.06, 0.06, 0.06);
const EXISTING = rgb(0.36, 0.36, 0.36);
const FURN = rgb(0.58, 0.58, 0.58);
const DEMO = rgb(0.8, 0.1, 0.1);
const WHITE = rgb(1, 1, 1);
const BLUE = rgb(0.1, 0.35, 0.7);

// ── Sheet definitions (metres, origin = front-left corner of the house, y up = towards the garden) ──

const ground = {
  title: 'PROPOSED GROUND FLOOR PLAN',
  drawingNo: 'SAMPLE-GF-01',
  walls: [
    // existing house shell
    { a: [0, 0], b: [9, 0], t: 0.3, k: 'E' },
    { a: [0, 0], b: [0, 7.5], t: 0.3, k: 'E' },
    { a: [9, 0], b: [9, 7.5], t: 0.3, k: 'E' },
    { a: [0, 7.5], b: [2.4, 7.5], t: 0.3, k: 'E' },
    // existing internal
    { a: [2.4, 0], b: [2.4, 7.5], t: 0.11, k: 'E' },
    { a: [6, 0], b: [6, 4.5], t: 0.11, k: 'E' },
    { a: [2.4, 4.5], b: [9, 4.5], t: 0.11, k: 'E' },
    { a: [0, 6], b: [2.4, 6], t: 0.11, k: 'E' },
    // to be removed (steel beam over)
    { a: [2.4, 7.5], b: [9, 7.5], t: 0.3, k: 'D' },
    { a: [6, 4.5], b: [6, 7.5], t: 0.11, k: 'D' },
    // new build: side + rear extension
    { a: [9, 0], b: [15, 0], t: 0.3, k: 'N' },
    { a: [15, 0], b: [15, 11.5], t: 0.3, k: 'N' },
    { a: [15, 11.5], b: [0, 11.5], t: 0.3, k: 'N' },
    { a: [0, 11.5], b: [0, 7.5], t: 0.3, k: 'N' },
    { a: [9, 7.5], b: [15, 7.5], t: 0.11, k: 'N' },
    { a: [11.5, 0], b: [11.5, 7.5], t: 0.11, k: 'N' },
    { a: [9, 3.2], b: [11.5, 3.2], t: 0.11, k: 'N' },
    { a: [11.5, 3.6], b: [15, 3.6], t: 0.11, k: 'N' },
    { a: [13.3, 5.8], b: [15, 5.8], t: 0.11, k: 'N' },
    { a: [13.3, 5.8], b: [13.3, 7.5], t: 0.11, k: 'N' },
    { a: [10, 7.5], b: [10, 11.5], t: 0.11, k: 'N' },
  ],
  windows: [
    { o: 'h', at: 0, a: 3.0, b: 5.4 },
    { o: 'h', at: 0, a: 6.6, b: 8.4 },
    { o: 'h', at: 0, a: 12.3, b: 14.2 },
    { o: 'v', at: 0, a: 4.2, b: 5.4 },
    { o: 'v', at: 0, a: 8.6, b: 10.4 },
    { o: 'v', at: 15, a: 1.0, b: 2.6 },
    { o: 'v', at: 15, a: 4.6, b: 6.6 },
    { o: 'v', at: 15, a: 8.8, b: 10.8 },
    { o: 'h', at: 11.5, a: 1.0, b: 8.8, label: 'BIFOLD DOORS' },
    { o: 'h', at: 11.5, a: 11.0, b: 14.0 },
  ],
  openings: [
    { o: 'v', at: 10, a: 8.2, b: 10.8, t: 0.11 },
  ],
  doors: [
    { o: 'h', at: 0, a: 0.7, b: 1.7, hinge: 'a', sw: 1, t: 0.3 }, // front door
    { o: 'v', at: 2.4, a: 1.2, b: 2.1, hinge: 'a', sw: 1, t: 0.11 },
    { o: 'h', at: 4.5, a: 3.2, b: 3.8, hinge: 'a', sw: 1, t: 0.11 },
    { o: 'h', at: 4.5, a: 3.8, b: 4.4, hinge: 'b', sw: 1, t: 0.11 },
    { o: 'v', at: 6, a: 1.0, b: 1.9, hinge: 'a', sw: 1, t: 0.11 },
    { o: 'h', at: 0, a: 9.8, b: 10.8, hinge: 'a', sw: 1, t: 0.3 }, // side door
    { o: 'v', at: 9, a: 5.2, b: 6.1, hinge: 'a', sw: 1, t: 0.3 },
    { o: 'h', at: 3.2, a: 9.7, b: 10.6, hinge: 'a', sw: 1, t: 0.11 },
    { o: 'h', at: 7.5, a: 9.4, b: 10.3, hinge: 'a', sw: 1, t: 0.11 },
    { o: 'v', at: 11.5, a: 1.2, b: 2.1, hinge: 'a', sw: 1, t: 0.11 },
    { o: 'v', at: 11.5, a: 4.6, b: 5.5, hinge: 'a', sw: 1, t: 0.11 },
    { o: 'h', at: 5.8, a: 13.5, b: 14.3, hinge: 'a', sw: -1, t: 0.11 },
    { o: 'h', at: 6, a: 0.5, b: 1.3, hinge: 'a', sw: 1, t: 0.11 },
  ],
  rooms: [
    { n: 'HALL', x: 0, y: 0, w: 2.4, h: 3.6, cx: 1.2, cy: 2.6 },
    { n: 'LOUNGE', x: 2.4, y: 0, w: 3.6, h: 4.5 },
    { n: 'STUDY', x: 6, y: 0, w: 3, h: 4.5 },
        { n: 'WC', x: 0, y: 6, w: 2.4, h: 1.5, cx: 1.8, cy: 6.45, noArea: true },
    { n: 'DINING (EXISTING)', x: 2.4, y: 4.5, w: 3.6, h: 3, cx: 4.2, cy: 6.4 },
    { n: 'UTILITY (OLD KITCHEN)', x: 6, y: 4.5, w: 3, h: 3, cy: 5.7 },
    { n: 'BOOT ROOM', x: 9, y: 0, w: 2.5, h: 3.2 },
    { n: 'UTILITY / PLANT', x: 9, y: 3.2, w: 2.5, h: 4.3, cx: 10.4, cy: 4.6 },
    { n: 'HOME OFFICE', x: 11.5, y: 0, w: 3.5, h: 3.6, cx: 12.9, cy: 3.0 },
    { n: 'GUEST BEDROOM', x: 11.5, y: 3.6, w: 3.5, h: 2.2, cy: 5.35, cx: 12.95 },
    { n: 'EN-SUITE', x: 13.3, y: 5.8, w: 1.7, h: 1.7, cx: 14.15, cy: 6.3 },
    { n: 'KITCHEN / DINING / FAMILY', x: 0, y: 7.5, w: 10, h: 4, cx: 5.3, cy: 8.05 },
    { n: 'GARDEN ROOM / SNUG', x: 10, y: 7.5, w: 5, h: 4, cy: 10.7 },
  ],
  furniture: [
    // stairs
    { t: 'stairs', x: 0.35, y: 3.75, w: 1.7, h: 2.1, dir: 'UP' },
    // WC
    { t: 'rect', x: 0.6, y: 7.0, w: 0.4, h: 0.4 },
    { t: 'circle', x: 2.05, y: 7.2, r: 0.17 },
    // lounge
    { t: 'rect', x: 3.0, y: 2.7, w: 2.2, h: 0.9 },
    { t: 'rect', x: 5.6, y: 1.2, w: 0.3, h: 1.8 },
    { t: 'rect', x: 3.5, y: 0.9, w: 1.2, h: 0.7, dash: true },
    // study
    { t: 'rect', x: 6.3, y: 3.2, w: 2.2, h: 0.8 },
    { t: 'rect', x: 7.0, y: 2.6, w: 0.5, h: 0.5 },
    // utility (old kitchen)
    { t: 'rect', x: 6.2, y: 6.8, w: 0.6, h: 0.6 },
    { t: 'rect', x: 6.9, y: 6.8, w: 0.6, h: 0.6 },
    { t: 'rect', x: 7.6, y: 6.9, w: 1.2, h: 0.5 },
    { t: 'circle', x: 8.2, y: 7.15, r: 0.14 },
    // boot room bench
    { t: 'rect', x: 9.2, y: 0.4, w: 0.4, h: 1.6 },
    // office
    { t: 'rect', x: 14.0, y: 0.4, w: 0.8, h: 2.4 },
    { t: 'rect', x: 13.0, y: 1.2, w: 0.6, h: 0.6 },
    // guest bed
    { t: 'rect', x: 12.9, y: 3.8, w: 2.0, h: 1.1 },
    // en-suite
    { t: 'rect', x: 14.1, y: 6.75, w: 0.85, h: 0.7 },
    { t: 'rect', x: 13.5, y: 7.0, w: 0.35, h: 0.4 },
    // kitchen run + island + table
    { t: 'rect', x: 0.3, y: 8.0, w: 0.6, h: 3.1 },
    { t: 'rect', x: 0.9, y: 7.8, w: 2.4, h: 0.6 },
    { t: 'rect', x: 3.3, y: 9.2, w: 3.2, h: 1.0 },
    { t: 'circle', x: 4.2, y: 9.7, r: 0.2 },
    { t: 'rect', x: 7.0, y: 8.6, w: 2.4, h: 1.5 },
    ...[7.4, 8.2, 9.0].flatMap((x) => [
      { t: 'rect', x, y: 8.2, w: 0.4, h: 0.4 },
      { t: 'rect', x, y: 10.1, w: 0.4, h: 0.4 },
    ]),
    // snug
    { t: 'rect', x: 11.6, y: 8.0, w: 2.8, h: 0.9 },
    { t: 'rect', x: 12.3, y: 9.4, w: 1.4, h: 0.7 },
  ],
  markers: [
    { t: 'dashRect', x: 3.0, y: 8.3, w: 4.0, h: 2.2, label: 'ROOF LANTERN ABOVE' },
    { t: 'text', x: 5.4, y: 7.62, s: 'EXISTING REAR WALL & CHIMNEY BREAST REMOVED - NEW STEEL BEAM (S1) OVER', c: DEMO, size: 6.5 },
  ],
  dimsX: [
    { from: 0, to: 9, label: '9000' },
    { from: 9, to: 15, label: '6000' },
  ],
  dimsXTop: [
    { from: 0, to: 10, label: '10000' },
    { from: 10, to: 15, label: '5000' },
  ],
  dimsY: [
    { from: 0, to: 7.5, label: '7500' },
    { from: 7.5, to: 11.5, label: '4000' },
  ],
  notes: [
    '1. All dimensions in mm unless noted.',
    '2. Do not scale from this drawing.',
    '3. Existing walls shown grey; new walls black.',
    '4. Contractor to verify all dimensions on site.',
    '5. Roof lantern over kitchen: 4.0 x 2.2 m.',
    '6. Ceiling height in extension: 2.7 m (3.4 m to lantern).',
  ],
};

const first = {
  title: 'PROPOSED FIRST FLOOR PLAN',
  drawingNo: 'SAMPLE-FF-01',
  walls: [
    { a: [0, 0], b: [15, 0], t: 0.3, k: 'E' },
    { a: [15, 0], b: [15, 7.5], t: 0.3, k: 'N' },
    { a: [15, 7.5], b: [0, 7.5], t: 0.3, k: 'E' },
    { a: [0, 7.5], b: [0, 0], t: 0.3, k: 'E' },
    { a: [2.4, 0], b: [2.4, 7.5], t: 0.11, k: 'E' },
    { a: [2.4, 3.2], b: [15, 3.2], t: 0.11, k: 'E' },
    { a: [2.4, 4.4], b: [15, 4.4], t: 0.11, k: 'E' },
    { a: [7.2, 0], b: [7.2, 3.2], t: 0.11, k: 'E' },
    { a: [11.2, 0], b: [11.2, 3.2], t: 0.11, k: 'N' },
    { a: [4.6, 4.4], b: [4.6, 7.5], t: 0.11, k: 'E' },
    { a: [7.2, 4.4], b: [7.2, 7.5], t: 0.11, k: 'E' },
    { a: [11.2, 4.4], b: [11.2, 7.5], t: 0.11, k: 'N' },
    { a: [0, 6], b: [2.4, 6], t: 0.11, k: 'E' },
  ],
  windows: [
    { o: 'h', at: 0, a: 3.6, b: 6.0 },
    { o: 'h', at: 0, a: 8.2, b: 10.2 },
    { o: 'h', at: 0, a: 12.2, b: 14.2 },
    { o: 'h', at: 7.5, a: 8.2, b: 10.2 },
    { o: 'h', at: 7.5, a: 12.4, b: 13.6 },
    { o: 'h', at: 7.5, a: 5.4, b: 6.4 },
    { o: 'v', at: 0, a: 1.0, b: 2.2 },
    { o: 'v', at: 15, a: 1.0, b: 2.4 },
    { o: 'v', at: 15, a: 5.2, b: 6.4 },
  ],
  openings: [{ o: 'v', at: 2.4, a: 3.2, b: 4.4, t: 0.11 }],
  doors: [
    { o: 'h', at: 3.2, a: 3.2, b: 4.1, hinge: 'a', sw: -1, t: 0.11 },
    { o: 'h', at: 3.2, a: 8.0, b: 8.9, hinge: 'a', sw: -1, t: 0.11 },
    { o: 'h', at: 3.2, a: 12.0, b: 12.9, hinge: 'a', sw: -1, t: 0.11 },
    { o: 'h', at: 4.4, a: 2.9, b: 3.8, hinge: 'a', sw: 1, t: 0.11 },
    { o: 'h', at: 4.4, a: 5.6, b: 6.5, hinge: 'a', sw: 1, t: 0.11 },
    { o: 'h', at: 4.4, a: 7.9, b: 8.8, hinge: 'a', sw: 1, t: 0.11 },
    { o: 'h', at: 4.4, a: 12.0, b: 12.9, hinge: 'a', sw: 1, t: 0.11 },
    { o: 'h', at: 6, a: 0.5, b: 1.3, hinge: 'a', sw: -1, t: 0.11 },
  ],
  rooms: [
    { n: 'LANDING', x: 0, y: 0, w: 2.4, h: 3.2, cy: 1.6 },
        { n: 'AIRING CUPBOARD', x: 0, y: 6, w: 2.4, h: 1.5, cx: 1.6, cy: 6.85 },
    { n: 'MASTER BEDROOM', x: 2.4, y: 0, w: 4.8, h: 3.2 },
    { n: 'BEDROOM 2', x: 7.2, y: 0, w: 4, h: 3.2 },
    { n: 'BEDROOM 3', x: 11.2, y: 0, w: 3.8, h: 3.2 },
    { n: 'CORRIDOR', x: 2.4, y: 3.2, w: 12.6, h: 1.2, noArea: true, cx: 8.7 },
    { n: 'DRESSING', x: 2.4, y: 4.4, w: 2.2, h: 3.1, cy: 6.0 },
    { n: 'EN-SUITE', x: 4.6, y: 4.4, w: 2.6, h: 3.1, cy: 6.0 },
    { n: 'BEDROOM 4', x: 7.2, y: 4.4, w: 4, h: 3.1 },
    { n: 'FAMILY BATHROOM', x: 11.2, y: 4.4, w: 3.8, h: 3.1 },
  ],
  furniture: [
    { t: 'stairs', x: 0.35, y: 3.4, w: 1.7, h: 2.4, dir: 'DN' },
    // master bed, wardrobes
    { t: 'rect', x: 3.6, y: 0.9, w: 1.9, h: 2.1 },
    { t: 'rect', x: 2.6, y: 1.0, w: 0.5, h: 0.5 },
    { t: 'rect', x: 5.6, y: 1.0, w: 0.5, h: 0.5 },
    { t: 'rect', x: 6.4, y: 0.3, w: 0.6, h: 2.2 },
    // bed 2
    { t: 'rect', x: 8.6, y: 0.7, w: 1.6, h: 2.0 },
    { t: 'rect', x: 7.3, y: 0.3, w: 0.6, h: 1.8 },
    // bed 3
    { t: 'rect', x: 12.6, y: 0.7, w: 1.6, h: 2.0 },
    { t: 'rect', x: 11.3, y: 2.5, w: 1.0, h: 0.6 },
    // dressing
    { t: 'rect', x: 2.5, y: 4.6, w: 0.5, h: 2.8 },
    { t: 'rect', x: 4.0, y: 4.6, w: 0.5, h: 2.8 },
    // en-suite
    { t: 'rect', x: 5.4, y: 6.5, w: 1.6, h: 0.9 },
    { t: 'rect', x: 4.8, y: 4.6, w: 0.35, h: 0.45 },
    { t: 'circle', x: 6.8, y: 4.8, r: 0.17 },
    // bed 4
    { t: 'rect', x: 8.4, y: 5.4, w: 2.0, h: 1.6 },
    // bathroom
    { t: 'rect', x: 11.4, y: 6.7, w: 1.8, h: 0.7 },
    { t: 'rect', x: 14.2, y: 4.6, w: 0.35, h: 0.45 },
    { t: 'circle', x: 14.2, y: 5.6, r: 0.17 },
    // airing cupboard
    { t: 'rect', x: 1.5, y: 7.1, w: 0.7, h: 0.3 },
  ],
  markers: [
    {
      t: 'dashRect',
      x: 0,
      y: 7.5,
      w: 15,
      h: 4,
      label: 'SINGLE STOREY EXTENSION BELOW - FLAT ROOF WITH LANTERN',
    },
  ],
  dimsX: [
    { from: 0, to: 2.4, label: '2400' },
    { from: 2.4, to: 7.2, label: '4800' },
    { from: 7.2, to: 11.2, label: '4000' },
    { from: 11.2, to: 15, label: '3800' },
  ],
  dimsXTop: [],
  dimsY: [
    { from: 0, to: 3.2, label: '3200' },
    { from: 3.2, to: 4.4, label: '1200' },
    { from: 4.4, to: 7.5, label: '3100' },
  ],
  notes: [
    '1. All dimensions in mm unless noted.',
    '2. Do not scale from this drawing.',
    '3. Existing walls shown grey; new walls black.',
    '4. Hardwired smoke / heat alarms to be interlinked',
    '    (LD2 grade, mains with battery backup).',
    '5. Ceiling height 2.5 m.',
  ],
};

// ── Drawing helpers ─────────────────────────────────────────────────────

const doc = await PDFDocument.create();
doc.setTitle('Sample house extension - plans (fictional, for software testing)');
doc.setAuthor('Sample Architects Ltd (fictional)');
const font = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);

function draw(page, sheet, sheetNo, sheetCount) {
  const line = (x1, y1, x2, y2, o = {}) =>
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: o.t ?? 0.5,
      color: o.c ?? INK,
      dashArray: o.dash,
      lineCap: o.cap ?? LineCapStyle.Butt,
    });
  const text = (s, x, y, o = {}) => {
    const f = o.bold ? bold : font;
    const size = o.size ?? 8;
    const w = f.widthOfTextAtSize(s, size);
    const rot = o.rotate ?? 0;
    let tx = x;
    let ty = y;
    if (o.align === 'center') {
      if (rot === 90) ty = y - w / 2;
      else tx = x - w / 2;
    } else if (o.align === 'right') {
      tx = x - w;
    }
    page.drawText(s, { x: tx, y: ty, size, font: f, color: o.c ?? INK, rotate: rot ? degrees(rot) : undefined });
  };
  const rect = (x, y, w, h, o = {}) =>
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: o.fill,
      borderColor: o.stroke,
      borderWidth: o.bw ?? 0.5,
      borderDashArray: o.dash,
    });
  const arc = (cx, cy, r, from, to, o = {}) => {
    // pdf-lib's SVG paths are y-down; use (x, -y) and a counter-clockwise sweep flag of 0/1.
    const [x0, y0] = from;
    const [x1, y1] = to;
    const cross = (x0 - cx) * (y1 - cy) - (y0 - cy) * (x1 - cx);
    const sweep = cross > 0 ? 0 : 1;
    page.drawSvgPath(`M ${x0} ${-y0} A ${r} ${r} 0 0 ${sweep} ${x1} ${-y1}`, {
      x: 0,
      y: 0,
      borderColor: o.c ?? INK,
      borderWidth: o.t ?? 0.5,
      borderDashArray: o.dash,
    });
  };

  // Sheet border
  rect(20, 20, W - 40, H - 40, { stroke: INK, bw: 1.2 });

  // Walls
  for (const w of sheet.walls) {
    const [x1, y1] = [px(w.a[0]), py(w.a[1])];
    const [x2, y2] = [px(w.b[0]), py(w.b[1])];
    if (w.k === 'D') {
      line(x1, y1, x2, y2, { t: Math.max(1.2, w.t * S * 0.35), c: DEMO, dash: [5, 3] });
    } else {
      line(x1, y1, x2, y2, {
        t: w.t * S,
        c: w.k === 'E' ? EXISTING : INK,
        cap: LineCapStyle.Projecting,
      });
    }
  }

  // Openings, windows, doors cut through walls
  const cut = (o, at, a, b, t) => {
    if (o === 'h') rect(px(a), py(at) - (t * S) / 2 - 0.4, (b - a) * S, t * S + 0.8, { fill: WHITE, bw: 0 });
    else rect(px(at) - (t * S) / 2 - 0.4, py(a), t * S + 0.8, (b - a) * S, { fill: WHITE, bw: 0 });
  };
  for (const op of sheet.openings) {
    cut(op.o, op.at, op.a, op.b, op.t);
    const hw = (op.t * S) / 2;
    if (op.o === 'h') {
      line(px(op.a), py(op.at) - hw, px(op.a), py(op.at) + hw, { t: 0.8 });
      line(px(op.b), py(op.at) - hw, px(op.b), py(op.at) + hw, { t: 0.8 });
    } else {
      line(px(op.at) - hw, py(op.a), px(op.at) + hw, py(op.a), { t: 0.8 });
      line(px(op.at) - hw, py(op.b), px(op.at) + hw, py(op.b), { t: 0.8 });
    }
  }
  for (const win of sheet.windows) {
    const t = 0.3;
    cut(win.o, win.at, win.a, win.b, t);
    const hw = (t * S) / 2;
    if (win.o === 'h') {
      const [a, b, y] = [px(win.a), px(win.b), py(win.at)];
      for (const dy of [-hw, 0, hw]) line(a, y + dy, b, y + dy, { t: dy ? 0.7 : 0.4, c: BLUE });
      line(a, y - hw, a, y + hw, { t: 0.7, c: BLUE });
      line(b, y - hw, b, y + hw, { t: 0.7, c: BLUE });
      if (win.label) text(win.label, (a + b) / 2, y + hw + 3, { size: 6, align: 'center', c: BLUE });
    } else {
      const [a, b, x] = [py(win.a), py(win.b), px(win.at)];
      for (const dx of [-hw, 0, hw]) line(x + dx, a, x + dx, b, { t: dx ? 0.7 : 0.4, c: BLUE });
      line(x - hw, a, x + hw, a, { t: 0.7, c: BLUE });
      line(x - hw, b, x + hw, b, { t: 0.7, c: BLUE });
    }
  }
  for (const d of sheet.doors) {
    cut(d.o, d.at, d.a, d.b, d.t);
    const w = (d.b - d.a) * S;
    let hx;
    let hy;
    let ex;
    let ey;
    let lx;
    let ly;
    if (d.o === 'h') {
      hy = py(d.at);
      ey = hy;
      const hingeX = d.hinge === 'a' ? px(d.a) : px(d.b);
      hx = hingeX;
      ex = d.hinge === 'a' ? px(d.b) : px(d.a);
      lx = hx;
      ly = hy + d.sw * w;
    } else {
      hx = px(d.at);
      ex = hx;
      const hingeY = d.hinge === 'a' ? py(d.a) : py(d.b);
      hy = hingeY;
      ey = d.hinge === 'a' ? py(d.b) : py(d.a);
      ly = hy;
      lx = hx + d.sw * w;
    }
    line(hx, hy, lx, ly, { t: 0.9 });
    arc(hx, hy, w, [lx, ly], [ex, ey], { t: 0.4 });
  }

  // Furniture & fittings
  for (const f of sheet.furniture) {
    if (f.t === 'rect') rect(px(f.x), py(f.y), f.w * S, f.h * S, { stroke: FURN, bw: 0.6, dash: f.dash ? [3, 2] : undefined });
    else if (f.t === 'circle') page.drawCircle({ x: px(f.x), y: py(f.y), size: f.r * S, borderColor: FURN, borderWidth: 0.6 });
    else if (f.t === 'stairs') {
      rect(px(f.x), py(f.y), f.w * S, f.h * S, { stroke: FURN, bw: 0.6 });
      const n = Math.round(f.h / 0.25);
      for (let i = 1; i < n; i++) line(px(f.x), py(f.y) + (i * f.h * S) / n, px(f.x + f.w), py(f.y) + (i * f.h * S) / n, { t: 0.4, c: FURN });
      line(px(f.x + f.w / 2), py(f.y) + 4, px(f.x + f.w / 2), py(f.y + f.h) - 6, { t: 0.6, c: FURN });
      line(px(f.x + f.w / 2), py(f.y + f.h) - 6, px(f.x + f.w / 2) - 3, py(f.y + f.h) - 12, { t: 0.6, c: FURN });
      line(px(f.x + f.w / 2), py(f.y + f.h) - 6, px(f.x + f.w / 2) + 3, py(f.y + f.h) - 12, { t: 0.6, c: FURN });
      text(f.dir, px(f.x + f.w / 2), py(f.y) + 4, { size: 5.5, align: 'center', c: FURN });
    }
  }
  for (const m of sheet.markers) {
    if (m.t === 'dashRect') {
      rect(px(m.x), py(m.y), m.w * S, m.h * S, { stroke: BLUE, bw: 0.8, dash: [6, 3] });
      text(m.label, px(m.x + m.w / 2), py(m.y + m.h) - 10, { size: 6.5, align: 'center', c: BLUE });
    } else if (m.t === 'text') {
      text(m.s, px(m.x), py(m.y), { size: m.size, align: 'center', c: m.c });
    }
  }

  // Room labels
  for (const r of sheet.rooms) {
    const cx = px(r.cx ?? r.x + r.w / 2);
    const cy = py(r.cy ?? r.y + r.h / 2);
    text(r.n, cx, cy + 2, { size: 7.5, bold: true, align: 'center' });
    if (!r.noArea) text(`${(r.w * r.h).toFixed(1)} m²`, cx, cy - 7, { size: 6.5, align: 'center', c: rgb(0.35, 0.35, 0.35) });
  }

  // Dimensions
  const tick = (x, y) => line(x - 3, y - 3, x + 3, y + 3, { t: 0.7 });
  for (const [list, yPlan, below, extFrom] of [
    [sheet.dimsX, -0.45, true, 0],
    [sheet.dimsXTop, (sheet === ground ? 11.5 : 7.5) + 0.5, false, sheet === ground ? 11.5 : 7.5],
  ]) {
    for (const d of list) {
      const y = py(yPlan);
      line(px(d.from), y, px(d.to), y, { t: 0.5 });
      tick(px(d.from), y);
      tick(px(d.to), y);
      for (const x of [d.from, d.to]) line(px(x), py(extFrom) + (below ? -4 : 4), px(x), y + (below ? 3 : -3), { t: 0.3, c: FURN });
      text(d.label, (px(d.from) + px(d.to)) / 2, y + (below ? -9 : 3), { size: 7, align: 'center' });
    }
  }
  const total = sheet.dimsX.at(-1).to;
  {
    const y = py(-0.95);
    line(px(0), y, px(total), y, { t: 0.5 });
    tick(px(0), y);
    tick(px(total), y);
    line(px(0), py(-0.45) - 3, px(0), y + 3, { t: 0.3, c: FURN });
    line(px(total), py(-0.45) - 3, px(total), y + 3, { t: 0.3, c: FURN });
    text(String(total * 1000), (px(0) + px(total)) / 2, y - 9, { size: 7, align: 'center', bold: true });
  }
  {
    const x = px(-0.55);
    for (const d of sheet.dimsY) {
      line(x, py(d.from), x, py(d.to), { t: 0.5 });
      tick(x, py(d.from));
      tick(x, py(d.to));
      line(px(0) - 4, py(d.from), x - 3, py(d.from), { t: 0.3, c: FURN });
      line(px(0) - 4, py(d.to), x - 3, py(d.to), { t: 0.3, c: FURN });
      text(d.label, x - 3, (py(d.from) + py(d.to)) / 2, { size: 7, align: 'center', rotate: 90 });
    }
  }

  // ── Right-hand panel ──
  const PX = 970;
  const PW = W - 20 - 8 - PX;
  // north arrow
  const nx = PX + 30;
  const ny = H - 70;
  page.drawCircle({ x: nx, y: ny, size: 20, borderColor: INK, borderWidth: 0.8 });
  page.drawSvgPath(`M ${nx} ${-(ny + 18)} L ${nx - 8} ${-(ny - 14)} L ${nx} ${-(ny - 7)} L ${nx + 8} ${-(ny - 14)} Z`, {
    x: 0,
    y: 0,
    color: INK,
    borderColor: INK,
    borderWidth: 0.5,
  });
  text('N', nx, ny + 24, { size: 9, bold: true, align: 'center' });
  text('(REAR OF HOUSE = NORTH)', nx + 30, ny - 3, { size: 6, c: rgb(0.4, 0.4, 0.4) });

  // legend
  let y = H - 130;
  text('KEY', PX, y, { size: 8, bold: true });
  y -= 14;
  const key = (label, draw) => {
    draw(y);
    text(label, PX + 40, y - 2.5, { size: 7 });
    y -= 13;
  };
  key('Existing wall (retained)', (yy) => line(PX, yy, PX + 30, yy, { t: 4, c: EXISTING }));
  key('New build wall', (yy) => line(PX, yy, PX + 30, yy, { t: 4, c: INK }));
  key('Wall / structure to be removed', (yy) => line(PX, yy, PX + 30, yy, { t: 1.4, c: DEMO, dash: [5, 3] }));
  key('Window / glazed door', (yy) => {
    for (const d of [-2, 0, 2]) line(PX, yy + d, PX + 30, yy + d, { t: 0.7, c: BLUE });
  });
  key('Roof / lantern (above)', (yy) => line(PX, yy, PX + 30, yy, { t: 1, c: BLUE, dash: [6, 3] }));
  key('Fixed furniture / fittings (indicative)', (yy) => rect(PX, yy - 3, 30, 6, { stroke: FURN, bw: 0.7 }));

  // scale bar 0-3 m
  y -= 12;
  text('SCALE 1:50', PX, y, { size: 8, bold: true });
  y -= 16;
  for (let i = 0; i < 3; i++) rect(PX + i * S, y, S, 5, { fill: i % 2 ? WHITE : INK, stroke: INK, bw: 0.6 });
  for (let i = 0; i <= 3; i++) text(String(i), PX + i * S, y - 9, { size: 6, align: 'center' });
  text('m', PX + 3 * S + 8, y - 9, { size: 6 });

  // notes
  y -= 34;
  text('NOTES', PX, y, { size: 8, bold: true });
  y -= 12;
  for (const n of sheet.notes) {
    text(n, PX, y, { size: 6.5 });
    y -= 10;
  }

  // title block
  const tbTop = 190;
  const tbBottom = 30;
  rect(PX - 4, tbBottom, PW + 4, tbTop - tbBottom, { stroke: INK, bw: 1 });
  const rows = [
    ['PROJECT', 'Proposed rear & side extension'],
    ['SITE', 'Sample House, 1 Example Road, Anytown'],
    ['CLIENT', 'Mr & Mrs Example'],
    ['DRAWING', sheet.title],
    ['SCALE', '1:50 @ A3     REV  A'],
    ['DRG NO.', sheet.drawingNo],
    ['SHEET', `${sheetNo} of ${sheetCount}      DATE  10.11.26`],
    ['BY', 'Sample Architects Ltd (fictional)'],
  ];
  let ry = tbTop;
  for (const [k, v] of rows) {
    const rh = k === 'DRAWING' ? 24 : 18;
    ry -= rh;
    line(PX - 4, ry, PX + PW, ry, { t: 0.5 });
    text(k, PX, ry + rh - 7, { size: 5.5, c: rgb(0.4, 0.4, 0.4) });
    text(v, PX, ry + (k === 'DRAWING' ? 5 : 4), { size: k === 'DRAWING' ? 9 : 7.5, bold: k === 'DRAWING' || k === 'DRG NO.' });
  }
  text('DUMMY PLAN - FOR SOFTWARE TESTING ONLY', PX - 2, 36, { size: 6.5, bold: true, c: DEMO });
}

const sheets = [ground, first];
sheets.forEach((s, i) => draw(doc.addPage([W, H]), s, i + 1, sheets.length));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, await doc.save());
console.log('wrote', OUT);
