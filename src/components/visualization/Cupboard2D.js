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
        const linked = strip.linkedBins || strip.bins;
        if (!linked || !Array.isArray(linked)) continue;

        const isMatch = linked.some(lb => {
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
            const colorIdx = (strip.colorIndex !== undefined && !isNaN(Number(strip.colorIndex)))
                ? Number(strip.colorIndex)
                : idx;
            return { strip, index: idx, theme: getStripColor(colorIdx) };
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

const WALL_COLOR_THEMES = [
    { name: 'cyan', border: 'border-cyan-500/60', headerBg: 'bg-cyan-950/70', badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40', accentDot: 'bg-cyan-400' },
    { name: 'emerald', border: 'border-emerald-500/60', headerBg: 'bg-emerald-950/70', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40', accentDot: 'bg-emerald-400' },
    { name: 'amber', border: 'border-amber-500/60', headerBg: 'bg-amber-950/70', badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40', accentDot: 'bg-amber-400' },
    { name: 'purple', border: 'border-purple-500/60', headerBg: 'bg-purple-950/70', badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40', accentDot: 'bg-purple-400' },
    { name: 'rose', border: 'border-rose-500/60', headerBg: 'bg-rose-950/70', badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40', accentDot: 'bg-rose-400' },
    { name: 'sky', border: 'border-sky-500/60', headerBg: 'bg-sky-950/70', badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40', accentDot: 'bg-sky-400' },
    { name: 'indigo', border: 'border-indigo-500/60', headerBg: 'bg-indigo-950/70', badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40', accentDot: 'bg-indigo-400' },
    { name: 'orange', border: 'border-orange-500/60', headerBg: 'bg-orange-950/70', badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-400/40', accentDot: 'bg-orange-400' },
];

function getWallTheme(wallName) {
    if (!wallName) return WALL_COLOR_THEMES[0];
    let hash = 0;
    const str = String(wallName).trim();
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % WALL_COLOR_THEMES.length;
    return WALL_COLOR_THEMES[idx];
}

// Memoized: only re-renders when cupboard data or active state changes
const CupboardBay = React.memo(function CupboardBay({ cupboard, isActive, onSelect, bayRef, onStripMove, onStripClick, onStripDoubleClick, hideInternalWires = true }) {
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

    const wallTheme = getWallTheme(wall);

    const activePlacedShelves = useMemo(() => {
        if (!cupboard.shelfLayout || !Array.isArray(cupboard.shelfLayout)) return [];
        return cupboard.shelfLayout.filter(s => {
            const isPlaced = (s.shelf_placed !== undefined && s.shelf_placed !== null)
                ? (typeof s.shelf_placed === 'boolean' ? s.shelf_placed : String(s.shelf_placed).toLowerCase() === 'true')
                : (s.placed !== undefined ? (typeof s.placed === 'boolean' ? s.placed : String(s.placed).toLowerCase() === 'true') : false);
            const isShelfStatusFalse = (s.shelf_status !== undefined && s.shelf_status !== null && (s.shelf_status === false || String(s.shelf_status).toLowerCase() === 'false'));
            return isPlaced && !isShelfStatusFalse;
        }).map(s => {
            const filteredBins = (s.bins || []).filter(b => {
                const isBinPlaced = (b.bin_placed !== undefined && b.bin_placed !== null)
                    ? (typeof b.bin_placed === 'boolean' ? b.bin_placed : String(b.bin_placed).toLowerCase() === 'true')
                    : (b.placed !== undefined ? (typeof b.placed === 'boolean' ? b.placed : String(b.placed).toLowerCase() === 'true') : false);
                const isBinStatusFalse = (b.bin_status !== undefined && b.bin_status !== null && (b.bin_status === false || String(b.bin_status).toLowerCase() === 'false'));
                return isBinPlaced && !isBinStatusFalse;
            });
            return {
                ...s,
                bins: filteredBins
            };
        });
    }, [cupboard.shelfLayout]);

    return (
        <div
            ref={bayRef}
            onClick={onSelect}
            className={cn(
                "w-fit max-w-full flex-none text-left transition-opacity cursor-pointer",
                isActive ? "opacity-100" : "opacity-85 hover:opacity-100"
            )}
        >
            <Card className={cn(
                "max-w-full bg-ot-surface-top border shadow-2xl flex flex-col overflow-hidden rounded-md transition-all",
                wallTheme.border,
                isActive ? "ring-2 ring-ot-action/80" : ""
            )}>
                <div className={cn("px-3 py-2 border-b border-ot-border/70 flex items-center justify-between gap-2 shrink-0", wallTheme.headerBg)}>
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", wallTheme.accentDot)} />
                            {name}
                        </div>
                        <div className={cn("text-[10px] font-mono px-2 py-0.5 rounded border inline-block mt-0.5 font-bold uppercase tracking-wider", wallTheme.badgeBg)}>
                            {wall || 'No wall'}
                        </div>
                    </div>
                    <div className="text-right text-[10px] text-muted-foreground shrink-0">
                        <div className="font-semibold text-ot-action">{computedShelves} shelves</div>
                        <div>{computedColumns} sections</div>
                    </div>
                </div>

                {activePlacedShelves && activePlacedShelves.length > 0 ? (
                    (() => {
                        const maxShelfX = Math.max(0, ...activePlacedShelves.map(s => Number(s.x) + Number(s.width)));
                        const maxShelfY = Math.max(0, ...activePlacedShelves.map(s => Number(s.y) + Number(s.height)));
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
                                {[...activePlacedShelves].sort((a, b) => Number(a.y) - Number(b.y) || Number(a.x) - Number(b.x)).map((shelf, sortedIdx) => {
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

                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Render Wire Connections between LED Strips */}
                                {!hideInternalWires && cupboard.ledStrips && cupboard.ledStrips.length > 1 && (
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
                                            let savedLedCount = 6;
                                            try {
                                                const saved = localStorage.getItem('ledSetupConfig');
                                                if (saved) {
                                                    const parsed = JSON.parse(saved);
                                                    if (parsed.ledCount) savedLedCount = parsed.ledCount;
                                                }
                                            } catch (e) { }

                                            const count = 6;
                                            const calcWidth = (c) => Math.max(30, 10 + (Math.max(1, Number(c) || 6)) * 8);
                                            const curW = (strip.width && !isNaN(Number(strip.width)) && Number(strip.width) > 0) ? Number(strip.width) : calcWidth(count);
                                            const curH = (strip.height && !isNaN(Number(strip.height)) && Number(strip.height) > 0) ? Number(strip.height) : 22;

                                            const nextCount = 6;
                                            const nextH = (nextStrip.height && !isNaN(Number(nextStrip.height)) && Number(nextStrip.height) > 0) ? Number(nextStrip.height) : 22;

                                            // OUT Port on current strip (RIGHT side of strip)
                                            const x1 = Number(strip.x || 0) + curW;
                                            const y1 = Number(strip.y || 0) + curH / 2;

                                            // IN Port on next strip (LEFT side of next strip)
                                            const x2 = Number(nextStrip.x || 0);
                                            const y2 = Number(nextStrip.y || 0) + nextH / 2;

                                            // Bezier curve control points
                                            const diffX = x2 - x1;
                                            const diffY = y2 - y1;
                                            const absDx = Math.abs(diffX);
                                            const absDy = Math.abs(diffY);
                                            let cp1X, cp1Y, cp2X, cp2Y;
                                            if (diffX >= 0) {
                                                const offset = Math.min(80, Math.max(15, absDx * 0.35));
                                                cp1X = x1 + offset;
                                                cp1Y = y1;
                                                cp2X = x2 - offset;
                                                cp2Y = y2;
                                            } else {
                                                const offset = Math.min(40, Math.max(15, absDx * 0.15, absDy * 0.15));
                                                const yDir = diffY >= 0 ? 1 : -1;
                                                cp1X = x1 + offset;
                                                cp1Y = y1 + offset * yDir;
                                                cp2X = x2 - offset;
                                                cp2Y = y2 - offset * yDir;
                                            }

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

                                    const count = 6;
                                    const colors = (strip.colors && strip.colors.length > 0) ? strip.colors : savedColors;
                                    const colorIdx = (strip.colorIndex !== undefined && !isNaN(Number(strip.colorIndex)))
                                        ? Number(strip.colorIndex)
                                        : stripIdx;
                                    const colorTheme = getStripColor(colorIdx);
                                    const cupId = cupboard.id || cupboard.cupboard_id || 'c';
                                    const sId = strip.id || strip.strip_id;

                                    return (
                                        <div
                                            key={sId}
                                            id={`strip-target-${cupId}-${sId}`}
                                            data-strip-target={sId}
                                            onMouseDown={(e) => {
                                                if (!onStripMove) return;
                                                e.stopPropagation();
                                                const startX = e.clientX;
                                                const startY = e.clientY;
                                                const initialX = Number(strip.x) || 20;
                                                const initialY = Number(strip.y) || 20;

                                                // Find parent scroll container for edge auto-scrolling
                                                let pElem = e.currentTarget.parentElement;
                                                while (pElem && pElem !== document.body) {
                                                    const overflow = window.getComputedStyle(pElem).overflow;
                                                    const overflowX = window.getComputedStyle(pElem).overflowX;
                                                    const overflowY = window.getComputedStyle(pElem).overflowY;
                                                    if (/(auto|scroll)/.test(overflow + overflowX + overflowY)) {
                                                        break;
                                                    }
                                                    pElem = pElem.parentElement;
                                                }

                                                const handleMouseMove = (moveEvent) => {
                                                    const dx = moveEvent.clientX - startX;
                                                    const dy = moveEvent.clientY - startY;

                                                    // Auto scroll parent container when dragging near side edges
                                                    if (pElem) {
                                                        const rect = pElem.getBoundingClientRect();
                                                        const edgeMargin = 70;
                                                        if (moveEvent.clientX > rect.right - edgeMargin) {
                                                            pElem.scrollLeft += 15;
                                                        } else if (moveEvent.clientX < rect.left + edgeMargin) {
                                                            pElem.scrollLeft -= 15;
                                                        }
                                                        if (moveEvent.clientY > rect.bottom - edgeMargin) {
                                                            pElem.scrollTop += 15;
                                                        } else if (moveEvent.clientY < rect.top + edgeMargin) {
                                                            pElem.scrollTop -= 15;
                                                        }
                                                    }

                                                    const newX = Math.max(0, Math.round(initialX + dx));
                                                    const newY = Math.max(0, Math.round(initialY + dy));
                                                    onStripMove(sId, newX, newY);
                                                };

                                                const handleMouseUp = () => {
                                                    window.removeEventListener('mousemove', handleMouseMove);
                                                    window.removeEventListener('mouseup', handleMouseUp);
                                                };

                                                window.addEventListener('mousemove', handleMouseMove);
                                                window.addEventListener('mouseup', handleMouseUp);
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const now = Date.now();
                                                if (strip._lastClick && (now - strip._lastClick < 400)) {
                                                    if (onStripDoubleClick) {
                                                        onStripDoubleClick(strip);
                                                    }
                                                    strip._lastClick = 0;
                                                } else {
                                                    strip._lastClick = now;
                                                }
                                            }}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                if (onStripDoubleClick) {
                                                    onStripDoubleClick(strip);
                                                }
                                            }}
                                            className={cn(
                                                "absolute rounded-full border-2 flex items-center overflow-visible z-30 transition-all select-none",
                                                (onStripMove || onStripDoubleClick) ? "pointer-events-auto cursor-pointer hover:scale-105 hover:border-white shadow-xl" : "pointer-events-none",
                                                colorTheme.border,
                                                colorTheme.bgLight,
                                                colorTheme.shadow
                                            )}
                                            style={{
                                                left: strip.x,
                                                top: strip.y,
                                                width: (strip.width && !isNaN(Number(strip.width)) && Number(strip.width) > 0 && Number(strip.width) <= 220)
                                                    ? Number(strip.width)
                                                    : Math.max(40, Math.min(180, (count || 6) * 11 + 12)),
                                                height: (strip.height && !isNaN(Number(strip.height)) && Number(strip.height) > 0) ? Number(strip.height) : 22,
                                            }}
                                        >
                                            {/* Left IN Anchor (Invisible Target Node) */}
                                            <div
                                                id={`strip-in-${cupId}-${sId}`}
                                                data-strip-in={sId}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 pointer-events-none opacity-0"
                                            />

                                            {/* Strip Label Badge - Placed cleanly ABOVE strip so it never covers LEDs */}
                                            <div className={cn(
                                                "absolute -top-6 left-1 text-[9px] font-mono font-bold whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-950/95 border shadow-md z-40 pointer-events-none tracking-tight",
                                                colorTheme.border, colorTheme.text
                                            )}>
                                                {strip.label}
                                            </div>

                                            {/* LED Lights Array */}
                                            <div className="flex items-center justify-around w-full px-1">
                                                {Array.from({ length: Math.min(count, 200) }).map((_, i) => {
                                                    const renderCount = Math.min(count, 200);
                                                    const stripW = (strip.width && !isNaN(Number(strip.width)) && Number(strip.width) > 0 && Number(strip.width) <= 220)
                                                        ? Number(strip.width)
                                                        : Math.max(40, Math.min(180, (count || 6) * 11 + 12));
                                                    const dotSize = Math.max(3, Math.min(6, (stripW - 8) / renderCount));
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

                                            {/* Right OUT Anchor (Invisible Target Node) */}
                                            <div
                                                id={`strip-out-${cupId}-${sId}`}
                                                data-strip-out={sId}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 pointer-events-none opacity-0"
                                            />
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
        </div>
    );
});


export default function Cupboard2D({ cupboards = [], controllerName, selectedCupboard, activeCupboardIdx = 0, onSelectCupboard, layoutMode = 'horizontal', onStripMove, onStripClick, onStripDoubleClick, hideInternalWires = true, onZoomChange }) {
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
        onZoomChange?.(zoom);
        window.dispatchEvent(new Event('scroll'));
        const t = setTimeout(() => window.dispatchEvent(new Event('scroll')), 100);
        const t2 = setTimeout(() => window.dispatchEvent(new Event('scroll')), 250);
        return () => {
            clearTimeout(t);
            clearTimeout(t2);
        };
    }, [zoom, onZoomChange]);

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
        if (event.target.closest && event.target.closest('[data-strip-target], [data-strip-in], button, input, select, .pointer-events-auto')) return;

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
    };

    const handlePointerMove = (event) => {
        const container = scrollRef.current;
        const dragState = dragStateRef.current;
        if (!container || !dragState.isDown) return;

        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;

        if (!dragState.moved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
            dragState.moved = true;
            container.setPointerCapture?.(event.pointerId);
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
                <Card className="mb-3 flex items-center justify-between gap-3 p-3 bg-ot-surface-top border-ot-border rounded-lg shadow-sm relative z-30">
                    <div className="min-w-0">
                        <h3 className="text-white font-bold flex items-center gap-2 truncate">
                            <Archive className="w-4 h-4 text-ot-action shrink-0" />
                            {controllerLabel} · {currentCupboardName}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{currentWall} · {cupboards.length} cupboards · {totalShelves} shelves</p>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground shrink-0">
                        {/* Sample Legend Strip Badge */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-cyan-500/40 bg-slate-950/80 text-[10px] font-mono shadow-sm" title="LED Strip Signal Flow Legend: Left Pin = IN (Data Input), Right Pin = OUT (Data Output to Next Strip)">
                            <span className="text-[9px] text-cyan-400 font-bold tracking-tight uppercase">Flow:</span>
                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-full px-1.5 py-0.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white text-[6px] text-black font-black flex items-center justify-center shadow-[0_0_4px_#22d3ee]">I</span>
                                <div className="flex items-center gap-0.5 px-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#facc15]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_4px_#c084fc]" />
                                </div>
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-white text-[6px] text-white font-black flex items-center justify-center shadow-[0_0_4px_#a855f7]">O</span>
                            </div>
                            <span className="text-[8px] text-slate-400 hidden sm:inline">(IN ➔ OUT)</span>
                        </div>

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
                        "flex-1 min-h-0 flex p-2 items-start overflow-x-auto overflow-y-auto overscroll-contain cursor-grab active:cursor-grabbing select-none touch-none relative z-10"
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
                                onStripMove={onStripMove}
                                onStripClick={onStripClick}
                                onStripDoubleClick={onStripDoubleClick}
                                hideInternalWires={hideInternalWires}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
