import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Save, CheckCircle2, RefreshCw, Palette, Lightbulb, Sliders } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'lib/utils';

const DEFAULT_PRESET_COLORS = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Yellow', hex: '#facc15' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'White', hex: '#ffffff' },
];

export default function LedSetupTab({ cupboardsData, syncCupboards }) {
    const [ledCount, setLedCount] = useState(6);
    const [ledColors, setLedColors] = useState([]);
    const [savedFlash, setSavedFlash] = useState(false);

    // Load initial LED setup from localStorage or defaults
    useEffect(() => {
        try {
            const saved = localStorage.getItem('ledSetupConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.ledCount && Array.isArray(parsed.ledColors)) {
                    setLedCount(parsed.ledCount);
                    setLedColors(parsed.ledColors);
                    return;
                }
            }
        } catch (e) {
            console.error('Error reading ledSetupConfig from localStorage', e);
        }

        // Initial default fallback
        const initialCount = 6;
        const initialColors = Array.from({ length: initialCount }, (_, idx) => {
            const preset = DEFAULT_PRESET_COLORS[idx % DEFAULT_PRESET_COLORS.length];
            return {
                id: idx + 1,
                hex: preset.hex,
                label: `LED ${idx + 1}`
            };
        });
        setLedCount(initialCount);
        setLedColors(initialColors);
    }, []);

    // Sync ledColors array when ledCount changes
    const handleLedCountChange = (newCountRaw) => {
        const newCount = Math.max(1, Math.min(100, parseInt(newCountRaw, 10) || 1));
        setLedCount(newCount);

        setLedColors(prev => {
            if (newCount === prev.length) return prev;

            if (newCount > prev.length) {
                const added = Array.from({ length: newCount - prev.length }, (_, idx) => {
                    const actualIdx = prev.length + idx;
                    const preset = DEFAULT_PRESET_COLORS[actualIdx % DEFAULT_PRESET_COLORS.length];
                    return {
                        id: actualIdx + 1,
                        hex: preset.hex,
                        label: `LED ${actualIdx + 1}`
                    };
                });
                return [...prev, ...added];
            } else {
                return prev.slice(0, newCount);
            }
        });
    };

    // Update single LED color
    const handleColorChange = (index, newHex) => {
        setLedColors(prev => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                hex: newHex
            };
            return next;
        });
    };

    // Reset to defaults
    const handleReset = () => {
        const count = 6;
        setLedCount(count);
        setLedColors(Array.from({ length: count }, (_, idx) => ({
            id: idx + 1,
            hex: DEFAULT_PRESET_COLORS[idx % DEFAULT_PRESET_COLORS.length].hex,
            label: `LED ${idx + 1}`
        })));
        toast.info("Reset to default LED Setup");
    };

    // Save configuration and directly apply to LED strips
    const handleSave = () => {
        const configPayload = {
            ledCount,
            ledColors,
            updatedAt: new Date().toISOString()
        };

        try {
            // Save to localStorage
            localStorage.setItem('ledSetupConfig', JSON.stringify(configPayload));

            // Directly apply to cupboards data and cupboardLayouts in localStorage
            if (cupboardsData && syncCupboards) {
                const updatedCupboards = cupboardsData.map(cupboard => {
                    if (!cupboard.ledStrips || cupboard.ledStrips.length === 0) return cupboard;
                    const newStrips = cupboard.ledStrips.map(strip => ({
                        ...strip,
                        ledCount: ledCount,
                        colors: ledColors.map(c => c.hex)
                    }));
                    return { ...cupboard, ledStrips: newStrips };
                });
                syncCupboards(updatedCupboards);
            }

            // Update cupboardLayouts stored in localStorage
            try {
                const layouts = JSON.parse(localStorage.getItem('cupboardLayouts') || '{}');
                Object.keys(layouts).forEach(cId => {
                    if (layouts[cId].ledStrips) {
                        layouts[cId].ledStrips = layouts[cId].ledStrips.map(strip => ({
                            ...strip,
                            ledCount: ledCount,
                            colors: ledColors.map(c => c.hex)
                        }));
                    }
                });
                localStorage.setItem('cupboardLayouts', JSON.stringify(layouts));
            } catch (e) { }

            setSavedFlash(true);
            toast.success("LED Setup saved and applied directly to LED strips!");
            setTimeout(() => setSavedFlash(false), 1500);
        } catch (err) {
            toast.error("Failed to save LED Setup: " + err.message);
        }
    };

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in p-2 md:p-4 max-w-6xl mx-auto w-full">
            {/* Header & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ot-border/60 pb-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-ot-action/15 border border-ot-action/30 flex items-center justify-center text-ot-action">
                        <Palette className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">LED Setup & Color Configuration</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Set the number of LEDs, per-LED color picker, and color codes for LED strips.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="border-ot-border text-muted-foreground hover:text-white gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reset
                    </Button>

                    <Button
                        onClick={handleSave}
                        className={cn(
                            'gap-2 text-white font-medium transition-all shadow-md',
                            savedFlash ? 'bg-green-600 hover:bg-green-600' : 'bg-ot-action hover:bg-ot-action-hover'
                        )}
                    >
                        {savedFlash ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-white" />
                                Saved & Applied!
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save & Apply Setup
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Live Strip Visualizer Banner */}
            <Card className="border-ot-border/80 bg-ot-surface-elev-bottom/70 overflow-hidden shadow-lg">
                <CardHeader className="py-3 px-5 border-b border-ot-border/40 bg-ot-surface-top/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <CardTitle className="text-sm font-semibold text-white">Live LED Strip Visual Preview</CardTitle>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono bg-ot-surface-top px-2.5 py-1 rounded-full border border-ot-border/40">
                        {ledCount} {ledCount === 1 ? 'LED' : 'LEDs'} Configured
                    </span>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-6 flex items-center justify-center min-h-[100px] overflow-x-auto">
                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center py-2">
                            {ledColors.map((led, idx) => (
                                <div key={led.id || idx} className="flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/20 transition-all duration-300 transform group-hover:scale-110 flex items-center justify-center text-[10px] font-bold font-mono text-white/90 shadow-md"
                                        style={{
                                            backgroundColor: led.hex || '#ffffff',
                                            boxShadow: `0 0 16px ${led.hex || '#ffffff'}, 0 0 4px ${led.hex || '#ffffff'}`
                                        }}
                                    >
                                        {idx + 1}
                                    </div>
                                    <span className="text-[10px] font-mono uppercase text-slate-400">
                                        {led.hex}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* LED Setup Form Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Number of LEDs */}
                <Card className="border-ot-border bg-ot-surface-elev-bottom/40 flex flex-col h-full">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-ot-action" />
                            <CardTitle className="text-base text-white">LED Count</CardTitle>
                        </div>
                        <CardDescription>Specify how many LEDs exist per LED strip</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Number of LEDs Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-200 flex items-center justify-between">
                                <span>How Many LEDs</span>
                                <span className="text-xs text-ot-action font-mono">{ledCount} LEDs</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={ledCount}
                                    onChange={(e) => handleLedCountChange(e.target.value)}
                                    className="bg-ot-surface-top border-ot-border text-white text-base font-semibold"
                                />
                                <div className="flex gap-1 shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleLedCountChange(ledCount - 1)}
                                        className="h-10 px-3 border-ot-border text-white"
                                    >
                                        -
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleLedCountChange(ledCount + 1)}
                                        className="h-10 px-3 border-ot-border text-white"
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Enter the total LED count for your LED strip. All LED strips will automatically use this count.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Panel: Per-LED Color Picker & Color Code Input */}
                <Card className="border-ot-border bg-ot-surface-elev-bottom/40 lg:col-span-2 flex flex-col h-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Palette className="w-5 h-5 text-ot-action" />
                                <CardTitle className="text-base text-white">Per-LED Colors</CardTitle>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                {ledColors.length} LEDs
                            </span>
                        </div>
                        <CardDescription>
                            Configure the color for each LED using the color picker or colour code input.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 overflow-y-auto max-h-[520px] pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ledColors.map((led, index) => (
                                <div
                                    key={led.id || index}
                                    className="p-4 rounded-xl border border-ot-border/70 bg-ot-surface-top/60 flex flex-col gap-3 hover:border-ot-action/50 transition-colors shadow-sm"
                                >
                                    <div className="flex items-center justify-between border-b border-ot-border/40 pb-2">
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className="w-5 h-5 rounded-full border border-white/30 shrink-0 shadow-sm"
                                                style={{
                                                    backgroundColor: led.hex || '#ffffff',
                                                    boxShadow: `0 0 8px ${led.hex || '#ffffff'}`
                                                }}
                                            />
                                            <span className="text-sm font-semibold text-white font-mono">
                                                LED #{index + 1}
                                            </span>
                                        </div>

                                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                                            {led.hex || '#FFFFFF'}
                                        </span>
                                    </div>

                                    {/* Color Picker + Color Code Input Row */}
                                    <div className="flex items-center gap-3">
                                        {/* HTML Color Picker */}
                                        <div className="relative flex items-center shrink-0">
                                            <input
                                                type="color"
                                                id={`color-picker-${index}`}
                                                value={led.hex || '#ffffff'}
                                                onChange={(e) => handleColorChange(index, e.target.value)}
                                                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0 overflow-hidden shadow-inner"
                                                style={{ WebkitAppearance: 'square-button' }}
                                            />
                                        </div>

                                        {/* Hex Code Input */}
                                        <div className="flex-1 space-y-1">
                                            <label htmlFor={`color-picker-${index}`} className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                                                Colour Code Input
                                            </label>
                                            <Input
                                                type="text"
                                                value={led.hex || ''}
                                                placeholder="#FF0000"
                                                onChange={(e) => {
                                                    let val = e.target.value;
                                                    if (val && !val.startsWith('#')) val = `#${val}`;
                                                    handleColorChange(index, val);
                                                }}
                                                className="font-mono text-sm uppercase bg-ot-surface-top border-ot-border text-white h-9"
                                            />
                                        </div>
                                    </div>

                                    {/* Quick Palette Swatches for this specific LED */}
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <span className="text-[10px] text-muted-foreground mr-1">Color:</span>
                                        {DEFAULT_PRESET_COLORS.map(preset => (
                                            <button
                                                key={preset.name}
                                                type="button"
                                                title={preset.name}
                                                onClick={() => handleColorChange(index, preset.hex)}
                                                className={cn(
                                                    'w-5 h-5 rounded-full border border-white/20 hover:scale-125 transition-transform shrink-0',
                                                    led.hex?.toLowerCase() === preset.hex.toLowerCase() ? 'ring-2 ring-white scale-110' : ''
                                                )}
                                                style={{ backgroundColor: preset.hex }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
