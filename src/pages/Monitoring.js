import React, { useState } from 'react';
import { Card, CardContent } from 'components/ui/card';
import Cupboard3D from 'components/visualization/Cupboard3D';
import Cupboard2D from 'components/visualization/Cupboard2D';
import { Layers, Box, MonitorPlay, ChevronRight, PanelRightClose, PanelRightOpen, MoveHorizontal, MoveVertical, LayoutGrid, List } from 'lucide-react';
import { cn } from 'lib/utils';
import { FLOORS_CONFIG, CONTROLLERS_CONFIG, WALLS_CONFIG, CUPBOARDS_CONFIG, getCupboardAssignments } from 'lib/dataStore';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from 'components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Button } from 'components/ui/button';

export default function Monitoring() {
    const [viewMode, setViewMode] = useState('2d'); // '2d' | '3d'
    const [layoutMode, setLayoutMode] = useState('horizontal'); // 'horizontal' | 'vertical'
    const [controlsVisible, setControlsVisible] = useState(true);
    const [activeCupboardIdx, setActiveCupboardIdx] = useState(0);

    const hierarchy = React.useMemo(() => {
        const floorsMap = new Map();
        FLOORS_CONFIG.forEach((floor) => {
            floorsMap.set(floor.name, { ...floor, controllers: [] });
        });

        const controllersMap = new Map();
        CONTROLLERS_CONFIG.forEach((controller) => {
            const floorName = controller.floor || 'Unassigned Floor';
            if (!floorsMap.has(floorName)) {
                floorsMap.set(floorName, { id: `floor-${floorName}`, name: floorName, controllers: [] });
            }
            const controllerCopy = { ...controller, walls: new Map() };
            controllersMap.set(controller.name, controllerCopy);
            floorsMap.get(floorName).controllers.push(controllerCopy);
        });

        const unassignedController = { id: 'unassigned-controller', name: 'Unassigned Controller', floor: 'Unassigned Floor', walls: new Map() };

        WALLS_CONFIG.forEach((wall) => {
            const ctrlName = wall.controller || 'Unassigned Controller';
            let controllerEntry = controllersMap.get(ctrlName);

            if (!controllerEntry) {
                controllerEntry = unassignedController;
                if (!floorsMap.has(controllerEntry.floor)) {
                    floorsMap.set(controllerEntry.floor, { id: `floor-${controllerEntry.floor}`, name: controllerEntry.floor, controllers: [controllerEntry] });
                } else if (!floorsMap.get(controllerEntry.floor).controllers.includes(controllerEntry)) {
                    floorsMap.get(controllerEntry.floor).controllers.push(controllerEntry);
                }
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
                if (!floorsMap.has(controllerEntry.floor)) {
                    floorsMap.set(controllerEntry.floor, { id: `floor-${controllerEntry.floor}`, name: controllerEntry.floor, controllers: [controllerEntry] });
                } else if (!floorsMap.get(controllerEntry.floor).controllers.includes(controllerEntry)) {
                    floorsMap.get(controllerEntry.floor).controllers.push(controllerEntry);
                }
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
        const orderedFloors = Array.from(floorsMap.values()).map(floor => {
            return {
                ...floor,
                controllers: floor.controllers.map(ctrl => ({
                    ...ctrl,
                    walls: Array.from(ctrl.walls.values()),
                    // keep flat cupboards array for compatibility with activeCupboardIdx
                    cupboards: Array.from(ctrl.walls.values()).flatMap(w => w.cupboards)
                }))
            };
        }).sort((a, b) => a.name.localeCompare(b.name));

        return orderedFloors;
    }, [FLOORS_CONFIG.length, CONTROLLERS_CONFIG.length, CUPBOARDS_CONFIG.length]);

    const firstController = hierarchy.flatMap((floor) => floor.controllers).find((ctrl) => ctrl) || null;
    const [selectedControllerName, setSelectedControllerName] = useState(firstController?.name || '');
    const firstWallName = firstController?.walls?.[0]?.name || '';
    const [selectedWallName, setSelectedWallName] = useState(firstWallName);

    const [expandedFloors, setExpandedFloors] = useState(() => {
        return hierarchy[0]?.name ? new Set([hierarchy[0].name]) : new Set();
    });
    const [expandedControllers, setExpandedControllers] = useState(() => {
        return firstController?.name ? new Set([firstController.name]) : new Set();
    });
    const [expandedWalls, setExpandedWalls] = useState(() => {
        return firstWallName ? new Set([firstWallName]) : new Set();
    });

    const selectedController =
        hierarchy
            .flatMap((floor) => floor.controllers)
            .find((controller) => controller.name === selectedControllerName) ||
        firstController ||
        { name: 'None', cupboards: [], walls: [] };

    const selectedWall = selectedController.walls?.find(w => w.name === selectedWallName) || selectedController.walls?.[0] || { cupboards: [] };

    const cupboards = selectedWall.cupboards || [];
    const totalCupboards = cupboards.length;
    const selectedFloorName = selectedController.floor || 'No floor';
    const selectedCupboard = cupboards[activeCupboardIdx] || null;

    const eanCountFor = (cbId) => getCupboardAssignments(cbId).length;

    const handleToggleFloor = (floorName, isOpen) => {
        setExpandedFloors((prev) => {
            const next = new Set(prev);
            if (isOpen) {
                next.add(floorName);
            } else {
                next.delete(floorName);
            }
            return next;
        });
    };

    const handleToggleController = (controllerName, isOpen) => {
        setSelectedControllerName(controllerName);

        // Find first wall of this controller to select it
        const ctrl = hierarchy.flatMap(f => f.controllers).find(c => c.name === controllerName);
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

        if (isOpen) {
            const floorOfController = hierarchy.find((floor) => floor.controllers.some((ctrl) => ctrl.name === controllerName));
            if (floorOfController) {
                setExpandedFloors((prev) => new Set(prev).add(floorOfController.name));
            }
        }
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
                        <Cupboard3D
                            cupboards={cupboards}
                            controllerName={selectedController.name}
                            floorName={selectedFloorName}
                            selectedCupboard={selectedCupboard}
                            activeCupboardIdx={activeCupboardIdx}
                            onSelectCupboard={setActiveCupboardIdx}
                        />
                    ) : (
                        cupboards.length > 0 ? (
                            <Cupboard2D
                                cupboards={cupboards}
                                controllerName={selectedController.name}
                                floorName={selectedFloorName}
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
                            <span>Floor Navigator</span>
                        </div>
                    </div>
                    <CardContent className={cn(
                        "p-0 overflow-auto transition-all duration-300",
                        controlsVisible ? "flex-1 opacity-100" : "h-0 opacity-0 pointer-events-none"
                    )}>
                        <div className="divide-y divide-ot-border">
                            {hierarchy.map((floor) => {
                                const isFloorExpanded = expandedFloors.has(floor.name);
                                return (
                                    <Collapsible
                                        key={floor.name}
                                        open={isFloorExpanded}
                                        onOpenChange={(isOpen) => handleToggleFloor(floor.name, isOpen)}
                                        className="border-b border-ot-border"
                                    >
                                        <CollapsibleTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full h-auto px-4 py-4 text-left flex items-center justify-between gap-3 transition-colors rounded-none",
                                                    isFloorExpanded ? 'bg-ot-surface-bottom/70 hover:bg-ot-surface-bottom/70' : 'hover:bg-ot-surface-bottom/80'
                                                )}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-sm text-white truncate text-left">{floor.name}</div>
                                                    <p className="text-xs text-muted-foreground mt-1 truncate text-left font-normal">{floor.controllers.length} controllers</p>
                                                </div>
                                                <ChevronRight className={cn(
                                                    'w-4 h-4 text-muted-foreground transition-transform',
                                                    isFloorExpanded && 'rotate-90 text-ot-action'
                                                )} />
                                            </Button>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent>
                                            <div className="space-y-1 border-l border-ot-border pl-4 pb-3">
                                                {floor.controllers.length > 0 ? (
                                                    floor.controllers.map((controller) => {
                                                        const isSelectedController = selectedController.name === controller.name;
                                                        const isControllerExpanded = expandedControllers.has(controller.name);
                                                        return (
                                                            <Collapsible
                                                                key={controller.name}
                                                                open={isControllerExpanded}
                                                                onOpenChange={(isOpen) => handleToggleController(controller.name, isOpen)}
                                                            >
                                                                <CollapsibleTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        className={cn(
                                                                            "w-full h-auto px-3 py-3 text-left rounded-md flex items-center justify-between gap-3 transition-all",
                                                                            isSelectedController
                                                                                ? 'bg-ot-action/10 border border-ot-action/40 text-ot-action hover:bg-ot-action/15 hover:text-ot-action'
                                                                                : 'bg-ot-surface-top border border-transparent hover:border-ot-action/30 hover:text-white'
                                                                        )}
                                                                    >
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className={cn(
                                                                                'font-medium text-sm truncate text-left',
                                                                                isSelectedController ? 'text-ot-action' : 'text-white'
                                                                            )}>{controller.name}</div>
                                                                            <p className="text-[11px] text-muted-foreground mt-1 truncate text-left font-normal">{controller.cupboards.length} cupboards</p>
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
                                                                        <div className="mt-2 space-y-2 border-l border-ot-border pl-3">
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
                                                    <div className="px-3 py-2 text-xs text-muted-foreground">No controllers available.</div>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
