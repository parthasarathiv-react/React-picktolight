import React, { useState } from 'react';
import { Card, CardContent } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Plus, PenSquare, Trash2, ServerOff, ChevronDown, ChevronRight, Eye, X, Cable, Cpu, Layers, Check, Loader2 } from 'lucide-react';
import { cn } from 'lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from 'components/ui/dialog';
import { ConfirmDialog } from 'components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { apiService } from 'lib/apiService';

// Generate initial channels for a controller
const generateInitialChannels = (count = 16) => {
    return Array.from({ length: count }, (_, i) => {
        const num = String(i + 1).padStart(2, '0');
        return {
            channel_name: `CHANNEL-${num}`,
            channel_ledcount: 0,
            channel_stripcount: 0,
            status: 'Idle',
            strips: []
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

export default function ControllersTab({ controllersData, syncControllers, refetchControllers }) {
    const [showControllerForm, setShowControllerForm] = useState(false);
    const [editingController, setEditingController] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [controllerToDelete, setControllerToDelete] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    console.log("controllersData", controllersData);

    const validateControllerForm = (name, ip, port) => {
        const errors = {};
        if (!name || !name.trim()) {
            errors.name = "Controller Name is required.";
        }

        const ipTrimmed = (ip || '').trim();
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipTrimmed) {
            errors.ip = "IP Address is required.";
        } else if (!ipv4Regex.test(ipTrimmed)) {
            errors.ip = "Please enter a valid IPv4 address (e.g. 192.168.1.100).";
        }

        const portNum = Number(port);
        if (!port || String(port).trim() === '') {
            errors.port = "Port is required.";
        } else if (isNaN(portNum) || portNum < 1 || portNum > 65535 || !Number.isInteger(portNum)) {
            errors.port = "Port must be a valid number between 1 and 65535.";
        }

        return errors;
    };

    // Expandable controllers state
    const [expandedControllers, setExpandedControllers] = useState({});

    // Dynamic ports state per controller: { [controllerId]: portsArray }
    const [controllerPortsMap, setControllerPortsMap] = useState({});

    // Add Strip Modal state (multi-select dynamic from API)
    const [addStripModalOpen, setAddStripModalOpen] = useState(false);
    const [targetPortInfo, setTargetPortInfo] = useState(null); // { ctrlId, portIndex, portName, channelId }
    const [availableStrips, setAvailableStrips] = useState([]);
    const [isLoadingStrips, setIsLoadingStrips] = useState(false);
    const [isSavingStrips, setIsSavingStrips] = useState(false);
    const [selectedSampleStripIds, setSelectedSampleStripIds] = useState([]);
    const [alreadyAssignedStripIds, setAlreadyAssignedStripIds] = useState([]);

    // Right-side sheet state for simple strip view
    const [selectedPortView, setSelectedPortView] = useState(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isLoadingSheetStrips, setIsLoadingSheetStrips] = useState(false);

    // Edit Channel Modal state
    const [editChannelModalOpen, setEditChannelModalOpen] = useState(false);
    const [editingChannelInfo, setEditingChannelInfo] = useState(null); // { ctrlId, port }
    const [editChannelName, setEditChannelName] = useState('');
    const [isSavingChannel, setIsSavingChannel] = useState(false);

    // Delete Channel state
    const [channelDeleteDialogOpen, setChannelDeleteDialogOpen] = useState(false);
    const [channelToDelete, setChannelToDelete] = useState(null); // { ctrlId, channelId, channelName }
    const [isDeletingChannel, setIsDeletingChannel] = useState(false);

    // Delete Strip confirmation state
    const [stripToDelete, setStripToDelete] = useState(null); // { id, label }
    const [stripDeleteDialogOpen, setStripDeleteDialogOpen] = useState(false);
    const [isDeletingStrip, setIsDeletingStrip] = useState(false);

    const handlePromptDeleteStrip = (stripId, stripLabel) => {
        setStripToDelete({ id: stripId, label: stripLabel || 'LED Strip' });
        setStripDeleteDialogOpen(true);
    };

    const confirmDeleteStrip = async () => {
        if (!stripToDelete) return;
        setIsDeletingStrip(true);
        try {
            await handleRemoveStripFromPort(stripToDelete.id);
            setStripDeleteDialogOpen(false);
            setStripToDelete(null);
        } finally {
            setIsDeletingStrip(false);
        }
    };

    const handleDeleteChannel = (ctrlId, port) => {
        const channelId = port.channel_id || port.id;
        if (!channelId) {
            toast.error("Channel ID not found");
            return;
        }
        setChannelToDelete({ ctrlId, channelId, channelName: port.channel_name || 'Channel' });
        setChannelDeleteDialogOpen(true);
    };

    const confirmDeleteChannel = async () => {
        if (!channelToDelete) return;
        const { ctrlId, channelId, channelName } = channelToDelete;
        setIsDeletingChannel(true);
        const toastId = toast.loading(`Deleting ${channelName}...`);

        try {
            const res = await apiService.deleteChannel(channelId);
            if (res && (res.success === false || res.error)) {
                throw new Error(res.message || res.error || "Failed to delete channel");
            }

            setControllerPortsMap(prev => {
                const list = prev[ctrlId] || [];
                const updatedList = list.filter(item => String(item.channel_id || item.id) !== String(channelId));
                return { ...prev, [ctrlId]: updatedList };
            });

            if (refetchControllers) {
                await refetchControllers();
            }

            toast.success(`Channel "${channelName}" deleted successfully`, { id: toastId });
        } catch (error) {
            console.error("Error deleting channel:", error);
            toast.error(`Failed to delete channel: ${error.message}`, { id: toastId });
        } finally {
            setIsDeletingChannel(false);
            setChannelDeleteDialogOpen(false);
            setChannelToDelete(null);
        }
    };

    const handleOpenEditChannelModal = (ctrlId, port) => {
        setEditingChannelInfo({ ctrlId, port });
        setEditChannelName(port.channel_name || '');
        setEditChannelModalOpen(true);
    };

    const handleSaveChannelName = async () => {
        if (!editingChannelInfo || !editChannelName.trim()) {
            toast.error("Channel name cannot be empty");
            return;
        }
        const { ctrlId, port } = editingChannelInfo;
        const channelId = port.channel_id || port.id;

        if (!channelId) {
            toast.error("Channel ID not found");
            return;
        }

        setIsSavingChannel(true);
        const toastId = toast.loading("Updating channel name...");

        try {
            const payload = {
                channel_name: editChannelName.trim(),
                channel_ledcount: String(port.channel_ledcount || "0"),
                channel_stripcount: String(port.channel_stripcount || "0"),
            };

            const res = await apiService.updateChannel(channelId, payload);

            if (res && (res.success === false || res.error)) {
                throw new Error(res.message || res.error || "Failed to update channel");
            }

            setControllerPortsMap(prev => {
                const list = prev[ctrlId] || [];
                const updatedList = list.map(item =>
                    (String(item.channel_id || item.id) === String(channelId))
                        ? { ...item, channel_name: editChannelName.trim() }
                        : item
                );
                return { ...prev, [ctrlId]: updatedList };
            });

            toast.success("Channel name updated successfully", { id: toastId });
            setEditChannelModalOpen(false);
            setEditingChannelInfo(null);
        } catch (error) {
            console.error("Error updating channel name:", error);
            toast.error(`Failed to update channel: ${error.message}`, { id: toastId });
        } finally {
            setIsSavingChannel(false);
        }
    };

    // Track initializing channels per controller
    const [initializingCtrlIds, setInitializingCtrlIds] = useState({});

    // Function to initialize default channels (e.g., 16 channels) for a controller
    const handleInitializeChannels = async (ctrl) => {
        if (!ctrl || !ctrl.id) return;
        const ctrlId = ctrl.id;
        const count = parseInt(ctrl.channels || ctrl.ctl_channels || 16, 10);

        setInitializingCtrlIds(prev => ({ ...prev, [ctrlId]: true }));
        const toastId = toast.loading(`Initializing ${count} channels for ${ctrl.name || 'Controller'}...`);

        try {
            const createdChannels = [];
            for (let i = 1; i <= count; i++) {
                const num = String(i).padStart(2, '0');
                const channelName = `CHANNEL-${num}`;
                const payload = {
                    channel_name: channelName,
                    channel_ledcount: "0",
                    channel_stripcount: "0",
                    channel_ctl_id: String(ctrlId)
                };

                const cRes = await apiService.createChannel(payload);
                const channelId = cRes?.data?.channel_id || cRes?.channel_id || cRes?.id || Math.random().toString(36).substr(2, 9);
                createdChannels.push({
                    id: channelId,
                    channel_id: channelId,
                    channel_name: channelName,
                    channel_ledcount: 0,
                    channel_stripcount: 0,
                    status: 'Idle',
                    strips: []
                });
            }

            setControllerPortsMap(prev => ({
                ...prev,
                [ctrlId]: createdChannels
            }));

            if (refetchControllers) {
                await refetchControllers();
            }

            toast.success(`Successfully initialized ${createdChannels.length} channels for ${ctrl.name}`, { id: toastId });
        } catch (error) {
            console.error("Error initializing channels:", error);
            toast.error(`Failed to initialize channels: ${error.message}`, { id: toastId });
        } finally {
            setInitializingCtrlIds(prev => ({ ...prev, [ctrlId]: false }));
        }
    };

    const toggleExpandController = async (ctrl) => {
        const ctrlId = typeof ctrl === 'object' ? ctrl.id : ctrl;
        const ctrlObj = typeof ctrl === 'object' ? ctrl : controllersData.find(c => String(c.id) === String(ctrlId));

        setExpandedControllers(prev => {
            return { ...prev, [ctrlId]: !prev[ctrlId] };
        });

        if (!controllerPortsMap[ctrlId]) {
            try {
                const res = await apiService.getChannels(ctrlId);
                const channelsList = res?.data || (Array.isArray(res) ? res : []);

                if (channelsList.length === 0 && ctrlObj) {
                    // When getChannels returns 0 data, automatically run channel initialization function using controller's channel count
                    await handleInitializeChannels(ctrlObj);
                } else {
                    const mappedChannels = channelsList.map(ch => ({
                        ...ch,
                        id: ch.channel_id || ch.id,
                        channel_id: ch.channel_id || ch.id,
                        channel_name: ch.channel_name || ch.name || '',
                        channel_ledcount: parseInt(ch.channel_ledcount || 0, 10),
                        channel_stripcount: parseInt(ch.channel_stripcount || 0, 10),
                        status: parseInt(ch.channel_stripcount || 0, 10) > 0 ? 'Active' : 'Idle',
                        strips: ch.strips || []
                    }));
                    setControllerPortsMap(prev => ({
                        ...prev,
                        [ctrlId]: mappedChannels
                    }));
                }
            } catch (error) {
                console.error("Error fetching channels:", error);
                toast.error("Failed to fetch channels");
            }
        }
    };


    const handleAddChannel = async (ctrlId, limit) => {
        const currentChannels = controllerPortsMap[ctrlId] || [];
        // if (currentChannels.length >= limit) {
        //     toast.error(`Channel limit of ${limit} reached.`);
        //     return;
        // }

        const num = String(currentChannels.length + 1).padStart(2, '0');
        const channelName = `CHANNEL-${num}`;

        try {
            const payload = {
                channel_name: channelName,
                channel_ledcount: "0",
                channel_stripcount: "0",
                channel_ctl_id: String(ctrlId)
            };

            const res = await apiService.createChannel(payload);
            const channelId = res?.data?.channel_id || res?.channel_id || res?.id || Math.random().toString(36).substr(2, 9);

            const newChannel = {
                id: channelId,
                channel_name: channelName,
                channel_ledcount: 0,
                channel_stripcount: 0,
                strips: []
            };

            setControllerPortsMap(prev => {
                const prevChannels = prev[ctrlId] || [];
                return {
                    ...prev,
                    [ctrlId]: [...prevChannels, newChannel]
                };
            });

            if (refetchControllers) {
                await refetchControllers();
            }

            toast.success(`Added ${channelName} successfully.`);
        } catch (error) {
            console.error("Error creating channel:", error);
            toast.error(`Failed to create channel: ${error.message}`);
        }
    };

    // Open Add Strip Modal & fetch strips from API matching strip_ctl_id and identify assigned channel strips
    const handleOpenAddStripModal = async (ctrlId, portIndex, portObjParam) => {
        const portObj = typeof portObjParam === 'object' ? portObjParam : { channel_name: portObjParam };
        let channelId = portObj.channel_id || portObj.id;

        if (!channelId) {
            let ctrlChannels = controllerPortsMap[ctrlId];
            if (!ctrlChannels || ctrlChannels.length === 0) {
                try {
                    const res = await apiService.getChannels(ctrlId);
                    ctrlChannels = res?.data || (Array.isArray(res) ? res : []);
                } catch (e) { }
            }
            const matchedCh = (ctrlChannels || []).find(ch =>
                String(ch.channel_name || '').toUpperCase() === (portObj.channel_name || '').toUpperCase() ||
                String(ch.channel_name || '').toUpperCase() === `CHANNEL-${String(portIndex + 1).padStart(2, '0')}`.toUpperCase()
            ) || (ctrlChannels || [])[portIndex];

            channelId = matchedCh?.channel_id || matchedCh?.id || (portObj.channel_name ? portObj.channel_name.replace('CHANNEL-', '') : null);
        }

        const portName = portObj.channel_name || `Port #${portIndex + 1}`;

        setTargetPortInfo({ ctrlId, portIndex, portName, channelId });
        setSelectedSampleStripIds([]);
        setAlreadyAssignedStripIds([]);
        setAddStripModalOpen(true);
        setIsLoadingStrips(true);

        try {
            let locId = 'All';
            const selectedLocationStr = localStorage.getItem('selectedLocation');
            if (selectedLocationStr) {
                try {
                    const selectedLocation = JSON.parse(selectedLocationStr);
                    if (selectedLocation.phr_location_id) {
                        locId = String(selectedLocation.phr_location_id);
                    }
                } catch (e) { }
            }

            // 1. Fetch strips matching controller ctl_id
            const res = await apiService.getStrips(locId);
            const allStrips = res?.data || (Array.isArray(res) ? res : []);

            const matchingStrips = allStrips.filter(s =>
                s.strip_ctl_id !== undefined &&
                s.strip_ctl_id !== null &&
                String(s.strip_ctl_id).trim() === String(ctrlId).trim()
            );

            setAvailableStrips(matchingStrips);

            // 2. Fetch assigned channel strips from GET API to identify already assigned strips
            if (channelId) {
                try {
                    const csRes = await apiService.getChannelStrips(channelId, ctrlId);
                    const csData = csRes?.data || (Array.isArray(csRes) ? csRes : []);
                    const alreadyAssignedIds = csData.map(cs => String(cs.strip_id || cs.id || cs.stripId));
                    setAlreadyAssignedStripIds(alreadyAssignedIds);
                } catch (err) {
                    console.error("Error fetching assigned channel strips:", err);
                }
            }
        } catch (error) {
            console.error("Error fetching strips for controller:", error);
            toast.error("Failed to load strips from API");
            setAvailableStrips([]);
        } finally {
            setIsLoadingStrips(false);
        }
    };

    // Multi-select toggle for strips (only unassigned strips can be toggled)
    const toggleSelectSampleStrip = (id) => {
        if (alreadyAssignedStripIds.includes(id)) return;
        setSelectedSampleStripIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllStrips = () => {
        const unassignedStrips = availableStrips.filter(s => !alreadyAssignedStripIds.includes(String(s.strip_id || s.id)));
        if (selectedSampleStripIds.length === unassignedStrips.length) {
            setSelectedSampleStripIds([]);
        } else {
            setSelectedSampleStripIds(unassignedStrips.map(s => String(s.strip_id || s.id)));
        }
    };

    // Submit Add Multiple Strips from Modal by calling POST API create-channelstrip ONLY for newly selected strips
    const handleAddStripSubmit = async () => {
        if (!targetPortInfo || selectedSampleStripIds.length === 0) {
            toast.error("Please select at least one strip to add.");
            return;
        }
        const { ctrlId, portIndex, portName, channelId } = targetPortInfo;
        setIsSavingStrips(true);
        const toastId = toast.loading(`Saving channel strip assignments...`);

        try {
            // Filter to ONLY newly selected strips that aren't already assigned
            const selectedStripsData = availableStrips.filter(s =>
                selectedSampleStripIds.includes(String(s.strip_id || s.id)) &&
                !alreadyAssignedStripIds.includes(String(s.strip_id || s.id))
            );

            if (selectedStripsData.length === 0) {
                toast.error("Selected strips are already assigned.", { id: toastId });
                setIsSavingStrips(false);
                return;
            }

            let effectiveChannelId = channelId;
            if (!effectiveChannelId || String(effectiveChannelId).length <= 2) {
                let channelsList = controllerPortsMap[ctrlId];
                if (!channelsList || channelsList.length === 0) {
                    try {
                        const res = await apiService.getChannels(ctrlId);
                        channelsList = res?.data || (Array.isArray(res) ? res : []);
                    } catch (e) { }
                }
                const targetCh = (channelsList || []).find(ch =>
                    String(ch.channel_id || ch.id) === String(effectiveChannelId) ||
                    String(ch.channel_name || '').toUpperCase() === String(portName || '').toUpperCase() ||
                    String(ch.channel_name || '').toUpperCase() === `CHANNEL-${String(portIndex + 1).padStart(2, '0')}`.toUpperCase()
                ) || (channelsList || [])[portIndex];

                if (targetCh && (targetCh.channel_id || targetCh.id)) {
                    effectiveChannelId = targetCh.channel_id || targetCh.id;
                }
            }

            if (!effectiveChannelId) effectiveChannelId = '1';

            // Call POST API /config/create-channelstrip ONLY for newly selected strips
            for (let idx = 0; idx < selectedStripsData.length; idx++) {
                const sObj = selectedStripsData[idx];
                const stripIdStr = String(sObj.strip_id || sObj.id);

                const payload = {
                    strip_id: stripIdStr,
                    channel_id: String(effectiveChannelId),
                    strip_order: String(alreadyAssignedStripIds.length + idx + 1),
                    ctl_id: String(selectedControllerForStrips?.id || selectedControllerForStrips?.ctl_id || '')
                };

                await apiService.createChannelStrip(payload);
            }

            const addedStripItems = selectedStripsData.map((s, idx) => {
                const stripIdStr = String(s.strip_id || s.id || `strip-${Date.now()}-${idx}`);
                const ledWidth = parseInt(s.strip_width || s.ledCount || 6, 10);
                return {
                    id: stripIdStr,
                    label: s.strip_name || `Strip #${stripIdStr}`,
                    ledCount: !isNaN(ledWidth) && ledWidth > 0 ? ledWidth : 6,
                    shelf: s.strip_shelf_id ? `Shelf ${s.strip_shelf_id}` : 'Shelf 1',
                    linkedBins: Array.isArray(s.bin_list) ? s.bin_list.length : 0,
                    strip_ctl_id: s.strip_ctl_id,
                    strip_cupboard_id: s.strip_cupboard_id,
                    strip_shelf_id: s.strip_shelf_id
                };
            });

            setControllerPortsMap(prev => {
                const currentPorts = prev[ctrlId] || [];
                const updatedPorts = currentPorts.map((p, idx) => {
                    if (idx !== portIndex) return p;
                    const existingStrips = p.strips || [];
                    const existingIds = new Set(existingStrips.map(st => String(st.id)));
                    const filteredNew = addedStripItems.filter(st => !existingIds.has(String(st.id)));
                    const combined = [...existingStrips, ...filteredNew];
                    return {
                        ...p,
                        strips: combined,
                        channel_stripcount: combined.length,
                        channel_ledcount: combined.reduce((acc, st) => acc + st.ledCount, 0),
                        status: combined.length > 0 ? 'Active' : 'Idle'
                    };
                });

                if (selectedPortView && selectedPortView.ctrlId === ctrlId && selectedPortView.portIndex === portIndex) {
                    setSelectedPortView(sp => {
                        const existingIds = new Set((sp.strips || []).map(st => String(st.id)));
                        const filteredNew = addedStripItems.filter(st => !existingIds.has(String(st.id)));
                        return {
                            ...sp,
                            strips: [...(sp.strips || []), ...filteredNew]
                        };
                    });
                }

                return { ...prev, [ctrlId]: updatedPorts };
            });

            toast.success(`Assigned ${selectedStripsData.length} strip(s) to ${portName}`, { id: toastId });
            setSelectedSampleStripIds([]);
            setAlreadyAssignedStripIds([]);
            setAddStripModalOpen(false);
            setTargetPortInfo(null);
        } catch (error) {
            console.error("Error creating channel strip assignments:", error);
            toast.error(`Failed to assign strips: ${error.message}`, { id: toastId });
        } finally {
            setIsSavingStrips(false);
        }
    };

    // Open View Sheet & fetch assigned strips from GET API get-channelstrip-channelid
    const handleOpenStripSheet = async (ctrl, portIndex, portObjParam) => {
        const ctrlPorts = controllerPortsMap[ctrl.id] || [];
        const portObj = portObjParam || ctrlPorts[portIndex];
        if (!portObj) return;

        let channelId = portObj.channel_id || portObj.id;
        if (!channelId || String(channelId).length <= 2) {
            let ctrlChannels = controllerPortsMap[ctrl.id];
            if (!ctrlChannels || ctrlChannels.length === 0) {
                try {
                    const res = await apiService.getChannels(ctrl.id);
                    ctrlChannels = res?.data || (Array.isArray(res) ? res : []);
                } catch (e) { }
            }
            const matchedCh = (ctrlChannels || []).find(ch =>
                String(ch.channel_name || '').toUpperCase() === (portObj.channel_name || '').toUpperCase() ||
                String(ch.channel_name || '').toUpperCase() === `CHANNEL-${String(portIndex + 1).padStart(2, '0')}`.toUpperCase()
            ) || (ctrlChannels || [])[portIndex];

            channelId = matchedCh?.channel_id || matchedCh?.id || (portObj.channel_name ? portObj.channel_name.replace('CHANNEL-', '') : '1');
        }

        setSelectedPortView({
            ctrlId: ctrl.id,
            portIndex: portIndex,
            controllerName: ctrl.name,
            portName: portObj.channel_name,
            channelId: channelId,
            strips: []
        });
        setIsSheetOpen(true);
        setIsLoadingSheetStrips(true);

        try {
            let locId = 'All';
            const selectedLocationStr = localStorage.getItem('selectedLocation');
            if (selectedLocationStr) {
                try {
                    const selectedLocation = JSON.parse(selectedLocationStr);
                    if (selectedLocation.phr_location_id) {
                        locId = String(selectedLocation.phr_location_id);
                    }
                } catch (e) { }
            }

            // 1. Fetch channel strip mappings from GET API
            const csRes = await apiService.getChannelStrips(channelId, activeViewPort?.ctl_id || activeViewPort?.controller_id);
            const csList = csRes?.data || (Array.isArray(csRes) ? csRes : []);

            // 2. Fetch full strips to enrich names, LEDs, shelves, bins
            const stripsRes = await apiService.getStrips(locId);
            const allStrips = stripsRes?.data || (Array.isArray(stripsRes) ? stripsRes : []);

            const mappedStrips = csList.map((cs, idx) => {
                const csStripId = String(cs.strip_id || cs.id || cs.stripId);
                const matched = allStrips.find(s => String(s.strip_id || s.id) === csStripId);
                const ledWidth = parseInt(matched?.strip_width || cs.strip_width || 6, 10);
                const binCount = Array.isArray(matched?.bin_list) ? matched.bin_list.length : 0;

                return {
                    id: csStripId,
                    label: matched?.strip_name || cs.strip_name || `Strip ${csStripId}`,
                    ledCount: !isNaN(ledWidth) && ledWidth > 0 ? ledWidth : 6,
                    shelf: matched?.strip_shelf_id ? `Shelf ${matched.strip_shelf_id}` : (cs.strip_shelf_id ? `Shelf ${cs.strip_shelf_id}` : 'Shelf 1'),
                    linkedBins: binCount,
                    strip_order: cs.strip_order || String(idx + 1)
                };
            });

            setSelectedPortView(sp => ({
                ...sp,
                strips: mappedStrips
            }));
        } catch (error) {
            console.error("Error fetching channel strips for view:", error);
            toast.error("Failed to load channel strips list");
        } finally {
            setIsLoadingSheetStrips(false);
        }
    };

    // Delete strip from sheet list using API
    const handleRemoveStripFromPort = async (stripId) => {
        if (!selectedPortView) return;
        const { ctrlId, portIndex } = selectedPortView;
        const toastId = toast.loading("Deleting strip via API...");

        try {
            if (stripId && !String(stripId).startsWith('local-') && !String(stripId).startsWith('sample-')) {
                await apiService.deleteStrip(stripId);
            }

            setControllerPortsMap(prev => {
                const currentPorts = prev[ctrlId] || [];
                const updatedPorts = currentPorts.map((p, idx) => {
                    if (idx !== portIndex) return p;
                    const nextStrips = (p.strips || []).filter(s => String(s.id) !== String(stripId));
                    return {
                        ...p,
                        strips: nextStrips,
                        channel_stripcount: nextStrips.length,
                        channel_ledcount: nextStrips.reduce((acc, s) => acc + (s.ledCount || 0), 0),
                        status: nextStrips.length > 0 ? 'Active' : 'Idle'
                    };
                });

                setSelectedPortView(sp => ({
                    ...sp,
                    strips: sp.strips.filter(s => String(s.id) !== String(stripId))
                }));

                return { ...prev, [ctrlId]: updatedPorts };
            });

            toast.success("Strip deleted successfully from API", { id: toastId });
        } catch (error) {
            console.error("Error deleting strip:", error);
            toast.error(`Failed to delete strip: ${error.message}`, { id: toastId });
        }
    };

    const handleAddController = () => {
        setEditingController(null);
        setFormErrors({});
        setShowControllerForm(true);
    };

    const handleEditController = (ctrl) => {
        setEditingController(ctrl);
        setFormErrors({});
        setShowControllerForm(true);
    };

    const handleCancelForm = () => {
        setShowControllerForm(false);
        setEditingController(null);
        setFormErrors({});
    };

    const handleControllerSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = (data.get('name') || '').trim();
        const ip = (data.get('ip') || '').trim();
        const port = (data.get('port') || '').trim();
        const channels = parseInt(data.get('channels') || '16', 10);
        const status = data.get('status') === 'ACTIVE' ? 'Online' : 'Offline';

        const errors = validateControllerForm(name, ip, port);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            const firstErrKey = Object.keys(errors)[0];
            toast.error(errors[firstErrKey]);
            return;
        }

        setFormErrors({});

        if (editingController) {
            try {
                let ctl_loc_id = '';
                const selectedLocationStr = localStorage.getItem('selectedLocation');
                if (selectedLocationStr) {
                    try {
                        const selectedLocation = JSON.parse(selectedLocationStr);
                        ctl_loc_id = String(selectedLocation.phr_location_id || '');
                    } catch (e) { }
                }

                const payload = {
                    ctl_name: name,
                    ctl_ip: ip,
                    ctl_port: parseInt(port, 10),
                    ctl_loc_id: ctl_loc_id,
                    ctl_channels: String(channels),
                    ctl_position: editingController.ctl_position || editingController.position || "none",
                    ctl_status: status === 'Online' ? "True" : "False"
                };

                await apiService.updateController(editingController.id, payload);

                const updated = controllersData.map(c =>
                    c.id === editingController.id ? { ...c, name, ip, port, channels, status } : c
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
            const toastId = toast.loading("Adding controller and channels...");
            try {
                let ctl_loc_id = '';
                const selectedLocationStr = localStorage.getItem('selectedLocation');
                if (selectedLocationStr) {
                    try {
                        const selectedLocation = JSON.parse(selectedLocationStr);
                        ctl_loc_id = String(selectedLocation.phr_location_id || '');
                    } catch (e) { }
                }

                const payload = {
                    ctl_name: name,
                    ctl_ip: ip,
                    ctl_port: parseInt(port, 10),
                    ctl_loc_id: ctl_loc_id,
                    ctl_channels: String(channels),
                    ctl_position: "none",
                    ctl_status: status === 'Online' ? "True" : "False"
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

                // Create initial channels based on the channel count
                const createdChannels = [];
                for (let i = 1; i <= channels; i++) {
                    const num = String(i).padStart(2, '0');
                    const channelName = `CHANNEL-${num}`;
                    const channelPayload = {
                        channel_name: channelName,
                        channel_ledcount: "0",
                        channel_stripcount: "0",
                        channel_ctl_id: String(newId)
                    };

                    try {
                        const cRes = await apiService.createChannel(channelPayload);
                        const channelId = cRes?.data?.channel_id || cRes?.channel_id || cRes?.id || Math.random().toString(36).substr(2, 9);
                        createdChannels.push({
                            id: channelId,
                            channel_name: channelName,
                            channel_ledcount: 0,
                            channel_stripcount: 0,
                            strips: []
                        });
                    } catch (err) {
                        console.error("Error creating channel during controller init:", err);
                    }
                }

                setControllerPortsMap(prev => ({
                    ...prev,
                    [newId]: createdChannels
                }));

                const newCtrl = {
                    id: newId,
                    name: name,
                    ip: ip,
                    port: parseInt(port, 10),
                    channels: channels,
                    status: status
                };
                syncControllers([...controllersData, newCtrl]);
                setShowControllerForm(false);
                toast.success(`Controller added with ${channels} channels successfully`, { id: toastId });
            } catch (error) {
                console.error("Error adding controller:", error);
                toast.error(`Failed to add controller: ${error.message}`, { id: toastId });
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
                                    <Input
                                        name="name"
                                        defaultValue={editingController ? editingController.name : ''}
                                        placeholder="e.g. Controller A"
                                        className={cn(
                                            "bg-ot-surface-bottom border-ot-border text-white placeholder:text-slate-400 placeholder:opacity-90",
                                            formErrors.name && "border-red-500 focus-visible:ring-red-500"
                                        )}
                                        onChange={() => {
                                            if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                                        }}
                                    />
                                    {formErrors.name && (
                                        <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">IP Address</label>
                                    <Input
                                        name="ip"
                                        defaultValue={editingController ? editingController.ip : ''}
                                        placeholder="e.g.192.168.1.100"
                                        className={cn(
                                            "bg-ot-surface-bottom border-ot-border text-white font-mono placeholder:text-slate-400 placeholder:opacity-90",
                                            formErrors.ip && "border-red-500 focus-visible:ring-red-500"
                                        )}
                                        onChange={() => {
                                            if (formErrors.ip) setFormErrors(prev => ({ ...prev, ip: null }));
                                        }}
                                    />
                                    {formErrors.ip && (
                                        <p className="text-xs text-red-400 mt-1">{formErrors.ip}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Port</label>
                                    <Input
                                        name="port"
                                        defaultValue={editingController ? editingController.port : ''}
                                        placeholder="e.g. 8080"
                                        className={cn(
                                            "bg-ot-surface-bottom border-ot-border text-white font-mono placeholder:text-slate-400 placeholder:opacity-90",
                                            formErrors.port && "border-red-500 focus-visible:ring-red-500"
                                        )}
                                        onChange={() => {
                                            if (formErrors.port) setFormErrors(prev => ({ ...prev, port: null }));
                                        }}
                                    />
                                    {formErrors.port && (
                                        <p className="text-xs text-red-400 mt-1">{formErrors.port}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Channels</label>
                                    <Input name="channels" type="number" defaultValue={editingController ? (editingController.channels || editingController.ctl_channels || 16) : 16} placeholder="16" className="bg-ot-surface-bottom border-ot-border opacity-50 cursor-not-allowed text-white placeholder:text-slate-400" readOnly />
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
                            <TableHead className="font-semibold">Channels</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {controllersData.map((ctrl) => {
                            const isExpanded = !!expandedControllers[ctrl.id];
                            const portsList = controllerPortsMap[ctrl.id] || [];
                            const portsCount = parseInt(ctrl.channels ?? ctrl.ctl_channels ?? 0, 10);

                            return (
                                <React.Fragment key={ctrl.id}>
                                    <TableRow className={cn("transition-colors hover:bg-ot-surface-top/40 align-middle", isExpanded && "bg-ot-surface-top/30 border-b-0")}>
                                        <TableCell className="text-center p-2 align-middle">
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
                                        <TableCell className="font-medium text-white align-middle">
                                            <div className="flex items-center gap-2">
                                                <Cpu className="w-4 h-4 text-ot-action shrink-0" />
                                                <span>{ctrl.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-mono text-xs align-middle">{ctrl.ip}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs font-mono align-middle">{ctrl.port}</TableCell>
                                        <TableCell className="font-mono text-xs text-ot-action font-semibold align-middle">
                                            <span className="inline-block px-2 py-0.5 rounded bg-ot-surface-bottom border border-ot-border/50">
                                                {portsCount} Channels
                                            </span>
                                        </TableCell>
                                        <TableCell className="align-middle">
                                            <span className={cn(
                                                "inline-block px-2 py-0.5 text-xs rounded-full border font-medium",
                                                ctrl.status === 'Online'
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                            )}>
                                                {ctrl.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right align-middle">
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
                                                            Controller Channels ({portsList.length} Channels)
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleAddChannel(ctrl.id, portsCount || 16)}
                                                                className="h-6 text-[10px] bg-ot-action/10 text-ot-action border-ot-action/30 hover:bg-ot-action/20"
                                                            >
                                                                <Plus className="w-3 h-3 mr-1" /> Add Channel
                                                            </Button>
                                                            <span className="text-[10px] text-muted-foreground font-mono bg-ot-surface-elev-bottom px-2 py-0.5 rounded border border-ot-border/40">
                                                                Limit: {portsCount || 16} Channels
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Scrollable Container with Max Height */}
                                                    <div className="max-h-64 overflow-y-auto border border-ot-border/40 rounded-md bg-ot-surface-bottom/40">
                                                        <Table className="text-xs">
                                                            <TableHeader className="sticky top-0 bg-ot-surface-elev-bottom z-10">
                                                                <TableRow className="border-b border-ot-border/40 hover:bg-transparent">
                                                                    <TableHead className="text-muted-foreground font-semibold uppercase text-[10px] py-2">channel_name</TableHead>
                                                                    <TableHead className="text-muted-foreground font-semibold uppercase text-[10px] py-2">led_count</TableHead>
                                                                    <TableHead className="text-muted-foreground font-semibold uppercase text-[10px] py-2">strip_count</TableHead>
                                                                    <TableHead className="text-right text-muted-foreground font-semibold uppercase text-[10px] py-2">actions</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {portsList.length === 0 ? (
                                                                    <TableRow>
                                                                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs">
                                                                            No channels added yet. Click <span className="text-ot-action font-semibold">"Add Channel"</span> to create a channel.
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ) : (
                                                                    portsList.map((port, pIdx) => (
                                                                        <TableRow key={pIdx} className="border-b border-ot-border/20 hover:bg-ot-surface-top/30 transition-colors">
                                                                            <TableCell className="font-mono font-semibold text-white py-2">
                                                                                <span className="px-2 py-0.5 rounded bg-ot-surface-elev-top/50 text-ot-action border border-ot-border/50">
                                                                                    {port.channel_name}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="text-muted-foreground py-2 font-mono text-xs">
                                                                                <span className="px-2 py-0.5 rounded bg-ot-surface-bottom border border-ot-border/40">
                                                                                    {port.channel_ledcount} LEDs
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="text-muted-foreground py-2 font-mono text-xs">
                                                                                <span className="px-2 py-0.5 rounded bg-ot-surface-bottom border border-ot-border/40">
                                                                                    {port.channel_stripcount} Strips
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="text-right py-2 space-x-2 flex justify-end">
                                                                                {/* Edit Icon Button */}
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleOpenEditChannelModal(ctrl.id, port)}
                                                                                    className="h-7 px-2 text-xs text-ot-action hover:bg-ot-action/15 border border-ot-action/30 rounded"
                                                                                    title="Edit Channel"
                                                                                >
                                                                                    <PenSquare className="w-3.5 h-3.5" />
                                                                                </Button>

                                                                                {/* Delete Icon Button */}
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleDeleteChannel(ctrl.id, port)}
                                                                                    className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/15 border border-red-500/30 rounded"
                                                                                    title="Delete Channel"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )))}
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
                <DialogContent
                    onPointerDownOutside={(e) => e.preventDefault()}
                    className="sm:max-w-lg bg-ot-surface-top border-ot-border text-white shadow-2xl"
                >
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
                            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                Controller Strips ({availableStrips.length}):
                            </span>
                            {!isLoadingStrips && availableStrips.filter(s => !alreadyAssignedStripIds.includes(String(s.strip_id || s.id))).length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSelectAllStrips}
                                    className="h-7 px-2 text-xs text-ot-action hover:bg-ot-action/10"
                                >
                                    {selectedSampleStripIds.length === availableStrips.filter(s => !alreadyAssignedStripIds.includes(String(s.strip_id || s.id))).length ? 'Deselect All' : 'Select All'}
                                </Button>
                            )}
                        </div>

                        {isLoadingStrips ? (
                            <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-ot-action" />
                                <span>Loading strips from API...</span>
                            </div>
                        ) : availableStrips.length === 0 ? (
                            <div className="py-10 px-4 text-center text-sm text-muted-foreground bg-ot-surface-bottom/60 border border-ot-border/40 rounded-xl space-y-1">
                                <p className="font-semibold text-white">No matching strips found</p>
                                <p className="text-xs">No strips found matching strip_ctl_id = <span className="font-mono text-ot-action">{targetPortInfo?.ctrlId}</span>.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                {availableStrips.map((opt) => {
                                    const stripIdStr = String(opt.strip_id || opt.id);
                                    const isAlreadyAssigned = alreadyAssignedStripIds.includes(stripIdStr);
                                    const isSelected = selectedSampleStripIds.includes(stripIdStr);
                                    const shelfName = opt.strip_shelf_id ? `Shelf ${opt.strip_shelf_id}` : 'Shelf 1';
                                    const binCount = Array.isArray(opt.bin_list) ? opt.bin_list.length : 0;
                                    const ledWidth = parseInt(opt.strip_width || opt.ledCount || 6, 10);
                                    const displayLeds = isNaN(ledWidth) || ledWidth <= 0 ? 6 : ledWidth;

                                    return (
                                        <div
                                            key={stripIdStr}
                                            onClick={() => toggleSelectSampleStrip(stripIdStr)}
                                            className={cn(
                                                "p-3.5 rounded-xl border transition-all flex items-center justify-between group",
                                                isAlreadyAssigned
                                                    ? "bg-ot-surface-bottom/40 border-ot-border/40 opacity-60 cursor-not-allowed"
                                                    : isSelected
                                                        ? "bg-ot-surface-elev-top/80 border-ot-action shadow-[0_0_12px_rgba(95,166,255,0.15)] cursor-pointer"
                                                        : "bg-ot-surface-bottom border-ot-border/60 text-muted-foreground hover:border-ot-action/50 hover:bg-ot-surface-bottom/80 cursor-pointer"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0",
                                                    isAlreadyAssigned
                                                        ? "bg-ot-surface-top border-ot-border/60 text-muted-foreground"
                                                        : isSelected
                                                            ? "bg-ot-action border-ot-action text-white"
                                                            : "border-ot-border bg-ot-surface-bottom group-hover:border-ot-action/60"
                                                )}>
                                                    {isAlreadyAssigned ? (
                                                        <Check className="w-3.5 h-3.5 text-muted-foreground stroke-[2]" />
                                                    ) : isSelected ? (
                                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                    ) : null}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-white group-hover:text-ot-action transition-colors">
                                                            {opt.strip_name || `Strip ${stripIdStr}`}
                                                        </span>
                                                        {isAlreadyAssigned && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 border border-slate-600/40">
                                                                Already Added
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        Assigned to <span className="text-slate-300 font-medium">{shelfName}</span> • <span className="text-ot-action font-mono">{binCount} Bins Linked</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-ot-surface-elev-bottom border border-ot-border/60 text-ot-action shrink-0">
                                                {displayLeds} LEDs
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 pt-2 border-t border-ot-border/40">

                        <Button
                            onClick={handleAddStripSubmit}
                            disabled={selectedSampleStripIds.length === 0 || isLoadingStrips || isSavingStrips}
                            className="bg-ot-action hover:bg-ot-action-hover text-white font-bold text-xs gap-1.5"
                        >
                            {isSavingStrips ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Add Selected ({selectedSampleStripIds.length})
                                </>
                            )}
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

                        {/* Sheet Body: Simple Clean List from GET API */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                Connected Strips ({selectedPortView.strips.length})
                            </div>

                            {isLoadingSheetStrips ? (
                                <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin text-ot-action" />
                                    <span>Loading channel strips from API...</span>
                                </div>
                            ) : selectedPortView.strips.length === 0 ? (
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
                                                {strip.shelf || '-'} ({strip.linkedBins || 0} Bins)
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePromptDeleteStrip(strip.id, strip.label)}
                                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                            title="Delete Strip"
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

            {/* Edit Channel Name Dialog */}
            <Dialog open={editChannelModalOpen} onOpenChange={setEditChannelModalOpen}>
                <DialogContent
                    onPointerDownOutside={(e) => e.preventDefault()}
                    className="sm:max-w-md bg-ot-surface-bottom border-ot-border text-white"
                >
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <PenSquare className="w-4 h-4 text-ot-action" />
                            Edit Channel Name
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="channelNameInput" className="text-xs font-semibold text-muted-foreground uppercase block">
                                Channel Name
                            </label>
                            <Input
                                id="channelNameInput"
                                value={editChannelName}
                                onChange={(e) => setEditChannelName(e.target.value)}
                                placeholder="Enter channel name"
                                className="bg-ot-surface-top border-ot-border text-white focus:border-ot-action"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">

                        <Button
                            onClick={handleSaveChannelName}
                            disabled={isSavingChannel || !editChannelName.trim()}
                            className="bg-ot-action hover:bg-ot-action-hover text-white font-bold"
                        >
                            {isSavingChannel ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

            <ConfirmDialog
                open={channelDeleteDialogOpen}
                onOpenChange={setChannelDeleteDialogOpen}
                title="Delete Channel"
                description={`Are you sure you want to delete ${channelToDelete?.channelName || 'this channel'}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                isLoading={isDeletingChannel}
                onConfirm={confirmDeleteChannel}
                onCancel={() => setChannelToDelete(null)}
            />

            <ConfirmDialog
                open={stripDeleteDialogOpen}
                onOpenChange={setStripDeleteDialogOpen}
                title="Delete Strip"
                description={`Are you sure you want to delete ${stripToDelete?.label || 'this LED strip'}? This action cannot be undone and will delete the strip via API.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                isLoading={isDeletingStrip}
                onConfirm={confirmDeleteStrip}
                onCancel={() => setStripToDelete(null)}
            />
        </div>
    );
}

