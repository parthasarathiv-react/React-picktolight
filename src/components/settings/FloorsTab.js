import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import ConfirmDialog from 'components/ui/confirm-dialog';
import { Plus, PenSquare, Trash2 } from 'lucide-react';
import { cn } from 'lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';

export default function FloorsTab({ floorsData, syncFloors }) {
    const [showFloorForm, setShowFloorForm] = useState(false);
    const [editingFloor, setEditingFloor] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

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
            toast.success('Floor updated', { description: `"${name}" has been saved.` });
        } else {
            const newFloor = {
                id: Date.now(),
                name,
                description,
                status
            };
            syncFloors([...floorsData, newFloor]);
            toast.success('Floor added', { description: `"${name}" has been created.` });
        }
        setShowFloorForm(false);
        setEditingFloor(null);
    };

    const handleDeleteFloor = (id) => {
        setPendingDeleteId(id);
        setConfirmOpen(true);
    };

    const confirmDelete = () => {
        const floor = floorsData.find(f => f.id === pendingDeleteId);
        syncFloors(floorsData.filter(f => f.id !== pendingDeleteId));
        toast.error('Floor deleted', { description: floor ? `"${floor.name}" has been removed.` : undefined });
        setPendingDeleteId(null);
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center shrink-0">
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
                <Card className="border-ot-border/50 bg-ot-bg-top/30 animate-in fade-in slide-in-from-top-4 shrink-0">
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
                                    <Select name="status" defaultValue={editingFloor && editingFloor.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'}>
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
                                <Button type="button" onClick={handleCancelFloorForm} variant="outline" className="border-ot-border hover:bg-ot-surface-elev-bottom text-white">CANCEL</Button>
                                <Button type="submit" className="bg-ot-action text-white hover:bg-ot-action-hover">
                                    {editingFloor ? 'SAVE CHANGES' : 'ADD FLOOR'}
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
                            <TableHead>Floor Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {floorsData.map((floor) => (
                            <TableRow key={floor.id}>
                                <TableCell className="font-medium text-white">{floor.name}</TableCell>
                                <TableCell className="text-muted-foreground">{floor.description}</TableCell>
                                <TableCell>
                                    <span className={cn(
                                        "px-2 py-1 text-xs rounded-full border",
                                        floor.status === 'Active'
                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}>
                                        {floor.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" onClick={() => handleEditFloor(floor)} className="text-ot-action hover:text-ot-action-hover mr-3 transition-colors"><PenSquare className="w-4 h-4" /></Button>
                                    <Button variant="ghost" onClick={() => handleDeleteFloor(floor.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Delete Floor"
                description="Are you sure you want to delete this floor? This action cannot be undone."
                confirmLabel="Delete Floor"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
