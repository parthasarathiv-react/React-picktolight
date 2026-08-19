import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import {
    Loader2, Server, Box, LayoutGrid, Layers, Lightbulb, Check, Cpu, Cable, Zap,
    Settings2, ArrowRight, RefreshCw, PanelLeft, PanelRight, PanelTop,
    PanelBottom, Eye, AlertCircle, Plus, Sparkles, Filter, X, ArrowLeft, Trash2, Save, Search, ChevronRight
} from 'lucide-react';
import { cn } from 'lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from 'components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';
import { apiService } from 'lib/apiService';
import { toast } from 'sonner';
import { ConfirmDialog } from 'components/ui/ConfirmDialog';
import Cupboard2D from 'components/visualization/Cupboard2D';

const CHANNEL_PALETTES = [
    { hex: '#22d3ee', bgGrad: 'from-cyan-950 via-[#03303d] to-[#011a21]', border: 'border-cyan-400', text: 'text-cyan-300', dot: 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(34,211,238,0.5)]' },
    { hex: '#34d399', bgGrad: 'from-emerald-950 via-[#032e1e] to-[#011a11]', border: 'border-emerald-400', text: 'text-emerald-300', dot: 'bg-emerald-400 shadow-[0_0_10px_#34d399]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(52,211,153,0.5)]' },
    { hex: '#38bdf8', bgGrad: 'from-sky-950 via-[#032c40] to-[#011724]', border: 'border-sky-400', text: 'text-sky-300', dot: 'bg-sky-400 shadow-[0_0_10px_#38bdf8]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(56,189,248,0.5)]' },
    { hex: '#fbbf24', bgGrad: 'from-amber-950 via-[#3d2503] to-[#241501]', border: 'border-amber-400', text: 'text-amber-300', dot: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(251,191,36,0.5)]' },
    { hex: '#c084fc', bgGrad: 'from-purple-950 via-[#330347] to-[#1c0129]', border: 'border-purple-400', text: 'text-purple-300', dot: 'bg-purple-400 shadow-[0_0_10px_#c084fc]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(192,132,252,0.5)]' },
    { hex: '#fb7185', bgGrad: 'from-rose-950 via-[#45031d] to-[#290110]', border: 'border-rose-400', text: 'text-rose-300', dot: 'bg-rose-400 shadow-[0_0_10px_#fb7185]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(251,113,133,0.5)]' },
    { hex: '#fb923c', bgGrad: 'from-orange-950 via-[#421d03] to-[#291101]', border: 'border-orange-400', text: 'text-orange-300', dot: 'bg-orange-400 shadow-[0_0_10px_#fb923c]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(251,146,60,0.5)]' },
    { hex: '#e879f9', bgGrad: 'from-fuchsia-950 via-[#3d0342] to-[#240129]', border: 'border-fuchsia-400', text: 'text-fuchsia-300', dot: 'bg-fuchsia-400 shadow-[0_0_10px_#e879f9]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(232,121,249,0.5)]' },
    { hex: '#2dd4bf', bgGrad: 'from-teal-950 via-[#03332c] to-[#011f1a]', border: 'border-teal-400', text: 'text-teal-300', dot: 'bg-teal-400 shadow-[0_0_10px_#2dd4bf]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(45,212,191,0.5)]' },
    { hex: '#818cf8', bgGrad: 'from-indigo-950 via-[#0f174a] to-[#080d2d]', border: 'border-indigo-400', text: 'text-indigo-300', dot: 'bg-indigo-400 shadow-[0_0_10px_#818cf8]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(129,140,248,0.5)]' },
    { hex: '#a3e635', bgGrad: 'from-lime-950 via-[#263b03] to-[#162401]', border: 'border-lime-400', text: 'text-lime-300', dot: 'bg-lime-400 shadow-[0_0_10px_#a3e635]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(163,230,53,0.5)]' },
    { hex: '#facc15', bgGrad: 'from-yellow-950 via-[#3d3303] to-[#241e01]', border: 'border-yellow-400', text: 'text-yellow-300', dot: 'bg-yellow-400 shadow-[0_0_10px_#facc15]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(250,204,21,0.5)]' },
    { hex: '#f472b6', bgGrad: 'from-pink-950 via-[#400d27] to-[#260717]', border: 'border-pink-400', text: 'text-pink-300', dot: 'bg-pink-400 shadow-[0_0_10px_#f472b6]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(244,114,182,0.5)]' },
    { hex: '#60a5fa', bgGrad: 'from-blue-950 via-[#032147] to-[#01132b]', border: 'border-blue-400', text: 'text-blue-300', dot: 'bg-blue-400 shadow-[0_0_10px_#60a5fa]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(96,165,250,0.5)]' },
    { hex: '#a78bfa', bgGrad: 'from-violet-950 via-[#260f4a] to-[#16082b]', border: 'border-violet-400', text: 'text-violet-300', dot: 'bg-violet-400 shadow-[0_0_10px_#a78bfa]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(167,139,250,0.5)]' },
    { hex: '#06b6d4', bgGrad: 'from-cyan-950 via-[#022833] to-[#01161d]', border: 'border-cyan-500', text: 'text-cyan-200', dot: 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]', glow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_0_16px_rgba(6,182,212,0.5)]' },
];

export default function LedStripsTab({
    cupboardsData = [],
    syncCupboards,
    wallsData = [],
    controllersData = [],
    refetchStrips,
    onGoToBins,
    onBack,
    onOpenDesigner,
    isDesignerActive = true
}) {
    // ── Primary State ─────────────────────────────────────────────────────────
    const [selectedController, setSelectedController] = useState(() => {
        try {
            const saved = localStorage.getItem('selectedController');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });
    const [selectedWallNames, setSelectedWallNames] = useState(() => {
        try {
            const saved = localStorage.getItem('ledstrip_selectedWallNames');
            if (saved) return JSON.parse(saved);
            const legacy = localStorage.getItem('selectedWallNames');
            if (legacy) return JSON.parse(legacy);
        } catch (e) {
            return [];
        }
        return [];
    });
    const [controllerPlacement, setControllerPlacement] = useState(() => {
        try {
            const saved = localStorage.getItem('controllerPlacement');
            return saved || 'left';
        } catch (e) {
            return 'left';
        }
    });
    const [channelAssignments, setChannelAssignments] = useState({}); // { 1: stripObj/id, 2: stripObj/id, ... }
    const [viewMode, setViewMode] = useState('2d'); // '2d' | '3d'
    const [activeCupboardIdx, setActiveCupboardIdx] = useState(0);

    // Persist configuration selections
    useEffect(() => {
        if (selectedController) {
            try { localStorage.setItem('selectedController', JSON.stringify(selectedController)); } catch (e) { }
        }
    }, [selectedController]);

    useEffect(() => {
        if (selectedWallNames && selectedWallNames.length > 0) {
            try { localStorage.setItem('ledstrip_selectedWallNames', JSON.stringify(selectedWallNames)); } catch (e) { }
        }
    }, [selectedWallNames]);

    useEffect(() => {
        if (controllerPlacement) {
            try { localStorage.setItem('controllerPlacement', controllerPlacement); } catch (e) { }
        }
    }, [controllerPlacement]);

    // ── Dialog Visibility Controls ───────────────────────────────────────────
    const [showControllerDialog, setShowControllerDialog] = useState(false);
    const [showWallsDialog, setShowWallsDialog] = useState(false);
    const [showPositionDialog, setShowPositionDialog] = useState(false);
    const [showChannelDialog, setShowChannelDialog] = useState(false);

    // ── In-Memory State for LED Strips & Channels ────────────────────────────
    const [localLedStrips, setLocalLedStrips] = useState([]);
    const [localChannelAssignments, setLocalChannelAssignments] = useState({});

    // ── Add Strip & Bin Assignment Dialog States ──────────────────────────────
    const [showAddStripDialog, setShowAddStripDialog] = useState(false);
    const [addStripMode, setAddStripMode] = useState('channel'); // 'channel' | 'daisy_chain'
    const [selectedAddChannel, setSelectedAddChannel] = useState(1);
    const [selectedParentStripId, setSelectedParentStripId] = useState('');
    const [newStripName, setNewStripName] = useState('');
    const [newStripCupboardId, setNewStripCupboardId] = useState('');

    const [showAssignBinsDialog, setShowAssignBinsDialog] = useState(false);
    const [activeStripForBins, setActiveStripForBins] = useState(null);
    const [selectedBinIds, setSelectedBinIds] = useState([]);
    const [apiBins, setApiBins] = useState([]);
    const [isLoadingApiBins, setIsLoadingApiBins] = useState(false);
    const [binSearchQuery, setBinSearchQuery] = useState('');

    // Fetch API Bins dynamically
    useEffect(() => {
        const fetchBins = async () => {
            let locId = 'All';
            try {
                const selectedLocationStr = localStorage.getItem('selectedLocation');
                if (selectedLocationStr) {
                    const loc = JSON.parse(selectedLocationStr);
                    locId = loc.phr_location_id || 'All';
                }
            } catch (e) { }

            setIsLoadingApiBins(true);
            try {
                const res = await apiService.getBins(locId, 'All');
                if (res && res.success && Array.isArray(res.data)) {
                    setApiBins(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch API bins in LedStripsTab:", err);
            } finally {
                setIsLoadingApiBins(false);
            }
        };
        fetchBins();
    }, []);

    // Refresh key to trigger re-fetch after updates/adds across all strips
    const [refreshKey, setRefreshKey] = useState(0);
    const triggerRefresh = useCallback(() => setRefreshKey(prev => prev + 1), []);

    // Fetch API Channels and ChannelStrips dynamically ONLY when a controller card is clicked
    const [apiChannels, setApiChannels] = useState([]);
    const [isLoadingChannels, setIsLoadingChannels] = useState(false);
    const [isLoadingStripsData, setIsLoadingStripsData] = useState(false);

    const fetchStripsForController = useCallback(async (controllerToLoad) => {
        const ctrlId = controllerToLoad?.id || controllerToLoad?.ctl_id;
        if (!ctrlId) return;

        setIsLoadingChannels(true);
        setIsLoadingStripsData(true);

        let locId = 'All';
        try {
            const selectedLocationStr = localStorage.getItem('selectedLocation');
            if (selectedLocationStr) {
                const loc = JSON.parse(selectedLocationStr);
                locId = loc.phr_location_id || 'All';
            }
        } catch (e) { }

        try {
            // 1. Fetch channels specifically for this controller ID
            const channelsRes = await apiService.getChannels(ctrlId);
            const channelsList = channelsRes?.data || (Array.isArray(channelsRes) ? channelsRes : []);
            setApiChannels(channelsList);

            // 2. Fetch all strips from API for location
            const stripsRes = await apiService.getStrips(locId);
            const fetchedStrips = (stripsRes && stripsRes.success && Array.isArray(stripsRes.data))
                ? stripsRes.data
                : (Array.isArray(stripsRes?.data) ? stripsRes.data : (Array.isArray(stripsRes) ? stripsRes : []));

            // 3. For each channel belonging to this controller, fetch channel strips using real DB channel_id
            const channelMap = {};
            const loadedLocalStrips = [];

            if (Array.isArray(channelsList) && channelsList.length > 0) {
                for (let idx = 0; idx < channelsList.length; idx++) {
                    const ch = channelsList[idx];
                    const chNum = idx + 1;
                    const channelId = ch.channel_id || ch.id;

                    // Only call getChannelStrips for valid channel IDs to avoid 404
                    if (!channelId) continue;

                    try {
                        const csRes = await apiService.getChannelStrips(channelId, ctrlId);
                        const csList = (csRes && csRes.success && Array.isArray(csRes.data))
                            ? csRes.data
                            : (Array.isArray(csRes?.data) ? csRes.data : (Array.isArray(csRes) ? csRes : []));

                        if (csList && csList.length > 0) {
                            csList.forEach(csItem => {
                                const csStripId = String(csItem.strip_id || csItem.id || '');
                                const matchedStrip = fetchedStrips.find(s => String(s.strip_id || s.id) === csStripId) || {
                                    id: csStripId,
                                    strip_id: csStripId,
                                    strip_name: `Strip ${csStripId}`,
                                    strip_gridx: csItem.x,
                                    strip_gridy: csItem.y
                                };

                                const formattedStrip = {
                                    id: String(matchedStrip.strip_id || matchedStrip.id || csStripId),
                                    strip_id: String(matchedStrip.strip_id || matchedStrip.id || csStripId),
                                    label: matchedStrip.strip_name || matchedStrip.label || `Strip CH-${String(chNum).padStart(2, '0')}`,
                                    channel: chNum,
                                    channelId: channelId,
                                    strip_ctl_id: String(ctrlId),
                                    x: parseFloat(csItem.x ?? matchedStrip.strip_gridx ?? 40),
                                    y: parseFloat(csItem.y ?? matchedStrip.strip_gridy ?? (40 + idx * 35)),
                                    width: parseFloat(matchedStrip.strip_width ?? 80),
                                    height: parseFloat(matchedStrip.strip_height ?? 22),
                                    cupboardId: String(matchedStrip.strip_cupboard_id || matchedStrip.cupboard_id || csItem.cupboard_id || '1'),
                                    bins: matchedStrip.bin_list || matchedStrip.bins || [],
                                    linkedBins: matchedStrip.bin_list || matchedStrip.linkedBins || []
                                };

                                channelMap[chNum] = formattedStrip;
                                loadedLocalStrips.push(formattedStrip);
                            });
                        }
                    } catch (err) {
                        console.warn(`Could not fetch channelstrips for channel ${channelId}:`, err);
                    }
                }
            }

            // Map any unassigned fetchedStrips matching this controller ID strictly
            fetchedStrips.forEach((s, idx) => {
                const sId = String(s.strip_id || s.id || `strip-${idx}`);
                const stripCtlId = String(s.strip_ctl_id || s.ctl_id || '');
                if (stripCtlId === String(ctrlId)) {
                    const alreadyLoaded = loadedLocalStrips.some(ls => String(ls.id || ls.strip_id) === sId);
                    if (!alreadyLoaded) {
                        const formatted = {
                            id: sId,
                            strip_id: sId,
                            label: s.strip_name || s.label || `Strip ${idx + 1}`,
                            channel: Number(s.strip_channel || s.channel || (idx % 16) + 1),
                            x: parseFloat(s.strip_gridx ?? 40),
                            y: parseFloat(s.strip_gridy ?? (40 + idx * 35)),
                            width: parseFloat(s.strip_width ?? 80),
                            height: parseFloat(s.strip_height ?? 22),
                            cupboardId: String(s.strip_cupboard_id || s.cupboard_id || '1'),
                            bins: s.bin_list || s.bins || [],
                            linkedBins: s.bin_list || s.linkedBins || []
                        };
                        loadedLocalStrips.push(formatted);
                    }
                }
            });

            setChannelAssignments(channelMap);
            setLocalChannelAssignments(channelMap);
            setLocalLedStrips(loadedLocalStrips);
        } catch (err) {
            console.error("Error fetching strips for controller:", err);
        } finally {
            setIsLoadingChannels(false);
            setIsLoadingStripsData(false);
        }
    }, []);

    // Re-fetch strips when refreshKey changes while designer is active
    useEffect(() => {
        if (refreshKey > 0 && selectedController) {
            fetchStripsForController(selectedController);
        }
    }, [refreshKey, selectedController, fetchStripsForController]);

    // Computed list of channels to render exclusively from API getChannels data
    const channelsToRender = React.useMemo(() => {
        if (!apiChannels || !Array.isArray(apiChannels) || apiChannels.length === 0) {
            return [];
        }
        return apiChannels.map((ch, idx) => {
            const chNum = idx + 1;
            const channelId = ch.channel_id || ch.id || chNum;
            const channelName = ch.channel_name || ch.name || `Channel ${chNum}`;
            return {
                id: channelId,
                channelId: channelId,
                chNum,
                name: channelName,
                fullName: channelName,
                stripCount: parseInt(ch.channel_stripcount || 0, 10),
                ledCount: parseInt(ch.channel_ledcount || 0, 10),
                raw: ch
            };
        });
    }, [apiChannels]);

    // Filter cupboards for selected walls
    const filteredCupboards = cupboardsData.filter(c =>
        selectedWallNames.length === 0 || selectedWallNames.includes(c.wall)
    );

    // Merge cupboards with local led strips strictly for selected controller
    const cupboardsWithLocalStrips = React.useMemo(() => {
        const baseFiltered = cupboardsData.filter(cup => selectedWallNames.includes(cup.wall));
        const selectedCtlId = String(selectedController?.id || selectedController?.ctl_id || '');

        return baseFiltered.map(cup => {
            const cupIdStr = String(cup.id || cup.cupboard_id);

            const filteredShelfLayout = (cup.shelfLayout || []).filter(s => {
                const isShelfPlaced = (s.shelf_placed !== undefined && s.shelf_placed !== null)
                    ? (typeof s.shelf_placed === 'boolean' ? s.shelf_placed : String(s.shelf_placed).toLowerCase() === 'true')
                    : (s.placed !== undefined ? (typeof s.placed === 'boolean' ? s.placed : String(s.placed).toLowerCase() === 'true') : false);
                const isShelfStatusFalse = (s.shelf_status !== undefined && s.shelf_status !== null && (s.shelf_status === false || String(s.shelf_status).toLowerCase() === 'false'));
                return isShelfPlaced && !isShelfStatusFalse;
            }).map(s => {
                const filteredBins = (s.bins || []).filter(b => {
                    const isBinPlaced = (b.bin_placed !== undefined && b.bin_placed !== null)
                        ? (typeof b.bin_placed === 'boolean' ? b.bin_placed : String(b.bin_placed).toLowerCase() === 'true')
                        : (b.placed !== undefined ? (typeof b.placed === 'boolean' ? b.placed : String(b.placed).toLowerCase() === 'true') : false);
                    const isBinStatusFalse = (b.bin_status !== undefined && b.bin_status !== null && (b.bin_status === false || String(b.bin_status).toLowerCase() === 'false'));
                    return isBinPlaced && !isBinStatusFalse;
                });
                return {
                    ...s,
                    bins: filteredBins
                };
            });

            // Gather localStrips that belong to this cupboard
            const matchingLocalStrips = localLedStrips.filter(ls => String(ls.cupboardId || ls.cupboard_id) === cupIdStr);

            // If controller-specific localLedStrips have been loaded, use them exclusively
            if (localLedStrips.length > 0) {
                return {
                    ...cup,
                    shelfLayout: filteredShelfLayout,
                    ledStrips: matchingLocalStrips
                };
            }

            // Fallback if localLedStrips not fetched yet: filter raw cup.ledStrips by selected controller ID
            const cupStrips = (cup.ledStrips || cup.led_strips || []).filter(s => {
                const sCtl = String(s.strip_ctl_id || s.ctl_id || s.controller_id || '');
                return !sCtl || !selectedCtlId || sCtl === selectedCtlId;
            });

            return {
                ...cup,
                shelfLayout: filteredShelfLayout,
                ledStrips: cupStrips
            };
        });
    }, [cupboardsData, selectedWallNames, localLedStrips, selectedController]);

    // Combine bins from active cupboards layout, API bins, and fallbacks
    const allAvailableBins = React.useMemo(() => {
        const binsMap = new Map();
        const activeCupboards = cupboardsWithLocalStrips.length > 0 ? cupboardsWithLocalStrips : (filteredCupboards.length > 0 ? filteredCupboards : cupboardsData);
        const activeCupboardIds = new Set(activeCupboards.map(cup => String(cup.id || cup.cupboard_id)));

        // 1. Gather bins from active cupboards
        if (Array.isArray(activeCupboards)) {
            activeCupboards.forEach(cup => {
                const cId = String(cup.id || cup.cupboard_id || '');
                const cName = cup.name || cup.cupboard_name || 'Cupboard';
                if (cup.shelfLayout && Array.isArray(cup.shelfLayout)) {
                    cup.shelfLayout.forEach((shelf, sIdx) => {
                        const sId = String(shelf.id || shelf.shelf_id || `s${sIdx + 1}`);
                        const sName = shelf.label || shelf.shelf_name || `Shelf ${sIdx + 1}`;
                        if (shelf.bins && Array.isArray(shelf.bins)) {
                            shelf.bins.forEach((b, bIdx) => {
                                const binIdStr = String(b.bin_id || b.id || `bin-${cId}-${sId}-${bIdx}`);
                                const binLabelStr = String(b.bin_name || b.label || `Bin ${bIdx + 1}`);
                                binsMap.set(binIdStr, {
                                    id: binIdStr,
                                    label: binLabelStr,
                                    shelfName: sName,
                                    cupboardName: cName,
                                    cupboardId: cId,
                                    shelfId: sId
                                });
                            });
                        }
                    });
                }
            });
        }

        // 2. Gather bins from apiBins matching active cupboards
        if (Array.isArray(apiBins)) {
            apiBins.forEach((b, idx) => {
                const binCupId = String(b.cupboard_id || b.bin_cupboard_id || '');
                if (activeCupboardIds.size === 0 || activeCupboardIds.has(binCupId)) {
                    const binIdStr = String(b.bin_id || b.id || `api-bin-${idx}`);
                    const binLabelStr = String(b.bin_name || b.label || `Bin ${b.bin_id || idx + 1}`);
                    if (!binsMap.has(binIdStr)) {
                        binsMap.set(binIdStr, {
                            id: binIdStr,
                            label: binLabelStr,
                            shelfName: b.shelf_name || `Shelf ${b.bin_shelf_id || ''}`,
                            cupboardName: b.cupboard_name || 'Cupboard',
                            cupboardId: binCupId,
                            shelfId: String(b.bin_shelf_id || '')
                        });
                    }
                }
            });
        }

        return Array.from(binsMap.values());
    }, [cupboardsWithLocalStrips, filteredCupboards, cupboardsData, apiBins]);

    // ── Wire Connections Canvas Refs ─────────────────────────────────────────
    const containerRef = useRef(null);
    const [wirePaths, setWirePaths] = useState([]);

    // ── Initial Setup & Persistence Tracking ─────────────────────────────────
    const [isInitialSetupDone, setIsInitialSetupDone] = useState(() => {
        try {
            return localStorage.getItem('hasCompletedInitialSetup') === 'true';
        } catch (e) {
            return false;
        }
    });

    // Guided setup flow: Auto-open Controller dialog ONLY on first time setup if not completed
    useEffect(() => {
        if (isDesignerActive && !isInitialSetupDone && !selectedController && controllersData.length > 0) {
            setShowControllerDialog(true);
        } else if (!selectedController && controllersData.length > 0) {
            try {
                const saved = localStorage.getItem('selectedController');
                if (saved) {
                    setSelectedController(JSON.parse(saved));
                } else {
                    setSelectedController(controllersData[0]);
                    localStorage.setItem('selectedController', JSON.stringify(controllersData[0]));
                }
            } catch (e) {
                setSelectedController(controllersData[0]);
            }
        }
    }, [isDesignerActive, isInitialSetupDone, selectedController, controllersData]);

    // Filter walls matching selectedController
    const filteredWallsForController = React.useMemo(() => {
        if (!selectedController) return wallsData;
        const cId = String(selectedController.id || selectedController.ctl_id || '');
        const cName = String(selectedController.name || '');

        const matched = wallsData.filter(w => {
            const wCtlId = String(w.controller_id || w.ctl_id || '');
            const wCtlName = String(w.controller_name || w.controller || '');
            return (wCtlId && wCtlId === cId) || (wCtlName && wCtlName === cName);
        });

        return matched.length > 0 ? matched : wallsData;
    }, [wallsData, selectedController]);

    // Handle controller selection
    const handleSelectController = (controller) => {
        setSelectedController(controller);
        setShowControllerDialog(false);
        try { localStorage.setItem('selectedController', JSON.stringify(controller)); } catch (e) { }

        // Set wall names belonging specifically to this controller
        const ctrlWalls = wallsData.filter(w =>
            String(w.controller_id || w.ctl_id) === String(controller.id || controller.ctl_id) ||
            w.controller_name === controller.name ||
            w.controller === controller.name
        );
        const wallNames = ctrlWalls.map(w => w.name || w.wall_name).filter(Boolean);
        const finalWallNames = wallNames.length > 0 ? wallNames : (wallsData.length > 0 ? [wallsData[0]?.name || wallsData[0]?.wall_name].filter(Boolean) : []);
        setSelectedWallNames(finalWallNames);
        try { localStorage.setItem('selectedWallNames', JSON.stringify(finalWallNames)); } catch (e) { }

        // Trigger channel & channelstrip API calls for the selected controller ONLY upon user click
        fetchStripsForController(controller);

        // Proceed to Walls dialog if part of initial setup flow
        if (!isInitialSetupDone) {
            setShowWallsDialog(true);
        }
    };

    // Toggle wall selection in multi-select dialog
    const toggleWallSelection = (wallName) => {
        setSelectedWallNames(prev => {
            const updated = prev.includes(wallName)
                ? prev.filter(w => w !== wallName)
                : [...prev, wallName];
            try { localStorage.setItem('selectedWallNames', JSON.stringify(updated)); } catch (e) { }
            return updated;
        });
    };

    const handleSelectAllWalls = () => {
        const matchingWalls = filteredWallsForController;
        let updated = [];
        if (selectedWallNames.length === matchingWalls.length) {
            updated = [];
            toast.info("Deselected all walls.");
        } else {
            updated = matchingWalls.map(w => w.name || w.wall_name).filter(Boolean);
            toast.info(`Selected all ${updated.length} wall(s).`);
        }
        setSelectedWallNames(updated);
        try { localStorage.setItem('selectedWallNames', JSON.stringify(updated)); } catch (e) { }
    };

    const handleConfirmWalls = () => {
        setShowWallsDialog(false);
        try { localStorage.setItem('selectedWallNames', JSON.stringify(selectedWallNames)); } catch (e) { }

        // Filter cupboards based on selected walls
        const filtered = cupboardsData.filter(cup => selectedWallNames.includes(cup.wall));
        const firstCupId = filtered[0]?.id || filtered[0]?.cupboard_id;
        if (firstCupId) {
            setActiveCupboardIdx(0);
        }

        // Proceed to Position dialog if part of initial setup flow
        if (!isInitialSetupDone) {
            setShowPositionDialog(true);
        }
    };

    // Effective channel assignments merging API + local storage
    const effectiveChannelAssignments = React.useMemo(() => {
        return {
            ...channelAssignments,
            ...localChannelAssignments
        };
    }, [channelAssignments, localChannelAssignments]);

    // Extract all LED strips inside the selected cupboards
    const availableStrips = React.useMemo(() => {
        const strips = [];
        cupboardsWithLocalStrips.forEach(cupboard => {
            const cupStrips = cupboard.ledStrips || cupboard.led_strips || [];
            if (Array.isArray(cupStrips)) {
                cupStrips.forEach(strip => {
                    strips.push({
                        ...strip,
                        cupboardId: cupboard.id || cupboard.cupboard_id,
                        cupboardName: cupboard.name,
                        wallName: cupboard.wall
                    });
                });
            }
        });
        return strips;
    }, [cupboardsWithLocalStrips]);

    // ── Draggable Strip Handlers ──────────────────────────────────────────────
    const handleStripMove = React.useCallback((stripId, newX, newY) => {
        setLocalLedStrips(prev => prev.map(s => (s.id === stripId || s.strip_id === stripId) ? { ...s, x: newX, y: newY } : s));
    }, []);

    const handleCreateStrip = () => {
        let assignedChannel = selectedAddChannel;
        let parentStrip = null;

        if (addStripMode === 'daisy_chain') {
            parentStrip = availableStrips.find(s => String(s.id || s.strip_id) === String(selectedParentStripId));
            if (!parentStrip) {
                toast.error("Please select an existing strip to continue/chain from.");
                return;
            }
            assignedChannel = parentStrip.channel || 1;
        } else {
            if (!selectedAddChannel) {
                toast.error("Please select a channel port.");
                return;
            }
        }

        const targetCupboard = filteredCupboards.find(c => String(c.id || c.cupboard_id) === String(newStripCupboardId)) || filteredCupboards[0];
        const cId = String(targetCupboard?.id || targetCupboard?.cupboard_id || '1');
        const cName = targetCupboard?.name || 'Cupboard';

        const targetChannelObj = channelsToRender.find(c => c.chNum === assignedChannel);
        const selectedChannelId = targetChannelObj ? (targetChannelObj.channelId || targetChannelObj.id) : null;

        const stripId = `local-strip-${Date.now()}`;
        const label = newStripName.trim() || (addStripMode === 'daisy_chain' ? `${parentStrip?.label || 'Strip'} Ext` : `Strip CH-${String(assignedChannel).padStart(2, '0')}`);

        const newStrip = {
            id: stripId,
            strip_id: stripId,
            label: label,
            x: parentStrip ? Math.min(500, (Number(parentStrip.x) || 40) + 100) : 40,
            y: parentStrip ? (Number(parentStrip.y) || 40) : (40 + (localLedStrips.length * 35)),
            width: 80,
            height: 22,
            channel: assignedChannel,
            channelId: selectedChannelId,
            channel_id: selectedChannelId,
            parentStripId: addStripMode === 'daisy_chain' ? (parentStrip.id || parentStrip.strip_id) : null,
            cupboardId: cId,
            cupboardName: cName,
            ledCount: 6,
            bins: []
        };

        const updatedStrips = [...localLedStrips, newStrip];
        setLocalLedStrips(updatedStrips);

        toast.success(`Assigned ${label} to CH-${String(selectedAddChannel).padStart(2, '0')}!`, {
            description: `Target: ${cName}. Drag on cupboard to position.`
        });
        setShowAddStripDialog(false);
        setNewStripName('');
    };

    const handleStripDoubleClick = (strip) => {
        setActiveStripForBins(strip);
        const existingBins = strip.bins || strip.linkedBins || [];
        setSelectedBinIds(Array.isArray(existingBins) ? existingBins.map(String) : []);
        setBinSearchQuery('');
        setShowAssignBinsDialog(true);
    };

    const [stripToDelete, setStripToDelete] = useState(null);
    const [stripDeleteDialogOpen, setStripDeleteDialogOpen] = useState(false);
    const [isDeletingStrip, setIsDeletingStrip] = useState(false);

    const handlePromptDeleteStrip = (strip) => {
        setStripToDelete(strip);
        setStripDeleteDialogOpen(true);
    };

    const confirmDeleteStrip = async () => {
        if (!stripToDelete) return;
        setIsDeletingStrip(true);
        try {
            await handleDeleteStrip(stripToDelete);
            setStripDeleteDialogOpen(false);
            setStripToDelete(null);
        } finally {
            setIsDeletingStrip(false);
        }
    };

    const handleDeleteStrip = async (strip) => {
        if (!strip) return;
        const targetId = strip.strip_id || strip.id;

        if (targetId && !String(targetId).startsWith('local-') && !String(targetId).startsWith('sample-')) {
            const toastId = toast.loading(`Deleting ${strip.label || 'LED Strip'} via API...`);
            try {
                await apiService.deleteStrip(targetId);
                toast.success(`Strip "${strip.label || 'LED Strip'}" deleted successfully from API`, { id: toastId });
            } catch (err) {
                console.error("Error deleting strip via API:", err);
                toast.error(`Failed to delete strip: ${err.message}`, { id: toastId });
                return;
            }
        } else {
            toast.success(`Deleted ${strip.label || 'LED Strip'}`);
        }

        setLocalLedStrips(prev => prev.filter(s => String(s.id || s.strip_id) !== String(targetId)));
        setLocalChannelAssignments(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(ch => {
                if (String(updated[ch]?.id || updated[ch]?.strip_id) === String(targetId)) {
                    delete updated[ch];
                }
            });
            return updated;
        });
        setShowAssignBinsDialog(false);
        if (refetchStrips) refetchStrips();
    };

    const handleUpdateStripChannel = (channelNumStr) => {
        if (!activeStripForBins) return;
        const targetId = activeStripForBins.id || activeStripForBins.strip_id;
        const chNum = Number(channelNumStr);
        const targetChannelObj = channelsToRender.find(c => c.chNum === chNum);
        const targetChannelId = targetChannelObj ? (targetChannelObj.channelId || targetChannelObj.id) : null;

        setLocalLedStrips(prev => prev.map(s => String(s.id || s.strip_id) === String(targetId) ? { ...s, channel: chNum, channelId: targetChannelId, channel_id: targetChannelId } : s));
        if (chNum >= 1 && chNum <= 16) {
            const updatedStrip = { ...activeStripForBins, channel: chNum, channelId: targetChannelId, channel_id: targetChannelId };
            setChannelAssignments(prev => ({
                ...prev,
                [chNum]: updatedStrip
            }));
            setLocalChannelAssignments(prev => ({
                ...prev,
                [chNum]: updatedStrip
            }));
        }
        toast.success(`Reassigned strip to CH-${String(chNum).padStart(2, '0')}`);
    };

    const handleSaveBinsForStrip = () => {
        if (!activeStripForBins) return;
        const stripId = activeStripForBins.id || activeStripForBins.strip_id;
        setLocalLedStrips(prev => prev.map(s => (String(s.id || s.strip_id) === String(stripId)) ? { ...s, bins: selectedBinIds, linkedBins: selectedBinIds } : s));

        toast.success(`Assigned ${selectedBinIds.length} bin(s) to ${activeStripForBins.label || 'LED Strip'}`);
        setShowAssignBinsDialog(false);
    };

    // Auto-map channels 1..N to available strips sequentially
    const handleAutoAssignChannels = () => {
        const newMap = {};
        for (let i = 1; i <= 16; i++) {
            const strip = availableStrips[i - 1];
            if (strip) {
                newMap[i] = strip;
            }
        }
        setChannelAssignments(newMap);
        toast.success(`Auto-assigned ${Math.min(16, availableStrips.length)} channel strips.`);
    };

    const handleAssignChannelStrip = (channelNum, stripIdStr) => {
        if (!stripIdStr || stripIdStr === 'none') {
            setChannelAssignments(prev => {
                const next = { ...prev };
                delete next[channelNum];
                return next;
            });
            setLocalChannelAssignments(prev => {
                const next = { ...prev };
                delete next[channelNum];
                return next;
            });
            return;
        }
        const found = availableStrips.find(s => String(s.id || s.strip_id) === String(stripIdStr));
        if (found) {
            setChannelAssignments(prev => ({
                ...prev,
                [channelNum]: found
            }));
            setLocalChannelAssignments(prev => ({
                ...prev,
                [channelNum]: found
            }));
        }
    };

    // Persist channel assignments to API with 2-step process (createStrip -> createChannelStrip)
    const handleSaveChannelAssignments = async () => {
        if (!selectedController) {
            toast.error("No controller selected.");
            return;
        }
        const toastId = toast.loading("Saving channel strip assignments...");
        try {
            const ctrlId = selectedController.id || selectedController.ctl_id;
            let currentApiChannels = apiChannels;
            if (!currentApiChannels || currentApiChannels.length === 0) {
                try {
                    const res = await apiService.getChannels(ctrlId);
                    currentApiChannels = res?.data || (Array.isArray(res) ? res : []);
                    setApiChannels(currentApiChannels);
                } catch (e) {
                    console.error("Error fetching channels on save:", e);
                }
            }

            let count = 0;
            for (const [channelNum, stripObj] of Object.entries(effectiveChannelAssignments)) {
                if (stripObj) {
                    let realStripId = stripObj.strip_id || stripObj.id;
                    const isTempId = !realStripId || String(realStripId).startsWith('local-') || String(realStripId).startsWith('sample-') || isNaN(Number(realStripId));

                    if (isTempId) {
                        let locId = '1';
                        try {
                            const selectedLocationStr = localStorage.getItem('selectedLocation');
                            if (selectedLocationStr) {
                                const loc = JSON.parse(selectedLocationStr);
                                locId = String(loc.phr_location_id || '1');
                            }
                        } catch (e) { }

                        const rawBins = stripObj.bins || stripObj.linkedBins || stripObj.bin_list || [];
                        const formattedBins = Array.isArray(rawBins) ? rawBins.map(b => {
                            if (typeof b === 'object' && b !== null) {
                                return {
                                    bin_id: String(b.bin_id || b.id || b.bin_name || b.label || ''),
                                    bin_name: String(b.bin_name || b.label || b.name || b.bin_id || b.id || '')
                                };
                            }
                            return { bin_id: String(b), bin_name: String(b) };
                        }) : [];

                        const stripPayload = {
                            strip_name: String(stripObj.label || stripObj.strip_name || `Strip CH-${channelNum}`),
                            strip_loc_id: String(stripObj.strip_loc_id || locId),
                            strip_ctl_id: String(selectedController.id || selectedController.ctl_id || stripObj.strip_ctl_id || '1'),
                            strip_cupboard_id: String(stripObj.cupboardId || stripObj.cupboard_id || '1'),
                            strip_shelf_id: String(stripObj.shelfId || stripObj.shelf_id || '1'),
                            strip_gridx: String(Math.round(stripObj.x ?? 0)),
                            strip_gridy: String(Math.round(stripObj.y ?? 0)),
                            strip_width: String(Math.round(stripObj.width || 100)),
                            strip_height: String(Math.round(stripObj.height || 22)),
                            strip_org_id: String(stripObj.strip_org_id || "Salem"),
                            strip_branch_id: String(stripObj.strip_branch_id || "SKSHOSPITAL"),
                            strip_status: stripObj.strip_status !== undefined ? Boolean(stripObj.strip_status) : true,
                            bin_list: formattedBins
                        };
                        const stripRes = await apiService.createStrip(stripPayload);
                        const itemData = Array.isArray(stripRes?.data) ? stripRes.data[0] : (Array.isArray(stripRes) ? stripRes[0] : (stripRes?.data || stripRes));
                        realStripId = String(itemData?.strip_id || itemData?.id || stripRes?.strip_id || stripRes?.id || realStripId);
                    }

                    // Find matching channel from get-channels data to get its real channel_id (e.g. 33) NOT channel_ctl_id ("1")
                    const formattedChName = `CHANNEL-${String(channelNum).padStart(2, '0')}`;
                    const targetChannelObj = (currentApiChannels || []).find(ch =>
                        String(ch.channel_name || '').toUpperCase() === formattedChName.toUpperCase() ||
                        String(ch.channel_name || '').toUpperCase() === `CHANNEL-${channelNum}`.toUpperCase()
                    ) || (currentApiChannels || [])[Number(channelNum) - 1];

                    const resolvedChannelId = String(
                        targetChannelObj?.channel_id ||
                        targetChannelObj?.id ||
                        stripObj.channel_id ||
                        stripObj.channelId ||
                        channelNum
                    );

                    const ctrlIdStr = String(selectedController?.id || selectedController?.ctl_id || '');
                    // Send exact payload: strip_id, channel_id, strip_order, ctl_id
                    await apiService.createChannelStrip({
                        strip_id: String(realStripId),
                        channel_id: String(resolvedChannelId),
                        strip_order: String(channelNum),
                        ctl_id: ctrlIdStr
                    });
                    count++;
                }
            }
            toast.success(`Saved ${count} channel assignments to server`, { id: toastId });
            setShowChannelDialog(false);
            triggerRefresh();
            if (refetchStrips) refetchStrips();
        } catch (error) {
            console.error("Error saving channel assignments:", error);
            toast.error(`Failed to save: ${error.message}`, { id: toastId });
        }
    };

    // ── Calculate Wire Connections coordinates (Sequential Channel Daisy-Chaining) ─────
    const calculateWirePaths = React.useCallback(() => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const paths = [];

        const getInAnchor = (s) => {
            if (!s) return null;
            const cupId = s.cupboardId || s.cupboard_id || 'c';
            const sId = s.id || s.strip_id;
            const candidates = [
                `strip-in-${cupId}-${sId}`,
                `strip-in-c-${sId}`,
                cupId ? `strip-in-${cupId}-${s.id}` : null,
                cupId ? `strip-in-${cupId}-${s.strip_id}` : null,
                `strip-in-${sId}`,
                `strip-in-${s.id}`,
                `strip-in-${s.strip_id}`,
                `strip-target-${cupId}-${sId}`,
                `strip-target-c-${sId}`,
                `strip-target-${sId}`
            ].filter(Boolean);
            for (const id of candidates) {
                const elem = document.getElementById(id);
                if (elem) return elem;
            }
            return null;
        };

        const getOutAnchor = (s) => {
            if (!s) return null;
            const cupId = s.cupboardId || s.cupboard_id || 'c';
            const sId = s.id || s.strip_id;
            const candidates = [
                `strip-out-${cupId}-${sId}`,
                `strip-out-c-${sId}`,
                cupId ? `strip-out-${cupId}-${s.id}` : null,
                cupId ? `strip-out-${cupId}-${s.strip_id}` : null,
                `strip-out-${sId}`,
                `strip-out-${s.id}`,
                `strip-out-${s.strip_id}`
            ].filter(Boolean);
            for (const id of candidates) {
                const elem = document.getElementById(id);
                if (elem) return elem;
            }
            // Fallback: locate right-out pin inside inElem's parent strip element
            const inElem = getInAnchor(s);
            if (inElem) {
                let stripWrapper = inElem.parentElement;
                if (stripWrapper) {
                    const rightOut = stripWrapper.querySelector('[data-strip-out]') || stripWrapper.querySelector('[id*="strip-out-"]');
                    if (rightOut) return rightOut;
                }
            }
            return null;
        };

        // Iterate through all 16 controller channels
        const headerElem = containerRef.current.querySelector('.bg-ot-surface-top');
        const minAllowedY = headerElem ? (headerElem.getBoundingClientRect().bottom - containerRect.top + 4) : 4;

        for (let ch = 1; ch <= 16; ch++) {
            // Find all strips assigned to channel `ch`
            let chStrips = availableStrips.filter(s => {
                const sCh = Number(s.channel) || (s.channel ? parseInt(String(s.channel).replace(/\D/g, ''), 10) : null);
                return sCh === ch;
            });

            // Fallback: if no local strip array has channel `ch`, check effectiveChannelAssignments
            if (chStrips.length === 0 && effectiveChannelAssignments[ch]) {
                chStrips = [effectiveChannelAssignments[ch]];
            }

            if (chStrips.length === 0) continue;

            // Sequential routing:
            // - Strip 0: Wire comes from Controller Port Socket `CH-ch` to Strip 0 IN anchor
            // - Strip i (i > 0): Wire comes from Strip (i-1) OUT anchor to Strip i IN anchor
            chStrips.forEach((strip, idx) => {
                const stripId = strip.id || strip.strip_id;
                const targetInElem = getInAnchor(strip);
                if (!targetInElem) return;

                if (idx === 0 && !strip.parentStripId) {
                    // First strip on channel: connect from Controller Hardware Port Socket `CH-ch`
                    const portElem = document.getElementById(`port-socket-${ch}`);
                    if (portElem && targetInElem) {
                        const pRect = portElem.getBoundingClientRect();
                        const sRect = targetInElem.getBoundingClientRect();

                        let x1 = pRect.left + pRect.width / 2 - containerRect.left;
                        let y1 = pRect.top + pRect.height / 2 - containerRect.top;
                        if (controllerPlacement === 'left') {
                            x1 = pRect.right - containerRect.left + 2;
                        } else if (controllerPlacement === 'right') {
                            x1 = pRect.left - containerRect.left - 2;
                        } else if (controllerPlacement === 'top') {
                            y1 = pRect.bottom - containerRect.top + 2;
                        } else if (controllerPlacement === 'bottom') {
                            y1 = pRect.top - containerRect.top - 2;
                        }
                        const x2 = sRect.left + sRect.width / 2 - containerRect.left;
                        const y2 = sRect.top + sRect.height / 2 - containerRect.top;

                        const dx = x2 - x1;
                        const dy = y2 - y1;
                        const absDx = Math.abs(dx);
                        const absDy = Math.abs(dy);

                        let cp1x = x1, cp1y = y1, cp2x = x2, cp2y = y2;
                        if (controllerPlacement === 'left') {
                            const offset = Math.min(120, Math.max(30, absDx * 0.4));
                            cp1x = x1 + offset;
                            cp2x = x2 - offset;
                        } else if (controllerPlacement === 'right') {
                            const offset = Math.min(120, Math.max(30, absDx * 0.4));
                            cp1x = x1 - offset;
                            cp2x = x2 + offset;
                        } else if (controllerPlacement === 'top') {
                            const offset = Math.min(120, Math.max(30, absDy * 0.4));
                            cp1y = y1 + offset;
                            cp2y = y2 - offset;
                        } else {
                            const offset = Math.min(120, Math.max(30, absDy * 0.4));
                            cp1y = y1 - offset;
                            cp2y = y2 + offset;
                        }

                        cp1y = Math.max(minAllowedY, cp1y);
                        cp2y = Math.max(minAllowedY, cp2y);

                        paths.push({
                            id: `wire-ch-${ch}-${stripId}`,
                            ch,
                            stripLabel: strip.label || `Strip ${ch}`,
                            d: `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`,
                            x1, y1, x2, y2
                        });
                    }
                } else {
                    // Daisy chain: connect from previous strip of this channel (or explicit parentStripId)
                    const prevStrip = strip.parentStripId
                        ? availableStrips.find(s => String(s.id || s.strip_id) === String(strip.parentStripId))
                        : chStrips[idx - 1];

                    const parentOutElem = getOutAnchor(prevStrip);

                    if (parentOutElem && targetInElem) {
                        const pRect = parentOutElem.getBoundingClientRect();
                        const sRect = targetInElem.getBoundingClientRect();

                        const x1 = pRect.left + pRect.width / 2 - containerRect.left;
                        const y1 = pRect.top + pRect.height / 2 - containerRect.top;
                        const x2 = sRect.left + sRect.width / 2 - containerRect.left;
                        const y2 = sRect.top + sRect.height / 2 - containerRect.top;

                        const dx = x2 - x1;
                        const absDx = Math.abs(dx);

                        const offset = Math.min(80, Math.max(20, absDx * 0.35));
                        const cp1x = x1 + offset;
                        let cp1y = y1;
                        const cp2x = x2 - offset;
                        let cp2y = y2;

                        cp1y = Math.max(minAllowedY, cp1y);
                        cp2y = Math.max(minAllowedY, cp2y);

                        paths.push({
                            id: `wire-chain-${prevStrip ? (prevStrip.id || prevStrip.strip_id) : 'prev'}-${stripId}`,
                            ch,
                            stripLabel: `${strip.label} (Daisy Chain)`,
                            d: `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`,
                            x1, y1, x2, y2
                        });
                    }
                }
            });
        }

        setWirePaths(prev => {
            if (JSON.stringify(prev) === JSON.stringify(paths)) return prev;
            return paths;
        });
    }, [availableStrips, controllerPlacement, effectiveChannelAssignments]);

    useLayoutEffect(() => {
        if (!isDesignerActive) return;
        let rafId;
        const update = () => {
            rafId = requestAnimationFrame(() => {
                calculateWirePaths();
            });
        };

        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        const timer = setTimeout(update, 200);
        const timer2 = setTimeout(update, 600);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
            clearTimeout(timer);
            clearTimeout(timer2);
        };
    }, [isDesignerActive, controllerPlacement, viewMode, availableStrips, localLedStrips]);

    if (!isDesignerActive) {
        return (
            <div className="flex flex-col h-full space-y-6 animate-in fade-in p-1">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-ot-action animate-pulse" />
                            LED Strip Hardware Designer
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Select a hardware controller to configure 16-channel strip mappings and launch the 3D visual designer.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            if (controllersData.length > 0 && !selectedController) {
                                handleSelectController(controllersData[0]);
                                onOpenDesigner?.();
                            } else if (selectedController) {
                                fetchStripsForController(selectedController);
                                onOpenDesigner?.();
                            } else {
                                onOpenDesigner?.();
                            }
                        }}
                        className="gap-2 bg-ot-action text-white hover:bg-ot-action-hover px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-ot-action/20 shrink-0"
                    >
                        <Cpu className="w-4 h-4" /> Launch Designer Mode
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {controllersData.map((ctrl) => {
                        const isOnline = ctrl.status === 'Online' || ctrl.status === true || ctrl.status === 'True';
                        return (
                            <button
                                key={ctrl.id}
                                onClick={() => {
                                    handleSelectController(ctrl);
                                    onOpenDesigner?.();
                                }}
                                className={cn(
                                    'group relative flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 text-left',
                                    'border-ot-border bg-ot-surface-elev-bottom/40',
                                    'hover:border-ot-action/70 hover:bg-ot-action/10 hover:shadow-lg hover:shadow-ot-action/10',
                                    'active:scale-[0.99]'
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200',
                                        isOnline
                                            ? 'bg-green-500/10 border-green-500/30 group-hover:bg-green-500/20 text-green-400'
                                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    )}>
                                        <Cpu className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white group-hover:text-ot-action transition-colors text-base">
                                            {ctrl.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-2">
                                            <span>{ctrl.ip}:{ctrl.port}</span>
                                            <span>•</span>
                                            <span className="text-ot-action font-semibold">{ctrl.channels || 16} Channels</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={cn(
                                        'px-2.5 py-1 text-xs rounded-full border font-mono font-medium',
                                        isOnline
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    )}>
                                        {ctrl.status || 'Online'}
                                    </span>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-ot-surface-top border border-ot-border group-hover:bg-ot-action group-hover:border-ot-action transition-all duration-200">
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors duration-200" />
                                    </div>
                                </div>

                                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-ot-action opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </button>
                        );
                    })}
                </div>

                {controllersData.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-16 border border-dashed border-ot-border rounded-2xl bg-ot-surface-elev-bottom/20">
                        <div className="w-14 h-14 rounded-2xl bg-ot-surface-elev-bottom border border-ot-border flex items-center justify-center">
                            <Cpu className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-semibold text-white">No controllers found</div>
                        <div className="text-xs text-muted-foreground max-w-sm">
                            Please register a hardware controller in the Controllers tab first before configuring LED strips.
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const handleSaveSetup = async () => {
        const toastId = toast.loading("Saving setup: creating strips and assigning to channels...");
        try {
            const itemsToProcess = [];
            const processedKeys = new Set();

            // 1. Collect assigned strips from localLedStrips
            localLedStrips.forEach((strip, idx) => {
                const stripId = String(strip.id || strip.strip_id || '');
                const channelId = String(strip.channel || 1);
                if (channelId) {
                    const key = `${stripId || idx}-${channelId}`;
                    if (!processedKeys.has(key)) {
                        processedKeys.add(key);
                        itemsToProcess.push({
                            strip,
                            channelId,
                            order: String(strip.order || strip.strip_order || (idx + 1))
                        });
                    }
                }
            });

            // 2. Collect assigned channel strips from effectiveChannelAssignments
            Object.entries(effectiveChannelAssignments).forEach(([channelNum, stripObj]) => {
                if (stripObj) {
                    const stripId = String(stripObj.id || stripObj.strip_id || '');
                    const channelId = String(channelNum);
                    const key = `${stripId || channelNum}-${channelId}`;
                    if (!processedKeys.has(key)) {
                        processedKeys.add(key);
                        itemsToProcess.push({
                            strip: stripObj,
                            channelId,
                            order: String(channelNum)
                        });
                    }
                }
            });

            if (itemsToProcess.length === 0) {
                toast.info("No channel strip assignments to save.", { id: toastId });
                return;
            }

            let currentApiChannels = apiChannels;
            const ctrlId = selectedController?.id || selectedController?.ctl_id;
            if ((!currentApiChannels || currentApiChannels.length === 0) && ctrlId) {
                try {
                    const res = await apiService.getChannels(ctrlId);
                    currentApiChannels = res?.data || (Array.isArray(res) ? res : []);
                    setApiChannels(currentApiChannels);
                } catch (e) {
                    console.error("Error fetching channels in handleSaveSetup:", e);
                }
            }

            let successCount = 0;
            for (const item of itemsToProcess) {
                const { strip, channelId, order } = item;

                // ACTION 1: Create the strip first to get proper strip_id from backend
                let realStripId = strip.strip_id || strip.id;
                const isTempId = !realStripId || String(realStripId).startsWith('local-') || String(realStripId).startsWith('sample-') || isNaN(Number(realStripId));

                if (isTempId) {
                    let locId = '1';
                    try {
                        const selectedLocationStr = localStorage.getItem('selectedLocation');
                        if (selectedLocationStr) {
                            const loc = JSON.parse(selectedLocationStr);
                            locId = String(loc.phr_location_id || '1');
                        }
                    } catch (e) { }

                    const rawBins = strip.bins || strip.linkedBins || strip.bin_list || [];
                    const formattedBins = Array.isArray(rawBins) ? rawBins.map(b => {
                        if (typeof b === 'object' && b !== null) {
                            return {
                                bin_id: String(b.bin_id || b.id || b.bin_name || b.label || ''),
                                bin_name: String(b.bin_name || b.label || b.name || b.bin_id || b.id || '')
                            };
                        }
                        return { bin_id: String(b), bin_name: String(b) };
                    }) : [];

                    const stripPayload = {
                        strip_name: String(strip.label || strip.strip_name || strip.name || `Strip CH-${channelId}`),
                        strip_loc_id: String(strip.strip_loc_id || locId),
                        strip_ctl_id: String(selectedController?.id || selectedController?.ctl_id || strip.strip_ctl_id || '1'),
                        strip_cupboard_id: String(strip.cupboardId || strip.cupboard_id || '1'),
                        strip_shelf_id: String(strip.shelfId || strip.shelf_id || '1'),
                        strip_gridx: String(Math.round(strip.x ?? 0)),
                        strip_gridy: String(Math.round(strip.y ?? 0)),
                        strip_width: String(Math.round(strip.width || 100)),
                        strip_height: String(Math.round(strip.height || 22)),
                        strip_org_id: String(strip.strip_org_id || "Salem"),
                        strip_branch_id: String(strip.strip_branch_id || "SKSHOSPITAL"),
                        strip_status: strip.strip_status !== undefined ? Boolean(strip.strip_status) : true,
                        bin_list: formattedBins
                    };

                    const stripRes = await apiService.createStrip(stripPayload);
                    const itemData = Array.isArray(stripRes?.data) ? stripRes.data[0] : (Array.isArray(stripRes) ? stripRes[0] : (stripRes?.data || stripRes));
                    realStripId = String(
                        itemData?.strip_id ||
                        itemData?.id ||
                        stripRes?.strip_id ||
                        stripRes?.id ||
                        realStripId
                    );
                }

                // ACTION 2: Create the channelstrip mapping using the proper realStripId from Action 1 and channel_id from get-channels API
                const formattedChName = `CHANNEL-${String(channelId).padStart(2, '0')}`;
                const targetChannelObj = (currentApiChannels || []).find(ch =>
                    String(ch.channel_id || ch.id) === String(channelId) ||
                    String(ch.channel_name || '').toUpperCase() === formattedChName.toUpperCase() ||
                    String(ch.channel_name || '').toUpperCase() === `CHANNEL-${channelId}`.toUpperCase()
                ) || (currentApiChannels || [])[Number(channelId) - 1];

                const resolvedChannelId = String(
                    targetChannelObj?.channel_id ||
                    targetChannelObj?.id ||
                    channelId
                );

                const ctrlIdStr = String(selectedController?.id || selectedController?.ctl_id || '');
                const channelStripPayload = {
                    strip_id: String(realStripId),
                    channel_id: String(resolvedChannelId),
                    strip_order: String(order),
                    ctl_id: ctrlIdStr,
                    x: String(Math.round(strip.x ?? 0)),
                    y: String(Math.round(strip.y ?? 0))
                };

                await apiService.createChannelStrip(channelStripPayload);
                successCount++;
            }

            toast.success(`Successfully created and linked ${successCount} strip(s) to channel(s)!`, { id: toastId });
            triggerRefresh();
            if (refetchStrips) refetchStrips();
        } catch (err) {
            console.error("Error in two-step strip creation:", err);
            toast.error(`Failed to save setup: ${err.message || 'API error'}`, { id: toastId });
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-in fade-in relative p-2 overflow-hidden select-none">
            {/* ── Top Navigation / Monitoring Controls Toolbar ──────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-ot-border bg-gradient-to-r from-ot-surface-top/90 to-ot-surface-bottom/90 backdrop-blur-md shadow-lg shrink-0">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onBack}
                                className="text-muted-foreground hover:text-white gap-2 h-8 px-3 text-xs font-semibold"
                            >
                                <ArrowLeft className="w-4 h-4 text-ot-action" /> Back
                            </Button>
                            <div className="h-5 w-px bg-ot-border" />
                        </>
                    )}
                    <span className="text-xs text-muted-foreground font-mono">LED Strips Designer</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Re-trigger Controller Selection */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowControllerDialog(true)}
                        className="gap-1.5 border-ot-border bg-ot-surface-top/60 hover:bg-ot-surface-top hover:text-white text-slate-200 text-xs font-medium"
                    >
                        <Server className="w-3.5 h-3.5 text-ot-action" />
                        Controller ({selectedController?.name || 'Select'})
                    </Button>

                    {/* Re-trigger Walls Selection */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowWallsDialog(true)}
                        className="gap-1.5 border-ot-border bg-ot-surface-top/60 hover:bg-ot-surface-top hover:text-white text-slate-200 text-xs font-medium"
                    >
                        <LayoutGrid className="w-3.5 h-3.5 text-ot-action" />
                        Walls ({selectedWallNames.length})
                    </Button>

                    {/* Placement button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPositionDialog(true)}
                        className="gap-1.5 border-ot-border bg-ot-surface-top/60 hover:bg-ot-surface-top hover:text-white text-slate-200 text-xs font-medium"
                    >
                        <Settings2 className="w-3.5 h-3.5 text-ot-action" />
                        Placement ({controllerPlacement.toUpperCase()})
                    </Button>

                    {/* Add LED Strip Button */}
                    <Button
                        size="sm"
                        onClick={() => {
                            const used = Object.keys(effectiveChannelAssignments).map(Number);
                            const firstAvail = Array.from({ length: 16 }, (_, i) => i + 1).find(ch => !used.includes(ch)) || 1;
                            setSelectedAddChannel(firstAvail);
                            setNewStripName(`Strip CH-${String(firstAvail).padStart(2, '0')}`);
                            if (filteredCupboards.length > 0) {
                                setNewStripCupboardId(String(filteredCupboards[0].id || filteredCupboards[0].cupboard_id));
                            }
                            setShowAddStripDialog(true);
                        }}
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
                    >
                        <Plus className="w-4 h-4" />
                        Add LED Strip
                    </Button>

                    {/* Save Hardware Setup Button */}
                    <Button
                        size="sm"
                        onClick={handleSaveSetup}
                        className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
                    >
                        <Save className="w-4 h-4" />
                        Save Setup
                    </Button>
                </div>
            </div>

            {/* ── Main Canvas & Monitoring Layout Container ────────────────────────── */}
            <div
                ref={containerRef}
                className={cn(
                    "flex-1 relative rounded-2xl border border-ot-border bg-gradient-to-b from-[#010a25] to-[#01112c] overflow-hidden flex min-h-0",
                    controllerPlacement === 'top' && "flex-col",
                    controllerPlacement === 'bottom' && "flex-col-reverse",
                    controllerPlacement === 'left' && "flex-row",
                    controllerPlacement === 'right' && "flex-row-reverse"
                )}
            >
                {/* ── SVG Connection Wires Overlay Layer ────────────────────────────── */}
                <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full overflow-hidden">
                    <style>{`
                        @keyframes wireFlowTab {
                            from { stroke-dashoffset: 24; }
                            to { stroke-dashoffset: 0; }
                        }
                        .animate-wire-flow-tab {
                            animation: wireFlowTab 1s linear infinite;
                        }
                    `}</style>
                    <defs>
                        <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {wirePaths.map(w => {
                        const chNum = Number(w.ch) || 1;
                        const palette = CHANNEL_PALETTES[(chNum - 1) % CHANNEL_PALETTES.length] || CHANNEL_PALETTES[0];
                        return (
                            <g key={w.id || w.ch}>
                                {/* Outer Glow Wire */}
                                <path
                                    d={w.d}
                                    fill="none"
                                    stroke={palette.hex}
                                    strokeWidth="5"
                                    strokeOpacity="0.4"
                                    filter="url(#glow)"
                                />
                                {/* Active Wire Line */}
                                <path
                                    d={w.d}
                                    fill="none"
                                    stroke={palette.hex}
                                    strokeWidth="2.5"
                                    strokeDasharray="8 4"
                                    className="animate-wire-flow-tab"
                                />
                                {/* Start Port Node Pin */}
                                <circle cx={w.x1} cy={w.y1} r="4.5" fill={palette.hex} stroke="#ffffff" strokeWidth="1.5" />
                                {/* End Target Node Pin */}
                                <circle cx={w.x2} cy={w.y2} r="4.5" fill={palette.hex} stroke="#ffffff" strokeWidth="1.5" />
                            </g>
                        );
                    })}
                </svg>

                {/* ── High-Fidelity 3D Material Green PCB Hardware Controller Board ─────────────── */}
                <div className={cn(
                    "z-30 p-3 shrink-0 flex flex-col justify-between border-2 border-emerald-500/40 bg-gradient-to-b from-[#092e20] via-[#041d13] to-[#010e08] shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),_inset_0_-2px_4px_rgba(0,0,0,0.8),_0_12px_35px_rgba(0,0,0,0.8),_0_0_20px_rgba(16,185,129,0.25)] transition-all duration-300 relative overflow-hidden rounded-2xl my-2 ml-2",
                    (controllerPlacement === 'left' || controllerPlacement === 'right') ? "w-56 h-[calc(100%-16px)]" : "w-full h-40 border-b"
                )}>
                    {/* 3D Metallic Gold Screws in 4 Corners */}
                    <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 border border-amber-500/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_1px_3px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none">
                        <div className="w-1.5 h-0.5 bg-amber-950 rounded-full rotate-45" />
                    </div>
                    <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 border border-amber-500/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_1px_3px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none">
                        <div className="w-1.5 h-0.5 bg-amber-950 rounded-full -rotate-45" />
                    </div>
                    <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 border border-amber-500/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_1px_3px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none">
                        <div className="w-1.5 h-0.5 bg-amber-950 rounded-full -rotate-45" />
                    </div>
                    <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 border border-amber-500/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_1px_3px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none">
                        <div className="w-1.5 h-0.5 bg-amber-950 rounded-full rotate-45" />
                    </div>

                    {/* PCB Copper Trace Etch Lines */}
                    <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:8px_8px]" />

                    {/* 3D PCB Header Info */}
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2 pt-1 px-3 mb-1.5 relative z-10">
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-b from-emerald-500/30 to-emerald-900/40 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                <Cpu className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-emerald-300 tracking-wider uppercase font-mono leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                    {channelsToRender.length}-CH PCB MODULE
                                </h4>
                                <div className="text-[9px] text-emerald-400/80 font-mono font-medium">
                                    {selectedController ? selectedController.ip : '192.168.1.100'}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Channel Output Port Sockets Grid (3D Recessed Hardware Blocks) */}
                    <div className={cn(
                        "grid gap-1.5 flex-1 overflow-y-auto px-1 py-0.5 custom-scrollbar relative z-10",
                        (controllerPlacement === 'left' || controllerPlacement === 'right') ? "grid-cols-1" : "grid-cols-8"
                    )}>
                        {isLoadingChannels ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-6 text-emerald-400 gap-2 font-mono text-xs">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Fetching API channels...</span>
                            </div>
                        ) : channelsToRender.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-6 text-slate-400 gap-1 font-mono text-xs text-center">
                                <span>No API channels configured</span>
                            </div>
                        ) : (
                            channelsToRender.map((ch, idx) => {
                                const chNum = ch.chNum;
                                const assigned = effectiveChannelAssignments[chNum] || availableStrips.find(s => Number(s.channel) === chNum || String(s.channel) === String(chNum) || String(s.channel) === `CH-${String(chNum).padStart(2, '0')}`);
                                const hasWire = wirePaths.some(w => Number(w.ch) === chNum);
                                const isConnected = Boolean(assigned || hasWire || ch.stripCount > 0);
                                const palette = CHANNEL_PALETTES[(idx) % CHANNEL_PALETTES.length];

                                return (
                                    <div
                                        key={ch.id || chNum}
                                        id={`port-socket-${chNum}`}
                                        className={cn(
                                            "group relative flex items-center justify-between px-2 py-1.5 rounded-xl transition-all select-none border",
                                            isConnected
                                                ? `bg-gradient-to-r ${palette.bgGrad} ${palette.border} ${palette.glow}`
                                                : "bg-gradient-to-b from-[#0a1017] via-[#04070d] to-[#09111b] border-slate-700/80 text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),_0_2px_4px_rgba(0,0,0,0.5)] font-mono text-xs font-bold"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                                            <span className={cn(
                                                "w-2.5 h-2.5 rounded-full shrink-0 border border-black/40",
                                                isConnected ? `${palette.dot} animate-pulse` : "bg-slate-700"
                                            )} />
                                            <span className={isConnected ? `${palette.text} font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]` : "text-slate-300"}>
                                                {ch.name}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "text-[9px] font-mono opacity-90 truncate max-w-[55px] text-right font-semibold",
                                            isConnected ? palette.text : "text-slate-500"
                                        )}>
                                            {assigned ? (assigned.label || `Strip ${chNum}`) : (ch.stripCount > 0 ? `${ch.stripCount} Strip${ch.stripCount > 1 ? 's' : ''}` : (hasWire ? 'Connected' : 'Idle'))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* 3D Hardware Screw Terminal Block Footer */}
                    <div className="pt-2 mt-1 border-t border-emerald-500/30 flex items-center justify-between text-[9px] text-emerald-400/80 font-mono px-2 relative z-10">
                        <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-b from-emerald-900/80 to-emerald-950 border border-emerald-500/40 text-[8px] font-bold text-emerald-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                                GND | VCC | DATA
                            </span>
                        </div>
                        <span className="text-emerald-300 font-bold text-[9px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {channelsToRender.filter(ch => effectiveChannelAssignments[ch.chNum] || wirePaths.some(w => Number(w.ch) === ch.chNum) || ch.stripCount > 0).length}/{channelsToRender.length} Active
                        </span>
                    </div>
                </div>

                {/* ── Walls & Cupboards Real-Time Visual 2D Monitoring Stage ────────────────── */}
                <div className="flex-1 p-4 overflow-auto flex flex-col justify-center items-center relative z-10 w-full h-full">
                    {cupboardsWithLocalStrips.length > 0 ? (
                        <div className="w-full h-full flex items-center justify-center min-h-[300px]">
                            <Cupboard2D
                                cupboards={cupboardsWithLocalStrips}
                                controllerName={selectedController?.name}
                                layoutMode="horizontal"
                                onStripMove={handleStripMove}
                                onStripDoubleClick={handleStripDoubleClick}
                                hideInternalWires={true}
                                onZoomChange={() => calculateWirePaths()}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 text-center py-16">
                            <div className="w-14 h-14 rounded-2xl bg-ot-surface-elev-bottom border border-ot-border flex items-center justify-center">
                                <Box className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                No cupboards found for the selected walls.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Dialog 1: Controller Selection Modal ─────────────────────────────── */}
            <Dialog open={showControllerDialog} onOpenChange={setShowControllerDialog}>
                <DialogContent className="sm:max-w-md bg-ot-surface-top border-ot-border text-white shadow-2xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-ot-action/20 text-ot-action border border-ot-action/40">
                                Step 1 of 3
                            </span>
                        </div>
                        <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <Server className="w-5 h-5 text-ot-action" />
                            Select Hardware Controller
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Choose a controller to configure LED channels and monitor strip layouts.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-2 max-h-60 overflow-y-auto">
                        {controllersData.map((ctrl) => {
                            const isSelected = selectedController?.id === ctrl.id;
                            return (
                                <button
                                    key={ctrl.id}
                                    onClick={() => handleSelectController(ctrl)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                                        isSelected
                                            ? "bg-ot-action/20 border-ot-action text-white shadow-lg"
                                            : "bg-ot-surface-bottom/60 border-ot-border/60 hover:bg-ot-surface-bottom text-slate-200"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-ot-surface-top border border-ot-border flex items-center justify-center text-ot-action">
                                            <Cpu className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-white">{ctrl.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{ctrl.ip}:{ctrl.port}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-ot-surface-top border border-ot-border text-ot-action">
                                            {ctrl.channels || 16} CH
                                        </span>
                                        {isSelected && <Check className="w-4 h-4 text-ot-action" />}
                                    </div>
                                </button>
                            );
                        })}
                        {controllersData.length === 0 && (
                            <div className="text-center py-6 text-xs text-muted-foreground">
                                No controllers found. Please add a controller in the Controllers tab.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Dialog 2: Multi-select Walls Modal ───────────────────────────────── */}
            <Dialog open={showWallsDialog} onOpenChange={setShowWallsDialog}>
                <DialogContent className="sm:max-w-md bg-ot-surface-top border-ot-border text-white shadow-2xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-ot-action/20 text-ot-action border border-ot-action/40">
                                Step 2 of 3
                            </span>
                        </div>
                        <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-ot-action" />
                            Select Walls for {selectedController?.name || 'Controller'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Multi-select walls to view their cupboards and assign LED channels.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Available Walls:</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSelectAllWalls}
                                className="h-6 text-[11px] text-ot-action hover:bg-ot-action/10"
                            >
                                {selectedWallNames.length === filteredWallsForController.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {filteredWallsForController.map((wall) => {
                                const wallName = wall.name || wall.wall_name;
                                const isChecked = selectedWallNames.includes(wallName);
                                const cupboardsCount = cupboardsData.filter(c => c.wall === wallName).length;
                                return (
                                    <div
                                        key={wall.id || wallName}
                                        onClick={() => toggleWallSelection(wallName)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                                            isChecked
                                                ? "bg-ot-action/15 border-ot-action/80 text-white"
                                                : "bg-ot-surface-bottom/60 border-ot-border/60 hover:bg-ot-surface-bottom text-muted-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-5 h-5 rounded flex items-center justify-center border transition-all",
                                                isChecked ? "bg-ot-action border-ot-action text-white" : "border-ot-border"
                                            )}>
                                                {isChecked && <Check className="w-3.5 h-3.5" />}
                                            </div>
                                            <span className="font-semibold text-sm text-white">{wallName}</span>
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground">
                                            {cupboardsCount} Cupboard{cupboardsCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleConfirmWalls}
                            className="w-full bg-ot-action text-white hover:bg-ot-action-hover font-bold"
                        >
                            Confirm Walls & Load Layout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog 3: Controller Position Placement Modal ────────────────────── */}
            <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
                <DialogContent className="sm:max-w-md bg-ot-surface-top border-ot-border text-white shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-ot-action" />
                            Controller 3D Module Placement
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Position the 16-channel controller box relative to the monitoring canvas.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-3 py-3">
                        {[
                            { id: 'left', label: 'Left Side', icon: PanelLeft },
                            { id: 'top', label: 'Top Side', icon: PanelTop },
                            { id: 'right', label: 'Right Side', icon: PanelRight },
                            { id: 'bottom', label: 'Bottom Side', icon: PanelBottom },
                        ].map((pos) => {
                            const Icon = pos.icon;
                            const isSelected = controllerPlacement === pos.id;
                            return (
                                <button
                                    key={pos.id}
                                    onClick={async () => {
                                        setControllerPlacement(pos.id);
                                        try {
                                            localStorage.setItem('controllerPlacement', pos.id);
                                            localStorage.setItem('hasCompletedInitialSetup', 'true');
                                        } catch (e) { }
                                        setIsInitialSetupDone(true);
                                        setShowPositionDialog(false);

                                        const ctrlId = selectedController?.id || selectedController?.ctl_id;
                                        if (ctrlId) {
                                            let locId = '1';
                                            try {
                                                const selectedLocationStr = localStorage.getItem('selectedLocation');
                                                if (selectedLocationStr) {
                                                    const loc = JSON.parse(selectedLocationStr);
                                                    locId = String(loc.phr_location_id || '1');
                                                }
                                            } catch (e) { }

                                            const updatePayload = {
                                                ctl_name: selectedController.name || selectedController.ctl_name || '',
                                                ctl_ip: selectedController.ip || selectedController.ctl_ip || '',
                                                ctl_port: parseInt(selectedController.port || selectedController.ctl_port || 8080, 10),
                                                ctl_loc_id: String(selectedController.ctl_loc_id || selectedController.loc_id || locId),
                                                ctl_channels: String(selectedController.channels || selectedController.ctl_channels || 16),
                                                ctl_position: pos.id,
                                                ctl_status: (selectedController.status === 'Online' || selectedController.status === 'ACTIVE' || selectedController.ctl_status === 'True' || selectedController.ctl_status === true) ? "True" : "False"
                                            };
                                            try {
                                                await apiService.updateController(ctrlId, updatePayload);
                                                toast.success(`Position updated to ${pos.label} on controller`);
                                                if (typeof refetchStrips === 'function') refetchStrips();
                                            } catch (err) {
                                                console.error("Error updating controller placement position:", err);
                                                toast.error(`Failed to update controller position: ${err.message}`);
                                            }
                                        } else {
                                            toast.success(`Position set to ${pos.label}`);
                                        }
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 text-center",
                                        isSelected
                                            ? "bg-ot-action/20 border-ot-action text-white shadow-lg shadow-ot-action/10"
                                            : "bg-ot-surface-bottom/60 border-ot-border/60 hover:bg-ot-surface-bottom text-muted-foreground"
                                    )}
                                >
                                    <Icon className={cn("w-6 h-6", isSelected ? "text-ot-action" : "text-slate-400")} />
                                    <span className="text-xs font-bold">{pos.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Dialog 4: 16-Channel to LED Strip Assignment Modal ─────────────────── */}
            <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
                <DialogContent className="sm:max-w-xl bg-ot-surface-top border-ot-border text-white shadow-2xl max-h-[85vh] flex flex-col">
                    <DialogHeader className="shrink-0 pb-2 border-b border-ot-border/40">
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-ot-action/20 text-ot-action border border-ot-action/40">
                                Step 3 of 3: Channel Mapping
                            </span>
                        </div>
                        <DialogTitle className="text-lg font-bold text-white flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-ot-action" />
                                Assign 16 Channels to LED Strips
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAutoAssignChannels}
                                className="h-7 text-xs gap-1 border-ot-action/40 bg-ot-action/10 text-ot-action hover:bg-ot-action/20"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Auto-Assign
                            </Button>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Map each channel output (CH 01 – CH 16) to an LED strip installed on the selected cupboards.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1">
                        {channelsToRender.map((ch) => {
                            const chNum = ch.chNum;
                            const assignedStrip = channelAssignments[chNum];
                            const assignedVal = assignedStrip ? String(assignedStrip.id || assignedStrip.strip_id) : 'none';

                            return (
                                <div
                                    key={ch.id || chNum}
                                    className="flex items-center justify-between p-2.5 rounded-xl border border-ot-border/50 bg-ot-surface-bottom/60 hover:bg-ot-surface-bottom transition-all gap-4"
                                >
                                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-ot-action shrink-0">
                                        <span className="w-6 h-6 rounded-md bg-ot-action/20 flex items-center justify-center text-[11px]">
                                            {chNum}
                                        </span>
                                        <span>{ch.name}</span>
                                    </div>

                                    <div className="flex-1 max-w-xs">
                                        <Select
                                            value={assignedVal}
                                            onValueChange={(val) => handleAssignChannelStrip(chNum, val)}
                                        >
                                            <SelectTrigger className="h-8 bg-ot-surface-top border-ot-border text-xs text-white">
                                                <SelectValue placeholder="Select LED Strip" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-ot-surface-top border-ot-border text-white max-h-48">
                                                <SelectItem value="none" className="text-muted-foreground text-xs">
                                                    -- Unassigned --
                                                </SelectItem>
                                                {availableStrips.map((strip) => (
                                                    <SelectItem
                                                        key={strip.id || strip.strip_id}
                                                        value={String(strip.id || strip.strip_id)}
                                                        className="text-xs"
                                                    >
                                                        {strip.label} ({strip.cupboardName})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <DialogFooter className="shrink-0 pt-2 border-t border-ot-border/40">
                        <Button
                            onClick={handleSaveChannelAssignments}
                            className="w-full bg-ot-action text-white hover:bg-ot-action-hover font-bold"
                        >
                            Save Channel Assignments
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog 5: Add LED Strip & Channel Selection Modal ────────────────────── */}
            <Dialog open={showAddStripDialog} onOpenChange={setShowAddStripDialog}>
                <DialogContent className="sm:max-w-xl bg-ot-surface-top border-ot-border text-white shadow-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="shrink-0 pb-2 border-b border-ot-border/40">
                        <DialogTitle className="text-lg font-bold text-white flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-400" />
                                Add LED Strip & Hardware Wiring
                            </span>
                            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
                                Designer Mode
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Configure how this LED strip connects to your controller or daisy chains from an existing strip.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
                        {/* Connection Mode Options Selector */}
                        <div>
                            <label className="text-xs font-bold text-slate-200 mb-2 block uppercase tracking-wider font-mono">
                                1. Connection Mode:
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAddStripMode('channel')}
                                    className={cn(
                                        "flex flex-col items-start p-3 rounded-xl border transition-all text-left relative",
                                        addStripMode === 'channel'
                                            ? "bg-emerald-950/80 border-emerald-400 text-emerald-100 shadow-[0_0_15px_rgba(52,211,153,0.25)] ring-2 ring-emerald-400"
                                            : "bg-ot-surface-bottom/50 border-ot-border/60 text-slate-400 hover:bg-ot-surface-bottom"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <Zap className="w-4 h-4 text-emerald-400" />
                                        <span>New Channel Port</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Connect directly from a controller output socket to the strip IN pin.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAddStripMode('daisy_chain');
                                        if (availableStrips.length > 0 && !selectedParentStripId) {
                                            setSelectedParentStripId(String(availableStrips[0].id || availableStrips[0].strip_id));
                                        }
                                    }}
                                    className={cn(
                                        "flex flex-col items-start p-3 rounded-xl border transition-all text-left relative",
                                        addStripMode === 'daisy_chain'
                                            ? "bg-purple-950/80 border-purple-400 text-purple-100 shadow-[0_0_15px_rgba(192,132,252,0.25)] ring-2 ring-purple-400"
                                            : "bg-ot-surface-bottom/50 border-ot-border/60 text-slate-400 hover:bg-ot-surface-bottom"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <ArrowRight className="w-4 h-4 text-purple-400" />
                                        <span>Continue from Previous Strip</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Daisy chain from previous strip's OUT pin ➔ to new strip's IN pin.
                                    </p>
                                </button>
                            </div>
                        </div>

                        {/* Connection Mode 1: Dynamic Channel Grid */}
                        {addStripMode === 'channel' && (
                            <div>
                                <label className="text-xs font-bold text-slate-200 mb-2 block uppercase tracking-wider font-mono">
                                    2. Select Controller Port Socket ({channelsToRender.length}-CH):
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {channelsToRender.map((ch) => {
                                        const chNum = ch.chNum;
                                        const isSelected = selectedAddChannel === chNum;
                                        const existingAssignment = effectiveChannelAssignments[chNum];

                                        return (
                                            <button
                                                key={ch.id || chNum}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedAddChannel(chNum);
                                                    if (!newStripName || newStripName.startsWith('Strip CH-')) {
                                                        setNewStripName(`Strip ${ch.name}`);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center relative",
                                                    isSelected
                                                        ? "bg-emerald-950/80 border-emerald-400 text-emerald-100 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-2 ring-emerald-400"
                                                        : existingAssignment
                                                            ? "bg-ot-surface-bottom/80 border-amber-500/40 text-amber-300 hover:bg-ot-surface-bottom"
                                                            : "bg-ot-surface-bottom/40 border-ot-border/60 text-slate-300 hover:bg-ot-surface-bottom hover:border-slate-500"
                                                )}
                                            >
                                                {isSelected && (
                                                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center">
                                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                    </div>
                                                )}
                                                <span className="font-mono text-xs font-bold">{ch.name}</span>
                                                <span className="text-[9px] font-mono mt-0.5 opacity-80 truncate max-w-[70px]">
                                                    {existingAssignment ? existingAssignment.label : 'Available'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Connection Mode 2: Daisy Chain Select Parent Strip */}
                        {addStripMode === 'daisy_chain' && (
                            <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-3">
                                <label className="text-xs font-bold text-purple-300 block uppercase tracking-wider font-mono">
                                    2. Select Previous Strip to Chain From:
                                </label>
                                {availableStrips.length > 0 ? (
                                    <Select
                                        value={selectedParentStripId}
                                        onValueChange={setSelectedParentStripId}
                                    >
                                        <SelectTrigger className="h-10 bg-ot-surface-bottom border-purple-500/40 text-xs text-white">
                                            <SelectValue placeholder="Select Previous Strip" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-ot-surface-top border-ot-border text-white">
                                            {availableStrips.map((strip) => (
                                                <SelectItem
                                                    key={strip.id || strip.strip_id}
                                                    value={String(strip.id || strip.strip_id)}
                                                    className="text-xs"
                                                >
                                                    {strip.label} (CH-{strip.channel || 1} • {strip.cupboardName})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="text-xs text-amber-400 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                                        No existing strips available. Create a direct channel strip first.
                                    </div>
                                )}

                                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-900/30 border border-purple-500/30 text-[11px] text-purple-200 font-mono">
                                    <span className="px-1.5 py-0.5 rounded bg-purple-500 text-white font-bold text-[9px]">OUT</span>
                                    <span>➔ Data Wire ➔</span>
                                    <span className="px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 font-bold text-[9px]">IN</span>
                                    <span className="text-slate-400 text-[10px] ml-auto">Signal Flow</span>
                                </div>
                            </div>
                        )}

                        {/* Strip Name & Target Cupboard */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                                    LED Strip Label:
                                </label>
                                <input
                                    type="text"
                                    value={newStripName}
                                    onChange={(e) => setNewStripName(e.target.value)}
                                    placeholder="e.g. Shelf Strip 01"
                                    className="w-full h-9 rounded-lg bg-ot-surface-bottom border border-ot-border px-3 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                                    Target Cupboard:
                                </label>
                                <Select
                                    value={newStripCupboardId}
                                    onValueChange={setNewStripCupboardId}
                                >
                                    <SelectTrigger className="h-9 bg-ot-surface-bottom border-ot-border text-xs text-white">
                                        <SelectValue placeholder="Select Cupboard" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-ot-surface-top border-ot-border text-white">
                                        {filteredCupboards.map((cup) => (
                                            <SelectItem key={cup.id} value={String(cup.id || cup.cupboard_id)}>
                                                {cup.name} ({cup.wall || 'Wall'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 pt-2 border-t border-ot-border/40 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddStripDialog(false)}
                            className="border-ot-border text-slate-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateStrip}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5"
                        >
                            <Check className="w-4 h-4" /> Save & Place Strip
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog 6: Strip Settings & Options Modal (Double-Click Triggered) ───────── */}
            <Dialog open={showAssignBinsDialog} onOpenChange={setShowAssignBinsDialog}>
                <DialogContent className="sm:max-w-lg bg-ot-surface-top border-ot-border text-white shadow-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="shrink-0 pb-2 border-b border-ot-border/40">
                        <DialogTitle className="text-lg font-bold text-white flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-ot-action" />
                                {activeStripForBins?.label || 'LED Strip'} Configuration
                            </span>
                            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold">
                                CH-{String(activeStripForBins?.channel || 1).padStart(2, '0')}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Double-click menu: Assign storage bins, re-assign controller channel, or delete strip.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
                        {/* Section 1: Re-assign Controller Channel */}
                        <div className="p-3 rounded-xl border border-ot-border/50 bg-ot-surface-bottom/60 space-y-2">
                            <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                1. Controller Channel Output:
                            </label>
                            <Select
                                value={String(activeStripForBins?.channel || 1)}
                                onValueChange={(val) => handleUpdateStripChannel(val)}
                            >
                                <SelectTrigger className="h-9 bg-ot-surface-top border-ot-border text-xs text-white">
                                    <SelectValue placeholder="Select Channel" />
                                </SelectTrigger>
                                <SelectContent className="bg-ot-surface-top border-ot-border text-white max-h-48">
                                    {channelsToRender.map(ch => (
                                        <SelectItem key={ch.id || ch.chNum} value={String(ch.chNum)} className="text-xs font-mono">
                                            {ch.name} ({ch.fullName})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section 2: Assign Storage Bins */}
                        <div className="p-3.5 rounded-xl border border-ot-border/50 bg-ot-surface-bottom/60 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider font-mono flex items-center gap-1.5">
                                    <Box className="w-3.5 h-3.5 text-ot-action" />
                                    2. Assign Illuminated Bins:
                                </label>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ot-action/20 border border-ot-action/40 text-cyan-300">
                                    {selectedBinIds.length} Selected
                                </span>
                            </div>

                            {/* Search and Quick Filters */}
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by bin name, ID, or shelf..."
                                        value={binSearchQuery}
                                        onChange={(e) => setBinSearchQuery(e.target.value)}
                                        className="w-full h-8 pl-8 pr-8 bg-ot-surface-top border border-ot-border/80 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-ot-action"
                                    />
                                    {binSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setBinSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-[11px] px-0.5">
                                    <span className="text-slate-400">
                                        Showing {allAvailableBins.filter(b => {
                                            if (!binSearchQuery.trim()) return true;
                                            const q = binSearchQuery.toLowerCase();
                                            return b.label.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.shelfName.toLowerCase().includes(q) || b.cupboardName.toLowerCase().includes(q);
                                        }).length} of {allAvailableBins.length} bins
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const stripCupId = String(activeStripForBins?.cupboardId || activeStripForBins?.cupboard_id || '');
                                                const cupboardBins = allAvailableBins.filter(b => String(b.cupboardId) === stripCupId || !stripCupId);
                                                const cupboardBinIds = cupboardBins.map(b => b.id);
                                                setSelectedBinIds(prev => Array.from(new Set([...prev, ...cupboardBinIds])));
                                            }}
                                            className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
                                        >
                                            Cupboard Bins
                                        </button>
                                        <span className="text-slate-600">•</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedBinIds(allAvailableBins.map(b => b.id))}
                                            className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
                                        >
                                            Select All
                                        </button>
                                        <span className="text-slate-600">•</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedBinIds([])}
                                            className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 hover:underline"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Bins Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                {allAvailableBins.filter(b => {
                                    if (!binSearchQuery.trim()) return true;
                                    const q = binSearchQuery.toLowerCase();
                                    return b.label.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.shelfName.toLowerCase().includes(q) || b.cupboardName.toLowerCase().includes(q);
                                }).map(bin => {
                                    const isSelected = selectedBinIds.includes(bin.id) || selectedBinIds.includes(bin.label);
                                    return (
                                        <button
                                            key={bin.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedBinIds(prev => {
                                                    const hasIt = prev.includes(bin.id) || prev.includes(bin.label);
                                                    if (hasIt) {
                                                        return prev.filter(bId => bId !== bin.id && bId !== bin.label);
                                                    } else {
                                                        return [...prev, bin.id];
                                                    }
                                                });
                                            }}
                                            className={cn(
                                                "flex flex-col p-2 rounded-lg border text-left transition-all relative group",
                                                isSelected
                                                    ? "bg-ot-action/20 border-ot-action text-white font-bold shadow-sm ring-1 ring-ot-action/40"
                                                    : "bg-ot-surface-bottom/40 border-ot-border/60 text-slate-300 hover:bg-ot-surface-bottom hover:border-slate-500"
                                            )}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-bold text-xs truncate max-w-[80%]">{bin.label}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-ot-action shrink-0" />}
                                            </div>
                                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                                <span>{bin.cupboardName}</span>
                                                <span>•</span>
                                                <span>{bin.shelfName}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section 3: Delete Strip Action */}
                        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 flex items-center justify-between">
                            <div>
                                <h5 className="text-xs font-bold text-rose-300">Delete LED Strip</h5>
                                <p className="text-[10px] text-rose-400/80">Remove this strip permanently from the hardware layout.</p>
                            </div>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handlePromptDeleteStrip(activeStripForBins)}
                                className="gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Strip
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 pt-2 border-t border-ot-border/40 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowAssignBinsDialog(false)}
                            className="border-ot-border text-slate-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveBinsForStrip}
                            className="bg-ot-action text-white hover:bg-ot-action-hover font-bold flex-1"
                        >
                            Save Bin Assignments ({selectedBinIds.length} Bins)
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={stripDeleteDialogOpen}
                onOpenChange={setStripDeleteDialogOpen}
                title="Delete LED Strip"
                description={`Are you sure you want to delete "${stripToDelete?.label || 'this LED strip'}"? This action cannot be undone and will permanently remove it from the API.`}
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
