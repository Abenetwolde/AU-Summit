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
import { UserRole } from '@/auth/context';

interface CreateUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (userData: { name: string; email: string; password: string; role: UserRole }) => void;
}

export function CreateUserModal({ open, onOpenChange, onConfirm }: CreateUserModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<UserRole | ''>('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};

        if (!name.trim()) newErrors.name = 'Name is required';
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!role) newErrors.role = 'Role is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = () => {
        if (validate()) {
            onConfirm({ name, email, password, role: role as UserRole });
            // Reset form
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRole('');
            setErrors({});
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Add a new user to the system with their credentials and role.
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
                        {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
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
                        <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select user role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                                <SelectItem value={UserRole.EMA_OFFICER}>EMA Officer</SelectItem>
                                <SelectItem value={UserRole.ICS_OFFICER}>ICS Officer</SelectItem>
                                <SelectItem value={UserRole.NISS_OFFICER}>NISS Officer</SelectItem>
                                <SelectItem value={UserRole.INSA_OFFICER}>INSA Officer</SelectItem>
                                <SelectItem value={UserRole.CUSTOMS_OFFICER}>Customs Officer</SelectItem>
                                <SelectItem value={UserRole.AU_ADMIN}>AU Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && <p className="text-xs text-red-600">{errors.role}</p>}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} className="bg-[#009b4d] hover:bg-[#007a3d]">
                        Create User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
