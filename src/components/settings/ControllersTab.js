import React, { useState } from 'react';
import { Card, CardContent } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Plus, PenSquare, Trash2 } from 'lucide-react';
import { cn } from 'lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';

export default function ControllersTab({ controllersData, syncControllers }) {
    const [showControllerForm, setShowControllerForm] = useState(false);
    const [editingController, setEditingController] = useState(null);

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
        const status = data.get('status') === 'ACTIVE' ? 'Online' : 'Offline';

        if (editingController) {
            const updated = controllersData.map(c =>
                c.id === editingController.id ? { ...c, name, ip, port, status } : c
            );
            syncControllers(updated);
        } else {
            const newCtrl = {
                id: Date.now(),
                name,
                ip,
                port,
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

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center shrink-0">
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
                <Card className="border-ot-border/50 bg-ot-bg-top/30 animate-in fade-in slide-in-from-top-4 shrink-0">
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
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Status</label>
                                    <Select name="status" defaultValue={editingController && editingController.status === 'Offline' ? 'INACTIVE' : 'ACTIVE'}>
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
                                <Button type="button" onClick={handleCancelForm} variant="outline" className="border-ot-border hover:bg-ot-surface-elev-bottom text-white">CANCEL</Button>
                                <Button type="submit" className="bg-ot-action text-white hover:bg-ot-action-hover">
                                    {editingController ? 'SAVE CHANGES' : 'ADD CONTROLLER'}
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
                            <TableHead>Name</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Port</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {controllersData.map((ctrl) => (
                            <TableRow key={ctrl.id}>
                                <TableCell className="font-medium text-white">{ctrl.name}</TableCell>
                                <TableCell className="text-muted-foreground font-mono">{ctrl.ip}</TableCell>
                                <TableCell className="text-muted-foreground">{ctrl.port}</TableCell>
                                <TableCell>
                                    <span className={cn(
                                        "px-2 py-1 text-xs rounded-full border",
                                        ctrl.status === 'Online'
                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}>
                                        {ctrl.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" onClick={() => handleEditController(ctrl)} className="text-ot-action hover:text-ot-action-hover mr-3 transition-colors"><PenSquare className="w-4 h-4" /></Button>
                                    <Button variant="ghost" onClick={() => handleDeleteController(ctrl.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
