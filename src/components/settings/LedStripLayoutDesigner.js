import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { ArrowLeft, Save, CheckCircle2, Plus, X, Lightbulb, Link as LinkIcon, Server, ChevronRight, LayoutGrid, Box, ZoomIn, ZoomOut, Layers, Trash2, Archive } from 'lucide-react';
import { cn } from 'lib/utils';
import { Input } from 'components/ui/input';
import { ConfirmDialog } from 'components/ui/ConfirmDialog';
import { apiService } from 'lib/apiService';
import { toast } from 'sonner';

const calculateLedWidth = (count) => {
    const numLeds = Math.max(1, Number(count));
    return Math.max(30, 10 + numLeds * 8);
};

const STRIP_COLORS = [
    {
        name: 'cyan',
        border: 'border-cyan-400',
        borderFaint: 'border-cyan-500/60',
        bgLight: 'bg-cyan-500/25',
        bgFaint: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        shadow: 'shadow-[0_0_20px_rgba(34,211,238,0.5)]',
        shadowBin: 'shadow-[0_0_12px_rgba(34,211,238,0.35)]',
        badgeBorder: 'border-cyan-400/60',
        badgeBg: 'bg-cyan-950/80 text-cyan-300',
        hex: '#22d3ee'
    },
    {
        name: 'purple',
        border: 'border-purple-400',
        borderFaint: 'border-purple-500/60',
        bgLight: 'bg-purple-500/25',
        bgFaint: 'bg-purple-500/10',
        text: 'text-purple-400',
        shadow: 'shadow-[0_0_20px_rgba(192,132,252,0.5)]',
        shadowBin: 'shadow-[0_0_12px_rgba(192,132,252,0.35)]',
        badgeBorder: 'border-purple-400/60',
        badgeBg: 'bg-purple-950/80 text-purple-300',
        hex: '#c084fc'
    },
    {
        name: 'amber',
        border: 'border-amber-400',
        borderFaint: 'border-amber-500/60',
        bgLight: 'bg-amber-500/25',
        bgFaint: 'bg-amber-500/10',
        text: 'text-amber-400',
        shadow: 'shadow-[0_0_20px_rgba(251,191,36,0.5)]',
        shadowBin: 'shadow-[0_0_12px_rgba(251,191,36,0.35)]',
        badgeBorder: 'border-amber-400/60',
        badgeBg: 'bg-amber-950/80 text-amber-300',
        hex: '#fbbf24'
    },
    {
        name: 'emerald',
        border: 'border-emerald-400',
        borderFaint: 'border-emerald-500/60',
        bgLight: 'bg-emerald-500/25',
        bgFaint: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        shadow: 'shadow-[0_0_20px_rgba(52,211,153,0.5)]',
        shadowBin: 'shadow-[0_0_12px_rgba(52,211,153,0.35)]',
        badgeBorder: 'border-emerald-400/60',
        badgeBg: 'bg-emerald-950/80 text-emerald-300',
        hex: '#34d399'
    },
    {
        name: 'rose',
        border: 'border-rose-400',
        borderFaint: 'border-rose-500/60',
        bgLight: 'bg-rose-500/25',
        bgFaint: 'bg-rose-500/10',
        text: 'text-rose-400',
        shadow: 'shadow-[0_0_20px_rgba(251,113,133,0.5)]',
        shadowBin: 'shadow-[0_0_12px_rgba(251,113,133,0.35)]',
        badgeBorder: 'border-rose-400/60',
        badgeBg: 'bg-rose-950/80 text-rose-300',
        hex: '#fb7185'
    },
    {
        name: 'blue',
        border: 'border-blue-400',
        borderFaint: 'border-blue-500/60',
        bgLight: 'bg-blue-500/25',
        bgFaint: 'bg-blue-500/10',
        text: 'text-blue-400',
        shadow: 'shadow-[0_0_20px_rgba(96,165,250,0.5)]',
        shadowBin: 'shadow-[0_0_12px_rgba(96,165,250,0.35)]',
        badgeBorder: 'border-blue-400/60',
        badgeBg: 'bg-blue-950/80 text-blue-300',
        hex: '#60a5fa'
    },
    {
        name: 'orange',
        border: 'border-orange-400',
        borderFaint: 'border-orange-500/60',
        bgLight: 'bg-orange-500/25',
        bgFaint: 'bg-orange-500/10',
        text: 'text-orange-400',
        shadow: 'shadow-[0_0_20px_rgba(251,146,60,0.5)]',
        shadowBin: 'shadow-[0_0_12px_rgba(251,146,60,0.35)]',
        badgeBorder: 'border-orange-400/60',
        badgeBg: 'bg-orange-950/80 text-orange-300',
        hex: '#fb923c'
    },
    {
        name: 'lime',
        border: 'border-lime-400',
        borderFaint: 'border-lime-500/60',
        bgLight: 'bg-lime-500/25',
        bgFaint: 'bg-lime-500/10',
        text: 'text-lime-400',
        shadow: 'shadow-[0_0_20px_rgba(163,230,53,0.5)]',
        shadowBin: 'shadow-[0_0_12px_rgba(163,230,53,0.35)]',
        badgeBorder: 'border-lime-400/60',
        badgeBg: 'bg-lime-950/80 text-lime-300',
        hex: '#a3e635'
    },
    {
        name: 'fuchsia',
        border: 'border-fuchsia-400',
        borderFaint: 'border-fuchsia-500/60',
        bgLight: 'bg-fuchsia-500/25',
        bgFaint: 'bg-fuchsia-500/10',
        text: 'text-fuchsia-400',
        shadow: 'shadow-[0_0_20px_rgba(232,121,249,0.5)]',
        shadowBin: 'shadow-[0_0_12px_rgba(232,121,249,0.35)]',
        badgeBorder: 'border-fuchsia-400/60',
        badgeBg: 'bg-fuchsia-950/80 text-fuchsia-300',
        hex: '#e879f9'
    }
];

function getStripColor(index) {
    if (index < 0 || isNaN(index)) return STRIP_COLORS[0];
    return STRIP_COLORS[index % STRIP_COLORS.length];
}

export default function LedStripLayoutDesigner({ cupboard, onBack, cupboardsData, syncCupboards, refetchStrips, onDirtyChange, onGoToBins }) {
    const [saveFlash, setSaveFlash] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deletedStripIds, setDeletedStripIds] = useState([]);
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [showNoBinsDialog, setShowNoBinsDialog] = useState(false);

    useEffect(() => {
        if (onDirtyChange) {
            onDirtyChange(isDirty);
        }
    }, [isDirty, onDirtyChange]);

    // Helper to get saved LED setup colors and count
    const savedLedConfig = React.useMemo(() => {
        try {
            const saved = localStorage.getItem('ledSetupConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ledCount: parsed.ledCount || 6,
                    colors: (parsed.ledColors && Array.isArray(parsed.ledColors)) ? parsed.ledColors.map(c => c.hex) : []
                };
            }
        } catch (e) { }
        return { ledCount: 6, colors: ['#ef4444', '#22c55e', '#3b82f6', '#facc15', '#f97316', '#a855f7'] };
    }, []);

    // Load LED strips exclusively from GET API (no local storage initialization)
    const [ledStrips, setLedStrips] = useState([]);
    const [isLoadingStrips, setIsLoadingStrips] = useState(true);

    useEffect(() => {
        const fetchStripsForCupboard = async () => {
            setIsLoadingStrips(true);
            let locId = 'All';
            try {
                const selectedLocationStr = localStorage.getItem('selectedLocation');
                if (selectedLocationStr) {
                    const loc = JSON.parse(selectedLocationStr);
                    locId = loc.pick_location_id || loc.id || 'All';
                }
            } catch (e) { }

            const targetCupboardId = String(cupboard.cupboard_id || cupboard.id || '').trim();
            const targetCupboardName = String(cupboard.cupboard_name || cupboard.name || '').trim();

            try {
                const res = await apiService.getStrips(locId);
                if (res && res.success && Array.isArray(res.data)) {
                    const cupboardStrips = res.data.filter(s => {
                        const sCupId = String(s.strip_cupboard_id || '').trim();
                        const matchesCup = !sCupId || (
                            sCupId === targetCupboardId || 
                            sCupId === targetCupboardName ||
                            (cupboard.cupboard_id && sCupId === String(cupboard.cupboard_id)) ||
                            (cupboard.id && sCupId === String(cupboard.id))
                        );

                        const sLocId = (s.strip_loc_id !== undefined && s.strip_loc_id !== null) ? String(s.strip_loc_id).trim() : null;
                        const matchesLoc = locId === 'All' || !sLocId || sLocId === String(locId).trim();

                        return matchesCup && matchesLoc;
                    });

                    const mappedStrips = cupboardStrips.map((s, idx) => {
                        const realId = (s.strip_id !== undefined && s.strip_id !== null) ? String(s.strip_id) : ((s.id !== undefined && s.id !== null) ? String(s.id) : `strip-${idx}`);
                        
                        const parsedX = parseFloat(s.strip_gridx);
                        const parsedY = parseFloat(s.strip_gridy);
                        const parsedW = parseFloat(s.strip_width);
                        const parsedH = parseFloat(s.strip_height);

                        const mappedLinkedBins = Array.isArray(s.bin_list) ? s.bin_list.map(b => {
                            const rawBinName = String(b.bin_name || '');
                            if (rawBinName.includes('_')) return rawBinName;

                            for (const sh of shelves) {
                                if (Array.isArray(sh.bins)) {
                                    const match = sh.bins.find(bn => 
                                        (b.bin_id !== undefined && b.bin_id !== null && String(bn.bin_id || bn.id) === String(b.bin_id)) ||
                                        String(bn.label || bn.bin_name) === rawBinName
                                    );
                                    if (match) {
                                        return `${sh.id}_${match.id}`;
                                    }
                                }
                            }
                            return String(b.bin_id || b.bin_name);
                        }) : [];

                        return {
                            id: realId,
                            strip_id: s.strip_id || s.id || realId,
                            label: s.strip_name || `Strip ${idx + 1}`,
                            x: (!isNaN(parsedX) && parsedX >= 0) ? parsedX : 20,
                            y: (!isNaN(parsedY) && parsedY >= 0) ? parsedY : (20 + idx * 30),
                            width: (!isNaN(parsedW) && parsedW > 0) ? parsedW : calculateLedWidth(savedLedConfig.ledCount || 6),
                            height: (!isNaN(parsedH) && parsedH > 0) ? parsedH : 22,
                            ledCount: savedLedConfig.ledCount || 6,
                            colors: (savedLedConfig.colors && savedLedConfig.colors.length > 0) ? savedLedConfig.colors : [],
                            strip_loc_id: s.strip_loc_id,
                            strip_cupboard_id: s.strip_cupboard_id || targetCupboardId,
                            strip_shelf_id: s.strip_shelf_id,
                            strip_org_id: s.strip_org_id || "Salem",
                            strip_branch_id: s.strip_branch_id || "SKSHOSPITAL",
                            strip_status: s.strip_status !== undefined ? Boolean(s.strip_status) : true,
                            linkedBins: mappedLinkedBins
                        };
                    });

                    setLedStrips(mappedStrips);
                } else {
                    setLedStrips([]);
                }
            } catch (err) {
                console.error("Failed to fetch strips for cupboard from API:", err);
                setLedStrips([]);
            } finally {
                setIsLoadingStrips(false);
            }
        };

        fetchStripsForCupboard();
    }, [cupboard?.id, cupboard?.cupboard_id, cupboard?.name, cupboard?.cupboard_name, savedLedConfig.colors, savedLedConfig.ledCount]);

    const [dragging, setDragging] = useState(null); // { id, type: 'move'|'resize-e'|'resize-w', startMouseX, startMouseY, startX, startW }
    const [selectedStripId, setSelectedStripId] = useState(null);
    const [editingStripId, setEditingStripId] = useState(null);
    const [stripToDelete, setStripToDelete] = useState(null);
    const [pendingReassignBin, setPendingReassignBin] = useState(null);
    const [unassignedWarningStrip, setUnassignedWarningStrip] = useState(null);
    const [zoom, setZoom] = useState(1.50); // Default 150% zoom for larger view
    const [hoveredItem, setHoveredItem] = useState(null); // { type: 'shelf'|'bin'|'strip', id, label, extra }
    const canvasRef = useRef(null);

    // Panning state
    const scrollRef = useRef(null);
    const scrollDragRef = useRef({
        isDown: false,
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        scrollTop: 0,
        moved: false,
    });

    // Include all placed shelves from the cupboard layout
    const shelves = (cupboard.shelfLayout || []).filter(shelf => shelf.placed !== false);

    const addStrip = () => {
        const totalBinsCount = shelves.reduce((sum, shelf) => sum + ((shelf.bins || []).filter(b => b.placed !== false).length), 0);
        if (totalBinsCount === 0) {
            setShowNoBinsDialog(true);
            return;
        }

        // Check if there is an existing strip without linked bins
        const unassignedStrip = ledStrips.find(s => !s.linkedBins || s.linkedBins.length === 0);
        if (unassignedStrip) {
            setUnassignedWarningStrip(unassignedStrip);
            return;
        }

        let defaultLedCount = 6;
        let defaultColors = [];
        try {
            const saved = localStorage.getItem('ledSetupConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.ledCount) defaultLedCount = parsed.ledCount;
                if (Array.isArray(parsed.ledColors)) defaultColors = parsed.ledColors.map(c => c.hex);
            }
        } catch (e) { }

        const newStrip = {
            id: `strip-${Date.now()}`,
            label: `Strip ${ledStrips.length + 1}`,
            x: 20,
            y: 20,
            width: calculateLedWidth(defaultLedCount),
            height: 22, // Height for LED strips
            ledCount: defaultLedCount,
            colors: defaultColors,
            linkedBins: [], // Array of bin IDs: "shelfId_binId"
        };
        setLedStrips(prev => [...prev, newStrip]);
        setSelectedStripId(newStrip.id);
        setEditingStripId(newStrip.id);
        setIsDirty(true);
    };

    const confirmRemoveStrip = (id) => {
        setStripToDelete(id);
    };

    const handleConfirmDelete = async () => {
        if (!stripToDelete) return;
        const targetStrip = ledStrips.find(s => s.id === stripToDelete);
        if (targetStrip) {
            const rawId = targetStrip.strip_id || (typeof targetStrip.id === 'number' ? targetStrip.id : (!isNaN(Number(targetStrip.id)) && !String(targetStrip.id).startsWith('strip-') ? Number(targetStrip.id) : null));
            if (rawId) {
                try {
                    await apiService.deleteStrip(rawId);
                    toast.success(`Strip "${targetStrip.label || 'LED Strip'}" deleted successfully`);
                    if (refetchStrips) {
                        await refetchStrips();
                    }
                } catch (err) {
                    console.error(`Failed to delete strip ${rawId}:`, err);
                    toast.error(`Failed to delete strip: ${err.message || 'Unknown error'}`);
                    return;
                }
            } else {
                toast.success(`Strip "${targetStrip.label || 'LED Strip'}" removed`);
            }
        }

        const updatedStrips = ledStrips.filter(s => s.id !== stripToDelete);
        setLedStrips(updatedStrips);
        
        if (cupboardsData && syncCupboards) {
            const updatedCupboards = cupboardsData.map(c =>
                c.id === cupboard.id
                    ? { ...c, ledStrips: updatedStrips }
                    : c
            );
            syncCupboards(updatedCupboards);
        }

        if (selectedStripId === stripToDelete) setSelectedStripId(null);
        if (editingStripId === stripToDelete) setEditingStripId(null);
        setStripToDelete(null);
        setIsDirty(true);
    };

    const handleMouseDown = (e, id, type) => {
        e.preventDefault();
        e.stopPropagation();

        setSelectedStripId(id);

        const strip = ledStrips.find(s => s.id === id);
        if (!strip) return;

        setDragging({
            id,
            type,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startX: strip.x,
            startY: strip.y,
            startW: strip.width,
        });
    };

    const onMouseMove = useCallback((e) => {
        if (!dragging) return;
        const dx = (e.clientX - dragging.startMouseX) / zoom;
        const dy = (e.clientY - dragging.startMouseY) / zoom;
        const minW = 40;

        setLedStrips(prev => prev.map(s => {
            if (s.id !== dragging.id) return s;

            switch (dragging.type) {
                case 'move':
                    return {
                        ...s,
                        x: Math.max(0, dragging.startX + dx),
                        y: Math.max(0, dragging.startY + dy),
                    };
                case 'resize-e':
                    return { ...s, width: Math.max(minW, dragging.startW + dx) };
                case 'resize-w': {
                    const newW = Math.max(minW, dragging.startW - dx);
                    return { ...s, x: dragging.startX + (dragging.startW - newW), width: newW };
                }
                default:
                    return s;
            }
        }));
        setIsDirty(true);
    }, [dragging, zoom]);

    const onMouseUp = useCallback(() => setDragging(null), []);

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            return () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };
        }
    }, [dragging, onMouseMove, onMouseUp]);

    const handleBinClick = (shelfId, binId, targetStripId = selectedStripId) => {
        const stripIdToUse = targetStripId || selectedStripId;
        if (!stripIdToUse) return;

        const compositeId = `${shelfId}_${binId}`;
        const targetStrip = ledStrips.find(s => s.id === stripIdToUse);
        if (!targetStrip) return;

        const isCurrentlyLinkedToTarget = targetStrip.linkedBins.includes(compositeId);

        if (isCurrentlyLinkedToTarget) {
            // Toggle OFF directly (unlink from target strip)
            setLedStrips(prev => prev.map(strip => {
                if (strip.id !== stripIdToUse) return strip;
                return {
                    ...strip,
                    linkedBins: strip.linkedBins.filter(id => id !== compositeId)
                };
            }));
            setIsDirty(true);
            return;
        }

        // Check if bin is assigned to ANOTHER strip
        const ownerStrip = ledStrips.find(s => s.id !== stripIdToUse && s.linkedBins.includes(compositeId));

        if (ownerStrip) {
            let binLabel = String(binId);
            const foundShelf = shelves.find(sh => String(sh.id) === String(shelfId));
            if (foundShelf && Array.isArray(foundShelf.bins)) {
                const foundBin = foundShelf.bins.find(b => String(b.id) === String(binId));
                if (foundBin) binLabel = foundBin.label || String(binId);
            }

            setPendingReassignBin({
                compositeId,
                binLabel,
                fromStripId: ownerStrip.id,
                fromStripLabel: ownerStrip.label || 'another strip',
                toStripId: stripIdToUse,
                toStripLabel: targetStrip.label || 'current strip'
            });
            return;
        }

        // If not assigned to any strip, link directly
        setLedStrips(prev => prev.map(strip => {
            if (strip.id !== stripIdToUse) return strip;
            return {
                ...strip,
                linkedBins: [...strip.linkedBins, compositeId]
            };
        }));
        setIsDirty(true);
    };

    const confirmReassignBin = () => {
        if (!pendingReassignBin) return;
        const { compositeId, fromStripId, toStripId } = pendingReassignBin;

        setLedStrips(prev => prev.map(strip => {
            if (strip.id === fromStripId) {
                return {
                    ...strip,
                    linkedBins: strip.linkedBins.filter(id => id !== compositeId)
                };
            }
            if (strip.id === toStripId) {
                return {
                    ...strip,
                    linkedBins: [...strip.linkedBins.filter(id => id !== compositeId), compositeId]
                };
            }
            return strip;
        }));

        setPendingReassignBin(null);
        setIsDirty(true);
    };

    const handleLinkAllBinsInShelf = (shelf, targetStripId = selectedStripId) => {
        const stripIdToUse = targetStripId || selectedStripId;
        if (!stripIdToUse || !shelf || !shelf.bins || shelf.bins.length === 0) return;
        const shelfBinIds = shelf.bins.map(b => `${shelf.id}_${b.id}`);

        setLedStrips(prev => prev.map(strip => {
            if (strip.id === stripIdToUse) {
                const existingSet = new Set(strip.linkedBins);
                const allAlreadyLinked = shelfBinIds.every(id => existingSet.has(id));

                if (allAlreadyLinked) {
                    // Unlink all bins of this shelf
                    return {
                        ...strip,
                        linkedBins: strip.linkedBins.filter(id => !shelfBinIds.includes(id))
                    };
                } else {
                    // Link all bins of this shelf
                    const nextSet = new Set([...strip.linkedBins, ...shelfBinIds]);
                    return {
                        ...strip,
                        linkedBins: Array.from(nextSet)
                    };
                }
            } else {
                // Ensure bins are not duplicated on other strips
                return {
                    ...strip,
                    linkedBins: strip.linkedBins.filter(id => !shelfBinIds.includes(id))
                };
            }
        }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        let locId = '';
        try {
            const selectedLocationStr = localStorage.getItem('selectedLocation');
            if (selectedLocationStr) {
                const loc = JSON.parse(selectedLocationStr);
                locId = loc.pick_location_id || loc.id || '';
            }
        } catch (e) { }

        try {
            let createdCount = 0;
            let updatedCount = 0;

            // 1. Process pending deletions
            if (deletedStripIds.length > 0) {
                for (const stripId of deletedStripIds) {
                    try {
                        await apiService.deleteStrip(stripId);
                    } catch (err) {
                        console.error(`Failed to delete strip ${stripId}:`, err);
                    }
                }
                setDeletedStripIds([]);
            }

            // 2. Separate new vs existing strips
            const newStrips = [];
            const existingStrips = [];

            ledStrips.forEach((strip, idx) => {
                const realId = strip.strip_id || (typeof strip.id === 'number' ? strip.id : (!isNaN(Number(strip.id)) && !String(strip.id).startsWith('strip-') ? Number(strip.id) : null));
                if (!realId) {
                    newStrips.push({ strip, idx });
                } else {
                    existingStrips.push({ strip, idx, realId });
                }
            });

            const numericLocId = isNaN(Number(locId)) ? 0 : Number(locId);
            const cupboardIdStr = String(cupboard.cupboard_id || cupboard.id || '1');

            const getShelfIdForStrip = (s) => {
                if (s.strip_shelf_id) return String(s.strip_shelf_id);
                if (s.linkedBins && s.linkedBins.length > 0) {
                    const parts = String(s.linkedBins[0]).split('_');
                    const sId = parts[0];
                    const foundShelf = shelves.find(sh => String(sh.shelf_id || sh.id) === String(sId));
                    if (foundShelf) {
                        return String(foundShelf.shelf_id || foundShelf.id);
                    }
                    return String(sId);
                }
                if (shelves && shelves.length > 0) {
                    return String(shelves[0].shelf_id || shelves[0].id || '1');
                }
                return "1";
            };

            const buildBinListPayload = (linkedBins) => {
                return (linkedBins || []).map(bId => {
                    const parts = String(bId).split('_');
                    const shelfId = parts[0];
                    const binId = parts.length > 1 ? parts[1] : parts[0];

                    let realBinName = String(binId);
                    let realBinIdStr = String(binId);

                    const foundShelf = shelves.find(sh => String(sh.shelf_id || sh.id) === String(shelfId));
                    if (foundShelf && Array.isArray(foundShelf.bins)) {
                        const foundBin = foundShelf.bins.find(b => String(b.bin_id || b.id) === String(binId));
                        if (foundBin) {
                            if (foundBin.bin_id !== undefined && foundBin.bin_id !== null) {
                                realBinIdStr = String(foundBin.bin_id);
                            } else if (foundBin.id !== undefined && foundBin.id !== null) {
                                realBinIdStr = String(foundBin.id);
                            }
                            realBinName = String(foundBin.label || foundBin.bin_name || binId);
                        }
                    }

                    return {
                        bin_id: realBinIdStr,
                        bin_name: realBinName
                    };
                });
            };

            // 3. Create new strips via POST API
            if (newStrips.length > 0) {
                const createPayloads = newStrips.map(({ strip, idx }) => ({
                    strip_name: String(strip.label || `Strip ${idx + 1}`),
                    strip_loc_id: String(strip.strip_loc_id !== undefined && strip.strip_loc_id !== null ? strip.strip_loc_id : (locId || '1')),
                    strip_cupboard_id: cupboardIdStr,
                    strip_shelf_id: getShelfIdForStrip(strip),
                    strip_gridx: String(Math.round(strip.x || 0)),
                    strip_gridy: String(Math.round(strip.y || 0)),
                    strip_width: String(Math.round(strip.width || 100)),
                    strip_height: String(Math.round(strip.height || 22)),
                    strip_org_id: String(strip.strip_org_id || "Salem"),
                    strip_branch_id: String(strip.strip_branch_id || "SKSHOSPITAL"),
                    strip_status: strip.strip_status !== undefined ? Boolean(strip.strip_status) : true,
                    bin_list: buildBinListPayload(strip.linkedBins)
                }));

                const res = await apiService.createStrip(createPayloads);
                if (res) {
                    createdCount = newStrips.length;
                }
            }

            // 4. Update existing strips via PUT API
            for (const { strip, idx, realId } of existingStrips) {
                const updatePayload = {
                    strip_name: String(strip.label || `Strip ${idx + 1}`),
                    strip_loc_id: String(strip.strip_loc_id !== undefined && strip.strip_loc_id !== null ? strip.strip_loc_id : (locId || '1')),
                    strip_shelf_id: getShelfIdForStrip(strip),
                    strip_gridx: String(Math.round(strip.x || 0)),
                    strip_gridy: String(Math.round(strip.y || 0)),
                    strip_width: String(Math.round(strip.width || 100)),
                    strip_height: String(Math.round(strip.height || 22)),
                    strip_org_id: String(strip.strip_org_id || "Salem"),
                    strip_branch_id: String(strip.strip_branch_id || "SKSHOSPITAL"),
                    strip_status: strip.strip_status !== undefined ? Boolean(strip.strip_status) : true,
                    bin_list: buildBinListPayload(strip.linkedBins)
                };

                await apiService.updateStrip(realId, updatePayload);
                updatedCount++;
            }

            // 5. Sync state and localStorage
            const updated = cupboardsData.map(c =>
                c.id === cupboard.id
                    ? { ...c, ledStrips }
                    : c
            );
            syncCupboards(updated);

            if (refetchStrips) {
                await refetchStrips();
            }

            toast.success('LED Strips saved successfully!');

            setIsDirty(false);
            setSaveFlash(true);
            setTimeout(() => {
                setSaveFlash(false);
                onBack();
            }, 800);
        } catch (error) {
            console.error("Error saving LED strips:", error);
            toast.error(`Failed to save LED strips: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackClick = () => {
        if (isDirty) {
            setShowUnsavedDialog(true);
        } else {
            onBack();
        }
    };

    // Calculate canvas size based on shelves and led strips
    const maxShelfX = Math.max(0, ...shelves.map(s => s.x + s.width));
    const maxShelfY = Math.max(0, ...shelves.map(s => s.y + s.height));
    const maxStripX = Math.max(0, ...ledStrips.map(s => s.x + s.width));
    const maxStripY = Math.max(0, ...ledStrips.map(s => s.y + s.height));

    const baseCanvasWidth = Math.max(1000, maxShelfX + 80, maxStripX + 80);
    const baseCanvasHeight = Math.max(700, maxShelfY + 80, maxStripY + 80);
    const canvasWidth = baseCanvasWidth * zoom;
    const canvasHeight = baseCanvasHeight * zoom;

    const selectedStrip = ledStrips.find(s => s.id === selectedStripId);

    // Panning logic
    const handlePointerDown = (e) => {
        if (e.button !== 0) return;
        const container = scrollRef.current;
        if (!container) return;

        scrollDragRef.current = {
            isDown: true,
            startX: e.clientX,
            startY: e.clientY,
            scrollLeft: container.scrollLeft,
            scrollTop: container.scrollTop,
            moved: false,
        };
        container.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e) => {
        const container = scrollRef.current;
        const dragState = scrollDragRef.current;
        if (!container || !dragState.isDown) return;

        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        if (!dragState.moved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
            dragState.moved = true;
        }

        if (dragState.moved) {
            container.scrollLeft = dragState.scrollLeft - deltaX;
            container.scrollTop = dragState.scrollTop - deltaY;
        }
    };

    const stopScrolling = (e) => {
        const container = scrollRef.current;
        if (container?.hasPointerCapture?.(e.pointerId)) {
            container.releasePointerCapture(e.pointerId);
        }
        scrollDragRef.current.isDown = false;
    };

    const handleCanvasClick = (e) => {
        if (scrollDragRef.current.moved) {
            e.stopPropagation();
            scrollDragRef.current.moved = false;
            return;
        }
        setSelectedStripId(null);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-ot-border bg-ot-surface-top shrink-0 gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={handleBackClick}
                        className="text-muted-foreground hover:text-white gap-2 h-8 px-3">
                        <ArrowLeft className="w-4 h-4" /> Back to Cupboards
                    </Button>
                    <div className="h-5 w-px bg-ot-border" />
                    <div className="flex items-center gap-1.5 text-xs">
                        {cupboard.controller && (
                            <>
                                <div className="flex items-center gap-1.5 text-ot-action bg-ot-action/10 px-2 py-1 rounded-md font-medium border border-ot-action/20">
                                    <Server className="w-3.5 h-3.5" />
                                    <span>Controller: {cupboard.controller}</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            </>
                        )}
                        {cupboard.wall && (
                            <>
                                <div className="flex items-center gap-1.5 text-muted-foreground hover:text-white bg-ot-surface-elev-bottom px-2 py-1 rounded-md border border-ot-border transition-colors">
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    <span>Wall: {cupboard.wall}</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            </>
                        )}
                        <div className="flex items-center gap-1.5 text-white bg-ot-surface-elev-bottom px-2 py-1 rounded-md border border-ot-border">
                            <Box className="w-3.5 h-3.5 text-ot-action" />
                            <span className="font-semibold">Cupboard: {cupboard.name}</span>
                        </div>
                    </div>

                    <div className="h-5 w-px bg-ot-border ml-2" />
                    <span className="text-xs text-muted-foreground font-mono ml-1">LED Strips Designer</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Zoom Scale Controls */}
                    <div className="flex items-center gap-1 bg-ot-surface-elev-bottom border border-ot-border rounded-lg p-0.5">
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setZoom(z => Math.max(0.75, z - 0.25))}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-[11px] font-mono font-semibold px-1.5 min-w-[42px] text-center text-white">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setZoom(z => Math.min(2.5, z + 0.25))}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setZoom(1.25)}
                            className="h-7 px-1.5 text-[10px] text-muted-foreground hover:text-white"
                            title="Reset Zoom"
                        >
                            Reset
                        </Button>
                    </div>

                    <Button
                        onClick={addStrip}
                        className="gap-2 h-8 px-4 bg-ot-surface-elev-bottom border border-ot-border text-white hover:bg-ot-surface-top text-sm"
                    >
                        <Plus className="w-4 h-4" /> Add LED Strip
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={cn(
                            'gap-2 h-8 px-4 text-sm transition-all duration-300 disabled:opacity-40',
                            saveFlash
                                ? 'bg-green-600 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                                : 'bg-ot-action text-white hover:bg-ot-action-hover'
                        )}
                    >
                        {saveFlash
                            ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                            : <><Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Strips'}</>
                        }
                    </Button>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden bg-ot-bg-mid">
                {/* Canvas */}
                <div
                    className="flex-1 overflow-auto p-6 relative touch-none select-none cursor-grab active:cursor-grabbing"
                    ref={scrollRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={stopScrolling}
                    onPointerCancel={stopScrolling}
                    onClickCapture={handleCanvasClick}
                >
                    <div
                        ref={canvasRef}
                        className="relative rounded-xl border-2 border-dashed border-ot-border/50 bg-ot-surface-top/50 transition-all duration-150"
                        style={{
                            width: canvasWidth,
                            height: canvasHeight,
                            userSelect: 'none',
                        }}
                    >
                        <div
                            style={{
                                width: baseCanvasWidth,
                                height: baseCanvasHeight,
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top left',
                                position: 'relative',
                            }}
                        >
                            {/* Instructional Text */}
                            <div className="absolute top-3 left-4 text-xs text-muted-foreground/40 font-semibold uppercase tracking-widest pointer-events-none z-0">
                                {cupboard.name} — Select a strip to link bins
                            </div>

                            {/* Render Shelves and Bins */}
                            {shelves.map(shelf => {
                                const bins = shelf.bins || [];

                                const maxBinX = bins.length > 0 ? Math.max(0, ...bins.map(b => b.x + b.width)) : 0;
                                const maxBinY = bins.length > 0 ? Math.max(0, ...bins.map(b => b.y + b.height)) : 0;

                                const displayWidth = shelf.width || 560;
                                const displayHeight = shelf.height || 48;

                                const scaleX = maxBinX > 0 && displayWidth > 0 ? Math.min(1, displayWidth / (maxBinX + 10)) : 1;
                                const scaleY = maxBinY > 0 && displayHeight > 0 ? Math.min(1, displayHeight / (maxBinY + 10)) : 1;
                                const binScale = Math.min(scaleX, scaleY);

                                return (
                                    <div
                                        key={shelf.id}
                                        style={{ position: 'absolute', left: shelf.x, top: shelf.y, width: displayWidth, height: displayHeight }}
                                        className="pointer-events-auto"
                                        onMouseEnter={() => setHoveredItem({ type: 'shelf', id: shelf.id, label: shelf.label })}
                                        onMouseLeave={() => setHoveredItem(prev => prev?.id === shelf.id ? null : prev)}
                                    >
                                        {/* Shelf Background */}
                                        <div className="absolute inset-0 border-2 border-ot-border/40 rounded-lg bg-ot-surface-bottom/20 group-hover:border-ot-action/60 transition-colors" />

                                        {/* Shelf Label */}
                                        <div className="absolute -top-5 left-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider z-10">
                                            {shelf.label}
                                        </div>

                                        {/* Shelf Hover Badge */}
                                        {hoveredItem?.type === 'shelf' && hoveredItem?.id === shelf.id && (
                                            <div className="absolute -top-7 left-2 z-40 px-2.5 py-1 rounded-md bg-slate-900/95 border border-slate-600 text-white text-[11px] font-semibold shadow-xl flex items-center gap-1.5 pointer-events-none whitespace-nowrap animate-in fade-in">
                                                <Layers className="w-3.5 h-3.5 text-ot-action" />
                                                <span>Shelf: {shelf.label}</span>
                                            </div>
                                        )}

                                        {/* Render Bins inside Shelf */}
                                        <div className="absolute inset-0" style={{ transform: `scale(${binScale})`, transformOrigin: 'top left' }}>
                                            {bins.map(bin => {
                                                const compositeId = `${shelf.id}_${bin.id}`;
                                                const ownerStripIdx = ledStrips.findIndex(s => s.linkedBins.includes(compositeId));
                                                const ownerStrip = ownerStripIdx !== -1 ? ledStrips[ownerStripIdx] : null;
                                                const isLinkedToSelected = selectedStrip && ownerStrip?.id === selectedStrip.id;
                                                const binTheme = ownerStripIdx !== -1 ? getStripColor(ownerStripIdx) : null;

                                                return (
                                                    <div
                                                        key={bin.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleBinClick(shelf.id, bin.id);
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.stopPropagation();
                                                            setHoveredItem({ type: 'bin', id: compositeId, label: bin.label, shelfLabel: shelf.label });
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.stopPropagation();
                                                            setHoveredItem(prev => prev?.id === compositeId ? null : prev);
                                                        }}
                                                        className={cn(
                                                            'absolute rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer pointer-events-auto',
                                                            !binTheme
                                                                ? 'border-ot-border/30 bg-ot-surface-top/30 hover:border-ot-border/60 text-muted-foreground/70'
                                                                : isLinkedToSelected
                                                                    ? `${binTheme.border} ${binTheme.bgLight} ${binTheme.shadowBin} text-white font-bold ring-2 ring-white/30`
                                                                    : `${binTheme.borderFaint} ${binTheme.bgFaint} text-white font-semibold hover:${binTheme.border}`
                                                        )}
                                                        style={{
                                                            left: bin.x,
                                                            top: bin.y,
                                                            width: bin.width,
                                                            height: bin.height,
                                                        }}
                                                    >
                                                        {/* Bin Hover Badge */}
                                                        {hoveredItem?.type === 'bin' && hoveredItem?.id === compositeId && (
                                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 px-2.5 py-1 rounded-md bg-slate-900/95 border border-ot-action text-white text-[11px] font-semibold shadow-xl flex items-center gap-1.5 pointer-events-none whitespace-nowrap animate-in fade-in">
                                                                <Archive className="w-3.5 h-3.5 text-ot-action" />
                                                                <span>Bin: {bin.label}</span>
                                                                <span className="text-[10px] text-slate-300 font-normal">({shelf.label})</span>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col items-center">
                                                            <span className={cn("text-xs font-semibold", binTheme ? binTheme.text : "text-muted-foreground/70")}>{bin.label}</span>
                                                            {binTheme && <LinkIcon className={cn("w-3 h-3 mt-1", binTheme.text)} />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Render LED Strips */}
                            {ledStrips.map((strip, stripIdx) => {
                                const isSelected = selectedStripId === strip.id;
                                const isHovered = hoveredItem?.type === 'strip' && hoveredItem?.id === strip.id;
                                const colorTheme = getStripColor(stripIdx);

                                return (
                                    <div
                                        key={strip.id}
                                        className={cn(
                                            'absolute rounded-full border-2 flex items-center overflow-visible transition-all z-20',
                                            isSelected
                                                ? `${colorTheme.border} ${colorTheme.bgLight} ${colorTheme.shadow}`
                                                : `${colorTheme.borderFaint} ${colorTheme.bgFaint} hover:${colorTheme.border} hover:${colorTheme.bgLight}`
                                        )}
                                        style={{
                                            left: strip.x,
                                            top: strip.y,
                                            width: strip.width,
                                            height: strip.height || 22,
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedStripId(strip.id);
                                        }}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedStripId(strip.id);
                                            setEditingStripId(strip.id);
                                        }}
                                        onMouseEnter={() => setHoveredItem({ type: 'strip', id: strip.id, label: strip.label })}
                                        onMouseLeave={() => setHoveredItem(prev => prev?.id === strip.id ? null : prev)}
                                    >
                                        <div
                                            className="absolute inset-0 cursor-grab active:cursor-grabbing z-10 rounded-full"
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => handleMouseDown(e, strip.id, 'move')}
                                        />

                                        {/* Visual LED dots inside the strip using setup colors */}
                                        <div className="flex items-center justify-around w-full px-1.5 pointer-events-none overflow-hidden">
                                            {Array.from({ length: Math.min(strip.ledCount || savedLedConfig.ledCount, 200) }).map((_, i) => {
                                                const count = Math.min(strip.ledCount || savedLedConfig.ledCount, 200);
                                                const dotSize = Math.max(6, Math.min(10, (strip.width - 8) / count));
                                                const colorHex = (strip.colors && strip.colors[i])
                                                    ? strip.colors[i]
                                                    : (savedLedConfig.colors[i % savedLedConfig.colors.length] || '#facc15');
                                                return (
                                                    <div
                                                        key={i}
                                                        className="rounded-full shrink-0 border border-white/20 transition-all"
                                                        style={{
                                                            width: dotSize,
                                                            height: dotSize,
                                                            backgroundColor: colorHex,
                                                            boxShadow: `0 0 6px ${colorHex}`
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {/* Hover or Selected Badge */}
                                        {(isSelected || isHovered) && (
                                            <div className={cn(
                                                "absolute -top-10 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-lg border-2 text-white text-xs md:text-sm font-bold shadow-2xl whitespace-nowrap z-40 pointer-events-none flex items-center gap-2 animate-in fade-in bg-slate-950/95",
                                                colorTheme.border
                                            )}>
                                                <Lightbulb className={cn("w-4 h-4 shrink-0", colorTheme.text)} />
                                                <span>Strip: {strip.label}</span>
                                                <span className={cn("text-xs font-medium", colorTheme.text)}>({strip.ledCount || savedLedConfig.ledCount} LEDs • {strip.linkedBins.length} Linked)</span>
                                            </div>
                                        )}

                                        {/* Selected UI Helpers */}
                                        {isSelected && (
                                            <>
                                                {/* Remove Button */}
                                                <button
                                                    onPointerDown={(e) => { e.stopPropagation(); confirmRemoveStrip(strip.id); }}
                                                    className="absolute -right-3 -top-3 w-5 h-5 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center z-30 shadow-lg pointer-events-auto cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>

                                                {/* West edge resize */}
                                                <div
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => handleMouseDown(e, strip.id, 'resize-w')}
                                                    className="absolute top-0 bottom-0 -left-[4px] w-[8px] cursor-w-resize z-30"
                                                >
                                                    <div className="absolute inset-y-0 left-[2px] w-[4px] rounded-full" style={{ backgroundColor: colorTheme.hex }} />
                                                </div>
                                                {/* East edge resize */}
                                                <div
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => handleMouseDown(e, strip.id, 'resize-e')}
                                                    className="absolute top-0 bottom-0 -right-[4px] w-[8px] cursor-e-resize z-30"
                                                >
                                                    <div className="absolute inset-y-0 right-[2px] w-[4px] rounded-full" style={{ backgroundColor: colorTheme.hex }} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-64 border-l border-ot-border bg-ot-surface-top flex flex-col shrink-0 z-10">
                    {editingStripId ? (() => {
                        const strip = ledStrips.find(s => s.id === editingStripId);
                        if (!strip) return null;

                        return (
                            <>
                                <div className="px-4 py-3 border-b border-ot-border flex items-center justify-between shrink-0">
                                    <div>
                                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Edit Strip</div>
                                        <div className="text-[10px] text-white mt-0.5 truncate">{strip.label}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => confirmRemoveStrip(strip.id)}
                                            className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
                                            title="Delete Strip"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setEditingStripId(null)} className="h-7 px-2 text-xs text-ot-action hover:text-ot-action hover:bg-ot-action/10">
                                            Done
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Strip Name</label>
                                        <Input
                                            value={strip.label}
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                setLedStrips(prev => prev.map(s => s.id === strip.id ? { ...s, label: newVal } : s));
                                            }}
                                            className="h-8 text-xs bg-ot-surface-bottom border-ot-border/50"
                                        />
                                    </div>

                                    {/* Cupboard Bins Section — Displays ALL shelves and bins in cupboard */}
                                    <div className="space-y-3 pt-2 border-t border-ot-border/50">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-semibold text-ot-action uppercase tracking-widest block">
                                                Cupboard Bins ({strip.linkedBins.length} Linked)
                                            </label>
                                        </div>

                                        {shelves.length === 0 ? (
                                            <div className="text-[10px] text-muted-foreground italic py-1">No shelves configured in this cupboard</div>
                                        ) : (
                                            shelves.map(shelf => {
                                                const shelfBins = shelf.bins || [];
                                                if (shelfBins.length === 0) return null;

                                                const shelfBinIds = shelfBins.map(b => `${shelf.id}_${b.id}`);
                                                const allLinked = shelfBinIds.length > 0 && shelfBinIds.every(id => strip.linkedBins.includes(id));

                                                return (
                                                    <div key={shelf.id} className="space-y-2 p-2.5 rounded-lg bg-ot-surface-bottom/60 border border-ot-border/50">
                                                        <div className="flex items-center justify-between pb-1.5 border-b border-ot-border/40">
                                                            <span className="text-xs md:text-sm font-extrabold text-white truncate max-w-[140px]">{shelf.label}</span>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleLinkAllBinsInShelf(shelf, strip.id)}
                                                                className="h-6 text-xs font-semibold px-2 text-ot-action hover:bg-ot-action/15"
                                                            >
                                                                {allLinked ? "Unlink All" : "Link All"}
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            {shelfBins.map(bin => {
                                                                const compositeId = `${shelf.id}_${bin.id}`;
                                                                const isLinked = strip.linkedBins.includes(compositeId);
                                                                const otherStripIdx = !isLinked ? ledStrips.findIndex(s => s.id !== strip.id && s.linkedBins.includes(compositeId)) : -1;
                                                                const otherStrip = otherStripIdx !== -1 ? ledStrips[otherStripIdx] : null;

                                                                const currentStripIdx = ledStrips.findIndex(s => s.id === strip.id);
                                                                const currentTheme = getStripColor(currentStripIdx);
                                                                const otherTheme = otherStripIdx !== -1 ? getStripColor(otherStripIdx) : null;

                                                                return (
                                                                    <button
                                                                        key={bin.id}
                                                                        type="button"
                                                                        onClick={() => handleBinClick(shelf.id, bin.id, strip.id)}
                                                                        className={cn(
                                                                            "w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs md:text-sm text-left transition-all",
                                                                            isLinked
                                                                                ? `${currentTheme.bgLight} ${currentTheme.border} text-white font-bold shadow-md ring-1 ${currentTheme.borderFaint}`
                                                                                : otherStrip
                                                                                    ? `${otherTheme.bgFaint} ${otherTheme.borderFaint} text-white font-semibold hover:${otherTheme.border}`
                                                                                    : "bg-ot-surface-top/80 border-ot-border/50 text-slate-200 hover:border-ot-action/50 hover:text-white"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-2 truncate">
                                                                            <span className="truncate font-bold text-white text-xs md:text-sm">{bin.label}</span>
                                                                            {otherStrip && (
                                                                                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 truncate max-w-[80px]", otherTheme.badgeBg, otherTheme.badgeBorder)}>
                                                                                    {otherStrip.label}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {isLinked ? (
                                                                            <div className={cn("flex items-center gap-1 shrink-0 font-extrabold", currentTheme.text)}>
                                                                                <span className="text-xs">Linked</span>
                                                                                <CheckCircle2 className="w-4 h-4" />
                                                                            </div>
                                                                        ) : (
                                                                            <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Total Linked Bins Summary */}
                                    <div className="space-y-1.5 pt-2.5 border-t border-ot-border/50">
                                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                            Total Linked Bins ({strip.linkedBins.length})
                                        </div>
                                        {strip.linkedBins.length === 0 ? (
                                            <div className="text-xs text-muted-foreground/60 italic text-center py-2.5 bg-ot-surface-bottom/30 rounded border border-ot-border/20">
                                                No bins linked
                                            </div>
                                        ) : (
                                            strip.linkedBins.map(linkedId => {
                                                const [sId, bId] = linkedId.split('_');
                                                const shelf = shelves.find(s => s.id === sId);
                                                const bin = shelf?.bins?.find(b => b.id === bId);
                                                if (!bin) return null;
                                                return (
                                                    <div key={linkedId} className="flex items-center justify-between px-3 py-2 rounded bg-ot-surface-bottom border border-ot-border/50 group">
                                                        <span className="text-xs md:text-sm font-bold text-white truncate pr-2">
                                                            Shelf: {shelf?.label || sId} • Bin: {bin.label}
                                                        </span>
                                                        <button
                                                            onClick={() => handleBinClick(sId, bId, strip.id)}
                                                            className="opacity-70 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-all shrink-0"
                                                            title="Unlink Bin"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </>
                        );
                    })() : (
                        <>
                            <div className="px-4 py-3 border-b border-ot-border">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">LED Strips</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{ledStrips.length} total strips</div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2"
                                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                                {ledStrips.map((strip, stripIdx) => {
                                    const isSelected = selectedStripId === strip.id;
                                    const colorTheme = getStripColor(stripIdx);
                                    return (
                                        <div key={strip.id}
                                            onClick={() => setSelectedStripId(strip.id)}
                                            onDoubleClick={() => {
                                                setSelectedStripId(strip.id);
                                                setEditingStripId(strip.id);
                                            }}
                                            className={cn(
                                                "flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden group",
                                                isSelected
                                                    ? `${colorTheme.bgLight} ${colorTheme.border} shadow-md`
                                                    : `bg-ot-surface-elev-bottom/60 ${colorTheme.borderFaint} hover:${colorTheme.border}`
                                            )}
                                        >
                                            <div className="flex items-center justify-between z-30 relative">
                                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                                    <Lightbulb className={cn("w-4 h-4 shrink-0", colorTheme.text)} />
                                                    <span className="text-sm font-semibold text-white truncate">{strip.label}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmRemoveStrip(strip.id);
                                                    }}
                                                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/20 transition-colors shrink-0 z-30 pointer-events-auto"
                                                    title="Delete Strip"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Mini Color Swatches Bar */}
                                            <div className="flex items-center gap-1 my-1 overflow-x-auto py-0.5">
                                                {((strip.colors && strip.colors.length > 0) ? strip.colors : savedLedConfig.colors).slice(0, 16).map((hex, cIdx) => (
                                                    <div
                                                        key={cIdx}
                                                        className="w-3 h-3 rounded-full border border-white/20 shrink-0 shadow-sm"
                                                        style={{
                                                            backgroundColor: hex,
                                                            boxShadow: `0 0 4px ${hex}`
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-ot-border/50 z-10">
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <LinkIcon className="w-3 h-3" /> {strip.linkedBins.length} Bins Linked
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono bg-ot-surface-top px-1.5 py-0.5 rounded border border-ot-border/30">
                                                    {strip.ledCount || savedLedConfig.ledCount} LEDs
                                                </span>
                                            </div>

                                            {/* Hover indicator for double click */}
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                                <span className="text-[10px] font-bold text-white tracking-widest uppercase bg-ot-action/80 px-2 py-1 rounded shadow-lg">
                                                    Double Click to Edit
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {ledStrips.length === 0 && (
                                    <div className="text-center py-8 text-xs text-muted-foreground">
                                        No LED strips added.<br />Click "Add LED Strip" to begin.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={!!stripToDelete}
                onOpenChange={(open) => !open && setStripToDelete(null)}
                title="Confirm Deletion"
                description="Are you sure you want to delete this LED strip? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={handleConfirmDelete}
                onCancel={() => setStripToDelete(null)}
            />

            {/* Reassign Bin Confirmation Dialog */}
            <ConfirmDialog
                open={!!pendingReassignBin}
                onOpenChange={(open) => !open && setPendingReassignBin(null)}
                title="Bin Already Assigned"
                description={
                    pendingReassignBin
                        ? `Bin "${pendingReassignBin.binLabel}" is already assigned to "${pendingReassignBin.fromStripLabel}". Do you want to remove it from "${pendingReassignBin.fromStripLabel}" and reassign it to "${pendingReassignBin.toStripLabel}"?`
                        : ""
                }
                confirmText="Reassign Bin"
                cancelText="Cancel"
                onConfirm={confirmReassignBin}
                onCancel={() => setPendingReassignBin(null)}
            />

            {/* Unassigned Bin Warning Dialog when adding another strip */}
            <ConfirmDialog
                open={!!unassignedWarningStrip}
                onOpenChange={(open) => !open && setUnassignedWarningStrip(null)}
                title="Unassigned LED Strip Warning"
                description={
                    unassignedWarningStrip
                        ? `The strip "${unassignedWarningStrip.label}" has no bins linked to it. Please assign at least one bin to "${unassignedWarningStrip.label}" before adding another LED strip.`
                        : ""
                }
                confirmText="Assign Bins"
                cancelText="Cancel"
                variant="warning"
                onConfirm={() => {
                    if (unassignedWarningStrip) {
                        setSelectedStripId(unassignedWarningStrip.id);
                        setEditingStripId(unassignedWarningStrip.id);
                    }
                    setUnassignedWarningStrip(null);
                }}
                onCancel={() => setUnassignedWarningStrip(null)}
            />

            {/* Unsaved Changes Warning Dialog */}
            <ConfirmDialog
                open={showUnsavedDialog}
                onOpenChange={setShowUnsavedDialog}
                title="Unsaved Changes"
                description="You have unsaved changes. Do you want to go back without saving these changes?"
                confirmText="Leave Without Saving"
                cancelText="Cancel"
                variant="warning"
                onConfirm={() => {
                    setShowUnsavedDialog(false);
                    setIsDirty(false);
                    onBack();
                }}
                onCancel={() => setShowUnsavedDialog(false)}
            />

            {/* No Bins Warning Dialog */}
            <ConfirmDialog
                open={showNoBinsDialog}
                onOpenChange={setShowNoBinsDialog}
                title="No Bins Found"
                description="There are no bins added for this cupboard. Please add bins to the cupboard shelves first before adding LED strips."
                confirmText="OK"
                cancelText="Cancel"
                variant="warning"
                onConfirm={() => {
                    setShowNoBinsDialog(false);
                    if (onGoToBins) {
                        onGoToBins(cupboard);
                    }
                }}
                onCancel={() => setShowNoBinsDialog(false)}
            />
        </div>
    );
}
