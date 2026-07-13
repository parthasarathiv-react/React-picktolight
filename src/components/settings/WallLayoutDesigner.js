import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Button } from 'components/ui/button';
import { ArrowLeft, Save, CheckCircle2, Plus, RotateCcw, X, Grid3X3 } from 'lucide-react';
import { WALLS_CONFIG } from 'lib/dataStore';
import { cn } from 'lib/utils';

const CELL = 56;
const MIN_ROWS = 10;
const ROW_LABEL_W = 24;   // px for A–N labels on the left
const COL_LABEL_H = 18;   // px for 1–N labels on top

export default function WallLayoutDesigner({ controller, onBack }) {
    const [canvasWalls, setCanvasWalls] = useState([]);
    const [dragging, setDragging] = useState(null);
    const [saveFlash, setSaveFlash] = useState(false);
    const [gridCols, setGridCols] = useState(16);

    const gridContainerRef = useRef(null);  // the scrollable area
    const canvasRef = useRef(null);

    const controllerWalls = WALLS_CONFIG.filter(w => w.controller === controller.name);

    // ── Responsive COLS: measure container, recalc on resize ─────────────────
    useLayoutEffect(() => {
        const el = gridContainerRef.current;
        if (!el) return;
        const measure = () => {
            // available px = container width - row labels - padding (16 each side)
            const avail = el.clientWidth - ROW_LABEL_W - 32;
            setGridCols(Math.max(8, Math.floor(avail / CELL)));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // ── Dynamic ROWS: grows as walls are placed lower ─────────────────────────
    const gridRows = Math.max(
        MIN_ROWS,
        ...canvasWalls.map(w => {
            const hCells = w.orientation === 'v' ? Math.max(2, w.cupboardsCount) : 1;
            return w.gridY + hCells + 2;   // +2 breathing room
        })
    );

    // ── Wall cell dimensions ──────────────────────────────────────────────────
    const wallCells = (w) => ({
        wCells: w.orientation === 'h' ? Math.max(2, w.cupboardsCount) : 1,
        hCells: w.orientation === 'v' ? Math.max(2, w.cupboardsCount) : 1,
    });

    const wallPx = (w) => {
        const { wCells, hCells } = wallCells(w);
        return { width: wCells * CELL - 4, height: hCells * CELL - 4 };
    };

    // ── Add wall directly (cycles through controllerWalls) ───────────────────
    const addWall = () => {
        if (controllerWalls.length === 0) return;
        const wall = controllerWalls[canvasWalls.length % controllerWalls.length];
        setCanvasWalls(prev => {
            const col = (prev.length % 4) * 3;
            const row = Math.floor(prev.length / 4) * 2;
            return [...prev, {
                ...wall,
                canvasId: `wall-${wall.id}-${Date.now()}`,
                gridX: Math.min(col, Math.max(0, gridCols - Math.max(2, wall.cupboardsCount))),
                gridY: row,
                orientation: 'h',
            }];
        });
    };

    const removeWall = (canvasId) =>
        setCanvasWalls(prev => prev.filter(w => w.canvasId !== canvasId));

    const toggleOrientation = (canvasId) =>
        setCanvasWalls(prev =>
            prev.map(w => w.canvasId === canvasId
                ? { ...w, orientation: w.orientation === 'h' ? 'v' : 'h' }
                : w)
        );

    // ── Drag ─────────────────────────────────────────────────────────────────
    const startDrag = (e, canvasId) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        const wr = e.currentTarget.getBoundingClientRect();
        setDragging({ canvasId, offsetX: e.clientX - wr.left, offsetY: e.clientY - wr.top });
    };

    const onMouseMove = useCallback((e) => {
        if (!dragging || !canvasRef.current) return;
        const wall = canvasWalls.find(w => w.canvasId === dragging.canvasId);
        if (!wall) return;
        const { wCells, hCells } = wallCells(wall);
        const cr = canvasRef.current.getBoundingClientRect();

        const rawX = Math.round((e.clientX - cr.left - dragging.offsetX) / CELL);
        const rawY = Math.round((e.clientY - cr.top - dragging.offsetY) / CELL);

        // Clamp X inside grid columns; Y only >= 0 (rows grow downward)
        const gridX = Math.max(0, Math.min(gridCols - wCells, rawX));
        const gridY = Math.max(0, rawY);

        setCanvasWalls(prev =>
            prev.map(w => w.canvasId === dragging.canvasId ? { ...w, gridX, gridY } : w)
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragging, gridCols, canvasWalls]);

    const onMouseUp = useCallback(() => setDragging(null), []);

    useEffect(() => {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = () => {
        canvasWalls.forEach(w => {
            const idx = WALLS_CONFIG.findIndex(c => c.id === w.id);
            if (idx >= 0) {
                WALLS_CONFIG[idx] = {
                    ...WALLS_CONFIG[idx],
                    layoutGridX: w.gridX,
                    layoutGridY: w.gridY,
                    layoutOrientation: w.orientation,
                };
            }
        });
        setSaveFlash(true);
        setTimeout(() => setSaveFlash(false), 2000);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in">

            {/* ── Top Bar ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-ot-border bg-ot-surface-top shrink-0 gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={onBack}
                        className="text-muted-foreground hover:text-white gap-2 h-8 px-3">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <div className="h-5 w-px bg-ot-border" />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm font-semibold text-white">{controller.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{controller.ip}:{controller.port}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={addWall}
                        disabled={controllerWalls.length === 0}
                        className="gap-2 h-8 px-4 bg-ot-surface-elev-bottom border border-ot-border text-white hover:bg-ot-surface-top text-sm disabled:opacity-40"
                    >
                        <Plus className="w-4 h-4" /> Add Wall
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={canvasWalls.length === 0}
                        className={cn(
                            'gap-2 h-8 px-4 text-sm transition-all duration-300 disabled:opacity-40',
                            saveFlash
                                ? 'bg-green-600 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                                : 'bg-ot-action text-white hover:bg-ot-action-hover'
                        )}
                    >
                        {saveFlash
                            ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                            : <><Save className="w-4 h-4" /> Save Layout</>
                        }
                    </Button>
                </div>
            </div>

            {/* ── Body ────────────────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* Scrollable grid area — fills all available width */}
                <div
                    ref={gridContainerRef}
                    className="flex-1 overflow-auto p-4"
                    style={{ cursor: dragging ? 'grabbing' : 'default' }}
                >
                    {/* Column numbers */}
                    <div className="flex mb-0.5" style={{ paddingLeft: ROW_LABEL_W }}>
                        {Array.from({ length: gridCols }).map((_, i) => (
                            <div key={i}
                                className="text-[9px] text-muted-foreground/40 font-mono text-center flex-shrink-0"
                                style={{ width: CELL }}>
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    <div className="flex">
                        {/* Row labels (A, B, C…) */}
                        <div className="flex flex-col flex-shrink-0" style={{ width: ROW_LABEL_W }}>
                            {Array.from({ length: gridRows }).map((_, i) => (
                                <div key={i}
                                    className="text-[9px] text-muted-foreground/40 font-mono flex items-center justify-center flex-shrink-0"
                                    style={{ height: CELL }}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>

                        {/* Canvas — width fills container, height grows dynamically */}
                        <div
                            ref={canvasRef}
                            className="relative rounded-xl border border-ot-border bg-ot-surface-top flex-shrink-0"
                            style={{
                                width: gridCols * CELL,
                                height: gridRows * CELL,
                                userSelect: 'none',
                            }}
                        >
                            {/* Grid lines — columns */}
                            {Array.from({ length: gridCols + 1 }).map((_, i) => (
                                <div key={`cl-${i}`} className="absolute top-0 bottom-0 flex-shrink-0"
                                    style={{ left: i * CELL, borderLeft: '1px solid rgba(255,255,255,0.05)' }} />
                            ))}
                            {/* Grid lines — rows */}
                            {Array.from({ length: gridRows + 1 }).map((_, i) => (
                                <div key={`rl-${i}`} className="absolute left-0 right-0"
                                    style={{ top: i * CELL, borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                            ))}

                            {/* Empty state */}
                            {canvasWalls.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                                    <Grid3X3 className="w-10 h-10 text-muted-foreground/15" />
                                    <span className="text-xs text-muted-foreground/25">
                                        Click "Add Wall" to place walls on the grid
                                    </span>
                                </div>
                            )}

                            {/* Placed walls */}
                            {canvasWalls.map(wall => {
                                const { width, height } = wallPx(wall);
                                const isActive = dragging?.canvasId === wall.canvasId;
                                return (
                                    <div
                                        key={wall.canvasId}
                                        onMouseDown={(e) => startDrag(e, wall.canvasId)}
                                        className={cn(
                                            'absolute rounded-lg border-2 flex flex-col p-1.5 overflow-hidden transition-colors',
                                            isActive
                                                ? 'border-ot-action bg-ot-action/20 shadow-xl shadow-ot-action/30 cursor-grabbing z-20'
                                                : 'border-ot-action/50 bg-ot-action/8 hover:border-ot-action hover:bg-ot-action/15 cursor-grab z-10'
                                        )}
                                        style={{
                                            left: wall.gridX * CELL + 2,
                                            top: wall.gridY * CELL + 2,
                                            width,
                                            height,
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-1 shrink-0">
                                            <span className="text-[9px] font-bold text-ot-action truncate">{wall.name}</span>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleOrientation(wall.canvasId); }}
                                                    title="Rotate"
                                                    className="w-3.5 h-3.5 rounded flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
                                                    <RotateCcw className="w-2 h-2" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeWall(wall.canvasId); }}
                                                    title="Remove"
                                                    className="w-3.5 h-3.5 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                                    <X className="w-2 h-2" />
                                                </button>
                                            </div>
                                        </div>
                                        {/* Cupboard mini tiles */}
                                        <div className="flex flex-wrap gap-0.5 mt-1 overflow-hidden"
                                            style={{ flexDirection: wall.orientation === 'v' ? 'column' : 'row' }}>
                                            {Array.from({ length: wall.cupboardsCount }).map((_, i) => (
                                                <div key={i}
                                                    className="rounded-sm bg-ot-action/35 border border-ot-action/40 flex-shrink-0"
                                                    style={{ width: 11, height: 11 }} />
                                            ))}
                                        </div>
                                        {/* Position tag */}
                                        <div className="absolute bottom-0.5 right-1.5">
                                            <span className="text-[8px] text-muted-foreground/40 font-mono">
                                                {String.fromCharCode(65 + wall.gridY)}{wall.gridX + 1}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Right: thin scrollable placed-walls list ──────────────── */}
                <div className="w-44 flex-shrink-0 border-l border-ot-border flex flex-col">
                    <div className="px-3 py-2.5 border-b border-ot-border shrink-0">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Placed Walls
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                            {canvasWalls.length} wall{canvasWalls.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {canvasWalls.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground/40 text-center px-3 leading-relaxed">
                                No walls placed yet
                            </span>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto py-1.5 px-2 space-y-1"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                            {canvasWalls.map((w) => (
                                <div key={w.canvasId}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-ot-surface-elev-bottom/60 border border-ot-border/50 group">
                                    <div className="w-1.5 h-1.5 rounded-full bg-ot-action mt-1.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-semibold text-white truncate">{w.name}</div>
                                        <div className="text-[9px] text-muted-foreground font-mono">
                                            {String.fromCharCode(65 + w.gridY)}{w.gridX + 1}
                                            {' · '}{w.orientation === 'h' ? '↔' : '↕'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeWall(w.canvasId)}
                                        className="opacity-0 group-hover:opacity-100 w-3.5 h-3.5 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-all shrink-0 mt-0.5">
                                        <X className="w-2 h-2" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
