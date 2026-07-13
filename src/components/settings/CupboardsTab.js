import React, { useState } from 'react';
import { Card, CardContent } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Plus, PenSquare, Trash2 } from 'lucide-react';
import { cn } from 'lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';

export default function CupboardsTab({ cupboardsData, syncCupboards, controllersData, wallsData }) {
    const [showCupboardForm, setShowCupboardForm] = useState(false);
    const [editingCupboard, setEditingCupboard] = useState(null);

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

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h3 className="text-xl font-semibold text-white">Cupboards & Shelves</h3>
                    <p className="text-sm text-muted-foreground">Manage cupboards and their shelves (selfs) assignments with LEDs.</p>
                </div>
                {!showCupboardForm && (
                    <Button onClick={handleAddCupboard} className="gap-2 bg-ot-action text-white hover:bg-ot-action-hover">
                        <Plus className="w-4 h-4" /> Add Cupboard
                    </Button>
                )}
            </div>

            {showCupboardForm && (
                <Card className="border-ot-border/50 bg-ot-bg-top/30 animate-in fade-in slide-in-from-top-4 shrink-0">
                    <form onSubmit={handleCupboardSubmit}>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Controller</label>
                                    <Select name="controller" defaultValue={editingCupboard ? editingCupboard.controller : ''}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select controller" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {controllersData.map((ctrl) => (
                                                <SelectItem key={ctrl.id} value={ctrl.name}>{ctrl.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Wall</label>
                                    <Select name="wall" defaultValue={editingCupboard ? editingCupboard.wall : ''} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select wall" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {wallsData.map((wall) => (
                                                <SelectItem key={wall.id} value={wall.name}>{wall.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Cupboard Name</label>
                                    <Input name="name" defaultValue={editingCupboard ? editingCupboard.name : ''} placeholder="e.g. Cupboard A1" className="bg-ot-surface-bottom" required />
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
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">LEDs per Shelf (Self)</label>
                                    <Input type="number" min={1} max={24} name="ledsPerDrawer" defaultValue={editingCupboard ? editingCupboard.ledsPerDrawer : 6} className="bg-ot-surface-bottom" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Status</label>
                                    <Select name="status" defaultValue={editingCupboard && editingCupboard.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'}>
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
                                <Button type="button" onClick={handleCancelCupboardForm} variant="outline" className="border-ot-border hover:bg-ot-surface-elev-bottom text-white">CANCEL</Button>
                                <Button type="submit" className="bg-ot-action text-white hover:bg-ot-action-hover">
                                    {editingCupboard ? 'SAVE CHANGES' : 'ADD WALL / CUPBOARD'}
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
                            <TableHead>Wall</TableHead>
                            <TableHead>Cupboard</TableHead>
                            <TableHead>Controller</TableHead>
                            <TableHead>Shelves Layout</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cupboardsData.map((cb) => {
                            return (
                                <TableRow key={cb.id}>
                                    <TableCell className="font-medium text-white">
                                        {cb.wall ? (
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-ot-action/15 text-ot-action border border-ot-action/25">
                                                {cb.wall}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground/35 italic">Floating</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium text-white">{cb.name}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        <div>{cb.controller}</div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground font-mono text-xs">
                                        {cb.shelves || cb.rows || 5} × {cb.columns} ({cb.ledsPerDrawer} LEDs)
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "px-2 py-1 text-xs rounded-full border",
                                            cb.status === 'Active'
                                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                : "bg-red-500/10 text-red-400 border-red-500/20"
                                        )}>
                                            {cb.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" onClick={() => handleEditCupboard(cb)} className="text-ot-action hover:text-ot-action-hover mr-3 transition-colors"><PenSquare className="w-4 h-4" /></Button>
                                        <Button variant="ghost" onClick={() => handleDeleteCupboard(cb.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
