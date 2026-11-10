import { getSymbol, symbolColor } from './catalog';

/** Shared drawing style so glyphs look identical in the palette, on the plan and in exports. */
export function GlyphShape({ type, opacity = 1 }: { type: string; opacity?: number }) {
  const c = symbolColor(type);
  return (
    <g
      fill="#fff"
      stroke={c}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    >
      {getSymbol(type).glyph(c)}
    </g>
  );
}

/** A glyph in its own small SVG, for palette tiles, legends and the inspector. */
export function GlyphIcon({ type, size = 28 }: { type: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-12.5 -12.5 25 25" aria-hidden="true" focusable="false">
      <GlyphShape type={type} />
    </svg>
  );
}
