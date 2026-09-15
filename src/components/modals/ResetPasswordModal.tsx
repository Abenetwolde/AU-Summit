import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { PasswordStrengthIndicator } from '../ui/PasswordStrengthIndicator';
import { useUpdateUserMutation, useGetUsersQuery, User } from '@/store/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import {
    KeyRound,
    Search,
    Eye,
    EyeOff,
    Copy,
    Check,
    RefreshCw,
    User as UserIcon,
    Loader2,
    ShieldAlert
} from 'lucide-react';

interface ResetPasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User | null;
    onSuccess?: () => void;
}

export function ResetPasswordModal({
    open,
    onOpenChange,
    user: initialUser,
    onSuccess
}: ResetPasswordModalProps) {
    const [selectedUser, setSelectedUser] = useState<User | null>(initialUser || null);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const debouncedSearch = useDebounce(userSearchTerm, 400);
    const [isSearchingUser, setIsSearchingUser] = useState(false);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

    // Query users when searching manually inside the modal
    const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(
        { page: 1, limit: 10, search: debouncedSearch, status: 'ACTIVE' },
        { skip: !open || !isSearchingUser }
    );

    useEffect(() => {
        if (open) {
            setSelectedUser(initialUser || null);
            setIsSearchingUser(!initialUser);
            setPassword('');
            setConfirmPassword('');
            setUserSearchTerm('');
            setErrors({});
            setCopied(false);
        }
    }, [open, initialUser]);

    // Generate random strong password
    const handleGeneratePassword = () => {
        const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lowercase = 'abcdefghijkmnopqrstuvwxyz';
        const numbers = '23456789';
        const special = '!@#$%^&*';

        let generated = '';
        generated += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
        generated += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
        generated += numbers.charAt(Math.floor(Math.random() * numbers.length));
        generated += special.charAt(Math.floor(Math.random() * special.length));

        const allChars = uppercase + lowercase + numbers + special;
        for (let i = 0; i < 8; i++) {
            generated += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }

        // Shuffle
        generated = generated.split('').sort(() => 0.5 - Math.random()).join('');

        setPassword(generated);
        setConfirmPassword(generated);
        setShowPassword(true);
        setErrors((prev) => ({ ...prev, password: '', confirmPassword: '' }));
        toast.info('Strong password generated');
    };

    const handleCopyPassword = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        setCopied(true);
        toast.success('Password copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!selectedUser) {
            newErrors.user = 'Please select a user to reset password';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/[A-Z]/.test(password)) {
            newErrors.password = 'Must contain at least one uppercase letter';
        } else if (!/[a-z]/.test(password)) {
            newErrors.password = 'Must contain at least one lowercase letter';
        } else if (!/[0-9]/.test(password)) {
            newErrors.password = 'Must contain at least one number';
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            newErrors.password = 'Must contain at least one special character';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords don't match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !selectedUser) return;

        try {
            await updateUser({
                id: selectedUser.id,
                data: { password }
            }).unwrap();

            toast.success(`Password reset successfully for ${selectedUser.fullName}`);
            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            const errorMessage = err?.data?.error || err?.data?.message || 'Failed to reset user password';
            toast.error(errorMessage);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-full sm:max-w-[540px] p-6 rounded-2xl shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900">
                                Reset User Password
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 mt-0.5">
                                Search for an admin or system user to assign a new secure password.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    {/* User Selection Section */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                            Target User *
                        </Label>

                        {selectedUser && !isSearchingUser ? (
                            <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                        {selectedUser.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900 leading-snug">
                                            {selectedUser.fullName}
                                        </span>
                                        <span className="text-xs text-gray-500">{selectedUser.email}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-white text-xs font-semibold text-gray-700 border-gray-200">
                                        {selectedUser.roleName || selectedUser.role?.name || 'User'}
                                    </Badge>
                                    {!initialUser && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsSearchingUser(true)}
                                            className="text-xs text-[#009b4d] hover:bg-[#009b4d]/10 h-8 px-2"
                                        >
                                            Change
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Type name or email to search user..."
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                        className="pl-9 h-10 text-sm border-gray-200"
                                    />
                                    {isLoadingUsers && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                                    )}
                                </div>

                                {debouncedSearch.length >= 2 && usersData?.users && (
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-sm">
                                        {usersData.users.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-gray-500">
                                                No users found matching "{debouncedSearch}"
                                            </div>
                                        ) : (
                                            usersData.users.map((u) => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedUser(u);
                                                        setIsSearchingUser(false);
                                                        setErrors((prev) => ({ ...prev, user: '' }));
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-emerald-50/50 transition-colors flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <UserIcon className="h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{u.fullName}</p>
                                                            <p className="text-xs text-gray-500">{u.email}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {u.roleName || u.role?.name}
                                                    </Badge>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {errors.user && (
                            <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                {errors.user}
                            </p>
                        )}
                    </div>

                    {/* New Password Input */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="new-password" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                                New Password *
                            </Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleGeneratePassword}
                                className="h-7 text-xs gap-1.5 text-[#009b4d] hover:text-[#007a3d] hover:bg-emerald-50 px-2 font-semibold"
                            >
                                <RefreshCw className="h-3 w-3" />
                                Generate Password
                            </Button>
                        </div>

                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setErrors((prev) => ({ ...prev, password: '' }));
                                }}
                                className="pr-20 h-10 border-gray-200"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {password && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopyPassword}
                                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                                        title="Copy Password"
                                    >
                                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </Button>
                            </div>
                        </div>

                        <PasswordStrengthIndicator password={password} />

                        {errors.password && (
                            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.password}</p>
                        )}
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-1.5">
                        <Label htmlFor="confirm-password" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                            Confirm Password *
                        </Label>
                        <Input
                            id="confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Re-enter new password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                            }}
                            className="h-10 border-gray-200"
                        />
                        {errors.confirmPassword && (
                            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <DialogFooter className="pt-2 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-gray-200 h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isUpdating || !selectedUser}
                            className="bg-[#009b4d] hover:bg-[#007a3d] text-white h-10 gap-2 font-semibold min-w-[130px]"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <KeyRound className="h-4 w-4" />
                                    Reset Password
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
