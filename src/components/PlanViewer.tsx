import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { pageSize, renderScaleFor, type PageSize, type PdfDoc, type PdfPage } from '../pdf/pdfjs';
import type { Marker } from '../state/types';
import { GlyphShape } from '../symbols/Glyph';
import { getSymbol } from '../symbols/catalog';
import { glyphUnit } from '../symbols/sizing';
import { MarkerShape } from './MarkerShape';

export const SYMBOL_DRAG_TYPE = 'application/x-md-symbol';

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 10;
const DRAG_THRESHOLD_PX = 4;

export interface PlanViewerHandle {
  zoomBy: (factor: number) => void;
  setZoomPercent: (percent: number) => void;
  fit: (mode: 'page' | 'width') => void;
}

interface Props {
  pdf: PdfDoc;
  pageNum: number;
  markers: Marker[];
  symbolScale: number;
  selected: string[];
  /** Symbol id armed for click-to-place, or null for select mode. */
  armed: string | null;
  onPlace: (type: string, x: number, y: number) => void;
  onSelect: (ids: string[]) => void;
  onMove: (ids: string[], dx: number, dy: number, key: string) => void;
  onZoom: (zoom: number) => void;
  onError: (message: string) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const PlanViewer = forwardRef<PlanViewerHandle, Props>(function PlanViewer(props, ref) {
  const { pdf, pageNum, markers, symbolScale, selected, armed } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ghostRef = useRef<SVGGElement>(null);

  const [page, setPage] = useState<PdfPage | null>(null);
  const [size, setSize] = useState<PageSize | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoomState] = useState(1);
  const [renderZoom, setRenderZoom] = useState<number | null>(null);
  const [panReady, setPanReady] = useState(false);

  // Latest values for window-level handlers.
  const live = useRef({ ...props, zoom, size });
  live.current = { ...props, zoom, size };

  const zoomMemory = useRef<Record<number, number>>({});
  const anchor = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null);
  const spaceDown = useRef(false);
  const justDragged = useRef(false);

  const viewPad = () => (window.innerWidth < 860 ? 12 : 24);

  const fitZoom = useCallback((s: PageSize, mode: 'page' | 'width') => {
    const el = scrollRef.current;
    if (!el) return 1;
    const pad = viewPad() * 2;
    const w = Math.max(100, el.clientWidth - pad) / s.width;
    const h = Math.max(100, el.clientHeight - pad) / s.height;
    return clamp(mode === 'width' ? w : Math.min(w, h), MIN_ZOOM, MAX_ZOOM);
  }, []);

  const applyZoom = useCallback(
    (next: number, at?: { clientX: number; clientY: number }) => {
      const { zoom: current } = live.current;
      const z = clamp(next, MIN_ZOOM, MAX_ZOOM);
      if (z === current) return;
      const sheet = sheetRef.current;
      const sc = scrollRef.current;
      if (sheet && sc) {
        const r = sheet.getBoundingClientRect();
        const sr = sc.getBoundingClientRect();
        const cx = at?.clientX ?? sr.left + sr.width / 2;
        const cy = at?.clientY ?? sr.top + sr.height / 2;
        anchor.current = { px: (cx - r.left) / current, py: (cy - r.top) / current, cx, cy };
      }
      zoomMemory.current[live.current.pageNum] = z;
      setZoomState(z);
      live.current.onZoom(z);
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (f) => applyZoom(live.current.zoom * f),
      setZoomPercent: (p) => applyZoom(p / 100),
      fit: (mode) => {
        const s = live.current.size;
        if (s) applyZoom(fitZoom(s, mode));
      },
    }),
    [applyZoom, fitZoom],
  );

  // ── Load the page, choose its starting zoom ────────────────────────────
  useEffect(() => {
    let alive = true;
    setReady(false);
    setPage(null);
    pdf
      .getPage(pageNum)
      .then((p) => {
        if (!alive) return;
        const s = pageSize(p);
        const z = zoomMemory.current[pageNum] ?? fitZoom(s, 'page');
        setSize(s);
        setPage(p);
        setZoomState(z);
        setRenderZoom(z);
        live.current.onZoom(z);
      })
      .catch((e) => alive && live.current.onError(`Could not load page ${pageNum}: ${e?.message ?? e}`));
    return () => {
      alive = false;
    };
  }, [pdf, pageNum, fitZoom]);

  // Keep the point under the cursor fixed while zooming.
  useLayoutEffect(() => {
    const a = anchor.current;
    const sheet = sheetRef.current;
    const sc = scrollRef.current;
    if (!a || !sheet || !sc) return;
    anchor.current = null;
    const r = sheet.getBoundingClientRect();
    sc.scrollLeft += r.left + a.px * zoom - a.cx;
    sc.scrollTop += r.top + a.py * zoom - a.cy;
  }, [zoom]);

  // Re-render the bitmap shortly after zooming settles; until then the old bitmap is stretched.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setRenderZoom(zoom), 160);
    return () => clearTimeout(t);
  }, [zoom, ready]);

  useEffect(() => {
    if (!page || !size || renderZoom === null) return;
    const scale = renderScaleFor(size, renderZoom, window.devicePixelRatio || 1);
    const viewport = page.getViewport({ scale });
    const off = document.createElement('canvas');
    off.width = Math.ceil(viewport.width);
    off.height = Math.ceil(viewport.height);
    const task = page.render({ canvas: off, viewport });
    task.promise
      .then(() => {
        const vis = canvasRef.current;
        if (!vis) return;
        vis.width = off.width;
        vis.height = off.height;
        vis.getContext('2d')!.drawImage(off, 0, 0);
        setReady(true);
      })
      .catch((e) => {
        if (e?.name !== 'RenderingCancelledException') live.current.onError(`Could not draw page ${pageNum}: ${e?.message ?? e}`);
      });
    return () => task.cancel();
  }, [page, size, renderZoom, pageNum]);

  // ── Wheel / pinch zoom, space-to-pan ─────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      applyZoom(live.current.zoom * Math.exp(-dy * 0.0022), e);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  useEffect(() => {
    const typing = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName));
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || typing(e.target)) return;
      e.preventDefault();
      spaceDown.current = true;
      setPanReady(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      spaceDown.current = false;
      setPanReady(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Pan (space+drag / middle button) and two-finger pinch on touch screens.
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  const onScrollerPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const sc = scrollRef.current!;
    if (e.pointerType === 'touch') {
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.current.size === 2) {
        const [a, b] = [...touches.current.values()];
        pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: live.current.zoom };
      }
      return;
    }
    if (e.button === 1 || (e.button === 0 && spaceDown.current)) {
      e.preventDefault();
      const start = { x: e.clientX, y: e.clientY, sl: sc.scrollLeft, st: sc.scrollTop };
      sc.classList.add('is-panning');
      const move = (m: PointerEvent) => {
        sc.scrollLeft = start.sl - (m.clientX - start.x);
        sc.scrollTop = start.st - (m.clientY - start.y);
      };
      const end = () => {
        sc.classList.remove('is-panning');
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
    }
  };

  const onScrollerPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch' || !touches.current.has(e.pointerId)) return;
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.current.size === 2 && pinch.current) {
      const [a, b] = [...touches.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      applyZoom(pinch.current.zoom * (dist / pinch.current.dist), {
        clientX: (a.x + b.x) / 2,
        clientY: (a.y + b.y) / 2,
      });
    }
  };

  const onScrollerPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    touches.current.delete(e.pointerId);
    if (touches.current.size < 2) pinch.current = null;
  };

  // ── Plan interactions ──────────────────────────────────────────────────
  const toPage = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    const { size: s, zoom: z } = live.current;
    return {
      x: clamp((clientX - r.left) / z, 0, s?.width ?? 0),
      y: clamp((clientY - r.top) / z, 0, s?.height ?? 0),
    };
  };

  const onSvgClick = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    if (spaceDown.current) return;
    if (armed) {
      const p = toPage(e.clientX, e.clientY);
      props.onPlace(armed, p.x, p.y);
    } else if (!e.shiftKey) {
      props.onSelect([]);
    }
  };

  const onSvgPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const g = ghostRef.current;
    if (!g || !armed || e.pointerType === 'touch') return;
    const p = toPage(e.clientX, e.clientY);
    g.setAttribute('transform', `translate(${p.x} ${p.y})`);
    g.setAttribute('display', 'inline');
  };

  const hideGhost = () => ghostRef.current?.setAttribute('display', 'none');

  const onMarkerPointerDown = (e: ReactPointerEvent<SVGGElement>, id: string) => {
    if (armed || spaceDown.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.stopPropagation();

    let ids = selected;
    if (e.shiftKey) {
      ids = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
      props.onSelect(ids);
      if (!ids.includes(id)) return;
    } else if (!selected.includes(id)) {
      ids = [id];
      props.onSelect(ids);
    }

    const start = { x: e.clientX, y: e.clientY };
    let last = start;
    let moved = false;
    const key = `${id}:${e.timeStamp}`;
    const move = (m: PointerEvent) => {
      if (!moved && Math.hypot(m.clientX - start.x, m.clientY - start.y) < DRAG_THRESHOLD_PX) return;
      moved = true;
      const z = live.current.zoom;
      live.current.onMove(ids, (m.clientX - last.x) / z, (m.clientY - last.y) / z, key);
      last = { x: m.clientX, y: m.clientY };
    };
    const end = () => {
      if (moved) {
        // Swallow the click that follows a drag, but never let the flag outlive it.
        justDragged.current = true;
        setTimeout(() => (justDragged.current = false), 0);
      }
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const onDragOver = (e: DragEvent<SVGSVGElement>) => {
    if (e.dataTransfer.types.includes(SYMBOL_DRAG_TYPE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const onDrop = (e: DragEvent<SVGSVGElement>) => {
    const type = e.dataTransfer.getData(SYMBOL_DRAG_TYPE);
    if (!type) return;
    e.preventDefault();
    const p = toPage(e.clientX, e.clientY);
    props.onPlace(type, p.x, p.y);
  };

  const unit = size ? glyphUnit(size, symbolScale) : 1;
  const selectedSet = new Set(selected);
  const hitRadius = Math.max(unit * 13, 16 / zoom);

  return (
    <div
      ref={scrollRef}
      className={`viewer${panReady ? ' is-pan-ready' : ''}`}
      onPointerDown={onScrollerPointerDown}
      onPointerMove={onScrollerPointerMove}
      onPointerUp={onScrollerPointerEnd}
      onPointerCancel={onScrollerPointerEnd}
    >
      <div className="viewer__stage">
        {!size && (
          <p className="viewer__loading" role="status">
            Loading page…
          </p>
        )}
        {size && (
          <div
            ref={sheetRef}
            className="viewer__sheet"
            style={{ width: size.width * zoom, height: size.height * zoom }}
          >
            <canvas ref={canvasRef} className={`viewer__canvas${ready ? ' is-ready' : ''}`} />
            <svg
              ref={svgRef}
              className={`viewer__overlay${armed ? ' is-armed' : ''}`}
              viewBox={`0 0 ${size.width} ${size.height}`}
              role="group"
              aria-label={`Plan page ${pageNum} markup layer`}
              onClick={onSvgClick}
              onPointerMove={onSvgPointerMove}
              onPointerLeave={hideGhost}
              onDragOver={onDragOver}
              onDrop={onDrop}
              data-testid="plan-overlay"
            >
              {markers.map((m) => {
                const isSel = selectedSet.has(m.id);
                return (
                  <g
                    key={m.id}
                    className="marker"
                    data-marker-id={m.id}
                    data-marker-type={m.type}
                    style={{ pointerEvents: armed ? 'none' : 'all', touchAction: 'none' }}
                    onPointerDown={(e) => onMarkerPointerDown(e, m.id)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <title>{`${getSymbol(m.type).name}${m.label ? ` – ${m.label}` : ''}`}</title>
                    <circle cx={m.x} cy={m.y} r={hitRadius} fill="rgba(0,0,0,0)" />
                    <MarkerShape marker={m} unit={unit} />
                    {isSel && (
                      <circle
                        cx={m.x}
                        cy={m.y}
                        r={unit * 14}
                        fill="rgb(26 115 232 / 8%)"
                        style={{ stroke: 'var(--color-selection)' }}
                        strokeWidth={1.75 / zoom}
                        strokeDasharray={`${5 / zoom} ${3 / zoom}`}
                        pointerEvents="none"
                      />
                    )}
                  </g>
                );
              })}
              {armed && (
                <g ref={ghostRef} display="none" pointerEvents="none">
                  <g transform={`scale(${unit})`}>
                    <GlyphShape type={armed} opacity={0.65} />
                  </g>
                </g>
              )}
            </svg>
            {!ready && (
              <p className="viewer__loading viewer__loading--sheet" role="status">
                Drawing plan…
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
