import { renderToStaticMarkup } from 'react-dom/server';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { MarkerShape } from '../components/MarkerShape';
import { getMarkers, getSymbolScale } from '../state/reducer';
import type { MarkupData } from '../state/types';
import { SYMBOLS, getSymbol } from '../symbols/catalog';
import { glyphUnit } from '../symbols/sizing';
import { pageSize, type PdfDoc } from './pdfjs';

const MAX_OVERLAY_SIDE = 6000;

function overlaySvg(data: MarkupData, page: number, w: number, h: number, px: number): string {
  const size = { width: w, height: h };
  const unit = glyphUnit(size, getSymbolScale(data, page));
  const body = renderToStaticMarkup(
    <>
      {getMarkers(data, page).map((m) => (
        <MarkerShape key={m.id} marker={m} unit={unit} />
      ))}
    </>,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w * px)}" height="${Math.round(
    h * px,
  )}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

async function rasterise(svg: string, width: number, height: number): Promise<Uint8Array> {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Could not render the markup layer.');
  return new Uint8Array(await blob.arrayBuffer());
}

const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, '?');

/**
 * Original PDF with the symbols stamped on top. The plan itself stays vector;
 * only the markup layer is rasterised (transparent PNG), then a symbol schedule page is appended.
 */
export async function buildMarkedUpPdf(args: {
  bytes: ArrayBuffer;
  pdf: PdfDoc;
  data: MarkupData;
  title: string;
  includeSchedule: boolean;
}): Promise<Uint8Array> {
  const out = await PDFDocument.load(args.bytes, { ignoreEncryption: true });
  const pages = out.getPages();

  for (let n = 1; n <= pages.length; n++) {
    if (!getMarkers(args.data, n).length) continue;
    const src = pageSize(await args.pdf.getPage(n));
    const px = Math.min(3, MAX_OVERLAY_SIDE / Math.max(src.width, src.height));
    const svg = overlaySvg(args.data, n, src.width, src.height, px);
    const png = await rasterise(svg, src.width * px, src.height * px);
    const image = await out.embedPng(png);

    const page = pages[n - 1];
    const box = page.getCropBox();
    const angle = ((page.getRotation().angle % 360) + 360) % 360;
    // The overlay is in displayed orientation; place it counter-rotated so the page's own rotation restores it.
    const place = {
      0: { x: box.x, y: box.y },
      90: { x: box.x + box.width, y: box.y },
      180: { x: box.x + box.width, y: box.y + box.height },
      270: { x: box.x, y: box.y + box.height },
    }[angle as 0 | 90 | 180 | 270] ?? { x: box.x, y: box.y };
    page.drawImage(image, { ...place, width: src.width, height: src.height, rotate: degrees(angle) });
  }

  if (args.includeSchedule) await appendSchedule(out, args.data, args.title);
  return out.save();
}

async function appendSchedule(doc: PDFDocument, data: MarkupData, title: string) {
  const counts = new Map<string, number>();
  for (const list of Object.values(data.markers)) for (const m of list) counts.set(m.type, (counts.get(m.type) ?? 0) + 1);
  if (!counts.size) return;

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595.28, 841.89]);
  const ink = rgb(0.08, 0.125, 0.18);
  let y = 790;

  page.drawText('MD Electrical', { x: 48, y, size: 11, font: bold, color: rgb(0.85, 0.55, 0.04) });
  y -= 26;
  page.drawText('Symbol schedule', { x: 48, y, size: 20, font: bold, color: ink });
  y -= 18;
  page.drawText(ascii(title), { x: 48, y, size: 10, font, color: rgb(0.33, 0.4, 0.48) });
  y -= 34;

  const rows = SYMBOLS.filter((s) => counts.has(s.id)).map((s) => [s.name, counts.get(s.id)!] as const);
  page.drawText('Item', { x: 48, y, size: 10, font: bold, color: ink });
  page.drawText('Qty', { x: 500, y, size: 10, font: bold, color: ink });
  y -= 8;
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 0.8, color: ink });
  y -= 16;
  let total = 0;
  for (const [name, qty] of rows) {
    if (y < 60) break;
    page.drawText(ascii(name), { x: 48, y, size: 10, font, color: ink });
    page.drawText(String(qty), { x: 500, y, size: 10, font, color: ink });
    total += qty;
    y -= 17;
  }
  y -= 4;
  page.drawLine({ start: { x: 48, y: y + 12 }, end: { x: 547, y: y + 12 }, thickness: 0.5, color: ink });
  page.drawText('Total', { x: 48, y: y - 4, size: 10, font: bold, color: ink });
  page.drawText(String(total), { x: 500, y: y - 4, size: 10, font: bold, color: ink });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** CSV of counts per symbol per page (UTF-8 with BOM so Excel opens it correctly). */
export function buildScheduleCsv(data: MarkupData, pageCount: number): string {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = ['Symbol', ...Array.from({ length: pageCount }, (_, i) => `Page ${i + 1}`), 'Total'];
  const rows: (string | number)[][] = [];
  for (const s of SYMBOLS) {
    const perPage = Array.from({ length: pageCount }, (_, i) => getMarkers(data, i + 1).filter((m) => m.type === s.id).length);
    const total = perPage.reduce((a, b) => a + b, 0);
    if (total) rows.push([getSymbol(s.id).name, ...perPage, total]);
  }
  return '﻿' + [header, ...rows].map((r) => r.map(q).join(',')).join('\r\n');
}
