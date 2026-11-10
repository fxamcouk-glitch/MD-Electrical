import { GlyphShape } from '../symbols/Glyph';
import type { Marker } from '../state/types';

export const LABEL_SIZE = 9; // glyph units

/**
 * One marker, drawn in page coordinates. Shared by the live overlay and the export
 * so what you see is what is printed. Uses only presentation attributes (no CSS).
 */
export function MarkerShape({ marker, unit, ghost }: { marker: Marker; unit: number; ghost?: boolean }) {
  return (
    <g transform={`translate(${marker.x} ${marker.y})`}>
      <g transform={`scale(${unit}) rotate(${marker.rotation})`}>
        <GlyphShape type={marker.type} opacity={ghost ? 0.6 : 1} />
      </g>
      {marker.label && (
        <text
          x={0}
          y={unit * 17}
          fontSize={unit * LABEL_SIZE}
          fontWeight={700}
          fontFamily="Arial, Helvetica, sans-serif"
          textAnchor="middle"
          fill="#14202e"
          stroke="#fff"
          strokeWidth={unit * 2.6}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {marker.label}
        </text>
      )}
    </g>
  );
}
