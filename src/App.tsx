import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider, UserRole } from './auth/context';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { JournalistList } from './pages/dashboard/JournalistList';
import { AccreditedJournalists } from './pages/dashboard/AccreditedJournalists';
// import { SuperAdminDashboard } from './pages/dashboard/SuperAdminDashboard';
import { JournalistProfile } from './pages/dashboard/JournalistProfile';
import { BadgeManagement } from './pages/dashboard/BadgeManagement';
import { BadgeSlipPreview } from './pages/dashboard/BadgeSlipPreview';
import { UserManagement } from './pages/dashboard/UserManagement';
import { EmailTemplates } from './pages/dashboard/EmailTemplates';
import FormList from './pages/dashboard/FormList';
import { FormEditor } from './pages/dashboard/FormEditor';
import { BadgeTemplates } from './pages/dashboard/BadgeTemplates';
import { SystemSettings } from './pages/dashboard/SystemSettings';
import { PermissionManagement } from './pages/dashboard/PermissionManagement';
import { RoleManagement } from './pages/dashboard/RoleManagement';
import { InvitationCenter } from './pages/dashboard/invitations/InvitationCenter';
import { Toaster } from 'sonner';

import { useEffect } from 'react';
import { initEmailJS } from './lib/emailService';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import { OrganizationManagement } from './pages/dashboard/OrganizationManagement';
import { WorkflowBuilder } from './pages/dashboard/WorkflowBuilder';

function App() {
    useEffect(() => {
        initEmailJS();
    }, []);

    return (
        <Provider store={store}>
            <AuthProvider>
                <BrowserRouter>
                    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
                        <Toaster position="top-right" richColors />
                        <Routes>
                            <Route path="/login" element={<Login />} />

                            {/* Main Unified Dashboard Route */}
                            {/* Accessible to all authenticated users with valid roles */}
                            <Route element={<ProtectedRoute allowedRoles={Object.values(UserRole)} />}>
                                <Route path="/dashboard" element={<DashboardLayout />}>
                                    <Route index element={<Navigate to="admin" replace />} />

                                    {/* Consolidated Pages */}
                                    <Route path="admin" element={<SuperAdminDashboard />} />
                                    <Route path="journalists" element={<JournalistList />} />
                                    <Route path="journalists/:id" element={<JournalistProfile />} />
                                    <Route path="accredited" element={<AccreditedJournalists />} />

                                    {/* Admin Features (Gated by permissions internally or sidebar) */}
                                    <Route path="users" element={<UserManagement />} />
                                    <Route path="email-templates" element={<EmailTemplates />} />

                                    {/* Form Builder Routes */}
                                    <Route path="forms" element={<FormList />} />
                                    <Route path="forms/builder" element={<FormEditor />} />
                                    <Route path="forms/builder/:id" element={<FormEditor />} />

                                    <Route path="badge-templates" element={<BadgeTemplates />} />
                                    <Route path="settings" element={<SystemSettings />} />
                                    <Route path="organizations" element={<OrganizationManagement />} />
                                    <Route path="invitations" element={<InvitationCenter />} />
                                    <Route path="workflow" element={<WorkflowBuilder />} />
                                    <Route path="permissions" element={<PermissionManagement />} />
                                    <Route path="roles" element={<RoleManagement />} />

                                    {/* AU Admin Specific */}
                                    <Route path="badge-management" element={<BadgeManagement />} />
                                    <Route path="badge-slip/:id" element={<BadgeSlipPreview />} />
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
