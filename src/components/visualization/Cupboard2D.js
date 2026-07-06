import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from 'lib/utils';
import { Archive, Grid3X3, Package } from 'lucide-react';
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
const DrawerCell = React.memo(function DrawerCell({ cupboardId, row, col, ledsPerDrawer, dense }) {
    const assignment = getDrawerAssignment(cupboardId, row, col);
    const cellId = `${row}${String.fromCharCode(64 + col)}`;
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

    if (!assignment) {
        return (
            <div className="min-h-0 min-w-0 bg-ot-bg-top/60 border border-ot-border/30 flex flex-col items-center justify-center relative opacity-45 group overflow-hidden">
                <div className={cn("absolute font-mono text-muted-foreground/50", labelClass)}>{cellId}</div>
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
            className="min-h-0 min-w-0 bg-ot-surface-bottom border border-ot-border/80 flex flex-col items-center justify-between relative group hover:border-ot-action/60 transition-all duration-200 overflow-hidden cursor-pointer"
        >
            <div className={cn("absolute font-mono font-bold text-muted-foreground group-hover:text-white transition-colors z-10", labelClass)}>
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
    const computedColumns = normalizeCount(columns, 4);
    const computedLeds = normalizeCount(ledsPerDrawer, 4);
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

                <div
                    className="grid gap-px bg-ot-border/40"
                    style={{ gridTemplateRows: `repeat(${computedShelves}, ${SHELF_SECTION_HEIGHT})` }}
                >
                    {Array.from({ length: computedShelves }).map((_, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="grid gap-px min-h-0 min-w-0"
                            style={{ gridTemplateColumns: `repeat(${computedColumns}, ${SHELF_SECTION_WIDTH})` }}
                        >
                            {Array.from({ length: computedColumns }).map((_, colIndex) => (
                                <DrawerCell
                                    key={colIndex}
                                    cupboardId={id}
                                    row={rowIndex + 1}
                                    col={colIndex + 1}
                                    ledsPerDrawer={computedLeds}
                                    dense={isDense}
                                />
                            ))}
                        </div>
                    ))}
                </div>

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


export default function Cupboard2D({ cupboards = [], controllerName, floorName, selectedCupboard, activeCupboardIdx = 0, onSelectCupboard, layoutMode = 'horizontal' }) {
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
    const floorLabel = floorName || 'No floor';
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
                            {floorLabel} · {controllerLabel} · {currentCupboardName}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{currentWall} · {cupboards.length} cupboards · {totalShelves} shelves</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <span className="px-2 py-1 rounded border border-ot-border bg-ot-surface-bottom">{cupboards.length} cupboards</span>
                        <span className="px-2 py-1 rounded border border-ot-border bg-ot-surface-bottom">{totalShelves} shelves</span>
                    </div>
                </Card>

                <div
                    ref={scrollRef}
                    className={cn(
                        "flex-1 min-h-0 flex p-2 items-start gap-4 overflow-x-auto overflow-y-auto overscroll-contain cursor-grab active:cursor-grabbing select-none touch-none",
                        layoutMode === 'horizontal' ? "flex-nowrap" : "flex-wrap content-start"
                    )}
                    style={{ contain: 'strict', willChange: 'transform' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={stopDragging}
                    onPointerCancel={stopDragging}
                    onClickCapture={handleClickCapture}
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
    );
}
