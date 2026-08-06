import React, { useState } from 'react';
import { Card, CardContent } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Plus, PenSquare, Trash2, ServerOff, ChevronDown, ChevronRight, Eye, X, Cable, Cpu, Layers, Check } from 'lucide-react';
import { cn } from 'lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from 'components/ui/dialog';
import { ConfirmDialog } from 'components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { apiService } from 'lib/apiService';

// Generate 16 static ports for a controller
const generateInitialPorts = () => {
    return Array.from({ length: 16 }, (_, i) => {
        const num = String(i + 1).padStart(2, '0');
        const initialStrips = i === 0 ? [
            { id: 'strip-101', label: 'Strip 01-A', ledCount: 6, shelf: 'Shelf A1', linkedBins: 4 },
            { id: 'strip-102', label: 'Strip 01-B', ledCount: 8, shelf: 'Shelf A2', linkedBins: 6 }
        ] : i === 1 ? [
            { id: 'strip-103', label: 'Strip 02-A', ledCount: 6, shelf: 'Shelf B1', linkedBins: 3 }
        ] : [];

        return {
            port_name: `PORT-${num}`,
            strip_count: initialStrips.length,
            status: initialStrips.length > 0 ? 'Active' : 'Idle',
            strips: initialStrips
        };
    });
};

// Available sample strips to add via dialog
const SAMPLE_STRIP_OPTIONS = [
    { id: 'sample-1', label: 'LED Strip Type A', ledCount: 6, shelf: 'Shelf 1', linkedBins: 4 },
    { id: 'sample-2', label: 'LED Strip Type B', ledCount: 8, shelf: 'Shelf 2', linkedBins: 6 },
    { id: 'sample-3', label: 'LED Strip Type C', ledCount: 12, shelf: 'Shelf 3', linkedBins: 8 },
    { id: 'sample-4', label: 'LED Strip Type D', ledCount: 16, shelf: 'Shelf 4', linkedBins: 10 },
    { id: 'sample-5', label: 'LED Strip Type E', ledCount: 24, shelf: 'Shelf 5', linkedBins: 12 },
];

export default function ControllersTab({ controllersData, syncControllers }) {
    const [showControllerForm, setShowControllerForm] = useState(false);
    const [editingController, setEditingController] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [controllerToDelete, setControllerToDelete] = useState(null);

    // Expandable controllers state
    const [expandedControllers, setExpandedControllers] = useState({});

    // Dynamic ports state per controller: { [controllerId]: portsArray }
    const [controllerPortsMap, setControllerPortsMap] = useState({});

    // Add Strip Modal state (multi-select)
    const [addStripModalOpen, setAddStripModalOpen] = useState(false);
    const [targetPortInfo, setTargetPortInfo] = useState(null); // { ctrlId, portIndex, portName }
    const [selectedSampleStripIds, setSelectedSampleStripIds] = useState(['sample-1']);

    // Right-side sheet state for simple strip view
    const [selectedPortView, setSelectedPortView] = useState(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const toggleExpandController = (ctrlId) => {
        setExpandedControllers(prev => {
            const nextState = { ...prev, [ctrlId]: !prev[ctrlId] };

            // Ensure 16 ports exist for this controller
            if (!controllerPortsMap[ctrlId]) {
                setControllerPortsMap(pm => ({
                    ...pm,
                    [ctrlId]: generateInitialPorts()
                }));
            }
            return nextState;
        });
    };

    // Open Add Strip Modal
    const handleOpenAddStripModal = (ctrlId, portIndex, portName) => {
        setTargetPortInfo({ ctrlId, portIndex, portName });
        setSelectedSampleStripIds(['sample-1']);
        setAddStripModalOpen(true);
    };

    // Multi-select toggle for sample strips
    const toggleSelectSampleStrip = (id) => {
        setSelectedSampleStripIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllStrips = () => {
        if (selectedSampleStripIds.length === SAMPLE_STRIP_OPTIONS.length) {
            setSelectedSampleStripIds([]);
        } else {
            setSelectedSampleStripIds(SAMPLE_STRIP_OPTIONS.map(s => s.id));
        }
    };

    // Submit Add Multiple Strips from Modal
    const handleAddStripSubmit = () => {
        if (!targetPortInfo || selectedSampleStripIds.length === 0) {
            toast.error("Please select at least one strip to add.");
            return;
        }
        const { ctrlId, portIndex, portName } = targetPortInfo;

        const selectedStripsData = SAMPLE_STRIP_OPTIONS.filter(s => selectedSampleStripIds.includes(s.id));
        const currentCount = controllerPortsMap[ctrlId]?.[portIndex]?.strips?.length || 0;

        const newStripItems = selectedStripsData.map((sample, idx) => ({
            id: `strip-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
            label: `${sample.label} (#${currentCount + idx + 1})`,
            ledCount: sample.ledCount,
            shelf: sample.shelf,
            linkedBins: sample.linkedBins
        }));

        setControllerPortsMap(prev => {
            const currentPorts = prev[ctrlId] || generateInitialPorts();
            const updatedPorts = currentPorts.map((p, idx) => {
                if (idx !== portIndex) return p;
                const nextStrips = [...p.strips, ...newStripItems];
                return {
                    ...p,
                    strips: nextStrips,
                    strip_count: nextStrips.length,
                    status: 'Active'
                };
            });

            // Update sheet view if currently open for this port
            if (selectedPortView && selectedPortView.ctrlId === ctrlId && selectedPortView.portIndex === portIndex) {
                setSelectedPortView(sp => ({
                    ...sp,
                    strips: [...sp.strips, ...newStripItems]
                }));
            }

            return { ...prev, [ctrlId]: updatedPorts };
        });

        toast.success(`Added ${newStripItems.length} strip(s) to ${portName}`);
        setAddStripModalOpen(false);
        setTargetPortInfo(null);
    };

    // Open View Sheet
    const handleOpenStripSheet = (ctrl, portIndex) => {
        const ctrlPorts = controllerPortsMap[ctrl.id] || generateInitialPorts();
        const portObj = ctrlPorts[portIndex];

        setSelectedPortView({
            ctrlId: ctrl.id,
            portIndex: portIndex,
            controllerName: ctrl.name,
            portName: portObj.port_name,
            strips: portObj.strips || []
        });
        setIsSheetOpen(true);
    };

    // Delete strip from sheet list
    const handleRemoveStripFromPort = (stripId) => {
        if (!selectedPortView) return;
        const { ctrlId, portIndex } = selectedPortView;

        setControllerPortsMap(prev => {
            const currentPorts = prev[ctrlId] || generateInitialPorts();
            const updatedPorts = currentPorts.map((p, idx) => {
                if (idx !== portIndex) return p;
                const nextStrips = p.strips.filter(s => s.id !== stripId);
                return {
                    ...p,
                    strips: nextStrips,
                    strip_count: nextStrips.length,
                    status: nextStrips.length > 0 ? 'Active' : 'Idle'
                };
            });

            setSelectedPortView(sp => ({
                ...sp,
                strips: sp.strips.filter(s => s.id !== stripId)
            }));

            return { ...prev, [ctrlId]: updatedPorts };
        });

        toast.success("Strip removed from port");
    };

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
        const cports = parseInt(data.get('cports') || '16', 10);
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
                    c.id === editingController.id ? { ...c, name, ip, port, cports, status } : c
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
                    cports: cports,
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
        <div className="flex flex-col h-full space-y-6 animate-in fade-in relative">
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
                                    <Input name="name" defaultValue={editingController ? editingController.name : ''} placeholder="e.g. Controller A" className="bg-ot-surface-bottom border-ot-border" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">IP Address</label>
                                    <Input name="ip" defaultValue={editingController ? editingController.ip : ''} placeholder="192.168.1.100" className="bg-ot-surface-bottom border-ot-border" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Port</label>
                                    <Input name="port" defaultValue={editingController ? editingController.port : '8080'} placeholder="8080" className="bg-ot-surface-bottom border-ot-border" required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">cports (Ports Count)</label>
                                    <Input name="cports" type="number" defaultValue={editingController ? (editingController.cports || editingController.portsCount || 16) : 16} placeholder="16" className="bg-ot-surface-bottom border-ot-border" required />
                                </div>

                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Status</label>
                                    <Select name="status" defaultValue={editingController && editingController.status === 'Offline' ? 'INACTIVE' : 'ACTIVE'}>
                                        <SelectTrigger className="bg-ot-surface-bottom border-ot-border text-white">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-ot-surface-top border-ot-border text-white">
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

            <div className="border border-ot-border rounded-lg bg-ot-bg-mid flex-1 min-h-0 flex flex-col relative overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-ot-border/60 bg-ot-surface-top/50">
                            <TableHead className="w-12 text-center"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Port</TableHead>
                            <TableHead className="font-semibold">cports</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {controllersData.map((ctrl) => {
                            const isExpanded = !!expandedControllers[ctrl.id];
                            const portsList = controllerPortsMap[ctrl.id] || generateInitialPorts();
                            const portsCount = ctrl.cports || ctrl.portsCount || 16;

                            return (
                                <React.Fragment key={ctrl.id}>
                                    <TableRow className={cn("transition-colors hover:bg-ot-surface-top/40", isExpanded && "bg-ot-surface-top/30 border-b-0")}>
                                        <TableCell className="text-center p-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleExpandController(ctrl.id)}
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-white hover:bg-ot-surface-elev-bottom"
                                                title={isExpanded ? "Collapse Ports" : "Expand Ports"}
                                            >
                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-ot-action" /> : <ChevronRight className="w-4 h-4" />}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium text-white flex items-center gap-2">
                                            <Cpu className="w-4 h-4 text-ot-action shrink-0" />
                                            {ctrl.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-mono text-xs">{ctrl.ip}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs font-mono">{ctrl.port}</TableCell>
                                        <TableCell className="font-mono text-xs text-ot-action font-semibold">
                                            <span className="px-2 py-0.5 rounded bg-ot-surface-bottom border border-ot-border/50">
                                                {portsCount} Ports
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "px-2 py-0.5 text-xs rounded-full border font-medium",
                                                ctrl.status === 'Online'
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                            )}>
                                                {ctrl.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditController(ctrl)} className="text-ot-action hover:text-ot-action-hover mr-2 transition-colors"><PenSquare className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteController(ctrl.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></Button>
                                        </TableCell>
                                    </TableRow>

                                    {/* Expanded Ports Table Row */}
                                    {isExpanded && (
                                        <TableRow className="bg-ot-surface-top/20 hover:bg-ot-surface-top/20 border-b border-ot-border/40">
                                            <TableCell colSpan={7} className="p-3 pl-12">
                                                <div className="rounded-lg border border-ot-border/60 bg-ot-surface-bottom/90 p-3 space-y-2">
                                                    <div className="flex items-center justify-between px-1 pb-2 border-b border-ot-border/40">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-ot-action uppercase tracking-wider">
                                                            <Cable className="w-3.5 h-3.5" />
                                                            Controller Ports (16 Ports)
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground font-mono bg-ot-surface-elev-bottom px-2 py-0.5 rounded border border-ot-border/40">
                                                            Limit: 16 Ports
                                                        </span>
                                                    </div>

                                                    {/* Scrollable Container with Max Height */}
                                                    <div className="max-h-64 overflow-y-auto border border-ot-border/40 rounded-md bg-ot-surface-bottom/40">
                                                        <Table className="text-xs">
                                                            <TableHeader className="sticky top-0 bg-ot-surface-elev-bottom z-10">
                                                                <TableRow className="border-b border-ot-border/40 hover:bg-transparent">
                                                                    <TableHead className="text-muted-foreground font-semibold uppercase text-[10px] py-2">port_name</TableHead>
                                                                    <TableHead className="text-muted-foreground font-semibold uppercase text-[10px] py-2">strip_count</TableHead>
                                                                    <TableHead className="text-muted-foreground font-semibold uppercase text-[10px] py-2">status</TableHead>
                                                                    <TableHead className="text-right text-muted-foreground font-semibold uppercase text-[10px] py-2">actions</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {portsList.map((port, pIdx) => (
                                                                    <TableRow key={pIdx} className="border-b border-ot-border/20 hover:bg-ot-surface-top/30 transition-colors">
                                                                        <TableCell className="font-mono font-semibold text-white py-2">
                                                                            <span className="px-2 py-0.5 rounded bg-ot-surface-elev-top/50 text-ot-action border border-ot-border/50">
                                                                                {port.port_name}
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell className="text-muted-foreground py-2 font-mono">
                                                                            <span className="px-2 py-0.5 rounded bg-ot-surface-bottom border border-ot-border/40 text-xs">
                                                                                {port.strip_count} {port.strip_count === 1 ? 'Strip' : 'Strips'}
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell className="py-2">
                                                                            <span className={cn(
                                                                                "inline-flex items-center gap-1.5 text-[11px] font-medium",
                                                                                port.status === 'Active' ? "text-green-400" : "text-amber-400"
                                                                            )}>
                                                                                <span className={cn("w-1.5 h-1.5 rounded-full", port.status === 'Active' ? "bg-green-400 shadow-[0_0_6px_#34d399]" : "bg-amber-400")} />
                                                                                {port.status}
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell className="text-right py-2 space-x-2">
                                                                            {/* + Add Strip Button */}
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleOpenAddStripModal(ctrl.id, pIdx, port.port_name)}
                                                                                className="h-7 px-2 gap-1 text-xs text-ot-action hover:bg-ot-action/15 border border-ot-action/30 rounded"
                                                                                title="Add Strip to Port"
                                                                            >
                                                                                <Plus className="w-3.5 h-3.5" />
                                                                                Add Strip
                                                                            </Button>

                                                                            {/* View Eye Icon Button */}
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleOpenStripSheet(ctrl, pIdx)}
                                                                                className="h-7 px-2 gap-1 text-xs text-white hover:bg-ot-surface-elev-top border border-ot-border rounded"
                                                                                title="View Strip Details"
                                                                            >
                                                                                <Eye className="w-3.5 h-3.5 text-ot-action" />
                                                                                View
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            );
                        })}
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

            {/* Redesigned Multi-Select Add Strip Modal Dialog */}
            <Dialog open={addStripModalOpen} onOpenChange={setAddStripModalOpen}>
                <DialogContent className="sm:max-w-lg bg-ot-surface-top border-ot-border text-white shadow-2xl">
                    <DialogHeader className="pb-2 border-b border-ot-border/40">
                        <DialogTitle className="text-lg font-bold text-white flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-ot-action" />
                                Add Strips to {targetPortInfo?.portName}
                            </span>
                            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-ot-action/10 border border-ot-action/30 text-ot-action">
                                {selectedSampleStripIds.length} Selected
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            Select multiple sample LED strips to assign to this port simultaneously.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Available Sample Strips:</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSelectAllStrips}
                                className="h-7 px-2 text-xs text-ot-action hover:bg-ot-action/10"
                            >
                                {selectedSampleStripIds.length === SAMPLE_STRIP_OPTIONS.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>

                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                            {SAMPLE_STRIP_OPTIONS.map((opt) => {
                                const isSelected = selectedSampleStripIds.includes(opt.id);
                                return (
                                    <div
                                        key={opt.id}
                                        onClick={() => toggleSelectSampleStrip(opt.id)}
                                        className={cn(
                                            "p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group",
                                            isSelected
                                                ? "bg-ot-surface-elev-top/80 border-ot-action shadow-[0_0_12px_rgba(95,166,255,0.15)]"
                                                : "bg-ot-surface-bottom border-ot-border/60 text-muted-foreground hover:border-ot-action/50 hover:bg-ot-surface-bottom/80"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0",
                                                isSelected ? "bg-ot-action border-ot-action text-white" : "border-ot-border bg-ot-surface-bottom group-hover:border-ot-action/60"
                                            )}>
                                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-white group-hover:text-ot-action transition-colors">
                                                    {opt.label}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Assigned to <span className="text-slate-300 font-medium">{opt.shelf}</span> • <span className="text-ot-action font-mono">{opt.linkedBins} Bins Linked</span>
                                                </div>
                                            </div>
                                        </div>

                                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-ot-surface-elev-bottom border border-ot-border/60 text-ot-action shrink-0">
                                            {opt.ledCount} LEDs
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-2 border-t border-ot-border/40">

                        <Button
                            onClick={handleAddStripSubmit}
                            disabled={selectedSampleStripIds.length === 0}
                            className="bg-ot-action hover:bg-ot-action-hover text-white font-bold text-xs gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            Add Selected ({selectedSampleStripIds.length})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Simple Clean Right-Side Slide-Over Sheet */}
            {isSheetOpen && selectedPortView && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                        onClick={() => setIsSheetOpen(false)}
                    />

                    {/* Sheet Drawer */}
                    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-ot-surface-bottom border-l border-ot-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Sheet Header */}
                        <div className="px-5 py-4 border-b border-ot-border/60 bg-ot-surface-top flex items-center justify-between shrink-0">
                            <div>
                                <h4 className="text-base font-bold text-white flex items-center gap-2">
                                    <Cable className="w-4 h-4 text-ot-action" />
                                    {selectedPortView.portName} Strips List
                                </h4>
                                <p className="text-xs text-muted-foreground">{selectedPortView.controllerName}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsSheetOpen(false)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-white hover:bg-ot-surface-elev-bottom rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Sheet Body: Simple Clean List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                Connected Strips ({selectedPortView.strips.length})
                            </div>

                            {selectedPortView.strips.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground bg-ot-surface-top/30 border border-ot-border/40 rounded-lg">
                                    No strips connected to this port yet. Use "+ Add Strip" to assign one.
                                </div>
                            ) : (
                                selectedPortView.strips.map((strip, idx) => (
                                    <div
                                        key={strip.id || idx}
                                        className="p-3 rounded-lg bg-ot-surface-top border border-ot-border flex items-center justify-between hover:border-ot-action/50 transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <div className="font-bold text-sm text-white flex items-center gap-2">
                                                <span className="text-xs font-mono text-ot-action">#{idx + 1}</span>
                                                {strip.label}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                {strip.ledCount} LEDs • {strip.shelf || 'Shelf 1'} ({strip.linkedBins || 0} Bins)
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveStripFromPort(strip.id)}
                                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                                            title="Remove Strip"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Confirm Deletion"
                description="Are you sure you want to delete this controller? This action cannot be undone and will remove it permanently."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={confirmDeleteController}
                onCancel={() => setControllerToDelete(null)}
            />
        </div>
    );
}

