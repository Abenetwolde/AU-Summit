import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/auth/context';
import { cn } from '@/lib/utils';
import { LogOut, User, LayoutDashboard, BadgeCheck, Users, Mail, FileText, Settings, Building2, GitMerge, ShieldAlert, Shield, Menu, X } from 'lucide-react';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed inset-y-0 text-slate-900 z-50 shadow-sm">
                <SidebarContent user={user} basePath={basePath} checkPermission={checkPermission} handleLogout={handleLogout} getTitle={getTitle} getLogo={getLogo} />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {
                isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 md:hidden animate-in fade-in duration-200"
                        onClick={toggleMobileMenu}
                    />
                )
            }

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 md:hidden",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SidebarContent user={user} basePath={basePath} checkPermission={checkPermission} handleLogout={handleLogout} getTitle={getTitle} getLogo={getLogo} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                            <Menu className="h-6 w-6 text-gray-900" />
                        </Button>
                        <h1 className="text-lg font-bold text-gray-900 truncate max-w-[200px]">
                            {getTitle()}
                        </h1>
                    </div>
                </header>

                <div className="p-4 md:p-8 flex-1 flex flex-col">
                    <Outlet />
                </div>

                <footer className="mt-auto pt-12 pb-6 text-center text-sm text-gray-500 font-medium">
                    © 2025 Government of Ethiopia. All rights reserved.
                </footer>
            </main>
        </div >
    );
}

function SidebarContent({ user, basePath, checkPermission, handleLogout, getTitle, getLogo, closeMobileMenu }: any) {
    const NavItem = ({ to, icon: Icon, children, end = false }: any) => (
        <NavLink
            to={to}
            end={end}
            onClick={closeMobileMenu}
            className={({ isActive }) =>
                cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                    isActive
                        ? "bg-[#009b4d]/10 text-[#009b4d]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )
            }
        >
            {({ isActive }) => (
                <>
                    {isActive && (
                        <div className="absolute left-0 w-1 h-6 bg-[#009b4d] rounded-r-full" />
                    )}
                    <Icon className={cn(
                        "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-[#009b4d]" : "text-slate-400 group-hover:text-slate-600"
                    )} />
                    {children}
                </>
            )}
        </NavLink>
    );

    const SectionHeader = ({ children }: { children: React.ReactNode }) => (
        <div className="px-4 mt-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {children}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Branding Header */}
            <div className="pt-4 px-6 pb-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        {user?.role !== UserRole.SUPER_ADMIN && (
                            <div className="h-10 w-fit bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
                                <img src={getLogo()} alt="Logo" className="h-full w-auto object-contain" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 leading-tight tracking-tight">
                                {getTitle()}
                            </h1>
                            {user?.role !== UserRole.SUPER_ADMIN && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#009b4d] animate-pulse" />
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                        {user?.roleName?.replace('_', ' ') || 'Internal System'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    {closeMobileMenu && (
                        <Button variant="ghost" size="icon" onClick={closeMobileMenu} className="-mr-2 -mt-1 md:hidden">
                            <X className="h-5 w-5 text-slate-400" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="px-4 mb-2">
                <div className="h-px bg-slate-100 w-full" />
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                <SectionHeader>Main Menu</SectionHeader>
                {user?.role && (
                    <NavItem to="/dashboard/admin" icon={LayoutDashboard} end>
                        Dashboard
                    </NavItem>
                )}

                <NavItem to={`${basePath}/journalists`} icon={Users}>
                    All Journalists
                </NavItem>

                {checkPermission('application:view:approved') && (
                    <NavItem to={`${basePath}/accredited`} icon={BadgeCheck}>
                        Accredited List
                    </NavItem>
                )}

                {/* Management Section */}
                {(checkPermission('user:view:all') ||
                    checkPermission('organization:view:all') ||
                    user?.role === UserRole.AU_ADMIN) && (
                        <SectionHeader>Management</SectionHeader>
                    )}

                {user?.role === UserRole.AU_ADMIN && (
                    <NavItem to={`${basePath}/badge-management`} icon={BadgeCheck}>
                        Badge Production
                    </NavItem>
                )}

                {checkPermission('user:view:all') && (
                    <NavItem to={`${basePath}/users`} icon={User}>
                        User Access
                    </NavItem>
                )}

                {checkPermission('organization:view:all') && (
                    <NavItem to={`${basePath}/organizations`} icon={Building2}>
                        Organizations
                    </NavItem>
                )}

                {(user?.role === UserRole.SUPER_ADMIN) && (
                    <NavItem to={`${basePath}/email-templates`} icon={Mail}>
                        Email Templates
                    </NavItem>
                )}

                {checkPermission('workflow:config:view') && (
                    <NavItem to={`${basePath}/workflow`} icon={GitMerge}>
                        Workflow Editor
                    </NavItem>
                )}

                {/* System Configuration Section */}
                {(user?.role === UserRole.SUPER_ADMIN ||
                    checkPermission('role:view:all') ||
                    checkPermission('form:view:all')) && (
                        <SectionHeader>System Configuration</SectionHeader>
                    )}

                {checkPermission('form:view:all') && (
                    <NavItem to={`${basePath}/form-builder`} icon={FileText}>
                        Form Builder
                    </NavItem>
                )}

                {checkPermission('role:view:all') && (
                    <NavItem to={`${basePath}/roles`} icon={Shield}>
                        Role Matrix
                    </NavItem>
                )}

                {checkPermission('permission:matrix:view') && (
                    <NavItem to={`${basePath}/permissions`} icon={ShieldAlert}>
                        Permission Access
                    </NavItem>
                )}

                {user?.role === UserRole.SUPER_ADMIN && (
                    <>
                        <NavItem to={`${basePath}/badge-templates`} icon={Settings}>
                            Badge Templates
                        </NavItem>
                        <NavItem to={`${basePath}/settings`} icon={Settings}>
                            Global Settings
                        </NavItem>
                    </>
                )}
            </nav>

            {/* User Profile Footer */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-10 w-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-[#009b4d]">
                        <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-[10px] text-slate-500 truncate lowercase">{user?.email}</p>
                    </div>
                </div>

                <Button
                    variant="default"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all duration-200"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}