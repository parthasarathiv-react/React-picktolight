import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Server, Box, Layers, Settings2, Plus, PenSquare, Trash2, SlidersHorizontal, LayoutGrid, Check, X } from 'lucide-react';
import { cn } from 'lib/utils';
import {
    CONTROLLERS_CONFIG,
    FLOORS_CONFIG,
    WALLS_CONFIG,
    CUPBOARDS_CONFIG
} from 'lib/dataStore';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('floors');

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

    // Controller state & handlers
    const [showControllerForm, setShowControllerForm] = useState(false);
    const [editingController, setEditingController] = useState(null);
    const [controllersData, setControllersData] = useState([...CONTROLLERS_CONFIG]);

    const handleAddController = () => {
        setEditingController(null);
        setShowControllerForm(true);
    };

    const handleEditController = (ctrl) => {
        setEditingController(ctrl);
        setShowControllerForm(true);
    };

    const handleCancelForm = () => {
        setShowControllerForm(false);
        setEditingController(null);
    };

    const handleControllerSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = data.get('name');
        const ip = data.get('ip');
        const port = data.get('port');
        const floor = data.get('floor');
        const status = data.get('status') === 'ACTIVE' ? 'Online' : 'Offline';

        if (editingController) {
            const updated = controllersData.map(c =>
                c.id === editingController.id ? { ...c, name, ip, port, floor, status } : c
            );
            syncControllers(updated);
        } else {
            const newCtrl = {
                id: Date.now(),
                name,
                ip,
                port,
                floor,
                status
            };
            syncControllers([...controllersData, newCtrl]);
        }
        setShowControllerForm(false);
        setEditingController(null);
    };

    const handleDeleteController = (id) => {
        if (window.confirm("Are you sure you want to delete this controller?")) {
            syncControllers(controllersData.filter(c => c.id !== id));
        }
    };

    // Floor state & handlers
    const [showFloorForm, setShowFloorForm] = useState(false);
    const [editingFloor, setEditingFloor] = useState(null);
    const [floorsData, setFloorsData] = useState([...FLOORS_CONFIG]);

    const handleAddFloor = () => {
        setEditingFloor(null);
        setShowFloorForm(true);
    };

    const handleEditFloor = (floor) => {
        setEditingFloor(floor);
        setShowFloorForm(true);
    };

    const handleCancelFloorForm = () => {
        setShowFloorForm(false);
        setEditingFloor(null);
    };

    const handleFloorSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = data.get('name');
        const description = data.get('description');
        const status = data.get('status') === 'ACTIVE' ? 'Active' : 'Inactive';

        if (editingFloor) {
            const updated = floorsData.map(f =>
                f.id === editingFloor.id ? { ...f, name, description, status } : f
            );
            syncFloors(updated);
        } else {
            const newFloor = {
                id: Date.now(),
                name,
                description,
                status
            };
            syncFloors([...floorsData, newFloor]);
        }
        setShowFloorForm(false);
        setEditingFloor(null);
    };

    const handleDeleteFloor = (id) => {
        if (window.confirm("Are you sure you want to delete this floor?")) {
            syncFloors(floorsData.filter(f => f.id !== id));
        }
    };

    // Wall state & handlers
    const [showWallForm, setShowWallForm] = useState(false);
    const [editingWall, setEditingWall] = useState(null);
    const [wallsData, setWallsData] = useState([...WALLS_CONFIG]);

    const handleAddWall = () => {
        setEditingWall(null);
        setShowWallForm(true);
    };

    const handleEditWall = (wall) => {
        setEditingWall(wall);
        setShowWallForm(true);
    };

    const handleCancelWallForm = () => {
        setShowWallForm(false);
        setEditingWall(null);
    };

    const handleWallSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = data.get('name');
        const floor = data.get('floor');
        const cupboardsCount = Number(data.get('cupboardsCount') || 0);
        const status = data.get('status') === 'ACTIVE' ? 'Active' : 'Inactive';

        if (editingWall) {
            const updated = wallsData.map(w =>
                w.id === editingWall.id ? { ...w, name, floor, cupboardsCount, status } : w
            );
            syncWalls(updated);
        } else {
            const newWall = {
                id: Date.now(),
                name,
                floor,
                cupboardsCount,
                status
            };
            syncWalls([...wallsData, newWall]);
        }
        setShowWallForm(false);
        setEditingWall(null);
    };

    const handleDeleteWall = (id) => {
        if (window.confirm("Are you sure you want to delete this wall?")) {
            syncWalls(wallsData.filter(w => w.id !== id));
        }
    };

    // Cupboard state & handlers
    const [showCupboardForm, setShowCupboardForm] = useState(false);
    const [editingCupboard, setEditingCupboard] = useState(null);
    const [cupboardsData, setCupboardsData] = useState([...CUPBOARDS_CONFIG]);

    const handleAddCupboard = () => {
        setEditingCupboard(null);
        setShowCupboardForm(true);
    };

    const handleEditCupboard = (cb) => {
        setEditingCupboard(cb);
        setShowCupboardForm(true);
    };

    const handleCancelCupboardForm = () => {
        setShowCupboardForm(false);
        setEditingCupboard(null);
    };

    const handleCupboardSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = data.get('name');
        const shelves = Number(data.get('shelves') || 5);
        const columns = Number(data.get('columns') || 4);
        const ledsPerDrawer = Number(data.get('ledsPerDrawer') || 6);
        const controller = data.get('controller');
        const wall = data.get('wall');
        const status = data.get('status') === 'ACTIVE' ? 'Active' : 'Inactive';

        if (editingCupboard) {
            const updated = cupboardsData.map(c =>
                c.id === editingCupboard.id
                    ? { ...c, name, shelves, rows: shelves, columns, ledsPerDrawer, controller, wall, status }
                    : c
            );
            syncCupboards(updated);
        } else {
            const newCb = {
                id: Date.now(),
                name,
                shelves,
                rows: shelves,
                columns,
                ledsPerDrawer,
                controller,
                wall,
                status
            };
            syncCupboards([...cupboardsData, newCb]);
        }
        setShowCupboardForm(false);
        setEditingCupboard(null);
    };

    const handleDeleteCupboard = (id) => {
        if (window.confirm("Are you sure you want to delete this cupboard?")) {
            syncCupboards(cupboardsData.filter(c => c.id !== id));
        }
    };

    const tabs = [
        { id: 'floors', label: 'Floors', icon: Layers },
        { id: 'controllers', label: 'Controllers', icon: Server },
        { id: 'walls', label: 'Walls (Indicate Walls)', icon: LayoutGrid },
        { id: 'cupboards', label: 'Cupboards & Shelves', icon: Box },
        { id: 'led', label: 'LED & Drawers', icon: SlidersHorizontal },
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
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        // Auto-closing forms when tab is switched
                                        setShowControllerForm(false);
                                        setShowFloorForm(false);
                                        setShowWallForm(false);
                                        setShowCupboardForm(false);
                                    }}
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
                <div className="flex-1 overflow-y-auto p-6">

                    {/* controllers tab */}
                    {activeTab === 'controllers' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Controllers</h3>
                                    <p className="text-sm text-muted-foreground">Manage hardware controllers and assignments.</p>
                                </div>
                                {!showControllerForm && (
                                    <Button onClick={handleAddController} className="gap-2 bg-ot-action text-white hover:bg-ot-action-hover">
                                        <Plus className="w-4 h-4" /> Add Controller
                                    </Button>
                                )}
                            </div>

                            {showControllerForm && (
                                <Card className="border-ot-border/50 bg-ot-bg-top/30 animate-in fade-in slide-in-from-top-4">
                                    <form onSubmit={handleControllerSubmit}>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Name</label>
                                                    <Input name="name" defaultValue={editingController ? editingController.name : ''} placeholder="e.g. Controller A" className="bg-ot-surface-bottom" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">IP Address</label>
                                                    <Input name="ip" defaultValue={editingController ? editingController.ip : ''} placeholder="192.168.1.100" className="bg-ot-surface-bottom" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Port</label>
                                                    <Input name="port" defaultValue={editingController ? editingController.port : '8080'} placeholder="8080" className="bg-ot-surface-bottom" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Floor Assignment</label>
                                                    <select name="floor" defaultValue={editingController ? editingController.floor : floorsData[0]?.name || ''} className="flex h-10 w-full rounded-md border border-ot-border bg-ot-surface-bottom px-3 py-2 text-sm text-white focus:outline-none focus:border-ot-action">
                                                        {floorsData.map((f) => (
                                                            <option key={f.id} value={f.name}>{f.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Status</label>
                                                    <select name="status" defaultValue={editingController && editingController.status === 'Offline' ? 'INACTIVE' : 'ACTIVE'} className="flex h-10 w-full rounded-md border border-ot-border bg-ot-surface-bottom px-3 py-2 text-sm text-white focus:outline-none focus:border-ot-action">
                                                        <option>ACTIVE</option>
                                                        <option>INACTIVE</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 mt-6">
                                                <Button type="button" onClick={handleCancelForm} variant="outline" className="border-ot-border hover:bg-ot-surface-elev-bottom text-white">CANCEL</Button>
                                                <Button type="submit" className="bg-ot-action text-white hover:bg-ot-action-hover">
                                                    {editingController ? 'SAVE CHANGES' : 'ADD CONTROLLER'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </form>
                                </Card>
                            )}

                            <div className="border border-ot-border rounded-lg overflow-hidden bg-ot-bg-mid">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-ot-surface-top text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Name</th>
                                            <th className="px-4 py-3 font-medium">IP Address</th>
                                            <th className="px-4 py-3 font-medium">Port</th>
                                            <th className="px-4 py-3 font-medium">Floor Assignment</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ot-border">
                                        {controllersData.map((ctrl) => (
                                            <tr key={ctrl.id} className="hover:bg-ot-surface-bottom/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-white">{ctrl.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground font-mono">{ctrl.ip}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{ctrl.port}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{ctrl.floor}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs rounded-full border",
                                                        ctrl.status === 'Online'
                                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                                    )}>
                                                        {ctrl.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleEditController(ctrl)} className="text-ot-action hover:text-ot-action-hover mr-3 transition-colors"><PenSquare className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteController(ctrl.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* floors tab */}
                    {activeTab === 'floors' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Floors</h3>
                                    <p className="text-sm text-muted-foreground">Manage physical floors and areas in your facility.</p>
                                </div>
                                {!showFloorForm && (
                                    <Button onClick={handleAddFloor} className="gap-2 bg-ot-action text-white hover:bg-ot-action-hover">
                                        <Plus className="w-4 h-4" /> Add Floor
                                    </Button>
                                )}
                            </div>

                            {showFloorForm && (
                                <Card className="border-ot-border/50 bg-ot-bg-top/30 animate-in fade-in slide-in-from-top-4">
                                    <form onSubmit={handleFloorSubmit}>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Floor Name</label>
                                                    <Input name="name" defaultValue={editingFloor ? editingFloor.name : ''} placeholder="e.g. Floor 1" className="bg-ot-surface-bottom" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Description</label>
                                                    <Input name="description" defaultValue={editingFloor ? editingFloor.description : ''} placeholder="e.g. Main Pharmacy" className="bg-ot-surface-bottom" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Status</label>
                                                    <select name="status" defaultValue={editingFloor && editingFloor.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'} className="flex h-10 w-full rounded-md border border-ot-border bg-ot-surface-bottom px-3 py-2 text-sm text-white focus:outline-none focus:border-ot-action">
                                                        <option>ACTIVE</option>
                                                        <option>INACTIVE</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 mt-6">
                                                <Button type="button" onClick={handleCancelFloorForm} variant="outline" className="border-ot-border hover:bg-ot-surface-elev-bottom text-white">CANCEL</Button>
                                                <Button type="submit" className="bg-ot-action text-white hover:bg-ot-action-hover">
                                                    {editingFloor ? 'SAVE CHANGES' : 'ADD FLOOR'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </form>
                                </Card>
                            )}

                            <div className="border border-ot-border rounded-lg overflow-hidden bg-ot-bg-mid">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-ot-surface-top text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Floor Name</th>
                                            <th className="px-4 py-3 font-medium">Description</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ot-border">
                                        {floorsData.map((floor) => (
                                            <tr key={floor.id} className="hover:bg-ot-surface-bottom/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-white">{floor.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{floor.description}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs rounded-full border",
                                                        floor.status === 'Active'
                                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                                    )}>
                                                        {floor.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleEditFloor(floor)} className="text-ot-action hover:text-ot-action-hover mr-3 transition-colors"><PenSquare className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteFloor(floor.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* walls tab - NEW FEATURE */}
                    {activeTab === 'walls' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Walls Grid Config</h3>
                                    <p className="text-sm text-muted-foreground">Manage physical walls, their locations, and how many cupboards each contains.</p>
                                </div>
                                {!showWallForm && (
                                    <Button onClick={handleAddWall} className="gap-2 bg-ot-action text-white hover:bg-ot-action-hover">
                                        <Plus className="w-4 h-4" /> Add Wall
                                    </Button>
                                )}
                            </div>

                            {showWallForm && (
                                <Card className="border-ot-border/50 bg-ot-bg-top/30 animate-in fade-in slide-in-from-top-4">
                                    <form onSubmit={handleWallSubmit}>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Wall Name</label>
                                                    <Input name="name" defaultValue={editingWall ? editingWall.name : ''} placeholder="e.g. Wall A" className="bg-ot-surface-bottom" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Floor Assignment</label>
                                                    <select name="floor" defaultValue={editingWall ? editingWall.floor : floorsData[0]?.name || ''} className="flex h-10 w-full rounded-md border border-ot-border bg-ot-surface-bottom px-3 py-2 text-sm text-white focus:outline-none focus:border-ot-action">
                                                        {floorsData.map((f) => (
                                                            <option key={f.id} value={f.name}>{f.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">How Many Cupboards</label>
                                                    <Input name="cupboardsCount" type="number" min={0} defaultValue={editingWall ? editingWall.cupboardsCount : 0} className="bg-ot-surface-bottom" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Status</label>
                                                    <select name="status" defaultValue={editingWall && editingWall.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'} className="flex h-10 w-full rounded-md border border-ot-border bg-ot-surface-bottom px-3 py-2 text-sm text-white focus:outline-none focus:border-ot-action">
                                                        <option>ACTIVE</option>
                                                        <option>INACTIVE</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 mt-6">
                                                <Button type="button" onClick={handleCancelWallForm} variant="outline" className="border-ot-border hover:bg-ot-surface-elev-bottom text-white">CANCEL</Button>
                                                <Button type="submit" className="bg-ot-action text-white hover:bg-ot-action-hover">
                                                    {editingWall ? 'SAVE CHANGES' : 'ADD WALL'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </form>
                                </Card>
                            )}

                            <div className="border border-ot-border rounded-lg overflow-hidden bg-ot-bg-mid">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-ot-surface-top text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Wall Name</th>
                                            <th className="px-4 py-3 font-medium">Floor Assignment</th>
                                            <th className="px-4 py-3 font-medium">Cupboards Count</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ot-border">
                                        {wallsData.map((wall) => (
                                            <tr key={wall.id} className="hover:bg-ot-surface-bottom/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-white">{wall.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{wall.floor}</td>
                                                <td className="px-4 py-3 text-muted-foreground font-mono">{wall.cupboardsCount} Cupboards</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs rounded-full border",
                                                        wall.status === 'Active'
                                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                                    )}>
                                                        {wall.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleEditWall(wall)} className="text-ot-action hover:text-ot-action-hover mr-3 transition-colors"><PenSquare className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteWall(wall.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* cupboards tab - UPDATED FEATURE WITH SHELVES AND WALL */}
                    {activeTab === 'cupboards' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Cupboards & Shelves</h3>
                                    <p className="text-sm text-muted-foreground">Manage cupboard details, layout structure, number of shelves (selfs), and wall positioning.</p>
                                </div>
                                {!showCupboardForm && (
                                    <Button onClick={handleAddCupboard} className="gap-2 bg-ot-action text-white hover:bg-ot-action-hover">
                                        <Plus className="w-4 h-4" /> Add Cupboard
                                    </Button>
                                )}
                            </div>

                            {showCupboardForm && (
                                <Card className="border-ot-border/50 bg-ot-bg-top/30 animate-in fade-in slide-in-from-top-4">
                                    <form onSubmit={handleCupboardSubmit}>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Cupboard Name</label>
                                                    <Input name="name" defaultValue={editingCupboard ? editingCupboard.name : ''} placeholder="e.g. Cupboard A1" className="bg-ot-surface-bottom" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Assigned Wall</label>
                                                    <select name="wall" defaultValue={editingCupboard ? editingCupboard.wall : (wallsData[0]?.name || '')} className="flex h-10 w-full rounded-md border border-ot-border bg-ot-surface-bottom px-3 py-2 text-sm text-white focus:outline-none focus:border-ot-action">
                                                        {wallsData.map((w) => (
                                                            <option key={w.id} value={w.name}>{w.name}</option>
                                                        ))}
                                                        <option value="">None / Floating</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Shelves (selfs) Count</label>
                                                    <Input type="number" min={1} max={15} name="shelves" defaultValue={editingCupboard ? (editingCupboard.shelves || editingCupboard.rows) : 5} className="bg-ot-surface-bottom" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Columns / Sections</label>
                                                    <Input type="number" min={1} max={10} name="columns" defaultValue={editingCupboard ? editingCupboard.columns : 4} className="bg-ot-surface-bottom" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">LEDs per Shelf</label>
                                                    <Input type="number" min={1} max={24} name="ledsPerDrawer" defaultValue={editingCupboard ? editingCupboard.ledsPerDrawer : 6} className="bg-ot-surface-bottom" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Assigned Controller</label>
                                                    <select name="controller" defaultValue={editingCupboard ? editingCupboard.controller : controllersData[0]?.name || ''} className="flex h-10 w-full rounded-md border border-ot-border bg-ot-surface-bottom px-3 py-2 text-sm text-white focus:outline-none focus:border-ot-action">
                                                        {controllersData.map((ctrl) => (
                                                            <option key={ctrl.id} value={ctrl.name}>{ctrl.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Status</label>
                                                    <select name="status" defaultValue={editingCupboard && editingCupboard.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'} className="flex h-10 w-full rounded-md border border-ot-border bg-ot-surface-bottom px-3 py-2 text-sm text-white focus:outline-none focus:border-ot-action">
                                                        <option>ACTIVE</option>
                                                        <option>INACTIVE</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 mt-6">
                                                <Button type="button" onClick={handleCancelCupboardForm} variant="outline" className="border-ot-border hover:bg-ot-surface-elev-bottom text-white">CANCEL</Button>
                                                <Button type="submit" className="bg-ot-action text-white hover:bg-ot-action-hover">
                                                    {editingCupboard ? 'SAVE CHANGES' : 'ADD CUPBOARD'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </form>
                                </Card>
                            )}

                            <div className="border border-ot-border rounded-lg overflow-hidden bg-ot-bg-mid">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-ot-surface-top text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Cupboard</th>
                                            <th className="px-4 py-3 font-medium">Assigned Wall</th>
                                            <th className="px-4 py-3 font-medium">Shelves Layout</th>
                                            <th className="px-4 py-3 font-medium">LEDs/Shelf</th>
                                            <th className="px-4 py-3 font-medium">Assigned Controller</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ot-border">
                                        {cupboardsData.map((cb) => (
                                            <tr key={cb.id} className="hover:bg-ot-surface-bottom/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-white">{cb.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {cb.wall ? (
                                                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-ot-action/15 text-ot-action border border-ot-action/25">
                                                            {cb.wall}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/35 italic">Floating / None</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground font-mono">
                                                    {cb.shelves || cb.rows || 5} Shelves × {cb.columns} Sections
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{cb.ledsPerDrawer} LEDs</td>
                                                <td className="px-4 py-3 text-muted-foreground">{cb.controller}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs rounded-full border",
                                                        cb.status === 'Active'
                                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                                    )}>
                                                        {cb.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleEditCupboard(cb)} className="text-ot-action hover:text-ot-action-hover mr-3 transition-colors"><PenSquare className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteCupboard(cb.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {['led'].includes(activeTab) && (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Module {activeTab} in development... (Configured within Cupboards)
                        </div>
                    )}

                </div>
            </Card>
        </div>
    );
}
