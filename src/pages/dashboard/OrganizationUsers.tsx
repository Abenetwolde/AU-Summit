import React, { useState } from 'react';
import { Plus, Search, UserPlus, Edit2, Trash2, Shield, Mail } from 'lucide-react';
import {
    useGetOrganizationUsersQuery,
    useCreateOrganizationUserMutation,
    useUpdateOrganizationUserMutation,
    useDeleteOrganizationUserMutation,
    useGetOrganizationRolesQuery,
    useGetOrganizationsQuery,
    useGetEmbassiesQuery,
    User,
    Role
} from '../../store/services/api';
import { useAuth, UserRole } from '../../auth/context';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

export function OrganizationUsers() {
    const { user: authUser } = useAuth();
    const isSuperAdmin = authUser?.role === UserRole.SUPER_ADMIN;

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState<number | undefined>();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        roleId: '',
        embassyId: ''
    });

    const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>();

    const { data: organizations } = useGetOrganizationsQuery(undefined, {
        skip: !isSuperAdmin
    });

    const { data, isLoading, refetch } = useGetOrganizationUsersQuery({
        page,
        limit: 10,
        search,
        roleId: selectedRole,
        organizationId: isSuperAdmin ? selectedOrgId : undefined
    }, {
        skip: isSuperAdmin && !selectedOrgId
    });

    const { data: embassies } = useGetEmbassiesQuery();

    const selectedOrgName = organizations?.find(o => o.id === selectedOrgId)?.name || (authUser as any)?.organization?.name || '';
    const isEmbassyOrg = selectedOrgName.toLowerCase().includes('embassy');

    const { data: roles } = useGetOrganizationRolesQuery(isSuperAdmin ? selectedOrgId : undefined, {
        skip: isSuperAdmin && !selectedOrgId
    });

    const [createUser, { isLoading: isCreating }] = useCreateOrganizationUserMutation();
    const [updateUser, { isLoading: isUpdating }] = useUpdateOrganizationUserMutation();
    const [deleteUser, { isLoading: isDeleting }] = useDeleteOrganizationUserMutation();

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullName || !formData.email || !formData.password || !formData.roleId) {
            toast.error('All fields are required');
            return;
        }

        try {
            await createUser({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                roleId: Number(formData.roleId),
                embassyId: formData.embassyId ? Number(formData.embassyId) : undefined,
                organizationId: isSuperAdmin ? selectedOrgId : undefined
            }).unwrap();

            toast.success('User created successfully');
            setShowCreateModal(false);
            setFormData({ fullName: '', email: '', password: '', roleId: '', embassyId: '' });
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.error || 'Failed to create user');
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUser) return;

        try {
            await updateUser({
                id: selectedUser.id,
                data: {
                    fullName: formData.fullName || undefined,
                    email: formData.email || undefined,
                    roleId: formData.roleId ? Number(formData.roleId) : undefined,
                    embassyId: formData.embassyId ? Number(formData.embassyId) : undefined,
                    organizationId: isSuperAdmin ? selectedOrgId : undefined
                }
            }).unwrap();

            toast.success('User updated successfully');
            setShowEditModal(false);
            setSelectedUser(null);
            setFormData({ fullName: '', email: '', password: '', roleId: '', embassyId: '' });
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.error || 'Failed to update user');
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            await deleteUser({
                id: selectedUser.id,
                organizationId: isSuperAdmin ? selectedOrgId : undefined
            }).unwrap();
            toast.success('User deleted successfully');
            setShowDeleteModal(false);
            setSelectedUser(null);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.error || 'Failed to delete user');
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            fullName: user.fullName,
            email: user.email,
            password: '',
            roleId: user.roleId.toString(),
            embassyId: user.embassyId?.toString() || ''
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (user: User) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organization Users</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage user accounts and roles within organizations
                    </p>
                </div>
                <div className="flex gap-2">
                    {isSuperAdmin && (
                        <div className="w-64">
                            <Select
                                value={selectedOrgId?.toString()}
                                onValueChange={(val) => setSelectedOrgId(Number(val))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations?.map(org => (
                                        <SelectItem key={org.id} value={org.id.toString()}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="gap-2"
                        disabled={isSuperAdmin && !selectedOrgId}
                    >
                        <UserPlus className="w-4 h-4" />
                        Create User
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={selectedRole?.toString()}
                            onValueChange={(val) => setSelectedRole(val === 'all' ? undefined : Number(val))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {roles?.filter(r => {
                                    if (r.name === 'CLIENT') return false;
                                    if (r.name === 'EMBASSY_OFFICER') return isEmbassyOrg;
                                    return true;
                                }).map(role => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                        {role.description || role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        {data?.total || 0} total users in your organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : isSuperAdmin && !selectedOrgId ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Please select an organization to manage its users.
                        </div>
                    ) : !data?.users?.length ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No users found. Create your first user to get started.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.fullName}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="gap-1">
                                                <Shield className="w-3 h-3" />
                                                {user.role?.name || 'N/A'}
                                            </Badge>
                                            {user.embassy && (
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    {user.embassy.name}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditModal(user)}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openDeleteModal(user)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {data && data.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Page {data.currentPage} of {data.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= data.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create User Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Add a new user to your organization
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Minimum 6 characters"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="roleId">Role</Label>
                            <Select
                                value={formData.roleId}
                                onValueChange={(val) => setFormData({ ...formData, roleId: val })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles?.filter(r => {
                                        if (r.name === 'CLIENT') return false;
                                        if (r.name === 'EMBASSY_OFFICER') return isEmbassyOrg;
                                        return true;
                                    }).map(role => (
                                        <SelectItem key={role.id} value={role.id.toString()}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(roles?.find(r => r.id === Number(formData.roleId))?.name === 'EMBASSY_OFFICER') && (
                            <div>
                                <Label htmlFor="embassyId">Linked Embassy</Label>
                                <Select
                                    value={formData.embassyId}
                                    onValueChange={(val) => setFormData({ ...formData, embassyId: val })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an embassy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {embassies?.map(embassy => (
                                            <SelectItem key={embassy.id} value={embassy.id.toString()}>
                                                {embassy.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating ? 'Creating...' : 'Create User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-fullName">Full Name</Label>
                            <Input
                                id="edit-fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-roleId">Role</Label>
                            <Select
                                value={formData.roleId}
                                onValueChange={(val) => setFormData({ ...formData, roleId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles?.filter(r => {
                                        if (r.name === 'CLIENT') return false;
                                        if (r.name === 'EMBASSY_OFFICER') return isEmbassyOrg;
                                        return true;
                                    }).map(role => (
                                        <SelectItem key={role.id} value={role.id.toString()}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(roles?.find(r => r.id === Number(formData.roleId))?.name === 'EMBASSY_OFFICER') && (
                            <div>
                                <Label htmlFor="edit-embassyId">Linked Embassy</Label>
                                <Select
                                    value={formData.embassyId}
                                    onValueChange={(val) => setFormData({ ...formData, embassyId: val })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an embassy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {embassies?.map(embassy => (
                                            <SelectItem key={embassy.id} value={embassy.id.toString()}>
                                                {embassy.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? 'Updating...' : 'Update User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedUser?.fullName}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
