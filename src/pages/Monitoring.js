import React, { useState, useCallback, lazy, Suspense, useMemo } from 'react';
import { Card, CardContent } from 'components/ui/card';
import Cupboard2D from 'components/visualization/Cupboard2D';
import { Layers, Box, MonitorPlay, ChevronRight, PanelRightClose, PanelRightOpen, LayoutGrid, List } from 'lucide-react';
import { cn } from 'lib/utils';
import { CONTROLLERS_CONFIG, WALLS_CONFIG, CUPBOARDS_CONFIG, getCupboardAssignments } from 'lib/dataStore';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from 'components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Button } from 'components/ui/button';

// Cupboard3D is lazy-loaded — Three.js (~600 KB) is only fetched when user
// clicks "3D View", keeping the initial bundle small and TBT low.
const Cupboard3D = lazy(() => import('components/visualization/Cupboard3D'));

// Shown inside the canvas area while Three.js chunk is being fetched
function Canvas3DLoader() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <span className="w-8 h-8 border-2 border-ot-border border-t-ot-action rounded-full animate-spin" />
            <span className="text-sm">Loading 3D scene…</span>
        </div>
    );
}

export default function Monitoring() {
    const [viewMode, setViewMode] = useState('2d'); // '2d' | '3d'
    const [layoutMode, setLayoutMode] = useState('horizontal'); // 'horizontal' | 'vertical'
    const [controlsVisible, setControlsVisible] = useState(true);
    const [activeCupboardIdx, setActiveCupboardIdx] = useState(0);

    const hierarchy = useMemo(() => {
        const controllersMap = new Map();
        CONTROLLERS_CONFIG.forEach((controller) => {
            const controllerCopy = { ...controller, walls: new Map() };
            controllersMap.set(controller.name, controllerCopy);
        });

        const unassignedController = { id: 'unassigned-controller', name: 'Unassigned Controller', walls: new Map() };

        WALLS_CONFIG.forEach((wall) => {
            const ctrlName = wall.controller || 'Unassigned Controller';
            let controllerEntry = controllersMap.get(ctrlName);

            if (!controllerEntry) {
                controllerEntry = unassignedController;
                controllersMap.set(unassignedController.name, unassignedController);
            }

            if (!controllerEntry.walls.has(wall.name)) {
                controllerEntry.walls.set(wall.name, { id: `wall-${wall.name}`, name: wall.name, cupboards: [] });
            }
        });

        CUPBOARDS_CONFIG.forEach((cupboard) => {
            const ctrlName = cupboard.controller || 'Unassigned Controller';
            let controllerEntry = controllersMap.get(ctrlName);

            if (!controllerEntry) {
                controllerEntry = unassignedController;
                controllersMap.set(unassignedController.name, unassignedController);
            }

            const wallName = cupboard.wall || 'Unassigned Wall';
            if (!controllerEntry.walls.has(wallName)) {
                controllerEntry.walls.set(wallName, { id: `wall-${wallName}`, name: wallName, cupboards: [] });
            }

            const wallEntry = controllerEntry.walls.get(wallName);

            // Add shelves
            const shelfCount = cupboard.shelves || cupboard.rows || 5;
            const shelves = Array.from({ length: shelfCount }, (_, i) => ({
                id: `${cupboard.id}-shelf-${i + 1}`,
                name: `Shelf ${i + 1}`,
                shelfNumber: i + 1,
                cupboardId: cupboard.id
            }));

            wallEntry.cupboards.push({ ...cupboard, shelvesList: shelves });
        });

        // Convert maps to arrays
        const orderedControllers = Array.from(controllersMap.values()).map(ctrl => {
            return {
                ...ctrl,
                walls: Array.from(ctrl.walls.values()),
                // keep flat cupboards array for compatibility with activeCupboardIdx
                cupboards: Array.from(ctrl.walls.values()).flatMap(w => w.cupboards)
            };
        }).sort((a, b) => a.name.localeCompare(b.name));

        return orderedControllers;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        JSON.stringify(CONTROLLERS_CONFIG.map(c => ({id: c.id, name: c.name}))),
        JSON.stringify(CUPBOARDS_CONFIG.map(c => ({id: c.id, shelves: c.shelves, columns: c.columns, wall: c.wall, leds: c.ledsPerDrawer})))
    ]);

    const firstController = hierarchy[0] || null;
    const [selectedControllerName, setSelectedControllerName] = useState(firstController?.name || '');
    const firstWallName = firstController?.walls?.[0]?.name || '';
    const [selectedWallName, setSelectedWallName] = useState(firstWallName);

    const [expandedControllers, setExpandedControllers] = useState(() => {
        return firstController?.name ? new Set([firstController.name]) : new Set();
    });
    const [expandedWalls, setExpandedWalls] = useState(() => {
        return firstWallName ? new Set([firstWallName]) : new Set();
    });

    const selectedController =
        hierarchy.find((controller) => controller.name === selectedControllerName) ||
        firstController ||
        { name: 'None', cupboards: [], walls: [] };

    const selectedWall = selectedController.walls?.find(w => w.name === selectedWallName) || selectedController.walls?.[0] || { cupboards: [] };

    const cupboards = selectedWall.cupboards || [];
    const totalCupboards = cupboards.length;
    const selectedCupboard = cupboards[activeCupboardIdx] || null;

    const eanCountFor = useCallback((cbId) => getCupboardAssignments(cbId).length, []);

    const handleToggleController = (controllerName, isOpen) => {
        setSelectedControllerName(controllerName);

        // Find first wall of this controller to select it
        const ctrl = hierarchy.find(c => c.name === controllerName);
        const fwName = ctrl?.walls?.[0]?.name || '';
        setSelectedWallName(fwName);
        setActiveCupboardIdx(0);

        setExpandedControllers((prev) => {
            const next = new Set(prev);
            if (isOpen) {
                next.add(controllerName);
            } else {
                next.delete(controllerName);
            }
            return next;
        });
    };

    const handleToggleWall = (wallName, isOpen) => {
        setSelectedWallName(wallName);
        setActiveCupboardIdx(0);
        setExpandedWalls((prev) => {
            const next = new Set(prev);
            if (isOpen) {
                next.add(wallName);
            } else {
                next.delete(wallName);
            }
            return next;
        });
    };

    const handleSelectCupboard = (index) => {
        setActiveCupboardIdx(index);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in">
            {/* ── Top bar ────────────────────────────────────────────────── */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Real-Time Monitoring</h2>
                    <p className="text-muted-foreground mt-1">
                        Live visualization of all physical cupboards and pick states.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Layout toggle */}
                    {viewMode === '2d' && (
                        <Tabs value={layoutMode} onValueChange={setLayoutMode}>
                            <TabsList>
                                <TabsTrigger value="horizontal" className="gap-2" title="Horizontal Scroll (List)">
                                    <LayoutGrid className="w-4 h-4" /> Horizontal
                                </TabsTrigger>
                                <TabsTrigger value="vertical" className="gap-2" title="Vertical Scroll (List)">
                                    <List className="w-4 h-4" /> Vertical
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}

                    {/* View toggle */}
                    <Tabs value={viewMode} onValueChange={setViewMode}>
                        <TabsList>
                            <TabsTrigger value="2d" className="gap-2">
                                <Layers className="w-4 h-4" /> 2D Grid
                            </TabsTrigger>
                            <TabsTrigger value="3d" className="gap-2">
                                <Box className="w-4 h-4" /> 3D View
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button
                        variant="ghost"
                        onClick={() => setControlsVisible((visible) => !visible)}
                        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-ot-surface-top border border-ot-border text-muted-foreground hover:text-white transition-colors h-auto"
                        title={controlsVisible ? "Hide navigation" : "Show navigation"}
                    >
                        {controlsVisible ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                        {controlsVisible ? 'Hide Navigation' : 'Show Navigation'}
                    </Button>
                </div>
            </div>

            {/* ── Main content ───────────────────────────────────────────── */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Canvas */}
                <Card className="flex-1 overflow-hidden bg-ot-surface-bottom relative p-0 flex flex-col border-ot-border">
                    {viewMode === '3d' ? (
                        <Suspense fallback={<Canvas3DLoader />}>
                            <Cupboard3D
                                cupboards={cupboards}
                                controllerName={selectedController.name}
                                selectedCupboard={selectedCupboard}
                                activeCupboardIdx={activeCupboardIdx}
                                onSelectCupboard={setActiveCupboardIdx}
                            />
                        </Suspense>
                    ) : (
                        cupboards.length > 0 ? (
                            <Cupboard2D
                                cupboards={cupboards}
                                controllerName={selectedController.name}
                                selectedCupboard={selectedCupboard}
                                activeCupboardIdx={activeCupboardIdx}
                                onSelectCupboard={setActiveCupboardIdx}
                                layoutMode={layoutMode}
                                key={selectedController.name}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No cupboards assigned to this controller.
                            </div>
                        )
                    )}
                </Card>

                {/* Hierarchy Sidebar */}
                <Card className={cn(
                    "flex-shrink-0 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
                    controlsVisible ? "w-80 opacity-100" : "w-0 opacity-0 border-transparent pointer-events-none"
                )}>
                    <div className={cn(
                        "h-[57px] border-b border-ot-border bg-ot-surface-elev-top font-semibold text-white flex items-center px-4 transition-all duration-300",
                        controlsVisible ? "opacity-100" : "opacity-0"
                    )}>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <MonitorPlay className="w-4 h-4 text-ot-action shrink-0" />
                            <span>Hierarchy Navigator</span>
                        </div>
                    </div>
                    <CardContent className={cn(
                        "p-0 overflow-auto transition-all duration-300",
                        controlsVisible ? "flex-1 opacity-100" : "h-0 opacity-0 pointer-events-none"
                    )}>
                        <div className="divide-y divide-ot-border">
                            {hierarchy.length > 0 ? (
                                hierarchy.map((controller) => {
                                    const isSelectedController = selectedController.name === controller.name;
                                    const isControllerExpanded = expandedControllers.has(controller.name);
                                    return (
                                        <Collapsible
                                            key={controller.name}
                                            open={isControllerExpanded}
                                            onOpenChange={(isOpen) => handleToggleController(controller.name, isOpen)}
                                            className="border-b border-ot-border"
                                        >
                                            <CollapsibleTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className={cn(
                                                        "w-full h-auto px-4 py-4 text-left flex items-center justify-between gap-3 transition-colors rounded-none",
                                                        isControllerExpanded ? 'bg-ot-surface-bottom/70 hover:bg-ot-surface-bottom/70' : 'hover:bg-ot-surface-bottom/80',
                                                        isSelectedController ? 'bg-ot-action/10 border-l-2 border-l-ot-action text-ot-action hover:bg-ot-action/15 hover:text-ot-action' : ''
                                                    )}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className={cn(
                                                            'font-medium text-sm truncate text-left',
                                                            isSelectedController ? 'text-ot-action' : 'text-white'
                                                        )}>{controller.name}</div>
                                                        <p className="text-xs text-muted-foreground mt-1 truncate text-left font-normal">{controller.cupboards.length} cupboards</p>
                                                    </div>
                                                    <ChevronRight className={cn(
                                                        'w-4 h-4 transition-transform shrink-0',
                                                        isControllerExpanded && 'rotate-90 text-ot-action',
                                                        !isControllerExpanded && !isSelectedController && 'text-muted-foreground'
                                                    )} />
                                                </Button>
                                            </CollapsibleTrigger>

                                            <CollapsibleContent>
                                                {controller.walls.length > 0 && (
                                                    <div className="mt-2 mb-2 space-y-2 pl-4 pr-3">
                                                        {controller.walls.map(wall => {
                                                            const isWallExpanded = expandedWalls.has(wall.name);
                                                            const isSelectedWall = controller.name === selectedControllerName && wall.name === selectedWallName;
                                                            return (
                                                                <Collapsible
                                                                    key={wall.id}
                                                                    open={isWallExpanded}
                                                                    onOpenChange={(isOpen) => handleToggleWall(wall.name, isOpen)}
                                                                    className="space-y-1"
                                                                >
                                                                    <CollapsibleTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            className={cn(
                                                                                "w-full h-auto flex items-center justify-between text-xs font-semibold px-3 py-1.5 rounded-md transition-colors",
                                                                                isSelectedWall
                                                                                    ? 'bg-ot-action/20 text-ot-action hover:bg-ot-action/25 hover:text-ot-action'
                                                                                    : 'bg-ot-surface-top/50 text-white/70 hover:bg-ot-surface-top hover:text-white'
                                                                            )}
                                                                        >
                                                                            <span className="truncate flex-1 text-left">{wall.name}</span>
                                                                            <ChevronRight className={cn('w-3 h-3 transition-transform shrink-0', isWallExpanded ? (isSelectedWall ? 'rotate-90 text-ot-action' : 'rotate-90 text-white') : 'text-muted-foreground')} />
                                                                        </Button>
                                                                    </CollapsibleTrigger>
                                                                    <CollapsibleContent>
                                                                        <div className="space-y-1 pl-2 border-l border-ot-border/50">
                                                                            {wall.cupboards.map((cupboard, cbIdxInWall) => {
                                                                                const isActiveCupboard = controller.name === selectedControllerName && wall.name === selectedWallName && cbIdxInWall === activeCupboardIdx;
                                                                                const eanCount = eanCountFor(cupboard.id);
                                                                                return (
                                                                                    <div key={cupboard.id} className="space-y-1">
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            onClick={() => {
                                                                                                if (controller.name !== selectedControllerName) {
                                                                                                    handleToggleController(controller.name, true);
                                                                                                }
                                                                                                if (wall.name !== selectedWallName) {
                                                                                                    handleToggleWall(wall.name, true);
                                                                                                }
                                                                                                handleSelectCupboard(cbIdxInWall);
                                                                                            }}
                                                                                            className={cn(
                                                                                                "w-full h-auto px-3 py-2 rounded-md text-xs flex items-center justify-between transition-all",
                                                                                                isActiveCupboard
                                                                                                    ? 'bg-ot-action/15 border border-ot-action/50 text-ot-action hover:bg-ot-action/20 hover:text-ot-action'
                                                                                                    : 'bg-ot-surface-bottom border border-ot-border text-muted-foreground hover:text-white hover:border-ot-action/30'
                                                                                            )}
                                                                                        >
                                                                                            <span className="truncate flex-1 text-left font-normal">{cupboard.name}</span>
                                                                                            <span className={cn(
                                                                                                'px-2 py-0.5 rounded text-[10px] font-mono shrink-0 font-medium',
                                                                                                eanCount > 0 ? 'bg-ot-action/20 text-ot-action' : 'bg-ot-surface-top text-muted-foreground'
                                                                                            )}>
                                                                                                {eanCount} EAN{eanCount !== 1 ? 's' : ''}
                                                                                            </span>
                                                                                        </Button>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </CollapsibleContent>
                                                                </Collapsible>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-4 text-sm text-muted-foreground">No controllers available.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
