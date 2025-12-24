import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight, Save, RotateCcw, Search, Shield, Info, Plus, Loader2, Settings, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import {
    useGetRolesQuery,
    useGetPermissionsMatrixQuery,
    useGetCategoriesQuery,
    useCreatePermissionMutation,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useTogglePermissionMutation,
    useBulkUpdatePermissionsMutation,
    Role,
    Permission,
    Category
} from '@/store/services/api';

// --- Category Manager ---

function CategoryManager({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { data: categories, isLoading } = useGetCategoriesQuery();
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
    const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [newCat, setNewCat] = useState({ name: '', description: '' });
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createCategory(newCat).unwrap();
            toast.success("Category created");
            setNewCat({ name: '', description: '' });
            setView('list');
        } catch (err) {
            toast.error("Failed to create category");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCat) return;
        try {
            await updateCategory({
                id: editingCat.id,
                data: { name: editingCat.name, description: editingCat.description }
            }).unwrap();
            toast.success("Category updated");
            setEditingCat(null);
            setView('list');
        } catch (err) {
            toast.error("Failed to update category");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This might affect associated permissions.")) return;
        try {
            await deleteCategory(id).unwrap();
            toast.success("Category deleted");
        } catch (err) {
            toast.error("Failed to delete category");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Categories</DialogTitle>
                    <DialogDescription>Create, edit, or remove permission categories.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto py-4">
                    {view === 'list' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <Button size="sm" onClick={() => setView('create')}>
                                    <Plus className="mr-2 h-4 w-4" /> New Category
                                </Button>
                            </div>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories?.map((cat) => (
                                            <TableRow key={cat.id}>
                                                <TableCell className="font-mono text-xs">{cat.id}</TableCell>
                                                <TableCell className="font-medium">{cat.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{cat.description}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingCat(cat); setView('edit'); }}>
                                                            <Edit className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!categories || categories.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-4">No categories found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {view === 'create' && (
                        <form onSubmit={handleCreate} className="space-y-4 p-1">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={newCat.description} onChange={e => setNewCat({ ...newCat, description: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setView('list')}>Cancel</Button>
                                <Button type="submit" disabled={isCreating}>Create</Button>
                            </div>
                        </form>
                    )}

                    {view === 'edit' && editingCat && (
                        <form onSubmit={handleUpdate} className="space-y-4 p-1">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={editingCat.name} onChange={e => setEditingCat({ ...editingCat, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={editingCat.description} onChange={e => setEditingCat({ ...editingCat, description: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => { setView('list'); setEditingCat(null); }}>Cancel</Button>
                                <Button type="submit" disabled={isUpdating}>Update</Button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Component ---

export function PermissionManagement() {
    // API Hooks
    const { data: matrixData, isLoading: matrixLoading } = useGetPermissionsMatrixQuery();
    const { data: categoriesData } = useGetCategoriesQuery();

    const [createPermission, { isLoading: isCreatingPerm }] = useCreatePermissionMutation();
    const [togglePermission] = useTogglePermissionMutation();
    const [bulkUpdatePermissions] = useBulkUpdatePermissionsMutation();

    const [searchTerm, setSearchTerm] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const [selectedRoleGroup, setSelectedRoleGroup] = useState('All Organizations');

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

    // Forms
    const [newResource, setNewResource] = useState({ label: '', key: '', categoryId: '', description: '' });

    // Derived Data
    const roles = matrixData?.roles || [];
    const categories = matrixData?.categories || [];

    const roleGroups = useMemo(() => {
        const groups: Record<string, Role[]> = { 'All Organizations': roles };
        roles.forEach(role => {
            const orgName = role.organization?.name || role.organizationName || 'System';
            if (!groups[orgName]) groups[orgName] = [];
            groups[orgName].push(role);
        });
        return groups;
    }, [roles]);

    const visibleRoles = useMemo(() => {
        return roleGroups[selectedRoleGroup] || [];
    }, [selectedRoleGroup, roleGroups]);

    // Filtering
    const filteredCategories = useMemo(() => {
        // Deep filter
        return categories.map(cat => {
            const matchesCat = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchingPerms = (cat.permissions || []).filter(p =>
                matchesCat ||
                p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.key.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (matchingPerms.length > 0) {
                return { ...cat, permissions: matchingPerms };
            }
            return null;
        }).filter(Boolean) as Category[];
    }, [categories, searchTerm]);

    // Handlers
    const handleToggle = async (roleId: number, perm: Permission, currentGranted: boolean) => {
        try {
            await togglePermission({
                roleId,
                permissionId: perm.id,
                granted: !currentGranted
            }).unwrap();
            // No need for explicit toast here as switch will toggle optimistically or via re-fetch
        } catch (err) {
            toast.error("Failed to update permission");
        }
    };

    const handleGroupToggle = async (roleId: number, perms: Permission[]) => {
        // Determine target state: if all are currently granted, we want to revoke all. Otherwise grant all.
        const allGranted = perms.every(p => p.grantedRoles.includes(roleId));
        const targetGranted = !allGranted;

        const updates = perms.map(p => ({
            roleId: String(roleId),
            permissionId: String(p.id),
            granted: String(targetGranted) // "true" or "false"
        }));

        try {
            await bulkUpdatePermissions({ updates }).unwrap();
            toast.success(`Bulk updated permissions for role`);
        } catch (err) {
            toast.error("Failed to bulk update");
        }
    };

    const toggleGroupCollapse = (catName: string) => {
        setCollapsedGroups(prev => ({ ...prev, [catName]: !prev[catName] }));
    };

    const handleCreateResource = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createPermission({
                key: newResource.key,
                label: newResource.label,
                description: newResource.description,
                categoryId: newResource.categoryId || null
            }).unwrap();

            toast.success("Permission created successfully");
            setIsCreateDialogOpen(false);
            setNewResource({ label: '', key: '', categoryId: '', description: '' });
        } catch (err) {
            toast.error("Failed to create permission");
        }
    };

    if (matrixLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-6 h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Access Control Matrix</h1>
                    <p className="text-muted-foreground">Manage system resources and permissions via API.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => setIsCategoryManagerOpen(true)}>
                        <Settings className="h-4 w-4" /> Manage Categories
                    </Button>

                    <CategoryManager open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen} />

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" className="gap-2">
                                <Plus className="h-4 w-4" /> Create Resource
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create System Resource</DialogTitle>
                                <DialogDescription>Define a new permission capability key.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateResource} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Permission Label</Label>
                                    <Input placeholder="e.g. Approve Purchases" value={newResource.label} onChange={e => setNewResource({ ...newResource, label: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Permission Key</Label>
                                    <Input placeholder="e.g. purchase:approve" value={newResource.key} onChange={e => setNewResource({ ...newResource, key: e.target.value })} required fontFamily="monospace" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={newResource.categoryId} onValueChange={(val) => setNewResource({ ...newResource, categoryId: val })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoriesData?.map(cat => (
                                                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input placeholder="Description" value={newResource.description} onChange={e => setNewResource({ ...newResource, description: e.target.value })} />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isCreatingPerm}>
                                        {isCreatingPerm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Resource
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Button onClick={() => window.location.reload()} variant="ghost" size="icon">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <CardHeader className="py-4 border-b bg-gray-50/50 shrink-0">
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                <Shield className="h-4 w-4 sm:hidden md:block" />
                                <span className="hidden md:inline">RBAC Configuration</span>
                            </div>
                            <div className="w-56">
                                <Select value={selectedRoleGroup} onValueChange={setSelectedRoleGroup}>
                                    <SelectTrigger className="h-9 bg-white">
                                        <SelectValue placeholder="Filter Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(roleGroups).map(group => (
                                            <SelectItem key={group} value={group}>{group}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search resources..."
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-auto">
                    <div className="min-w-max">
                        {/* Sticky Header */}
                        <div className="sticky top-0 z-10 bg-white border-b shadow-sm grid grid-cols-[300px_1fr]">
                            <div className="p-4 font-bold text-sm bg-gray-50 border-r flex items-center">
                                Resource / Action
                            </div>
                            <div className="grid" style={{ gridTemplateColumns: `repeat(${visibleRoles.length}, minmax(120px, 1fr))` }}>
                                {visibleRoles.map(role => (
                                    <div key={role.id} className="p-4 font-bold text-sm text-center border-r last:border-r-0 bg-gray-50 flex flex-col items-center justify-center gap-1">
                                        <Badge variant="outline" className="bg-white whitespace-nowrap">{role.name}</Badge>
                                        <span className="text-[10px] text-muted-foreground font-normal">{role.organization?.name || 'System'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="divide-y">
                            {filteredCategories.map((cat) => {
                                const isCollapsed = collapsedGroups[cat.name];
                                const perms = cat.permissions || [];

                                return (
                                    <div key={cat.id} className="bg-white">
                                        {/* Group Header */}
                                        <div className="grid grid-cols-[300px_1fr] bg-gray-50/30 hover:bg-gray-50 transition-colors">
                                            <div
                                                className="p-3 pl-4 flex items-center gap-2 cursor-pointer border-r group"
                                                onClick={() => toggleGroupCollapse(cat.name)}
                                            >
                                                {isCollapsed ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                                <span className="font-semibold text-sm text-gray-800">{cat.name}</span>
                                                <Badge variant="secondary" className="ml-auto text-[10px] h-5">{perms.length}</Badge>
                                            </div>

                                            {/* Group Bulk Toggles */}
                                            <div className="grid" style={{ gridTemplateColumns: `repeat(${visibleRoles.length}, minmax(120px, 1fr))` }}>
                                                {visibleRoles.map(role => {
                                                    const rolePerms = perms.map(p => p.grantedRoles.includes(role.id) ? p.id : null).filter(Boolean);
                                                    const selectedCount = rolePerms.length;
                                                    const isAll = selectedCount === perms.length && perms.length > 0;
                                                    const isIndeterminate = selectedCount > 0 && !isAll;

                                                    return (
                                                        <div key={role.id} className="p-3 border-r last:border-r-0 flex justify-center items-center">
                                                            {!isCollapsed && perms.length > 0 && (
                                                                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity" title="Toggle entire group">
                                                                    <Checkbox
                                                                        checked={isAll || (isIndeterminate ? 'indeterminate' : false)}
                                                                        onCheckedChange={() => handleGroupToggle(role.id, perms)}
                                                                        className="h-4 w-4"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Rows */}
                                        {!isCollapsed && perms.map(item => (
                                            <div key={item.id} className="grid grid-cols-[300px_1fr] hover:bg-slate-50 group">
                                                <div className="p-3 pl-10 border-r flex flex-col justify-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-medium text-sm text-gray-700 font-mono truncate" title={item.key}>{item.key}</div>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate" title={item.description || ''}>{item.description || item.label}</div>
                                                </div>
                                                <div className="grid" style={{ gridTemplateColumns: `repeat(${visibleRoles.length}, minmax(120px, 1fr))` }}>
                                                    {visibleRoles.map(role => {
                                                        const isChecked = item.grantedRoles.includes(role.id);
                                                        return (
                                                            <div key={role.id} className="p-3 border-r last:border-r-0 flex justify-center items-center">
                                                                <Switch
                                                                    checked={isChecked}
                                                                    onCheckedChange={() => handleToggle(role.id, item, isChecked)}
                                                                    className={isChecked ? "data-[state=checked]:bg-emerald-500" : ""}
                                                                    aria-label={`Toggle ${item.key} for ${role.name}`}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
