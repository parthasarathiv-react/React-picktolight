import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { cn } from 'lib/utils';
import { Archive, Grid3X3, Package, ZoomIn, ZoomOut } from 'lucide-react';
import { getDrawerAssignment, getLedColor } from 'lib/dataStore';
import { Button } from 'components/ui/button';
import { Card } from 'components/ui/card';

const SHELF_SECTION_WIDTH = 'clamp(72px, 12vw, 144px)';
const SHELF_SECTION_HEIGHT = 'clamp(32px, 5vw, 52px)';

function normalizeCount(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function getShelfCount(cupboard) {
    return normalizeCount(cupboard.shelves || cupboard.rows, 8);
}

// Memoized: only re-renders when its own props change (cupboardId/row/col rarely change)
const DrawerCell = React.memo(function DrawerCell({ cupboardId, row, col, ledsPerDrawer, dense, shelfLabel, shelfColumns, absoluteLayout }) {
    const assignment = getDrawerAssignment(cupboardId, row, col);
    const defaultCellId = `${row}${String.fromCharCode(64 + col)}`;
    const isCustom = shelfLabel && !shelfLabel.toLowerCase().startsWith('shelf');
    const cellId = isCustom ? (shelfColumns === 1 ? shelfLabel : `${shelfLabel}-${String.fromCharCode(64 + col)}`) : defaultCellId;
    const ledSizeClass = dense ? "w-1 h-1" : "w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-3.5 lg:h-3.5";
    const labelClass = dense ? "text-[8px] sm:text-[9px] top-0.5 left-1" : "text-[9px] sm:text-[11px] lg:text-[15px] top-0.5 left-1 lg:top-1 lg:left-1.5";
    const ledStripClass = dense ? "mt-1 sm:mt-2 gap-px px-0.5" : "mt-2 sm:mt-4 gap-0.5 px-0.5 sm:px-1";

    // Memoize the LED colour array so it only recomputes when assignment changes
    const activeLedsColors = useMemo(() => {
        if (!assignment) return [];
        const colors = [];
        if (assignment.queue) {
            assignment.queue.forEach(q => {
                for (let i = 0; i < q.count; i++) colors.push(q.color);
            });
        } else {
            const actCount = Math.min(assignment.activeLeds || 0, ledsPerDrawer);
            for (let i = 0; i < actCount; i++) colors.push(assignment.ledColor);
        }
        return colors;
    }, [assignment, ledsPerDrawer]);

    if (absoluteLayout) {
        return (
            <div className={cn(
                "h-full w-full flex flex-col items-center justify-center relative group overflow-hidden transition-all duration-200 cursor-pointer p-0.5",
                !assignment ? "bg-ot-surface-bottom/60 border border-ot-border/40 opacity-80" : "bg-ot-surface-bottom border border-ot-border/80 hover:border-ot-action/60"
            )}>
                <div className={cn(
                    "flex-none font-semibold text-[10px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[95%] transition-colors leading-none",
                    !assignment ? "text-muted-foreground" : "text-white"
                )} title={cellId}>
                    {cellId}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-[2px] z-10 w-full mt-0.5">
                    {Array.from({ length: ledsPerDrawer }).map((_, ledIndex) => {
                        const colorValue = activeLedsColors[ledIndex];
                        const activeColorMeta = colorValue ? getLedColor(colorValue) : null;
                        const isActive = !!activeColorMeta;
                        return (
                            <div
                                key={ledIndex}
                                className={cn(
                                    "rounded-full transition-all w-1 h-1 sm:w-1.5 sm:h-1.5 shrink-0",
                                    isActive
                                        ? cn(activeColorMeta.tailwind, "scale-110 shadow-sm")
                                        : "bg-ot-surface-elev-bottom border border-ot-border/40 opacity-40"
                                )}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="h-full w-full min-h-0 min-w-0 bg-ot-bg-top/60 border border-ot-border/30 flex flex-col items-center justify-center relative opacity-45 group overflow-hidden">
                <div className={cn("absolute font-mono text-muted-foreground/50 whitespace-nowrap overflow-hidden text-ellipsis max-w-[95%]", labelClass)} title={cellId}>{cellId}</div>
                <div className={cn("flex", ledStripClass)}>
                    {Array.from({ length: ledsPerDrawer }).map((_, i) => (
                        <div key={i} className={cn("rounded-full bg-ot-surface-elev-bottom border border-ot-border/20", ledSizeClass)} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            className="h-full w-full min-h-0 min-w-0 bg-ot-surface-bottom border border-ot-border/80 flex flex-col items-center justify-between relative group hover:border-ot-action/60 transition-all duration-200 overflow-hidden cursor-pointer"
        >
            <div className={cn("absolute font-mono font-bold text-muted-foreground group-hover:text-white transition-colors z-10 whitespace-nowrap overflow-hidden text-ellipsis max-w-[95%]", labelClass)} title={cellId}>
                {cellId}
            </div>
            <div className={cn("flex items-center w-full justify-center z-10", ledStripClass)}>
                {Array.from({ length: ledsPerDrawer }).map((_, ledIndex) => {
                    const colorValue = activeLedsColors[ledIndex];
                    const activeColorMeta = colorValue ? getLedColor(colorValue) : null;
                    const isActive = !!activeColorMeta;
                    return (
                        <div
                            key={ledIndex}
                            className={cn(
                                "rounded-full transition-all duration-300",
                                ledSizeClass,
                                isActive
                                    ? cn(activeColorMeta.tailwind, "scale-110")
                                    : "bg-ot-surface-elev-bottom border border-ot-border/40 opacity-25"
                            )}
                        />
                    );
                })}
            </div>
        </div>
    );
});

// Memoized: only re-renders when cupboard data or active state changes
const CupboardBay = React.memo(function CupboardBay({ cupboard, isActive, onSelect, bayRef }) {
    const { id, name, shelves, rows, columns, ledsPerDrawer, wall } = cupboard;
    const computedShelves = getShelfCount({ shelves, rows });
    const computedColumns = normalizeCount(columns);
    const computedLeds = normalizeCount(ledsPerDrawer);
    const isDense = computedShelves > 6 || computedColumns > 5;
    const assignmentsCount = useMemo(() => {
        return Array.from({ length: computedShelves }).reduce((sum, _, rowIndex) => {
            const rowTotal = Array.from({ length: computedColumns }).filter((__, colIndex) =>
                getDrawerAssignment(id, rowIndex + 1, colIndex + 1)
            ).length;
            return sum + rowTotal;
        }, 0);
    }, [id, computedShelves, computedColumns]);

    return (
        <Button variant="ghost"
            type="button"
            ref={bayRef}
            onClick={onSelect}
            className={cn(
                "w-fit max-w-full flex-none text-left transition-opacity",
                isActive ? "opacity-100" : "opacity-85 hover:opacity-100"
            )}
        >
            <Card className={cn(
                "max-w-full bg-ot-surface-top border shadow-2xl flex flex-col overflow-hidden rounded-none",
                isActive ? "border-ot-action/70" : "border-ot-border"
            )}>
                <div className="px-3 py-2 border-b border-ot-border/70 bg-ot-surface-elev-bottom flex items-center justify-between gap-2 shrink-0">
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{name}</div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{wall || 'No wall'}</div>
                    </div>
                    <div className="text-right text-[10px] text-muted-foreground shrink-0">
                        <div className="font-semibold text-ot-action">{computedShelves} shelves</div>
                        <div>{computedColumns} sections</div>
                    </div>
                </div>

                {cupboard.shelfLayout && cupboard.shelfLayout.length > 0 ? (
                    (() => {
                        const canvasWidth = Math.max(600, ...cupboard.shelfLayout.map(s => s.x + s.width + 40));
                        const canvasHeight = Math.max(500, ...cupboard.shelfLayout.map(s => s.y + s.height + 40));

                        return (
                            <div
                                className="relative bg-ot-surface-top/50 border-t border-ot-border/40 overflow-hidden"
                                style={{
                                    width: canvasWidth,
                                    height: canvasHeight
                                }}
                            >
                                {[...cupboard.shelfLayout].sort((a, b) => a.y - b.y || a.x - b.x).map((shelf, sortedIdx) => {
                                    const maxBinX = shelf.bins && shelf.bins.length > 0 ? Math.max(0, ...shelf.bins.map(b => b.x + b.width)) : 0;
                                    const maxBinY = shelf.bins && shelf.bins.length > 0 ? Math.max(0, ...shelf.bins.map(b => b.y + b.height)) : 0;
                                    
                                    const displayWidth = shelf.width || 560;
                                    const displayHeight = shelf.height || 48;
                                    
                                    const scaleX = maxBinX > 0 && displayWidth > 0 ? Math.min(1, displayWidth / (maxBinX + 10)) : 1;
                                    const scaleY = maxBinY > 0 && displayHeight > 0 ? Math.min(1, displayHeight / (maxBinY + 10)) : 1;
                                    const binScale = Math.min(scaleX, scaleY);

                                    return (
                                        <div
                                            key={shelf.id}
                                            className="absolute rounded-md border border-ot-border/40 bg-ot-bg-top/20 overflow-visible"
                                            style={{
                                                left: shelf.x,
                                                top: shelf.y,
                                                width: displayWidth,
                                                height: displayHeight
                                            }}
                                        >
                                            {/* Shelf Label */}
                                            <div className="absolute -top-5 left-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider z-10 pointer-events-none">
                                                {shelf.label}
                                            </div>

                                            {/* Bins */}
                                            <div className="absolute inset-0" style={{ transform: `scale(${binScale})`, transformOrigin: 'top left' }}>
                                                {shelf.bins && shelf.bins.length > 0 ? (
                                                    shelf.bins.map((bin, binIdx) => (
                                                        <div
                                                            key={bin.id}
                                                            className="absolute"
                                                            style={{
                                                                left: bin.x,
                                                                top: bin.y,
                                                                width: bin.width,
                                                                height: bin.height
                                                            }}
                                                        >
                                                            <DrawerCell
                                                                cupboardId={id}
                                                                row={sortedIdx + 1}
                                                                col={binIdx + 1}
                                                                ledsPerDrawer={shelf.ledsPerBin || cupboard.ledsPerDrawer || 6}
                                                                dense={false}
                                                                absoluteLayout={true}
                                                                shelfLabel={bin.label}
                                                                shelfColumns={1}
                                                            />
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/50 font-mono">
                                                        No bins
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-ot-bg-top/20 text-muted-foreground/50 h-[300px] border-t border-ot-border/40 w-[500px]">
                        <span>No shelves configured</span>
                        <span className="text-xs mt-2">Use the Designer to add shelves.</span>
                    </div>
                )}

                <div className="px-3 py-2 border-t border-ot-border/70 bg-ot-bg-top/70 flex items-center justify-between text-[10px] text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                        <Grid3X3 className="w-3 h-3" />
                        {computedShelves} x {computedColumns}
                    </span>
                    <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {assignmentsCount} assigned
                    </span>
                </div>
            </Card>
        </Button>
    );
});


export default function Cupboard2D({ cupboards = [], controllerName, selectedCupboard, activeCupboardIdx = 0, onSelectCupboard, layoutMode = 'horizontal' }) {
    const [zoom, setZoom] = useState(1);
    const scrollRef = useRef(null);
    const cupboardRefs = useRef([]);
    const dragStateRef = useRef({
        isDown: false,
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        scrollTop: 0,
        moved: false,
    });
    const wallNames = [...new Set(cupboards.map((cupboard) => cupboard.wall || 'No Wall'))].join(', ');
    const totalShelves = cupboards.reduce((sum, cupboard) => sum + getShelfCount(cupboard), 0);
    const currentCupboard = selectedCupboard || cupboards[activeCupboardIdx] || null;
    const currentWall = currentCupboard?.wall || wallNames || 'No Wall';
    const currentCupboardName = currentCupboard?.name || 'No cupboard selected';
    const controllerLabel = controllerName || 'No controller';

    useEffect(() => {
        const activeCupboard = cupboardRefs.current[activeCupboardIdx];
        activeCupboard?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
        });
    }, [activeCupboardIdx]);

    const handlePointerDown = (event) => {
        if (event.button !== 0) return;

        const container = scrollRef.current;
        if (!container) return;

        dragStateRef.current = {
            isDown: true,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: container.scrollLeft,
            scrollTop: container.scrollTop,
            moved: false,
        };
        container.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
        const container = scrollRef.current;
        const dragState = dragStateRef.current;
        if (!container || !dragState.isDown) return;

        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;

        if (!dragState.moved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
            dragState.moved = true;
        }

        if (dragState.moved) {
            container.scrollLeft = dragState.scrollLeft - deltaX;
            container.scrollTop = dragState.scrollTop - deltaY;
        }
    };

    const stopDragging = (event) => {
        const container = scrollRef.current;
        if (container?.hasPointerCapture?.(event.pointerId)) {
            container.releasePointerCapture(event.pointerId);
        }
        dragStateRef.current.isDown = false;
    };

    const handleClickCapture = (event) => {
        if (!dragStateRef.current.moved) return;

        event.preventDefault();
        event.stopPropagation();
        dragStateRef.current.moved = false;
    };

    return (
        <div className="w-full h-full bg-ot-bg-mid  p-3 sm:p-4">
            <div className="h-full min-h-0 flex flex-col">
                <Card className="mb-3 flex items-center justify-between gap-3 p-3 bg-ot-surface-top border-ot-border rounded-lg shadow-sm">
                    <div className="min-w-0">
                        <h3 className="text-white font-bold flex items-center gap-2 truncate">
                            <Archive className="w-4 h-4 text-ot-action shrink-0" />
                            {controllerLabel} · {currentCupboardName}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{currentWall} · {cupboards.length} cupboards · {totalShelves} shelves</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <div className="flex items-center gap-1 bg-ot-surface-bottom border border-ot-border rounded p-0.5">
                            <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-ot-surface-top" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>
                                <ZoomOut className="w-3 h-3" />
                            </Button>
                            <span className="w-9 text-center text-[10px] font-mono">{Math.round(zoom * 100)}%</span>
                            <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-ot-surface-top" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>
                                <ZoomIn className="w-3 h-3" />
                            </Button>
                        </div>
                        <span className="px-2 py-1 rounded border border-ot-border bg-ot-surface-bottom">{cupboards.length} cupboards</span>
                        <span className="px-2 py-1 rounded border border-ot-border bg-ot-surface-bottom">{totalShelves} shelves</span>
                    </div>
                </Card>

                <div
                    ref={scrollRef}
                    className={cn(
                        "flex-1 min-h-0 flex p-2 items-start overflow-x-auto overflow-y-auto overscroll-contain cursor-grab active:cursor-grabbing select-none touch-none"
                    )}
                    style={{ contain: 'strict', willChange: 'transform' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={stopDragging}
                    onPointerCancel={stopDragging}
                    onClickCapture={handleClickCapture}
                >
                    <div
                        className={cn("flex items-start gap-4 transition-transform duration-200", layoutMode === 'horizontal' ? "flex-nowrap" : "flex-wrap content-start")}
                        style={{ zoom }}
                    >
                        {cupboards.map((cupboard, index) => (
                            <CupboardBay
                                key={cupboard.id}
                                bayRef={(element) => {
                                    cupboardRefs.current[index] = element;
                                }}
                                cupboard={cupboard}
                                isActive={index === activeCupboardIdx}
                                onSelect={() => onSelectCupboard?.(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
