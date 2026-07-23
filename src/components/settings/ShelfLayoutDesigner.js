import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { ArrowLeft, Save, CheckCircle2, Plus, X, Box, GripVertical, Server, ChevronRight, LayoutGrid, AlertTriangle } from 'lucide-react';
import { cn } from 'lib/utils';
import { Input } from 'components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from 'components/ui/dialog';
import { apiService } from 'lib/apiService';
import { toast } from 'sonner';

const SHELF_W = 140;
const SHELF_H = 48;
const CANVAS_W = 600;
const CANVAS_H = 500;
const MIN_SHELF_W = 120;
const MIN_SHELF_H = 40;

export default function ShelfLayoutDesigner({ cupboard, onBack, cupboardsData, syncCupboards, refetchShelves }) {
    const [saveFlash, setSaveFlash] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [shelfToDelete, setShelfToDelete] = useState(null);
    const [shelfBlocks, setShelfBlocks] = useState(() => {
        if (cupboard.shelfLayout && Array.isArray(cupboard.shelfLayout)) {
            return cupboard.shelfLayout;
        }
        return [];
    });

    useEffect(() => {
        if (cupboard && cupboard.shelfLayout && Array.isArray(cupboard.shelfLayout)) {
            setShelfBlocks(cupboard.shelfLayout);
        }
    }, [cupboard?.shelfLayout]);

    const [dragging, setDragging] = useState(null); // { id, type: 'move'|'resize-n'|'resize-s'|'resize-e'|'resize-w', offsetX, offsetY, startX, startY, startW, startH }
    const canvasRef = useRef(null);

    // Panning state
    const scrollRef = useRef(null);
    const scrollDragRef = useRef({
        isDown: false,
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        scrollTop: 0,
        moved: false,
    });

    const addShelf = () => {
        const maxY = shelfBlocks.reduce((m, s) => Math.max(m, s.y + s.height), 20);
        const newShelf = {
            id: `shelf-${Date.now()}`,
            label: `Shelf ${shelfBlocks.length + 1}`,
            x: 20,
            y: maxY + 8,
            width: SHELF_W * (cupboard.columns || 4),
            height: SHELF_H,
            columns: 1, // Default to 1 section
        };
        setShelfBlocks(prev => [...prev, newShelf]);
    };

    const handleDeleteShelf = (shelf) => {
        setShelfToDelete(shelf);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteShelf = async () => {
        if (!shelfToDelete) return;
        const targetShelf = shelfToDelete;
        const shelfId = (targetShelf.shelf_id !== undefined && targetShelf.shelf_id !== null) ? targetShelf.shelf_id : targetShelf.id;

        try {
            const isBackendShelf = shelfId && !String(shelfId).startsWith('shelf-');
            if (isBackendShelf) {
                await apiService.deleteShelf(shelfId);
                toast.success("Shelf deleted successfully");
            } else {
                toast.success("Shelf removed");
            }

            const updatedBlocks = shelfBlocks.filter(s =>
                String(s.id) !== String(targetShelf.id) &&
                String(s.shelf_id || '') !== String(shelfId)
            );

            // 1. Immediately update local state in canvas & sidebar
            setShelfBlocks(updatedBlocks);

            // 2. Immediately update parent cupboardsData state
            const shelves = updatedBlocks.length;
            const updatedCupboards = cupboardsData.map(c =>
                String(c.id) === String(cupboard.id)
                    ? { ...c, shelves, rows: shelves, shelfLayout: updatedBlocks }
                    : c
            );
            syncCupboards(updatedCupboards);

            // 3. Invalidate/refetch React Query cache
            if (refetchShelves) {
                await refetchShelves();
            }

        } catch (error) {
            console.error("Error deleting shelf:", error);
            toast.error(`Failed to delete shelf: ${error.message || 'Unknown error'}`);
        } finally {
            setDeleteDialogOpen(false);
            setShelfToDelete(null);
        }
    };

    const handleMouseDown = (e, id, type) => {
        e.preventDefault();
        e.stopPropagation();
        const shelf = shelfBlocks.find(s => s.id === id);
        if (!shelf) return;

        let activeId = id;

        // Duplicate block if holding Ctrl/Cmd while starting to move
        if (type === 'move' && (e.ctrlKey || e.metaKey)) {
            activeId = `shelf-${Date.now()}`;
            const newShelf = {
                ...shelf,
                id: activeId,
                label: `${shelf.label} (Copy)`
            };
            setShelfBlocks(prev => [...prev, newShelf]);
        }

        setDragging({
            id: activeId,
            type,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startX: shelf.x,
            startY: shelf.y,
            startW: shelf.width,
            startH: shelf.height,
        });
    };

    const onMouseMove = useCallback((e) => {
        if (!dragging) return;
        const dx = e.clientX - dragging.startMouseX;
        const dy = e.clientY - dragging.startMouseY;

        const currentMinW = MIN_SHELF_W;

        setShelfBlocks(prev => prev.map(s => {
            if (s.id !== dragging.id) return s;

            switch (dragging.type) {
                case 'move':
                    return {
                        ...s,
                        x: Math.max(0, dragging.startX + dx),
                        y: Math.max(0, dragging.startY + dy),
                    };
                case 'resize-e':
                    return { ...s, width: Math.max(currentMinW, dragging.startW + dx) };
                case 'resize-w': {
                    const newW = Math.max(currentMinW, dragging.startW - dx);
                    return { ...s, x: dragging.startX + (dragging.startW - newW), width: newW };
                }
                case 'resize-s':
                    return { ...s, height: Math.max(MIN_SHELF_H, dragging.startH + dy) };
                case 'resize-n': {
                    const newH = Math.max(MIN_SHELF_H, dragging.startH - dy);
                    return { ...s, y: dragging.startY + (dragging.startH - newH), height: newH };
                }
                // Corners
                case 'resize-ne':
                    return { ...s, width: Math.max(currentMinW, dragging.startW + dx), height: Math.max(MIN_SHELF_H, dragging.startH - dy), y: dragging.startY + (dragging.startH - Math.max(MIN_SHELF_H, dragging.startH - dy)) };
                case 'resize-nw': {
                    const nwW = Math.max(currentMinW, dragging.startW - dx);
                    const nwH = Math.max(MIN_SHELF_H, dragging.startH - dy);
                    return { ...s, x: dragging.startX + (dragging.startW - nwW), width: nwW, y: dragging.startY + (dragging.startH - nwH), height: nwH };
                }
                case 'resize-se':
                    return { ...s, width: Math.max(currentMinW, dragging.startW + dx), height: Math.max(MIN_SHELF_H, dragging.startH + dy) };
                case 'resize-sw': {
                    const swW = Math.max(currentMinW, dragging.startW - dx);
                    return { ...s, x: dragging.startX + (dragging.startW - swW), width: swW, height: Math.max(MIN_SHELF_H, dragging.startH + dy) };
                }
                default:
                    return s;
            }
        }));
    }, [dragging]);

    const onMouseUp = useCallback(() => setDragging(null), []);

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            return () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };
        }
    }, [dragging, onMouseMove, onMouseUp]);

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

            let createdCount = 0;
            let updatedCount = 0;

            // 1. Separate new vs existing shelves
            const newShelves = [];
            const existingShelves = [];

            shelfBlocks.forEach((s, idx) => {
                const isNew = !s.id || String(s.id).startsWith('shelf-');
                if (isNew) {
                    newShelves.push({ s, idx });
                } else {
                    existingShelves.push({ s, idx });
                }
            });

            // 3. Create new shelves via POST API
            if (newShelves.length > 0) {
                const createPayloads = newShelves.map(({ s, idx }) => ({
                    shelf_name: s.label || `Shelf ${idx + 1}`,
                    shelf_loc_id: String(locId),
                    shelf_ctl_id: String(cupboard.controller_id || cupboard.controller || ''),
                    shelf_wall_id: String(cupboard.wall_id || cupboard.wall || ''),
                    shelf_cupboard_id: String(cupboard.id || cupboard.name || ''),
                    shelf_gridx: String(Math.round(s.x)),
                    shelf_gridy: String(Math.round(s.y)),
                    shelf_width: String(Math.round(s.width)),
                    shelf_height: String(Math.round(s.height)),
                    shelf_order: String(s.shelf_order || idx + 1),
                    shelf_phr_id: String(s.shelf_phr_id || "2"),
                    shelf_org_id: String(s.shelf_org_id || "Salem"),
                    shelf_branch_id: String(s.shelf_branch_id || "SKSHOSPITAL"),
                    shelf_status: s.shelf_status !== undefined ? (s.shelf_status ? "True" : "False") : "True"
                }));

                const res = await apiService.createShelf(createPayloads);
                if (res) {
                    createdCount = newShelves.length;
                }
            }

            // 4. Update existing shelves via PUT API
            for (const { s, idx } of existingShelves) {
                const updatePayload = {
                    shelf_name: s.label || `Shelf ${idx + 1}`,
                    shelf_loc_id: String(locId),
                    shelf_ctl_id: String(cupboard.controller_id || cupboard.controller || ''),
                    shelf_wall_id: String(cupboard.wall_id || cupboard.wall || ''),
                    shelf_cupboard_id: String(cupboard.id || cupboard.name || ''),
                    shelf_gridx: String(Math.round(s.x)),
                    shelf_gridy: String(Math.round(s.y)),
                    shelf_width: String(Math.round(s.width)),
                    shelf_height: String(Math.round(s.height)),
                    shelf_order: String(s.shelf_order || idx + 1),
                    shelf_phr_id: String(s.shelf_phr_id || "2"),
                    shelf_org_id: String(s.shelf_org_id || "Salem"),
                    shelf_branch_id: String(s.shelf_branch_id || "SKSHOSPITAL"),
                    shelf_status: s.shelf_status !== undefined ? (typeof s.shelf_status === 'boolean' ? s.shelf_status : s.shelf_status === 'True') : true
                };

                await apiService.updateShelf(s.id, updatePayload);
                updatedCount++;
            }

            const shelves = shelfBlocks.length;
            const updated = cupboardsData.map(c =>
                c.id === cupboard.id
                    ? { ...c, shelves, rows: shelves, shelfLayout: shelfBlocks }
                    : c
            );
            syncCupboards(updated);

            if (refetchShelves) {
                refetchShelves();
            }

            const msgParts = [];
            if (createdCount > 0) msgParts.push(`created ${createdCount}`);
            if (updatedCount > 0) msgParts.push(`updated ${updatedCount}`);

            if (msgParts.length > 0) {
                toast.success(`Shelves ${msgParts.join(', ')} successfully!`);
            } else {
                toast.success('Shelves saved successfully!');
            }

            setSaveFlash(true);
            setTimeout(() => {
                setSaveFlash(false);
                onBack();
            }, 800);
        } catch (error) {
            toast.error(`Failed to save shelves: ${error.message || 'Unknown error'}`);
        }
    };

    // Compute canvas size dynamically based on shelf positions
    const canvasWidth = Math.max(CANVAS_W, ...shelfBlocks.map(s => s.x + s.width + 40));
    const canvasHeight = Math.max(CANVAS_H, ...shelfBlocks.map(s => s.y + s.height + 40));

    // Edge handle component
    const ResizeHandle = ({ type, cursor, className, style }) => (
        <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => handleMouseDown(e, null, type)}
            className={cn("absolute z-30", className)}
            style={{ cursor, ...style }}
        />
    );

    // Panning logic
    const handlePointerDown = (e) => {
        if (e.button !== 0) return;
        const container = scrollRef.current;
        if (!container) return;

        scrollDragRef.current = {
            isDown: true,
            startX: e.clientX,
            startY: e.clientY,
            scrollLeft: container.scrollLeft,
            scrollTop: container.scrollTop,
            moved: false,
        };
        container.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e) => {
        const container = scrollRef.current;
        const dragState = scrollDragRef.current;
        if (!container || !dragState.isDown) return;

        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        if (!dragState.moved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
            dragState.moved = true;
        }

        if (dragState.moved) {
            container.scrollLeft = dragState.scrollLeft - deltaX;
            container.scrollTop = dragState.scrollTop - deltaY;
        }
    };

    const stopScrolling = (e) => {
        const container = scrollRef.current;
        if (container?.hasPointerCapture?.(e.pointerId)) {
            container.releasePointerCapture(e.pointerId);
        }
        scrollDragRef.current.isDown = false;
    };

    const handleCanvasClick = (e) => {
        if (scrollDragRef.current.moved) {
            e.stopPropagation();
            scrollDragRef.current.moved = false;
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-ot-border bg-ot-surface-top shrink-0 gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={onBack}
                        className="text-muted-foreground hover:text-white gap-2 h-8 px-3">
                        <ArrowLeft className="w-4 h-4" /> Back to Cupboards
                    </Button>
                    <div className="h-5 w-px bg-ot-border" />
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-ot-action bg-ot-action/10 px-2 py-1 rounded-md font-medium border border-ot-action/20">
                            <Server className="w-3.5 h-3.5" />
                            <span>{cupboard.controller}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <div className="flex items-center gap-1.5 text-muted-foreground hover:text-white bg-ot-surface-elev-bottom px-2 py-1 rounded-md border border-ot-border transition-colors">
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>{cupboard.wall}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <div className="flex items-center gap-1.5 text-white bg-ot-surface-elev-bottom px-2 py-1 rounded-md border border-ot-border">
                            <Box className="w-3.5 h-3.5 text-ot-action" />
                            <span className="font-semibold">{cupboard.name}</span>
                        </div>
                    </div>

                    <div className="h-5 w-px bg-ot-border ml-2" />
                    <span className="text-xs text-muted-foreground font-mono ml-1">Shelves Designer</span>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={addShelf}
                        className="gap-2 h-8 px-4 bg-ot-surface-elev-bottom border border-ot-border text-white hover:bg-ot-surface-top text-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Shelf
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={shelfBlocks.length === 0}
                        className={cn(
                            'gap-2 h-8 px-4 text-sm transition-all duration-300 disabled:opacity-40',
                            saveFlash
                                ? 'bg-green-600 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                                : 'bg-ot-action text-white hover:bg-ot-action-hover'
                        )}
                    >
                        {saveFlash
                            ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                            : <><Save className="w-4 h-4" /> Save Cupboard</>
                        }
                    </Button>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden bg-ot-bg-mid">
                {/* Canvas */}
                <div
                    className="flex-1 overflow-auto p-6 relative touch-none select-none cursor-grab active:cursor-grabbing"
                    ref={scrollRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={stopScrolling}
                    onPointerCancel={stopScrolling}
                    onClickCapture={handleCanvasClick}
                >
                    <div
                        ref={canvasRef}
                        className="relative rounded-xl border-2 border-dashed border-ot-border/50 bg-ot-surface-top/50"
                        style={{
                            width: canvasWidth,
                            height: canvasHeight,
                            userSelect: 'none',
                            cursor: dragging?.type === 'move' ? 'grabbing' : 'default',
                        }}
                    >
                        {/* Cupboard frame label */}
                        <div className="absolute top-3 left-4 text-xs text-muted-foreground/40 font-semibold uppercase tracking-widest pointer-events-none">
                            {cupboard.name} — Drag & resize shelves
                        </div>

                        {shelfBlocks.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted-foreground/50 text-xs gap-1">
                                <span>No shelves in this cupboard yet.</span>
                                <span>Click &quot;+ Add Shelf&quot; to create a new shelf.</span>
                            </div>
                        )}

                        {/* Shelf blocks */}
                        {shelfBlocks.map((shelf, idx) => {
                            const isActive = dragging?.id === shelf.id;
                            return (
                                <div
                                    key={shelf.id}
                                    className={cn(
                                        'absolute rounded-lg border-2 flex items-center overflow-visible transition-shadow',
                                        isActive
                                            ? 'border-ot-action bg-ot-action/15 shadow-xl shadow-ot-action/30 z-20'
                                            : 'border-ot-action/40 bg-ot-surface-bottom hover:border-ot-action/70 z-10'
                                    )}
                                    style={{
                                        left: shelf.x,
                                        top: shelf.y,
                                        width: shelf.width,
                                        height: shelf.height,
                                    }}
                                >
                                    {/* Move handle (drag the shelf body) */}
                                    <div
                                        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => handleMouseDown(e, shelf.id, 'move')}
                                    />

                                    {/* Shelf content */}
                                    <div className="flex items-center gap-2 px-1 z-20 shrink-0">
                                        <GripVertical className="w-3 h-3 text-muted-foreground/40 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={shelf.label}
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                setShelfBlocks(prev => prev.map(sb => sb.id === shelf.id ? { ...sb, label: newVal } : sb));
                                            }}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            className="bg-transparent text-xs font-semibold text-white whitespace-nowrap outline-none border-none focus:bg-ot-bg-top/50 px-1 py-0.5 rounded w-16"
                                            placeholder="Shelf Name"
                                        />
                                    </div>



                                    {/* Size label */}
                                    <div className="absolute bottom-0.5 right-2 text-[8px] text-muted-foreground/40 font-mono pointer-events-none z-20">
                                        {Math.round(shelf.width)}×{Math.round(shelf.height)}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteShelf(shelf); }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center z-30 opacity-0 hover:opacity-100 transition-opacity shadow-lg"
                                        style={{ pointerEvents: 'auto' }}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>

                                    {/* ─── Resize Handles (4 edges + 4 corners) ──────────── */}
                                    {/* North edge */}
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, shelf.id, 'resize-n')}
                                        className="absolute left-2 right-2 -top-[3px] h-[6px] cursor-n-resize z-30 group"
                                    >
                                        <div className="absolute inset-x-0 top-[2px] h-[2px] bg-ot-action/0 group-hover:bg-ot-action/60 transition-colors rounded-full" />
                                    </div>
                                    {/* South edge */}
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, shelf.id, 'resize-s')}
                                        className="absolute left-2 right-2 -bottom-[3px] h-[6px] cursor-s-resize z-30 group"
                                    >
                                        <div className="absolute inset-x-0 bottom-[2px] h-[2px] bg-ot-action/0 group-hover:bg-ot-action/60 transition-colors rounded-full" />
                                    </div>
                                    {/* West edge */}
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, shelf.id, 'resize-w')}
                                        className="absolute top-2 bottom-2 -left-[3px] w-[6px] cursor-w-resize z-30 group"
                                    >
                                        <div className="absolute inset-y-0 left-[2px] w-[2px] bg-ot-action/0 group-hover:bg-ot-action/60 transition-colors rounded-full" />
                                    </div>
                                    {/* East edge */}
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, shelf.id, 'resize-e')}
                                        className="absolute top-2 bottom-2 -right-[3px] w-[6px] cursor-e-resize z-30 group"
                                    >
                                        <div className="absolute inset-y-0 right-[2px] w-[2px] bg-ot-action/0 group-hover:bg-ot-action/60 transition-colors rounded-full" />
                                    </div>

                                    {/* Corner handles (visible dots) */}
                                    {/* NW */}
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, shelf.id, 'resize-nw')}
                                        className="absolute -top-[4px] -left-[4px] w-[8px] h-[8px] rounded-full bg-ot-action/60 hover:bg-ot-action border border-ot-action cursor-nw-resize z-40 transition-colors"
                                    />
                                    {/* NE */}
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, shelf.id, 'resize-ne')}
                                        className="absolute -top-[4px] -right-[4px] w-[8px] h-[8px] rounded-full bg-ot-action/60 hover:bg-ot-action border border-ot-action cursor-ne-resize z-40 transition-colors"
                                    />
                                    {/* SW */}
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, shelf.id, 'resize-sw')}
                                        className="absolute -bottom-[4px] -left-[4px] w-[8px] h-[8px] rounded-full bg-ot-action/60 hover:bg-ot-action border border-ot-action cursor-sw-resize z-40 transition-colors"
                                    />
                                    {/* SE */}
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, shelf.id, 'resize-se')}
                                        className="absolute -bottom-[4px] -right-[4px] w-[8px] h-[8px] rounded-full bg-ot-action/60 hover:bg-ot-action border border-ot-action cursor-se-resize z-40 transition-colors"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-56 border-l border-ot-border bg-ot-surface-top flex flex-col shrink-0">
                    <div className="px-4 py-3 border-b border-ot-border">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Shelves</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{shelfBlocks.length} shelves</div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                        {shelfBlocks.map((shelf) => (
                            <div key={shelf.id}
                                className="flex items-center gap-2 p-2 rounded-lg bg-ot-surface-elev-bottom/60 border border-ot-border/50 group"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-ot-action shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-semibold text-white truncate">{shelf.label}</div>
                                    <div className="text-[9px] text-muted-foreground font-mono">
                                        {Math.round(shelf.width)}×{Math.round(shelf.height)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteShelf(shelf)}
                                    className="opacity-0 group-hover:opacity-100 w-3.5 h-3.5 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-all shrink-0">
                                    <X className="w-2 h-2" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md border-red-500/20 bg-gradient-to-b from-ot-surface-top/90 to-ot-bg-bottom/90 backdrop-blur-xl">
                    <DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="space-y-2 text-center">
                                <DialogTitle className="text-xl text-white">Confirm Deletion</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-sm">
                                    Are you sure you want to delete this shelf? This action cannot be undone and will remove it permanently.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <DialogFooter className="flex justify-center gap-3 sm:justify-center mt-2 border-t border-ot-border/50 pt-4">
                        <Button
                            variant="outline"
                            className="border-ot-border text-white hover:bg-ot-surface-elev-bottom min-w-[100px]"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setShelfToDelete(null);
                            }}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white min-w-[100px] shadow-lg shadow-red-900/20"
                            onClick={confirmDeleteShelf}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
