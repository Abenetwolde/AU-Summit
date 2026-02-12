import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

// ──────────────────────────────────────────────
// Zod Schema
// ──────────────────────────────────────────────
const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').trim(),
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least one special character'),
  confirmPassword: z.string(),
  roleId: z.string().min(1, 'Role is required'),
  embassyId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine(
  (data) => {
    // Only require embassyId when role is EMBASSY_OFFICER
    // We'll check this dynamically after role selection
    return true;
  },
  {
    message: 'Embassy is required for this role',
    path: ['embassyId'],
  }
);

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userData: {
    fullName: string;
    email: string;
    password: string;
    roleId: string;
    embassyId?: string;
  }) => void;
  organizationId?: number;
  isLoading?: boolean;
}

export function CreateUserModal({
  open,
  onOpenChange,
  onConfirm,
  organizationId,
  isLoading = false,
}: CreateUserModalProps) {
  const { user: currentUser } = useAuth();

  // Role search + pagination
  const [roleSearch, setRoleSearch] = useState('');
  const debouncedRoleSearch = useDebounce(roleSearch, 500);
  const [rolePage, setRolePage] = useState(1);
  const [aggregatedRoles, setAggregatedRoles] = useState<Role[]>([]);

  const { data: rolesData, isLoading: isLoadingRoles, isFetching: isFetchingRoles } =
    useGetRolesQuery({
      page: rolePage,
      limit: 30,
      search: debouncedRoleSearch,
      organizationId,
    });

  useEffect(() => {
    if (debouncedRoleSearch || rolePage === 1) {
      setRolePage(1);
      setAggregatedRoles([]);
    }
  }, [debouncedRoleSearch]);

  useEffect(() => {
    if (rolesData?.roles) {
      if (rolePage === 1) {
        setAggregatedRoles(rolesData.roles);
      } else {
        setAggregatedRoles((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const newRoles = rolesData.roles.filter((r) => !existingIds.has(r.id));
          return [...prev, ...newRoles];
        });
      }
    }
  }, [rolesData, rolePage]);

  const roles = aggregatedRoles.filter((r) => {
    if (r.name === 'CLIENT') return false;
    if (r.name === 'EMBASSY_OFFICER' && currentUser?.role !== UserRole.SUPER_ADMIN) {
      return false;
    }
    return true;
  });

  const hasMoreRoles = rolesData ? rolePage < rolesData.totalPages : false;

  const { data: embassies = [] } = useGetEmbassiesQuery();

  // ──────────────────────────────────────────────
  // React Hook Form + Zod
  // ──────────────────────────────────────────────
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      roleId: '',
      embassyId: '',
    },
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = form;

  const selectedRoleId = watch('roleId');
  const selectedRole = aggregatedRoles.find((r) => String(r.id) === selectedRoleId);
  const isEmbassyOfficer = selectedRole?.name === 'EMBASSY_OFFICER';

  // Dynamically make embassyId required when isEmbassyOfficer = true
  useEffect(() => {
    if (isEmbassyOfficer) {
      // We can't change schema dynamically easily → we trigger re-validation
      form.trigger('embassyId');
    }
  }, [isEmbassyOfficer, form]);

  const onSubmit = (data: CreateUserFormData) => {
    onConfirm({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      roleId: data.roleId,
      embassyId: isEmbassyOfficer ? data.embassyId : undefined,
    });
    reset();
    onOpenChange(false);
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" placeholder="Enter full name" {...register('fullName')} />
            {errors.fullName && (
              <p className="text-xs text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              {...register('password')}
            />
            <PasswordStrengthIndicator password={watch('password')} />
            {errors.password && (
              <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Role */}
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

              <Select
                value={selectedRoleId}
                onValueChange={(val) => setValue('roleId', val, { shouldValidate: true })}
              >
                <SelectTrigger id="role">
                  <SelectValue
                    placeholder={
                      isLoadingRoles && rolePage === 1 ? 'Loading roles...' : 'Select user role'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {roles?.length > 0 ? (
                    <>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
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
                              setRolePage((p) => p + 1);
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
                      {isLoadingRoles ? 'Loading...' : 'No roles found'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {errors.roleId && <p className="text-xs text-red-600">{errors.roleId.message}</p>}
          </div>

          {/* Embassy – shown conditionally */}
          {isEmbassyOfficer && (
            <div className="space-y-2">
              <Label htmlFor="embassyId">Linked Embassy *</Label>
              <Select
                value={watch('embassyId')}
                onValueChange={(val) => setValue('embassyId', val, { shouldValidate: true })}
              >
                <SelectTrigger id="embassyId">
                  <SelectValue placeholder="Select an embassy" />
                </SelectTrigger>
                <SelectContent>
                  {embassies?.length > 0 ? (
                    embassies.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No embassies found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.embassyId && (
                <p className="text-xs text-red-600">{errors.embassyId.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#009b4d] hover:bg-[#007a3d]"
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}