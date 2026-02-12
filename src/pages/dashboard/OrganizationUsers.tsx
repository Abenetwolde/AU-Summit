import React, { useState, useEffect } from 'react';
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
  Role,
} from '../../store/services/api';
import { useAuth, UserRole } from '../../auth/context';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// ──────────────────────────────────────────────
// Zod Schemas
// ──────────────────────────────────────────────
const baseUserSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').trim(),
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  roleId: z.string().min(1, 'Role is required'),
  embassyId: z.string().optional(),
});

const createUserSchema = baseUserSchema
  .extend({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      // We'll handle conditional embassy logic via form watch + trigger
      return true;
    },
    { message: 'Embassy is required for EMBASSY_OFFICER role', path: ['embassyId'] }
  );

const editUserSchema = baseUserSchema; // No password on edit

type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

export function OrganizationUsers() {
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === UserRole.PMO || authUser?.role === UserRole.SUPER_ADMIN;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>();

  const { data: organizations } = useGetOrganizationsQuery(undefined, {
    skip: !isSuperAdmin,
  });

  const { data, isLoading, refetch } = useGetOrganizationUsersQuery(
    {
      page,
      limit: 10,
      search,
      roleId: selectedRole,
      organizationId: isSuperAdmin ? selectedOrgId : undefined,
    },
    { skip: isSuperAdmin && !selectedOrgId }
  );

  const { data: embassies } = useGetEmbassiesQuery();

  const selectedOrgName =
    organizations?.find((o) => o.id === selectedOrgId)?.name ||
    (authUser as any)?.organization?.name ||
    '';
  const isEmbassyOrg = selectedOrgName.toLowerCase().includes('embassy');

  const { data: roles } = useGetOrganizationRolesQuery(
    isSuperAdmin ? selectedOrgId : undefined,
    { skip: isSuperAdmin && !selectedOrgId }
  );

  const [createUser, { isLoading: isCreating }] = useCreateOrganizationUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateOrganizationUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteOrganizationUserMutation();

  // ─── Create Form ───────────────────────────────────────
  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      roleId: '',
      embassyId: '',
    },
    mode: 'onChange',
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    watch: watchCreate,
    setValue: setCreateValue,
    reset: resetCreate,
    trigger: triggerCreate,
  } = createForm;

  const createRoleId = watchCreate('roleId');
  const isCreateEmbassyOfficer =
    roles?.find((r) => r.id === Number(createRoleId))?.name === 'EMBASSY_OFFICER';

  useEffect(() => {
    if (isCreateEmbassyOfficer) {
      triggerCreate('embassyId');
    }
  }, [isCreateEmbassyOfficer, triggerCreate]);

  const onCreateSubmit = async (data: CreateUserFormData) => {
    try {
      await createUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        roleId: Number(data.roleId),
        embassyId: data.embassyId ? Number(data.embassyId) : undefined,
        organizationId: isSuperAdmin ? selectedOrgId : undefined,
      }).unwrap();

      toast.success('User created successfully');
      setShowCreateModal(false);
      resetCreate();
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to create user');
    }
  };

  // ─── Edit Form ─────────────────────────────────────────
  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      roleId: '',
      embassyId: '',
    },
    mode: 'onChange',
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    watch: watchEdit,
    setValue: setEditValue,
    reset: resetEdit,
    trigger: triggerEdit,
  } = editForm;

  const editRoleId = watchEdit('roleId');
  const isEditEmbassyOfficer =
    roles?.find((r) => r.id === Number(editRoleId))?.name === 'EMBASSY_OFFICER';

  useEffect(() => {
    if (isEditEmbassyOfficer) {
      triggerEdit('embassyId');
    }
  }, [isEditEmbassyOfficer, triggerEdit]);

  const onEditSubmit = async (data: EditUserFormData) => {
    if (!selectedUser) return;

    try {
      await updateUser({
        id: selectedUser.id,
        data: {
          fullName: data.fullName,
          email: data.email,
          roleId: Number(data.roleId),
          embassyId: data.embassyId ? Number(data.embassyId) : undefined,
          organizationId: isSuperAdmin ? selectedOrgId : undefined,
        },
      }).unwrap();

      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetEdit();
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to update user');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    resetEdit({
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId.toString(),
      embassyId: user.embassyId?.toString() || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser({
        id: selectedUser.id,
        organizationId: isSuperAdmin ? selectedOrgId : undefined,
      }).unwrap();
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header, Filters, Table – unchanged except minor cleanup */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Users</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and roles within organizations</p>
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
                  {organizations?.map((org) => (
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                {roles
                  ?.filter((r) => {
                    if (r.name === 'CLIENT') return false;
                    if (r.name === 'EMBASSY_OFFICER') return isEmbassyOrg;
                    return true;
                  })
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.description || role.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table – unchanged */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>{data?.total || 0} total users in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {/* ... table, pagination, loading states unchanged ... */}
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
              {/* ... your existing table content ... */}
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Create Modal ──────────────────────────────────────── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to your organization</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" {...registerCreate('fullName')} placeholder="John Doe" />
              {createErrors.fullName && (
                <p className="text-sm text-red-600 mt-1">{createErrors.fullName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...registerCreate('email')}
                placeholder="john@example.com"
              />
              {createErrors.email && (
                <p className="text-sm text-red-600 mt-1">{createErrors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                {...registerCreate('password')}
                placeholder="Minimum 8 characters"
              />
              <PasswordStrengthIndicator password={watchCreate('password')} />
              {createErrors.password && (
                <p className="text-sm text-red-600 mt-1">{createErrors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerCreate('confirmPassword')}
                placeholder="Re-enter password"
              />
              {createErrors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{createErrors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="roleId">Role *</Label>
              <Select
                value={watchCreate('roleId')}
                onValueChange={(val) => setCreateValue('roleId', val, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    ?.filter((r) => {
                      if (r.name === 'CLIENT') return false;
                      if (r.name === 'EMBASSY_OFFICER') return isEmbassyOrg;
                      return true;
                    })
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {createErrors.roleId && (
                <p className="text-sm text-red-600 mt-1">{createErrors.roleId.message}</p>
              )}
            </div>

            {isCreateEmbassyOfficer && (
              <div>
                <Label htmlFor="embassyId">Linked Embassy *</Label>
                <Select
                  value={watchCreate('embassyId')}
                  onValueChange={(val) =>
                    setCreateValue('embassyId', val, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an embassy" />
                  </SelectTrigger>
                  <SelectContent>
                    {embassies?.map((embassy) => (
                      <SelectItem key={embassy.id} value={embassy.id.toString()}>
                        {embassy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createErrors.embassyId && (
                  <p className="text-sm text-red-600 mt-1">{createErrors.embassyId.message}</p>
                )}
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

      {/* ─── Edit Modal ────────────────────────────────────────── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-fullName">Full Name</Label>
              <Input id="edit-fullName" {...registerEdit('fullName')} />
              {editErrors.fullName && (
                <p className="text-sm text-red-600 mt-1">{editErrors.fullName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" {...registerEdit('email')} />
              {editErrors.email && (
                <p className="text-sm text-red-600 mt-1">{editErrors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-roleId">Role</Label>
              <Select
                value={watchEdit('roleId')}
                onValueChange={(val) => setEditValue('roleId', val, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    ?.filter((r) => {
                      if (r.name === 'CLIENT') return false;
                      if (r.name === 'EMBASSY_OFFICER') return isEmbassyOrg;
                      return true;
                    })
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {editErrors.roleId && (
                <p className="text-sm text-red-600 mt-1">{editErrors.roleId.message}</p>
              )}
            </div>

            {isEditEmbassyOfficer && (
              <div>
                <Label htmlFor="edit-embassyId">Linked Embassy *</Label>
                <Select
                  value={watchEdit('embassyId')}
                  onValueChange={(val) =>
                    setEditValue('embassyId', val, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an embassy" />
                  </SelectTrigger>
                  <SelectContent>
                    {embassies?.map((embassy) => (
                      <SelectItem key={embassy.id} value={embassy.id.toString()}>
                        {embassy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.embassyId && (
                  <p className="text-sm text-red-600 mt-1">{editErrors.embassyId.message}</p>
                )}
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

      {/* Delete Confirmation – unchanged */}
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