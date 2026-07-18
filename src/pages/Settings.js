import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Server, Box, LayoutGrid, Layers, Archive, Lightbulb } from 'lucide-react';
import { cn } from 'lib/utils';
import { useOutletContext } from 'react-router-dom';
import { apiService } from 'lib/apiService';
import { toast } from 'sonner';
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

    useEffect(() => {


        const fetchControllers = async () => {
            try {
                let locId = '';
                const selectedLocationStr = localStorage.getItem('selectedLocation');
                if (selectedLocationStr) {
                    try {
                        const loc = JSON.parse(selectedLocationStr);
                        locId = loc.pick_location_id || '';
                    } catch (e) { }
                }

                if (!locId) return;

                const data = await apiService.getControllers(locId);
                if (data.success && data.data) {
                    const mapped = data.data.map(c => ({
                        id: c.ctl_id || c.id || Math.random().toString(36).substr(2, 9),
                        name: c.ctl_name,
                        ip: c.ctl_ip,
                        port: c.ctl_port,
                        status: (c.ctl_status === 'True' || c.ctl_status === true || c.ctl_status === 'Online') ? 'Online' : 'Offline'
                    }));
                    syncControllers(mapped);
                }
            } catch (err) {
                console.error("Failed to fetch controllers", err);
                toast.error(`Failed to fetch controllers: ${err.message}`);
            }
        };

        fetchControllers();
    }, []);

    // Fetch walls when Walls tab is active
    useEffect(() => {
        if (activeTab !== 'walls' && activeTab !== 'cupboards') return; // Cupboards also needs wallsData

        const fetchWalls = async () => {
            try {
                let locId = '';
                const selectedLocationStr = localStorage.getItem('selectedLocation');
                if (selectedLocationStr) {
                    try {
                        const loc = JSON.parse(selectedLocationStr);
                        locId = loc.pick_location_id || '';
                    } catch (e) { }
                }

                if (!locId) return;

                const data = await apiService.getWalls(locId);
                if (data.success && data.data) {
                    const mapped = data.data.map(w => {
                        const ctrl = controllersData.find(c => c.id == w.wall_ctl_id);
                        return {
                            id: w.wall_id,
                            name: w.wall_name,
                            controller: ctrl ? ctrl.name : w.wall_ctl_id,
                            controller_id: w.wall_ctl_id,
                            status: (w.wall_status === 'True' || w.wall_status === true || w.wall_status === 'Active') ? 'Active' : 'Inactive',
                            gridX: parseInt(w.wall_gridx, 10) || 0,
                            gridY: parseInt(w.wall_gridy, 10) || 0,
                            orientation: w.wall_orientation || 'h',
                            cupboardsCount: 4 // default
                        };
                    });
                    syncWalls(mapped);
                }
            } catch (err) {
                console.error("Failed to fetch walls", err);
                toast.error(`Failed to fetch walls: ${err.message}`);
            }
        };

        fetchWalls();
    }, [activeTab, controllersData]);

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
                </div>
            </Card>
        </div>
    );
}
