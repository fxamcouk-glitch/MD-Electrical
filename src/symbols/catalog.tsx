import type { ReactNode } from 'react';

export type CategoryId = 'power' | 'lighting' | 'switching' | 'safety' | 'data' | 'other';

export interface Category {
  id: CategoryId;
  name: string;
  /** Hex value mirroring the CSS token; SVG exports can't resolve CSS variables. */
  color: string;
  cssVar: string;
}

export const CATEGORIES: Category[] = [
  { id: 'power', name: 'Power & sockets', color: '#c62828', cssVar: '--color-cat-power' },
  { id: 'lighting', name: 'Lighting', color: '#c25e00', cssVar: '--color-cat-lighting' },
  { id: 'switching', name: 'Switches & controls', color: '#1565c0', cssVar: '--color-cat-switching' },
  { id: 'safety', name: 'Fire & safety', color: '#2e7d32', cssVar: '--color-cat-safety' },
  { id: 'data', name: 'Data & comms', color: '#6a1b9a', cssVar: '--color-cat-data' },
  { id: 'other', name: 'Other', color: '#00695c', cssVar: '--color-cat-other' },
];

export interface SymbolDef {
  id: string;
  name: string;
  category: CategoryId;
  /** Draws the glyph centred on 0,0 within a 24×24 box (-12..12). */
  glyph: (c: string) => ReactNode;
}

const text = (label: string, size: number, c: string, y = 0) => (
  <text
    x={0}
    y={y}
    dy="0.35em"
    fontSize={size}
    fontWeight={700}
    fontFamily="Arial, Helvetica, sans-serif"
    textAnchor="middle"
    fill={c}
    stroke="none"
  >
    {label}
  </text>
);

const circleLabel = (label: string, size: number) => (c: string) => (
  <>
    <circle r={8} />
    {text(label, size, c)}
  </>
);

const boxLabel = (label: string, size: number, w = 18, h = 14) => (c: string) => (
  <>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={2} />
    {text(label, size, c)}
  </>
);

const triangleLabel = (label: string, size: number) => (c: string) => (
  <>
    <path d="M0 -8.5 L9 7 L-9 7 Z" />
    {text(label, size, c, 3.6)}
  </>
);

const halfFilled = (cx: number, r: number, c: string) => (
  <>
    <circle cx={cx} r={r} />
    <path d={`M${cx - r} 0 A${r} ${r} 0 0 1 ${cx + r} 0 Z`} fill={c} />
    <line x1={cx - r} y1={0} x2={cx + r} y2={0} />
  </>
);

const switchBody = (ticks: 1 | 2, label?: string) => (c: string) => (
  <>
    <circle cx={-2.5} cy={2.5} r={5.2} />
    <line x1={1.2} y1={-1.2} x2={8} y2={-8} />
    <line x1={6.5} y1={-9.5} x2={9.5} y2={-6.5} />
    {ticks === 2 && <line x1={4.3} y1={-7.3} x2={7.3} y2={-4.3} />}
    {label && <g transform="translate(-2.5 2.5)">{text(label, 6.5, c)}</g>}
  </>
);

export const SYMBOLS: SymbolDef[] = [
  // ── Power ───────────────────────────────────────────────
  { id: 'socket-single', name: 'Single socket', category: 'power', glyph: (c) => halfFilled(0, 8, c) },
  {
    id: 'socket-double',
    name: 'Double socket',
    category: 'power',
    glyph: (c) => (
      <>
        {halfFilled(-5.4, 5.4, c)}
        {halfFilled(5.4, 5.4, c)}
      </>
    ),
  },
  {
    id: 'socket-usb',
    name: 'Socket with USB',
    category: 'power',
    glyph: (c) => (
      <>
        <circle r={8} />
        <path d="M-8 0 A8 8 0 0 1 8 0 Z" fill={c} />
        <line x1={-8} y1={0} x2={8} y2={0} />
        {text('USB', 4.8, c, 4.4)}
      </>
    ),
  },
  { id: 'spur', name: 'Fused spur', category: 'power', glyph: boxLabel('FS', 7.5, 16, 16) },
  {
    id: 'socket-outdoor',
    name: 'Outdoor socket (IP)',
    category: 'power',
    glyph: (c) => (
      <>
        {halfFilled(0, 6.5, c)}
        <circle r={10.5} fill="none" strokeDasharray="2.4 2" />
      </>
    ),
  },
  {
    id: 'cooker',
    name: 'Cooker / hob supply',
    category: 'power',
    glyph: (c) => (
      <>
        <rect x={-9.5} y={-8} width={19} height={16} rx={2} />
        {[
          [-4.2, -3.6],
          [4.2, -3.6],
          [-4.2, 3.6],
          [4.2, 3.6],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={2.4} fill={c} stroke="none" />
        ))}
      </>
    ),
  },
  { id: 'shower', name: 'Shower supply', category: 'power', glyph: boxLabel('SH', 7.5, 18, 15) },
  { id: 'ev-charger', name: 'EV charger', category: 'power', glyph: boxLabel('EV', 8, 18, 15) },
  { id: 'isolator', name: 'Isolator', category: 'power', glyph: boxLabel('ISO', 6.2, 20, 14) },
  { id: 'jb', name: 'Junction box', category: 'power', glyph: circleLabel('JB', 7) },
  {
    id: 'consumer-unit',
    name: 'Consumer unit',
    category: 'power',
    glyph: (c) => (
      <>
        <rect x={-9} y={-10} width={18} height={20} rx={2} />
        {[-6, -1.5, 3, 7.5].map((y) => (
          <rect key={y} x={-6} y={y - 1.1} width={12} height={2.2} fill={c} stroke="none" />
        ))}
      </>
    ),
  },

  // ── Lighting ────────────────────────────────────────────
  {
    id: 'ceiling-light',
    name: 'Ceiling light',
    category: 'lighting',
    glyph: () => (
      <>
        <circle r={8} />
        <line x1={-5.66} y1={-5.66} x2={5.66} y2={5.66} />
        <line x1={5.66} y1={-5.66} x2={-5.66} y2={5.66} />
      </>
    ),
  },
  {
    id: 'downlight',
    name: 'Recessed downlight',
    category: 'lighting',
    glyph: (c) => (
      <>
        <circle r={7} />
        <circle r={2.6} fill={c} stroke="none" />
      </>
    ),
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    category: 'lighting',
    glyph: (c) => (
      <>
        <circle r={4.2} fill={c} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 6.6}
              y1={Math.sin(a) * 6.6}
              x2={Math.cos(a) * 10.6}
              y2={Math.sin(a) * 10.6}
            />
          );
        })}
      </>
    ),
  },
  {
    id: 'wall-light',
    name: 'Wall light',
    category: 'lighting',
    glyph: (c) => (
      <>
        <path d="M-9 5 A9 9 0 0 1 9 5 Z" />
        <line x1={-11} y1={5} x2={11} y2={5} />
        <circle cx={0} cy={-0.5} r={2} fill={c} stroke="none" />
      </>
    ),
  },
  { id: 'emergency-light', name: 'Emergency light', category: 'lighting', glyph: boxLabel('EM', 7.5, 20, 13) },
  {
    id: 'floodlight',
    name: 'Outdoor / flood light',
    category: 'lighting',
    glyph: (c) => (
      <>
        <circle cx={-4.5} cy={0} r={5} />
        <circle cx={-4.5} cy={0} r={1.8} fill={c} stroke="none" />
        <line x1={2} y1={-5.5} x2={10} y2={-8} />
        <line x1={3} y1={0} x2={11} y2={0} />
        <line x1={2} y1={5.5} x2={10} y2={8} />
      </>
    ),
  },

  // ── Switching & controls ────────────────────────────────
  { id: 'switch-1way', name: 'Light switch (1-way)', category: 'switching', glyph: switchBody(1) },
  { id: 'switch-2way', name: 'Light switch (2-way)', category: 'switching', glyph: switchBody(2) },
  { id: 'dimmer', name: 'Dimmer switch', category: 'switching', glyph: switchBody(1, 'D') },
  {
    id: 'pull-cord',
    name: 'Pull-cord switch',
    category: 'switching',
    glyph: () => (
      <>
        <circle cx={0} cy={-4.5} r={5} />
        <line x1={0} y1={0.5} x2={0} y2={8} />
        <circle cx={0} cy={9.4} r={1.6} />
      </>
    ),
  },
  { id: 'pir', name: 'PIR sensor', category: 'switching', glyph: circleLabel('PIR', 5.6) },
  { id: 'thermostat', name: 'Thermostat', category: 'switching', glyph: circleLabel('T', 11) },

  // ── Fire & safety ───────────────────────────────────────
  { id: 'smoke-detector', name: 'Smoke detector', category: 'safety', glyph: circleLabel('SD', 7) },
  { id: 'heat-detector', name: 'Heat detector', category: 'safety', glyph: circleLabel('HD', 7) },
  { id: 'co-detector', name: 'CO detector', category: 'safety', glyph: circleLabel('CO', 7) },
  { id: 'sounder', name: 'Alarm sounder', category: 'safety', glyph: circleLabel('AS', 7) },

  // ── Data & comms ────────────────────────────────────────
  { id: 'data-point', name: 'Data point (Cat6)', category: 'data', glyph: triangleLabel('D', 7.5) },
  { id: 'tv-point', name: 'TV / aerial point', category: 'data', glyph: triangleLabel('TV', 5.5) },
  {
    id: 'wifi-ap',
    name: 'Wi-Fi access point',
    category: 'data',
    glyph: (c) => (
      <>
        <path d="M-4.5 1 a6.4 6.4 0 0 1 9 0" fill="none" />
        <path d="M-8.2 -2.6 a11.6 11.6 0 0 1 16.4 0" fill="none" />
        <circle cx={0} cy={6} r={1.9} fill={c} stroke="none" />
      </>
    ),
  },
  {
    id: 'cctv',
    name: 'CCTV camera',
    category: 'data',
    glyph: () => (
      <>
        <rect x={-10} y={-5} width={12} height={10} rx={1.5} />
        <path d="M2 -3.6 L10 -7.5 L10 7.5 L2 3.6 Z" />
      </>
    ),
  },
  { id: 'doorbell', name: 'Doorbell / chime', category: 'data', glyph: circleLabel('DB', 7) },

  // ── Other ───────────────────────────────────────────────
  {
    id: 'fan',
    name: 'Extractor / fan',
    category: 'other',
    glyph: (c) => (
      <>
        <circle r={8.5} />
        {[-90, 30, 150].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return <line key={deg} x1={0} y1={0} x2={Math.cos(a) * 6} y2={Math.sin(a) * 6} />;
        })}
        <circle r={1.6} fill={c} stroke="none" />
      </>
    ),
  },
  {
    id: 'note',
    name: 'Note / query flag',
    category: 'other',
    glyph: (c) => (
      <>
        <path d="M-9 -9 H9 V3 H1 L-3 8 V3 H-9 Z" />
        {text('!', 11, c, -2.6)}
      </>
    ),
  },
];

const BY_ID = new Map(SYMBOLS.map((s) => [s.id, s]));
const CAT_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

const FALLBACK: SymbolDef = SYMBOLS.find((s) => s.id === 'note')!;

export function getSymbol(id: string): SymbolDef {
  return BY_ID.get(id) ?? FALLBACK;
}

export function getCategory(id: CategoryId): Category {
  return CAT_BY_ID.get(id)!;
}

export function symbolColor(id: string): string {
  return getCategory(getSymbol(id).category).color;
}
