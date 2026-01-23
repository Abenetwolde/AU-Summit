import { useAuth, UserRole } from '@/auth/context';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminDashboard from './AdminDashboard';

export default function DashboardIndex() {
    const { user } = useAuth();

    if (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PMO) {
        return <SuperAdminDashboard />;
    }

    return <AdminDashboard />;
}
