import { useMemo, useState, type DragEvent } from 'react';
import { CATEGORIES, SYMBOLS } from '../symbols/catalog';
import { GlyphIcon } from '../symbols/Glyph';
import { SYMBOL_DRAG_TYPE } from './PlanViewer';

interface Props {
  armed: string | null;
  onArm: (id: string | null) => void;
  disabled: boolean;
}

export function Palette({ armed, onArm, disabled }: Props) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        cat,
        items: SYMBOLS.filter(
          (s) => s.category === cat.id && (!q || s.name.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)),
        ),
      })).filter((g) => g.items.length),
    [q],
  );

  const onDragStart = (e: DragEvent<HTMLButtonElement>, id: string, name: string) => {
    e.dataTransfer.setData(SYMBOL_DRAG_TYPE, id);
    e.dataTransfer.setData('text/plain', name);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="palette">
      <div className="panel__head">
        <h2 className="panel__title">Symbols</h2>
        <p className="panel__hint">Drag a symbol onto the plan, or pick one and click where it goes.</p>
        <label className="field">
          <span className="visually-hidden">Search symbols</span>
          <input
            type="search"
            className="input"
            placeholder="Search symbols…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="palette__scroll">
        {groups.length === 0 && <p className="panel__empty">No symbols match “{query}”.</p>}
        {groups.map(({ cat, items }) => (
          <section key={cat.id} className="palette__group" aria-labelledby={`cat-${cat.id}`}>
            <h3 id={`cat-${cat.id}`} className="palette__cat">
              <span className="palette__dot" style={{ background: `var(${cat.cssVar})` }} />
              {cat.name}
            </h3>
            <div className="palette__grid">
              {items.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="tile"
                  draggable={!disabled}
                  disabled={disabled}
                  aria-pressed={armed === s.id}
                  title={s.name}
                  data-symbol={s.id}
                  onDragStart={(e) => onDragStart(e, s.id, s.name)}
                  onClick={() => onArm(armed === s.id ? null : s.id)}
                >
                  <GlyphIcon type={s.id} size={30} />
                  <span className="tile__name">{s.name}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
