import React, { useState } from 'react';
import { Card, CardContent } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Plus, PenSquare, Trash2 } from 'lucide-react';
import { cn } from 'lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';

export default function WallsTab({ wallsData, syncWalls, floorsData, controllersData }) {
    const [showWallForm, setShowWallForm] = useState(false);
    const [editingWall, setEditingWall] = useState(null);
    const [selectedFloorForWall, setSelectedFloorForWall] = useState('');

    const handleAddWall = () => {
        setEditingWall(null);
        setSelectedFloorForWall(floorsData[0]?.name || '');
        setShowWallForm(true);
    };

    const handleEditWall = (wall) => {
        setEditingWall(wall);
        setSelectedFloorForWall(wall.floor || floorsData[0]?.name || '');
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
        const controller = data.get('controller');
        const cupboardsCount = Number(data.get('cupboardsCount') || 0);
        const status = data.get('status') === 'ACTIVE' ? 'Active' : 'Inactive';

        if (editingWall) {
            const updated = wallsData.map(w =>
                w.id === editingWall.id ? { ...w, name, floor, controller, cupboardsCount, status } : w
            );
            syncWalls(updated);
        } else {
            const newWall = {
                id: Date.now(),
                name,
                floor,
                controller,
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

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h3 className="text-xl font-semibold text-white">Walls</h3>
                    <p className="text-sm text-muted-foreground">Manage physical walls in your facility.</p>
                </div>
                {!showWallForm && (
                    <Button onClick={handleAddWall} className="gap-2 bg-ot-action text-white hover:bg-ot-action-hover">
                        <Plus className="w-4 h-4" /> Add Wall
                    </Button>
                )}
            </div>

            {showWallForm && (
                <Card className="border-ot-border/50 bg-ot-bg-top/30 animate-in fade-in slide-in-from-top-4 shrink-0">
                    <form onSubmit={handleWallSubmit}>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Wall Name</label>
                                    <Input name="name" defaultValue={editingWall ? editingWall.name : ''} placeholder="e.g. Wall A" className="bg-ot-surface-bottom" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Floor Assignment</label>
                                    <Select 
                                        name="floor" 
                                        value={selectedFloorForWall} 
                                        onValueChange={(val) => setSelectedFloorForWall(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select floor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {floorsData.map((f) => (
                                                <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Controller Assignment</label>
                                    <Select name="controller" defaultValue={editingWall ? editingWall.controller : ''}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select controller" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {controllersData.filter(c => c.floor === selectedFloorForWall).map((ctrl) => (
                                                <SelectItem key={ctrl.id} value={ctrl.name}>{ctrl.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Status</label>
                                    <Select name="status" defaultValue={editingWall && editingWall.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                                        </SelectContent>
                                    </Select>
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

            <div className="border border-ot-border rounded-lg bg-ot-bg-mid flex-1 min-h-0 flex flex-col">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Wall Name</TableHead>
                            <TableHead>Floor Assignment</TableHead>
                            <TableHead>Controller Assignment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {wallsData.map((wall) => (
                            <TableRow key={wall.id}>
                                <TableCell className="font-medium text-white">{wall.name}</TableCell>
                                <TableCell className="text-muted-foreground">{wall.floor}</TableCell>
                                <TableCell className="text-muted-foreground">{wall.controller || 'Unassigned'}</TableCell>
                                <TableCell>
                                    <span className={cn(
                                        "px-2 py-1 text-xs rounded-full border",
                                        wall.status === 'Active'
                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}>
                                        {wall.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" onClick={() => handleEditWall(wall)} className="text-ot-action hover:text-ot-action-hover mr-3 transition-colors"><PenSquare className="w-4 h-4" /></Button>
                                    <Button variant="ghost" onClick={() => handleDeleteWall(wall.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
