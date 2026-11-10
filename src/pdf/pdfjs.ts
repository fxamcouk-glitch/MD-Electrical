import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export type PdfDoc = pdfjs.PDFDocumentProxy;
export type PdfPage = pdfjs.PDFPageProxy;

const assets = `${import.meta.env.BASE_URL}pdfjs/`;

/** Opens PDF bytes. The bytes are copied because pdf.js transfers (detaches) its input to the worker. */
export function openPdf(bytes: ArrayBuffer): Promise<PdfDoc> {
  return pdfjs.getDocument({
    data: new Uint8Array(bytes.slice(0)),
    cMapUrl: `${assets}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${assets}standard_fonts/`,
    wasmUrl: `${assets}wasm/`,
    iccUrl: `${assets}iccs/`,
  }).promise;
}

export interface PageSize {
  width: number;
  height: number;
}

/** Page size in PDF points with the page's own rotation applied (what the user sees at 100%). */
export function pageSize(page: PdfPage): PageSize {
  const v = page.getViewport({ scale: 1 });
  return { width: v.width, height: v.height };
}

/** Largest canvas we'll allocate (pixels). Big architectural sheets would otherwise exhaust memory. */
export const MAX_CANVAS_PIXELS = 32_000_000;
export const MAX_CANVAS_SIDE = 16_000;

export function renderScaleFor(size: PageSize, zoom: number, dpr: number): number {
  let scale = zoom * dpr;
  const px = size.width * size.height * scale * scale;
  if (px > MAX_CANVAS_PIXELS) scale *= Math.sqrt(MAX_CANVAS_PIXELS / px);
  const side = Math.max(size.width, size.height) * scale;
  if (side > MAX_CANVAS_SIDE) scale *= MAX_CANVAS_SIDE / side;
  return scale;
}

/** Frees the worker for a document we're done with. Deferred so any in-flight render is cancelled first. */
export function closePdf(pdf: PdfDoc | undefined) {
  if (pdf) setTimeout(() => void pdf.loadingTask.destroy().catch(() => undefined), 1000);
}
