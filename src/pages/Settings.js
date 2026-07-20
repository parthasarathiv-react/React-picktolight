import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Server, Box, LayoutGrid, Layers, Archive, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from 'lib/utils';
import { useOutletContext } from 'react-router-dom';
import { apiService } from 'lib/apiService';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import {
    CONTROLLERS_CONFIG,
    WALLS_CONFIG,
    CUPBOARDS_CONFIG
} from 'lib/dataStore';

import ControllersTab from 'components/settings/ControllersTab';
import WallsTab from 'components/settings/WallsTab';
import WallLayoutDesigner from 'components/settings/WallLayoutDesigner';
import CupboardsTab from 'components/settings/CupboardsTab';
import ShelvesTab from 'components/settings/ShelvesTab';
import BinsTab from 'components/settings/BinsTab';
import LedStripsTab from 'components/settings/LedStripsTab';

export default function Settings() {
    const { setSidebarOpen } = useOutletContext() || {};
    const [activeTab, setActiveTab] = useState('controllers');

    const [controllersData, setControllersData] = useState([]);
    const [wallsData, setWallsData] = useState([]);
    const [cupboardsData, setCupboardsData] = useState([...CUPBOARDS_CONFIG]);
    const locId = React.useMemo(() => {
        try {
            const selectedLocationStr = localStorage.getItem('selectedLocation');
            if (selectedLocationStr) {
                const loc = JSON.parse(selectedLocationStr);
                return loc.pick_location_id || '';
            }
        } catch (e) { }
        return '';
    }, []);

    const { data: fetchedControllers, isFetching: isFetchingControllers, error: errorControllers } = useQuery({
        queryKey: ['controllers', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getControllers(locId);
            if (!data.success || !data.data) throw new Error("Failed to fetch controllers");
            return data.data.map(c => ({
                id: c.ctl_id || c.id || Math.random().toString(36).substr(2, 9),
                name: c.ctl_name,
                ip: c.ctl_ip,
                port: c.ctl_port,
                status: (c.ctl_status === 'True' || c.ctl_status === true || c.ctl_status === 'Online') ? 'Online' : 'Offline'
            }));
        },
        enabled: !!locId,
    });

    const shouldFetchWalls = ['walls', 'cupboards', 'shelves', 'bins', 'leds'].includes(activeTab);
    const { data: rawWalls, isFetching: isFetchingWalls, error: errorWalls } = useQuery({
        queryKey: ['walls', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getWalls(locId);
            if (!data.success || !data.data) throw new Error("Failed to fetch walls");
            return data.data;
        },
        enabled: !!locId && shouldFetchWalls,
    });

    const shouldFetchCupboards = ['cupboards', 'shelves', 'bins', 'leds'].includes(activeTab);
    const { data: rawCupboards, isFetching: isFetchingCupboards, error: errorCupboards } = useQuery({
        queryKey: ['cupboards', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getCupboards(locId);
            if (!data.success || !data.data) throw new Error("Failed to fetch cupboards");
            return data.data;
        },
        enabled: !!locId && shouldFetchCupboards,
    });

    useEffect(() => {
        if (fetchedControllers) {
            syncControllers(fetchedControllers);
        }
    }, [fetchedControllers]);

    useEffect(() => {
        if (rawWalls && fetchedControllers) {
            const mapped = rawWalls.map(w => {
                const ctrl = fetchedControllers.find(c => String(c.id) === String(w.wall_ctl_id));
                return {
                    id: w.wall_id,
                    name: w.wall_name,
                    controller: ctrl ? ctrl.name : w.wall_ctl_id,
                    controller_id: w.wall_ctl_id,
                    status: (w.wall_status === 'True' || w.wall_status === true || w.wall_status === 'Active') ? 'Active' : 'Inactive',
                    gridX: parseInt(w.wall_gridx, 10) || 0,
                    gridY: parseInt(w.wall_gridy, 10) || 0,
                    orientation: w.wall_orientation || 'h',
                    cupboardsCount: 4
                };
            });
            syncWalls(mapped);
        }
    }, [rawWalls, fetchedControllers]);

    useEffect(() => {
        if (rawCupboards && rawWalls && fetchedControllers) {
            const mapped = rawCupboards.map(c => {
                const wall = rawWalls.find(w => String(w.wall_id) === String(c.cupboard_wall_id));
                const ctrl = fetchedControllers.find(ctrl => String(ctrl.id) === String(c.cupboard_ctl_id));
                return {
                    id: c.cupboard_id,
                    name: c.cupboard_name,
                    wall: wall ? wall.wall_name : c.cupboard_wall_id,
                    wall_id: c.cupboard_wall_id,
                    controller: ctrl ? ctrl.name : c.cupboard_ctl_id,
                    controller_id: c.cupboard_ctl_id,
                    status: (c.cupboard_status === 'True' || c.cupboard_status === true || c.cupboard_status === 'Active') ? 'Active' : 'Inactive',
                    layoutGridX: parseInt(c.cupboard_gridx, 10) || 0,
                    layoutGridY: parseInt(c.cupboard_gridy, 10) || 0,
                    orientation: c.cupboard_orientation || 'h',
                    shelves: 5,
                    rows: 5,
                    columns: 4,
                    ledsPerDrawer: 6
                };
            });
            
            try {
                const layouts = JSON.parse(localStorage.getItem('cupboardLayouts') || '{}');
                mapped.forEach(c => {
                    if (layouts[c.id]) {
                        c.shelves = layouts[c.id].shelves || c.shelves;
                        c.rows = layouts[c.id].rows || c.rows;
                        c.columns = layouts[c.id].columns || c.columns;
                        c.ledsPerDrawer = layouts[c.id].ledsPerDrawer || c.ledsPerDrawer;
                        c.shelfLayout = layouts[c.id].shelfLayout || c.shelfLayout;
                    }
                });
            } catch (e) { }

            syncCupboards(mapped);
        }
    }, [rawCupboards, rawWalls, fetchedControllers]);

    useEffect(() => {
        if (errorControllers) toast.error(`Failed to fetch controllers: ${errorControllers.message}`);
        if (errorWalls) toast.error(`Failed to fetch walls: ${errorWalls.message}`);
        if (errorCupboards) toast.error(`Failed to fetch cupboards: ${errorCupboards.message}`);
    }, [errorControllers, errorWalls, errorCupboards]);

    const isFetchingAny = isFetchingControllers || isFetchingWalls || isFetchingCupboards;

    // Wall layout designer: which controller was selected
    const [selectedController, setSelectedController] = useState(null);
    // Cupboard/Shelf layout designer: which wall was selected
    const [selectedWallForCupboards, setSelectedWallForCupboards] = useState(null);
    const [selectedCupboardForShelves, setSelectedCupboardForShelves] = useState(null);

    // ── Sync helpers ─────────────────────────────────────────────────────────
    const syncControllers = (newData) => {
        setControllersData(newData);
        CONTROLLERS_CONFIG.length = 0;
        newData.forEach(c => CONTROLLERS_CONFIG.push(c));
    };

    const syncWalls = (newData) => {
        setWallsData(newData);
        WALLS_CONFIG.length = 0;
        newData.forEach(w => WALLS_CONFIG.push(w));
    };

    const syncCupboards = (newData) => {
        setCupboardsData(newData);
        CUPBOARDS_CONFIG.length = 0;
        newData.forEach(c => {
            const shelvesCount = Number(c.shelves || c.rows || 5);
            CUPBOARDS_CONFIG.push({
                ...c,
                shelves: shelvesCount,
                rows: shelvesCount
            });
        });
    };

    const tabs = [
        { id: 'controllers', label: 'Controllers', icon: Server },
        { id: 'walls', label: 'Walls', icon: LayoutGrid },
        { id: 'cupboards', label: 'Cupboards', icon: Box },
        { id: 'shelves', label: 'Shelves', icon: Layers },
        { id: 'bins', label: 'Bins', icon: Archive },
        { id: 'leds', label: 'LED Strips', icon: Lightbulb },
    ];

    // ── Handle entering / exiting wall layout designer ────────────────────────
    const handleSelectController = (ctrl) => {
        setSelectedController(ctrl);
    };

    const handleBackFromDesigner = () => {
        setSelectedController(null);
    };

    const handleSelectWallForCupboards = (wall) => {
        setSelectedWallForCupboards(wall);
    }

    const handleSelectCupboardForShelves = (cupboard) => {
        setSelectedCupboardForShelves(cupboard);
    }

    // When walls tab + controller selected → full-width designer (no sidebar)
    const isWallDesignerMode = activeTab === 'walls' && selectedController !== null;
    const isCupboardDesignerMode = activeTab === 'cupboards' && selectedWallForCupboards !== null;
    const isShelfDesignerMode = activeTab === 'shelves' && selectedCupboardForShelves !== null;
    const isInDesignerMode = isWallDesignerMode || isCupboardDesignerMode || isShelfDesignerMode;

    // Close main nav sidebar when entering designer, restore on exit
    useEffect(() => {
        if (!setSidebarOpen) return;
        setSidebarOpen(!isInDesignerMode);
    }, [isInDesignerMode, setSidebarOpen]);

    return (
        <div className={cn('flex', isInDesignerMode ? 'h-[calc(100vh-5rem)]' : 'h-[calc(100vh-8rem)] gap-6')}>

            {/* ── Left nav sidebar — hidden in designer mode ──────────────── */}
            {!isInDesignerMode && (
                <Card className="w-64 flex-shrink-0 flex flex-col h-full overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Configuration</CardTitle>
                        <CardDescription>Manage hardware settings</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto">
                        <div className="flex flex-col space-y-1 p-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <Button
                                        key={tab.id}
                                        variant="ghost"
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setSelectedController(null);
                                            setSelectedWallForCupboards(null);
                                            setSelectedCupboardForShelves(null);
                                        }}
                                        className={cn(
                                            'flex items-center justify-start gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-all',
                                            activeTab === tab.id
                                                ? 'bg-ot-action text-white shadow-md hover:bg-ot-action hover:text-white'
                                                : 'text-muted-foreground hover:bg-ot-surface-elev-bottom hover:text-white'
                                        )}
                                    >
                                        <Icon className={cn('w-4 h-4', activeTab === tab.id ? 'text-white' : '')} />
                                        {tab.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Right content area ──────────────────────────────────────── */}
            <Card className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className={cn('flex-1 flex flex-col overflow-hidden', isInDesignerMode ? 'p-0' : 'p-6')}>

                    {isFetchingAny ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-ot-action" />
                            <div className="text-sm font-medium animate-pulse">Loading configuration data...</div>
                        </div>
                    ) : (
                        <>
                            {/* Controllers tab */}
                            {activeTab === 'controllers' && (
                        <ControllersTab
                            controllersData={controllersData}
                            syncControllers={syncControllers}
                        />
                    )}

                    {/* Walls tab — controller picker */}
                    {activeTab === 'walls' && !selectedController && (
                        <WallsTab
                            controllersData={controllersData}
                            onSelectController={handleSelectController}
                        />
                    )}

                    {/* Walls tab — full designer (no sidebar) */}
                    {isWallDesignerMode && (
                        <WallLayoutDesigner
                            controller={selectedController}
                            onBack={handleBackFromDesigner}
                            wallsData={wallsData}
                            syncWalls={syncWalls}
                        />
                    )}

                    {/* Cupboards tab */}
                    {activeTab === 'cupboards' && (
                        <CupboardsTab
                            cupboardsData={cupboardsData}
                            syncCupboards={syncCupboards}
                            controllersData={controllersData}
                            wallsData={wallsData}
                            selectedWall={selectedWallForCupboards}
                            onSelectWall={handleSelectWallForCupboards}
                        />
                    )}

                    {/* Shelves tab */}
                    {activeTab === 'shelves' && (
                        <ShelvesTab
                            cupboardsData={cupboardsData}
                            syncCupboards={syncCupboards}
                            selectedCupboard={selectedCupboardForShelves}
                            onSelectCupboard={handleSelectCupboardForShelves}
                            wallsData={wallsData}
                            controllersData={controllersData}
                        />
                    )}

                    {/* Bins tab */}
                    {activeTab === 'bins' && (
                        <BinsTab
                            cupboardsData={cupboardsData}
                            syncCupboards={syncCupboards}
                            wallsData={wallsData}
                            controllersData={controllersData}
                        />
                    )}

                    {/* LED Strips tab */}
                    {activeTab === 'leds' && (
                        <LedStripsTab
                            cupboardsData={cupboardsData}
                            syncCupboards={syncCupboards}
                            wallsData={wallsData}
                            controllersData={controllersData}
                        />
                    )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
