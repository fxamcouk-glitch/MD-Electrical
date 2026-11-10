export type SymbolId = string;

/** A placed symbol. Coordinates are in PDF points of the page as displayed (rotation applied). */
export interface Marker {
  id: string;
  type: SymbolId;
  x: number;
  y: number;
  /** degrees, clockwise */
  rotation: number;
  label: string;
}

export interface PageMeta {
  /** Relative size of symbols on this page (plans come at very different scales). */
  symbolScale: number;
}

export interface MarkupData {
  /** Markers per 1-based page number. */
  markers: Record<number, Marker[]>;
  pages: Record<number, PageMeta>;
}

export interface SavedDrawing {
  id: string;
  name: string;
  pdf: ArrayBuffer;
  data: MarkupData;
  updatedAt: number;
  pageCount: number;
}

export interface DrawingSummary {
  id: string;
  name: string;
  updatedAt: number;
  pageCount: number;
  markerCount: number;
}

export const DEFAULT_SYMBOL_SCALE = 1;
