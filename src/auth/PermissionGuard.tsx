import { useAuth } from './context';
import { ReactNode } from 'react';

interface PermissionGuardProps {
    permission: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
    const { checkPermission } = useAuth();
    const hasPermission = checkPermission(permission);

    if (hasPermission) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}

export function usePermission(permission: string): boolean {
    const { checkPermission } = useAuth();
    return checkPermission(permission);
}
