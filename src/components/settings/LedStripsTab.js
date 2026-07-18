import React, { useState } from 'react';
import { Box, ArrowRight, Lightbulb, Filter } from 'lucide-react';
import { cn } from 'lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';
import LedStripLayoutDesigner from './LedStripLayoutDesigner';

export default function LedStripsTab({ cupboardsData, syncCupboards, wallsData, controllersData }) {
    const [selectedCupboard, setSelectedCupboard] = useState(null);
    const [filterController, setFilterController] = useState('all');
    const [filterWall, setFilterWall] = useState('all');

    if (selectedCupboard) {
        return (
            <LedStripLayoutDesigner
                cupboard={selectedCupboard}
                onBack={() => setSelectedCupboard(null)}
                cupboardsData={cupboardsData}
                syncCupboards={syncCupboards}
            />
        );
    }

    const filteredCupboards = cupboardsData.filter(cupboard => {
        const wall = wallsData?.find(w => w.name === cupboard.wall);
        if (filterController !== 'all') {
            if (!wall || wall.controller !== filterController) return false;
        }
        if (filterWall !== 'all') {
            if (cupboard.wall !== filterWall) return false;
        }
        return true;
    });

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-white">LED Strips Designer</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select a cupboard to place LED strips and link them to bins.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <div className="w-[180px]">
                            <Select value={filterController} onValueChange={(val) => { setFilterController(val); setFilterWall('all'); }}>
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
                        <div className="w-[180px]">
                            <Select value={filterWall} onValueChange={setFilterWall}>
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
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCupboards.map((cupboard) => {
                    const stripCount = cupboard.ledStrips ? cupboard.ledStrips.length : 0;
                    return (
                        <button
                            key={cupboard.id}
                            onClick={() => setSelectedCupboard(cupboard)}
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
                                        <Lightbulb className="w-5 h-5 text-ot-action" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white group-hover:text-ot-action transition-colors text-sm">
                                            {cupboard.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                            {cupboard.wall}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-ot-surface-top border border-ot-border group-hover:bg-ot-action group-hover:border-ot-action transition-all duration-200 shrink-0">
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors duration-200" />
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-ot-border/50 flex items-center justify-between text-xs text-muted-foreground w-full">
                                <span className="flex items-center gap-1.5">
                                    <Lightbulb className="w-3.5 h-3.5" />
                                    {stripCount} LED Strips
                                </span>
                            </div>

                            {/* Subtle active glow strip */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-ot-action opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </button>
                    );
                })}
            </div>

            {filteredCupboards.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-ot-surface-elev-bottom border border-ot-border flex items-center justify-center">
                        <Box className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        No cupboards found. Add cupboards in the Cupboards tab first.
                    </div>
                </div>
            )}
        </div>
    );
}
