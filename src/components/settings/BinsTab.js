import React, { useState } from 'react';
import { Layers, ArrowRight, Archive, Filter } from 'lucide-react';
import { cn } from 'lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';
import BinLayoutDesigner from './BinLayoutDesigner';

export default function BinsTab({
    cupboardsData,
    syncCupboards,
    wallsData,
    controllersData,
    refetchBins,
    selectedShelfContext: propSelectedShelfContext,
    onSelectShelfContext,
    filterController: propFilterController,
    onFilterControllerChange,
    filterWall: propFilterWall,
    onFilterWallChange,
    filterCupboard: propFilterCupboard,
    onFilterCupboardChange
}) {
    const [internalSelectedShelfContext, setInternalSelectedShelfContext] = useState(null); // { cupboard, shelf }
    const selectedShelfContext = propSelectedShelfContext !== undefined ? propSelectedShelfContext : internalSelectedShelfContext;
    const setSelectedShelfContext = onSelectShelfContext || setInternalSelectedShelfContext;

    const [internalFilterController, setInternalFilterController] = useState('all');
    const filterController = propFilterController !== undefined ? propFilterController : internalFilterController;
    const setFilterController = onFilterControllerChange || setInternalFilterController;

    const [internalFilterWall, setInternalFilterWall] = useState('all');
    const filterWall = propFilterWall !== undefined ? propFilterWall : internalFilterWall;
    const setFilterWall = onFilterWallChange || setInternalFilterWall;

    const [internalFilterCupboard, setInternalFilterCupboard] = useState('all');
    const filterCupboard = propFilterCupboard !== undefined ? propFilterCupboard : internalFilterCupboard;
    const setFilterCupboard = onFilterCupboardChange || setInternalFilterCupboard;

    if (selectedShelfContext) {
        return (
            <BinLayoutDesigner
                cupboard={selectedShelfContext.cupboard}
                shelf={selectedShelfContext.shelf}
                onBack={() => setSelectedShelfContext(null)}
                cupboardsData={cupboardsData}
                syncCupboards={syncCupboards}
                refetchBins={refetchBins}
            />
        );
    }

    // Flatten all shelves from all cupboards (only showing shelves assigned to controller, wall & cupboard)
    const allShelves = [];
    cupboardsData.forEach(cupboard => {
        if (cupboard.shelfLayout) {
            cupboard.shelfLayout.forEach(shelf => {
                const ctlId = shelf.shelf_ctl_id !== undefined ? String(shelf.shelf_ctl_id).trim() : String(cupboard.controller_id || cupboard.controller || '').trim();
                const wallId = shelf.shelf_wall_id !== undefined ? String(shelf.shelf_wall_id).trim() : String(cupboard.wall_id || cupboard.wall || '').trim();
                const cupboardId = shelf.shelf_cupboard_id !== undefined ? String(shelf.shelf_cupboard_id).trim() : String(cupboard.id || cupboard.name || '').trim();

                // Only display shelves that have valid non-empty controller, wall, and cupboard IDs and placed === true
                const isAssigned = ctlId !== '' && wallId !== '' && cupboardId !== '' && shelf.placed !== false;

                if (isAssigned) {
                    allShelves.push({
                        cupboard,
                        shelf
                    });
                }
            });
        }
    });

    const filteredShelves = allShelves.filter(item => {
        const { cupboard } = item;
        const wall = wallsData?.find(w => w.name === cupboard.wall);
        if (filterController !== 'all') {
            if (!wall || wall.controller !== filterController) return false;
        }
        if (filterWall !== 'all') {
            if (cupboard.wall !== filterWall) return false;
        }
        if (filterCupboard !== 'all') {
            if (cupboard.name !== filterCupboard) return false;
        }
        return true;
    });

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in p-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-white">Bins Designer</h3>
                    <p className="text-sm text-muted-foreground mt-1">

                        Select a shelf to add and arrange bins inside it.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <div className="w-[160px]">
                            <Select value={filterController} onValueChange={(val) => { setFilterController(val); setFilterWall('all'); setFilterCupboard('all'); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Controllers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Controllers</SelectItem>
                                    {controllersData && controllersData.map(c => (
                                        <SelectItem key={c.id || c.name} value={c.name}>

                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <div className="w-[160px]">
                            <Select value={filterWall} onValueChange={(val) => { setFilterWall(val); setFilterCupboard('all'); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Walls" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Walls</SelectItem>
                                    {wallsData && wallsData
                                        .filter(w => filterController === 'all' || w.controller === filterController)
                                        .map(w => (
                                            <SelectItem key={w.id || w.name} value={w.name}>
                                                {w.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <div className="w-[160px]">
                            <Select value={filterCupboard} onValueChange={setFilterCupboard}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Cupboards" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Cupboards</SelectItem>
                                    {cupboardsData && cupboardsData
                                        .filter(c => {
                                            const wall = wallsData?.find(w => w.name === c.wall);
                                            if (filterController !== 'all' && (!wall || wall.controller !== filterController)) return false;
                                            if (filterWall !== 'all' && c.wall !== filterWall) return false;
                                            return true;
                                        })
                                        .map(c => (
                                            <SelectItem key={c.id || c.name} value={c.name}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredShelves.map((item, idx) => {
                    const { cupboard, shelf } = item;
                    const binCount = shelf.bins
                        ? shelf.bins.filter(b => b.placed !== false && b.bin_placed !== false).length
                        : 0;
                    return (
                        <button
                            key={`${cupboard.id}-${shelf.id}-${idx}`}
                            onClick={() => setSelectedShelfContext(item)}
                            className={cn(
                                'group relative flex flex-col p-4 rounded-xl border transition-all duration-200 text-left',
                                'border-ot-border bg-ot-surface-elev-bottom/40',
                                'hover:border-ot-action/70 hover:bg-ot-action/5 hover:shadow-lg hover:shadow-ot-action/10',
                                'active:scale-[0.99]'
                            )}
                        >
                            <div className="flex items-start justify-between gap-4 w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-ot-surface-top border border-ot-border flex items-center justify-center shrink-0">
                                        <Layers className="w-5 h-5 text-ot-action" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white group-hover:text-ot-action transition-colors text-sm flex items-center gap-1.5">
                                            <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Shelf:</span>
                                            <span className="text-base font-bold text-white">{shelf.label}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ot-surface-top border border-ot-border/60 text-[11px]">
                                                <span className="text-muted-foreground/70">Wall:</span>
                                                <span className="font-medium text-gray-200">{cupboard.wall}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ot-surface-top border border-ot-border/60 text-[11px]">
                                                <span className="text-muted-foreground/70">Cupboard:</span>
                                                <span className="font-medium text-gray-200">{cupboard.name}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-ot-surface-top border border-ot-border group-hover:bg-ot-action group-hover:border-ot-action transition-all duration-200 shrink-0">
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors duration-200" />
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-ot-border/50 flex items-center justify-between text-xs text-muted-foreground w-full">
                                <span className="flex items-center gap-1.5">
                                    <Archive className="w-3.5 h-3.5" />
                                    {binCount} Bins
                                </span>
                                <span className="font-mono text-[11px] text-muted-foreground/70">
                                    {Math.round(parseFloat(shelf.width) || parseFloat(shelf.shelf_width) || 560)}×{Math.round(parseFloat(shelf.height) || parseFloat(shelf.shelf_height) || 48)}px
                                </span>
                            </div>

                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-ot-action opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </button>
                    );
                })}
            </div>

            {filteredShelves.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-ot-surface-elev-bottom border border-ot-border flex items-center justify-center">
                        <Archive className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        No shelves found. Add shelves in the Shelves tab first.
                    </div>
                </div>
            )}
        </div>
    );
}
