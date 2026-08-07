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
    if (cupboard.shelfLayout && Array.isArray(cupboard.shelfLayout)) {
        return cupboard.shelfLayout.length;
    }
    return Number(cupboard.shelves || cupboard.rows || 0);
}

const STRIP_COLORS = [
    {
        name: 'cyan',
        border: 'border-cyan-400',
        bgLight: 'bg-cyan-500/25',
        text: 'text-cyan-400',
        shadowBin: 'shadow-[0_0_12px_rgba(34,211,238,0.35)]',
        hex: '#22d3ee'
    },
    {
        name: 'purple',
        border: 'border-purple-400',
        bgLight: 'bg-purple-500/25',
        text: 'text-purple-400',
        shadowBin: 'shadow-[0_0_12px_rgba(192,132,252,0.35)]',
        hex: '#c084fc'
    },
    {
        name: 'amber',
        border: 'border-amber-400',
        bgLight: 'bg-amber-500/25',
        text: 'text-amber-400',
        shadowBin: 'shadow-[0_0_12px_rgba(251,191,36,0.35)]',
        hex: '#fbbf24'
    },
    {
        name: 'emerald',
        border: 'border-emerald-400',
        bgLight: 'bg-emerald-500/25',
        text: 'text-emerald-400',
        shadowBin: 'shadow-[0_0_12px_rgba(52,211,153,0.35)]',
        hex: '#34d399'
    },
    {
        name: 'rose',
        border: 'border-rose-400',
        bgLight: 'bg-rose-500/25',
        text: 'text-rose-400',
        shadowBin: 'shadow-[0_0_12px_rgba(251,113,133,0.35)]',
        hex: '#fb7185'
    },
    {
        name: 'blue',
        border: 'border-blue-400',
        bgLight: 'bg-blue-500/25',
        text: 'text-blue-400',
        shadowBin: 'shadow-[0_0_12px_rgba(96,165,250,0.35)]',
        hex: '#60a5fa'
    },
    {
        name: 'orange',
        border: 'border-orange-400',
        bgLight: 'bg-orange-500/25',
        text: 'text-orange-400',
        shadowBin: 'shadow-[0_0_12px_rgba(251,146,60,0.35)]',
        hex: '#fb923c'
    },
    {
        name: 'lime',
        border: 'border-lime-400',
        bgLight: 'bg-lime-500/25',
        text: 'text-lime-400',
        shadowBin: 'shadow-[0_0_12px_rgba(163,230,53,0.35)]',
        hex: '#a3e635'
    },
    {
        name: 'fuchsia',
        border: 'border-fuchsia-400',
        bgLight: 'bg-fuchsia-500/25',
        text: 'text-fuchsia-400',
        shadowBin: 'shadow-[0_0_12px_rgba(232,121,249,0.35)]',
        hex: '#e879f9'
    }
];

function getStripColor(index) {
    if (index < 0 || isNaN(index)) return STRIP_COLORS[0];
    return STRIP_COLORS[index % STRIP_COLORS.length];
}

function findStripForBin(ledStrips, shelf, bin) {
    if (!ledStrips || !Array.isArray(ledStrips) || !bin) return null;

    const compositeId = `${shelf?.id || ''}_${bin?.id || ''}`;
    const binIdStr = String(bin.bin_id || bin.id || '').trim();
    const binLabelStr = String(bin.label || bin.bin_name || '').trim();

    for (let idx = 0; idx < ledStrips.length; idx++) {
        const strip = ledStrips[idx];
        if (!strip.linkedBins || !Array.isArray(strip.linkedBins)) continue;

        const isMatch = strip.linkedBins.some(lb => {
            const lbStr = String(lb).trim();
            if (lbStr === compositeId) return true;
            if (binIdStr && lbStr === binIdStr) return true;
            if (binLabelStr && lbStr === binLabelStr) return true;
            if (lbStr.includes('_')) {
                const parts = lbStr.split('_');
                const lastPart = parts[parts.length - 1];
                if (lastPart === binIdStr || lastPart === binLabelStr) return true;
            }
            return false;
        });

        if (isMatch) {
            return { strip, index: idx, theme: getStripColor(idx) };
        }
    }
    return null;
}

// Memoized: only re-renders when its own props change (cupboardId/row/col rarely change)
const DrawerCell = React.memo(function DrawerCell({ cupboardId, row, col, ledsPerDrawer, dense, shelfLabel, shelfColumns, absoluteLayout, stripTheme }) {
    const assignment = getDrawerAssignment(cupboardId, row, col);
    const defaultCellId = `${row}${String.fromCharCode(64 + col)}`;
    const isCustom = shelfLabel && !shelfLabel.toLowerCase().startsWith('shelf');
    const cellId = isCustom ? (shelfColumns === 1 ? shelfLabel : `${shelfLabel}-${String.fromCharCode(64 + col)}`) : defaultCellId;
    const labelClass = dense ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[11px] lg:text-[13px]";

    if (absoluteLayout) {
        return (
            <div className={cn(
                "h-full w-full flex flex-col items-center justify-center relative group overflow-hidden transition-all duration-200 cursor-pointer p-0.5 rounded-md border",
                stripTheme
                    ? `${stripTheme.bgLight} ${stripTheme.border} ${stripTheme.shadowBin}`
                    : (!assignment ? "bg-ot-surface-bottom/60 border-ot-border/40 opacity-80" : "bg-ot-surface-bottom border-ot-border/80 hover:border-ot-action/60")
            )}>
                <div className={cn(
                    "flex-none font-semibold text-[10px] sm:text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[95%] transition-colors leading-none text-center",
                    stripTheme ? `${stripTheme.text} font-bold` : (!assignment ? "text-muted-foreground" : "text-white")
                )} title={cellId}>
                    {cellId}
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className={cn(
                "h-full w-full min-h-0 min-w-0 flex flex-col items-center justify-center relative group overflow-hidden border transition-all duration-200 rounded-md p-1",
                stripTheme
                    ? `${stripTheme.bgLight} ${stripTheme.border} ${stripTheme.shadowBin}`
                    : "bg-ot-bg-top/60 border-ot-border/30 opacity-45"
            )}>
                <div className={cn(
                    "font-mono text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[95%]",
                    labelClass,
                    stripTheme ? `${stripTheme.text} font-bold` : "text-muted-foreground/50"
                )} title={cellId}>
                    {cellId}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "h-full w-full min-h-0 min-w-0 border flex flex-col items-center justify-center relative group hover:border-ot-action/60 transition-all duration-200 overflow-hidden cursor-pointer rounded-md p-1",
                stripTheme ? `${stripTheme.bgLight} ${stripTheme.border}` : "bg-ot-surface-bottom border-ot-border/80"
            )}
        >
            <div className={cn(
                "font-mono font-bold text-center transition-colors z-10 whitespace-nowrap overflow-hidden text-ellipsis max-w-[95%]",
                labelClass,
                stripTheme ? `${stripTheme.text}` : "text-muted-foreground group-hover:text-white"
            )} title={cellId}>
                {cellId}
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
                        const maxShelfX = Math.max(0, ...cupboard.shelfLayout.map(s => Number(s.x) + Number(s.width)));
                        const maxShelfY = Math.max(0, ...cupboard.shelfLayout.map(s => Number(s.y) + Number(s.height)));
                        const maxStripX = cupboard.ledStrips ? Math.max(0, ...cupboard.ledStrips.map(s => Number(s.x) + Number(s.width))) : 0;
                        const maxStripY = cupboard.ledStrips ? Math.max(0, ...cupboard.ledStrips.map(s => Number(s.y) + Number(s.height))) : 0;

                        const canvasWidth = Math.max(600, maxShelfX + 40, maxStripX + 40);
                        const canvasHeight = Math.max(500, maxShelfY + 40, maxStripY + 40);

                        return (
                            <div
                                className="relative bg-ot-surface-top/50 border-t border-ot-border/40 overflow-hidden"
                                style={{
                                    width: canvasWidth,
                                    height: canvasHeight
                                }}
                            >
                                {[...cupboard.shelfLayout].sort((a, b) => Number(a.y) - Number(b.y) || Number(a.x) - Number(b.x)).map((shelf, sortedIdx) => {
                                    const maxBinX = shelf.bins && shelf.bins.length > 0 ? Math.max(0, ...shelf.bins.map(b => Number(b.x) + Number(b.width))) : 0;
                                    const maxBinY = shelf.bins && shelf.bins.length > 0 ? Math.max(0, ...shelf.bins.map(b => Number(b.y) + Number(b.height))) : 0;

                                    const displayWidth = Number(shelf.width) || 560;
                                    const displayHeight = Number(shelf.height) || 48;

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
                                                    shelf.bins.map((bin, binIdx) => {
                                                        const stripMatch = findStripForBin(cupboard.ledStrips, shelf, bin);
                                                        const stripTheme = stripMatch ? stripMatch.theme : null;

                                                        return (
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
                                                                    stripTheme={stripTheme}
                                                                />
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/50 font-mono">
                                                        No bins
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                 {/* Render Wire Connections between LED Strips */}
                                 {cupboard.ledStrips && cupboard.ledStrips.length > 1 && (
                                     <svg className="absolute inset-0 pointer-events-none z-15 overflow-visible" width={canvasWidth} height={canvasHeight}>
                                         <style>{`
                                             @keyframes wireFlowMonitoring {
                                                 from { stroke-dashoffset: 24; }
                                                 to { stroke-dashoffset: 0; }
                                             }
                                             .animate-wire-flow-monitoring {
                                                 animation: wireFlowMonitoring 1.2s linear infinite;
                                             }
                                         `}</style>
                                         <defs>
                                             <filter id="wire-glow-monitoring" x="-30%" y="-30%" width="160%" height="160%">
                                                 <feGaussianBlur stdDeviation="4" result="blur" />
                                                 <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                             </filter>
                                         </defs>

                                         {cupboard.ledStrips.slice(0, -1).map((strip, idx) => {
                                             const nextStrip = cupboard.ledStrips[idx + 1];
                                             if (!nextStrip) return null;

                                             // OUT Port on current strip (LEFT side)
                                             const x1 = Number(strip.x || 0);
                                             const y1 = Number(strip.y || 0) + (Number(strip.height) || 22) / 2;

                                             // IN Port on next strip (RIGHT side)
                                             const x2 = Number(nextStrip.x || 0) + Number(nextStrip.width || 100);
                                             const y2 = Number(nextStrip.y || 0) + (Number(nextStrip.height) || 22) / 2;

                                             // Bezier curve control points
                                             const dx = Math.max(80, Math.abs(x1 - x2) * 0.5, Math.abs(y1 - y2) * 0.4);
                                             const cp1X = x1 - dx;
                                             const cp1Y = y1;
                                             const cp2X = x2 + dx;
                                             const cp2Y = y2;

                                             const pathD = `M ${x1} ${y1} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${x2} ${y2}`;
                                             const themeColor = getStripColor(idx).hex || '#38bdf8';

                                             // Midpoint & tangent angle calculation at t = 0.5 for cubic Bezier
                                             const midX = 0.125 * x1 + 0.375 * cp1X + 0.375 * cp2X + 0.125 * x2;
                                             const midY = 0.125 * y1 + 0.375 * cp1Y + 0.375 * cp2Y + 0.125 * y2;

                                             const tanX = 0.75 * (cp1X - x1) + 1.5 * (cp2X - cp1X) + 0.75 * (x2 - cp2X);
                                             const tanY = 0.75 * (cp1Y - y1) + 1.5 * (cp2Y - cp1Y) + 0.75 * (y2 - cp2Y);
                                             const angleDeg = Math.atan2(tanY, tanX) * (180 / Math.PI);

                                             return (
                                                 <g key={`wire-${strip.id || idx}-${nextStrip.id || idx + 1}`}>
                                                     {/* Outer wire glow */}
                                                     <path
                                                         d={pathD}
                                                         fill="none"
                                                         stroke={themeColor}
                                                         strokeWidth="6"
                                                         strokeOpacity="0.25"
                                                         filter="url(#wire-glow-monitoring)"
                                                     />
                                                     {/* Main animated wire */}
                                                     <path
                                                         d={pathD}
                                                         fill="none"
                                                         stroke="#38bdf8"
                                                         strokeWidth="2.5"
                                                         strokeDasharray="8 6"
                                                         className="animate-wire-flow-monitoring"
                                                     />
                                                     {/* Center Arrowhead Marker */}
                                                     <g transform={`translate(${midX}, ${midY}) rotate(${angleDeg})`}>
                                                         <polygon
                                                             points="-7,-5 7,0 -7,5"
                                                             fill="#38bdf8"
                                                             stroke="#0284c7"
                                                             strokeWidth="1"
                                                             className="drop-shadow-[0_0_6px_rgba(56,189,248,0.9)]"
                                                         />
                                                     </g>
                                                 </g>
                                             );
                                         })}
                                     </svg>
                                 )}

                                 {/* Render LED Strips */}
                                 {cupboard.ledStrips && cupboard.ledStrips.map((strip, stripIdx) => {
                                     let savedColors = ['#ef4444', '#22c55e', '#3b82f6', '#facc15', '#f97316', '#a855f7'];
                                     let savedLedCount = 6;
                                     try {
                                         const saved = localStorage.getItem('ledSetupConfig');
                                         if (saved) {
                                             const parsed = JSON.parse(saved);
                                             if (parsed.ledCount) savedLedCount = parsed.ledCount;
                                             if (Array.isArray(parsed.ledColors) && parsed.ledColors.length > 0) {
                                                 savedColors = parsed.ledColors.map(c => c.hex);
                                             }
                                         }
                                     } catch (e) { }

                                     const count = strip.ledCount || savedLedCount;
                                     const colors = (strip.colors && strip.colors.length > 0) ? strip.colors : savedColors;
                                     const colorTheme = getStripColor(stripIdx);

                                     return (
                                         <div
                                             key={strip.id}
                                             className={cn(
                                                 "absolute rounded-full border-2 flex items-center overflow-visible z-20 pointer-events-none transition-all",
                                                 colorTheme.border,
                                                 colorTheme.bgLight,
                                                 colorTheme.shadow
                                             )}
                                             style={{
                                                 left: strip.x,
                                                 top: strip.y,
                                                 width: strip.width,
                                                 height: strip.height,
                                             }}
                                         >
                                             <div className={cn("absolute -top-4 left-1 text-[9px] font-mono font-bold whitespace-nowrap px-1 rounded bg-slate-950/90 border shadow-sm", colorTheme.border, colorTheme.text)}>{strip.label}</div>
                                             <div className="flex items-center justify-around w-full px-1">
                                                 {Array.from({ length: Math.min(count, 200) }).map((_, i) => {
                                                     const renderCount = Math.min(count, 200);
                                                     const dotSize = Math.max(3, Math.min(6, (strip.width - 8) / renderCount));
                                                     const hex = colors[i % colors.length] || '#facc15';
                                                     return (
                                                         <div
                                                             key={i}
                                                             className="rounded-full shrink-0 border border-white/20"
                                                             style={{
                                                                 width: dotSize,
                                                                 height: dotSize,
                                                                 backgroundColor: hex,
                                                                 boxShadow: `0 0 6px ${hex}`
                                                             }}
                                                         />
                                                     );
                                                 })}
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
