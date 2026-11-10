import { useMemo } from 'react';
import { Icon } from './Icon';
import type { Marker, MarkupData } from '../state/types';
import { SYMBOLS, getSymbol } from '../symbols/catalog';
import { GlyphIcon } from '../symbols/Glyph';

interface Props {
  page: number;
  data: MarkupData;
  markers: Marker[];
  selected: Marker[];
  symbolScale: number;
  onLabel: (label: string) => void;
  onRotateBy: (deg: number) => void;
  onRotateTo: (deg: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onScale: (scale: number) => void;
  onSelectType: (type: string) => void;
}

export function Inspector(p: Props) {
  const one = p.selected.length === 1 ? p.selected[0] : null;

  const rows = useMemo(() => {
    const thisPage = new Map<string, number>();
    const all = new Map<string, number>();
    for (const m of p.markers) thisPage.set(m.type, (thisPage.get(m.type) ?? 0) + 1);
    for (const list of Object.values(p.data.markers)) for (const m of list) all.set(m.type, (all.get(m.type) ?? 0) + 1);
    return SYMBOLS.filter((s) => all.has(s.id)).map((s) => ({
      id: s.id,
      name: s.name,
      page: thisPage.get(s.id) ?? 0,
      total: all.get(s.id)!,
    }));
  }, [p.markers, p.data]);

  const totalPage = rows.reduce((n, r) => n + r.page, 0);
  const totalAll = rows.reduce((n, r) => n + r.total, 0);

  return (
    <div className="inspector">
      <section className="panel__section" aria-labelledby="sel-title">
        <h2 id="sel-title" className="panel__title">
          {p.selected.length === 0 ? 'Selection' : one ? getSymbol(one.type).name : `${p.selected.length} symbols selected`}
        </h2>

        {p.selected.length === 0 && (
          <p className="panel__hint">Click a symbol on the plan to edit it. Shift-click to select several, then drag to move them.</p>
        )}

        {p.selected.length > 0 && (
          <>
            {one && (
              <>
                <div className="inspector__preview">
                  <GlyphIcon type={one.type} size={44} />
                </div>
                <label className="field">
                  <span className="field__label">Label (e.g. circuit or height)</span>
                  <input
                    className="input"
                    type="text"
                    maxLength={24}
                    value={one.label}
                    placeholder="e.g. C3, 1.2m"
                    onChange={(e) => p.onLabel(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Rotation (°)</span>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={359}
                    step={5}
                    value={Math.round(one.rotation)}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n)) p.onRotateTo(n);
                    }}
                  />
                </label>
              </>
            )}
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => p.onRotateBy(-45)} title="Rotate 45° anticlockwise (Shift+R)">
                <Icon name="rotateCcw" /> 45°
              </button>
              <button type="button" className="btn" onClick={() => p.onRotateBy(45)} title="Rotate 45° clockwise (R)">
                <Icon name="rotateCw" /> 45°
              </button>
              <button type="button" className="btn" onClick={p.onDuplicate} title="Duplicate (Ctrl+D)">
                <Icon name="copy" /> Copy
              </button>
              <button type="button" className="btn btn--danger" onClick={p.onDelete} title="Delete (Del)">
                <Icon name="trash" /> Delete
              </button>
            </div>
          </>
        )}
      </section>

      <section className="panel__section" aria-labelledby="size-title">
        <h2 id="size-title" className="panel__title">
          Symbol size – page {p.page}
        </h2>
        <label className="field">
          <span className="visually-hidden">Symbol size on this page</span>
          <input
            type="range"
            className="range"
            min={0.4}
            max={3}
            step={0.05}
            value={p.symbolScale}
            onChange={(e) => p.onScale(Number(e.target.value))}
          />
        </label>
        <p className="panel__hint">Scales every symbol on this page – handy when a sheet is drawn at a different scale.</p>
      </section>

      <section className="panel__section" aria-labelledby="sched-title">
        <h2 id="sched-title" className="panel__title">
          Schedule
        </h2>
        {rows.length === 0 ? (
          <p className="panel__hint">Symbols you place are counted here.</p>
        ) : (
          <table className="schedule">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col" className="num">
                  Page
                </th>
                <th scope="col" className="num">
                  All
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row">
                    <button
                      type="button"
                      className="schedule__item"
                      onClick={() => p.onSelectType(r.id)}
                      disabled={r.page === 0}
                      title={r.page ? `Select all ${r.name.toLowerCase()} on this page` : 'None on this page'}
                    >
                      <GlyphIcon type={r.id} size={20} />
                      <span>{r.name}</span>
                    </button>
                  </th>
                  <td className="num">{r.page}</td>
                  <td className="num">{r.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td className="num">{totalPage}</td>
                <td className="num">{totalAll}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>
    </div>
  );
}
