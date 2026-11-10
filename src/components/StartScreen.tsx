import { useRef } from 'react';
import { Icon, Logo } from './Icon';
import type { DrawingSummary } from '../state/types';

interface Props {
  drawings: DrawingSummary[];
  busy: boolean;
  onFile: (file: File) => void;
  onOpenSaved: (id: string) => void;
  onDeleteSaved: (id: string) => void;
}

const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export function StartScreen({ drawings, busy, onFile, onOpenSaved, onDeleteSaved }: Props) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <main className="start">
      <div className="start__inner">
        <div className="start__brand">
          <Logo size={44} />
          <div>
            <h1 className="start__title">MD Electrical</h1>
            <p className="start__sub">Plan markup</p>
          </div>
        </div>

        <button type="button" className="dropzone" onClick={() => input.current?.click()} disabled={busy}>
          <Icon name="upload" size={32} />
          <span className="dropzone__title">{busy ? 'Opening plan…' : 'Open a PDF plan'}</span>
          <span className="dropzone__hint">Click to choose a file, or drop a PDF anywhere on this page</span>
        </button>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = '';
          }}
        />

        <section aria-labelledby="recent-title" className="recent">
          <h2 id="recent-title" className="recent__title">
            Recent drawings
          </h2>
          {drawings.length === 0 ? (
            <p className="panel__hint">Drawings you mark up are saved on this device and will appear here.</p>
          ) : (
            <ul className="recent__list">
              {drawings.map((d) => (
                <li key={d.id} className="recent__row">
                  <button type="button" className="recent__open" onClick={() => onOpenSaved(d.id)} disabled={busy}>
                    <Icon name="file" size={22} />
                    <span className="recent__text">
                      <span className="recent__name">{d.name}</span>
                      <span className="recent__meta">
                        {d.pageCount} {d.pageCount === 1 ? 'page' : 'pages'} · {d.markerCount}{' '}
                        {d.markerCount === 1 ? 'symbol' : 'symbols'} · {fmt.format(d.updatedAt)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--icon"
                    aria-label={`Delete ${d.name}`}
                    title="Delete from this device"
                    onClick={() => {
                      if (window.confirm(`Delete “${d.name}” and its markup from this device?`)) onDeleteSaved(d.id);
                    }}
                  >
                    <Icon name="trash" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
