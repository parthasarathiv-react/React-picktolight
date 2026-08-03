import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'components/ui/table';
import { Plus, PenSquare, Trash2, Shield, Search, Eye, EyeOff, RefreshCw, Loader2, UserCheck, ShieldAlert, User } from 'lucide-react';
import { ConfirmDialog } from 'components/ui/ConfirmDialog';
import { apiService } from 'lib/apiService';
import { toast } from 'sonner';

const ROLES = [
    { value: 'ADMIN', label: 'ADMIN' },
    { value: 'VIEWER', label: 'VIEWER' }
];

const decodeBase64Password = (str) => {
    if (!str) return '';
    try {
        const decoded = atob(str);
        if (btoa(decoded) === str) {
            return decoded;
        }
        return str;
    } catch (e) {
        return str;
    }
};

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isActiveToggle, setIsActiveToggle] = useState(true);
    const [selectedRole, setSelectedRole] = useState('VIEWER');
    const [userToDelete, setUserToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await apiService.getUsers();
            const userList = Array.isArray(res) ? res : (res?.data || []);
            setUsers(userList);
        } catch (err) {
            toast.error(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = () => {
        setEditingUser(null);
        setIsActiveToggle(true);
        setSelectedRole('VIEWER');
        setShowPassword(false);
        setFieldErrors({});
        setShowUserForm(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setIsActiveToggle(user.is_active ?? true);
        const currentRole = (user.role || 'VIEWER').toUpperCase();
        setSelectedRole(ROLES.some(r => r.value === currentRole) ? currentRole : 'VIEWER');
        setShowPassword(false);
        setFieldErrors({});
        setShowUserForm(true);
    };

    const handleCancelForm = () => {
        setShowUserForm(false);
        setEditingUser(null);
        setFieldErrors({});
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});
        const data = new FormData(e.currentTarget);
        const full_name = data.get('full_name');
        const email = data.get('email');
        const password = data.get('password');
        const username = full_name; // Automatically use full_name for username field in payload
        const role = selectedRole ? selectedRole.toLowerCase() : 'employee';
        const is_active = isActiveToggle;

        setSubmitting(true);
        try {
            if (editingUser) {
                const payload = {
                    username,
                    email,
                    full_name,
                    role,
                    is_active
                };
                if (password) {
                    payload.password = password;
                }
                await apiService.updateUser(editingUser.id, payload);
                toast.success('User updated successfully');
            } else {
                const payload = {
                    username,
                    email,
                    full_name,
                    role,
                    is_active,
                    password
                };
                await apiService.createUser(payload);
                toast.success('User registered successfully');
            }
            setShowUserForm(false);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            const errorsObj = {};
            const rawErrors = err.fieldErrors || err.raw?.errors || err.raw?.detail;
            if (Array.isArray(rawErrors)) {
                rawErrors.forEach((e) => {
                    const field = Array.isArray(e.loc) && e.loc.length > 0 ? e.loc[e.loc.length - 1] : e.field;
                    const msg = e.msg || e.detail || (typeof e === 'string' ? e : '');
                    if (field && msg) {
                        errorsObj[field] = msg;
                        if (field === 'username') {
                            errorsObj['full_name'] = msg;
                        }
                    }
                });
            }
            setFieldErrors(errorsObj);
            toast.error(err.message || 'Failed to save user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = (id) => {
        setUserToDelete(id);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        setDeleting(true);
        try {
            await apiService.deleteUser(userToDelete);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (err) {
            toast.error(err.message || 'Failed to delete user');
        } finally {
            setDeleting(false);
            setUserToDelete(null);
        }
    };

    const getRoleBadge = (roleStr) => {
        const r = (roleStr || '').toUpperCase();
        switch (r) {
            case 'ADMIN':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20 tracking-wider">
                        <Shield className="w-3 h-3 text-red-400" />
                        ADMIN
                    </span>
                );
            case 'MANAGER':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-wider">
                        <ShieldAlert className="w-3 h-3 text-purple-400" />
                        MANAGER
                    </span>
                );
            case 'EMPLOYEE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 tracking-wider">
                        <UserCheck className="w-3 h-3 text-blue-400" />
                        EMPLOYEE
                    </span>
                );
            case 'VIEWER':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 tracking-wider">
                        <User className="w-3 h-3 text-gray-400" />
                        VIEWER
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/20 tracking-wider">
                        {r || 'EMPLOYEE'}
                    </span>
                );
        }
    };

    const filteredUsers = users.filter((u) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (u.full_name && u.full_name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.role && u.role.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">User Management</h2>
                    <p className="text-muted-foreground mt-1">Manage system access, roles, and user accounts.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={fetchUsers}
                        disabled={loading}
                        className="gap-2 border-ot-border text-white hover:bg-ot-surface-elev-bottom"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {!showUserForm && (
                        <Button onClick={handleAddUser} className="gap-2 bg-ot-action text-white hover:bg-ot-action-hover">
                            <Plus className="w-4 h-4" /> Add New User
                        </Button>
                    )}
                </div>
            </div>

            {showUserForm && (
                <Card className="border-ot-border/50 bg-ot-bg-top/30 animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleUserSubmit} key={editingUser ? editingUser.id : 'new'}>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Full Name</label>
                                    <Input
                                        name="full_name"
                                        defaultValue={editingUser ? editingUser.full_name : ''}
                                        placeholder="e.g. John Doe"
                                        className={`bg-ot-surface-bottom ${fieldErrors.full_name || fieldErrors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                        onChange={() => setFieldErrors(prev => ({ ...prev, full_name: null, username: null }))}
                                        required
                                    />
                                    {(fieldErrors.full_name || fieldErrors.username) && (
                                        <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.full_name || fieldErrors.username}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Email Address</label>
                                    <Input
                                        type="email"
                                        name="email"
                                        defaultValue={editingUser ? editingUser.email : ''}
                                        placeholder="john@example.com"
                                        className={`bg-ot-surface-bottom ${fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                        onChange={() => setFieldErrors(prev => ({ ...prev, email: null }))}
                                        required
                                    />
                                    {fieldErrors.email && (
                                        <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.email}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Role</label>
                                    <Select
                                        value={selectedRole}
                                        onValueChange={(val) => {
                                            setSelectedRole(val);
                                            setFieldErrors(prev => ({ ...prev, role: null }));
                                        }}
                                    >
                                        <SelectTrigger className={`bg-ot-surface-bottom border-ot-border text-white ${fieldErrors.role ? 'border-red-500' : ''}`}>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map((roleOpt) => (
                                                <SelectItem key={roleOpt.value} value={roleOpt.value}>
                                                    {roleOpt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldErrors.role && (
                                        <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.role}</p>
                                    )}
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Password</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            defaultValue={editingUser ? decodeBase64Password(editingUser.password) : ''}
                                            placeholder={editingUser ? 'Enter password' : 'StrongPass@123'}
                                            className={`bg-ot-surface-bottom pr-10 ${fieldErrors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                            onChange={() => setFieldErrors(prev => ({ ...prev, password: null }))}
                                            required={!editingUser}
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
                                    {fieldErrors.password && (
                                        <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.password}</p>
                                    )}
                                </div>
                                <div className="space-y-2 col-span-2">
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
                                <Button type="button" onClick={handleCancelForm} disabled={submitting} variant="outline" className="border-ot-border hover:bg-ot-surface-elev-bottom text-white">
                                    CANCEL
                                </Button>
                                <Button type="submit" disabled={submitting} className="bg-ot-action text-white hover:bg-ot-action-hover gap-2">
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
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
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 bg-ot-surface-bottom border-ot-border"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center p-12 text-muted-foreground gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-ot-action" />
                            <span>Loading users...</span>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex items-center justify-center p-12 text-muted-foreground">
                            <span>No users found.</span>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-ot-bg-top/30">
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id || user.email}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-ot-surface-elev-top border border-ot-border flex items-center justify-center text-ot-action font-bold">
                                                    {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-medium text-white">
                                                    {user.full_name || user.username}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            {getRoleBadge(user.role)}
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
                                            <Button variant="ghost" onClick={() => handleEditUser(user)} className="text-ot-action hover:text-ot-action-hover mr-2 transition-colors">
                                                <PenSquare className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!userToDelete}
                onOpenChange={(open) => !open && setUserToDelete(null)}
                title="Confirm Deletion"
                description="Are you sure you want to delete this user? This action cannot be undone."
                confirmText={deleting ? 'Deleting...' : 'Delete'}
                cancelText="Cancel"
                variant="destructive"
                onConfirm={confirmDeleteUser}
                onCancel={() => setUserToDelete(null)}
            />
        </div>
    );
}
