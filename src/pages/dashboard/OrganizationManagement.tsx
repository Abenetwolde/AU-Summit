import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, Filter, MoreHorizontal, Building2, Users, Loader2, Edit, Trash } from 'lucide-react';
import { OrganizationUsersModal } from '@/components/modals/OrganizationUsersModal';
import { toast } from 'sonner';
import {
    useGetOrganizationsQuery,
    useCreateOrganizationMutation,
    useUpdateOrganizationMutation,
    useGetUsersQuery,
    Organization,
    getFileUrl
} from '@/store/services/api';

export function OrganizationManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

    // API Hooks
    const { data: organizations = [], isLoading: isOrgLoading } = useGetOrganizationsQuery();
    const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery();
    const users = usersData?.users ?? [];
    const [createOrganization, { isLoading: isCreating }] = useCreateOrganizationMutation();
    const [updateOrganization, { isLoading: isUpdating }] = useUpdateOrganizationMutation();

    // Form States
    const [formData, setFormData] = useState<{ name: string, description: string, logo: File | null }>({
        name: '', description: '', logo: null
    });

    // Derived Data
    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalOrgs = organizations.length;
    const totalUsers = users.length;

    // Helper to get user count for an org
    const getUserCountForOrg = (orgId: number) => {
        return users.filter(user => user.role?.organizationId === orgId).length;
    };

    // Helper to filter users for selected org
    const getUsersForOrg = (orgId: number) => {
        // The modal expects a specific structure, we'll map API users to it if needed
        // Assuming OrganizationUsersModal handles the User type from API or similar
        return users.filter(user => user.role?.organizationId === orgId);
    };


    // Handlers
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        if (formData.logo) {
            data.append('logo', formData.logo);
        }

        try {
            await createOrganization(data).unwrap();
            toast.success("Organization created successfully");
            setIsCreateModalOpen(false);
            setFormData({ name: '', description: '', logo: null });
        } catch (err) {
            toast.error("Failed to create organization");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrg) return;

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        if (formData.logo) {
            data.append('logo', formData.logo);
        }

        try {
            await updateOrganization({ id: selectedOrg.id, data }).unwrap();
            toast.success("Organization updated successfully");
            setIsEditModalOpen(false);
            setFormData({ name: '', description: '', logo: null });
            setSelectedOrg(null);
        } catch (err) {
            toast.error("Failed to update organization");
        }
    };

    const openEdit = (org: Organization) => {
        setSelectedOrg(org);
        setFormData({ name: org.name, description: org.description, logo: null }); // Logo file can't be prefilled
        setIsEditModalOpen(true);
    };

    const openUserManagement = (org: Organization) => {
        setSelectedOrg(org);
        setIsUserModalOpen(true);
    };

    if (isOrgLoading || isUsersLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Organization Management</h2>
                    <p className="text-muted-foreground">Manage partner organizations and their access.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Add Organization
                </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Organizations</p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalOrgs}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalUsers}</h3>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Filters */}
            <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <Label className="text-gray-500 text-xs uppercase font-bold">Search</Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search organizations..."
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

            {/* Organization Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrgs.map(org => (
                    <Card key={org.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                    {org?.logoUrl ? (
                                        <img src={getFileUrl(org.logoUrl)} alt={org.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Building2 className="h-6 w-6 text-gray-400" />
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEdit(org)}>
                                            <Edit className="h-4 w-4 mr-2" /> Edit Details
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="text-red-600">
                                            <Trash className="h-4 w-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{org.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{org.description}</p>

                            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                                <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" /> {getUserCountForOrg(org.id)} Users
                                </span>
                                <span className="text-xs">Created {new Date(org.createdAt).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Organization</DialogTitle>
                        <DialogDescription>Create a new partner organization.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Organization Name</Label>
                            <Input
                                placeholder="E.g. NISS, INSA"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="Brief description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Logo</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={e => setFormData({ ...formData, logo: e.target.files?.[0] || null })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Organization
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Organization</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Organization Name</Label>
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
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Update Logo (Optional)</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={e => setFormData({ ...formData, logo: e.target.files?.[0] || null })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Manage Users Dialog */}
            {selectedOrg && (
                <OrganizationUsersModal
                    open={isUserModalOpen}
                    onOpenChange={setIsUserModalOpen}
                    organization={{
                        id: String(selectedOrg.id),
                        name: selectedOrg.name,
                        users: getUsersForOrg(selectedOrg.id).map(u => ({
                            id: u.id,
                            name: u.fullName,
                            email: u.email,
                            role: u.roleName || 'User', // Fallback
                            status: u.status
                        }))
                    }}
                />
            )}
        </div>
    );
}
