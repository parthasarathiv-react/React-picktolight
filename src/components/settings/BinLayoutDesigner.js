import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { ArrowLeft, Save, CheckCircle2, Plus, X, Layers, GripVertical, Server, ChevronRight, LayoutGrid, Box, Sparkles, Check, AlertTriangle, Ban, ZoomIn, ZoomOut, Archive } from 'lucide-react';
import { cn } from 'lib/utils';
import { ConfirmDialog } from 'components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { apiService } from 'lib/apiService';

const MIN_BIN_W = 40;
const MIN_BIN_H = 40;

export default function BinLayoutDesigner({ cupboard, shelf, onBack, cupboardsData, syncCupboards, refetchBins, onDirtyChange }) {
    const [saveFlash, setSaveFlash] = useState(false);
    const [disableDialogOpen, setDisableDialogOpen] = useState(false);
    const [binToDisable, setBinToDisable] = useState(null);
    const [isCanvasOver, setIsCanvasOver] = useState(false);
    const [isLoadingBins, setIsLoadingBins] = useState(false);
    const sidebarDragItemRef = useRef(null);
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

    useEffect(() => {
        if (onDirtyChange) {
            onDirtyChange(isDirty);
        }
    }, [isDirty, onDirtyChange]);

    // Initial load from existing bins or default to empty
    const [binBlocks, setBinBlocks] = useState(() => {
        if (shelf.bins && shelf.bins.length > 0) {
            return shelf.bins.map(b => ({
                ...b,
                placed: b.placed !== undefined ? b.placed : true,
            }));
        }
        return [];
    });

    const handleDisableBin = (bin) => {
        setBinToDisable(bin);
        setDisableDialogOpen(true);
    };

    const confirmDisableBin = async () => {
        if (!binToDisable) return;
        const targetBin = binToDisable;
        const binId = targetBin.bin_id || (typeof targetBin.id === 'number' ? targetBin.id : (!isNaN(Number(targetBin.id)) && String(targetBin.id).indexOf('bin-') === -1 ? Number(targetBin.id) : null));

        try {
            const isBackendBin = binId && !String(binId).startsWith('bin-');
            if (isBackendBin) {
                await apiService.disableBin(binId, false);
                toast.success("Bin disabled successfully");
            } else {
                toast.success("Bin disabled");
            }

            const updatedBlocks = binBlocks.map(b => {
                if (String(b.id) === String(targetBin.id) || (binId && String(b.bin_id || '') === String(binId))) {
                    return {
                        ...b,
                        placed: false,
                        disabled: true,
                        bin_status: false
                    };
                }
                return b;
            });

            setBinBlocks(updatedBlocks);
            setIsDirty(true);

            const updatedCupboards = JSON.parse(JSON.stringify(cupboardsData));
            const targetCupboard = updatedCupboards.find(c => String(c.id) === String(cupboard.id));
            if (targetCupboard && targetCupboard.shelfLayout) {
                const targetShelf = targetCupboard.shelfLayout.find(s => String(s.id) === String(shelf.id));
                if (targetShelf) {
                    targetShelf.bins = updatedBlocks;
                }
            }
            syncCupboards(updatedCupboards);

            try {
                const layouts = JSON.parse(localStorage.getItem('cupboardLayouts') || '{}');
                if (layouts[cupboard.id]) {
                    const lsShelf = layouts[cupboard.id].shelfLayout?.find(s => String(s.id) === String(shelf.id));
                    if (lsShelf) {
                        lsShelf.bins = updatedBlocks;
                    }
                }
                localStorage.setItem('cupboardLayouts', JSON.stringify(layouts));
            } catch (e) { }

            if (refetchBins) {
                await refetchBins();
            }
        } catch (error) {
            console.error("Error disabling bin:", error);
            toast.error(`Failed to disable bin: ${error.message || 'Unknown error'}`);
        } finally {
            setDisableDialogOpen(false);
            setBinToDisable(null);
        }
    };

    const handleEnableBin = async (bin) => {
        const binId = bin.bin_id || (typeof bin.id === 'number' ? bin.id : (!isNaN(Number(bin.id)) && String(bin.id).indexOf('bin-') === -1 ? Number(bin.id) : null));

        try {
            const isBackendBin = binId && !String(binId).startsWith('bin-');
            if (isBackendBin) {
                await apiService.disableBin(binId, true);
                toast.success("Bin enabled successfully");
            } else {
                toast.success("Bin enabled");
            }

            const updatedBlocks = binBlocks.map(b => {
                if (String(b.id) === String(bin.id) || (binId && String(b.bin_id || '') === String(binId))) {
                    return {
                        ...b,
                        disabled: false,
                        bin_status: true
                    };
                }
                return b;
            });

            setBinBlocks(updatedBlocks);
            setIsDirty(true);

            const updatedCupboards = JSON.parse(JSON.stringify(cupboardsData));
            const targetCupboard = updatedCupboards.find(c => String(c.id) === String(cupboard.id));
            if (targetCupboard && targetCupboard.shelfLayout) {
                const targetShelf = targetCupboard.shelfLayout.find(s => String(s.id) === String(shelf.id));
                if (targetShelf) {
                    targetShelf.bins = updatedBlocks;
                }
            }
            syncCupboards(updatedCupboards);

            if (refetchBins) {
                await refetchBins();
            }
        } catch (error) {
            console.error("Error enabling bin:", error);
            toast.error(`Failed to enable bin: ${error.message || 'Unknown error'}`);
        }
    };

    // Fetch bins specifically for current shelf ID from API
    useEffect(() => {
        const fetchBinsForShelf = async () => {
            let locId = 'All';
            try {
                const selectedLocationStr = localStorage.getItem('selectedLocation');
                if (selectedLocationStr) {
                    const loc = JSON.parse(selectedLocationStr);
                    locId = loc.pick_location_id || loc.id || 'All';
                }
            } catch (e) { }

            const targetShelfId = String(shelf.shelf_phr_id || '').trim();

            if (!targetShelfId) return;

            setIsLoadingBins(true);
            try {
                const res = await apiService.getBins(locId, targetShelfId);
                if (res && res.success && Array.isArray(res.data)) {
                    const mappedBins = res.data.map((b, idx) => {
                        const hasGridX = b.bin_gridx !== undefined && b.bin_gridx !== null && b.bin_gridx !== '' && !isNaN(parseFloat(b.bin_gridx));
                        const hasGridY = b.bin_gridy !== undefined && b.bin_gridy !== null && b.bin_gridy !== '' && !isNaN(parseFloat(b.bin_gridy));
                        const isPlaced = hasGridX && hasGridY && (b.bin_status !== false && b.bin_status !== 'False');

                        return {
                            id: String(b.bin_id || `bin-${idx}`),
                            bin_id: b.bin_id,
                            label: b.bin_name || `Bin ${idx + 1}`,
                            x: hasGridX ? parseFloat(b.bin_gridx) : (10 + idx * 90),
                            y: hasGridY ? parseFloat(b.bin_gridy) : 10,
                            width: (b.bin_width && !isNaN(parseFloat(b.bin_width))) ? parseFloat(b.bin_width) : 80,
                            height: (b.bin_height && !isNaN(parseFloat(b.bin_height))) ? parseFloat(b.bin_height) : 48,
                            placed: isPlaced,
                            bin_order: b.bin_order,
                            bin_phr_id: b.bin_phr_id || "122",
                            bin_org_id: b.bin_org_id || "skshospital",
                            bin_branch_id: b.bin_branch_id || "Salem",
                            bin_status: b.bin_status !== undefined ? b.bin_status : true,
                            bin_shelf_id: b.bin_shelf_id || targetShelfId,
                            bin_loc_id: b.bin_loc_id
                        };
                    });

                    if (mappedBins.length > 0) {
                        setBinBlocks(mappedBins);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch bins for shelf:", err);
            } finally {
                setIsLoadingBins(false);
            }
        };

        fetchBinsForShelf();
    }, [shelf?.shelf_id, shelf?.id]);

    const shelfW = (shelf?.width && !isNaN(parseFloat(shelf.width)))
        ? parseFloat(shelf.width)
        : ((shelf?.shelf_width && !isNaN(parseFloat(shelf.shelf_width))) ? parseFloat(shelf.shelf_width) : 560);

    const shelfH = (shelf?.height && !isNaN(parseFloat(shelf.height)))
        ? parseFloat(shelf.height)
        : ((shelf?.shelf_height && !isNaN(parseFloat(shelf.shelf_height))) ? parseFloat(shelf.shelf_height) : 48);


    const [dragging, setDragging] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
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

    const removeBin = (id) => {
        setBinBlocks(prev => prev.filter(b => b.id !== id));
        setIsDirty(true);
    };

    const handleSidebarDragStart = (e, bin) => {
        sidebarDragItemRef.current = bin;
        e.dataTransfer.setData('text/plain', String(bin.id));
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
    // Multiplier scale (scales small shelf dimensions up to ~720px wide workspace)
    const scale = Math.max(2.5, Math.min(3.5, 720 / shelfW));

    const handleCanvasDrop = (e) => {
        e.preventDefault();
        setIsCanvasOver(false);

        const binId = e.dataTransfer.getData('text/plain') || sidebarDragItemRef.current?.id;
        if (!binId) return;

        const targetBin = binBlocks.find(b => String(b.id) === String(binId));
        if (!targetBin) return;

        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const dropX = Math.max(0, Math.round(e.clientX - rect.left - (targetBin.width) / 2));
        const dropY = Math.max(0, Math.round(e.clientY - rect.top - (targetBin.height) / 2));

        setBinBlocks(prev => prev.map(b => {
            if (String(b.id) === String(binId)) {
                return {
                    ...b,
                    x: dropX,
                    y: dropY,
                    placed: true
                };
            }
            return b;
        }));

        setIsDirty(true);
        sidebarDragItemRef.current = null;
        toast.success(`Placed "${targetBin.label}" on canvas`);
    };

    const handlePlaceOnCanvas = (binId) => {
        setBinBlocks(prev => prev.map(b => {
            if (String(b.id) === String(binId)) {
                const placedItems = prev.filter(item => item.placed !== false);
                const maxX = placedItems.reduce((m, item) => Math.max(m, item.x + item.width), 0);
                return {
                    ...b,
                    x: b.x !== undefined && b.placed ? b.x : maxX + 10,
                    y: b.y !== undefined && b.placed ? b.y : 10,
                    placed: true
                };
            }
            return b;
        }));
        setIsDirty(true);
    };

    // Keyboard Arrow Nudging Listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedId) return;
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

            const step = e.shiftKey ? 10 : 2;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setBinBlocks(prev => prev.map(b => b.id === selectedId ? { ...b, y: Math.max(0, b.y - step) } : b));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setBinBlocks(prev => prev.map(b => b.id === selectedId ? { ...b, y: b.y + step } : b));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setBinBlocks(prev => prev.map(b => b.id === selectedId ? { ...b, x: Math.max(0, b.x - step) } : b));
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setBinBlocks(prev => prev.map(b => b.id === selectedId ? { ...b, x: b.x + step } : b));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId]);

    const handleMouseDown = (e, id, type) => {
        e.preventDefault();
        e.stopPropagation();
        const bin = binBlocks.find(b => b.id === id);
        if (!bin) return;

        setSelectedId(id);

        setDragging({
            id,
            type,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startX: bin.x,
            startY: bin.y,
            startW: bin.width,
            startH: bin.height,
        });
    };

    const [zoom, setZoom] = useState(1.25);
    const [hoveredItem, setHoveredItem] = useState(null);

    const onMouseMove = useCallback((e) => {
        if (!dragging) return;
        const dx = (e.clientX - dragging.startMouseX) / zoom;
        const dy = (e.clientY - dragging.startMouseY) / zoom;
        const currentMinW = Math.max(MIN_BIN_W, 40);

        setBinBlocks(prev => prev.map(b => {
            if (b.id !== dragging.id) return b;

            switch (dragging.type) {
                case 'move':
                    return {
                        ...b,
                        x: Math.max(0, dragging.startX + dx),
                        y: Math.max(0, dragging.startY + dy),
                    };
                case 'resize-e':
                    return { ...b, width: Math.max(currentMinW, dragging.startW + dx) };
                case 'resize-w': {
                    const newW = Math.max(currentMinW, dragging.startW - dx);
                    return { ...b, x: dragging.startX + (dragging.startW - newW), width: newW };
                }
                case 'resize-s':
                    return { ...b, height: Math.max(MIN_BIN_H, dragging.startH + dy) };
                case 'resize-n': {
                    const newH = Math.max(MIN_BIN_H, dragging.startH - dy);
                    return { ...b, y: dragging.startY + (dragging.startH - newH), height: newH };
                }
                case 'resize-ne':
                    return { ...b, width: Math.max(currentMinW, dragging.startW + dx), height: Math.max(MIN_BIN_H, dragging.startH - dy), y: dragging.startY + (dragging.startH - Math.max(MIN_BIN_H, dragging.startH - dy)) };
                case 'resize-nw': {
                    const nwW = Math.max(currentMinW, dragging.startW - dx);
                    const nwH = Math.max(MIN_BIN_H, dragging.startH - dy);
                    return { ...b, x: dragging.startX + (dragging.startW - nwW), width: nwW, y: dragging.startY + (dragging.startH - nwH), height: nwH };
                }
                case 'resize-se':
                    return { ...b, width: Math.max(currentMinW, dragging.startW + dx), height: Math.max(MIN_BIN_H, dragging.startH + dy) };
                case 'resize-sw': {
                    const swW = Math.max(currentMinW, dragging.startW - dx);
                    return { ...b, x: dragging.startX + (dragging.startW - swW), width: swW, height: Math.max(MIN_BIN_H, dragging.startH + dy) };
                }
                default:
                    return b;
            }
        }));
        setIsDirty(true);
    }, [dragging, zoom]);

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

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        let locId = '';
        try {
            const selectedLocationStr = localStorage.getItem('selectedLocation');
            if (selectedLocationStr) {
                const loc = JSON.parse(selectedLocationStr);
                locId = loc.pick_location_id || loc.id || '';
            }
        } catch (e) { }

        try {
            const placedBins = binBlocks.filter(b => b.placed !== false);

            for (let idx = 0; idx < placedBins.length; idx++) {
                const bin = placedBins[idx];
                const binId = bin.bin_id || (typeof bin.id === 'number' ? bin.id : (!isNaN(Number(bin.id)) && String(bin.id).indexOf('bin-') === -1 ? Number(bin.id) : null));

                if (!binId) continue;

                const payload = {
                    bin_name: String(bin.label || bin.bin_name || `Bin ${idx + 1}`),
                    bin_loc_id: String(bin.bin_loc_id || locId),
                    bin_shelf_id: String(shelf.shelf_phr_id || ''),
                    bin_gridx: String(Math.round(bin.x || 0)),
                    bin_gridy: String(Math.round(bin.y || 0)),
                    bin_width: String(Math.round(bin.width || 80)),
                    bin_height: String(Math.round(bin.height || 48)),
                    bin_order: String(bin.bin_order || idx + 1),
                    bin_phr_id: String(shelf.shelf_phr_id || ''),
                    bin_org_id: String(bin.bin_org_id || "skshospital"),
                    bin_branch_id: String(bin.bin_branch_id || "Salem"),
                    bin_status: bin.bin_status !== undefined ? (typeof bin.bin_status === 'boolean' ? bin.bin_status : bin.bin_status === 'True') : true
                };

                await apiService.updateBin(binId, payload);
            }

            const updatedCupboards = JSON.parse(JSON.stringify(cupboardsData));

            const targetCupboard = updatedCupboards.find(c => String(c.id) === String(cupboard.id));
            if (targetCupboard && targetCupboard.shelfLayout) {
                const targetShelf = targetCupboard.shelfLayout.find(s => String(s.id) === String(shelf.id));
                if (targetShelf) {
                    targetShelf.bins = binBlocks;
                }
            }

            syncCupboards(updatedCupboards);

            try {
                const layouts = JSON.parse(localStorage.getItem('cupboardLayouts') || '{}');
                if (layouts[cupboard.id]) {
                    const lsShelf = layouts[cupboard.id].shelfLayout?.find(s => String(s.id) === String(shelf.id));
                    if (lsShelf) {
                        lsShelf.bins = binBlocks;
                    }
                }
                localStorage.setItem('cupboardLayouts', JSON.stringify(layouts));
            } catch (e) { }

            if (refetchBins) {
                await refetchBins();
            }

            toast.success('Bins saved successfully!');

            setIsDirty(false);
            setSaveFlash(true);
            setTimeout(() => {
                setSaveFlash(false);
                onBack();
            }, 800);
        } catch (error) {
            console.error("Error saving bins:", error);
            toast.error(`Failed to save bins: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackClick = () => {
        if (isDirty) {
            setShowUnsavedDialog(true);
        } else {
            onBack();
        }
    };

    const canvasBlocks = binBlocks.filter(b => b.placed !== false);

    const maxBinRight = canvasBlocks.length > 0 ? Math.max(...canvasBlocks.map(b => (Number(b.x) || 0) + (Number(b.width) || 0))) : 0;
    const maxBinBottom = canvasBlocks.length > 0 ? Math.max(...canvasBlocks.map(b => (Number(b.y) || 0) + (Number(b.height) || 0))) : 0;

    const baseShelfW = shelfW * 2; // shelf width + 100% extra width
    const baseShelfH = shelfH * 1.5; // shelf height + 50% extra height

    // Canvas visual width (+100% width) and height (+50% height) for Bin Designer, expanding if bins overflow
    const shelfVisualWidth = Math.max(baseShelfW, maxBinRight > baseShelfW ? maxBinRight + 20 : baseShelfW);
    const shelfVisualHeight = Math.max(baseShelfH, maxBinBottom > baseShelfH ? maxBinBottom + 20 : baseShelfH);

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
                    <Button variant="ghost" onClick={handleBackClick}
                        className="text-muted-foreground hover:text-white gap-2 h-8 px-3">
                        <ArrowLeft className="w-4 h-4" /> Back to Shelves
                    </Button>
                    <div className="h-5 w-px bg-ot-border" />
                    <div className="flex items-center gap-1.5 text-xs">
                        {cupboard?.controller && (
                            <>
                                <div className="flex items-center gap-1.5 text-ot-action bg-ot-action/10 px-2 py-1 rounded-md font-medium border border-ot-action/20">
                                    <Server className="w-3.5 h-3.5" />
                                    <span>Controller: {cupboard.controller}</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            </>
                        )}
                        {cupboard?.wall && (
                            <>
                                <div className="flex items-center gap-1.5 text-muted-foreground hover:text-white bg-ot-surface-elev-bottom px-2 py-1 rounded-md border border-ot-border transition-colors">
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    <span>Wall: {cupboard.wall}</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            </>
                        )}
                        <div className="flex items-center gap-1.5 text-muted-foreground hover:text-white bg-ot-surface-elev-bottom px-2 py-1 rounded-md border border-ot-border transition-colors">
                            <Box className="w-3.5 h-3.5" />
                            <span>Cupboard: {cupboard.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <div className="flex items-center gap-1.5 text-white bg-ot-surface-elev-bottom px-2 py-1 rounded-md border border-ot-border">
                            <Layers className="w-3.5 h-3.5 text-ot-action" />
                            <span className="font-semibold">Shelf: {shelf.label}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Zoom Scale Controls */}
                    <div className="flex items-center gap-1 bg-ot-surface-elev-bottom border border-ot-border rounded-lg p-0.5">
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setZoom(z => Math.max(0.75, z - 0.25))}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-[11px] font-mono font-semibold px-1.5 min-w-[42px] text-center text-white">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setZoom(z => Math.min(2.5, z + 0.25))}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setZoom(1.25)}
                            className="h-7 px-1.5 text-[10px] text-muted-foreground hover:text-white"
                            title="Reset Zoom"
                        >
                            Reset
                        </Button>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={cn(
                            "flex items-center gap-2 px-5 transition-all duration-300 font-semibold shadow-lg",
                            saveFlash
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                                : "bg-ot-action hover:bg-ot-action-hover text-white shadow-ot-action/20"
                        )}
                    >
                        {saveFlash ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" /> Saved!
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Bin Layout'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden bg-ot-bg-mid">
                {/* Canvas Workspace */}
                <div
                    className="flex-1 overflow-auto p-6 relative touch-none select-none cursor-grab active:cursor-grabbing"
                    ref={scrollRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={stopScrolling}
                    onPointerCancel={stopScrolling}
                >
                    <div
                        ref={canvasRef}
                        onDragOver={handleCanvasDragOver}
                        onDragLeave={handleCanvasDragLeave}
                        onDrop={handleCanvasDrop}
                        className={cn(
                            "relative rounded-xl border-2 border-dashed transition-all duration-200 shadow-2xl",
                            isCanvasOver
                                ? "border-ot-action bg-ot-action/15 shadow-ot-action/30 ring-2 ring-ot-action/40"
                                : "border-ot-border/50 bg-ot-surface-top/50"
                        )}
                        style={{
                            width: shelfVisualWidth * zoom,
                            height: shelfVisualHeight * zoom,
                        }}
                    >
                        <div
                            style={{
                                width: shelfVisualWidth,
                                height: shelfVisualHeight,
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top left',
                                position: 'relative',
                            }}
                        >
                            {/* Shelf frame outline */}
                            <div className="absolute inset-0 border border-ot-border/30 rounded-xl pointer-events-none" />

                            {/* Label */}
                            <div className="absolute top-3 left-4 text-xs text-muted-foreground/40 font-semibold uppercase tracking-widest pointer-events-none flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-ot-action" />
                                <span>{shelf.label} — Drag & resize bins</span>
                            </div>

                            {canvasBlocks.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted-foreground/50 text-xs gap-2 pt-6">
                                    <Sparkles className="w-8 h-8 text-ot-action/50 animate-pulse" />
                                    <span className="font-medium text-white/80">No active bins placed on {shelf.label} yet.</span>
                                    <span>Drag a bin from the right side panel to place & align it here.</span>
                                </div>
                            )}

                            {/* Bin blocks */}
                            {canvasBlocks.map((bin) => {
                                const isActive = dragging?.id === bin.id;
                                const isHovered = hoveredItem?.type === 'bin' && hoveredItem?.id === bin.id;
                                return (
                                    <div
                                        key={bin.id}
                                        className={cn(
                                            'absolute rounded-lg border-2 flex items-center overflow-visible transition-shadow',
                                            isActive
                                                ? 'border-ot-action bg-ot-action/15 shadow-xl shadow-ot-action/30 z-20'
                                                : 'border-orange-500/40 bg-orange-500/10 hover:border-orange-500/70 z-10'
                                        )}
                                        style={{
                                            left: bin.x,
                                            top: bin.y,
                                            width: bin.width,
                                            height: bin.height,
                                        }}
                                        onMouseEnter={() => setHoveredItem({ type: 'bin', id: bin.id, label: bin.label })}
                                        onMouseLeave={() => setHoveredItem(prev => prev?.id === bin.id ? null : prev)}
                                    >
                                        <div
                                            className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => handleMouseDown(e, bin.id, 'move')}
                                        />

                                        {/* Bin Hover Badge */}
                                        {isHovered && (
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 px-2.5 py-1 rounded-md bg-slate-900/95 border border-ot-action text-white text-[11px] font-semibold shadow-xl flex items-center gap-1.5 pointer-events-none whitespace-nowrap animate-in fade-in">
                                                <Archive className="w-3.5 h-3.5 text-ot-action" />
                                                <span>Bin: {bin.label}</span>
                                            </div>
                                        )}

                                        {/* Bin content */}
                                        <div className="flex flex-col items-center justify-center gap-1 z-20 shrink-0 h-full w-full pointer-events-none">
                                            <div className="flex items-center w-full justify-center relative">
                                                <GripVertical className="absolute left-1 w-3 h-3 text-muted-foreground/40 pointer-events-none" />
                                                <span className="text-[10px] font-semibold text-white text-center px-1 leading-tight select-none pointer-events-none max-w-[90%] truncate" title={bin.label}>
                                                    {bin.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Size label */}
                                        <div className="absolute bottom-0.5 right-2 text-[8px] text-muted-foreground/40 font-mono pointer-events-none z-20">
                                            {Math.round(bin.width)}×{Math.round(bin.height)}
                                        </div>

                                        {/* Disable button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDisableBin(bin); }}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500/80 hover:bg-amber-500 text-white flex items-center justify-center z-30 opacity-0 hover:opacity-100 transition-opacity shadow-lg"
                                            style={{ pointerEvents: 'auto' }}
                                            title="Disable Bin"
                                        >
                                            <Ban className="w-3 h-3" />
                                        </button>

                                        {/* ─── Resize Handles (4 edges + 4 corners) ──────────── */}
                                        {/* North edge */}
                                        <div onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => handleMouseDown(e, bin.id, 'resize-n')} className="absolute left-2 right-2 -top-[3px] h-[6px] cursor-n-resize z-30 group">
                                            <div className="absolute inset-x-0 top-[2px] h-[2px] bg-orange-500/0 group-hover:bg-orange-500/60 transition-colors rounded-full" />
                                        </div>
                                        {/* South edge */}
                                        <div onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => handleMouseDown(e, bin.id, 'resize-s')} className="absolute left-2 right-2 -bottom-[3px] h-[6px] cursor-s-resize z-30 group">
                                            <div className="absolute inset-x-0 bottom-[2px] h-[2px] bg-orange-500/0 group-hover:bg-orange-500/60 transition-colors rounded-full" />
                                        </div>
                                        {/* West edge */}
                                        <div onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => handleMouseDown(e, bin.id, 'resize-w')} className="absolute top-2 bottom-2 -left-[3px] w-[6px] cursor-w-resize z-30 group">
                                            <div className="absolute inset-y-0 left-[2px] w-[2px] bg-orange-500/0 group-hover:bg-orange-500/60 transition-colors rounded-full" />
                                        </div>
                                        {/* East edge */}
                                        <div onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => handleMouseDown(e, bin.id, 'resize-e')} className="absolute top-2 bottom-2 -right-[3px] w-[6px] cursor-e-resize z-30 group">
                                            <div className="absolute inset-y-0 right-[2px] w-[2px] bg-orange-500/0 group-hover:bg-orange-500/60 transition-colors rounded-full" />
                                        </div>

                                        {/* Corner handles (visible dots) */}
                                        {/* NW */}
                                        <div
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => handleMouseDown(e, bin.id, 'resize-nw')}
                                            className="absolute -top-[4px] -left-[4px] w-[8px] h-[8px] rounded-full bg-orange-500/60 hover:bg-orange-500 border border-orange-500 cursor-nw-resize z-40 transition-colors"
                                        />
                                        {/* NE */}
                                        <div
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => handleMouseDown(e, bin.id, 'resize-ne')}
                                            className="absolute -top-[4px] -right-[4px] w-[8px] h-[8px] rounded-full bg-orange-500/60 hover:bg-orange-500 border border-orange-500 cursor-ne-resize z-40 transition-colors"
                                        />
                                        {/* SW */}
                                        <div
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => handleMouseDown(e, bin.id, 'resize-sw')}
                                            className="absolute -bottom-[4px] -left-[4px] w-[8px] h-[8px] rounded-full bg-orange-500/60 hover:bg-orange-500 border border-orange-500 cursor-sw-resize z-40 transition-colors"
                                        />
                                        {/* SE */}
                                        <div
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => handleMouseDown(e, bin.id, 'resize-se')}
                                            className="absolute -bottom-[4px] -right-[4px] w-[8px] h-[8px] rounded-full bg-orange-500/60 hover:bg-orange-500 border border-orange-500 cursor-se-resize z-40 transition-colors"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-64 border-l border-ot-border bg-ot-surface-top flex flex-col shrink-0">
                    <div className="px-4 py-3 border-b border-ot-border flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Box className="w-3.5 h-3.5 text-ot-action" /> Bins
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                {isLoadingBins ? 'Loading bins...' : `${binBlocks.length} bin${binBlocks.length !== 1 ? 's' : ''} fetched`}
                            </div>
                        </div>
                    </div>

                    <div className="p-2 bg-ot-surface-elev-bottom/40 border-b border-ot-border/40 text-[10px] text-muted-foreground flex items-center gap-1.5 px-3">
                        <GripVertical className="w-3 h-3 text-ot-action shrink-0" />
                        <span>Drag & drop bins onto the canvas on the left</span>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                        {binBlocks.map((bin) => {
                            const isDisabled = bin.disabled === true || bin.bin_status === false || String(bin.bin_status).toLowerCase() === 'false';
                            const isPlaced = bin.placed !== false && !isDisabled;
                            return (
                                <div
                                    key={bin.id}
                                    draggable={!isDisabled}
                                    onDragStart={(e) => !isDisabled && handleSidebarDragStart(e, bin)}
                                    className={cn(
                                        "flex flex-col gap-1.5 p-2.5 rounded-lg border transition-all select-none relative",
                                        isDisabled
                                            ? "bg-red-500/5 border-red-500/20 opacity-80"
                                            : (isPlaced
                                                ? "bg-ot-surface-elev-bottom/80 border-ot-action/40 hover:border-ot-action hover:shadow-md hover:shadow-ot-action/10 cursor-grab active:cursor-grabbing group"
                                                : "bg-ot-surface-elev-bottom/40 border-amber-500/30 hover:border-amber-500/60 cursor-grab active:cursor-grabbing group")
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-ot-action shrink-0" />
                                            <input
                                                value={bin.label}
                                                onChange={(e) => {
                                                    const newVal = e.target.value;
                                                    setBinBlocks(prev => prev.map(b => b.id === bin.id ? { ...b, label: newVal } : b));
                                                    setIsDirty(true);
                                                }}
                                                className="text-xs font-semibold text-white bg-transparent border border-transparent hover:border-white/20 focus:border-ot-action focus:bg-ot-surface-top rounded outline-none px-1 -ml-1 w-full min-w-0 transition-all"
                                                title="Edit bin name"
                                            />
                                        </div>

                                        {!isDisabled && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDisableBin(bin); }}
                                                className="w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 transition-colors shrink-0"
                                                title="Disable Bin"
                                            >
                                                <Ban className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] pl-5">
                                        <span className="text-muted-foreground font-mono">
                                            {Math.round(bin.width)}×{Math.round(bin.height)}
                                        </span>

                                        <div className="flex items-center gap-1.5">
                                            {isDisabled ? (
                                                <>
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-[9px] font-medium border border-red-500/20">
                                                        <Ban className="w-2.5 h-2.5" /> Disabled
                                                    </span>
                                                    <button
                                                        onClick={() => handleEnableBin(bin)}
                                                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white text-[9px] font-medium transition-colors border border-emerald-500/30"
                                                        title="Enable bin"
                                                    >
                                                        Enable
                                                    </button>
                                                </>
                                            ) : (
                                                <>
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
                                                        onClick={() => handlePlaceOnCanvas(bin.id)}
                                                        className="px-1.5 py-0.5 rounded bg-ot-action/20 hover:bg-ot-action text-ot-action hover:text-white text-[9px] font-medium transition-colors border border-ot-action/30"
                                                        title="Place bin on canvas"
                                                    >
                                                        {isPlaced ? "Move" : "+ Place"}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {binBlocks.length === 0 && !isLoadingBins && (
                            <div className="py-8 text-center text-xs text-muted-foreground/50">
                                No bins returned from API for this shelf.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={disableDialogOpen}
                onOpenChange={setDisableDialogOpen}
                title="Confirm Disable Bin"
                description={`Are you sure you want to disable "${binToDisable?.label || 'this bin'}"? It will be removed from the design page canvas and moved to the side list.`}
                confirmText="Disable"
                cancelText="Cancel"
                variant="warning"
                onConfirm={confirmDisableBin}
                onCancel={() => setBinToDisable(null)}
            />

            {/* Unsaved Changes Warning Dialog */}
            <ConfirmDialog
                open={showUnsavedDialog}
                onOpenChange={setShowUnsavedDialog}
                title="Unsaved Changes"
                description="You have unsaved changes. Do you want to go back without saving these changes?"
                confirmText="Leave Without Saving"
                cancelText="Cancel"
                variant="warning"
                onConfirm={() => {
                    setShowUnsavedDialog(false);
                    setIsDirty(false);
                    onBack();
                }}
                onCancel={() => setShowUnsavedDialog(false)}
            />
        </div>
    );
}
