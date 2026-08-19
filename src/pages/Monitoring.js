import React, { useState, useCallback, lazy, Suspense, useMemo, useEffect } from 'react';
import { Card, CardContent } from 'components/ui/card';
import Cupboard2D from 'components/visualization/Cupboard2D';
import { Layers, Box, MonitorPlay, ChevronRight, PanelRightClose, PanelRightOpen, LayoutGrid, List, Loader2, Cpu } from 'lucide-react';
import { cn } from 'lib/utils';
import { CONTROLLERS_CONFIG, WALLS_CONFIG, CUPBOARDS_CONFIG, getCupboardAssignments } from 'lib/dataStore';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from 'components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Button } from 'components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiService } from 'lib/apiService';

// Cupboard3D is lazy-loaded — Three.js (~600 KB) is only fetched when user
// clicks "3D View", keeping the initial bundle small and TBT low.
const Cupboard3D = lazy(() => import('components/visualization/Cupboard3D'));

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
];

// Shown inside the canvas area while Three.js chunk is being fetched
function Canvas3DLoader() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <span className="w-8 h-8 border-2 border-ot-border border-t-ot-action rounded-full animate-spin" />
            <span className="text-sm">Loading 3D scene…</span>
        </div>
    );
}

export default function Monitoring() {
    const [viewMode, setViewMode] = useState('2d'); // '2d' | '3d'
    const [layoutMode, setLayoutMode] = useState('horizontal'); // 'horizontal' | 'vertical'
    const [controlsVisible, setControlsVisible] = useState(true);
    const [activeCupboardIdx, setActiveCupboardIdx] = useState(0);

    const containerRef = React.useRef(null);
    const [wirePaths, setWirePaths] = useState([]);

    const locId = React.useMemo(() => {
        try {
            const selectedLocationStr = localStorage.getItem('selectedLocation');
            if (selectedLocationStr) {
                const loc = JSON.parse(selectedLocationStr);
                return loc.phr_location_id || '';
            }
        } catch (e) { }
        return '';
    }, []);

    const { data: fetchedControllers, isFetching: isFetchingControllers } = useQuery({
        queryKey: ['controllers', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getControllers(locId);
            if (!data.success || !data.data) throw new Error("Failed to fetch controllers");
            return data.data.map(c => ({
                id: c.ctl_id || c.id || Math.random().toString(36).substr(2, 9),
                ctl_id: c.ctl_id || c.id,
                name: c.ctl_name,
                ip: c.ctl_ip,
                port: c.ctl_port,
                ctl_loc_id: c.ctl_loc_id,
                ctl_channels: c.ctl_channels,
                position: c.ctl_position && c.ctl_position !== 'none' ? c.ctl_position : 'left',
                ctl_position: c.ctl_position || 'none',
                status: (c.ctl_status === 'True' || c.ctl_status === true || c.ctl_status === 'Online') ? 'Online' : 'Offline'
            }));
        },
        enabled: !!locId,
    });

    const { data: stripConfigData } = useQuery({
        queryKey: ['monitoringStripConfig', locId, fetchedControllers],
        queryFn: async () => {
            if (!locId) return { channelMap: {}, loadedStrips: [] };

            const channelMap = {};
            const loadedStrips = [];

            try {
                const stripsRes = await apiService.getStrips(locId);
                const fetchedStrips = (stripsRes && stripsRes.success && Array.isArray(stripsRes.data))
                    ? stripsRes.data
                    : (Array.isArray(stripsRes?.data) ? stripsRes.data : (Array.isArray(stripsRes) ? stripsRes : []));

                const controllersList = fetchedControllers || [];

                for (const ctrl of controllersList) {
                    const ctrlId = ctrl.ctl_id || ctrl.id;
                    if (!ctrlId) continue;

                    try {
                        const channelsRes = await apiService.getChannels(ctrlId);
                        const channelsList = channelsRes?.data || (Array.isArray(channelsRes) ? channelsRes : []);

                        if (Array.isArray(channelsList) && channelsList.length > 0) {
                            for (let idx = 0; idx < channelsList.length; idx++) {
                                const ch = channelsList[idx];
                                const chNum = idx + 1;
                                const channelId = ch.channel_id || ch.id;
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
                                                channel_id: channelId,
                                                colorIndex: loadedStrips.length,
                                                strip_ctl_id: String(ctrlId),
                                                parentStripId: matchedStrip.parentStripId || matchedStrip.parent_strip_id || csItem.parent_strip_id || null,
                                                x: parseFloat(csItem.x ?? matchedStrip.strip_gridx ?? 40),
                                                y: parseFloat(csItem.y ?? matchedStrip.strip_gridy ?? (40 + idx * 35)),
                                                width: parseFloat(matchedStrip.strip_width ?? 80),
                                                height: parseFloat(matchedStrip.strip_height ?? 22),
                                                cupboardId: String(matchedStrip.strip_cupboard_id || matchedStrip.cupboard_id || csItem.cupboard_id || '1'),
                                                bins: matchedStrip.bin_list || matchedStrip.bins || [],
                                                linkedBins: matchedStrip.bin_list || matchedStrip.linkedBins || matchedStrip.bins || []
                                            };

                                            channelMap[chNum] = formattedStrip;
                                            loadedStrips.push(formattedStrip);
                                        });
                                    }
                                } catch (e) { }
                            }
                        }
                    } catch (e) { }
                }

                fetchedStrips.forEach((s, idx) => {
                    const sId = String(s.strip_id || s.id || `strip-${idx}`);
                    const alreadyLoaded = loadedStrips.some(ls => String(ls.id || ls.strip_id) === sId);
                    if (!alreadyLoaded) {
                        const chNum = Number(s.strip_channel || s.channel || (idx % 16) + 1);
                        const formatted = {
                            id: sId,
                            strip_id: sId,
                            label: s.strip_name || s.label || `Strip ${idx + 1}`,
                            channel: chNum,
                            colorIndex: loadedStrips.length,
                            parentStripId: s.parentStripId || s.parent_strip_id || null,
                            x: parseFloat(s.strip_gridx ?? 40),
                            y: parseFloat(s.strip_gridy ?? (40 + idx * 35)),
                            width: parseFloat(s.strip_width ?? 80),
                            height: parseFloat(s.strip_height ?? 22),
                            cupboardId: String(s.strip_cupboard_id || s.cupboard_id || '1'),
                            bins: s.bin_list || s.bins || [],
                            linkedBins: s.bin_list || s.linkedBins || s.bins || []
                        };
                        loadedStrips.push(formatted);
                    }
                });

                return { channelMap, loadedStrips };
            } catch (e) {
                return { channelMap, loadedStrips };
            }
        },
        enabled: !!locId,
    });

    const controllerPlacement = useMemo(() => {
        return localStorage.getItem('controllerPlacement') || 'left';
    }, []);

    const channelAssignments = useMemo(() => {
        let map = {};
        if (stripConfigData?.channelMap && Object.keys(stripConfigData.channelMap).length > 0) {
            map = { ...stripConfigData.channelMap };
        }
        try {
            const saved = localStorage.getItem('localChannelAssignments');
            if (saved) {
                const parsed = JSON.parse(saved);
                map = { ...map, ...parsed };
            }
        } catch (e) { }
        return map;
    }, [stripConfigData]);

    const allSavedStrips = useMemo(() => {
        let list = [];
        if (stripConfigData?.loadedStrips && stripConfigData.loadedStrips.length > 0) {
            list = [...stripConfigData.loadedStrips];
        }
        try {
            const saved = localStorage.getItem('localLedStrips');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    parsed.forEach(ls => {
                        const lsId = String(ls.id || ls.strip_id);
                        if (!list.some(item => String(item.id || item.strip_id) === lsId)) {
                            list.push(ls);
                        }
                    });
                }
            }
        } catch (e) { }
        return list;
    }, [stripConfigData]);

    const calculateWirePaths = useCallback(() => {
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

        const headerElem = containerRef.current.querySelector('.bg-ot-surface-top');
        const minAllowedY = headerElem ? (headerElem.getBoundingClientRect().bottom - containerRect.top + 4) : 4;

        for (let ch = 1; ch <= 16; ch++) {
            let chStrips = allSavedStrips.filter(s => {
                const sCh = Number(s.channel) || (s.channel ? parseInt(String(s.channel).replace(/\D/g, ''), 10) : null);
                return sCh === ch;
            });

            if (chStrips.length === 0 && channelAssignments[ch]) {
                chStrips = [channelAssignments[ch]];
            }

            if (chStrips.length === 0) continue;

            chStrips.forEach((strip, idx) => {
                const stripId = strip.id || strip.strip_id;
                const targetInElem = getInAnchor(strip);
                if (!targetInElem) return;

                if (idx === 0 && !strip.parentStripId) {
                    const portElem = document.getElementById(`monitoring-port-socket-${ch}`);
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
                    const prevStrip = strip.parentStripId
                        ? allSavedStrips.find(s => String(s.id || s.strip_id) === String(strip.parentStripId))
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
    }, [allSavedStrips, channelAssignments, controllerPlacement]);

    useEffect(() => {
        if (viewMode !== '2d') return;
        let rafId;
        const update = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                calculateWirePaths();
            });
        };
        update();
        const timer = setTimeout(update, 300);
        const timer2 = setTimeout(update, 800);
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            clearTimeout(timer);
            clearTimeout(timer2);
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [viewMode, calculateWirePaths]);





    const { data: rawWalls, isFetching: isFetchingWalls } = useQuery({
        queryKey: ['walls', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getWalls(locId);
            if (!data.success || !data.data) throw new Error("Failed to fetch walls");
            return data.data;
        },
        enabled: !!locId,
    });

    const { data: rawCupboards, isFetching: isFetchingCupboards } = useQuery({
        queryKey: ['cupboards', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getCupboards(locId);
            if (!data.success || !data.data) throw new Error("Failed to fetch cupboards");
            return data.data;
        },
        enabled: !!locId,
    });

    const { data: rawShelves, isFetching: isFetchingShelves } = useQuery({
        queryKey: ['shelves', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getShelves(locId);
            if (!data.success || !data.data) throw new Error("Failed to fetch shelves");
            return data.data;
        },
        enabled: !!locId,
    });

    const { data: rawBins, isFetching: isFetchingBins } = useQuery({
        queryKey: ['bins', locId],
        queryFn: async () => {
            if (!locId) return [];
            const data = await apiService.getBins(locId, 'All');
            if (!data.success || !data.data) throw new Error("Failed to fetch bins");
            return data.data;
        },
        enabled: !!locId,
    });



    const [controllersData, setControllersData] = useState([...CONTROLLERS_CONFIG]);
    const [wallsData, setWallsData] = useState([...WALLS_CONFIG]);
    const [cupboardsData, setCupboardsData] = useState([...CUPBOARDS_CONFIG]);

    useEffect(() => {
        if (fetchedControllers) {
            setControllersData(prev => {
                if (JSON.stringify(prev) === JSON.stringify(fetchedControllers)) return prev;
                return fetchedControllers;
            });
            CONTROLLERS_CONFIG.length = 0;
            fetchedControllers.forEach(c => CONTROLLERS_CONFIG.push(c));
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
            WALLS_CONFIG.length = 0;
            mapped.forEach(w => WALLS_CONFIG.push(w));
        }
    }, [rawWalls, fetchedControllers]);

    useEffect(() => {
        if (rawCupboards && rawWalls && fetchedControllers) {
            const mapped = rawCupboards.map(c => {
                const wall = rawWalls.find(w => String(w.wall_id) === String(c.cupboard_wall_id));
                const ctrl = fetchedControllers.find(ctrl => String(ctrl.id) === String(c.cupboard_ctl_id));

                let shelfLayout = [];
                if (rawShelves && Array.isArray(rawShelves)) {
                    const cId = String(c.cupboard_id || c.id || '').trim();
                    const cName = String(c.cupboard_name || c.name || '').trim();

                    const matchingShelves = rawShelves.filter(s => {
                        const sCupId = String(s.shelf_cupboard_id || '').trim();
                        let isMatch = false;
                        if (sCupId) {
                            isMatch = (
                                sCupId === cId ||
                                sCupId === cName ||
                                (c.cupboard_id !== undefined && sCupId === String(c.cupboard_id).trim()) ||
                                (c.id !== undefined && sCupId === String(c.id).trim()) ||
                                (c.name !== undefined && sCupId === String(c.name).trim()) ||
                                (c.cupboard_name !== undefined && sCupId === String(c.cupboard_name).trim())
                            );
                        } else {
                            const sWallId = String(s.shelf_wall_id || '').trim();
                            const sCtlId = String(s.shelf_ctl_id || '').trim();
                            const cWallId = String(c.cupboard_wall_id || c.wall_id || '').trim();
                            const cCtlId = String(c.cupboard_ctl_id || c.controller_id || '').trim();

                            if (sWallId && cWallId && sWallId === cWallId) isMatch = true;
                            else if (sCtlId && cCtlId && sCtlId === cCtlId) isMatch = true;
                            else if (rawCupboards && rawCupboards.length === 1) isMatch = true;
                        }

                        if (!isMatch) return false;

                        const isPlacedShelf = (s.shelf_placed !== undefined && s.shelf_placed !== null)
                            ? (typeof s.shelf_placed === 'boolean' ? s.shelf_placed : String(s.shelf_placed).toLowerCase() === 'true')
                            : (s.placed !== undefined ? (typeof s.placed === 'boolean' ? s.placed : String(s.placed).toLowerCase() === 'true') : false);
                        const isShelfStatusFalse = (s.shelf_status !== undefined && s.shelf_status !== null && (s.shelf_status === false || String(s.shelf_status).toLowerCase() === 'false'));
                        if (!isPlacedShelf || isShelfStatusFalse) return false;

                        return true;
                    });

                    if (matchingShelves.length > 0) {
                        shelfLayout = matchingShelves.map((s, idx) => {
                            const realId = (s.shelf_id !== undefined && s.shelf_id !== null) ? String(s.shelf_id) : ((s.id !== undefined && s.id !== null) ? String(s.id) : `shelf-${idx}`);

                            const isAssigned = (s.shelf_status === 'True' || s.shelf_status === true || s.shelf_status === 'Active');
                            const hasGridX = s.shelf_gridx !== undefined && s.shelf_gridx !== null && s.shelf_gridx !== '' && !isNaN(parseFloat(s.shelf_gridx));
                            const hasGridY = s.shelf_gridy !== undefined && s.shelf_gridy !== null && s.shelf_gridy !== '' && !isNaN(parseFloat(s.shelf_gridy));
                            const hasWidth = s.shelf_width !== undefined && s.shelf_width !== null && s.shelf_width !== '' && !isNaN(parseFloat(s.shelf_width));
                            const hasHeight = s.shelf_height !== undefined && s.shelf_height !== null && s.shelf_height !== '' && !isNaN(parseFloat(s.shelf_height));

                            const isPlaced = (s.shelf_placed !== undefined && s.shelf_placed !== null)
                                ? (typeof s.shelf_placed === 'boolean' ? s.shelf_placed : String(s.shelf_placed).toLowerCase() === 'true')
                                : (s.placed !== undefined ? (typeof s.placed === 'boolean' ? s.placed : String(s.placed).toLowerCase() === 'true') : false);

                            let bins = [];
                            if (rawBins && Array.isArray(rawBins)) {
                                const matchingBins = rawBins.filter(b => {
                                    // 1. Match Location ID
                                    const bLocId = String(b.bin_loc_id || b.loc_id || '').trim();
                                    const currentLocIdStr = String(locId || '').trim();
                                    if (bLocId && currentLocIdStr && currentLocIdStr !== 'All' && bLocId !== currentLocIdStr) {
                                        return false;
                                    }

                                    // 2. Match Controller ID
                                    const bCtlId = String(b.bin_ctl_id || b.ctl_id || '').trim();
                                    const cCtlId = String(c.cupboard_ctl_id || c.controller_id || s.shelf_ctl_id || '').trim();
                                    if (bCtlId && cCtlId && bCtlId !== '0' && cCtlId !== '0' && bCtlId !== cCtlId) {
                                        return false;
                                    }

                                    // 3. Match Cupboard ID (if present on bin)
                                    const bCupId = String(b.bin_cupboard_id || b.cupboard_id || '').trim();
                                    const cId = String(c.cupboard_id || c.id || '').trim();
                                    const cName = String(c.cupboard_name || c.name || '').trim();
                                    if (bCupId && (cId || cName)) {
                                        if (bCupId !== cId && bCupId !== cName) {
                                            return false;
                                        }
                                    }

                                    // 4. Match Pharmacy Shelf ID / Shelf ID
                                    const bShelfPhrId = String(b.bin_shelf_phr_id || '').trim();
                                    const bShelfId = String(b.bin_shelf_id || b.shelf_id || '').trim();
                                    const bPhrId = String(b.bin_phr_id || b.phr_id || '').trim();

                                    const sPhrId = String(s.shelf_phr_id || s.phr_id || '').trim();
                                    const sShelfId = String(s.shelf_id || s.id || '').trim();
                                    const sRealId = String(realId || '').trim();
                                    const sName = String(s.shelf_name || s.name || '').trim();

                                    const isShelfMatch = (
                                        (bShelfPhrId !== '' && (
                                            bShelfPhrId === sPhrId ||
                                            bShelfPhrId === sShelfId ||
                                            bShelfPhrId === sRealId ||
                                            bShelfPhrId === sName
                                        )) ||
                                        (bShelfId !== '' && (
                                            bShelfId === sPhrId ||
                                            bShelfId === sShelfId ||
                                            bShelfId === sRealId ||
                                            bShelfId === sName
                                        )) ||
                                        (bPhrId !== '' && sPhrId !== '' && bPhrId === sPhrId)
                                    );

                                    if (!isShelfMatch) {
                                        return false;
                                    }

                                    const isPlacedBin = (b.bin_placed !== undefined && b.bin_placed !== null)
                                        ? (typeof b.bin_placed === 'boolean' ? b.bin_placed : String(b.bin_placed).toLowerCase() === 'true')
                                        : (b.placed !== undefined ? (typeof b.placed === 'boolean' ? b.placed : String(b.placed).toLowerCase() === 'true') : false);
                                    const isBinStatusFalse = (b.bin_status !== undefined && b.bin_status !== null && (b.bin_status === false || String(b.bin_status).toLowerCase() === 'false'));

                                    return isPlacedBin && !isBinStatusFalse;
                                });

                                // Sort matching bins sequentially (by order / id / name)
                                matchingBins.sort((a, b) => {
                                    const orderA = Number(a.bin_order !== undefined ? a.bin_order : 999);
                                    const orderB = Number(b.bin_order !== undefined ? b.bin_order : 999);
                                    if (orderA !== orderB) return orderA - orderB;
                                    return String(a.bin_name || a.bin_id || '').localeCompare(String(b.bin_name || b.bin_id || ''), undefined, { numeric: true });
                                });

                                if (matchingBins.length > 0) {
                                    bins = matchingBins.map((b, bIdx) => {
                                        const defaultWidth = 80;
                                        const defaultHeight = 44;
                                        const gap = 10;
                                        const hasX = b.bin_gridx !== undefined && b.bin_gridx !== null && String(b.bin_gridx).trim() !== '' && !isNaN(parseFloat(b.bin_gridx));
                                        const hasY = b.bin_gridy !== undefined && b.bin_gridy !== null && String(b.bin_gridy).trim() !== '' && !isNaN(parseFloat(b.bin_gridy));
                                        const hasW = b.bin_width !== undefined && b.bin_width !== null && String(b.bin_width).trim() !== '' && !isNaN(parseFloat(b.bin_width));
                                        const hasH = b.bin_height !== undefined && b.bin_height !== null && String(b.bin_height).trim() !== '' && !isNaN(parseFloat(b.bin_height));

                                        return {
                                            id: String(b.bin_id || `bin-${bIdx}`),
                                            bin_id: b.bin_id,
                                            label: b.bin_name || `Bin ${bIdx + 1}`,
                                            x: hasX ? parseFloat(b.bin_gridx) : (10 + bIdx * (defaultWidth + gap)),
                                            y: hasY ? parseFloat(b.bin_gridy) : 6,
                                            width: hasW ? parseFloat(b.bin_width) : defaultWidth,
                                            height: hasH ? parseFloat(b.bin_height) : defaultHeight,
                                            placed: true,
                                            bin_order: b.bin_order !== undefined ? b.bin_order : bIdx + 1,
                                            bin_phr_id: b.bin_phr_id || b.phr_id || "",
                                            bin_shelf_phr_id: b.bin_shelf_phr_id || b.bin_shelf_id || s.shelf_phr_id || s.shelf_id || "",
                                            bin_ctl_id: b.bin_ctl_id || b.ctl_id || s.shelf_ctl_id || c.cupboard_ctl_id || c.controller_id || "",
                                            bin_org_id: b.bin_org_id || "skshospital",
                                            bin_branch_id: b.bin_branch_id || "Salem",
                                            bin_status: b.bin_status,
                                            bin_shelf_id: b.bin_shelf_id || s.shelf_id
                                        };
                                    });
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
                                            bins = lsShelf.bins.filter(b => b.placed !== false).map((b, bIdx) => ({
                                                ...b,
                                                id: String(b.id || b.bin_id || `bin-${bIdx}`),
                                                label: b.label || b.bin_name || `Bin ${bIdx + 1}`,
                                                x: (b.x !== undefined && b.x !== null && !isNaN(parseFloat(b.x))) ? parseFloat(b.x) : (10 + bIdx * 90),
                                                y: (b.y !== undefined && b.y !== null && !isNaN(parseFloat(b.y))) ? parseFloat(b.y) : 6,
                                                width: (b.width !== undefined && b.width !== null && !isNaN(parseFloat(b.width))) ? parseFloat(b.width) : 80,
                                                height: (b.height !== undefined && b.height !== null && !isNaN(parseFloat(b.height))) ? parseFloat(b.height) : 44
                                            }));
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
                                placed: isPlaced,
                                shelf_placed: isPlaced,
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

                const cId = String(c.cupboard_id || c.id || '').trim();
                const cName = String(c.cupboard_name || c.name || '').trim();

                const matchingStrips = allSavedStrips.filter(s => {
                    const sCupId = String(s.cupboardId || s.cupboard_id || s.strip_cupboard_id || '').trim();
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

                    const sShelfId = String(s.strip_shelf_id || s.shelf_id || '').trim();
                    if (sShelfId && shelfLayout && shelfLayout.length > 0) {
                        const matchesShelf = shelfLayout.some(sh => {
                            const shId = String(sh.shelf_id || sh.id || '').trim();
                            const shPhrId = String(sh.shelf_phr_id || '').trim();
                            const shName = String(sh.label || sh.shelf_name || '').trim();
                            return sShelfId === shId || sShelfId === shPhrId || sShelfId === shName;
                        });
                        if (matchesShelf) return true;
                    }

                    const sBins = s.bin_list || s.bins || s.linkedBins || [];
                    if (Array.isArray(sBins) && sBins.length > 0 && shelfLayout && shelfLayout.length > 0) {
                        const matchesBin = sBins.some(b => {
                            const bId = typeof b === 'object' ? String(b.bin_id || b.id || b.bin_name || '').trim() : String(b).trim();
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
                    ledStrips = [...matchingStrips];
                }

                // 2. Fallback / Merge with localLedStrips from localStorage if missing or extra strips exist
                try {
                    const localStripsStr = localStorage.getItem('localLedStrips');
                    if (localStripsStr) {
                        const parsedStrips = JSON.parse(localStripsStr);
                        if (Array.isArray(parsedStrips)) {
                            const cId = String(c.cupboard_id || c.id || '').trim();
                            const cName = String(c.cupboard_name || c.name || '').trim();
                            const localForCupboard = parsedStrips.filter(s => {
                                const sCupId = String(s.cupboardId || s.cupboard_id || '').trim();
                                if (sCupId !== '') {
                                    return sCupId === cId || sCupId === cName;
                                }
                                return true; // fallback if cupboardId not set
                            });

                            localForCupboard.forEach(ls => {
                                const lsId = String(ls.id || ls.strip_id);
                                if (!ledStrips.some(existing => String(existing.id || existing.strip_id) === lsId)) {
                                    ledStrips.push(ls);
                                }
                            });
                        }
                    }
                } catch (e) { }

                if (!ledStrips || ledStrips.length === 0) {
                    try {
                        const layouts = JSON.parse(localStorage.getItem('cupboardLayouts') || '{}');
                        if (layouts[c.cupboard_id] && layouts[c.cupboard_id].ledStrips) {
                            ledStrips = layouts[c.cupboard_id].ledStrips;
                        }
                    } catch (e) { }
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
                        if (!cupboardObj.ledStrips || cupboardObj.ledStrips.length === 0) {
                            cupboardObj.ledStrips = layouts[cupboardObj.id].ledStrips || [];
                        }
                    }
                } catch (e) { }

                return cupboardObj;
            });

            setCupboardsData(prev => {
                if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev;
                return mapped;
            });
            CUPBOARDS_CONFIG.length = 0;
            mapped.forEach(c => CUPBOARDS_CONFIG.push(c));
        }
    }, [rawCupboards, rawWalls, fetchedControllers, rawShelves, rawBins, allSavedStrips]);

    const isFetchingAny = isFetchingControllers || isFetchingWalls || isFetchingCupboards || isFetchingShelves || isFetchingBins;

    const hierarchy = useMemo(() => {
        const controllersMap = new Map();
        controllersData.forEach((controller) => {
            const controllerCopy = { ...controller, walls: new Map() };
            controllersMap.set(controller.name, controllerCopy);
        });

        const unassignedController = { id: 'unassigned-controller', name: 'Unassigned Controller', walls: new Map() };

        wallsData.forEach((wall) => {
            const ctrlName = wall.controller || 'Unassigned Controller';
            let controllerEntry = controllersMap.get(ctrlName);

            if (!controllerEntry) {
                controllerEntry = unassignedController;
                controllersMap.set(unassignedController.name, unassignedController);
            }

            if (!controllerEntry.walls.has(wall.name)) {
                controllerEntry.walls.set(wall.name, { id: `wall-${wall.name}`, name: wall.name, cupboards: [] });
            }
        });

        cupboardsData.forEach((cupboard) => {
            const ctrlName = cupboard.controller || 'Unassigned Controller';
            let controllerEntry = controllersMap.get(ctrlName);

            if (!controllerEntry) {
                controllerEntry = unassignedController;
                controllersMap.set(unassignedController.name, unassignedController);
            }

            const wallName = cupboard.wall || 'Unassigned Wall';
            if (!controllerEntry.walls.has(wallName)) {
                controllerEntry.walls.set(wallName, { id: `wall-${wallName}`, name: wallName, cupboards: [] });
            }

            const wallEntry = controllerEntry.walls.get(wallName);

            // Add shelves
            const shelfCount = cupboard.shelves || cupboard.rows || 5;
            const shelves = Array.from({ length: shelfCount }, (_, i) => ({
                id: `${cupboard.id}-shelf-${i + 1}`,
                name: `Shelf ${i + 1}`,
                shelfNumber: i + 1,
                cupboardId: cupboard.id
            }));

            wallEntry.cupboards.push({ ...cupboard, shelvesList: shelves });
        });

        // Convert maps to arrays
        const orderedControllers = Array.from(controllersMap.values()).map(ctrl => {
            return {
                ...ctrl,
                walls: Array.from(ctrl.walls.values()),
                // keep flat cupboards array for compatibility with activeCupboardIdx
                cupboards: Array.from(ctrl.walls.values()).flatMap(w => w.cupboards)
            };
        }).sort((a, b) => a.name.localeCompare(b.name));

        return orderedControllers;
    }, [controllersData, wallsData, cupboardsData]);

    const firstController = hierarchy[0] || null;
    const [selectedControllerName, setSelectedControllerName] = useState(firstController?.name || '');
    const firstWallName = firstController?.walls?.[0]?.name || '';
    const [selectedWallName, setSelectedWallName] = useState(firstWallName);

    const [selectedWallNames, setSelectedWallNames] = useState(() => {
        try {
            const saved = localStorage.getItem('monitoring_selectedWallNames');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) { }
        return firstWallName ? [firstWallName] : [];
    });

    const [expandedControllers, setExpandedControllers] = useState(() => {
        return firstController?.name ? new Set([firstController.name]) : new Set();
    });
    const [expandedWalls, setExpandedWalls] = useState(() => {
        return firstWallName ? new Set([firstWallName]) : new Set();
    });

    const selectedController =
        hierarchy.find((controller) => controller.name === selectedControllerName) ||
        firstController ||
        { name: 'None', cupboards: [], walls: [] };

    const selectedWall = selectedController.walls?.find(w => w.name === selectedWallName) || selectedController.walls?.[0] || { cupboards: [] };

    const toggleWallSelection = useCallback((wallName) => {
        setSelectedWallNames(prev => {
            const isChecked = prev.includes(wallName);
            const updated = isChecked ? prev.filter(w => w !== wallName) : [...prev, wallName];
            try { localStorage.setItem('monitoring_selectedWallNames', JSON.stringify(updated)); } catch (e) { }
            return updated;
        });
    }, []);

    const cupboards = useMemo(() => {
        if (!selectedController || !selectedController.cupboards) return [];

        if (selectedWallNames && selectedWallNames.length > 0) {
            const filtered = selectedController.cupboards.filter(c =>
                selectedWallNames.includes(c.wall) ||
                selectedWallNames.includes(c.wall_id) ||
                selectedWallNames.includes(c.cupboard_wall_id)
            );
            if (filtered.length > 0) return filtered;
        }

        return selectedController.cupboards || [];
    }, [selectedController, selectedWallNames]);

    const selectedCupboard = cupboards[activeCupboardIdx] || null;

    useEffect(() => {
        if (viewMode === '2d') {
            const timer = setTimeout(() => {
                calculateWirePaths();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [cupboards, viewMode, calculateWirePaths]);

    const eanCountFor = useCallback((cbId) => getCupboardAssignments(cbId).length, []);

    const handleToggleController = (controllerName, isOpen) => {
        setSelectedControllerName(controllerName);

        // Find first wall of this controller to select it
        const ctrl = hierarchy.find(c => c.name === controllerName);
        const fwName = ctrl?.walls?.[0]?.name || '';
        setSelectedWallName(fwName);
        setActiveCupboardIdx(0);

        setExpandedControllers((prev) => {
            const next = new Set(prev);
            if (isOpen) {
                next.add(controllerName);
            } else {
                next.delete(controllerName);
            }
            return next;
        });
    };

    const handleToggleWall = (wallName, isOpen) => {
        setSelectedWallName(wallName);
        setActiveCupboardIdx(0);
        setExpandedWalls((prev) => {
            const next = new Set(prev);
            if (isOpen) {
                next.add(wallName);
            } else {
                next.delete(wallName);
            }
            return next;
        });
    };

    const handleSelectCupboard = (index) => {
        setActiveCupboardIdx(index);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in">
            {/* ── Top bar ────────────────────────────────────────────────── */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Real-Time Monitoring</h2>
                    <p className="text-muted-foreground mt-1">
                        Live visualization of all physical cupboards and pick states.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Layout toggle */}
                    {viewMode === '2d' && (
                        <Tabs value={layoutMode} onValueChange={setLayoutMode}>
                            <TabsList>
                                <TabsTrigger value="horizontal" className="gap-2" title="Horizontal Scroll (List)">
                                    <LayoutGrid className="w-4 h-4" /> Horizontal
                                </TabsTrigger>
                                <TabsTrigger value="vertical" className="gap-2" title="Vertical Scroll (List)">
                                    <List className="w-4 h-4" /> Vertical
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}

                    {/* View toggle */}
                    <Tabs value={viewMode} onValueChange={setViewMode}>
                        <TabsList>
                            <TabsTrigger value="2d" className="gap-2">
                                <Layers className="w-4 h-4" /> 2D Grid
                            </TabsTrigger>
                            <TabsTrigger value="3d" className="gap-2">
                                <Box className="w-4 h-4" /> 3D View
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button
                        variant="ghost"
                        onClick={() => setControlsVisible((visible) => !visible)}
                        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-ot-surface-top border border-ot-border text-muted-foreground hover:text-white transition-colors h-auto"
                        title={controlsVisible ? "Hide navigation" : "Show navigation"}
                    >
                        {controlsVisible ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                        {controlsVisible ? 'Hide Navigation' : 'Show Navigation'}
                    </Button>
                </div>
            </div>

            {/* ── Main content ───────────────────────────────────────────── */}
            <div className="flex-1 flex gap-6 min-h-0">
                {isFetchingAny ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground bg-ot-surface-bottom/50 rounded-xl border border-ot-border">
                        <Loader2 className="w-8 h-8 animate-spin text-ot-action" />
                        <div className="text-sm font-medium animate-pulse">Loading hardware status...</div>
                    </div>
                ) : (
                    <>
                        {/* Canvas */}
                        <Card className="flex-1 overflow-hidden bg-ot-surface-bottom relative p-0 flex flex-col border-ot-border">
                            {viewMode === '3d' ? (
                                <Suspense fallback={<Canvas3DLoader />}>
                                    <Cupboard3D
                                        cupboards={cupboards}
                                        controllerName={selectedController.name}
                                        selectedCupboard={selectedCupboard}
                                        activeCupboardIdx={activeCupboardIdx}
                                        onSelectCupboard={setActiveCupboardIdx}
                                    />
                                </Suspense>
                            ) : (
                                cupboards.length > 0 ? (
                                    <div
                                        ref={containerRef}
                                        className={cn(
                                            "flex-1 relative overflow-hidden bg-ot-surface-bottom flex w-full h-full p-2 select-none",
                                            controllerPlacement === 'left' && "flex-row",
                                            controllerPlacement === 'right' && "flex-row-reverse",
                                            controllerPlacement === 'top' && "flex-col",
                                            controllerPlacement === 'bottom' && "flex-col-reverse"
                                        )}
                                    >
                                        {/* SVG Animated Wires */}
                                        <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full overflow-hidden" style={{ overflow: 'hidden' }}>
                                            <style>{`
                                        @keyframes wireFlowMon {
                                            from { stroke-dashoffset: 24; }
                                            to { stroke-dashoffset: 0; }
                                        }
                                        .animate-wire-flow-mon {
                                            animation: wireFlowMon 1s linear infinite;
                                        }
                                    `}</style>
                                            <defs>
                                                <filter id="glowMon" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                            </defs>
                                            {wirePaths.map(w => {
                                                const chNum = Number(w.ch) || 1;
                                                const palette = CHANNEL_PALETTES[(chNum - 1) % CHANNEL_PALETTES.length] || CHANNEL_PALETTES[0];
                                                return (
                                                    <g key={w.id || w.ch}>
                                                        <path d={w.d} fill="none" stroke={palette.hex} strokeWidth="5" strokeOpacity="0.4" filter="url(#glowMon)" />
                                                        <path d={w.d} fill="none" stroke={palette.hex} strokeWidth="2.5" strokeDasharray="8 4" className="animate-wire-flow-mon" />
                                                        <circle cx={w.x1} cy={w.y1} r="4.5" fill={palette.hex} stroke="#ffffff" strokeWidth="1.5" />
                                                        <circle cx={w.x2} cy={w.y2} r="4.5" fill={palette.hex} stroke="#ffffff" strokeWidth="1.5" />
                                                    </g>
                                                );
                                            })}
                                        </svg>

                                        {/* 16-Channel High-Fidelity PCB Controller Board */}
                                        <div className={cn(
                                            "z-30 p-3 shrink-0 flex flex-col justify-between border-2 border-emerald-500/40 bg-gradient-to-b from-[#092e20] via-[#041d13] to-[#010e08] shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),_inset_0_-2px_4px_rgba(0,0,0,0.8),_0_12px_35px_rgba(0,0,0,0.8),_0_0_20px_rgba(16,185,129,0.25)] transition-all duration-300 relative overflow-hidden rounded-2xl my-2 ml-2",
                                            (controllerPlacement === 'left' || controllerPlacement === 'right') ? "w-56 h-[calc(100%-16px)]" : "w-full h-40 border-b"
                                        )}>
                                            {/* 3D Screws */}
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

                                            {/* PCB Etch Background */}
                                            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:8px_8px]" />

                                            {/* PCB Header Info */}
                                            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2 pt-1 px-3 mb-1.5 relative z-10">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-6 h-6 rounded-md bg-gradient-to-b from-emerald-500/30 to-emerald-900/40 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                                        <Cpu className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[11px] font-black text-emerald-300 tracking-wider uppercase font-mono leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">16-CH PCB MODULE</h4>
                                                        <div className="text-[9px] text-emerald-400/80 font-mono font-medium">
                                                            {selectedController ? (selectedController.ip || selectedController.name) : '192.168.1.100'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                                    <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-widest">LIVE</span>
                                                </div>
                                            </div>

                                            {/* 16 Channel Sockets Grid */}
                                            <div className={cn(
                                                "grid gap-1.5 overflow-y-auto pr-1 flex-1 relative z-10",
                                                (controllerPlacement === 'left' || controllerPlacement === 'right') ? "grid-cols-1" : "grid-cols-8"
                                            )}>
                                                {Array.from({ length: 16 }, (_, i) => i + 1).map((chNum) => {
                                                    const assigned = allSavedStrips.find(s => {
                                                        const sCh = Number(s.channel) || (s.channel ? parseInt(String(s.channel).replace(/\D/g, ''), 10) : null);
                                                        return sCh === chNum;
                                                    }) || channelAssignments[chNum];

                                                    const isConnected = !!assigned;
                                                    const palette = CHANNEL_PALETTES[(chNum - 1) % CHANNEL_PALETTES.length];

                                                    return (
                                                        <div
                                                            key={chNum}
                                                            id={`monitoring-port-socket-${chNum}`}
                                                            className={cn(
                                                                "group relative flex items-center justify-between px-2 py-1.5 rounded-xl transition-all border select-none",
                                                                isConnected
                                                                    ? `bg-gradient-to-r ${palette.bgGrad} ${palette.border} ${palette.glow}`
                                                                    : "bg-gradient-to-b from-[#0a1017] via-[#04070d] to-[#09111b] border-slate-700/80 text-slate-400"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                                                                <span className={cn(
                                                                    "w-2.5 h-2.5 rounded-full shrink-0 border border-black/40",
                                                                    isConnected ? `${palette.dot} animate-pulse` : "bg-slate-700"
                                                                )} />
                                                                <span className={isConnected ? `${palette.text} font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]` : "text-slate-300"}>
                                                                    CH-{String(chNum).padStart(2, '0')}
                                                                </span>
                                                            </div>
                                                            <div className={cn(
                                                                "text-[9px] font-mono opacity-90 truncate max-w-[55px] text-right font-semibold",
                                                                isConnected ? palette.text : "text-slate-500"
                                                            )}>
                                                                {assigned ? (assigned.label || `Strip ${chNum}`) : 'Idle'}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Screw Terminal Footer */}
                                            <div className="pt-2 mt-1 border-t border-emerald-500/30 flex items-center justify-between text-[9px] text-emerald-400/80 font-mono px-2 relative z-10">
                                                <div className="flex items-center gap-1">
                                                    <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-b from-emerald-900/80 to-emerald-950 border border-emerald-500/40 text-[8px] font-bold text-emerald-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                                                        GND | VCC | DATA
                                                    </span>
                                                </div>
                                                <span className="text-emerald-300 font-bold text-[9px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                                    {allSavedStrips.length}/16 Active
                                                </span>
                                            </div>
                                        </div>

                                        {/* Cupboard 2D Stage */}
                                        <div className="flex-1 p-4 overflow-auto flex flex-col justify-center items-center relative w-full h-full">
                                            <Cupboard2D
                                                cupboards={cupboards}
                                                controllerName={selectedController.name}
                                                selectedCupboard={selectedCupboard}
                                                activeCupboardIdx={activeCupboardIdx}
                                                onSelectCupboard={setActiveCupboardIdx}
                                                layoutMode={layoutMode}
                                                key={selectedController.name}
                                                hideInternalWires={true}
                                                onZoomChange={() => calculateWirePaths()}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        No cupboards assigned to this controller.
                                    </div>
                                )
                            )}
                        </Card>

                        {/* Hierarchy Sidebar */}
                        <Card className={cn(
                            "flex-shrink-0 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
                            controlsVisible ? "w-80 opacity-100" : "w-0 opacity-0 border-transparent pointer-events-none"
                        )}>
                            <div className={cn(
                                "h-[57px] border-b border-ot-border bg-ot-surface-elev-top font-semibold text-white flex items-center px-4 transition-all duration-300",
                                controlsVisible ? "opacity-100" : "opacity-0"
                            )}>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <MonitorPlay className="w-4 h-4 text-ot-action shrink-0" />
                                    <span>Hierarchy Navigator</span>
                                </div>
                            </div>
                            <CardContent className={cn(
                                "p-0 overflow-auto transition-all duration-300",
                                controlsVisible ? "flex-1 opacity-100" : "h-0 opacity-0 pointer-events-none"
                            )}>
                                <div className="divide-y divide-ot-border">
                                    {hierarchy.length > 0 ? (
                                        hierarchy.map((controller) => {
                                            const isSelectedController = selectedController.name === controller.name;
                                            const isControllerExpanded = expandedControllers.has(controller.name);
                                            return (
                                                <Collapsible
                                                    key={controller.name}
                                                    open={isControllerExpanded}
                                                    onOpenChange={(isOpen) => handleToggleController(controller.name, isOpen)}
                                                    className="border-b border-ot-border"
                                                >
                                                    <CollapsibleTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className={cn(
                                                                "w-full h-auto px-4 py-4 text-left flex items-center justify-between gap-3 transition-colors rounded-none",
                                                                isControllerExpanded ? 'bg-ot-surface-bottom/70 hover:bg-ot-surface-bottom/70' : 'hover:bg-ot-surface-bottom/80',
                                                                isSelectedController ? 'bg-ot-action/10 border-l-2 border-l-ot-action text-ot-action hover:bg-ot-action/15 hover:text-ot-action' : ''
                                                            )}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className={cn(
                                                                    'font-medium text-sm truncate text-left',
                                                                    isSelectedController ? 'text-ot-action' : 'text-white'
                                                                )}>{controller.name}</div>
                                                                <p className="text-xs text-muted-foreground mt-1 truncate text-left font-normal">{controller.cupboards.length} cupboards</p>
                                                            </div>
                                                            <ChevronRight className={cn(
                                                                'w-4 h-4 transition-transform shrink-0',
                                                                isControllerExpanded && 'rotate-90 text-ot-action',
                                                                !isControllerExpanded && !isSelectedController && 'text-muted-foreground'
                                                            )} />
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        {controller.walls.length > 0 && (
                                                            <div className="mt-2 mb-2 space-y-2 pl-4 pr-3">
                                                                {controller.walls.map(wall => {
                                                                    const isWallExpanded = expandedWalls.has(wall.name);
                                                                    const isSelectedWall = controller.name === selectedControllerName && wall.name === selectedWallName;
                                                                    return (
                                                                        <Collapsible
                                                                            key={wall.id}
                                                                            open={isWallExpanded}
                                                                            onOpenChange={(isOpen) => handleToggleWall(wall.name, isOpen)}
                                                                            className="space-y-1"
                                                                        >
                                                                            <CollapsibleTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    className={cn(
                                                                                        "w-full h-auto flex items-center justify-between text-xs font-semibold px-3 py-1.5 rounded-md transition-colors gap-2",
                                                                                        selectedWallNames.includes(wall.name)
                                                                                            ? 'bg-ot-action/20 text-ot-action hover:bg-ot-action/25 hover:text-ot-action'
                                                                                            : 'bg-ot-surface-top/50 text-white/70 hover:bg-ot-surface-top hover:text-white'
                                                                                    )}
                                                                                >
                                                                                    <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            id={`chk-wall-${wall.id}`}
                                                                                            checked={selectedWallNames.includes(wall.name)}
                                                                                            onChange={() => toggleWallSelection(wall.name)}
                                                                                            className="w-3.5 h-3.5 rounded border-ot-border text-ot-action focus:ring-ot-action/50 accent-[#22d3ee] cursor-pointer shrink-0"
                                                                                        />
                                                                                        <span className="truncate flex-1 text-left">{wall.name}</span>
                                                                                    </div>
                                                                                    <ChevronRight className={cn('w-3 h-3 transition-transform shrink-0', isWallExpanded ? (isSelectedWall ? 'rotate-90 text-ot-action' : 'rotate-90 text-white') : 'text-muted-foreground')} />
                                                                                </Button>
                                                                            </CollapsibleTrigger>
                                                                            <CollapsibleContent>
                                                                                <div className="space-y-1 pl-2 border-l border-ot-border/50">
                                                                                    {wall.cupboards.map((cupboard, cbIdxInWall) => {
                                                                                        const isActiveCupboard = controller.name === selectedControllerName && wall.name === selectedWallName && cbIdxInWall === activeCupboardIdx;
                                                                                        const eanCount = eanCountFor(cupboard.id);
                                                                                        return (
                                                                                            <div key={cupboard.id} className="space-y-1">
                                                                                                <Button
                                                                                                    variant="ghost"
                                                                                                    onClick={() => {
                                                                                                        if (controller.name !== selectedControllerName) {
                                                                                                            handleToggleController(controller.name, true);
                                                                                                        }
                                                                                                        if (wall.name !== selectedWallName) {
                                                                                                            handleToggleWall(wall.name, true);
                                                                                                        }
                                                                                                        handleSelectCupboard(cbIdxInWall);
                                                                                                    }}
                                                                                                    className={cn(
                                                                                                        "w-full h-auto px-3 py-2 rounded-md text-xs flex items-center justify-between transition-all",
                                                                                                        isActiveCupboard
                                                                                                            ? 'bg-ot-action/15 border border-ot-action/50 text-ot-action hover:bg-ot-action/20 hover:text-ot-action'
                                                                                                            : 'bg-ot-surface-bottom border border-ot-border text-muted-foreground hover:text-white hover:border-ot-action/30'
                                                                                                    )}
                                                                                                >
                                                                                                    <span className="truncate flex-1 text-left font-normal">{cupboard.name}</span>
                                                                                                    <span className={cn(
                                                                                                        'px-2 py-0.5 rounded text-[10px] font-mono shrink-0 font-medium',
                                                                                                        eanCount > 0 ? 'bg-ot-action/20 text-ot-action' : 'bg-ot-surface-top text-muted-foreground'
                                                                                                    )}>
                                                                                                        {eanCount} EAN{eanCount !== 1 ? 's' : ''}
                                                                                                    </span>
                                                                                                </Button>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </CollapsibleContent>
                                                                        </Collapsible>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-4 text-sm text-muted-foreground">No controllers available.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
