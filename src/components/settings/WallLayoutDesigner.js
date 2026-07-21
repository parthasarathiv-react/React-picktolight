import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Button } from 'components/ui/button';
import { ArrowLeft, Save, CheckCircle2, Plus, RotateCcw, X, Grid3X3, Server } from 'lucide-react';
import { cn } from 'lib/utils';
import { toast } from 'sonner';

import { apiService } from 'lib/apiService';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from 'components/ui/dialog';

const CELL = 56;
const MIN_ROWS = 10;
const ROW_LABEL_W = 24;   // px for A–N labels on the left
const COL_LABEL_H = 18;   // px for 1–N labels on top

export default function WallLayoutDesigner({ controller, onBack, wallsData, syncWalls }) {
    const [canvasWalls, setCanvasWalls] = useState([]);
    const [dragging, setDragging] = useState(null);
    const [panDragging, setPanDragging] = useState(null);
    const [saveFlash, setSaveFlash] = useState(false);
    const [wallToDelete, setWallToDelete] = useState(null);
    const [minGridCols, setMinGridCols] = useState(16);

    const gridContainerRef = useRef(null);  // the scrollable area
    const canvasRef = useRef(null);

    // ── Load placed walls from API data ───────────────────────
    useEffect(() => {
        if (!wallsData) return;
        const ctrlWalls = wallsData.filter(w => String(w.controller_id) === String(controller.id));
        setCanvasWalls(ctrlWalls.map(w => ({
            ...w,
            canvasId: `wall-${w.id}-${Date.now()}`
        })));
    }, [wallsData, controller.id]);
    // ── Responsive COLS: measure container, recalc on resize ─────────────────
    useLayoutEffect(() => {
        const el = gridContainerRef.current;
        if (!el) return;
        const measure = () => {
            // available px = container width - row labels - padding (16 each side)
            const avail = el.clientWidth - ROW_LABEL_W - 32;
            setMinGridCols(Math.max(8, Math.floor(avail / CELL)));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // ── Dynamic COLS: grows as walls are placed further right ────────────────
    const gridCols = Math.max(
        minGridCols,
        ...canvasWalls.map(w => {
            const wCells = w.orientation === 'h' ? Math.max(2, w.cupboardsCount) : 1;
            return w.gridX + wCells + 2;   // +2 breathing room
        })
    );

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

    const addWall = () => {
        const newId = Math.max(0, ...canvasWalls.map(w => w.id || 0)) + 1;
        const wall = {
            id: newId,
            isNew: true,
            name: `Wall ${newId}`,
            controller: controller.name,
            controller_id: controller.id,
            cupboardsCount: 4,
            status: 'Active'
        };

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

    const requestRemoveWall = (canvasId) => {
        setWallToDelete(canvasId);
    };

    const confirmRemoveWall = async () => {
        if (!wallToDelete) return;
        const wall = canvasWalls.find(w => w.canvasId === wallToDelete);
        
        if (wall && !wall.isNew) {
            try {
                await apiService.deleteWall(wall.id);
                // Immediately remove from global state so it doesn't reappear
                const updatedData = wallsData.filter(ew => String(ew.id) !== String(wall.id));
                syncWalls(updatedData);
                toast.success("Wall deleted successfully");
            } catch (err) {
                console.error("Failed to delete wall", err);
                toast.error(err.message || "Failed to delete wall");
                setWallToDelete(null);
                return;
            }
        }
        
        setCanvasWalls(prev => prev.filter(w => w.canvasId !== wallToDelete));
        setWallToDelete(null);
    };

    const toggleOrientation = (canvasId) =>
        setCanvasWalls(prev =>
            prev.map(w => w.canvasId === canvasId
                ? { ...w, orientation: w.orientation === 'h' ? 'v' : 'h' }
                : w)
        );

    // ── Drag & Pan ───────────────────────────────────────────────────────────
    const startDrag = (e, canvasId) => {
        if (e.target.closest('button') || e.target.closest('input')) return;
        e.preventDefault();
        const wr = e.currentTarget.getBoundingClientRect();
        setDragging({ canvasId, offsetX: e.clientX - wr.left, offsetY: e.clientY - wr.top });
    };

    const startPanDrag = (e) => {
        if (e.target === canvasRef.current || e.target === gridContainerRef.current) {
            e.preventDefault();
            const el = gridContainerRef.current;
            if (!el) return;
            setPanDragging({
                startX: e.clientX,
                startY: e.clientY,
                scrollLeft: el.scrollLeft,
                scrollTop: el.scrollTop
            });
        }
    };

    const onMouseMove = useCallback((e) => {
        if (panDragging) {
            const el = gridContainerRef.current;
            if (el) {
                const dx = e.clientX - panDragging.startX;
                const dy = e.clientY - panDragging.startY;
                el.scrollLeft = panDragging.scrollLeft - dx;
                el.scrollTop = panDragging.scrollTop - dy;
            }
            return;
        }

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
    }, [dragging, panDragging, gridCols, canvasWalls]);

    const onMouseUp = useCallback(() => {
        setDragging(null);
        setPanDragging(null);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        try {
            let locId = '';
            const selectedLocationStr = localStorage.getItem('selectedLocation');
            if (selectedLocationStr) {
                try {
                    const loc = JSON.parse(selectedLocationStr);
                    locId = loc.pick_location_id || '';
                } catch (e) { }
            }

            const currentCtrlWalls = wallsData.filter(w => String(w.controller_id) === String(controller.id));
            
            const updatedWalls = [];
            let createdCount = 0;
            let updatedCount = 0;
            
            // 2. Create or Update walls on canvas
            for (const cw of canvasWalls) {
                const payload = {
                    wall_name: cw.name,
                    wall_ctl_id: String(controller.id),
                    wall_loc_id: String(locId),
                    wall_status: cw.status === 'Active',
                    wall_gridx: String(cw.gridX),
                    wall_gridy: String(cw.gridY),
                    wall_orientation: cw.orientation
                };

                if (cw.isNew) {
                    const res = await apiService.createWall([payload]);
                    if (res && res.data) {
                        createdCount++;
                        const newWallData = Array.isArray(res.data) ? res.data[0] : res.data;
                        updatedWalls.push({
                            id: newWallData?.wall_id || cw.id,
                            name: newWallData?.wall_name || cw.name,
                            controller: controller.name,
                            controller_id: controller.id,
                            status: cw.status,
                            gridX: cw.gridX,
                            gridY: cw.gridY,
                            orientation: cw.orientation,
                            cupboardsCount: 4
                        });
                    }
                } else {
                    const originalWall = wallsData.find(w => String(w.id) === String(cw.id));
                    
                    const hasChanged = !originalWall || (
                        originalWall.name !== cw.name ||
                        originalWall.status !== cw.status ||
                        String(originalWall.gridX) !== String(cw.gridX) ||
                        String(originalWall.gridY) !== String(cw.gridY) ||
                        originalWall.orientation !== cw.orientation
                    );

                    if (hasChanged) {
                        await apiService.updateWall(cw.id, payload);
                        updatedCount++;
                    }
                }
            }

            // Sync globally by re-fetching
            const res = await apiService.getWalls(locId);
            if (res && res.success && res.data) {
                // We don't have access to full controllersData here, but we only really need it for mapping controller name.
                // It's better to just let Settings.js handle full sync if we can, but since we are just updating syncWalls,
                // we can map it using the wallsData we already have (to find controller names).
                const newWalls = res.data.map(w => {
                    const existing = wallsData.find(ew => String(ew.id) === String(w.wall_id));
                    return {
                        id: w.wall_id,
                        name: w.wall_name,
                        controller: existing ? existing.controller : controller.name, // fallback
                        controller_id: w.wall_ctl_id,
                        status: (w.wall_status === 'True' || w.wall_status === true || w.wall_status === 'Active') ? 'Active' : 'Inactive',
                        gridX: parseInt(w.wall_gridx, 10) || 0,
                        gridY: parseInt(w.wall_gridy, 10) || 0,
                        orientation: w.wall_orientation || 'h',
                        cupboardsCount: 4
                    };
                });
                syncWalls(newWalls);
            }

            setSaveFlash(true);
            setTimeout(() => setSaveFlash(false), 2000);
            
            if (createdCount > 0 && updatedCount > 0) {
                toast.success(`Successfully created ${createdCount} new wall(s) and updated ${updatedCount} wall(s)!`);
            } else if (createdCount > 0) {
                toast.success(`Successfully created ${createdCount} new wall(s)!`);
            } else if (updatedCount > 0) {
                toast.success(`Successfully updated ${updatedCount} wall(s)!`);
            } else {
                toast.success("No changes to save.");
            }
        } catch (e) {
            console.error("Failed to save wall layout", e);
            toast.error(e.message || "Failed to save wall layout");
        }
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
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-ot-action bg-ot-action/10 px-2 py-1 rounded-md font-medium border border-ot-action/20">
                            <Server className="w-3.5 h-3.5" />
                            <span>{controller.name}</span>
                            <span className="text-muted-foreground ml-1">({controller.ip}:{controller.port})</span>
                        </div>
                    </div>
                    
                    <div className="h-5 w-px bg-ot-border ml-2" />
                    <span className="text-xs text-muted-foreground font-mono ml-1">Wall Designer</span>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={addWall}
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
                    onMouseDown={startPanDrag}
                    style={{ cursor: dragging ? 'grabbing' : (panDragging ? 'grabbing' : 'default') }}
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
                                            <input
                                                value={wall.name}
                                                onChange={(e) => setCanvasWalls(prev => prev.map(w => w.canvasId === wall.canvasId ? { ...w, name: e.target.value } : w))}
                                                className="text-[10px] font-bold text-ot-action bg-transparent border border-transparent hover:border-ot-action/30 focus:border-ot-action focus:bg-ot-action/10 rounded outline-none w-full min-w-0 px-0.5 -ml-0.5 transition-all"
                                                title="Edit wall name"
                                            />
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleOrientation(wall.canvasId); }}
                                                    title="Rotate"
                                                    className="w-3.5 h-3.5 rounded flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
                                                    <RotateCcw className="w-2 h-2" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); requestRemoveWall(wall.canvasId); }}
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
                                        <input
                                            value={w.name}
                                            onChange={(e) => setCanvasWalls(prev => prev.map(cw => cw.canvasId === w.canvasId ? { ...cw, name: e.target.value } : cw))}
                                            className="text-[11px] font-semibold text-white bg-transparent border border-transparent hover:border-white/20 focus:border-ot-action focus:bg-ot-surface-top rounded outline-none w-full min-w-0 px-1 -ml-1 transition-all"
                                            title="Edit wall name"
                                        />
                                        <div className="text-[9px] text-muted-foreground font-mono mt-0.5 px-1 -ml-1">
                                            {String.fromCharCode(65 + w.gridY)}{w.gridX + 1}
                                            {' · '}{w.orientation === 'h' ? '↔' : '↕'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => requestRemoveWall(w.canvasId)}
                                        className="opacity-0 group-hover:opacity-100 w-3.5 h-3.5 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-all shrink-0 mt-0.5">
                                        <X className="w-2 h-2" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Delete Confirmation Dialog */}
            <Dialog open={!!wallToDelete} onOpenChange={(open) => !open && setWallToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Wall</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this wall? This will immediately remove it from the database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="ghost" onClick={() => setWallToDelete(null)}>
                            Cancel
                        </Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmRemoveWall}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
