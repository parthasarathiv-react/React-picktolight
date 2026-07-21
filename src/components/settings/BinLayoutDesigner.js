import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { ArrowLeft, Save, CheckCircle2, Plus, X, Layers, GripVertical, Server, ChevronRight, LayoutGrid, Box } from 'lucide-react';
import { cn } from 'lib/utils';
import { Input } from 'components/ui/input';

const MIN_BIN_W = 40;
const MIN_BIN_H = 40;

export default function BinLayoutDesigner({ cupboard, shelf, onBack, cupboardsData, syncCupboards }) {
    const [saveFlash, setSaveFlash] = useState(false);
    const [genRows, setGenRows] = useState(1);
    const [genCols, setGenCols] = useState(4);

    // Initial load from existing bins or default to empty
    const [binBlocks, setBinBlocks] = useState(() => {
        if (shelf.bins && shelf.bins.length > 0) {
            return shelf.bins;
        }
        return [];
    });

    const [dragging, setDragging] = useState(null);
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

    const addBin = () => {
        // Place bin at next available slot horizontally
        const maxX = binBlocks.reduce((m, b) => Math.max(m, b.x + b.width), 0);
        const newBin = {
            id: `bin-${Date.now()}`,
            label: `Bin ${binBlocks.length + 1}`,
            x: maxX + 10,
            y: 0, // Top aligned within shelf
            width: 80,
            height: shelf.height || 48,
        };
        setBinBlocks(prev => [...prev, newBin]);
    };

    const generateGrid = () => {
        const newBins = [];
        const padding = 10;
        const totalW = shelf.width || 600;
        const totalH = shelf.height || 100;
        
        const binW = Math.max(MIN_BIN_W, (totalW - (genCols + 1) * padding) / genCols);
        const binH = Math.max(MIN_BIN_H, (totalH - (genRows + 1) * padding) / genRows);
        
        let counter = 1;
        for (let r = 0; r < genRows; r++) {
            for (let c = 0; c < genCols; c++) {
                newBins.push({
                    id: `bin-${Date.now()}-${counter}`,
                    label: `Bin ${counter}`,
                    x: padding + c * (binW + padding),
                    y: padding + r * (binH + padding),
                    width: binW,
                    height: binH
                });
                counter++;
            }
        }
        setBinBlocks(newBins);
    };

    const removeBin = (id) => {
        setBinBlocks(prev => prev.filter(b => b.id !== id));
    };

    const handleMouseDown = (e, id, type) => {
        e.preventDefault();
        e.stopPropagation();
        const bin = binBlocks.find(b => b.id === id);
        if (!bin) return;

        let activeId = id;

        if (type === 'move' && (e.ctrlKey || e.metaKey)) {
            activeId = `bin-${Date.now()}`;
            const newBin = { ...bin, id: activeId, label: `${bin.label} (Copy)` };
            setBinBlocks(prev => [...prev, newBin]);
        }

        setDragging({
            id: activeId,
            type,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startX: bin.x,
            startY: bin.y,
            startW: bin.width,
            startH: bin.height,
        });
    };

    const onMouseMove = useCallback((e) => {
        if (!dragging) return;
        const dx = e.clientX - dragging.startMouseX;
        const dy = e.clientY - dragging.startMouseY;
        // Calculate dynamic minimum width
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

    const handleSave = () => {
        // Deep clone cupboardsData to avoid mutating state directly
        const updatedCupboards = JSON.parse(JSON.stringify(cupboardsData));
        
        // Find the current cupboard and update its shelf
        const targetCupboard = updatedCupboards.find(c => c.id === cupboard.id);
        if (targetCupboard && targetCupboard.shelfLayout) {
            const targetShelf = targetCupboard.shelfLayout.find(s => s.id === shelf.id);
            if (targetShelf) {
                targetShelf.bins = binBlocks;
            }
        }

        syncCupboards(updatedCupboards);

        try {
            const layouts = JSON.parse(localStorage.getItem('cupboardLayouts') || '{}');
            if (layouts[cupboard.id]) {
                const lsShelf = layouts[cupboard.id].shelfLayout?.find(s => s.id === shelf.id);
                if (lsShelf) {
                    lsShelf.bins = binBlocks;
                }
            }
            localStorage.setItem('cupboardLayouts', JSON.stringify(layouts));
        } catch (e) { }

        setSaveFlash(true);
        setTimeout(() => {
            setSaveFlash(false);
            onBack();
        }, 800);
    };

    // Calculate canvas size
    const shelfVisualWidth = Math.max(shelf.width || 600, ...binBlocks.map(b => b.x + b.width + 40));
    const shelfVisualHeight = Math.max(shelf.height || 100, ...binBlocks.map(b => b.y + b.height + 40), 200);

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
                        <ArrowLeft className="w-4 h-4" /> Back to Shelves
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
                        <div className="flex items-center gap-1.5 text-muted-foreground hover:text-white bg-ot-surface-elev-bottom px-2 py-1 rounded-md border border-ot-border transition-colors">
                            <Box className="w-3.5 h-3.5" />
                            <span>{cupboard.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <div className="flex items-center gap-1.5 text-white bg-ot-surface-elev-bottom px-2 py-1 rounded-md border border-ot-border">
                            <Layers className="w-3.5 h-3.5 text-ot-action" />
                            <span className="font-semibold">{shelf.label}</span>
                        </div>
                    </div>

                    <div className="h-5 w-px bg-ot-border ml-2" />
                    <span className="text-xs text-muted-foreground font-mono ml-1">Bins Designer</span>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={addBin}
                        className="gap-2 h-8 px-4 bg-ot-surface-elev-bottom border border-ot-border text-white hover:bg-ot-surface-top text-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Bin
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
                            : <><Save className="w-4 h-4" /> Save Shelf</>
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
                            width: shelfVisualWidth,
                            height: shelfVisualHeight,
                            userSelect: 'none',
                            cursor: dragging?.type === 'move' ? 'grabbing' : 'default',
                        }}
                    >
                        {/* Shelf frame outline */}
                        <div className="absolute inset-0 border border-ot-border/30 rounded-xl pointer-events-none" />

                        {/* Label */}
                        <div className="absolute top-3 left-4 text-xs text-muted-foreground/40 font-semibold uppercase tracking-widest pointer-events-none">
                            {shelf.label} — Drag & resize bins
                        </div>

                        {/* Bin blocks */}
                        {binBlocks.map((bin, idx) => {
                            const isActive = dragging?.id === bin.id;
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
                                >
                                    <div
                                        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => handleMouseDown(e, bin.id, 'move')}
                                    />

                                    {/* Bin content */}
                                    <div className="flex flex-col items-center justify-center gap-1 z-20 shrink-0 h-full w-full pointer-events-none">
                                        <div className="flex items-center w-full justify-center relative">
                                            <GripVertical className="absolute left-1 w-3 h-3 text-muted-foreground/40 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={bin.label}
                                                onChange={(e) => {
                                                    const newVal = e.target.value;
                                                    setBinBlocks(prev => prev.map(sb => sb.id === bin.id ? { ...sb, label: newVal } : sb));
                                                }}
                                                onPointerDown={(e) => e.stopPropagation()}
                                                className="bg-transparent text-xs font-semibold text-white text-center outline-none border-none focus:bg-ot-bg-top/50 px-1 py-0.5 rounded w-full max-w-[80%] pointer-events-auto"
                                                placeholder="Label"
                                            />
                                        </div>
                                    </div>

                                    {/* Size label */}
                                    <div className="absolute bottom-0.5 right-2 text-[8px] text-muted-foreground/40 font-mono pointer-events-none z-20">
                                        {Math.round(bin.width)}×{Math.round(bin.height)}
                                    </div>

                                    {/* Remove button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeBin(bin.id); }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center z-30 opacity-0 hover:opacity-100 transition-opacity shadow-lg"
                                        style={{ pointerEvents: 'auto' }}
                                    >
                                        <X className="w-3 h-3" />
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

                {/* Right Sidebar */}
                <div className="w-56 border-l border-ot-border bg-ot-surface-top flex flex-col shrink-0">
                    <div className="px-4 py-3 border-b border-ot-border">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Bins</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{binBlocks.length} items</div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                        {binBlocks.map((bin) => (
                            <div key={bin.id}
                                className="flex items-center gap-2 p-2 rounded-lg bg-ot-surface-elev-bottom/60 border border-ot-border/50 group"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-semibold text-white truncate">{bin.label}</div>
                                    <div className="text-[9px] text-muted-foreground font-mono">
                                        {Math.round(bin.width)}×{Math.round(bin.height)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeBin(bin.id)}
                                    className="opacity-0 group-hover:opacity-100 w-3.5 h-3.5 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-all shrink-0">
                                    <X className="w-2 h-2" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-ot-border p-4 space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2 block">Generate Grid</label>
                            <div className="flex gap-2 mb-2">
                                <div className="flex-1">
                                    <span className="text-[10px] text-muted-foreground">Rows</span>
                                    <Input type="number" min={1} max={10} value={genRows} onChange={e => setGenRows(Number(e.target.value) || 1)} className="h-8 text-xs" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] text-muted-foreground">Cols</span>
                                    <Input type="number" min={1} max={20} value={genCols} onChange={e => setGenCols(Number(e.target.value) || 1)} className="h-8 text-xs" />
                                </div>
                            </div>
                            <Button variant="secondary" onClick={generateGrid} className="w-full h-8 text-xs bg-ot-surface-elev-bottom border border-ot-border text-white hover:bg-ot-surface-top transition-colors">
                                Generate Bins
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
