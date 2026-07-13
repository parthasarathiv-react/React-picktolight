import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Server, Box, LayoutGrid } from 'lucide-react';
import { cn } from 'lib/utils';
import { useOutletContext } from 'react-router-dom';
import {
    CONTROLLERS_CONFIG,
    WALLS_CONFIG,
    CUPBOARDS_CONFIG
} from 'lib/dataStore';

import ControllersTab from 'components/settings/ControllersTab';
import WallsTab from 'components/settings/WallsTab';
import WallLayoutDesigner from 'components/settings/WallLayoutDesigner';
import CupboardsTab from 'components/settings/CupboardsTab';

export default function Settings() {
    const { setSidebarOpen } = useOutletContext() || {};
    const [activeTab, setActiveTab] = useState('controllers');

    const [controllersData, setControllersData] = useState([...CONTROLLERS_CONFIG]);
    const [wallsData, setWallsData] = useState([...WALLS_CONFIG]);
    const [cupboardsData, setCupboardsData] = useState([...CUPBOARDS_CONFIG]);

    // Wall layout designer: which controller was selected
    const [selectedController, setSelectedController] = useState(null);

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
        { id: 'cupboards', label: 'Cupboards & Shelves', icon: Box },
    ];

    // ── Handle entering / exiting wall layout designer ────────────────────────
    const handleSelectController = (ctrl) => {
        setSelectedController(ctrl);
    };

    const handleBackFromDesigner = () => {
        setSelectedController(null);
    };

    // When walls tab + controller selected → full-width designer (no sidebar)
    const isInDesignerMode = activeTab === 'walls' && selectedController !== null;

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
                    {isInDesignerMode && (
                        <WallLayoutDesigner
                            controller={selectedController}
                            onBack={handleBackFromDesigner}
                        />
                    )}

                    {/* Cupboards tab */}
                    {activeTab === 'cupboards' && (
                        <CupboardsTab
                            cupboardsData={cupboardsData}
                            syncCupboards={syncCupboards}
                            controllersData={controllersData}
                            wallsData={wallsData}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
}
