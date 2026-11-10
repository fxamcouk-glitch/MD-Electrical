import type { ReactNode } from 'react';

const ICONS = {
  undo: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  redo: <path d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />,
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3M8 11h6" />
    </>
  ),
  fit: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  rotateCw: <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />,
  rotateCcw: <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />,
  copy: <path d="M9 9h11v11H9zM5 15H4V4h11v1" />,
  download: <path d="M12 4v11m-4-4 4 4 4-4M5 20h14" />,
  upload: <path d="M12 16V4m-4 4 4-4 4 4M5 20h14" />,
  grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  sliders: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4" />,
  file: <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

/** The MD Electrical Contracting mark, redrawn as vector from the supplied logo. Fixed hex colours so it also rasterises for PDF export. */
export const BRAND = { teal: '#008f9a', orange: '#f48221' } as const;

export function BrandMark({ size = 36 }: { size?: number }) {
  const stroke = { stroke: '#fff', strokeWidth: 2.4, fill: 'none', strokeLinejoin: 'miter' as const };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={(size * 98) / 110}
      height={size}
      viewBox="0 0 98 110"
      role="img"
      aria-label="MD Electrical Contracting"
    >
      <rect x={0} y={0} width={48} height={48} fill={BRAND.teal} />
      <rect x={51} y={13} width={47} height={48} fill={BRAND.orange} />
      <rect x={0} y={50} width={48} height={48} fill={BRAND.orange} />
      <rect x={51} y={64} width={47} height={46} fill={BRAND.teal} />
      <path d="M13 35 V13 L24 27.5 L35 13 V35" {...stroke} />
      <path d="M66 76 V99 H73 A11.5 11.5 0 0 0 73 76 Z" {...stroke} />
    </svg>
  );
}
