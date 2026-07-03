import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Users as UsersIcon, Plus, PenSquare, Trash2, Shield, Search } from 'lucide-react';

export default function Users() {
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">User Management</h2>
                    <p className="text-muted-foreground mt-1">Manage system access, roles, and terminal assignments.</p>
                </div>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Add New User</Button>
            </div>

            <Card>
                <CardHeader className="pb-4 border-b border-ot-border/50">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>System Accounts</CardTitle>
                            <CardDescription>All registered users in the database.</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search users..." className="pl-9 h-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-ot-surface-top text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-medium">User Details</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Assigned Color Token</th>
                                <th className="px-6 py-4 font-medium">Last Active</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ot-border bg-ot-bg-top/30">
                            {[
                                { name: 'Admin User', email: 'admin@system.local', role: 'Admin', color: 'White', last: 'Now' },
                                { name: 'Sarah Supervisor', email: 'sarah@system.local', role: 'Supervisor', color: 'Purple', last: '2h ago' },
                                { name: 'John Operator', email: 'john@system.local', role: 'Operator', color: 'Green', last: '5m ago' },
                                { name: 'Mike Shift 2', email: 'mike@system.local', role: 'Operator', color: 'Blue', last: 'Yesterday' },
                            ].map((user, i) => (
                                <tr key={i} className="hover:bg-ot-surface-bottom/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-ot-surface-elev-top border border-ot-border flex items-center justify-center text-ot-action font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            {user.role === 'Admin' && <Shield className="w-3.5 h-3.5 text-ot-action" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role === 'Operator' ? (
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full bg-${user.color.toLowerCase()}-500 shadow-[0_0_5px_currentColor]`} />
                                                <span className="text-muted-foreground">{user.color}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/50">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{user.last}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-ot-action hover:text-ot-action-hover mr-4 transition-colors"><PenSquare className="w-4 h-4" /></button>
                                        <button className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
