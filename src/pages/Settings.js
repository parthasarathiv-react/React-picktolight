import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Server, Box, LayoutGrid, Layers, Archive, Lightbulb, Loader2, Palette } from 'lucide-react';
import { cn } from 'lib/utils';
import { useOutletContext } from 'react-router-dom';
import { apiService } from 'lib/apiService';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import {
    CONTROLLERS_CONFIG,
    WALLS_CONFIG,
    CUPBOARDS_CONFIG
} from 'lib/dataStore';

import ControllersTab from 'components/settings/ControllersTab';
import WallsTab from 'components/settings/WallsTab';
import WallLayoutDesigner from 'components/settings/WallLayoutDesigner';
import CupboardsTab from 'components/settings/CupboardsTab';
import ShelvesTab from 'components/settings/ShelvesTab';
import BinsTab from 'components/settings/BinsTab';
import LedSetupTab from 'components/settings/LedSetupTab';
import LedStripsTab from 'components/settings/LedStripsTab';

export default function Settings() {
    const { setSidebarOpen } = useOutletContext() || {};
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('settings_active_tab') || 'controllers';
    });

    const [isLedDesignerActive, setIsLedDesignerActive] = useState(false);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        localStorage.setItem('settings_active_tab', tabId);
        setSelectedController(null);
        setSelectedWallForCupboards(null);
        setSelectedCupboardForShelves(null);
        setSelectedShelfForBins(null);
        setSelectedCupboardForLeds(null);
        if (tabId === 'leds') {
            setIsLedDesignerActive(false);
        }
    };

    const [controllersData, setControllersData] = useState([]);
    const [wallsData, setWallsData] = useState([]);
    const [cupboardsData, setCupboardsData] = useState([...CUPBOARDS_CONFIG]);
    const locId = React.useMemo(() => {
        try {
            const selectedLocationStr = localStorage.getItem('selectedLocation');
            if (selectedLocationStr) {
                const loc = JSON.parse(selectedLocationStr);
                return loc.pick_location_id || '';
            }
        } catch (e) { }
        return '';
    }, []);

    const { data: fetchedControllers, isFetching: isFetchingControllers, error: errorControllers, refetch: refetchControllers } = useQuery({
        queryKey: ['controllers', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getControllers(locId);
            if (!data.success || !data.data) throw new Error("Failed to fetch controllers");
            return data.data.map(c => ({
                id: c.ctl_id || c.id || Math.random().toString(36).substr(2, 9),
                name: c.ctl_name,
                ip: c.ctl_ip,
                port: c.ctl_port,
                channels: c.ctl_channels || 16,
                status: (c.ctl_status === 'True' || c.ctl_status === true || c.ctl_status === 'Online') ? 'Online' : 'Offline'
            }));
        },
        enabled: !!locId,
    });

    const shouldFetchWalls = ['walls', 'cupboards', 'shelves', 'bins', 'led-setup', 'leds'].includes(activeTab);
    const { data: rawWalls, isFetching: isFetchingWalls, error: errorWalls } = useQuery({
        queryKey: ['walls', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getWalls(locId);
            if (!data.success || !data.data) throw new Error("Failed to fetch walls");
            return data.data;
        },
        enabled: !!locId && shouldFetchWalls,
    });

    const shouldFetchCupboards = ['cupboards', 'shelves', 'bins', 'led-setup', 'leds'].includes(activeTab);
    const { data: rawCupboards, isFetching: isFetchingCupboards, error: errorCupboards } = useQuery({
        queryKey: ['cupboards', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getCupboards(locId);
            if (!data.success || !data.data) throw new Error("Failed to fetch cupboards");
            return data.data;
        },
        enabled: !!locId && shouldFetchCupboards,
    });

    const shouldFetchShelves = ['shelves', 'bins', 'leds'].includes(activeTab);
    const { data: rawShelves, isFetching: isFetchingShelves, error: errorShelves, refetch: refetchShelves } = useQuery({
        queryKey: ['shelves', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getShelves(locId);
            if (!data.success || !data.data) throw new Error("Failed to fetch shelves");
            return data.data;
        },
        enabled: !!locId && shouldFetchShelves,
    });

    const shouldFetchBins = ['bins', 'leds'].includes(activeTab);
    const { data: rawBins, isFetching: isFetchingBins, error: errorBins, refetch: refetchBins } = useQuery({
        queryKey: ['bins', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getBins(locId, 'All');
            if (!data.success || !data.data) throw new Error("Failed to fetch bins");
            return data.data;
        },
        enabled: !!locId && shouldFetchBins,
    });

    const rawStrips = [];
    const isFetchingStrips = false;
    const errorStrips = null;
    const refetchStrips = () => {};

    useEffect(() => {
        if (fetchedControllers) {
            setControllersData(prev => {
                if (JSON.stringify(prev) === JSON.stringify(fetchedControllers)) return prev;
                return fetchedControllers;
            });
        }
    }, [fetchedControllers]);

    useEffect(() => {
        if (rawWalls && fetchedControllers) {
            const mapped = rawWalls.map(w => {
                const ctrl = fetchedControllers.find(c => String(c.id) === String(w.wall_ctl_id));
                return {
                    id: w.wall_id,
                    name: w.wall_name,
                    controller: ctrl ? ctrl.name : w.wall_ctl_id,
                    controller_id: w.wall_ctl_id,
                    status: (w.wall_status === 'True' || w.wall_status === true || w.wall_status === 'Active') ? 'Active' : 'Inactive',
                    gridX: parseInt(w.wall_gridx, 10) || 0,
                    gridY: parseInt(w.wall_gridy, 10) || 0,
                    orientation: w.wall_orientation || 'h',
                    cupboardsCount: 4
                };
            });
            setWallsData(prev => {
                if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev;
                return mapped;
            });
        }
    }, [rawWalls, fetchedControllers]);

    useEffect(() => {
        if (rawCupboards && rawWalls && fetchedControllers) {
            const mapped = rawCupboards.map(c => {
                const wall = rawWalls.find(w => String(w.wall_id) === String(c.cupboard_wall_id));
                const ctrl = fetchedControllers.find(ctrl => String(ctrl.id) === String(c.cupboard_ctl_id));

                let shelfLayout = [];
                if (rawShelves && Array.isArray(rawShelves)) {
                    const cId = String(c.cupboard_id || c.id || '');
                    const cName = String(c.cupboard_name || c.name || '');

                    const matchingShelves = rawShelves.filter(s => {
                        const sCupId = String(s.shelf_cupboard_id || '').trim();
                        return sCupId !== '' && (sCupId === cId || sCupId === cName);
                    });

                    if (matchingShelves.length > 0) {
                        shelfLayout = matchingShelves.map((s, idx) => {
                            const realId = (s.shelf_id !== undefined && s.shelf_id !== null) ? String(s.shelf_id) : ((s.id !== undefined && s.id !== null) ? String(s.id) : `shelf-${idx}`);
                            
                            const isAssigned = (s.shelf_status === 'True' || s.shelf_status === true || s.shelf_status === 'Active');
                            const hasGridX = s.shelf_gridx !== undefined && s.shelf_gridx !== null && s.shelf_gridx !== '' && !isNaN(parseFloat(s.shelf_gridx));
                            const hasGridY = s.shelf_gridy !== undefined && s.shelf_gridy !== null && s.shelf_gridy !== '' && !isNaN(parseFloat(s.shelf_gridy));
                            const hasWidth = s.shelf_width !== undefined && s.shelf_width !== null && s.shelf_width !== '' && !isNaN(parseFloat(s.shelf_width));
                            const hasHeight = s.shelf_height !== undefined && s.shelf_height !== null && s.shelf_height !== '' && !isNaN(parseFloat(s.shelf_height));

                            let bins = [];
                            if (rawBins && Array.isArray(rawBins)) {
                                const matchingBins = rawBins.filter(b => {
                                    const bShelfId = String(b.bin_shelf_id || '').trim();
                                    const bPhrId = String(b.bin_phr_id || '').trim();
                                    const sPhrId = String(s.shelf_phr_id || '').trim();
                                    const sShelfId = String(s.shelf_id || s.id || '').trim();
                                    const sRealId = String(realId || '').trim();
                                    const sName = String(s.shelf_name || '').trim();

                                    const isShelfMatch = (
                                        (bShelfId !== '' && (
                                            bShelfId === sPhrId ||
                                            bShelfId === sShelfId ||
                                            bShelfId === sRealId ||
                                            bShelfId === sName
                                        )) ||
                                        (sPhrId !== '' && bPhrId !== '' && bPhrId === sPhrId)
                                    );

                                    const hasGridAndSize = (
                                        b.bin_gridx !== undefined && b.bin_gridx !== null && String(b.bin_gridx).trim() !== '' &&
                                        b.bin_gridy !== undefined && b.bin_gridy !== null && String(b.bin_gridy).trim() !== '' &&
                                        b.bin_width !== undefined && b.bin_width !== null && String(b.bin_width).trim() !== '' &&
                                        b.bin_height !== undefined && b.bin_height !== null && String(b.bin_height).trim() !== ''
                                    );

                                    const isPlacedBin = b.placed !== false && b.bin_status !== false && String(b.bin_status).toLowerCase() !== 'false';

                                    return isShelfMatch && hasGridAndSize && isPlacedBin;
                                });

                                if (matchingBins.length > 0) {
                                    bins = matchingBins.map((b, bIdx) => ({
                                        id: String(b.bin_id || `bin-${bIdx}`),
                                        bin_id: b.bin_id,
                                        label: b.bin_name || `Bin ${bIdx + 1}`,
                                        x: parseFloat(b.bin_gridx) || 10,
                                        y: parseFloat(b.bin_gridy) || 10,
                                        width: parseFloat(b.bin_width) || 80,
                                        height: parseFloat(b.bin_height) || 48,
                                        placed: true,
                                        bin_order: b.bin_order,
                                        bin_phr_id: b.bin_phr_id || b.phr_id || "",
                                        bin_org_id: b.bin_org_id || "skshospital",
                                        bin_branch_id: b.bin_branch_id || "Salem",
                                        bin_status: b.bin_status,
                                        bin_shelf_id: b.bin_shelf_id
                                    }));
                                }
                            }

                            if (bins.length === 0) {
                                try {
                                    const layouts = JSON.parse(localStorage.getItem('cupboardLayouts') || '{}');
                                    if (layouts[c.cupboard_id]) {
                                        const lsShelf = layouts[c.cupboard_id].shelfLayout?.find(ls =>
                                            String(ls.id) === realId ||
                                            String(ls.shelf_id) === realId ||
                                            String(ls.shelf_phr_id || '') === String(s.shelf_phr_id || '') ||
                                            String(ls.label || ls.shelf_name || '') === String(s.shelf_name || '')
                                        );
                                        if (lsShelf && lsShelf.bins && Array.isArray(lsShelf.bins)) {
                                            bins = lsShelf.bins.filter(b =>
                                                b.placed !== false &&
                                                b.x !== undefined && b.x !== null &&
                                                b.y !== undefined && b.y !== null &&
                                                b.width !== undefined && b.width !== null &&
                                                b.height !== undefined && b.height !== null
                                            );
                                        }
                                    }
                                } catch (e) { }
                            }

                            return {
                                id: realId,
                                shelf_id: s.shelf_id || s.id || realId,
                                label: s.shelf_name || `Shelf ${idx + 1}`,
                                x: hasGridX ? parseFloat(s.shelf_gridx) : 20,
                                y: hasGridY ? parseFloat(s.shelf_gridy) : (20 + idx * 56),
                                width: hasWidth ? parseFloat(s.shelf_width) : 560,
                                height: hasHeight ? parseFloat(s.shelf_height) : 48,
                                placed: true,
                                shelf_order: s.shelf_order,
                                shelf_phr_id: s.shelf_phr_id || s.phr_id || "",
                                shelf_org_id: s.shelf_org_id || "skshospital",
                                shelf_branch_id: s.shelf_branch_id || "Salem",
                                shelf_status: s.shelf_status,
                                bins: bins
                            };
                        });
                    }
                }

                if (shelfLayout.length === 0) {
                    try {
                        const layouts = JSON.parse(localStorage.getItem('cupboardLayouts') || '{}');
                        if (layouts[c.cupboard_id] && layouts[c.cupboard_id].shelfLayout) {
                            shelfLayout = layouts[c.cupboard_id].shelfLayout;
                        }
                    } catch (e) { }
                }

                const shelvesCount = shelfLayout.length;

                let ledStrips = [];
                if (rawStrips && Array.isArray(rawStrips)) {
                    const cId = String(c.cupboard_id || c.id || '');
                    const cName = String(c.cupboard_name || c.name || '');

                    const matchingStrips = rawStrips.filter(s => {
                        const sCupId = String(s.strip_cupboard_id || '').trim();
                        if (sCupId) {
                            return (
                                sCupId === cId ||
                                sCupId === cName ||
                                (c.cupboard_id !== undefined && sCupId === String(c.cupboard_id).trim()) ||
                                (c.id !== undefined && sCupId === String(c.id).trim()) ||
                                (c.name !== undefined && sCupId === String(c.name).trim()) ||
                                (c.cupboard_name !== undefined && sCupId === String(c.cupboard_name).trim())
                            );
                        }

                        // Fallback when strip_cupboard_id is missing from GET API:
                        const sShelfId = String(s.strip_shelf_id || '').trim();
                        if (sShelfId && shelfLayout && shelfLayout.length > 0) {
                            const matchesShelf = shelfLayout.some(sh => {
                                const shId = String(sh.shelf_id || sh.id || '').trim();
                                const shPhrId = String(sh.shelf_phr_id || '').trim();
                                const shName = String(sh.label || sh.shelf_name || '').trim();
                                return sShelfId === shId || sShelfId === shPhrId || sShelfId === shName;
                            });
                            if (matchesShelf) return true;
                        }

                        if (Array.isArray(s.bin_list) && s.bin_list.length > 0 && shelfLayout && shelfLayout.length > 0) {
                            const matchesBin = s.bin_list.some(b => {
                                const bId = String(b.bin_id || b.bin_name || '').trim();
                                return shelfLayout.some(sh =>
                                    Array.isArray(sh.bins) && sh.bins.some(bn =>
                                        String(bn.bin_id || bn.id || bn.label || '').trim() === bId
                                    )
                                );
                            });
                            if (matchesBin) return true;
                        }

                        if (rawCupboards && rawCupboards.length === 1) {
                            return true;
                        }

                        return false;
                    });

                    if (matchingStrips.length > 0) {
                        ledStrips = matchingStrips.map((s, idx) => {
                            const realId = (s.strip_id !== undefined && s.strip_id !== null) ? String(s.strip_id) : ((s.id !== undefined && s.id !== null) ? String(s.id) : `strip-${idx}`);
                            return {
                                id: realId,
                                strip_id: s.strip_id || s.id || realId,
                                label: s.strip_name || `Strip ${idx + 1}`,
                                x: (s.strip_gridx !== undefined && s.strip_gridx !== null && !isNaN(parseFloat(s.strip_gridx))) ? parseFloat(s.strip_gridx) : 20,
                                y: (s.strip_gridy !== undefined && s.strip_gridy !== null && !isNaN(parseFloat(s.strip_gridy))) ? parseFloat(s.strip_gridy) : (20 + idx * 30),
                                width: (s.strip_width !== undefined && s.strip_width !== null && !isNaN(parseFloat(s.strip_width))) ? parseFloat(s.strip_width) : 100,
                                height: (s.strip_height !== undefined && s.strip_height !== null && !isNaN(parseFloat(s.strip_height))) ? parseFloat(s.strip_height) : 22,
                                strip_loc_id: s.strip_loc_id,
                                strip_cupboard_id: s.strip_cupboard_id,
                                strip_shelf_id: s.strip_shelf_id,
                                strip_org_id: s.strip_org_id,
                                strip_branch_id: s.strip_branch_id,
                                strip_status: s.strip_status,
                                linkedBins: Array.isArray(s.bin_list) ? s.bin_list.map(b => b.bin_name || String(b.bin_id)) : []
                            };
                        });
                    }
                }

                const cupboardObj = {
                    id: c.cupboard_id,
                    name: c.cupboard_name,
                    wall: wall ? wall.wall_name : c.cupboard_wall_id,
                    wall_id: c.cupboard_wall_id,
                    controller: ctrl ? ctrl.name : c.cupboard_ctl_id,
                    controller_id: c.cupboard_ctl_id,
                    status: (c.cupboard_status === 'True' || c.cupboard_status === true || c.cupboard_status === 'Active') ? 'Active' : 'Inactive',
                    layoutGridX: parseInt(c.cupboard_gridx, 10) || 0,
                    layoutGridY: parseInt(c.cupboard_gridy, 10) || 0,
                    orientation: c.cupboard_orientation || 'h',
                    shelves: shelvesCount,
                    rows: shelvesCount,
                    columns: 4,
                    ledsPerDrawer: 6,
                    shelfLayout: shelfLayout,
                    ledStrips: ledStrips
                };
                
                try {
                    const layouts = JSON.parse(localStorage.getItem('cupboardLayouts') || '{}');
                    if (layouts[cupboardObj.id]) {
                        cupboardObj.columns = layouts[cupboardObj.id].columns || cupboardObj.columns;
                        cupboardObj.ledsPerDrawer = layouts[cupboardObj.id].ledsPerDrawer || cupboardObj.ledsPerDrawer;
                    }
                } catch (e) { }

                return cupboardObj;
            });

            setCupboardsData(prev => {
                if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev;
                return mapped;
            });
        }
    }, [rawCupboards, rawWalls, fetchedControllers, rawShelves, rawBins, rawStrips]);

    useEffect(() => {
        if (errorControllers) toast.error(`Failed to fetch controllers: ${errorControllers.message}`);
        if (errorWalls) toast.error(`Failed to fetch walls: ${errorWalls.message}`);
        if (errorCupboards) toast.error(`Failed to fetch cupboards: ${errorCupboards.message}`);
        if (errorShelves) toast.error(`Failed to fetch shelves: ${errorShelves.message}`);
        if (errorBins) toast.error(`Failed to fetch bins: ${errorBins.message}`);
        if (errorStrips) toast.error(`Failed to fetch strips: ${errorStrips.message}`);
    }, [errorControllers, errorWalls, errorCupboards, errorShelves, errorBins, errorStrips]);

    const isFetchingAny = isFetchingControllers || isFetchingWalls || isFetchingCupboards || isFetchingShelves || isFetchingBins || isFetchingStrips;

    // Wall layout designer: which controller was selected
    const [selectedController, setSelectedController] = useState(null);
    // Cupboard/Shelf layout designer: which wall was selected
    const [selectedWallForCupboards, setSelectedWallForCupboards] = useState(null);
    const [selectedCupboardForShelves, setSelectedCupboardForShelves] = useState(null);
    const [selectedShelfForBins, setSelectedShelfForBins] = useState(null);
    const [selectedCupboardForLeds, setSelectedCupboardForLeds] = useState(null);

    // Persistent filter states across navigation
    const [cupboardFilterController, setCupboardFilterController] = useState(() => {
        return localStorage.getItem('settings_cupboard_filter_controller') || 'all';
    });

    const [shelfFilterController, setShelfFilterController] = useState(() => {
        return localStorage.getItem('settings_shelf_filter_controller') || 'all';
    });
    const [shelfFilterWall, setShelfFilterWall] = useState(() => {
        return localStorage.getItem('settings_shelf_filter_wall') || 'all';
    });

    const [binFilterController, setBinFilterController] = useState(() => {
        return localStorage.getItem('settings_bin_filter_controller') || 'all';
    });
    const [binFilterWall, setBinFilterWall] = useState(() => {
        return localStorage.getItem('settings_bin_filter_wall') || 'all';
    });
    const [binFilterCupboard, setBinFilterCupboard] = useState(() => {
        return localStorage.getItem('settings_bin_filter_cupboard') || 'all';
    });

    const [ledFilterController, setLedFilterController] = useState(() => {
        return localStorage.getItem('settings_led_filter_controller') || 'all';
    });
    const [ledFilterWall, setLedFilterWall] = useState(() => {
        return localStorage.getItem('settings_led_filter_wall') || 'all';
    });

    const handleCupboardFilterControllerChange = (val) => {
        setCupboardFilterController(val);
        localStorage.setItem('settings_cupboard_filter_controller', val);
    };

    const handleShelfFilterControllerChange = (val) => {
        setShelfFilterController(val);
        localStorage.setItem('settings_shelf_filter_controller', val);
    };
    const handleShelfFilterWallChange = (val) => {
        setShelfFilterWall(val);
        localStorage.setItem('settings_shelf_filter_wall', val);
    };

    const handleBinFilterControllerChange = (val) => {
        setBinFilterController(val);
        localStorage.setItem('settings_bin_filter_controller', val);
    };
    const handleBinFilterWallChange = (val) => {
        setBinFilterWall(val);
        localStorage.setItem('settings_bin_filter_wall', val);
    };
    const handleBinFilterCupboardChange = (val) => {
        setBinFilterCupboard(val);
        localStorage.setItem('settings_bin_filter_cupboard', val);
    };

    const handleLedFilterControllerChange = (val) => {
        setLedFilterController(val);
        localStorage.setItem('settings_led_filter_controller', val);
    };
    const handleLedFilterWallChange = (val) => {
        setLedFilterWall(val);
        localStorage.setItem('settings_led_filter_wall', val);
    };

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
            const shelvesCount = Number(c.shelves || c.rows || 0);
            CUPBOARDS_CONFIG.push({
                ...c,
                shelves: shelvesCount,
                rows: shelvesCount
            });
        });
        setSelectedCupboardForShelves(prev => {
            if (!prev) return null;
            const updated = newData.find(c => String(c.id) === String(prev.id));
            return updated || prev;
        });
    };

    const tabs = [
        { id: 'controllers', label: 'Controllers', icon: Server },
        { id: 'walls', label: 'Walls', icon: LayoutGrid },
        { id: 'cupboards', label: 'Cupboards', icon: Box },
        { id: 'shelves', label: 'Shelves', icon: Layers },
        { id: 'bins', label: 'Bins', icon: Archive },
        { id: 'led-setup', label: 'LED Setup', icon: Palette },
        { id: 'leds', label: 'LED Strips', icon: Lightbulb },
    ];

    // ── Handle entering / exiting wall layout designer ────────────────────────
    const handleSelectController = (ctrl) => {
        setSelectedController(ctrl);
    };

    const handleBackFromDesigner = () => {
        setSelectedController(null);
    };

    const handleSelectWallForCupboards = (wall) => {
        setSelectedWallForCupboards(wall);
    }

    const handleSelectCupboardForShelves = (cupboard) => {
        setSelectedCupboardForShelves(cupboard);
    }

    // When walls tab + controller selected → full-width designer (no sidebar)
    const isWallDesignerMode = activeTab === 'walls' && selectedController !== null;
    const isCupboardDesignerMode = activeTab === 'cupboards' && selectedWallForCupboards !== null;
    const isShelfDesignerMode = activeTab === 'shelves' && selectedCupboardForShelves !== null;
    const isBinDesignerMode = activeTab === 'bins' && selectedShelfForBins !== null;
    const isLedDesignerMode = activeTab === 'leds' && isLedDesignerActive;
    const isInDesignerMode = isWallDesignerMode || isCupboardDesignerMode || isShelfDesignerMode || isBinDesignerMode || isLedDesignerMode;

    // Close main nav sidebar when entering designer, restore on exit
    useEffect(() => {
        if (!setSidebarOpen) return;
        setSidebarOpen(!isInDesignerMode);
    }, [isInDesignerMode, setSidebarOpen]);

    return (
        <div className={cn('flex w-full', isInDesignerMode ? 'h-[calc(100vh-7.5rem)]' : 'h-[calc(100vh-8rem)] gap-6')}>

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
                                        onClick={() => handleTabChange(tab.id)}
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
                <div className={cn('flex-1 flex flex-col', isInDesignerMode ? 'p-0 overflow-hidden' : 'p-6 overflow-y-auto')}>

                    {isFetchingAny ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-ot-action" />
                            <div className="text-sm font-medium animate-pulse">Loading configuration data...</div>
                        </div>
                    ) : (
                        <>
                            {/* Controllers tab */}
                            {activeTab === 'controllers' && (
                        <ControllersTab
                            controllersData={controllersData}
                            syncControllers={syncControllers}
                            refetchControllers={refetchControllers}
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
                    {isWallDesignerMode && (
                        <WallLayoutDesigner
                            controller={selectedController}
                            onBack={handleBackFromDesigner}
                            wallsData={wallsData}
                            syncWalls={syncWalls}
                        />
                    )}

                    {/* Cupboards tab */}
                    {activeTab === 'cupboards' && (
                        <CupboardsTab
                            cupboardsData={cupboardsData}
                            syncCupboards={syncCupboards}
                            controllersData={controllersData}
                            wallsData={wallsData}
                            selectedWall={selectedWallForCupboards}
                            onSelectWall={handleSelectWallForCupboards}
                            filterController={cupboardFilterController}
                            onFilterControllerChange={handleCupboardFilterControllerChange}
                        />
                    )}

                    {/* Shelves tab */}
                    {activeTab === 'shelves' && (
                        <ShelvesTab
                            cupboardsData={cupboardsData}
                            syncCupboards={syncCupboards}
                            selectedCupboard={selectedCupboardForShelves}
                            onSelectCupboard={handleSelectCupboardForShelves}
                            wallsData={wallsData}
                            controllersData={controllersData}
                            refetchShelves={refetchShelves}
                            filterController={shelfFilterController}
                            onFilterControllerChange={handleShelfFilterControllerChange}
                            filterWall={shelfFilterWall}
                            onFilterWallChange={handleShelfFilterWallChange}
                        />
                    )}

                    {/* Bins tab */}
                    {activeTab === 'bins' && (
                        <BinsTab
                            cupboardsData={cupboardsData}
                            syncCupboards={syncCupboards}
                            selectedShelfContext={selectedShelfForBins}
                            onSelectShelfContext={setSelectedShelfForBins}
                            wallsData={wallsData}
                            controllersData={controllersData}
                            refetchBins={refetchBins}
                            filterController={binFilterController}
                            onFilterControllerChange={handleBinFilterControllerChange}
                            filterWall={binFilterWall}
                            onFilterWallChange={handleBinFilterWallChange}
                            filterCupboard={binFilterCupboard}
                            onFilterCupboardChange={handleBinFilterCupboardChange}
                        />
                    )}

                    {/* LED Setup tab */}
                    {activeTab === 'led-setup' && (
                        <LedSetupTab
                            cupboardsData={cupboardsData}
                            syncCupboards={syncCupboards}
                            locId={locId}
                        />
                    )}

                    {/* LED Strips tab */}
                    {activeTab === 'leds' && (
                        <LedStripsTab
                            cupboardsData={cupboardsData}
                            syncCupboards={syncCupboards}
                            selectedCupboard={selectedCupboardForLeds}
                            onSelectCupboard={setSelectedCupboardForLeds}
                            wallsData={wallsData}
                            controllersData={controllersData}
                            refetchStrips={refetchStrips}
                            filterController={ledFilterController}
                            onFilterControllerChange={handleLedFilterControllerChange}
                            filterWall={ledFilterWall}
                            onFilterWallChange={handleLedFilterWallChange}
                            onBack={() => setIsLedDesignerActive(false)}
                            onOpenDesigner={() => setIsLedDesignerActive(true)}
                            isDesignerActive={isLedDesignerActive}
                            onGoToBins={(targetCupboard) => {
                                handleTabChange('bins');
                                if (targetCupboard) {
                                    const cupName = targetCupboard.name || targetCupboard.cupboard_name || 'all';
                                    handleBinFilterCupboardChange(cupName);
                                }
                            }}
                        />
                    )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
