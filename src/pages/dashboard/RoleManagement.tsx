import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, Filter, MoreHorizontal, Shield, Edit, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import {
    useGetRolesQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useGetOrganizationsQuery,
    Role
} from '@/store/services/api';
import { useEffect } from 'react';

export function RoleManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [page, setPage] = useState(1);
    const limit = 30;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentRole, setCurrentRole] = useState<Role | null>(null);

    // Reset to page 1 when search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    // API
    const { data: rolesData, isLoading } = useGetRolesQuery({
        page,
        limit,
        search: debouncedSearch
    });

    const roles = rolesData?.roles || [];
    const totalPages = rolesData?.totalPages || 1;
    const totalRoles = rolesData?.total || 0;

    const { data: organizations = [] } = useGetOrganizationsQuery();
    const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
    const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

    // Form Stats
    const [formData, setFormData] = useState({ name: '', description: '', organizationId: '' });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createRole({
                name: formData.name,
                description: formData.description,
                organizationId: formData.organizationId ? Number(formData.organizationId) : null
            }).unwrap();
            toast.success("Role created successfully");
            setIsCreateModalOpen(false);
            setFormData({ name: '', description: '', organizationId: '' });
        } catch (error) {
            toast.error("Failed to create role");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentRole) return;
        try {
            await updateRole({
                id: currentRole.id,
                data: {
                    name: formData.name,
                    description: formData.description,
                    organizationId: formData.organizationId ? Number(formData.organizationId) : null
                }
            }).unwrap();
            toast.success("Role updated successfully");
            setIsEditModalOpen(false);
            setCurrentRole(null);
            setFormData({ name: '', description: '', organizationId: '' });
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    const openEdit = (role: Role) => {
        setCurrentRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            organizationId: role.organizationId ? String(role.organizationId) : ''
        });
        setIsEditModalOpen(true);
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Role Management</h2>
                    <p className="text-muted-foreground">Define roles and assign them to organizations.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Create Role
                </Button>
            </div>

            {/* Filter */}
            <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <Label className="text-gray-500 text-xs uppercase font-bold">Search</Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search roles..."
                                    className="pl-9 bg-gray-50 border-gray-200"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button variant="outline" className="gap-2 border-gray-200 text-gray-600">
                            <Filter className="h-4 w-4" /> Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => (
                    <Card key={role.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEdit(role)}>
                                            <Edit className="h-4 w-4 mr-2" /> Edit Role
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{role.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{role.description || 'No description'}</p>

                            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                                <span className="flex items-center gap-1 font-medium bg-gray-100 px-2 py-1 rounded">
                                    {role.organizationId ? (role.organizationName || `Org #${role.organizationId}`) : 'Global Role'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 border-t pt-6">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-medium">{roles.length}</span> of <span className="font-medium">{totalRoles}</span> roles
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <Button
                                    key={p}
                                    variant={page === p ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPage(p)}
                                    className="w-8 h-8 p-0"
                                >
                                    {p}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="gap-1"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                        <DialogDescription>Define a new role and optionally assign to an organization.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Role Name</Label>
                            <Input
                                placeholder="e.g. OFFICER_I"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="Role description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Organization (Optional)</Label>
                            <Select
                                value={formData.organizationId}
                                onValueChange={val => setFormData({ ...formData, organizationId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">None (Global)</SelectItem>
                                    {organizations.map(org => (
                                        <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Role Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Organization</Label>
                            <Select
                                value={formData.organizationId}
                                onValueChange={val => setFormData({ ...formData, organizationId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">None (Global)</SelectItem>
                                    {organizations.map(org => (
                                        <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
