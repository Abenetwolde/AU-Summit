import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/auth/context';
import { cn } from '@/lib/utils';
import { LogOut, User, LayoutDashboard, BadgeCheck, Users, Mail, FileText, Settings, Building2, GitMerge, ShieldAlert, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import emmpaLogo from '@/assests/emmpa.png';
import icsLogo from '@/assests/ics.png';
import nissLogo from '@/assests/niss.png';
import insaLogo from '@/assests/insa.png';
import customsLogo from '@/assests/customs.png';
import auLogo from '@/assests/au.png';

export function DashboardLayout() {
    const { user, logout, checkPermission } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getBasePath = () => {
        return '/dashboard';
    };

    const basePath = getBasePath();

    const getLogo = () => {
        if (user?.role === UserRole.ICS_OFFICER) return icsLogo;
        if (user?.role === UserRole.NISS_OFFICER) return nissLogo;
        if (user?.role === UserRole.INSA_OFFICER) return insaLogo;
        if (user?.role === UserRole.CUSTOMS_OFFICER) return customsLogo;
        if (user?.role === UserRole.AU_ADMIN) return auLogo;
        return emmpaLogo;
    };

    const getTitle = () => {
        if (user?.roleName) return user.roleName;

        if (user?.role === UserRole.SUPER_ADMIN) return 'Super Admin';
        if (user?.role === UserRole.ICS_OFFICER) return 'ICS Officer';
        if (user?.role === UserRole.NISS_OFFICER) return 'NISS Officer';
        if (user?.role === UserRole.INSA_OFFICER) return 'INSA Officer';
        if (user?.role === UserRole.CUSTOMS_OFFICER) return 'Customs Officer';
        if (user?.role === UserRole.AU_ADMIN) return 'AU Admin';
        return 'EMA (Ethiopian Media Authority)';
    };

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-100/50 border-r border-gray-200 hidden md:flex flex-col fixed inset-y-0 text-gray-900">
                <div className="p-6">
                    <div className="flex items-center gap-2 text-primary">
                        {/* <img src={getLogo()} alt="Logo" className="h-10 w-auto object-contain" /> */}
                        <h1 className="text-xl font-bold font-sans leading-tight">
                            {getTitle()}
                        </h1>
                    </div>
                </div>

                <div className="border-b border-primary mx-4 mb-6"></div>

                <nav className="flex-1 px-4 space-y-2">
                         {/* <NavLink
                        to={`${basePath}/admin`}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-[#e6f4ea] text-primary"
                                    : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                            )
                        }
                    >
                        <Users className="h-5 w-5" />
                       Dashboard
                    </NavLink> */}
                    {/* Dashboard - Accessible to all logged in users who have a role */}
                    {user?.role && (
                        <NavLink
                            to="/dashboard/admin"
                            end
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e6f4ea] text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                )
                            }
                        >
                            <LayoutDashboard className="h-5 w-5" />
                            Dashboard
                        </NavLink>
                    )}

                    {/* Journalist List - Typically accessible to most officers */}
                    {/* Assuming a basic permission 'application:view' or similar exists, using 'application:view:all' or specific view permissions as gate */}
                    {/* For now, keeping it broadly available but we could gate it if needed. Leaving as is per plan foundation, or strictly 'application:view:all' */}

                    <NavLink
                        to={`${basePath}/journalists`}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-[#e6f4ea] text-primary"
                                    : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                            )
                        }
                    >
                        <Users className="h-5 w-5" />
                        List of journalists
                    </NavLink>



                    {/* Accredited Journalists - 'application:view:approved' */}
                    {checkPermission('application:view:approved') && (
                        <NavLink
                            to={`${basePath}/accredited`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e6f4ea] text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                )
                            }
                        >
                            <BadgeCheck className="h-5 w-5" />
                            Accredited Journalists
                        </NavLink>
                    )}

                    {/* User Management - 'user:view:all' */}
                    {checkPermission('user:view:all') && (
                        <NavLink
                            to={`${basePath}/users`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e6f4ea] text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                )
                            }
                        >
                            <User className="h-5 w-5" />
                            User Management
                        </NavLink>
                    )}

                    {/* Email Templates - 'email:template:view' (Not in key list provided, falling back to role or assuming generic admin permission) */}
                    {/* Provided keys don't have email template specific. Using SUPER_ADMIN fallback or could map to 'workflow:config:manage' if related, but likely just SUPER_ADMIN specific for now as per plan */}
                    {(user?.role === UserRole.SUPER_ADMIN) && (
                        <NavLink
                            to={`${basePath}/email-templates`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e6f4ea] text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                )
                            }
                        >
                            <Mail className="h-5 w-5" />
                            Email Templates
                        </NavLink>
                    )}

                    {/* Form Builder - 'form:view:all' */}
                    {checkPermission('form:view:all') && (
                        <NavLink
                            to={`${basePath}/form-builder`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e6f4ea] text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                )
                            }
                        >
                            <FileText className="h-5 w-5" />
                            Form Builder
                        </NavLink>
                    )}

                    {/* Organizations - 'organization:view:all' */}
                    {checkPermission('organization:view:all') && (
                        <NavLink
                            to={`${basePath}/organizations`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e6f4ea] text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                )
                            }
                        >
                            <Building2 className="h-5 w-5" />
                            Organizations
                        </NavLink>
                    )}

                    {/* Roles - 'role:view:all' */}
                    {checkPermission('role:view:all') && (
                        <NavLink
                            to={`${basePath}/roles`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e6f4ea] text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                )
                            }
                        >
                            <Shield className="h-5 w-5" />
                            Roles
                        </NavLink>
                    )}

                    {/* Workflow Builder - 'workflow:config:view' */}
                    {checkPermission('workflow:config:view') && (
                        <NavLink
                            to={`${basePath}/workflow`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e6f4ea] text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                )
                            }
                        >
                            <GitMerge className="h-5 w-5" />
                            Workflow Builder
                        </NavLink>
                    )}

                    {/* Permissions - 'permission:matrix:view' */}
                    {checkPermission('permission:matrix:view') && (
                        <NavLink
                            to={`${basePath}/permissions`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e6f4ea] text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                )
                            }
                        >
                            <ShieldAlert className="h-5 w-5" />
                            Permissions
                        </NavLink>
                    )}

                    {/* Badge Templates - No specific permission key in provided list, keeping SUPER_ADMIN */}
                    {user?.role === UserRole.SUPER_ADMIN && (
                        <NavLink
                            to={`${basePath}/badge-templates`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e6f4ea] text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                )
                            }
                        >
                            <BadgeCheck className="h-5 w-5" />
                            Badge Templates
                        </NavLink>
                    )}

                    {/* System Settings - SUPER_ADMIN specific */}
                    {user?.role === UserRole.SUPER_ADMIN && (
                        <NavLink
                            to={`${basePath}/settings`}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e6f4ea] text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                                )
                            }
                        >
                            <Settings className="h-5 w-5" />
                            System Settings
                        </NavLink>
                    )}
                </nav>

                <div className="p-6 mt-auto">
                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-2">
                            {/* {user?.gate || 'AU DESK - GATE 1'} */}
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{user?.email}</p>
                                <p className="text-xs text-gray-400">ID: #{user?.id}</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="default"
                        className="w-full bg-black hover:bg-black/90 text-white justify-start pl-4"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8 flex flex-col min-h-screen">
                <Outlet />

                <footer className="mt-auto pt-12 text-center text-sm text-gray-500 font-medium">
                    © 2025 Ethiopian Media Association. All rights reserved.
                </footer>
            </main>
        </div >
    );
}