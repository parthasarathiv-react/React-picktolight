import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Activity, Settings, Users, Box, LogOut, PackageSearch, PanelLeftClose, PanelLeft, Barcode } from 'lucide-react';
import { cn } from 'lib/utils';
import { useNavigate } from 'react-router-dom';

const navItems = [
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
    { icon: Settings, label: 'Configuration', path: '/settings' },
    { icon: Users, label: 'User Management', path: '/users' },
];

export default function MainLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen overflow-hidden text-foreground">
            {/* Sidebar */}
            <aside className={cn(
                "border-r border-ot-border bg-ot-surface-top flex flex-col transition-all duration-300 ease-in-out relative",
                isSidebarOpen ? "w-64" : "w-[4.5rem]"
            )}>
                {/* Sidebar Header */}
                <div className={cn(
                    "h-16 flex items-center border-b border-ot-border px-4 transition-all duration-300",
                    isSidebarOpen ? "justify-between" : "justify-center"
                )}>
                    <div className={cn(
                        "flex items-center overflow-hidden transition-all duration-300 whitespace-nowrap",
                        isSidebarOpen ? "w-auto opacity-100 gap-3" : "w-0 opacity-0 gap-0"
                    )}>
                        <span className="font-bold text-lg tracking-wider text-white">RasterPharmacy<span className="text-ot-action">.</span></span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-muted-foreground hover:text-white p-2 rounded-md hover:bg-ot-surface-elev-bottom transition-colors shrink-0 flex items-center justify-center"
                        title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => cn(
                                    "flex items-center py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                    isSidebarOpen ? "px-3 gap-3 mx-1" : "justify-center mx-auto w-10 px-0",
                                    isActive
                                        ? "text-white bg-ot-surface-elev-bottom"
                                        : "text-muted-foreground hover:text-white hover:bg-ot-surface-elev-bottom/50"
                                )}
                                title={!isSidebarOpen ? item.label : undefined}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-ot-action" : "text-muted-foreground group-hover:text-ot-action")} />

                                        <span className={cn(
                                            "transition-all duration-300 whitespace-nowrap overflow-hidden",
                                            isSidebarOpen ? "opacity-100" : "w-0 opacity-0"
                                        )}>
                                            {item.label}
                                        </span>

                                        {isActive && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-ot-action rounded-r-md" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-ot-border hidden md:block">
                    <button
                        onClick={() => navigate('/login')}
                        className={cn(
                            "flex items-center rounded-[var(--radius)] text-sm font-medium text-muted-foreground hover:text-white hover:bg-ot-surface-elev-bottom transition-colors overflow-hidden whitespace-nowrap mx-auto",
                            isSidebarOpen ? "w-[calc(100%-8px)] px-3 py-2 gap-3" : "w-10 h-10 justify-center p-0"
                        )}
                        title={!isSidebarOpen ? "Sign Out" : undefined}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span className={cn(
                            "transition-all duration-300",
                            isSidebarOpen ? "opacity-100" : "w-0 opacity-0"
                        )}>
                            Sign Out
                        </span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 border-b border-ot-border bg-ot-surface-top/50 flex items-center justify-between px-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        System Online - All Controllers Active
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-ot-surface-elev-bottom border border-ot-border flex items-center justify-center">
                                <Box className="w-4 h-4 text-ot-action" />
                            </div>
                            <div className="text-sm">
                                <div className="font-semibold text-white">Admin User</div>
                                <div className="text-xs text-muted-foreground">Administrator</div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
