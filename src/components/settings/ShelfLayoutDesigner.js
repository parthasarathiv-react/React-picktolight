import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { ArrowLeft, Save, CheckCircle2, Plus, X, Box, GripVertical, Server, ChevronRight, LayoutGrid, AlertTriangle, Layers, Check, Sparkles } from 'lucide-react';
import { cn } from 'lib/utils';
import { Input } from 'components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from 'components/ui/dialog';
import { ConfirmDialog } from 'components/ui/ConfirmDialog';
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
    const [isCanvasOver, setIsCanvasOver] = useState(false);
    const sidebarDragItemRef = useRef(null);

    const [shelfBlocks, setShelfBlocks] = useState(() => {
        if (cupboard.shelfLayout && Array.isArray(cupboard.shelfLayout)) {
            return cupboard.shelfLayout.map(s => ({
                ...s,
                placed: s.placed !== undefined ? s.placed : true,
            }));
        }
        return [];
    });

    useEffect(() => {
        if (cupboard && cupboard.shelfLayout && Array.isArray(cupboard.shelfLayout)) {
            setShelfBlocks(cupboard.shelfLayout.map(s => ({
                ...s,
                placed: s.placed !== undefined ? s.placed : true,
            })));
        }
    }, [cupboard?.shelfLayout]);

    const [dragging, setDragging] = useState(null); // { id, type: 'move'|'resize-n'|'resize-s'|'resize-e'|'resize-w', offsetX, offsetY, startX, startY, startW, startH }
    const [selectedId, setSelectedId] = useState(null);
    const canvasRef = useRef(null);

    // Keyboard Arrow Nudging Listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedId) return;

            // Ignore if typing inside input/textarea
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                return;
            }

            const step = e.shiftKey ? 10 : 2;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setShelfBlocks(prev => prev.map(s => s.id === selectedId ? { ...s, y: Math.max(0, s.y - step) } : s));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setShelfBlocks(prev => prev.map(s => s.id === selectedId ? { ...s, y: s.y + step } : s));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setShelfBlocks(prev => prev.map(s => s.id === selectedId ? { ...s, x: Math.max(0, s.x - step) } : s));
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setShelfBlocks(prev => prev.map(s => s.id === selectedId ? { ...s, x: s.x + step } : s));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId]);

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
        const placedBlocks = shelfBlocks.filter(s => s.placed !== false);
        const maxY = placedBlocks.reduce((m, s) => Math.max(m, s.y + s.height), 20);
        const newShelf = {
            id: `shelf-${Date.now()}`,
            label: `Shelf ${shelfBlocks.length + 1}`,
            x: 20,
            y: maxY + 8,
            width: SHELF_W * (cupboard.columns || 4),
            height: SHELF_H,
            columns: 1, // Default to 1 section
            placed: true,
        };
        setShelfBlocks(prev => [...prev, newShelf]);
    };

    const handleSidebarDragStart = (e, shelf) => {
        sidebarDragItemRef.current = shelf;
        e.dataTransfer.setData('text/plain', String(shelf.id));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleCanvasDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isCanvasOver) setIsCanvasOver(true);
    };

    const handleCanvasDragLeave = (e) => {
        if (e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
        setIsCanvasOver(false);
    };

    const handleCanvasDrop = (e) => {
        e.preventDefault();
        setIsCanvasOver(false);

        const shelfId = e.dataTransfer.getData('text/plain') || sidebarDragItemRef.current?.id;
        if (!shelfId) return;

        const targetShelf = shelfBlocks.find(s => String(s.id) === String(shelfId));
        if (!targetShelf) return;

        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const dropX = Math.max(0, Math.round(e.clientX - rect.left - (targetShelf.width || SHELF_W) / 2));
        const dropY = Math.max(0, Math.round(e.clientY - rect.top - (targetShelf.height || SHELF_H) / 2));

        setShelfBlocks(prev => prev.map(s => {
            if (String(s.id) === String(shelfId)) {
                return {
                    ...s,
                    x: dropX,
                    y: dropY,
                    placed: true
                };
            }
            return s;
        }));

        sidebarDragItemRef.current = null;
        toast.success(`Placed "${targetShelf.label}" on canvas`);
    };

    const handlePlaceOnCanvas = (shelfId) => {
        setShelfBlocks(prev => prev.map(s => {
            if (String(s.id) === String(shelfId)) {
                const placedItems = prev.filter(item => item.placed !== false);
                const maxY = placedItems.reduce((m, item) => Math.max(m, item.y + item.height), 20);
                return {
                    ...s,
                    x: s.x !== undefined ? s.x : 20,
                    y: s.placed ? s.y : maxY + 8,
                    placed: true
                };
            }
            return s;
        }));
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

        setSelectedId(id);

        setDragging({
            id,
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

            // Only update/save shelves that were dragged and placed onto the canvas
            const placedShelves = shelfBlocks.filter(s => s.placed === true);

            if (placedShelves.length === 0) {
                toast.error("Please drag and place at least one shelf onto the canvas before saving.");
                return;
            }

            // 1. Separate new vs existing shelves among PLACED shelves only
            const newShelves = [];
            const existingShelves = [];

            placedShelves.forEach((s, idx) => {
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
                    shelf_gridx: String(Math.round(s.x || 0)),
                    shelf_gridy: String(Math.round(s.y || 0)),
                    shelf_width: String(Math.round(s.width || 560)),
                    shelf_height: String(Math.round(s.height || 48)),
                    shelf_order: String(s.shelf_order || idx + 1),
                    shelf_phr_id: String(s.shelf_phr_id || "122"),
                    shelf_org_id: String(s.shelf_org_id || "skshospital"),
                    shelf_branch_id: String(s.shelf_branch_id || "Salem"),
                    shelf_status: s.shelf_status !== undefined ? (s.shelf_status ? "True" : "False") : "True"
                }));

                const res = await apiService.createShelf(createPayloads);
                if (res) {
                    createdCount = newShelves.length;
                }
            }

            // 4. Update existing placed shelves via PUT API
            for (const { s, idx } of existingShelves) {
                const shelfIdToUpdate = s.shelf_id || s.id;
                const updatePayload = {
                    shelf_name: s.label || `Shelf ${idx + 1}`,
                    shelf_loc_id: String(locId),
                    shelf_ctl_id: String(cupboard.controller_id || cupboard.controller || ''),
                    shelf_wall_id: String(cupboard.wall_id || cupboard.wall || ''),
                    shelf_cupboard_id: String(cupboard.id || cupboard.name || ''),
                    shelf_gridx: String(Math.round(s.x || 0)),
                    shelf_gridy: String(Math.round(s.y || 0)),
                    shelf_width: String(Math.round(s.width || 560)),
                    shelf_height: String(Math.round(s.height || 48)),
                    shelf_order: String(s.shelf_order || idx + 1),
                    shelf_phr_id: String(s.shelf_phr_id || "122"),
                    shelf_org_id: String(s.shelf_org_id || "skshospital"),
                    shelf_branch_id: String(s.shelf_branch_id || "Salem"),
                    shelf_status: s.shelf_status !== undefined ? (typeof s.shelf_status === 'boolean' ? s.shelf_status : s.shelf_status === 'True') : true
                };

                await apiService.updateShelf(shelfIdToUpdate, updatePayload);
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
                await refetchShelves();
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
            console.error("Error saving shelves:", error);
            toast.error(`Failed to save shelves: ${error.message || 'Unknown error'}`);
        }
    };

    const canvasBlocks = shelfBlocks.filter(s => s.placed === true);

    // Compute canvas size dynamically based on PLACED shelf positions only
    const canvasWidth = Math.max(CANVAS_W, ...canvasBlocks.map(s => (s.x || 0) + (s.width || SHELF_W) + 40));
    const canvasHeight = Math.max(CANVAS_H, ...canvasBlocks.map(s => (s.y || 0) + (s.height || SHELF_H) + 40));

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
                        onClick={handleSave}
                        disabled={shelfBlocks.filter(s => s.placed === true).length === 0}
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
                        onDragOver={handleCanvasDragOver}
                        onDragLeave={handleCanvasDragLeave}
                        onDrop={handleCanvasDrop}
                        className={cn(
                            "relative rounded-xl border-2 border-dashed transition-all duration-200",
                            isCanvasOver
                                ? "border-ot-action bg-ot-action/15 shadow-2xl shadow-ot-action/30 ring-2 ring-ot-action/40"
                                : "border-ot-border/50 bg-ot-surface-top/50"
                        )}
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

                        {canvasBlocks.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted-foreground/50 text-xs gap-2">
                                <Sparkles className="w-8 h-8 text-ot-action/50 animate-pulse" />
                                <span className="font-medium text-white/80">No shelves placed on canvas yet.</span>
                                <span>Drag a shelf from the right sidebar to place & align it here.</span>
                            </div>
                        )}

                        {/* Shelf blocks */}
                        {canvasBlocks.map((shelf, idx) => {
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
                                    <div className="flex items-center gap-1.5 px-1.5 z-20 shrink-0">
                                        <GripVertical className="w-3 h-3 text-muted-foreground/40 pointer-events-none shrink-0" />
                                        <span className="text-xs font-semibold text-white whitespace-nowrap px-0.5 py-0.5 rounded shrink-0 truncate pointer-events-none select-none">
                                            {shelf.label}
                                        </span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-ot-action/20 text-ot-action border border-ot-action/30 shrink-0 shadow-sm pointer-events-none whitespace-nowrap">
                                            #{shelf.shelf_order !== undefined && shelf.shelf_order !== null && shelf.shelf_order !== '' ? shelf.shelf_order : (idx + 1)}
                                        </span>
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
                <div className="w-64 border-l border-ot-border bg-ot-surface-top flex flex-col shrink-0">
                    <div className="px-4 py-3 border-b border-ot-border flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-ot-action" /> Shelves
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{shelfBlocks.length} shelf{shelfBlocks.length !== 1 ? 's' : ''} fetched</div>
                        </div>
                    </div>

                    <div className="p-2 bg-ot-surface-elev-bottom/40 border-b border-ot-border/40 text-[10px] text-muted-foreground flex items-center gap-1.5 px-3">
                        <GripVertical className="w-3 h-3 text-ot-action shrink-0" />
                        <span>Drag & drop shelves onto the canvas on the left</span>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                        {shelfBlocks.map((shelf, idx) => {
                            const isPlaced = shelf.placed !== false;
                            return (
                                <div
                                    key={shelf.id}
                                    draggable
                                    onDragStart={(e) => handleSidebarDragStart(e, shelf)}
                                    className={cn(
                                        "flex flex-col gap-1.5 p-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing group select-none relative",
                                        isPlaced
                                            ? "bg-ot-surface-elev-bottom/80 border-ot-action/40 hover:border-ot-action hover:shadow-md hover:shadow-ot-action/10"
                                            : "bg-ot-surface-elev-bottom/40 border-amber-500/30 hover:border-amber-500/60"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-ot-action shrink-0" />
                                            <span className="text-xs font-semibold text-white whitespace-nowrap px-1 py-0.5 rounded truncate select-none">
                                                {shelf.label}
                                            </span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-ot-action/20 text-ot-action border border-ot-action/30 shrink-0 whitespace-nowrap">
                                                #{shelf.shelf_order !== undefined && shelf.shelf_order !== null && shelf.shelf_order !== '' ? shelf.shelf_order : (idx + 1)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteShelf(shelf); }}
                                            className="w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                                            title="Delete Shelf"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] pl-5">
                                        <span className="text-muted-foreground font-mono">
                                            {Math.round(shelf.width)}×{Math.round(shelf.height)}
                                        </span>

                                        <div className="flex items-center gap-1.5">
                                            {isPlaced ? (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px] font-medium border border-emerald-500/20">
                                                    <Check className="w-2.5 h-2.5" /> Placed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[9px] font-medium border border-amber-500/20">
                                                    Unplaced
                                                </span>
                                            )}

                                            <button
                                                onClick={() => handlePlaceOnCanvas(shelf.id)}
                                                className="px-1.5 py-0.5 rounded bg-ot-action/20 hover:bg-ot-action text-ot-action hover:text-white text-[9px] font-medium transition-colors border border-ot-action/30"
                                                title="Place shelf on canvas"
                                            >
                                                {isPlaced ? "Move" : "+ Place"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {shelfBlocks.length === 0 && (
                            <div className="py-8 text-center text-xs text-muted-foreground/50">
                                No shelves returned from API for this cupboard.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Confirm Deletion"
                description="Are you sure you want to delete this shelf? This action cannot be undone and will remove it permanently."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={confirmDeleteShelf}
                onCancel={() => setShelfToDelete(null)}
            />
        </div>
    );
}
