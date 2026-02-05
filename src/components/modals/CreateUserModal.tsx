import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth, UserRole } from '@/auth/context';
import { Role, useGetRolesQuery, useGetEmbassiesQuery } from '@/store/services/api';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { PasswordStrengthIndicator } from '../ui/PasswordStrengthIndicator';
import { useEffect } from 'react';

interface CreateUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (userData: { fullName: string; email: string; password: string; roleId: string; embassyId?: string }) => void;
    organizationId?: number;
    isLoading?: boolean;
}

export function CreateUserModal({ open, onOpenChange, onConfirm, organizationId, isLoading }: CreateUserModalProps) {
    const { user: currentUser } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [embassyId, setEmbassyId] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Role Pagination & Search
    const [roleSearch, setRoleSearch] = useState('');
    const debouncedRoleSearch = useDebounce(roleSearch, 500);
    const [rolePage, setRolePage] = useState(1);
    const [aggregatedRoles, setAggregatedRoles] = useState<Role[]>([]);

    const { data: rolesData, isLoading: isLoadingRoles, isFetching: isFetchingRoles } = useGetRolesQuery({
        page: rolePage,
        limit: 30,
        search: debouncedRoleSearch,
        organizationId: organizationId
    });

    useEffect(() => {
        if (debouncedRoleSearch !== undefined || rolePage === 1) {
            setRolePage(1);
            setAggregatedRoles([]);
        }
    }, [debouncedRoleSearch]);

    useEffect(() => {
        if (rolesData?.roles) {
            if (rolePage === 1) {
                setAggregatedRoles(rolesData.roles);
            } else {
                setAggregatedRoles(prev => {
                    const existingIds = new Set(prev.map(r => r.id));
                    const newRoles = rolesData.roles.filter(r => !existingIds.has(r.id));
                    return [...prev, ...newRoles];
                });
            }
        }
    }, [rolesData, rolePage]);

    const roles = aggregatedRoles.filter(r => {
        // Apply existing filters
        if (r.name === 'CLIENT') return false;
        if (r.name === 'EMBASSY_OFFICER' && currentUser?.role !== UserRole.SUPER_ADMIN) {
            // If we are in user management, only Super Admin can create Embassy Officers
            // If we are in OrganizationUsersModal, it might depend on the org type
            // But let's keep it simple for now as per previous logic
            return false;
        }
        return true;
    });

    const hasMoreRoles = rolesData ? rolePage < rolesData.totalPages : false;

    const { data: embassies = [] } = useGetEmbassiesQuery();

    const selectedRole = aggregatedRoles.find(r => String(r.id) === roleId);
    const isEmbassyOfficer = selectedRole?.name === 'EMBASSY_OFFICER';

    const validate = () => {
        const newErrors: { [key: string]: string } = {};

        if (!name.trim()) newErrors.name = 'Name is required';
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        else if (!/[A-Z]/.test(password)) newErrors.password = 'Password must contain at least one uppercase letter';
        else if (!/[a-z]/.test(password)) newErrors.password = 'Password must contain at least one lowercase letter';
        else if (!/[0-9]/.test(password)) newErrors.password = 'Password must contain at least one number';
        else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) newErrors.password = 'Password must contain at least one special character';

        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!roleId) newErrors.role = 'Role is required';
        if (isEmbassyOfficer && !embassyId) newErrors.embassy = 'Embassy is required for this role';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = () => {
        if (validate()) {
            onConfirm({ fullName: name, email, password, roleId, embassyId: isEmbassyOfficer ? embassyId : undefined });
            // Reset form
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRoleId('');
            setEmbassyId('');
            setErrors({});
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Add a new user to the organization with specific credentials and role.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                            id="name"
                            placeholder="Enter full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <PasswordStrengthIndicator password={password} />
                        {errors.password && <p className="text-xs text-red-600 font-medium">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password *</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search roles..."
                                    value={roleSearch}
                                    onChange={(e) => setRoleSearch(e.target.value)}
                                    className="pl-8 h-9 text-sm"
                                />
                            </div>
                            <Select value={roleId} onValueChange={setRoleId}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder={isLoadingRoles && rolePage === 1 ? "Loading roles..." : "Select user role"} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {roles?.length > 0 ? (
                                        <>
                                            {roles.map(r => (
                                                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                            ))}
                                            {hasMoreRoles && (
                                                <div className="p-2 border-t">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setRolePage(p => p + 1);
                                                        }}
                                                        disabled={isFetchingRoles}
                                                    >
                                                        {isFetchingRoles ? (
                                                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                                        ) : (
                                                            'Load more roles...'
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <SelectItem value="none" disabled>
                                            {isLoadingRoles ? "Loading..." : "No roles found"}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {errors.role && <p className="text-xs text-red-600">{errors.role}</p>}
                    </div>

                    {isEmbassyOfficer && (
                        <div className="space-y-2">
                            <Label htmlFor="embassy">Linked Embassy *</Label>
                            <Select value={embassyId} onValueChange={setEmbassyId}>
                                <SelectTrigger id="embassy">
                                    <SelectValue placeholder="Select an embassy" />
                                </SelectTrigger>
                                <SelectContent>
                                    {embassies?.length > 0 ? embassies.map(e => (
                                        <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                                    )) : <SelectItem value="none" disabled>No embassies found</SelectItem>}
                                </SelectContent>
                            </Select>
                            {errors.embassy && <p className="text-xs text-red-600">{errors.embassy}</p>}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading} className="bg-[#009b4d] hover:bg-[#007a3d]">
                        {isLoading ? 'Creating...' : 'Create User'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
