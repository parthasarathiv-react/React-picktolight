import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from 'components/ui/dialog';
import { RefreshCw, Palette, MapPin, Plus, Pencil, Loader2, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'lib/utils';
import { apiService } from 'lib/apiService';

/**
 * Helper to match and resolve a display color hex/name for the UI.
 * Handles invalid hex codes (like 5-digit #24518), color names ("red", "rosse", etc.),
 * and falls back gracefully to standard CSS colors.
 */
function resolveColorDisplay(hex, name) {
    // 1. Check hex if it's a valid 3, 6, or 8 digit hex
    if (hex && typeof hex === 'string') {
        let cleanHex = hex.trim();
        if (!cleanHex.startsWith('#') && /^[0-9A-Fa-f]{3,8}$/.test(cleanHex)) {
            cleanHex = `#${cleanHex}`;
        }
        if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(cleanHex)) {
            return cleanHex;
        }
        if (typeof window !== 'undefined' && window.CSS && CSS.supports && CSS.supports('color', cleanHex)) {
            return cleanHex;
        }
    }

    // 2. Check color name mapping
    if (name && typeof name === 'string') {
        const lowerName = name.trim().toLowerCase();
        const KNOWN_COLORS = {
            red: '#ef4444',
            rosse: '#f43f5e',
            rose: '#f43f5e',
            pink: '#ec4899',
            green: '#22c55e',
            blue: '#3b82f6',
            orange: '#f97316',
            yellow: '#facc15',
            purple: '#a855f7',
            white: '#ffffff',
            cyan: '#06b6d4',
            lime: '#84cc16',
            amber: '#f59e0b',
            emerald: '#10b981',
            violet: '#8b5cf6',
            indigo: '#6366f1'
        };
        if (KNOWN_COLORS[lowerName]) {
            return KNOWN_COLORS[lowerName];
        }
        if (typeof window !== 'undefined' && window.CSS && CSS.supports && CSS.supports('color', lowerName)) {
            return lowerName;
        }
    }

    return '#3b82f6';
}

export default function LedSetupTab({ locId: propLocId }) {
    // Location state
    const [selectedLocation, setSelectedLocation] = useState(() => {
        try {
            const saved = localStorage.getItem('selectedLocation');
            if (saved) return JSON.parse(saved);
        } catch (e) { }
        return null;
    });

    const activeLocId = propLocId || selectedLocation?.phr_location_id || 'All';
    const activeLocName = selectedLocation?.pick_location_name || 'Selected Location';

    // API Colors state
    const [apiColors, setApiColors] = useState([]);
    const [isLoadingColors, setIsLoadingColors] = useState(false);
    const autoCreatedLocationsRef = useRef(new Set());

    // Color Modal state
    const [isColorModalOpen, setIsColorModalOpen] = useState(false);
    const [editingColor, setEditingColor] = useState(null);
    const [formColorName, setFormColorName] = useState('');
    const [formColorHex, setFormColorHex] = useState('#3b82f6');
    const [formColorLocId, setFormColorLocId] = useState(String(activeLocId));
    const [isSubmittingColor, setIsSubmittingColor] = useState(false);

    // Update location from localStorage when changed
    useEffect(() => {
        const handleStorage = () => {
            try {
                const saved = localStorage.getItem('selectedLocation');
                if (saved) setSelectedLocation(JSON.parse(saved));
            } catch (e) { }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Fetch colors from API based on location (GET /api/v1/picklight/colors?location=...)
    const fetchColors = useCallback(async () => {
        setIsLoadingColors(true);
        try {
            const res = await apiService.getColors(activeLocId);
            let colorsList = [];
            if (Array.isArray(res)) {
                colorsList = res;
            } else if (res?.data && Array.isArray(res.data)) {
                colorsList = res.data;
            } else if (res?.colors && Array.isArray(res.colors)) {
                colorsList = res.colors;
            } else if (res && typeof res === 'object') {
                colorsList = Object.keys(res)
                    .map(key => typeof res[key] === 'object' ? { id: key, ...res[key] } : null)
                    .filter(Boolean);
            }
            if (colorsList.length === 0 && activeLocId && activeLocId !== 'All' && !autoCreatedLocationsRef.current.has(String(activeLocId))) {
                autoCreatedLocationsRef.current.add(String(activeLocId));
                const initialColors = [
                    { pick_color_name: 'Red', pick_color_hexcode: '#ef4444', pick_color_loc_id: String(activeLocId) },
                    { pick_color_name: 'Green', pick_color_hexcode: '#22c55e', pick_color_loc_id: String(activeLocId) },
                    { pick_color_name: 'Blue', pick_color_hexcode: '#3b82f6', pick_color_loc_id: String(activeLocId) },
                    { pick_color_name: 'Yellow', pick_color_hexcode: '#facc15', pick_color_loc_id: String(activeLocId) },
                    { pick_color_name: 'Orange', pick_color_hexcode: '#f97316', pick_color_loc_id: String(activeLocId) },
                    { pick_color_name: 'Purple', pick_color_hexcode: '#a855f7', pick_color_loc_id: String(activeLocId) }
                ];

                for (const col of initialColors) {
                    try {
                        await apiService.createColor(col);
                    } catch (e) {
                        console.error('Error auto-creating default color:', e);
                    }
                }

                // Refetch colors after creating initial set
                const refreshedRes = await apiService.getColors(activeLocId);
                if (Array.isArray(refreshedRes)) {
                    colorsList = refreshedRes;
                } else if (refreshedRes?.data && Array.isArray(refreshedRes.data)) {
                    colorsList = refreshedRes.data;
                } else if (refreshedRes?.colors && Array.isArray(refreshedRes.colors)) {
                    colorsList = refreshedRes.colors;
                }
            }

            // Deduplicate by pick_color_name to display clean list
            const uniqueColors = [];
            const seenNames = new Set();
            for (const col of colorsList) {
                const nameKey = (col.pick_color_name || col.name || '').trim().toLowerCase();
                if (nameKey && !seenNames.has(nameKey)) {
                    seenNames.add(nameKey);
                    uniqueColors.push(col);
                } else if (!nameKey) {
                    uniqueColors.push(col);
                }
            }

            setApiColors(uniqueColors);
        } catch (err) {
            console.error('Error fetching location colors:', err);
            toast.error(`Failed to load location colors: ${err.message}`);
        } finally {
            setIsLoadingColors(false);
        }
    }, [activeLocId]);

    useEffect(() => {
        fetchColors();
    }, [fetchColors]);

    // Color Modal handlers (Create / Update)
    const handleOpenCreateColorModal = () => {
        setEditingColor(null);
        setFormColorName('');
        setFormColorHex('#3b82f6');
        setFormColorLocId(String(activeLocId));
        setIsColorModalOpen(true);
    };

    const handleOpenEditColorModal = (color) => {
        setEditingColor(color);
        setFormColorName(color.pick_color_name || color.name || '');
        setFormColorHex(color.pick_color_hexcode || color.hex || '#3b82f6');
        setFormColorLocId(String(color.pick_color_loc_id || activeLocId));
        setIsColorModalOpen(true);
    };

    const handleColorFormSubmit = async (e) => {
        e.preventDefault();
        if (!formColorName.trim()) {
            toast.error("Color name is required");
            return;
        }
        if (!formColorHex.trim()) {
            toast.error("Color hexcode is required");
            return;
        }

        const formattedHex = formColorHex.startsWith('#') ? formColorHex : `#${formColorHex}`;
        const payload = {
            pick_color_name: formColorName.trim(),
            pick_color_hexcode: formattedHex,
            pick_color_loc_id: String(formColorLocId || activeLocId)
        };

        setIsSubmittingColor(true);
        try {
            if (editingColor) {
                const colorId = editingColor.pick_color_id || editingColor.color_id || editingColor.id;
                await apiService.updateColor(colorId, payload);
                toast.success(`Color "${formColorName}" updated successfully!`);
            } else {
                await apiService.createColor(payload);
                toast.success(`Color "${formColorName}" created successfully!`);
            }
            setIsColorModalOpen(false);
            fetchColors();
        } catch (err) {
            console.error('Error saving color:', err);
            toast.error(`Failed to save color: ${err.message}`);
        } finally {
            setIsSubmittingColor(false);
        }
    };

    const modalPreviewColor = resolveColorDisplay(formColorHex, formColorName);

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in p-2 md:p-4 max-w-6xl mx-auto w-full">
            {/* Header & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ot-border/60 pb-5">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-ot-action/15 border border-ot-action/30 flex items-center justify-center text-ot-action shadow-md">
                        <Palette className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h3 className="text-2xl font-bold text-white tracking-tight">Location LED Colors</h3>
                            {activeLocId && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-ot-action/15 border border-ot-action/30 text-ot-action">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {activeLocName} (ID: {activeLocId})
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage location-specific LED colors directly synced with backend APIs.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Button
                        variant="outline"
                        onClick={fetchColors}
                        disabled={isLoadingColors}
                        className="border-ot-border text-slate-300 hover:text-white gap-2"
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoadingColors && "animate-spin")} />
                        Refresh
                    </Button>


                </div>
            </div>

            {/* Location API Colors Section */}
            <Card className="border-ot-border bg-ot-surface-elev-bottom/60 shadow-md">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ot-border/40 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            <CardTitle className="text-lg text-white">Location LED Colors</CardTitle>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                                Location ID: {activeLocId}
                            </span>
                        </div>
                        <CardDescription className="mt-1">
                            LED colors retrieved from backend API for location <span className="text-white font-medium">{activeLocName}</span>.
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            onClick={handleOpenCreateColorModal}
                            className="bg-ot-action hover:bg-ot-action-hover text-white gap-1.5 font-medium shadow"
                        >
                            <Plus className="w-4 h-4" />
                            Add Color
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-5">
                    {isLoadingColors ? (
                        <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin text-ot-action" />
                            <span>Loading location colors from API...</span>
                        </div>
                    ) : apiColors.length === 0 ? (
                        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-ot-border/60 bg-ot-surface-top/30 space-y-3">
                            <Palette className="w-8 h-8 mx-auto text-muted-foreground/60" />
                            <div>
                                <p className="text-sm font-medium text-slate-300">No LED colors configured for location ID "{activeLocId}"</p>
                                <p className="text-xs text-muted-foreground mt-1">Create a new color using the button below to add location-based LED colors.</p>
                            </div>

                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {apiColors.map((color, idx) => {
                                const name = color.pick_color_name || color.name || `Color #${idx + 1}`;
                                const rawHex = color.pick_color_hexcode || color.hex || '#3b82f6';
                                const colorLocId = color.pick_color_loc_id || color.loc_id || activeLocId;
                                const colorId = color.pick_color_id || color.color_id || color.id;
                                const displayColor = resolveColorDisplay(rawHex, name);

                                return (
                                    <div
                                        key={colorId || idx}
                                        className="p-3.5 rounded-xl border border-ot-border/80 bg-ot-surface-top/70 flex items-center justify-between gap-3 hover:border-ot-action/60 transition-all shadow-sm group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Visual Color Preview Box */}
                                            <div
                                                className="w-9 h-9 rounded-xl border-2 border-white/30 shrink-0 flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
                                                style={{
                                                    backgroundColor: displayColor,
                                                    boxShadow: `0 0 12px ${displayColor}`
                                                }}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-semibold text-white truncate" title={name}>
                                                    {name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                                                        {rawHex}
                                                    </span>
                                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                                        Loc: {colorLocId}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenEditColorModal(color)}
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                                                title="Edit Color"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create / Update Color Dialog */}
            <Dialog open={isColorModalOpen} onOpenChange={setIsColorModalOpen}>
                <DialogContent className="sm:max-w-md bg-ot-surface border-ot-border text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Palette className="w-5 h-5 text-ot-action" />
                            {editingColor ? 'Edit Location LED Color' : 'Add New Location LED Color'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                            {editingColor
                                ? `Update details for color ID #${editingColor.pick_color_id || editingColor.color_id || editingColor.id}`
                                : `Add a new color record for location ${activeLocName} (ID: ${activeLocId})`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleColorFormSubmit} className="space-y-4 py-2">
                        {/* Live Color Preview Banner */}
                        <div className="p-3 rounded-xl border border-ot-border/60 bg-ot-surface-top/50 flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-lg border-2 border-white/30 shrink-0 shadow-md"
                                style={{
                                    backgroundColor: modalPreviewColor,
                                    boxShadow: `0 0 12px ${modalPreviewColor}`
                                }}
                            />
                            <div>
                                <p className="text-xs font-semibold text-white">Matched Color Preview</p>
                                <p className="text-[11px] font-mono text-slate-400">
                                    {modalPreviewColor.toUpperCase()} ({formColorName || 'Unnamed'})
                                </p>
                            </div>
                        </div>

                        {/* Color Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                                Color Name <span className="text-red-400">*</span>
                            </label>
                            <Input
                                type="text"
                                required
                                value={formColorName}
                                placeholder="e.g. Red, Rosse, Emergency Blue, Green Alert"
                                onChange={(e) => setFormColorName(e.target.value)}
                                className="bg-ot-surface-top border-ot-border text-white placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Color Hexcode & HTML Color Picker */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                                Color Hexcode <span className="text-red-400">*</span>
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={modalPreviewColor.startsWith('#') && modalPreviewColor.length === 7 ? modalPreviewColor : '#3b82f6'}
                                    onChange={(e) => setFormColorHex(e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0 overflow-hidden shadow shrink-0"
                                />
                                <Input
                                    type="text"
                                    required
                                    value={formColorHex}
                                    placeholder="#EF4444"
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (val && !val.startsWith('#') && /^[0-9A-Fa-f]{3,8}$/.test(val)) val = `#${val}`;
                                        setFormColorHex(val);
                                    }}
                                    className="font-mono uppercase bg-ot-surface-top border-ot-border text-white flex-1"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-3 gap-2 border-t border-ot-border/40">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsColorModalOpen(false)}
                                className="border-ot-border text-slate-300 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmittingColor}
                                className="bg-ot-action hover:bg-ot-action-hover text-white font-medium gap-2 shadow"
                            >
                                {isSubmittingColor ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        {editingColor ? 'Update Color' : 'Create Color'}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
