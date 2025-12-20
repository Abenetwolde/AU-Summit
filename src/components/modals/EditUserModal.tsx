import { useState, useEffect } from 'react';
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

interface EditUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
    };
    onConfirm: (userData: { name: string; email: string; role: UserRole }) => void;
}

export function EditUserModal({ open, onOpenChange, user, onConfirm }: EditUserModalProps) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState<UserRole>(user.role);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
    }, [user]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};

        if (!name.trim()) newErrors.name = 'Name is required';
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
        if (!role) newErrors.role = 'Role is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = () => {
        if (validate()) {
            onConfirm({ name, email, role });
            setErrors({});
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user information and role.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Full Name *</Label>
                        <Input
                            id="edit-name"
                            placeholder="Enter full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-email">Email *</Label>
                        <Input
                            id="edit-email"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-role">Role *</Label>
                        <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                            <SelectTrigger id="edit-role">
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
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
