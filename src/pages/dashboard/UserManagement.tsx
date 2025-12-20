import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserPlus, Pencil, Trash2, Download, Search } from 'lucide-react';
import { CreateUserModal } from '@/components/modals/CreateUserModal';
import { EditUserModal } from '@/components/modals/EditUserModal';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import { useAuth, UserRole } from '@/auth/context';

interface SystemUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
    lastLogin?: string;
}

// Mock data - replace with actual API calls
const MOCK_USERS: SystemUser[] = [
    { id: '1', name: 'Officer Sara Kamil', email: 'sara@ema.gov.et', role: UserRole.EMA_OFFICER, createdAt: '2024-01-15', lastLogin: '2024-12-18' },
    { id: '2', name: 'Admin John Doe', email: 'john@admin.gov.et', role: UserRole.SUPER_ADMIN, createdAt: '2024-01-10', lastLogin: '2024-12-17' },
    { id: '3', name: 'ICS Officer Ahmed', email: 'ahmed@ics.gov.et', role: UserRole.ICS_OFFICER, createdAt: '2024-02-01', lastLogin: '2024-12-16' },
    { id: '4', name: 'NISS Officer Marta', email: 'marta@niss.gov.et', role: UserRole.NISS_OFFICER, createdAt: '2024-02-05', lastLogin: '2024-12-18' },
];

export function UserManagement() {
    const { user } = useAuth();
    const [users, setUsers] = useState<SystemUser[]>(MOCK_USERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

    const isReadOnly = user?.role === UserRole.NISS_OFFICER;

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateUser = (userData: { name: string; email: string; password: string; role: UserRole }) => {
        const newUser: SystemUser = {
            id: `${users.length + 1}`,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            createdAt: new Date().toISOString().split('T')[0],
        };
        setUsers([...users, newUser]);
    };

    const handleEditUser = (userId: string, userData: { name: string; email: string; role: UserRole }) => {
        setUsers(users.map(u => u.id === userId ? { ...u, ...userData } : u));
    };

    const handleDeleteUser = (userId: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            setUsers(users.filter(u => u.id !== userId));
        }
    };

    const handleExportCSV = () => {
        const data = filteredUsers.map(u => ({
            'Name': u.name,
            'Email': u.email,
            'Role': u.role,
            'Created': u.createdAt,
            'Last Login': u.lastLogin || 'Never',
        }));
        exportToCSV(data, 'system_users.csv');
    };

    const handleExportPDF = () => {
        const columns = [
            { header: 'Name', key: 'name' },
            { header: 'Email', key: 'email' },
            { header: 'Role', key: 'role' },
            { header: 'Created', key: 'createdAt' },
            { header: 'Last Login', key: 'lastLogin' },
        ];
        const data = filteredUsers.map(u => ({
            ...u,
            lastLogin: u.lastLogin || 'Never'
        }));
        exportToPDF(data, columns, 'system_users.pdf', 'System Users');
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case UserRole.SUPER_ADMIN:
                return 'bg-purple-100 text-purple-700';
            case UserRole.NISS_OFFICER:
                return 'bg-blue-100 text-blue-700';
            case UserRole.ICS_OFFICER:
                return 'bg-green-100 text-green-700';
            case UserRole.EMA_OFFICER:
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">User Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage system users and their roles</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export PDF
                    </Button>
                    {!isReadOnly && (
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-[#009b4d] hover:bg-[#007a3d] gap-2"
                        >
                            <UserPlus className="h-4 w-4" />
                            Create User
                        </Button>
                    )}
                </div>
            </div>

            {/* Search and Filters */}
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

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>System Users ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Name</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Email</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Role</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Created</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Last Login</th>
                                    {!isReadOnly && (
                                        <th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{u.name}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{u.createdAt}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{u.lastLogin || 'Never'}</td>
                                        {!isReadOnly && (
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            setEditModalOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
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
                                        <td colSpan={isReadOnly ? 5 : 6} className="py-12 text-center text-gray-400">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
            <CreateUserModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onConfirm={handleCreateUser}
            />
            {selectedUser && (
                <EditUserModal
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    user={selectedUser}
                    onConfirm={(userData) => handleEditUser(selectedUser.id, userData)}
                />
            )}
        </div>
    );
}
