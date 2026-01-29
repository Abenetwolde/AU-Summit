import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider, UserRole } from './auth/context';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { ChangePassword } from './pages/auth/ChangePassword';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { JournalistList } from './pages/dashboard/JournalistList';
import { AccreditedJournalists } from './pages/dashboard/AccreditedJournalists';
import { JournalistProfile } from './pages/dashboard/JournalistProfile';
import { BadgeManagement } from './pages/dashboard/BadgeManagement';
import { BadgeSlipPreview } from './pages/dashboard/BadgeSlipPreview';
import { UserManagement } from './pages/dashboard/UserManagement';
import { EmailTemplates } from './pages/dashboard/EmailTemplates';
import FormList from './pages/dashboard/FormList';
import { FormEditor } from './pages/dashboard/FormEditor';
import { SystemSettings } from './pages/dashboard/SystemSettings';
import { PermissionManagement } from './pages/dashboard/PermissionManagement';
import { RoleManagement } from './pages/dashboard/RoleManagement';
import { InvitationCenter } from './pages/dashboard/invitations/InvitationCenter';
import { BadgeCenter } from './pages/dashboard/badges/BadgeCenter';
import ApiManagement from './pages/dashboard/ApiManagement';
import { PublicProfile } from './pages/public/PublicProfile';
import { JournalistVerification } from './pages/public/JournalistVerification';
import { Toaster } from 'sonner';

import { useEffect } from 'react';
import { initEmailJS } from './lib/emailService';
import DashboardIndex from './pages/dashboard/DashboardIndex';
import { OrganizationManagement } from './pages/dashboard/OrganizationManagement';
import { WorkflowBuilder } from './pages/dashboard/WorkflowBuilder';
import EmbassyManagement from './pages/dashboard/EmbassyManagement';
import { EntryWorkflowDashboard } from './pages/dashboard/EntryWorkflowDashboard';
import { ExitWorkflowDashboard } from './pages/dashboard/ExitWorkflowDashboard';
import { OrganizationUsers } from './pages/dashboard/OrganizationUsers';
import AirlineOfficeManagement from './pages/dashboard/AirlineOfficeManagement';
import ManualEntry from './pages/dashboard/ManualEntry';
import { ManualApplications } from './pages/dashboard/ManualApplications';
import { ManualBadgePrint } from './pages/dashboard/badges/ManualBadgePrint';

function App() {
    useEffect(() => {
        initEmailJS();
    }, []);

    return (
        <Provider store={store}>
            <AuthProvider>
                <BrowserRouter>
                    <div className="min-h-screen bg-background font-sans antialiased text-foreground overflow-x-hidden">
                        <Toaster position="top-right" richColors />
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/change-password" element={<ChangePassword />} />
                            <Route path="/badge-profile/:hash" element={<PublicProfile />} />
                            <Route path="/verification/:id" element={<JournalistVerification />} />

                            {/* Main Unified Dashboard Route */}
                            <Route element={<ProtectedRoute />}>
                                <Route path="/dashboard" element={<DashboardLayout />}>
                                    <Route index element={<Navigate to="admin" replace />} />

                                    {/* Consolidated Pages */}
                                    <Route path="admin" element={<DashboardIndex />} />
                                    <Route path="journalists" element={<JournalistList />} />
                                    <Route element={<ProtectedRoute requiredPermission="application:manual-entry" />}>
                                        <Route path="manual-entry" element={<ManualEntry />} />
                                        <Route path="manual-applications" element={<ManualApplications />} />
                                    </Route>

                                    <Route element={<ProtectedRoute requiredPermission="application:view:by-id" />}>
                                        <Route path="journalists/:id" element={<JournalistProfile />} />
                                    </Route>

                                    <Route element={<ProtectedRoute requiredPermission="application:view:approved" />}>
                                        <Route path="accredited" element={<AccreditedJournalists />} />
                                        <Route path="invitations" element={<InvitationCenter />} />
                                    </Route>

                                    {/* Workflow Phase Routes */}
                                    <Route element={<ProtectedRoute requiredPermission="application:view:entry-workflow" />}>
                                        <Route path="entry-workflow" element={<EntryWorkflowDashboard />} />
                                    </Route>

                                    <Route element={<ProtectedRoute requiredPermission="application:view:exit-workflow" />}>
                                        <Route path="exit-workflow" element={<ExitWorkflowDashboard />} />
                                    </Route>

                                    {/* Admin Features */}
                                    <Route element={<ProtectedRoute requiredPermission="user:view:all" />}>
                                        <Route path="users" element={<UserManagement />} />
                                    </Route>

                                    {/* Organization Admin - User Management */}
                                    <Route element={<ProtectedRoute requiredPermission="user:view:org" />}>
                                        <Route path="organization-users" element={<OrganizationUsers />} />
                                    </Route>


                                    <Route element={<ProtectedRoute requiredPermission="organization:view:all" />}>
                                        <Route path="organizations" element={<OrganizationManagement />} />
                                    </Route>

                                    <Route element={<ProtectedRoute requiredPermission="workflow:config:view" />}>
                                        <Route path="workflow" element={<WorkflowBuilder />} />
                                    </Route>

                                    <Route element={<ProtectedRoute requiredPermission="permission:matrix:view" />}>
                                        <Route path="permissions" element={<PermissionManagement />} />
                                    </Route>

                                    <Route element={<ProtectedRoute requiredPermission="role:view:all" />}>
                                        <Route path="roles" element={<RoleManagement />} />
                                    </Route>

                                    {/* Form Builder Routes */}
                                    <Route element={<ProtectedRoute requiredPermission="form:view:all" />}>
                                        <Route path="forms" element={<FormList />} />
                                    </Route>
                                    <Route element={<ProtectedRoute requiredPermission="form:create" />}>
                                        <Route path="forms/builder" element={<FormEditor />} />
                                        <Route path="forms/builder/:id" element={<FormEditor />} />
                                    </Route>

                                    {/* Super Admin Only Routes */}
                                    <Route element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.PMO]} />}>
                                        <Route path="email-templates" element={<EmailTemplates />} />
                                        <Route path="settings" element={<SystemSettings />} />
                                        <Route path="badge-center" element={<BadgeCenter />} />
                                        <Route element={<ProtectedRoute requiredPermission="application:badge:manual-print" />}>
                                            <Route path="badge-center/manual-print" element={<ManualBadgePrint />} />
                                        </Route>
                                        <Route path="api-management" element={<ApiManagement />} />
                                        <Route path="embassies" element={<EmbassyManagement />} />
                                        <Route path="airline-offices" element={<AirlineOfficeManagement />} />
                                        <Route path="regional-offices" element={<AirlineOfficeManagement />} />
                                    </Route>

                                    {/* AU Admin Specific */}
                                    <Route element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.PMO]} />}>
                                        <Route path="badge-management" element={<BadgeManagement />} />
                                        <Route path="badge-slip/:id" element={<BadgeSlipPreview />} />
                                    </Route>
                                </Route>
                            </Route>

                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </div>
                </BrowserRouter>
            </AuthProvider>
        </Provider>
    );
}

export default App;
