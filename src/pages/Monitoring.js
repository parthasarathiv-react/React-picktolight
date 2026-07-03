import React, { useState } from 'react';
import { Card, CardContent } from 'components/ui/card';
import Cupboard3D from 'components/visualization/Cupboard3D';
import Cupboard2D from 'components/visualization/Cupboard2D';
import { Layers, Box, MonitorPlay, ChevronRight, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { cn } from 'lib/utils';
import { FLOORS_CONFIG, CONTROLLERS_CONFIG, CUPBOARDS_CONFIG, getCupboardAssignments } from 'lib/dataStore';

export default function Monitoring() {
    const [viewMode, setViewMode] = useState('2d'); // '2d' | '3d'
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
            const controllerCopy = { ...controller, cupboards: [] };
            controllersMap.set(controller.name, controllerCopy);
            floorsMap.get(floorName).controllers.push(controllerCopy);
        });

        const unassignedController = { id: 'unassigned-controller', name: 'Unassigned Controller', floor: 'Unassigned Floor', cupboards: [] };
        CUPBOARDS_CONFIG.forEach((cupboard) => {
            const ctrlName = cupboard.controller || 'Unassigned Controller';
            const controllerEntry = controllersMap.get(ctrlName) || unassignedController;
            if (controllerEntry === unassignedController && !floorsMap.has(controllerEntry.floor)) {
                floorsMap.set(controllerEntry.floor, { id: `floor-${controllerEntry.floor}`, name: controllerEntry.floor, controllers: [controllerEntry] });
            }
            if (!controllerEntry.cupboards) controllerEntry.cupboards = [];
            controllerEntry.cupboards.push(cupboard);
        });

        const orderedFloors = Array.from(floorsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        return orderedFloors;
    }, [FLOORS_CONFIG.length, CONTROLLERS_CONFIG.length, CUPBOARDS_CONFIG.length]);

    const firstController = hierarchy.flatMap((floor) => floor.controllers).find((ctrl) => ctrl) || null;
    const [selectedControllerName, setSelectedControllerName] = useState(firstController?.name || '');
    const [expandedFloors, setExpandedFloors] = useState(() => {
        return hierarchy[0]?.name ? new Set([hierarchy[0].name]) : new Set();
    });
    const [expandedControllers, setExpandedControllers] = useState(() => {
        return firstController?.name ? new Set([firstController.name]) : new Set();
    });

    const selectedController =
        hierarchy
            .flatMap((floor) => floor.controllers)
            .find((controller) => controller.name === selectedControllerName) ||
        firstController ||
        { name: 'None', cupboards: [] };

    const cupboards = selectedController.cupboards || [];
    const totalCupboards = cupboards.length;
    const selectedFloorName = selectedController.floor || 'No floor';
    const selectedCupboard = cupboards[activeCupboardIdx] || null;

    const eanCountFor = (cbId) => getCupboardAssignments(cbId).length;

    const handleToggleFloor = (floorName) => {
        setExpandedFloors((prev) => {
            const next = new Set(prev);
            next.has(floorName) ? next.delete(floorName) : next.add(floorName);
            return next;
        });
    };

    const handleToggleController = (controllerName) => {
        setSelectedControllerName(controllerName);
        setActiveCupboardIdx(0);
        setExpandedControllers((prev) => {
            const next = new Set(prev);
            next.has(controllerName) ? next.delete(controllerName) : next.add(controllerName);
            return next;
        });

        const floorOfController = hierarchy.find((floor) => floor.controllers.some((ctrl) => ctrl.name === controllerName));
        if (floorOfController) {
            setExpandedFloors((prev) => new Set(prev).add(floorOfController.name));
        }
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
                    {/* View toggle */}
                    <div className="flex bg-ot-surface-top rounded-lg border border-ot-border p-1">
                        <button
                            onClick={() => setViewMode('2d')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all",
                                viewMode === '2d' ? "bg-ot-action text-white shadow-md" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <Layers className="w-4 h-4" /> 2D Grid
                        </button>
                        <button
                            onClick={() => setViewMode('3d')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all",
                                viewMode === '3d' ? "bg-ot-action text-white shadow-md" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <Box className="w-4 h-4" /> 3D View
                        </button>
                    </div>

                    <button
                        onClick={() => setControlsVisible((visible) => !visible)}
                        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-ot-surface-top border border-ot-border text-muted-foreground hover:text-white transition-colors"
                        title={controlsVisible ? "Hide navigation" : "Show navigation"}
                    >
                        {controlsVisible ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                        {controlsVisible ? 'Hide Navigation' : 'Show Navigation'}
                    </button>
                </div>
            </div>

            {/* ── Main content ───────────────────────────────────────────── */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Canvas */}
                <div className="flex-1 rounded-lg border border-ot-border overflow-hidden bg-ot-surface-bottom relative">
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
                                key={selectedController.name}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No cupboards assigned to this controller.
                            </div>
                        )
                    )}
                </div>

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
                                    <div key={floor.name} className="border-b border-ot-border">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleFloor(floor.name)}
                                            className={cn(
                                                "w-full px-4 py-4 text-left flex items-center justify-between gap-3 transition-colors",
                                                isFloorExpanded ? 'bg-ot-surface-bottom/70' : 'hover:bg-ot-surface-bottom/80'
                                            )}
                                        >
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm text-white truncate">{floor.name}</div>
                                                <p className="text-xs text-muted-foreground mt-1 truncate">{floor.controllers.length} controllers</p>
                                            </div>
                                            <ChevronRight className={cn(
                                                'w-4 h-4 text-muted-foreground transition-transform',
                                                isFloorExpanded && 'rotate-90 text-ot-action'
                                            )} />
                                        </button>

                                        {isFloorExpanded && (
                                            <div className="space-y-1 border-l border-ot-border pl-4 pb-3">
                                                {floor.controllers.length > 0 ? (
                                                    floor.controllers.map((controller) => {
                                                        const isSelectedController = selectedController.name === controller.name;
                                                        const isControllerExpanded = expandedControllers.has(controller.name);
                                                        return (
                                                            <div key={controller.name}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleController(controller.name)}
                                                                    className={cn(
                                                                        "w-full px-3 py-3 text-left rounded-md flex items-center justify-between gap-3 transition-all",
                                                                        isSelectedController
                                                                            ? 'bg-ot-action/10 border border-ot-action/40 text-ot-action'
                                                                            : 'bg-ot-surface-top border border-transparent hover:border-ot-action/30 hover:text-white'
                                                                    )}
                                                                >
                                                                    <div className="min-w-0">
                                                                        <div className={cn(
                                                                            'font-medium text-sm truncate',
                                                                            isSelectedController ? 'text-ot-action' : 'text-white'
                                                                        )}>{controller.name}</div>
                                                                        <p className="text-[11px] text-muted-foreground mt-1 truncate">{controller.cupboards.length} cupboards</p>
                                                                    </div>
                                                                    <ChevronRight className={cn(
                                                                        'w-4 h-4 transition-transform',
                                                                        isControllerExpanded && 'rotate-90 text-ot-action'
                                                                    )} />
                                                                </button>

                                                                {isControllerExpanded && controller.cupboards.length > 0 && (
                                                                    <div className="mt-2 space-y-1 border-l border-ot-border pl-3">
                                                                        {controller.cupboards.map((cupboard, index) => {
                                                                            const isActiveCupboard = controller.name === selectedController.name && index === activeCupboardIdx;
                                                                            const eanCount = eanCountFor(cupboard.id);
                                                                            return (
                                                                                <button
                                                                                    key={cupboard.id}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        if (controller.name !== selectedController.name) {
                                                                                            handleToggleController(controller.name);
                                                                                        }
                                                                                        handleSelectCupboard(index);
                                                                                    }}
                                                                                    className={cn(
                                                                                        "w-full px-3 py-2 rounded-md text-xs flex items-center justify-between transition-all",
                                                                                        isActiveCupboard
                                                                                            ? 'bg-ot-action/15 border border-ot-action/50 text-ot-action'
                                                                                            : 'bg-ot-surface-bottom border border-ot-border text-muted-foreground hover:text-white hover:border-ot-action/30'
                                                                                    )}
                                                                                >
                                                                                    <span className="truncate">{cupboard.name}</span>
                                                                                    <span className={cn(
                                                                                        'px-2 py-0.5 rounded text-[10px] font-mono',
                                                                                        eanCount > 0 ? 'bg-ot-action/20 text-ot-action' : 'bg-ot-surface-top text-muted-foreground'
                                                                                    )}>
                                                                                        {eanCount} EAN{eanCount !== 1 ? 's' : ''}
                                                                                    </span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="px-3 py-2 text-xs text-muted-foreground">No controllers available.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
