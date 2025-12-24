import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, MoreHorizontal, Building2, UserPlus, FileDown, Shield, Trash2, Edit, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { OrganizationUserPermissionsModal } from '@/components/modals/OrganizationUserPermissionsModal';

// Mock Data
interface Organization {
    id: string;
    name: string;
    type: 'Media' | 'Embassy' | 'NGO' | 'IO' | 'Gov';
    logo: string;
    status: 'Active' | 'Suspended' | 'Pending';
    registrationDate: string;
    lastUpdated: string;
    users: OrgUser[];
}

interface OrgUser {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Approver' | 'Editor' | 'Viewer';
}

const MOCK_ORGS: Organization[] = [
    {
        id: '1',
        name: 'African Union Commission',
        type: 'Gov',
        logo: 'https://au.int/sites/default/files/au_logo.png', // Placeholder
        status: 'Active',
        registrationDate: '2024-01-01',
        lastUpdated: '2024-12-20T10:00:00Z',
        users: [
            { id: 'u1', name: 'Dr. John Doe', email: 'john@au.int', role: 'Admin' },
            { id: 'u2', name: 'Jane Smith', email: 'jane@au.int', role: 'Approver' },
        ]
    },
    {
        id: '2',
        name: 'CNN International',
        type: 'Media',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/CNN_International_logo.svg/1200px-CNN_International_logo.svg.png',
        status: 'Active',
        registrationDate: '2024-02-15',
        lastUpdated: '2024-11-05T14:30:00Z',
        users: [
            { id: 'u3', name: 'Anderson Cooper', email: 'anderson@cnn.com', role: 'Editor' },
        ]
    },
    {
        id: '3',
        name: 'Doctors Without Borders',
        type: 'NGO',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Doctors_Without_Borders_Logo.svg/1200px-Doctors_Without_Borders_Logo.svg.png',
        status: 'Pending',
        registrationDate: '2024-12-22',
        lastUpdated: '2024-12-22T09:15:00Z',
        users: []
    }
];

export function OrganizationManagement() {
    const [orgs, setOrgs] = useState<Organization[]>(MOCK_ORGS);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Permissions Modal State
    const [permModalOpen, setPermModalOpen] = useState(false);
    const [selectedUserForPerms, setSelectedUserForPerms] = useState<OrgUser | null>(null);

    // Add User State
    const [addUserModalOpen, setAddUserModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('details');

    const filteredOrgs = orgs.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOrgSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Organization saved successfully");
        setIsDialogOpen(false);
    };

    const toggleStatus = (id: string) => {
        setOrgs(orgs.map(org => {
            if (org.id === id) {
                const newStatus = org.status === 'Active' ? 'Suspended' : 'Active';
                return { ...org, status: newStatus };
            }
            return org;
        }));
        toast.success("Organization status updated");
    };

    const handleManagePermissions = (user: OrgUser) => {
        setSelectedUserForPerms(user);
        setPermModalOpen(true);
    };

    const handleAddUserInit = () => {
        // Just verify we have an org selected
        if (!selectedOrg) return;
        setAddUserModalOpen(true);
    };

    const handleAddUserDirectly = (org: Organization) => {
        setSelectedOrg(org);
        setAddUserModalOpen(true);
    };

    const handleEditDetails = (org: Organization) => {
        setSelectedOrg(org);
        setActiveTab('details');
        setIsDialogOpen(true);
    };

    const handleAddUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Invitation sent to user for ${selectedOrg?.name}`);
        setAddUserModalOpen(false);
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
                    <p className="text-muted-foreground">Manage registered entities.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <FileDown className="h-4 w-4" /> Export Report
                    </Button>
                    <Button onClick={() => { setSelectedOrg(null); setActiveTab('details'); setIsDialogOpen(true); }} className="gap-2">
                        <Plus className="h-4 w-4" /> Add Organization
                    </Button>
                </div>
            </div>

            {/* Organizations List */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle>Registered Organizations</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search organizations..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Logo</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrgs.map((org) => (
                                    <TableRow key={org.id}>
                                        <TableCell>
                                            <div className="h-10 w-10 rounded bg-gray-50 border flex items-center justify-center overflow-hidden">
                                                <img src={org.logo} alt={org.name} className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.src = 'https://placehold.co/40x40?text=Org')} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{org.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{org.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                org.status === 'Active' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
                                                    org.status === 'Suspended' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-500'
                                            }>
                                                {org.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex -space-x-2">
                                                {org.users.slice(0, 3).map((u, i) => (
                                                    <div key={i} className="h-8 w-8 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-xs font-bold text-primary" title={u.name}>
                                                        {u.name.charAt(0)}
                                                    </div>
                                                ))}
                                                {org.users.length > 3 && (
                                                    <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
                                                        +{org.users.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {org.registrationDate}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditDetails(org)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleAddUserDirectly(org)}>
                                                        <UserPlus className="mr-2 h-4 w-4" /> Add User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600" onClick={() => toggleStatus(org.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {org.status === 'Active' ? 'Suspend' : 'Activate'}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Edit/Create Organization Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6">
                    <DialogHeader>
                        <DialogTitle>{selectedOrg ? 'Edit Organization' : 'Register New Organization'}</DialogTitle>
                        <DialogDescription>Enter organization details and assign initial administrators.</DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col p-1">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Organization Details</TabsTrigger>
                            <TabsTrigger value="users" disabled={!selectedOrg}>User Association</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto min-h-0 py-4">
                            <TabsContent value="details" className="space-y-4 m-0 h-full">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Organization Name</Label>
                                        <Input placeholder="e.g. BBC Africa" defaultValue={selectedOrg?.name} />
                                    </div>
                                    {/* Removed 'Type' field as requested */}
                                </div>

                                <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50/50">
                                    <div className="h-20 w-20 rounded-lg bg-white border flex items-center justify-center overflow-hidden">
                                        {selectedOrg?.logo ? (
                                            <img src={selectedOrg.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <Building2 className="h-8 w-8 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <Label>Brand Logo</Label>
                                        <Input type="file" accept="image/*" />
                                        <p className="text-xs text-muted-foreground">Recommended: 500x500px PNG/JPG. Max 2MB.</p>
                                    </div>
                                </div>

                                {selectedOrg && (
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Organization Status</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Current: <Badge variant={selectedOrg.status === 'Active' ? 'default' : 'destructive'}>{selectedOrg.status}</Badge>
                                            </p>
                                        </div>
                                        <Button variant="outline" onClick={() => toggleStatus(selectedOrg.id)}>
                                            {selectedOrg.status === 'Active' ? 'Suspend Organization' : 'Activate Organization'}
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="users" className="m-0 h-full">
                                <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg border">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Associated Users</h3>
                                        <p className="text-xs text-muted-foreground">Manage users who have access to this organization.</p>
                                    </div>
                                    <Button size="sm" onClick={handleAddUserInit} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                        <UserPlus className="h-3 w-3" /> Add New User
                                    </Button>
                                </div>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User Identification</TableHead>
                                                <TableHead>Assigned Role</TableHead>
                                                <TableHead className="text-right">Access Controls</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedOrg?.users.map(user => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">
                                                        <div>{user.name}</div>
                                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select defaultValue={user.role}>
                                                            <SelectTrigger className="h-8 w-[140px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Admin">Admin</SelectItem>
                                                                <SelectItem value="Approver">Approver</SelectItem>
                                                                <SelectItem value="Editor">Editor</SelectItem>
                                                                <SelectItem value="Viewer">Viewer</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 gap-2 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                                                                onClick={() => handleManagePermissions(user)}
                                                            >
                                                                <Shield className="h-3.5 w-3.5" /> Manage Permissions
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {selectedOrg?.users.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <AlertCircle className="h-8 w-8 text-gray-300" />
                                                            <p>No users associated with this organization yet.</p>
                                                            <Button variant="link" onClick={handleAddUserInit}>Add your first user</Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <DialogFooter className="mt-4 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleOrgSubmit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manage Permissions Modal */}
            <OrganizationUserPermissionsModal
                open={permModalOpen}
                onOpenChange={setPermModalOpen}
                user={selectedUserForPerms}
                orgName={selectedOrg?.name || ''}
            />

            {/* Add User Modal (Simple version) */}
            <Dialog open={addUserModalOpen} onOpenChange={setAddUserModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add User to {selectedOrg?.name}</DialogTitle>
                        <DialogDescription>Invite a user to join this organization. They will receive an email.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddUserSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input type="email" placeholder="colleague@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Initial Role</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="Approver">Approver</SelectItem>
                                    <SelectItem value="Editor">Editor</SelectItem>
                                    <SelectItem value="Viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setAddUserModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Send Invitation</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
