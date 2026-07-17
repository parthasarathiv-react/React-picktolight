import React, { useState } from 'react';
import { Layers, ArrowRight, Archive, Filter } from 'lucide-react';
import { cn } from 'lib/utils';
import BinLayoutDesigner from './BinLayoutDesigner';

export default function BinsTab({ cupboardsData, syncCupboards, wallsData, controllersData }) {
    const [selectedShelfContext, setSelectedShelfContext] = useState(null); // { cupboard, shelf }
    
    const [filterController, setFilterController] = useState('all');
    const [filterWall, setFilterWall] = useState('all');
    const [filterCupboard, setFilterCupboard] = useState('all');

    if (selectedShelfContext) {
        return (
            <BinLayoutDesigner
                cupboard={selectedShelfContext.cupboard}
                shelf={selectedShelfContext.shelf}
                onBack={() => setSelectedShelfContext(null)}
                cupboardsData={cupboardsData}
                syncCupboards={syncCupboards}
            />
        );
    }

    // Flatten all shelves from all cupboards
    const allShelves = [];
    cupboardsData.forEach(cupboard => {
        if (cupboard.shelfLayout) {
            cupboard.shelfLayout.forEach(shelf => {
                allShelves.push({
                    cupboard,
                    shelf
                });
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
                    <div className="flex items-center gap-2 bg-ot-surface-top border border-ot-border rounded-md px-3 py-1.5">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterController}
                            onChange={(e) => { setFilterController(e.target.value); setFilterWall('all'); setFilterCupboard('all'); }}
                            className="bg-transparent text-sm text-white focus:outline-none min-w-[130px]"
                        >
                            <option value="all" className="bg-ot-surface-elev-bottom text-white">All Controllers</option>
                            {controllersData && controllersData.map(c => (
                                <option key={c.id || c.name} value={c.name} className="bg-ot-surface-elev-bottom text-white">
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-ot-surface-top border border-ot-border rounded-md px-3 py-1.5">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterWall}
                            onChange={(e) => { setFilterWall(e.target.value); setFilterCupboard('all'); }}
                            className="bg-transparent text-sm text-white focus:outline-none min-w-[130px]"
                        >
                            <option value="all" className="bg-ot-surface-elev-bottom text-white">All Walls</option>
                            {wallsData && wallsData
                                .filter(w => filterController === 'all' || w.controller === filterController)
                                .map(w => (
                                <option key={w.id || w.name} value={w.name} className="bg-ot-surface-elev-bottom text-white">
                                    {w.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-ot-surface-top border border-ot-border rounded-md px-3 py-1.5">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterCupboard}
                            onChange={(e) => setFilterCupboard(e.target.value)}
                            className="bg-transparent text-sm text-white focus:outline-none min-w-[130px]"
                        >
                            <option value="all" className="bg-ot-surface-elev-bottom text-white">All Cupboards</option>
                            {cupboardsData && cupboardsData
                                .filter(c => {
                                    const wall = wallsData?.find(w => w.name === c.wall);
                                    if (filterController !== 'all' && (!wall || wall.controller !== filterController)) return false;
                                    if (filterWall !== 'all' && c.wall !== filterWall) return false;
                                    return true;
                                })
                                .map(c => (
                                <option key={c.id || c.name} value={c.name} className="bg-ot-surface-elev-bottom text-white">
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredShelves.map((item, idx) => {
                    const { cupboard, shelf } = item;
                    const binCount = shelf.bins ? shelf.bins.length : 0;
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
                                        <div className="font-semibold text-white group-hover:text-ot-action transition-colors text-sm">
                                            {shelf.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                            {cupboard.wall} &gt; {cupboard.name}
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
