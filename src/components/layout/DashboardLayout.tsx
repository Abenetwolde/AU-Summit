import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/auth/context';
import { cn } from '@/lib/utils';
import { LogOut, User, LayoutDashboard, BadgeCheck, Users, Mail, FileText, Settings, Building2, GitMerge, ShieldAlert, Shield } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export function DashboardLayout() {
    const { user, logout, checkPermission } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getBasePath = () => {
        return '/dashboard';
    };

    const basePath = getBasePath();


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
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <img src={getLogo()} alt="Logo" className="h-8 w-auto object-contain" />
                    <h1 className="text-sm font-bold font-sans text-primary truncate max-w-[180px]">
                        {getTitle()}
                    </h1>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="hover:bg-gray-100 rounded-xl"
                >
                    <Menu className="h-6 w-6 text-gray-600" />
                </Button>
            </header>

            {/* Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 shadow-2xl md:shadow-none",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center justify-between border-b border-gray-50 mb-4">
                    <div className="flex items-center gap-3 text-primary">
                        <img src={getLogo()} alt="Logo" className="h-10 w-auto" />
                        <h1 className="text-lg font-bold font-sans leading-tight">
                            {getTitle()}
                        </h1>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden hover:bg-gray-100 rounded-xl"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </Button>
                </div>

                <div className="border-b border-primary mx-4 mb-6"></div>

                <ScrollArea className="flex-1 px-4">
                    <nav className="space-y-2 pr-2">
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

                        {/* Economist/Journalist List */}
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

                        {/* Form Builder - 'form:view:all' */}
                        {checkPermission('form:view:all') && (
                            <NavLink
                                to={`${basePath}/forms`}
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





                        {/* Email Templates */}
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

                        {/* Badge Center */}
                        {user?.role === UserRole.SUPER_ADMIN && (
                            <NavLink
                                to={`${basePath}/badge-center`}
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
                                Badge Center
                            </NavLink>
                        )}

                        {/* Invitation Center */}
                        {checkPermission('application:view:approved') && (
                            <NavLink
                                to={`${basePath}/invitations`}
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
                                Invitation Center
                            </NavLink>
                        )}
                        {/* System Settings */}
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
                </ScrollArea>


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
            <main className="flex-1 md:ml-72 pt-20 md:pt-4 p-4 md:p-8 flex flex-col min-h-screen">
                <div className="max-w-[1600px] w-full mx-auto">
                    <Outlet />
                </div>

                <footer className="mt-auto pt-12 pb-6 text-center text-xs text-gray-400 font-medium tracking-wide">
                    © 2025 African Union Accreditation Portal. All rights reserved.
                </footer>
            </main>
        </div >
    );
}