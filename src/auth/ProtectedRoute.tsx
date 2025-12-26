import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '@/auth/context';

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
    requiredPermission?: string;
}

export function ProtectedRoute({ allowedRoles, requiredPermission }: ProtectedRouteProps) {
    const { user, isAuthenticated, checkPermission } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    if (requiredPermission && !checkPermission(requiredPermission)) {
        return <Navigate to="/" replace />; // Or a specific 403 page
    }

    return <Outlet />;
}
