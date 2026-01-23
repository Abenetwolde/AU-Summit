import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MoreHorizontal, Shield, UserX, UserPlus, Mail, Users, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrganizationUserPermissionsModal } from "./OrganizationUserPermissionsModal";
import { CreateUserModal } from "./CreateUserModal";
import { toast } from "sonner";
import {
    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useGetRolesQuery,
    User,
    Role
} from "@/store/services/api";

interface OrganizationUsersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organization: {
        id: string;
        name: string;
    } | null;
}

export function OrganizationUsersModal({ open, onOpenChange, organization }: OrganizationUsersModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

    // API
    const { data: allUsers = [], isLoading: isLoadingUsers } = useGetUsersQuery();
    const { data: rolesData } = useGetRolesQuery();
    const allRoles = rolesData?.roles || [];
    const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
    const [updateUser] = useUpdateUserMutation();

    if (!organization) return null;

    // Filter Users for this Organization
    const usersList = Array.isArray(allUsers) ? allUsers : (allUsers as any)?.users || [];
    const orgUsers = usersList.filter((u: any) => {
        // Check if user's role belongs to this organization
        // The API returns role object nested in user
        return u.role?.organizationId === Number(organization.id) ||
            (u.role?.organization && u.role.organization.id === Number(organization.id));
    });

    // Filter Roles for this Organization to create new users
    // Include roles specific to this org, OR global roles (null orgId)
    const orgRoles = allRoles.filter(r => {
        // EMBASSY_OFFICER is special - only for Embassy organization
        if (r.name === 'EMBASSY_OFFICER') {
            return organization.name.toLowerCase().includes('embassy');
        }
        return r.organizationId == Number(organization.id) || !r.organizationId;
    });

    const filteredUsers = orgUsers.filter((u: User) =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleManagePermissions = (user: User) => {
        setSelectedUser(user);
        setIsPermissionsOpen(true);
    };

    const handleRemoveUser = async (userId: number) => {
        try {
            await updateUser({ id: userId, data: { status: 'INACTIVE' } }).unwrap();
            toast.success("User deactivated successfully");
        } catch (error) {
            toast.error("Failed to deactivate user");
        }
    };

    const handleCreateUser = async (userData: { fullName: string; email: string; password: string; roleId: string; embassyId?: string }) => {
        try {
            await createUser({
                fullName: userData.fullName,
                email: userData.email,
                password: userData.password,
                roleId: Number(userData.roleId),
                embassyId: userData.embassyId ? Number(userData.embassyId) : undefined,
                organizationId: Number(organization.id),
                status: 'ACTIVE'
            }).unwrap();
            toast.success("User created successfully");
            setIsCreateUserOpen(false);
        } catch (error) {
            toast.error("Failed to create user");
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <span>Manage Users - {organization.name}</span>
                        </DialogTitle>
                        <DialogDescription>
                            Add, remove, and manage permissions for users in this organization.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between gap-4 py-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => setIsCreateUserOpen(true)} className="gap-2">
                            <UserPlus className="h-4 w-4" /> Add User
                        </Button>
                    </div>

                    {/* Users List */}
                    <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                        {isLoadingUsers ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-gray-400" /></div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredUsers.map((user: User) => (
                                        <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user.fullName}&background=random`} />
                                                        <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{user.fullName}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="bg-white font-normal">
                                                    {user.role?.name || user.roleName || 'N/A'}
                                                </Badge>
                                                {user.embassy && (
                                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                                        {user.embassy.name}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleManagePermissions(user)}>
                                                            <Shield className="h-4 w-4 mr-2" /> Permissions
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveUser(user.id)}>
                                                            <UserX className="h-4 w-4 mr-2" /> Deactivate
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!isLoadingUsers && filteredUsers.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No users found matching your search or organization.
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permissions Modal - Nested */}
            {selectedUser && (
                <OrganizationUserPermissionsModal
                    open={isPermissionsOpen}
                    onOpenChange={setIsPermissionsOpen}
                    user={{ name: selectedUser.fullName, email: selectedUser.email, role: selectedUser.roleName || selectedUser.role?.name || 'User' }}
                    orgName={organization.name}
                />
            )}

            {/* Create User Modal */}
            <CreateUserModal
                open={isCreateUserOpen}
                onOpenChange={setIsCreateUserOpen}
                onConfirm={handleCreateUser}
                organizationId={Number(organization.id)}
                isLoading={isCreating}
            />
        </>
    );
}
