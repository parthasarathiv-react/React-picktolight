import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from 'components/ui/dialog';
import { Button } from 'components/ui/button';
import { Activity, MapPin, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { API_URL } from 'config/api';

export default function LocationSelectionDialog({ open, onOpenChange, onSelectLocation }) {
    const [groupedLocations, setGroupedLocations] = useState({});
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});

    useEffect(() => {
        if (open) {
            fetchLocations();
        }
    }, [open]);

    const fetchLocations = async () => {
        setIsLoadingLocations(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/picklight/locations`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    const grouped = {};
                    data.data.forEach(loc => {
                        const org = loc.organization_id || 'Organization';
                        const branch = loc.branch_id || 'Branch';
                        if (!grouped[org]) grouped[org] = {};
                        if (!grouped[org][branch]) grouped[org][branch] = [];
                        grouped[org][branch].push(loc);
                    });
                    setGroupedLocations(grouped);

                    const initialExpanded = {};
                    const orgs = Object.keys(grouped);
                    if (orgs.length === 1) {
                        const branches = Object.keys(grouped[orgs[0]]);
                        if (branches.length === 1) {
                            initialExpanded[`${orgs[0]}-${branches[0]}`] = true;
                        }
                    }
                    setExpandedGroups(initialExpanded);
                }
            }
        } catch (e) {
            console.error("Failed to fetch locations", e);
        } finally {
            setIsLoadingLocations(false);
        }
    };

    const toggleGroup = (org, branch) => {
        const key = `${org}-${branch}`;
        setExpandedGroups(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSelect = (loc) => {
        onSelectLocation(loc);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Location</DialogTitle>
                    <DialogDescription>
                        Please choose your working location to continue
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {isLoadingLocations ? (
                        <div className="text-center text-muted-foreground py-8">
                            <Activity className="w-6 h-6 animate-spin mx-auto mb-2 text-ot-action" />
                            <p>Loading locations...</p>
                        </div>
                    ) : Object.keys(groupedLocations).length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No locations available.</p>
                        </div>
                    ) : (
                        Object.entries(groupedLocations).map(([org, branches]) => (
                            <div key={org} className="space-y-3">
                                <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                    <Building2 className="w-3.5 h-3.5 mr-1.5" />
                                    {org}
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(branches).map(([branch, locs]) => {
                                        const groupKey = `${org}-${branch}`;
                                        const isExpanded = expandedGroups[groupKey];
                                        const isSingleBranch = Object.keys(branches).length === 1;

                                        return (
                                            <div key={branch} className={`space-y-1 ${!isSingleBranch ? 'bg-ot-surface/30 rounded-lg border border-ot-border/50 overflow-hidden' : ''}`}>
                                                {!isSingleBranch && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGroup(org, branch)}
                                                        className="w-full flex items-center justify-between px-4 py-3 bg-ot-surface hover:bg-ot-surface-hover transition-colors"
                                                    >
                                                        <span className="font-medium text-sm text-gray-200">{branch}</span>
                                                        {isExpanded ? (
                                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                    </button>
                                                )}

                                                {(isSingleBranch || isExpanded) && (
                                                    <div className={`${!isSingleBranch ? 'p-2 bg-black/20' : 'pt-1'} space-y-2`}>
                                                        {locs.map((loc) => (
                                                            <Button
                                                                key={loc.pick_location_id}
                                                                variant="outline"
                                                                className="group relative w-full justify-start h-14 text-left border-ot-border bg-ot-surface/50 hover:bg-ot-action/10 hover:text-white hover:border-ot-action transition-all overflow-hidden"
                                                                onClick={() => handleSelect(loc)}
                                                            >
                                                                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ot-action/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                                                                <MapPin className="w-5 h-5 mr-3 text-ot-action group-hover:text-ot-action-hover transition-colors" />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-gray-200 group-hover:text-white transition-colors">
                                                                        {loc.location_name}
                                                                    </span>
                                                                    {loc.bill_prefix && (
                                                                        <span className="text-xs text-muted-foreground group-hover:text-gray-300 transition-colors">
                                                                            Prefix: {loc.bill_prefix}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </DialogContent>
        </Dialog>
    );
}
