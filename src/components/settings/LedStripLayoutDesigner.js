import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { ArrowLeft, Save, CheckCircle2, Plus, X, Lightbulb, Link as LinkIcon, Unlink } from 'lucide-react';
import { cn } from 'lib/utils';
import { Input } from 'components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from 'components/ui/dialog';

export default function LedStripLayoutDesigner({ cupboard, onBack, cupboardsData, syncCupboards }) {
    const [saveFlash, setSaveFlash] = useState(false);

    // Load LED strips from cupboard data, or empty array
    const [ledStrips, setLedStrips] = useState(() => {
        if (cupboard.ledStrips && cupboard.ledStrips.length > 0) {
            return cupboard.ledStrips;
        }
        return [];
    });

    const [dragging, setDragging] = useState(null); // { id, type: 'move'|'resize-e'|'resize-w', startMouseX, startMouseY, startX, startW }
    const [selectedStripId, setSelectedStripId] = useState(null);
    const [editingStripId, setEditingStripId] = useState(null);
    const [stripToDelete, setStripToDelete] = useState(null);
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

    const shelves = cupboard.shelfLayout || [];

    const addStrip = () => {
        const newStrip = {
            id: `strip-${Date.now()}`,
            label: `Strip ${ledStrips.length + 1}`,
            x: 20,
            y: 20,
            width: 200,
            height: 12, // Fixed height for LED strips
            ledCount: 6, // Default LED count
            linkedBins: [], // Array of bin IDs: "shelfId_binId"
        };
        setLedStrips(prev => [...prev, newStrip]);
        setSelectedStripId(newStrip.id);
        setEditingStripId(newStrip.id);
    };

    const confirmRemoveStrip = (id) => {
        setStripToDelete(id);
    };

    const handleConfirmDelete = () => {
        if (!stripToDelete) return;
        setLedStrips(prev => prev.filter(s => s.id !== stripToDelete));
        if (selectedStripId === stripToDelete) setSelectedStripId(null);
        if (editingStripId === stripToDelete) setEditingStripId(null);
        setStripToDelete(null);
    };

    const handleMouseDown = (e, id, type) => {
        e.preventDefault();
        e.stopPropagation();

        setSelectedStripId(id);

        const strip = ledStrips.find(s => s.id === id);
        if (!strip) return;

        setDragging({
            id,
            type,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startX: strip.x,
            startY: strip.y,
            startW: strip.width,
        });
    };

    const onMouseMove = useCallback((e) => {
        if (!dragging) return;
        const dx = e.clientX - dragging.startMouseX;
        const dy = e.clientY - dragging.startMouseY;
        const minW = 40;

        setLedStrips(prev => prev.map(s => {
            if (s.id !== dragging.id) return s;

            switch (dragging.type) {
                case 'move':
                    return {
                        ...s,
                        x: Math.max(0, dragging.startX + dx),
                        y: Math.max(0, dragging.startY + dy),
                    };
                case 'resize-e':
                    return { ...s, width: Math.max(minW, dragging.startW + dx) };
                case 'resize-w': {
                    const newW = Math.max(minW, dragging.startW - dx);
                    return { ...s, x: dragging.startX + (dragging.startW - newW), width: newW };
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

    const handleBinClick = (shelfId, binId) => {
        if (!selectedStripId) return;

        const compositeId = `${shelfId}_${binId}`;

        setLedStrips(prev => prev.map(strip => {
            if (strip.id !== selectedStripId) return strip;

            const isLinked = strip.linkedBins.includes(compositeId);
            return {
                ...strip,
                linkedBins: isLinked
                    ? strip.linkedBins.filter(id => id !== compositeId)
                    : [...strip.linkedBins, compositeId]
            };
        }));
    };

    const handleSave = () => {
        const updated = cupboardsData.map(c =>
            c.id === cupboard.id
                ? { ...c, ledStrips }
                : c
        );
        syncCupboards(updated);

        try {
            const layouts = JSON.parse(localStorage.getItem('cupboardLayouts') || '{}');
            layouts[cupboard.id] = {
                ...(layouts[cupboard.id] || {}),
                ledStrips
            };
            localStorage.setItem('cupboardLayouts', JSON.stringify(layouts));
        } catch (e) { }

        setSaveFlash(true);
        setTimeout(() => {
            setSaveFlash(false);
            onBack();
        }, 800);
    };

    // Calculate canvas size based on shelves and led strips
    const maxShelfX = Math.max(0, ...shelves.map(s => s.x + s.width));
    const maxShelfY = Math.max(0, ...shelves.map(s => s.y + s.height));
    const maxStripX = Math.max(0, ...ledStrips.map(s => s.x + s.width));
    const maxStripY = Math.max(0, ...ledStrips.map(s => s.y + s.height));

    const canvasWidth = Math.max(600, maxShelfX + 40, maxStripX + 40);
    const canvasHeight = Math.max(500, maxShelfY + 40, maxStripY + 40);

    const selectedStrip = ledStrips.find(s => s.id === selectedStripId);

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
            return;
        }
        setSelectedStripId(null);
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
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-ot-action" />
                        <span className="text-sm font-semibold text-white">{cupboard.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">LED Strips Designer</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={addStrip}
                        className="gap-2 h-8 px-4 bg-ot-surface-elev-bottom border border-ot-border text-white hover:bg-ot-surface-top text-sm"
                    >
                        <Plus className="w-4 h-4" /> Add LED Strip
                    </Button>
                    <Button
                        onClick={handleSave}
                        className={cn(
                            'gap-2 h-8 px-4 text-sm transition-all duration-300 disabled:opacity-40',
                            saveFlash
                                ? 'bg-green-600 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                                : 'bg-ot-action text-white hover:bg-ot-action-hover'
                        )}
                    >
                        {saveFlash
                            ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                            : <><Save className="w-4 h-4" /> Save Strips</>
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
                        }}
                    >
                        {/* Instructional Text */}
                        <div className="absolute top-3 left-4 text-xs text-muted-foreground/40 font-semibold uppercase tracking-widest pointer-events-none z-0">
                            {cupboard.name} — Select a strip to link bins
                        </div>

                        {/* Render Shelves and Bins */}
                        {shelves.map(shelf => {
                            const bins = shelf.bins || [];

                            const maxBinX = bins.length > 0 ? Math.max(0, ...bins.map(b => b.x + b.width)) : 0;
                            const maxBinY = bins.length > 0 ? Math.max(0, ...bins.map(b => b.y + b.height)) : 0;

                            const displayWidth = shelf.width || 560;
                            const displayHeight = shelf.height || 48;

                            const scaleX = maxBinX > 0 && displayWidth > 0 ? Math.min(1, displayWidth / (maxBinX + 10)) : 1;
                            const scaleY = maxBinY > 0 && displayHeight > 0 ? Math.min(1, displayHeight / (maxBinY + 10)) : 1;
                            const binScale = Math.min(scaleX, scaleY);

                            return (
                                <div key={shelf.id} style={{ position: 'absolute', left: shelf.x, top: shelf.y, width: displayWidth, height: displayHeight }} className="pointer-events-none">
                                    {/* Shelf Background */}
                                    <div className="absolute inset-0 border-2 border-ot-border/40 rounded-lg bg-ot-surface-bottom/20" />

                                    {/* Shelf Label */}
                                    <div className="absolute -top-5 left-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider z-10">
                                        {shelf.label}
                                    </div>

                                    {/* Render Bins inside Shelf */}
                                    <div className="absolute inset-0" style={{ transform: `scale(${binScale})`, transformOrigin: 'top left' }}>
                                        {bins.map(bin => {
                                            const compositeId = `${shelf.id}_${bin.id}`;
                                            const isLinkedToSelected = selectedStrip?.linkedBins.includes(compositeId);
                                            const isLinkedToOther = !isLinkedToSelected && ledStrips.some(s => s.linkedBins.includes(compositeId));

                                            return (
                                                <div
                                                    key={bin.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBinClick(shelf.id, bin.id);
                                                    }}
                                                    className={cn(
                                                        'absolute rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer pointer-events-auto',
                                                        !selectedStripId ? 'border-ot-border/30 bg-ot-surface-top/30 hover:border-ot-border/60' :
                                                            isLinkedToSelected ? 'border-ot-action bg-ot-action/20 shadow-[0_0_15px_rgba(var(--ot-action-rgb),0.3)]' :
                                                                isLinkedToOther ? 'border-green-500/50 bg-green-500/10' :
                                                                    'border-ot-border/30 bg-ot-surface-top/10 hover:border-ot-action/40 hover:bg-ot-action/5'
                                                    )}
                                                    style={{
                                                        left: bin.x,
                                                        top: bin.y,
                                                        width: bin.width,
                                                        height: bin.height,
                                                    }}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <span className={cn("text-xs font-semibold", isLinkedToSelected ? "text-ot-action" : "text-muted-foreground/70")}>{bin.label}</span>
                                                        {isLinkedToSelected && <LinkIcon className="w-3 h-3 text-ot-action mt-1" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Render LED Strips */}
                        {ledStrips.map(strip => {
                            const isSelected = selectedStripId === strip.id;
                            return (
                                <div
                                    key={strip.id}
                                    className={cn(
                                        'absolute rounded-full border-2 flex items-center overflow-visible transition-shadow z-20',
                                        isSelected
                                            ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.5)]'
                                            : 'border-yellow-500/50 bg-yellow-500/10 hover:border-yellow-500/80 hover:bg-yellow-500/20'
                                    )}
                                    style={{
                                        left: strip.x,
                                        top: strip.y,
                                        width: strip.width,
                                        height: strip.height,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStripId(strip.id);
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStripId(strip.id);
                                        setEditingStripId(strip.id);
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10 rounded-full"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => handleMouseDown(e, strip.id, 'move')}
                                    />

                                    {/* Visual LED dots inside the strip */}
                                    <div className="flex items-center justify-around w-full px-1 pointer-events-none opacity-80 overflow-hidden">
                                        {Array.from({ length: Math.min(strip.ledCount || 6, 200) }).map((_, i) => {
                                            const renderCount = Math.min(strip.ledCount || 6, 200);
                                            const dotSize = Math.max(1, Math.min(4, (strip.width - 8) / renderCount));
                                            return (
                                                <div key={i} className={cn("rounded-full shrink-0", isSelected ? "bg-yellow-300" : "bg-yellow-500/50")} style={{ width: dotSize, height: dotSize }} />
                                            );
                                        })}
                                    </div>

                                    {/* Selected UI Helpers */}
                                    {isSelected && (
                                        <>
                                            {/* Name Label */}
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-ot-surface-top border border-yellow-500/50 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none">
                                                {strip.label} ({strip.linkedBins.length} linked)
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onPointerDown={(e) => { e.stopPropagation(); confirmRemoveStrip(strip.id); }}
                                                className="absolute -right-3 -top-3 w-5 h-5 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center z-30 shadow-lg pointer-events-auto cursor-pointer"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>

                                            {/* West edge resize */}
                                            <div
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => handleMouseDown(e, strip.id, 'resize-w')}
                                                className="absolute top-0 bottom-0 -left-[4px] w-[8px] cursor-w-resize z-30"
                                            >
                                                <div className="absolute inset-y-0 left-[2px] w-[4px] bg-yellow-400 rounded-full" />
                                            </div>
                                            {/* East edge resize */}
                                            <div
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => handleMouseDown(e, strip.id, 'resize-e')}
                                                className="absolute top-0 bottom-0 -right-[4px] w-[8px] cursor-e-resize z-30"
                                            >
                                                <div className="absolute inset-y-0 right-[2px] w-[4px] bg-yellow-400 rounded-full" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-64 border-l border-ot-border bg-ot-surface-top flex flex-col shrink-0 z-10">
                    {editingStripId ? (() => {
                        const strip = ledStrips.find(s => s.id === editingStripId);
                        if (!strip) return null;

                        const allBins = [];
                        shelves.forEach(s => {
                            if (s.bins) {
                                s.bins.forEach(b => {
                                    allBins.push({
                                        compositeId: `${s.id}_${b.id}`,
                                        label: `${s.label} - ${b.label}`,
                                        shelfId: s.id,
                                        binId: b.id
                                    });
                                });
                            }
                        });

                        const unlinkedBins = allBins.filter(b => !strip.linkedBins.includes(b.compositeId));

                        return (
                            <>
                                <div className="px-4 py-3 border-b border-ot-border flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Edit Strip</div>
                                        <div className="text-[10px] text-white mt-0.5 truncate">{strip.label}</div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setEditingStripId(null)} className="h-7 px-2 text-xs text-ot-action hover:text-ot-action hover:bg-ot-action/10">
                                        Done
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Strip Name</label>
                                        <Input
                                            value={strip.label}
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                setLedStrips(prev => prev.map(s => s.id === strip.id ? { ...s, label: newVal } : s));
                                            }}
                                            className="h-8 text-xs bg-ot-surface-bottom border-ot-border/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Number of LEDs</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={200}
                                            value={strip.ledCount}
                                            onChange={(e) => {
                                                const newVal = Number(e.target.value) || 1;
                                                setLedStrips(prev => prev.map(s => s.id === strip.id ? { ...s, ledCount: newVal } : s));
                                            }}
                                            className="h-8 text-xs bg-ot-surface-bottom border-ot-border/50"
                                        />
                                    </div>

                                    <div className="space-y-3 pt-2 border-t border-ot-border/50">
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Link Bins</label>
                                        <Select onValueChange={(val) => {
                                            if (val) {
                                                const [sId, bId] = val.split('_');
                                                handleBinClick(sId, bId);
                                            }
                                        }}>
                                            <SelectTrigger className="h-8 text-xs bg-ot-surface-bottom border-ot-border/50">
                                                <SelectValue placeholder="Select a bin to link..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {unlinkedBins.length === 0 && (
                                                    <SelectItem value="none" disabled>No available bins</SelectItem>
                                                )}
                                                {unlinkedBins.map(b => (
                                                    <SelectItem key={b.compositeId} value={b.compositeId}>{b.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="space-y-1 mt-3">
                                            <div className="text-[10px] text-muted-foreground mb-2">Currently Linked ({strip.linkedBins.length})</div>
                                            {strip.linkedBins.length === 0 ? (
                                                <div className="text-[10px] text-muted-foreground/60 italic text-center py-2 bg-ot-surface-bottom/30 rounded border border-ot-border/20">No bins linked</div>
                                            ) : (
                                                strip.linkedBins.map(linkedId => {
                                                    const [sId, bId] = linkedId.split('_');
                                                    const shelf = shelves.find(s => s.id === sId);
                                                    const bin = shelf?.bins?.find(b => b.id === bId);
                                                    if (!bin) return null;
                                                    return (
                                                        <div key={linkedId} className="flex items-center justify-between px-2 py-1.5 rounded bg-ot-surface-bottom border border-ot-border/40 group">
                                                            <span className="text-[10px] text-white truncate pr-2">{shelf.label} - {bin.label}</span>
                                                            <button
                                                                onClick={() => handleBinClick(sId, bId)}
                                                                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-all shrink-0"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>


                                </div>
                            </>
                        );
                    })() : (
                        <>
                            <div className="px-4 py-3 border-b border-ot-border">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">LED Strips</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{ledStrips.length} total strips</div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2"
                                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                                {ledStrips.map((strip) => {
                                    const isSelected = selectedStripId === strip.id;
                                    return (
                                        <div key={strip.id}
                                            onClick={() => setSelectedStripId(strip.id)}
                                            onDoubleClick={() => {
                                                setSelectedStripId(strip.id);
                                                setEditingStripId(strip.id);
                                            }}
                                            className={cn(
                                                "flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden group",
                                                isSelected
                                                    ? "bg-ot-action/10 border-ot-action shadow-md"
                                                    : "bg-ot-surface-elev-bottom/60 border-ot-border/50 hover:border-yellow-500/50"
                                            )}
                                        >
                                            <div className="flex items-center justify-between z-10">
                                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                                    <Lightbulb className={cn("w-4 h-4 shrink-0", isSelected ? "text-yellow-400" : "text-muted-foreground")} />
                                                    <span className="text-sm font-semibold text-white truncate">{strip.label}</span>
                                                </div>

                                            </div>

                                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-ot-border/50 z-10">
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <LinkIcon className="w-3 h-3" /> {strip.linkedBins.length} Bins Linked
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono bg-ot-surface-top px-1.5 py-0.5 rounded border border-ot-border/30">
                                                    {strip.ledCount} LEDs
                                                </span>
                                            </div>

                                            {/* Hover indicator for double click */}
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                                <span className="text-[10px] font-bold text-white tracking-widest uppercase bg-ot-action/80 px-2 py-1 rounded shadow-lg">
                                                    Double Click to Edit
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {ledStrips.length === 0 && (
                                    <div className="text-center py-8 text-xs text-muted-foreground">
                                        No LED strips added.<br />Click "Add LED Strip" to begin.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!stripToDelete} onOpenChange={(open) => !open && setStripToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete LED Strip</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this LED strip? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="ghost" onClick={() => setStripToDelete(null)}>
                            Cancel
                        </Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleConfirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
