import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserPlus, Pencil, Trash2, Download, Search, Loader2 } from 'lucide-react';
import { CreateUserModal } from '@/components/modals/CreateUserModal';
// import { EditUserModal } from '@/components/modals/EditUserModal'; // We might need to update this too if it relies on old types
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import { useAuth, UserRole } from '@/auth/context';
import { toast } from 'sonner';
import {
    useGetUsersQuery,
    useGetRolesQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    User,
    Role
} from '@/store/services/api';

// Create a local EditUserModal placeholder if the existing one is incompatible, 
// or for now just reuse CreateUserModal logic or implement inline edit.
// For expediency, we will assume EditUserModal needs update too, but let's focus on the List/Create first which is critical.
// Actually, let's keep it simple and just do Create/List first.

export function UserManagement() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // API Hooks
    const { data: users = [], isLoading: isLoadingUsers } = useGetUsersQuery();
    const { data: roles = [], isLoading: isLoadingRoles } = useGetRolesQuery();
    const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
    const [updateUser] = useUpdateUserMutation();

    const isReadOnly = user?.role === UserRole.NISS_OFFICER;

    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.roleName && u.roleName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleCreateUser = async (userData: { fullName: string; email: string; password: string; roleId: string; embassyId?: string }) => {
        try {
            await createUser({
                fullName: userData.fullName,
                email: userData.email,
                password: userData.password,
                roleId: Number(userData.roleId),
                embassyId: userData.embassyId ? Number(userData.embassyId) : undefined,
                status: 'ACTIVE'
            }).unwrap();
            toast.success("User created successfully");
            setCreateModalOpen(false);
        } catch (error) {
            toast.error("Failed to create user");
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (confirm('Are you sure you want to delete this user? (Action: Deactivate)')) {
            try {
                await updateUser({ id: userId, data: { status: 'INACTIVE' } }).unwrap();
                toast.success("User deactivated");
            } catch (err) {
                toast.error("Failed to deactivate user");
            }
        }
    };

    const handleExportCSV = () => {
        const data = filteredUsers.map(u => ({
            'Name': u.fullName,
            'Email': u.email,
            'Role': u.roleName,
            'Status': u.status,
            'Created': u.createdAt,
        }));
        exportToCSV(data, 'system_users.csv');
    };

    const handleExportPDF = () => {
        const columns = [
            { header: 'Name', key: 'fullName' },
            { header: 'Email', key: 'email' },
            { header: 'Role', key: 'roleName' },
            { header: 'Status', key: 'status' },
            { header: 'Created', key: 'createdAt' },
        ];
        exportToPDF(filteredUsers, columns, 'system_users.pdf', 'System Users');
    };

    const getRoleBadgeColor = (roleName?: string) => {
        if (!roleName) return 'bg-gray-100 text-gray-700';
        const r = roleName.toUpperCase();
        if (r.includes('ADMIN')) return 'bg-purple-100 text-purple-700';
        if (r.includes('NISS')) return 'bg-blue-100 text-blue-700';
        if (r.includes('ICS')) return 'bg-green-100 text-green-700';
        if (r.includes('EMA')) return 'bg-orange-100 text-orange-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">User Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage system users and their roles</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                        <Download className="h-4 w-4" /> Export PDF
                    </Button>
                    {!isReadOnly && (
                        <Button onClick={() => setCreateModalOpen(true)} className="bg-[#009b4d] hover:bg-[#007a3d] gap-2">
                            <UserPlus className="h-4 w-4" /> Create User
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>System Users ({isLoadingUsers ? '...' : filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingUsers ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Name</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Email</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Role</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Embassy</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Status</th>
                                        {!isReadOnly && <th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{u.fullName}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(u.roleName)}`}>
                                                    {u.roleName || u.role?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {u.embassy?.name || '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`text-xs px-2 py-1 rounded-full ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            {!isReadOnly && (
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-gray-400">
                                                No users found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateUserModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onConfirm={handleCreateUser}
                roles={roles} // Pass all roles for global user management
                isLoading={isCreating}
            />
        </div>
    );
}
