import { DEFAULT_SYMBOL_SCALE, type Marker, type MarkupData } from './types';

export interface EditorState {
  data: MarkupData;
  past: MarkupData[];
  future: MarkupData[];
  /** Consecutive actions sharing a key (a drag, typing a label) form one undo step. */
  lastKey?: string;
}

export type Action =
  | { type: 'load'; data: MarkupData }
  | { type: 'add'; page: number; marker: Marker }
  | { type: 'moveBy'; page: number; ids: string[]; dx: number; dy: number; key: string }
  | { type: 'update'; page: number; ids: string[]; patch: Partial<Pick<Marker, 'rotation' | 'label' | 'type'>>; key?: string }
  | { type: 'rotateBy'; page: number; ids: string[]; degrees: number }
  | { type: 'remove'; page: number; ids: string[] }
  | { type: 'duplicate'; page: number; ids: string[]; newIds: string[]; offset: number }
  | { type: 'setSymbolScale'; page: number; scale: number }
  | { type: 'undo' }
  | { type: 'redo' };

const HISTORY_LIMIT = 200;

export const emptyData = (): MarkupData => ({ markers: {}, pages: {} });

export const initialState = (data: MarkupData = emptyData()): EditorState => ({
  data,
  past: [],
  future: [],
});

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export const normaliseRotation = (deg: number) => ((deg % 360) + 360) % 360;

function commit(state: EditorState, data: MarkupData, key?: string): EditorState {
  const coalesce = key !== undefined && key === state.lastKey;
  const past = coalesce ? state.past : [...state.past, state.data].slice(-HISTORY_LIMIT);
  return { data, past, future: [], lastKey: key };
}

function mapMarkers(
  data: MarkupData,
  page: number,
  fn: (list: Marker[]) => Marker[],
): MarkupData {
  return { ...data, markers: { ...data.markers, [page]: fn(data.markers[page] ?? []) } };
}

export function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'load':
      return initialState(action.data);

    case 'add':
      return commit(state, mapMarkers(state.data, action.page, (l) => [...l, action.marker]));

    case 'moveBy': {
      const ids = new Set(action.ids);
      return commit(
        state,
        mapMarkers(state.data, action.page, (l) =>
          l.map((m) => (ids.has(m.id) ? { ...m, x: m.x + action.dx, y: m.y + action.dy } : m)),
        ),
        `move:${action.key}`,
      );
    }

    case 'update': {
      const ids = new Set(action.ids);
      return commit(
        state,
        mapMarkers(state.data, action.page, (l) => l.map((m) => (ids.has(m.id) ? { ...m, ...action.patch } : m))),
        action.key,
      );
    }

    case 'rotateBy': {
      const ids = new Set(action.ids);
      return commit(
        state,
        mapMarkers(state.data, action.page, (l) =>
          l.map((m) => (ids.has(m.id) ? { ...m, rotation: normaliseRotation(m.rotation + action.degrees) } : m)),
        ),
      );
    }

    case 'remove': {
      const ids = new Set(action.ids);
      return commit(state, mapMarkers(state.data, action.page, (l) => l.filter((m) => !ids.has(m.id))));
    }

    case 'duplicate': {
      const list = state.data.markers[action.page] ?? [];
      const copies = action.ids.flatMap((id, i) => {
        const src = list.find((m) => m.id === id);
        return src && action.newIds[i]
          ? [{ ...src, id: action.newIds[i], x: src.x + action.offset, y: src.y + action.offset }]
          : [];
      });
      if (!copies.length) return state;
      return commit(state, mapMarkers(state.data, action.page, (l) => [...l, ...copies]));
    }

    case 'setSymbolScale': {
      const scale = Math.min(4, Math.max(0.3, action.scale));
      const data: MarkupData = {
        ...state.data,
        pages: { ...state.data.pages, [action.page]: { ...state.data.pages[action.page], symbolScale: scale } },
      };
      return commit(state, data, `scale:${action.page}`);
    }

    case 'undo': {
      const prev = state.past[state.past.length - 1];
      if (!prev) return state;
      return { data: prev, past: state.past.slice(0, -1), future: [state.data, ...state.future], lastKey: undefined };
    }

    case 'redo': {
      const next = state.future[0];
      if (!next) return state;
      return { data: next, past: [...state.past, state.data], future: state.future.slice(1), lastKey: undefined };
    }
  }
}

export const getMarkers = (data: MarkupData, page: number): Marker[] => data.markers[page] ?? [];
export const getSymbolScale = (data: MarkupData, page: number): number =>
  data.pages[page]?.symbolScale ?? DEFAULT_SYMBOL_SCALE;

export const countMarkers = (data: MarkupData): number =>
  Object.values(data.markers).reduce((n, l) => n + l.length, 0);
