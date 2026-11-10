import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Inspector } from './components/Inspector';
import { Icon } from './components/Icon';
import { Palette } from './components/Palette';
import { PlanViewer, type PlanViewerHandle } from './components/PlanViewer';
import { StartScreen } from './components/StartScreen';
import { TopBar, type SaveState } from './components/TopBar';
import { buildMarkedUpPdf, buildScheduleCsv, downloadBlob } from './pdf/exportPdf';
import { closePdf, openPdf, type PdfDoc } from './pdf/pdfjs';
import { getMarkers, getSymbolScale, initialState, newId, reducer } from './state/reducer';
import { deleteDrawing, listDrawings, loadDrawing, saveDrawing } from './state/storage';
import type { DrawingSummary, MarkupData } from './state/types';
import { getSymbol } from './symbols/catalog';

interface Session {
  id: string;
  name: string;
  bytes: ArrayBuffer;
  pdf: PdfDoc;
  pageCount: number;
}

const baseName = (filename: string) => filename.replace(/\.pdf$/i, '');

function friendlyOpenError(e: unknown): string {
  const name = (e as { name?: string })?.name;
  if (name === 'PasswordException') return 'This PDF is password protected. Remove the password and try again.';
  if (name === 'InvalidPDFException') return 'That file doesn’t look like a valid PDF.';
  return `Couldn’t open that PDF${(e as Error)?.message ? `: ${(e as Error).message}` : '.'}`;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [editor, dispatch] = useReducer(reducer, undefined, () => initialState());
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<string[]>([]);
  const [armed, setArmed] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panel, setPanel] = useState<'palette' | 'inspector' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [drawings, setDrawings] = useState<DrawingSummary[]>([]);
  const [fileDragOver, setFileDragOver] = useState(false);

  const viewerRef = useRef<PlanViewerHandle>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const savedData = useRef<MarkupData | null>(null);
  const latest = useRef({ session, data: editor.data });
  latest.current = { session, data: editor.data };

  const markers = useMemo(() => getMarkers(editor.data, page), [editor.data, page]);
  const selectedIds = useMemo(() => selection.filter((id) => markers.some((m) => m.id === id)), [selection, markers]);
  const selectedMarkers = useMemo(() => markers.filter((m) => selectedIds.includes(m.id)), [markers, selectedIds]);
  const symbolScale = getSymbolScale(editor.data, page);

  const refreshDrawings = useCallback(() => {
    listDrawings().then(setDrawings).catch(() => setDrawings([]));
  }, []);
  useEffect(refreshDrawings, [refreshDrawings]);

  useEffect(() => {
    document.title = session ? `${session.name} – MD Electrical` : 'MD Electrical – Plan Markup';
  }, [session]);

  // ── Opening files ───────────────────────────────────────────────────────
  const start = useCallback(
    (next: Session, data: MarkupData, persistPdf: boolean) => {
      setSession(next);
      dispatch({ type: 'load', data });
      savedData.current = data;
      setPage(1);
      setSelection([]);
      setArmed(null);
      setPanel(null);
      setSaveState('idle');
      if (persistPdf) {
        setSaveState('saving');
        saveDrawing({ id: next.id, name: next.name, pageCount: next.pageCount, data, pdf: next.bytes })
          .then(() => setSaveState('saved'))
          .catch(() => setSaveState('error'));
      }
    },
    [],
  );

  const openFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.type && file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
        setError('Please choose a PDF file.');
        return;
      }
      setOpening(true);
      try {
        const bytes = await file.arrayBuffer();
        const pdf = await openPdf(bytes);
        closePdf(latest.current.session?.pdf);
        start({ id: newId(), name: baseName(file.name), bytes, pdf, pageCount: pdf.numPages }, { markers: {}, pages: {} }, true);
      } catch (e) {
        setError(friendlyOpenError(e));
      } finally {
        setOpening(false);
      }
    },
    [start],
  );

  const openSaved = useCallback(
    async (id: string) => {
      setError(null);
      setOpening(true);
      try {
        const saved = await loadDrawing(id);
        if (!saved) throw new Error('That drawing is no longer saved on this device.');
        const pdf = await openPdf(saved.pdf);
        closePdf(latest.current.session?.pdf);
        start({ id, name: saved.meta.name, bytes: saved.pdf, pdf, pageCount: pdf.numPages }, saved.data, false);
      } catch (e) {
        setError(friendlyOpenError(e));
        refreshDrawings();
      } finally {
        setOpening(false);
      }
    },
    [start, refreshDrawings],
  );

  const goHome = useCallback(() => {
    closePdf(latest.current.session?.pdf);
    setSession(null);
    setArmed(null);
    setSelection([]);
    setError(null);
    refreshDrawings();
  }, [refreshDrawings]);

  // Drop a PDF anywhere in the window.
  useEffect(() => {
    const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files');
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setFileDragOver(true);
    };
    const leave = (e: DragEvent) => {
      if (e.relatedTarget === null) setFileDragOver(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setFileDragOver(false);
      const file = e.dataTransfer?.files[0];
      if (file) void openFile(file);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, [openFile]);

  // ── Autosave ────────────────────────────────────────────────────────────
  const persist = useCallback(async () => {
    const { session: s, data } = latest.current;
    if (!s || data === savedData.current) return;
    setSaveState('saving');
    try {
      await saveDrawing({ id: s.id, name: s.name, pageCount: s.pageCount, data });
      savedData.current = data;
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, []);

  useEffect(() => {
    if (!session || editor.data === savedData.current) return;
    const t = setTimeout(persist, 300);
    return () => clearTimeout(t);
  }, [editor.data, session, persist]);

  useEffect(() => {
    const flush = () => document.visibilityState === 'hidden' && void persist();
    const flushNow = () => void persist();
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flushNow);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flushNow);
    };
  }, [persist]);

  // ── Editing actions ─────────────────────────────────────────────────────
  const place = useCallback(
    (type: string, x: number, y: number) => {
      const id = newId();
      dispatch({ type: 'add', page, marker: { id, type, x, y, rotation: 0, label: '' } });
      setSelection([id]);
    },
    [page],
  );

  const rotateBy = useCallback(
    (degrees: number) => selectedIds.length && dispatch({ type: 'rotateBy', page, ids: selectedIds, degrees }),
    [page, selectedIds],
  );

  const remove = useCallback(() => {
    if (!selectedIds.length) return;
    dispatch({ type: 'remove', page, ids: selectedIds });
    setSelection([]);
  }, [page, selectedIds]);

  const duplicate = useCallback(() => {
    if (!selectedIds.length) return;
    const newIds = selectedIds.map(() => newId());
    dispatch({ type: 'duplicate', page, ids: selectedIds, newIds, offset: 14 });
    setSelection(newIds);
  }, [page, selectedIds]);

  const goToPage = useCallback(
    (n: number) => {
      if (!session) return;
      const next = Math.min(session.pageCount, Math.max(1, Math.round(n)));
      if (next !== page) {
        setPage(next);
        setSelection([]);
      }
    },
    [session, page],
  );

  const arm = useCallback((id: string | null) => {
    setArmed(id);
    setSelection([]);
    if (id) setPanel(null);
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) {
        if (e.key === 'Escape') (t as HTMLElement).blur();
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'z') {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' });
      } else if (mod && key === 'y') {
        e.preventDefault();
        dispatch({ type: 'redo' });
      } else if (mod && key === 'd') {
        e.preventDefault();
        duplicate();
      } else if (mod) {
        return;
      } else if (key === 'delete' || key === 'backspace') {
        if (selectedIds.length) {
          e.preventDefault();
          remove();
        }
      } else if (key === 'escape') {
        if (armed) setArmed(null);
        else setSelection([]);
        setPanel(null);
      } else if (key === 'r') {
        rotateBy(e.shiftKey ? -45 : 45);
      } else if (key.startsWith('arrow') && selectedIds.length) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
        const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
        dispatch({ type: 'moveBy', page, ids: selectedIds, dx, dy, key: `nudge:${selectedIds.join()}` });
      } else if (key === '+' || key === '=') {
        viewerRef.current?.zoomBy(1.25);
      } else if (key === '-') {
        viewerRef.current?.zoomBy(0.8);
      } else if (key === '0') {
        viewerRef.current?.fit('page');
      } else if (key === '[') {
        goToPage(page - 1);
      } else if (key === ']') {
        goToPage(page + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session, armed, selectedIds, page, duplicate, remove, rotateBy, goToPage]);

  // ── Export ──────────────────────────────────────────────────────────────
  const exportPdf = async () => {
    if (!session) return;
    setExporting(true);
    setError(null);
    try {
      const out = await buildMarkedUpPdf({
        bytes: session.bytes,
        pdf: session.pdf,
        data: editor.data,
        title: session.name,
        includeSchedule: true,
      });
      downloadBlob(new Blob([out as BlobPart], { type: 'application/pdf' }), `${session.name} - marked up.pdf`);
    } catch (e) {
      setError(`Couldn’t create the marked-up PDF: ${(e as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  const exportCsv = () => {
    if (!session) return;
    const csv = buildScheduleCsv(editor.data, session.pageCount);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${session.name} - symbol schedule.csv`);
  };

  const filePicker = (
    <input
      ref={fileInput}
      type="file"
      accept="application/pdf,.pdf"
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) void openFile(f);
        e.target.value = '';
      }}
    />
  );

  const dropOverlay = fileDragOver && (
    <div className="drop-overlay" aria-hidden="true">
      <Icon name="upload" size={40} />
      <p>Drop a PDF to open it</p>
    </div>
  );

  const errorBanner = error && (
    <div className="banner" role="alert">
      <span>{error}</span>
      <button type="button" className="btn btn--ghost btn--icon" aria-label="Dismiss message" onClick={() => setError(null)}>
        <Icon name="x" size={18} />
      </button>
    </div>
  );

  if (!session) {
    return (
      <>
        {errorBanner}
        <StartScreen
          drawings={drawings}
          busy={opening}
          onFile={(f) => void openFile(f)}
          onOpenSaved={(id) => void openSaved(id)}
          onDeleteSaved={(id) => void deleteDrawing(id).then(refreshDrawings)}
        />
        {dropOverlay}
      </>
    );
  }

  return (
    <div className="app">
      <TopBar
        name={session.name}
        saveState={saveState}
        canUndo={editor.past.length > 0}
        canRedo={editor.future.length > 0}
        zoomPercent={Math.round(zoom * 100)}
        busy={exporting}
        onHome={goHome}
        onOpenFile={() => fileInput.current?.click()}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        onZoomIn={() => viewerRef.current?.zoomBy(1.25)}
        onZoomOut={() => viewerRef.current?.zoomBy(0.8)}
        onFit={() => viewerRef.current?.fit('page')}
        onExportPdf={() => void exportPdf()}
        onExportCsv={exportCsv}
        onTogglePalette={() => setPanel((p) => (p === 'palette' ? null : 'palette'))}
        onToggleInspector={() => setPanel((p) => (p === 'inspector' ? null : 'inspector'))}
      />
      {errorBanner}
      {filePicker}

      <div className="workspace">
        <aside className={`panel panel--palette${panel === 'palette' ? ' is-open' : ''}`} aria-label="Symbol palette">
          <Palette armed={armed} onArm={arm} disabled={false} />
        </aside>

        <main className="stage">
          <PlanViewer
            key={session.id}
            ref={viewerRef}
            pdf={session.pdf}
            pageNum={page}
            markers={markers}
            symbolScale={symbolScale}
            selected={selectedIds}
            armed={armed}
            onPlace={place}
            onSelect={setSelection}
            onMove={(ids, dx, dy, key) => dispatch({ type: 'moveBy', page, ids, dx, dy, key })}
            onZoom={setZoom}
            onError={setError}
          />

          {armed && (
            <div className="stage__hint" role="status">
              <span>
                Placing <strong>{getSymbol(armed).name}</strong>
                <span className="hide-xs"> – click the plan to drop it</span>
              </span>
              <button type="button" className="btn btn--sm" onClick={() => setArmed(null)}>
                Done <kbd className="hide-xs">Esc</kbd>
              </button>
            </div>
          )}

          {session.pageCount > 1 && (
            <nav className="pagenav" aria-label="Pages">
              <button type="button" className="btn btn--ghost btn--icon" onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label="Previous page" title="Previous page ([)">
                <Icon name="chevronLeft" />
              </button>
              <label className="pagenav__label">
                <span className="visually-hidden">Page number</span>
                <input
                  className="input pagenav__input"
                  type="number"
                  min={1}
                  max={session.pageCount}
                  value={page}
                  onChange={(e) => e.target.value && goToPage(Number(e.target.value))}
                />
                <span aria-hidden="true">of {session.pageCount}</span>
              </label>
              <button type="button" className="btn btn--ghost btn--icon" onClick={() => goToPage(page + 1)} disabled={page >= session.pageCount} aria-label="Next page" title="Next page (])">
                <Icon name="chevronRight" />
              </button>
            </nav>
          )}
        </main>

        <aside className={`panel panel--inspector${panel === 'inspector' ? ' is-open' : ''}`} aria-label="Selection and schedule">
          <Inspector
            page={page}
            data={editor.data}
            markers={markers}
            selected={selectedMarkers}
            symbolScale={symbolScale}
            onLabel={(label) => dispatch({ type: 'update', page, ids: selectedIds, patch: { label }, key: `label:${selectedIds.join()}` })}
            onRotateBy={rotateBy}
            onRotateTo={(deg) => dispatch({ type: 'update', page, ids: selectedIds, patch: { rotation: ((deg % 360) + 360) % 360 }, key: `rot:${selectedIds.join()}` })}
            onDuplicate={duplicate}
            onDelete={remove}
            onScale={(scale) => dispatch({ type: 'setSymbolScale', page, scale })}
            onSelectType={(type) => setSelection(markers.filter((m) => m.type === type).map((m) => m.id))}
          />
        </aside>
        {panel && <button type="button" className="scrim" aria-label="Close panel" onClick={() => setPanel(null)} />}
      </div>
      {dropOverlay}
    </div>
  );
}
