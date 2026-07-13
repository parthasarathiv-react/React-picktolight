import React from 'react';
import { Wifi, WifiOff, ArrowRight, LayoutGrid } from 'lucide-react';
import { cn } from 'lib/utils';

export default function WallsTab({ controllersData, onSelectController }) {
    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in">
            <div>
                <h3 className="text-xl font-semibold text-white">Wall Layout Designer</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Select a controller to design and arrange its wall layout.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {controllersData.map((ctrl) => (
                    <button
                        key={ctrl.id}
                        onClick={() => onSelectController(ctrl)}
                        className={cn(
                            'group relative flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 text-left',
                            'border-ot-border bg-ot-surface-elev-bottom/40',
                            'hover:border-ot-action/70 hover:bg-ot-action/5 hover:shadow-lg hover:shadow-ot-action/10',
                            'active:scale-[0.99]'
                        )}
                    >
                        {/* Left — icon + info */}
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200',
                                ctrl.status === 'Online'
                                    ? 'bg-green-500/10 border border-green-500/20 group-hover:bg-green-500/20'
                                    : 'bg-red-500/10 border border-red-500/20'
                            )}>
                                {ctrl.status === 'Online'
                                    ? <Wifi className="w-4 h-4 text-green-400" />
                                    : <WifiOff className="w-4 h-4 text-red-400" />
                                }
                            </div>
                            <div>
                                <div className="font-semibold text-white group-hover:text-ot-action transition-colors text-sm">
                                    {ctrl.name}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                    {ctrl.ip}:{ctrl.port}
                                </div>
                            </div>
                        </div>

                        {/* Right — status + arrow */}
                        <div className="flex items-center gap-3 shrink-0">
                            <span className={cn(
                                'px-2.5 py-1 text-xs rounded-full border font-medium',
                                ctrl.status === 'Online'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                            )}>
                                {ctrl.status}
                            </span>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-ot-surface-top border border-ot-border group-hover:bg-ot-action group-hover:border-ot-action transition-all duration-200">
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition-colors duration-200" />
                            </div>
                        </div>

                        {/* Subtle active glow strip */}
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-ot-action opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </button>
                ))}
            </div>

            {controllersData.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-ot-surface-elev-bottom border border-ot-border flex items-center justify-center">
                        <LayoutGrid className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        No controllers found. Add controllers first.
                    </div>
                </div>
            )}
        </div>
    );
}
