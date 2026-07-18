import React, { useState } from 'react';
import { Card, CardContent } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Plus, PenSquare, Trash2, AlertTriangle, ServerOff } from 'lucide-react';
import { cn } from 'lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from 'components/ui/dialog';
import { toast } from 'sonner';
import { apiService } from 'lib/apiService';

export default function ControllersTab({ controllersData, syncControllers }) {
    const [showControllerForm, setShowControllerForm] = useState(false);
    const [editingController, setEditingController] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [controllerToDelete, setControllerToDelete] = useState(null);

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

    const handleControllerSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = data.get('name');
        const ip = data.get('ip');
        const port = data.get('port');
        const status = data.get('status') === 'ACTIVE' ? 'Online' : 'Offline';

        if (editingController) {
            try {
                let ctl_loc_id = '';
                const selectedLocationStr = localStorage.getItem('selectedLocation');
                if (selectedLocationStr) {
                    try {
                        const selectedLocation = JSON.parse(selectedLocationStr);
                        ctl_loc_id = String(selectedLocation.pick_location_id || '');
                    } catch (e) { }
                }

                const payload = {
                    ctl_name: name,
                    ctl_ip: ip,
                    ctl_port: parseInt(port, 10),
                    ctl_loc_id: ctl_loc_id,
                    ctl_status: status === 'Online'
                };

                await apiService.updateController(editingController.id, payload);

                const updated = controllersData.map(c =>
                    c.id === editingController.id ? { ...c, name, ip, port, status } : c
                );
                syncControllers(updated);
                setShowControllerForm(false);
                setEditingController(null);
                toast.success("Controller updated successfully");
            } catch (error) {
                console.error("Error updating controller:", error);
                toast.error(`Failed to update controller: ${error.message}`);
            }
        } else {
            try {
                let ctl_loc_id = '';
                const selectedLocationStr = localStorage.getItem('selectedLocation');
                if (selectedLocationStr) {
                    try {
                        const selectedLocation = JSON.parse(selectedLocationStr);
                        ctl_loc_id = String(selectedLocation.pick_location_id || '');
                    } catch (e) { }
                }

                const payload = {
                    ctl_name: name,
                    ctl_ip: ip,
                    ctl_port: parseInt(port, 10),
                    ctl_loc_id: ctl_loc_id,
                    ctl_status: status === 'Online'
                };

                const resData = await apiService.createController(payload);

                let newId = Math.random().toString(36).substr(2, 9);
                if (resData.data && resData.data.ctl_id) {
                    newId = resData.data.ctl_id;
                } else if (resData.ctl_id) {
                    newId = resData.ctl_id;
                } else if (resData.id) {
                    newId = resData.id;
                }

                const newCtrl = {
                    id: newId,
                    name: name,
                    ip: ip,
                    port: parseInt(port, 10),
                    status: status
                };
                syncControllers([...controllersData, newCtrl]);
                setShowControllerForm(false);
                toast.success("Controller added successfully");
            } catch (error) {
                console.error("Error adding controller:", error);
                toast.error(`Failed to add controller: ${error.message}`);
            }
        }
    };

    const handleDeleteController = (id) => {
        setControllerToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteController = async () => {
        if (!controllerToDelete) return;
        const id = controllerToDelete;
        try {
            await apiService.deleteController(id);
            syncControllers(controllersData.filter(c => c.id !== id));
            toast.success("Controller deleted successfully");
        } catch (error) {
            console.error("Error deleting controller:", error);
            toast.error(`Failed to delete controller: ${error.message}`);
        } finally {
            setDeleteDialogOpen(false);
            setControllerToDelete(null);
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

            <div className="border border-ot-border rounded-lg bg-ot-bg-mid flex-1 min-h-0 flex flex-col relative">
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

                {controllersData.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground space-y-4 pt-12 pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-ot-surface-elev-bottom flex items-center justify-center border border-ot-border shadow-inner">
                            <ServerOff className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-base font-medium">In this location no controller will have.</p>
                    </div>
                )}
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md border-red-500/20 bg-gradient-to-b from-ot-surface-top/90 to-ot-bg-bottom/90 backdrop-blur-xl">
                    <DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="space-y-2 text-center">
                                <DialogTitle className="text-xl text-white">Confirm Deletion</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-sm">
                                    Are you sure you want to delete this controller? This action cannot be undone and will remove it permanently.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <DialogFooter className="flex justify-center gap-3 sm:justify-center mt-2 border-t border-ot-border/50 pt-4">
                        <Button
                            variant="outline"
                            className="border-ot-border text-white hover:bg-ot-surface-elev-bottom min-w-[100px]"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setControllerToDelete(null);
                            }}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white min-w-[100px] shadow-lg shadow-red-900/20"
                            onClick={confirmDeleteController}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
