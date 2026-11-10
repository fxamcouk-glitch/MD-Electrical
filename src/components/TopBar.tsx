import { useEffect, useRef, useState } from 'react';
import { BrandMark, Icon } from './Icon';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  name: string;
  saveState: SaveState;
  canUndo: boolean;
  canRedo: boolean;
  zoomPercent: number;
  busy: boolean;
  onHome: () => void;
  onOpenFile: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onExportPdf: () => void;
  onExportCsv: () => void;
  onTogglePalette: () => void;
  onToggleInspector: () => void;
}

const SAVE_TEXT: Record<SaveState, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved on this device',
  error: 'Could not save – export your work',
};

export function TopBar(p: Props) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menu]);

  return (
    <header className="topbar">
      <div className="topbar__head">
        <button type="button" className="topbar__brand" onClick={p.onHome} title="All drawings">
          <BrandMark size={40} />
          <span className="topbar__brand-text">
            MD Electrical <small>Plan markup</small>
          </span>
        </button>

        <div className="topbar__doc" title={p.name}>
          <span className="topbar__doc-name">{p.name}</span>
          <span className={`topbar__save topbar__save--${p.saveState}`} role="status">
            {SAVE_TEXT[p.saveState]}
          </span>
        </div>

        <button type="button" className="btn hide-xs" onClick={p.onOpenFile} title="Open another PDF">
          <Icon name="upload" /> <span>Open PDF</span>
        </button>
        <div className="menu" ref={menuRef}>
          <button
            type="button"
            className="btn btn--primary"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
            disabled={p.busy}
          >
            <Icon name="download" /> <span>{p.busy ? 'Preparing…' : 'Export'}</span>
            <Icon name="chevronDown" size={16} />
          </button>
          {menu && (
            <div className="menu__list" role="menu">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  setMenu(false);
                  p.onExportPdf();
                }}
              >
                Marked-up PDF
                <small>Original plan + symbols + schedule page</small>
              </button>
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  setMenu(false);
                  p.onExportCsv();
                }}
              >
                Symbol schedule (CSV)
                <small>Counts per page, opens in Excel</small>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="topbar__tools" role="toolbar" aria-label="Plan tools">
        <button type="button" className="btn btn--ghost btn--narrow-only" onClick={p.onTogglePalette} aria-label="Symbols">
          <Icon name="grid" /> <span className="hide-xs">Symbols</span>
        </button>
        <button type="button" className="btn btn--ghost btn--icon" onClick={p.onUndo} disabled={!p.canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
          <Icon name="undo" />
        </button>
        <button type="button" className="btn btn--ghost btn--icon" onClick={p.onRedo} disabled={!p.canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
          <Icon name="redo" />
        </button>
        <span className="topbar__sep" aria-hidden="true" />
        <button type="button" className="btn btn--ghost btn--icon" onClick={p.onZoomOut} title="Zoom out (−)" aria-label="Zoom out">
          <Icon name="zoomOut" />
        </button>
        <span className="topbar__zoom" aria-live="polite" data-testid="zoom-readout">
          {p.zoomPercent}%
        </span>
        <button type="button" className="btn btn--ghost btn--icon" onClick={p.onZoomIn} title="Zoom in (+)" aria-label="Zoom in">
          <Icon name="zoomIn" />
        </button>
        <button type="button" className="btn btn--ghost btn--icon" onClick={p.onFit} title="Fit page (0)" aria-label="Fit page to window">
          <Icon name="fit" />
        </button>
        <button type="button" className="btn btn--ghost btn--narrow-only btn--icon topbar__push" onClick={p.onToggleInspector} aria-label="Selection and schedule">
          <Icon name="sliders" />
        </button>
      </div>
    </header>
  );
}
