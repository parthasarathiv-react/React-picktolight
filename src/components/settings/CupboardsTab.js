import React, { useState } from 'react';
import { LayoutGrid, ArrowRight, Grid3X3, Filter } from 'lucide-react';
import { cn } from 'lib/utils';
import CupboardLayoutDesigner from './CupboardLayoutDesigner';

export default function CupboardsTab({ cupboardsData, syncCupboards, wallsData, selectedWall, onSelectWall, controllersData }) {
    const [filterController, setFilterController] = useState('all');

    // If a wall is selected, show the layout designer for cupboards
    if (selectedWall) {
        return (
            <CupboardLayoutDesigner
                wall={selectedWall}
                onBack={() => onSelectWall(null)}
                cupboardsData={cupboardsData}
                syncCupboards={syncCupboards}
            />
        );
    }

    const filteredWalls = wallsData.filter(wall => {
        if (filterController !== 'all' && wall.controller !== filterController) return false;
        return true;
    });

    // Otherwise, show list of walls to choose from
    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-white">Cupboards Designer</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select a wall to add and arrange cupboards inside it.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-ot-surface-top border border-ot-border rounded-md px-3 py-1.5">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterController}
                            onChange={(e) => setFilterController(e.target.value)}
                            className="bg-transparent text-sm text-white focus:outline-none min-w-[150px]"
                        >
                            <option value="all" className="bg-ot-surface-elev-bottom text-white">All Controllers</option>
                            {controllersData && controllersData.map(c => (
                                <option key={c.id || c.name} value={c.name} className="bg-ot-surface-elev-bottom text-white">
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredWalls.map((wall) => {
                    const wallCupboards = cupboardsData.filter(c => c.wall === wall.name);
                    return (
                        <button
                            key={wall.id}
                            onClick={() => onSelectWall(wall)}
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
                                        <LayoutGrid className="w-5 h-5 text-ot-action" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white group-hover:text-ot-action transition-colors text-sm">
                                            {wall.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                            {wall.controller}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-ot-surface-top border border-ot-border group-hover:bg-ot-action group-hover:border-ot-action transition-all duration-200 shrink-0">
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors duration-200" />
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-ot-border/50 flex items-center justify-between text-xs text-muted-foreground w-full">
                                <span className="flex items-center gap-1.5">
                                    <Grid3X3 className="w-3.5 h-3.5" />
                                    {wallCupboards.length} Cupboards
                                </span>
                            </div>

                            {/* Subtle active glow strip */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-ot-action opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </button>
                    );
                })}
            </div>

            {filteredWalls.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-ot-surface-elev-bottom border border-ot-border flex items-center justify-center">
                        <LayoutGrid className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        No walls found. Add walls in the Walls tab first.
                    </div>
                </div>
            )}
        </div>
    );
}
