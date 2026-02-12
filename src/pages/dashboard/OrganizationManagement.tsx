import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useAuth } from '@/auth/context';
import { organizationSchema } from '@/lib/validation-schemas';

type OrganizationFormData = z.infer<typeof organizationSchema> & {
    logo?: any; // FileList
};

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

    const { checkPermission } = useAuth();
    const canCreateOrg = checkPermission('organization:create');
    const canUpdateOrg = checkPermission('organization:update');
    const canDeleteOrg = checkPermission('organization:delete');

    // Create Form
    const {
        register: registerCreate,
        handleSubmit: handleSubmitCreate,
        reset: resetCreate,
        formState: { errors: errorsCreate }
    } = useForm<OrganizationFormData>({
        resolver: zodResolver(organizationSchema),
        defaultValues: {
            name: '',
            description: ''
        }
    });

    // Edit Form
    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        setValue: setValueEdit,
        formState: { errors: errorsEdit }
    } = useForm<OrganizationFormData>({
        resolver: zodResolver(organizationSchema),
        defaultValues: {
            name: '',
            description: ''
        }
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
        return users.filter(user => user.role?.organizationId === orgId);
    };

    // Handlers
    const onCreateSubmit = async (data: OrganizationFormData) => {
        if (!canCreateOrg) {
            toast.error("You don't have permission to create organizations");
            return;
        }

        const formData = new FormData();
        formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);

        // Handle file input
        if (data.logo && data.logo.length > 0) {
            formData.append('logo', data.logo[0]);
        }

        try {
            await createOrganization(formData).unwrap();
            toast.success("Organization created successfully");
            setIsCreateModalOpen(false);
            resetCreate();
        } catch (err) {
            toast.error("Failed to create organization");
        }
    };

    const onUpdateSubmit = async (data: OrganizationFormData) => {
        if (!selectedOrg) return;

        if (!canUpdateOrg) {
            toast.error("You don't have permission to update organizations");
            return;
        }

        const formData = new FormData();
        formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);

        // Handle file input
        if (data.logo && data.logo.length > 0) {
            formData.append('logo', data.logo[0]);
        }

        try {
            await updateOrganization({ id: selectedOrg.id, data: formData }).unwrap();
            toast.success("Organization updated successfully");
            setIsEditModalOpen(false);
            setSelectedOrg(null);
            resetEdit();
        } catch (err) {
            toast.error("Failed to update organization");
        }
    };

    const openEdit = (org: Organization) => {
        if (!canUpdateOrg) {
            toast.error("You don't have permission to edit organizations");
            return;
        }
        setSelectedOrg(org);
        setValueEdit('name', org.name);
        setValueEdit('description', org.description);
        // We don't set the logo file input as it's read-only for files usually
        setIsEditModalOpen(true);
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
                {canCreateOrg && (
                    <Button onClick={() => { setIsCreateModalOpen(true); resetCreate(); }} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> Add Organization
                    </Button>
                )}
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
                                {(canUpdateOrg || canDeleteOrg) && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {canUpdateOrg && (
                                                <DropdownMenuItem onClick={() => openEdit(org)}>
                                                    <Edit className="h-4 w-4 mr-2" /> Edit Details
                                                </DropdownMenuItem>
                                            )}

                                            {canDeleteOrg && (
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => {
                                                        toast.info("Delete functionality coming soon");
                                                    }}
                                                >
                                                    <Trash className="h-4 w-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
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
                    <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Organization Name</Label>
                            <Input
                                id="create-name"
                                placeholder="E.g. NISS, INSA"
                                {...registerCreate('name')}
                                error={errorsCreate.name?.message}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-description">Description</Label>
                            <Input
                                id="create-description"
                                placeholder="Brief description"
                                {...registerCreate('description')}
                                error={errorsCreate.description?.message}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-logo">Logo</Label>
                            <Input
                                id="create-logo"
                                type="file"
                                accept="image/*"
                                {...registerCreate('logo')}
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
                    <form onSubmit={handleSubmitEdit(onUpdateSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Organization Name</Label>
                            <Input
                                id="edit-name"
                                {...registerEdit('name')}
                                error={errorsEdit.name?.message}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Input
                                id="edit-description"
                                {...registerEdit('description')}
                                error={errorsEdit.description?.message}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-logo">Update Logo (Optional)</Label>
                            <Input
                                id="edit-logo"
                                type="file"
                                accept="image/*"
                                {...registerEdit('logo')}
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
                            role: u.roleName || 'User',
                            status: u.status
                        }))
                    }}
                />
            )}
        </div>
    );
}
