import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Server, Box, Layers, LayoutGrid } from 'lucide-react';
import { cn } from 'lib/utils';
import {
    CONTROLLERS_CONFIG,
    FLOORS_CONFIG,
    WALLS_CONFIG,
    CUPBOARDS_CONFIG
} from 'lib/dataStore';

import FloorsTab from 'components/settings/FloorsTab';
import ControllersTab from 'components/settings/ControllersTab';
import WallsTab from 'components/settings/WallsTab';
import CupboardsTab from 'components/settings/CupboardsTab';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('floors');

    const [controllersData, setControllersData] = useState([...CONTROLLERS_CONFIG]);
    const [floorsData, setFloorsData] = useState([...FLOORS_CONFIG]);
    const [wallsData, setWallsData] = useState([...WALLS_CONFIG]);
    const [cupboardsData, setCupboardsData] = useState([...CUPBOARDS_CONFIG]);

    // Sync helpers to update dataStore in-place for active views
    const syncControllers = (newData) => {
        setControllersData(newData);
        CONTROLLERS_CONFIG.length = 0;
        newData.forEach(c => CONTROLLERS_CONFIG.push(c));
    };

    const syncFloors = (newData) => {
        setFloorsData(newData);
        FLOORS_CONFIG.length = 0;
        newData.forEach(f => FLOORS_CONFIG.push(f));
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
        { id: 'floors', label: 'Floors', icon: Layers },
        { id: 'controllers', label: 'Controllers', icon: Server },
        { id: 'walls', label: 'Walls', icon: LayoutGrid },
        { id: 'cupboards', label: 'Cupboards & Shelves', icon: Box },
    ];

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Settings Navigation */}
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
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                                        activeTab === tab.id
                                            ? "bg-ot-action text-white shadow-md"
                                            : "text-muted-foreground hover:bg-ot-surface-elev-bottom hover:text-white"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", activeTab === tab.id ? "text-white" : "")} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Settings Content Area */}
            <Card className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden p-6">
                    {activeTab === 'floors' && (
                        <FloorsTab floorsData={floorsData} syncFloors={syncFloors} />
                    )}
                    {activeTab === 'controllers' && (
                        <ControllersTab controllersData={controllersData} syncControllers={syncControllers} floorsData={floorsData} />
                    )}
                    {activeTab === 'walls' && (
                        <WallsTab wallsData={wallsData} syncWalls={syncWalls} floorsData={floorsData} controllersData={controllersData} />
                    )}
                    {activeTab === 'cupboards' && (
                        <CupboardsTab
                            cupboardsData={cupboardsData}
                            syncCupboards={syncCupboards}
                            floorsData={floorsData}
                            controllersData={controllersData}
                            wallsData={wallsData}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
}
