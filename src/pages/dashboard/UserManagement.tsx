import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserPlus, Trash2, Download, Search, Loader2, RefreshCw } from 'lucide-react';
import { CreateUserModal } from '@/components/modals/CreateUserModal';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import { useAuth, UserRole } from '@/auth/context';
import { toast } from 'sonner';
import {
    useGetUsersQuery,
    useGetRolesQuery,
    useCreateUserMutation,
    useUpdateUserMutation
} from '@/store/services/api';

export function UserManagement() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // API Hooks
    const { data: users = [], isLoading: isLoadingUsers, refetch } = useGetUsersQuery();
    const { data: roles = [], isLoading: isLoadingRoles } = useGetRolesQuery();
    const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
    const [updateUser] = useUpdateUserMutation();

    const isReadOnly = user?.role === UserRole.NISS_OFFICER;

    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.roleName && u.roleName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleCreateUser = async (userData: { fullName: string; email: string; password: string; roleId: string }) => {
        try {
            await createUser({
                fullName: userData.fullName,
                email: userData.email,
                password: userData.password,
                roleId: Number(userData.roleId),
                status: 'ACTIVE'
            }).unwrap();
            toast.success("User created successfully");
            setCreateModalOpen(false);
            refetch();
        } catch (error) {
            toast.error("Failed to create user");
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (confirm('Are you sure you want to delete this user? (Action: Deactivate)')) {
            try {
                await updateUser({ id: userId, data: { status: 'INACTIVE' } }).unwrap();
                toast.success("User deactivated");
                refetch();
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

    const getStatusColor = (status: string) => {
        return status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    };

    const getStatusDot = (status: string) => {
        return status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500';
    };

    if (isLoadingUsers && users.length === 0) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold font-sans text-gray-900">User Management</h2>
                    <p className="text-muted-foreground font-bold text-sm md:text-base">System Users: <span className="text-gray-900">{users.length}</span></p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearchQuery('');
                            refetch();
                        }}
                        className="flex-1 md:flex-none gap-2 text-xs md:text-sm h-11 px-4"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        className="flex-1 md:flex-none gap-2 text-xs md:text-sm h-11 px-4"
                    >
                        <Download className="h-4 w-4" />
                        CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        className="flex-1 md:flex-none gap-2 text-xs md:text-sm h-11 px-4"
                    >
                        <Download className="h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* Search Filter Section */}
            <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or role..."
                                className="w-full pl-10 h-11 rounded-md border border-gray-200 bg-gray-50 text-sm focus:outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {!isReadOnly && (
                            <Button
                                onClick={() => setCreateModalOpen(true)}
                                className="w-fit bg-[#009b4d] hover:bg-[#007a3d] gap-2 h-11 px-6 font-bold self-start md:self-auto"
                            >
                                <UserPlus className="h-4 w-4" />
                                <span className="hidden sm:inline">Create User</span>
                                <span className="sm:hidden">Create</span>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50">
                            <tr className="border-b transition-colors hover:bg-muted/50">
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">No</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">FULL NAME</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">EMAIL ADDRESS</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">ROLE</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">STATUS</th>
                                {!isReadOnly && <th className="h-12 px-4 text-right align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">ACTIONS</th>}
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredUsers.map((u, index) => (
                                <tr key={u.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle text-gray-500">{index + 1}</td>
                                    <td className="p-4 align-middle">
                                        <div className="font-bold text-gray-900">{u.fullName}</div>
                                    </td>
                                    <td className="p-4 align-middle font-medium text-gray-600">{u.email}</td>
                                    <td className="p-4 align-middle focus-within:">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getRoleBadgeColor(u.roleName)}`}>
                                            {u.roleName || u.role?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(u.status)}`}>
                                            <span className={`h-2 w-2 rounded-full ${getStatusDot(u.status)}`} />
                                            {u.status}
                                        </span>
                                    </td>
                                    {!isReadOnly && (
                                        <td className="p-4 align-middle text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-muted-foreground italic">
                                        No users found mapping your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <CreateUserModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onConfirm={handleCreateUser}
                roles={roles}
                isLoading={isCreating}
            />
        </div>
    );
}
