import type { PageSize } from '../pdf/pdfjs';

/** Glyphs are drawn in a 24-unit box; this returns how many PDF points one unit spans on a page. */
export function glyphUnit(size: PageSize, symbolScale: number): number {
  const base = Math.max(20, 0.03 * Math.max(size.width, size.height));
  return (base * symbolScale) / 24;
}
