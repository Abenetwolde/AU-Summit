import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Users,
    UserPlus,
    Trash2,
    Download,
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import { CreateUserModal } from '@/components/modals/CreateUserModal';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function UserManagement() {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Reset page when tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setCurrentPage(1);
    };

    // API Hooks
    const roleId = activeTab === 'all' ? undefined : Number(activeTab);

    const {
        data: usersData,
        isLoading: isLoadingUsers,
        isFetching: isFetchingUsers,
        refetch: refetchUsers
    } = useGetUsersQuery({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        roleId: roleId,
        status: 'ACTIVE' // Default to active users, can add filter later if needed
    });

    const { data: rolesResponse, isLoading: isLoadingRoles } = useGetRolesQuery();
    const roles: Role[] = Array.isArray(rolesResponse) ? rolesResponse : (rolesResponse as any)?.roles || [];

    const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
    const [updateUser] = useUpdateUserMutation();

    const isReadOnly = user?.role === UserRole.NISS_OFFICER;

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
            refetchUsers(); // Refresh the list
        } catch (error) {
            toast.error("Failed to create user");
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (confirm('Are you sure you want to deactivate this user?')) {
            try {
                await updateUser({ id: userId, data: { status: 'INACTIVE' } }).unwrap();
                toast.success("User deactivated");
                refetchUsers();
            } catch (err) {
                toast.error("Failed to deactivate user");
            }
        }
    };

    const handleExportCSV = () => {
        if (!usersData?.users) return;
        const data = usersData.users.map(u => ({
            'Name': u.fullName,
            'Email': u.email,
            'Role': u.roleName || u.role?.name,
            'Embassy': u.embassy?.name || '-',
            'Status': u.status,
            'Created': new Date(u.createdAt).toLocaleDateString(),
        }));
        exportToCSV(data, 'system_users.csv');
    };

    const handleExportPDF = () => {
        if (!usersData?.users) return;
        const columns = [
            { header: 'Name', key: 'fullName' },
            { header: 'Email', key: 'email' },
            { header: 'Role', key: 'roleName' },
            { header: 'Embassy', key: 'embassyName' },
            { header: 'Status', key: 'status' },
        ];
        const rows = usersData.users.map(u => ({
            ...u,
            roleName: u.roleName || u.role?.name,
            embassyName: u.embassy?.name || '-'
        }));
        exportToPDF(rows, columns, 'system_users.pdf', 'System Users');
    };

    const getRoleBadgeColor = (roleName?: string) => {
        if (!roleName) return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
        const r = roleName.toUpperCase();
        if (r.includes('ADMIN')) return 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200';
        if (r.includes('NISS')) return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200';
        if (r.includes('ICS')) return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200';
        if (r.includes('EMA')) return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200';
        if (r.includes('EMBASSY')) return 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200';
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    };

    const totalPages = usersData?.totalPages || 1;
    const totalUsers = usersData?.total || 0;

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 font-sans">User Management</h2>
                    <p className="text-muted-foreground mt-1">Manage, filter and organize system users across all roles.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleExportCSV} className="gap-2 h-10 border-gray-200 hover:bg-gray-50">
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" onClick={handleExportPDF} className="gap-2 h-10 border-gray-200 hover:bg-gray-50">
                        <Download className="h-4 w-4" /> Export PDF
                    </Button>
                    {!isReadOnly && (
                        <Button onClick={() => setCreateModalOpen(true)} className="bg-[#009b4d] hover:bg-[#007a3d] gap-2 h-10 shadow-sm transition-all active:scale-95">
                            <UserPlus className="h-4 w-4" /> Create User
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter and Search Bar */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                        <div className="relative flex-1 max-w-lg">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 border-gray-200 transition-all focus:ring-2 focus:ring-[#009b4d]/20 focus:border-[#009b4d]"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Role Filter</span>
                            <Select value={activeTab} onValueChange={handleTabChange}>
                                <SelectTrigger className="w-full sm:w-[240px] h-11 border-gray-200 bg-white shadow-sm focus:ring-[#009b4d]/20 focus:border-[#009b4d] font-semibold text-gray-700 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-[#009b4d]" />
                                        <SelectValue placeholder="All Roles" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="border-gray-100 shadow-xl rounded-xl">
                                    <SelectItem value="all" className="py-2.5 cursor-pointer focus:bg-gray-50">
                                        <span className="font-medium">All Roles</span>
                                    </SelectItem>
                                    {roles.filter(r => r.name !== 'CLIENT').map((role) => (
                                        <SelectItem key={role.id} value={String(role.id)} className="py-2.5 cursor-pointer focus:bg-gray-50">
                                            {role.description || role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table Card */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardHeader className="subtle-border-b px-6 py-4 flex flex-row items-center justify-between bg-gray-50/50">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {isFetchingUsers ? <Loader2 className="h-4 w-4 animate-spin text-[#009b4d]" /> : <div className="h-2 w-2 rounded-full bg-[#009b4d]" />}
                        System Users
                        <span className="text-sm font-normal text-muted-foreground ml-1">({totalUsers} total)</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">Rows per page:</p>
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                            <SelectTrigger className="w-[70px] h-8 border-gray-200">
                                <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/30 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-100">
                                    <th className="text-left py-4 px-6 tracking-wider">User Details</th>
                                    <th className="text-left py-4 px-6 tracking-wider">Role & Affiliation</th>
                                    <th className="text-left py-4 px-6 tracking-wider">Status</th>
                                    {!isReadOnly && <th className="text-right py-4 px-6 tracking-wider">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoadingUsers ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin h-10 w-10 text-[#009b4d]" />
                                                <p className="text-sm text-gray-500 font-medium">Fetching secure data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : usersData?.users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <Search className="h-12 w-12 opacity-20" />
                                                <p className="text-lg font-semibold mt-2">No users found</p>
                                                <p className="text-sm">Try adjusting your search or filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : usersData?.users.map((u) => (
                                    <tr key={u.id} className="group hover:bg-gray-50/80 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200 group-hover:bg-white transition-colors">
                                                    {u.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-bold text-gray-900 leading-tight">{u.fullName}</span>
                                                    <span className="text-sm text-gray-500">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <Badge variant="outline" className={`font-semibold border-transparent ${getRoleBadgeColor(u.roleName || u.role?.name)}`}>
                                                    {u.roleName || u.role?.name || 'User'}
                                                </Badge>
                                                {u.embassy && (
                                                    <span className="text-[13px] text-gray-600 flex items-center gap-1.5">
                                                        <span className="h-1 w-1 rounded-full bg-gray-400" />
                                                        {u.embassy.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${u.status === 'ACTIVE'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-rose-50 text-rose-700 border-rose-100'
                                                }`}>
                                                <span className={`h-2 w-2 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                {u.status}
                                            </span>
                                        </td>
                                        {!isReadOnly && (
                                            <td className="py-4 px-6 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="h-9 w-9 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 group-hover:shadow-sm"
                                                    title="Deactivate User"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>

                {/* Pagination Controls */}
                {totalUsers > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <div className="hidden sm:block">
                            <p className="text-sm text-gray-500 italic">
                                Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, totalUsers)}</span> of <span className="font-semibold text-gray-900">{totalUsers}</span> users
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1 || isFetchingUsers}
                                className="h-9 w-9 p-0 border-gray-200 bg-white"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || isFetchingUsers}
                                className="h-9 w-9 p-0 border-gray-200 bg-white"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-1 px-2">
                                <span className="text-sm font-bold text-[#009b4d]">{currentPage}</span>
                                <span className="text-xs text-muted-foreground font-medium">/</span>
                                <span className="text-sm font-medium text-gray-600">{totalPages}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || isFetchingUsers}
                                className="h-9 w-9 p-0 border-gray-200 bg-white"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages || isFetchingUsers}
                                className="h-9 w-9 p-0 border-gray-200 bg-white"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <CreateUserModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onConfirm={handleCreateUser}
                roles={roles.filter(r => {
                    if (r.name === 'EMBASSY_OFFICER') return user?.role === UserRole.SUPER_ADMIN;
                    return true;
                })}
                isLoading={isCreating}
            />
        </div>
    );
}
