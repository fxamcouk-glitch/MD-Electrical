import { del, get, keys, set } from 'idb-keyval';
import { countMarkers } from './reducer';
import type { DrawingSummary, MarkupData } from './types';

const META = 'meta:';
const PDF = 'pdf:';
const DATA = 'data:';

export async function saveDrawing(args: {
  id: string;
  name: string;
  pageCount: number;
  data: MarkupData;
  pdf?: ArrayBuffer;
}): Promise<void> {
  const summary: DrawingSummary = {
    id: args.id,
    name: args.name,
    pageCount: args.pageCount,
    updatedAt: Date.now(),
    markerCount: countMarkers(args.data),
  };
  if (args.pdf) await set(PDF + args.id, args.pdf);
  await set(DATA + args.id, args.data);
  await set(META + args.id, summary);
}

export async function listDrawings(): Promise<DrawingSummary[]> {
  const all = (await keys()).filter((k): k is string => typeof k === 'string' && k.startsWith(META));
  const rows = await Promise.all(all.map((k) => get<DrawingSummary>(k)));
  return rows.filter((r): r is DrawingSummary => !!r).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadDrawing(id: string) {
  const [pdf, data, meta] = await Promise.all([
    get<ArrayBuffer>(PDF + id),
    get<MarkupData>(DATA + id),
    get<DrawingSummary>(META + id),
  ]);
  if (!pdf || !meta) return undefined;
  return { pdf, data: data ?? { markers: {}, pages: {} }, meta };
}

export async function deleteDrawing(id: string): Promise<void> {
  await Promise.all([del(PDF + id), del(DATA + id), del(META + id)]);
}
