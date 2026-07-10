import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'components/ui/table';
import { Users as Plus, PenSquare, Trash2, Shield, Search, Eye, EyeOff } from 'lucide-react';

const INITIAL_USERS = [
    { id: 1, username: 'admin_user', email: 'admin@system.local', full_name: 'Admin User', role: 'admin', is_active: true, password: 'StrongPass@123' },
    { id: 2, username: 'sarah_sup', email: 'sarah@system.local', full_name: 'Sarah Supervisor', role: 'supervisor', is_active: true, password: 'StrongPass@123' },
    { id: 3, username: 'john_doe', email: 'john@example.com', full_name: 'John Doe', role: 'employee', is_active: true, password: 'StrongPass@123' },
    { id: 4, username: 'mike_shift2', email: 'mike@system.local', full_name: 'Mike Shift 2', role: 'employee', is_active: false, password: 'StrongPass@123' },
];

export default function Users() {
    const [users, setUsers] = useState(INITIAL_USERS);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isActiveToggle, setIsActiveToggle] = useState(true);

    const handleAddUser = () => {
        setEditingUser(null);
        setIsActiveToggle(true);
        setShowPassword(false);
        setShowUserForm(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setIsActiveToggle(user.is_active);
        setShowPassword(false);
        setShowUserForm(true);
    };

    const handleCancelForm = () => {
        setShowUserForm(false);
        setEditingUser(null);
    };

    const handleUserSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const full_name = data.get('full_name');
        const username = data.get('username');
        const email = data.get('email');
        const role = data.get('role');
        const password = data.get('password');
        const is_active = isActiveToggle;

        if (editingUser) {
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, full_name, username, email, role, password, is_active } : u));
        } else {
            setUsers([...users, {
                id: Date.now(),
                full_name,
                username,
                email,
                role,
                password,
                is_active
            }]);
        }
        setShowUserForm(false);
        setEditingUser(null);
    };

    const handleDeleteUser = (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">User Management</h2>
                    <p className="text-muted-foreground mt-1">Manage system access, roles, and terminal assignments.</p>
                </div>
                {!showUserForm && (
                    <Button onClick={handleAddUser} className="gap-2 bg-ot-action text-white hover:bg-ot-action-hover">
                        <Plus className="w-4 h-4" /> Add New User
                    </Button>
                )}
            </div>

            {showUserForm && (
                <Card className="border-ot-border/50 bg-ot-bg-top/30 animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleUserSubmit}>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Full Name</label>
                                    <Input name="full_name" defaultValue={editingUser ? editingUser.full_name : ''} placeholder="e.g. John Doe" className="bg-ot-surface-bottom" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Username</label>
                                    <Input name="username" defaultValue={editingUser ? editingUser.username : ''} placeholder="e.g. john_doe" className="bg-ot-surface-bottom" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Email Address</label>
                                    <Input type="email" name="email" defaultValue={editingUser ? editingUser.email : ''} placeholder="john@example.com" className="bg-ot-surface-bottom" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Role</label>
                                    <Select name="role" defaultValue={editingUser ? editingUser.role : 'employee'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="supervisor">Supervisor</SelectItem>
                                            <SelectItem value="employee">Employee</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Password</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            defaultValue={editingUser ? editingUser.password : ''}
                                            placeholder="Password"
                                            className="bg-ot-surface-bottom pr-10"
                                            required
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-white hover:bg-transparent transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase block mb-2">Status</label>
                                    <label className="flex items-center cursor-pointer w-max">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={isActiveToggle}
                                                onChange={(e) => setIsActiveToggle(e.target.checked)}
                                            />
                                            <div className={`block w-10 h-6 rounded-full transition-colors ${isActiveToggle ? 'bg-ot-action' : 'bg-ot-surface-elev-top'}`}></div>
                                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isActiveToggle ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <div className="ml-3 text-sm font-medium text-white">{isActiveToggle ? 'Active' : 'Inactive'}</div>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" onClick={handleCancelForm} variant="outline" className="border-ot-border hover:bg-ot-surface-elev-bottom text-white">CANCEL</Button>
                                <Button type="submit" className="bg-ot-action text-white hover:bg-ot-action-hover">
                                    {editingUser ? 'SAVE CHANGES' : 'ADD USER'}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            )}

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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User Details</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="bg-ot-bg-top/30">
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-ot-surface-elev-top border border-ot-border flex items-center justify-center text-ot-action font-bold">
                                                {user.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{user.full_name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.username}
                                    </TableCell>
                                    <TableCell>
                                        <span className="flex items-center gap-1.5 text-muted-foreground capitalize">
                                            {user.role === 'admin' && <Shield className="w-3.5 h-3.5 text-ot-action" />}
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 text-xs rounded-full border ${user.is_active
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" onClick={() => handleEditUser(user)} className="text-ot-action hover:text-ot-action-hover mr-4 transition-colors"><PenSquare className="w-4 h-4" /></Button>
                                        <Button variant="ghost" onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
