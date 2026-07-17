import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Button } from 'components/ui/button';
import { ArrowLeft, Save, CheckCircle2, Plus, X, Box, Grid3X3 } from 'lucide-react';
import { cn } from 'lib/utils';

const CELL = 120;
const MIN_ROWS = 4;
const MIN_COLS = 8;
const ROW_LABEL_W = 24;
const DRAG_THRESHOLD = 5; // pixels moved before it counts as a drag

export default function CupboardLayoutDesigner({ wall, onBack, cupboardsData, syncCupboards }) {
    const [canvasCupboards, setCanvasCupboards] = useState([]);
    const [dragging, setDragging] = useState(null);
    const [saveFlash, setSaveFlash] = useState(false);
    const [gridCols, setGridCols] = useState(MIN_COLS);


    // Track whether user actually moved during a drag (to distinguish drag vs click)
    const didDragRef = useRef(false);
    const mouseDownPosRef = useRef({ x: 0, y: 0 });

    const gridContainerRef = useRef(null);
    const canvasRef = useRef(null);

    // All cupboards assigned to this wall
    const wallCupboards = cupboardsData.filter(c => c.wall === wall.name);

    // Load layout
    useEffect(() => {
        const placed = wallCupboards.map(c => ({
            ...c,
            canvasId: `cb-${c.id}`,
            gridX: c.layoutGridX !== undefined ? c.layoutGridX : 0,
            gridY: c.layoutGridY !== undefined ? c.layoutGridY : 0,
        }));
        setCanvasCupboards(placed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wall.name]);

    useLayoutEffect(() => {
        const el = gridContainerRef.current;
        if (!el) return;
        const measure = () => {
            const avail = el.clientWidth - ROW_LABEL_W - 32;
            setGridCols(Math.max(MIN_COLS, Math.floor(avail / CELL)));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
    }, []);

    const gridRows = Math.max(
        MIN_ROWS,
        ...canvasCupboards.map(c => c.gridY + 2)
    );

    const addCupboard = () => {
        const newId = Date.now();
        const newCb = {
            id: newId,
            canvasId: `cb-${newId}`,
            name: `Cupboard ${canvasCupboards.length + 1}`,
            shelves: 5,
            rows: 5,
            columns: 4,
            ledsPerDrawer: 6,
            controller: wall.controller,
            wall: wall.name,
            status: 'Active',
            gridX: canvasCupboards.length % gridCols,
            gridY: Math.floor(canvasCupboards.length / gridCols)
        };
        setCanvasCupboards([...canvasCupboards, newCb]);
    };

    const removeCupboard = (canvasId) => {
        setCanvasCupboards(prev => prev.filter(c => c.canvasId !== canvasId));
    };

    const startDrag = (e, canvasId) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        const wr = e.currentTarget.getBoundingClientRect();
        didDragRef.current = false;
        mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
        setDragging({ canvasId, offsetX: e.clientX - wr.left, offsetY: e.clientY - wr.top });
    };

    const onMouseMove = useCallback((e) => {
        if (!dragging || !canvasRef.current) return;

        // Check if user moved past threshold
        const dx = e.clientX - mouseDownPosRef.current.x;
        const dy = e.clientY - mouseDownPosRef.current.y;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
            didDragRef.current = true;
        }

        const cb = canvasCupboards.find(c => c.canvasId === dragging.canvasId);
        if (!cb) return;
        const cr = canvasRef.current.getBoundingClientRect();

        const rawX = Math.round((e.clientX - cr.left - dragging.offsetX) / CELL);
        const rawY = Math.round((e.clientY - cr.top - dragging.offsetY) / CELL);

        const gridX = Math.max(0, Math.min(gridCols - 1, rawX));
        const gridY = Math.max(0, rawY);

        setCanvasCupboards(prev =>
            prev.map(c => c.canvasId === dragging.canvasId ? { ...c, gridX, gridY } : c)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragging, gridCols, canvasCupboards]);

    const onMouseUp = useCallback(() => setDragging(null), []);

    useEffect(() => {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    const handleSave = () => {
        // Sync back to global cupboards state
        const otherCupboards = cupboardsData.filter(c => c.wall !== wall.name);
        const updatedWallCupboards = canvasCupboards.map(c => {
            const originalC = cupboardsData.find(cd => cd.id === c.id) || c;
            return {
                ...originalC,
                layoutGridX: c.gridX,
                layoutGridY: c.gridY,
            };
        });

        const newGlobalState = [...otherCupboards, ...updatedWallCupboards];
        syncCupboards(newGlobalState);

        // Also persist this to local storage for cupboards
        try {
            const layouts = JSON.parse(localStorage.getItem('cupboardLayouts') || '{}');
            updatedWallCupboards.forEach(c => {
                layouts[c.id] = {
                    ...(layouts[c.id] || {}),
                    layoutGridX: c.layoutGridX,
                    layoutGridY: c.layoutGridY,
                    shelves: c.shelves,
                    rows: c.rows,
                    ledsPerDrawer: c.ledsPerDrawer,
                    shelfLayout: c.shelfLayout
                };
            });
            localStorage.setItem('cupboardLayouts', JSON.stringify(layouts));
        } catch (e) { }

        setSaveFlash(true);
        setTimeout(() => setSaveFlash(false), 2000);
    };



    return (
        <div className="flex flex-col h-full animate-in fade-in">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-ot-border bg-ot-surface-top shrink-0 gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={onBack}
                        className="text-muted-foreground hover:text-white gap-2 h-8 px-3">
                        <ArrowLeft className="w-4 h-4" /> Back to Walls
                    </Button>
                    <div className="h-5 w-px bg-ot-border" />
                    <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-ot-action" />
                        <span className="text-sm font-semibold text-white">{wall.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">Cupboards Designer</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={addCupboard}
                        className="gap-2 h-8 px-4 bg-ot-surface-elev-bottom border border-ot-border text-white hover:bg-ot-surface-top text-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Cupboard
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={canvasCupboards.length === 0}
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

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                <div
                    ref={gridContainerRef}
                    className="flex-1 overflow-auto p-4"
                    style={{ cursor: dragging ? 'grabbing' : 'default' }}
                >
                    <div className="flex mb-0.5" style={{ paddingLeft: ROW_LABEL_W }}>
                        {Array.from({ length: gridCols }).map((_, i) => (
                            <div key={i} className="text-[9px] text-muted-foreground/40 font-mono text-center flex-shrink-0" style={{ width: CELL }}>
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    <div className="flex">
                        <div className="flex flex-col flex-shrink-0" style={{ width: ROW_LABEL_W }}>
                            {Array.from({ length: gridRows }).map((_, i) => (
                                <div key={i} className="text-[9px] text-muted-foreground/40 font-mono flex items-center justify-center flex-shrink-0" style={{ height: CELL }}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>

                        <div
                            ref={canvasRef}
                            className="relative rounded-xl border border-ot-border bg-ot-surface-top flex-shrink-0"
                            style={{
                                width: gridCols * CELL,
                                height: gridRows * CELL,
                                userSelect: 'none',
                            }}
                        >
                            {/* Grid lines */}
                            {Array.from({ length: gridCols + 1 }).map((_, i) => (
                                <div key={`cl-${i}`} className="absolute top-0 bottom-0 flex-shrink-0" style={{ left: i * CELL, borderLeft: '1px solid rgba(255,255,255,0.05)' }} />
                            ))}
                            {Array.from({ length: gridRows + 1 }).map((_, i) => (
                                <div key={`rl-${i}`} className="absolute left-0 right-0" style={{ top: i * CELL, borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                            ))}

                            {/* Empty state */}
                            {canvasCupboards.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                                    <Grid3X3 className="w-10 h-10 text-muted-foreground/15" />
                                    <span className="text-xs text-muted-foreground/25">
                                        Click "Add Cupboard" to place cupboards on the grid
                                    </span>
                                </div>
                            )}

                            {/* Placed Cupboards */}
                            {canvasCupboards.map(cb => {
                                const isActive = dragging?.canvasId === cb.canvasId;
                                return (
                                    <div
                                        key={cb.canvasId}
                                        onMouseDown={(e) => startDrag(e, cb.canvasId)}
                                        onMouseUp={() => {
                                            // Reset drag state
                                            setTimeout(() => {
                                                didDragRef.current = false;
                                            }, 0);
                                        }}
                                        className={cn(
                                            'absolute rounded-lg border-2 flex flex-col p-2 overflow-hidden transition-colors',
                                            isActive
                                                ? 'border-ot-action bg-ot-action/20 shadow-xl shadow-ot-action/30 cursor-grabbing z-20'
                                                : 'border-ot-action/50 bg-ot-action/8 hover:border-ot-action hover:bg-ot-action/15 cursor-grab z-10'
                                        )}
                                        style={{
                                            left: cb.gridX * CELL + 4,
                                            top: cb.gridY * CELL + 4,
                                            width: CELL - 8,
                                            height: CELL - 8,
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-1 shrink-0">
                                            <span className="text-[10px] font-bold text-white truncate">{cb.name}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeCupboard(cb.canvasId); }}
                                                className="w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="mt-2 text-[10px] text-muted-foreground">
                                            {cb.shelves || 5} Shelves<br />
                                            {cb.columns || 4} Columns
                                        </div>
                                        {/* Position tag */}
                                        <div className="absolute bottom-0.5 right-1.5">
                                            <span className="text-[8px] text-muted-foreground/40 font-mono">
                                                {String.fromCharCode(65 + cb.gridY)}{cb.gridX + 1}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: placed cupboards list */}
                <div className="w-44 flex-shrink-0 border-l border-ot-border flex flex-col">
                    <div className="px-3 py-2.5 border-b border-ot-border shrink-0">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Placed Cupboards
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                            {canvasCupboards.length} cupboard{canvasCupboards.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {canvasCupboards.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground/40 text-center px-3 leading-relaxed">
                                No cupboards placed yet
                            </span>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto py-1.5 px-2 space-y-1"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                            {canvasCupboards.map((c) => (
                                <div key={c.canvasId}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-ot-surface-elev-bottom/60 border border-ot-border/50 group hover:border-ot-action/50 transition-colors"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-ot-action mt-1.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-semibold text-white truncate">{c.name}</div>
                                        <div className="text-[9px] text-muted-foreground font-mono">
                                            {String.fromCharCode(65 + c.gridY)}{c.gridX + 1}
                                            {' · '}{c.shelves || 5} shelves
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeCupboard(c.canvasId); }}
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
