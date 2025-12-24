import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider, UserRole } from './auth/context';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { JournalistList } from './pages/dashboard/JournalistList';
import { AccreditedJournalists } from './pages/dashboard/AccreditedJournalists';
import { JournalistDetail } from './pages/dashboard/JournalistDetail';
import { SuperAdminDashboard } from './pages/dashboard/SuperAdminDashboard';
import { AdminJournalistList } from './pages/dashboard/AdminJournalistList';
import { JournalistProfile } from './pages/dashboard/JournalistProfile';
import { ICSJournalistList } from './pages/dashboard/ICSJournalistList';
import { ICSAccreditedJournalists } from './pages/dashboard/ICSAccreditedJournalists';
import { ICSJournalistDetail } from './pages/dashboard/ICSJournalistDetail';
import { INSAJournalistList } from './pages/dashboard/INSAJournalistList';
import { INSAAccreditedJournalists } from './pages/dashboard/INSAAccreditedJournalists';
import { INSAJournalistDetail } from './pages/dashboard/INSAJournalistDetail';
import { CustomsJournalistList } from './pages/dashboard/CustomsJournalistList';
import { CustomsAccreditedJournalists } from './pages/dashboard/CustomsAccreditedJournalists';
import { CustomsJournalistDetail } from './pages/dashboard/CustomsJournalistDetail';
import { BadgeManagement } from './pages/dashboard/BadgeManagement';
import { BadgeSlipPreview } from './pages/dashboard/BadgeSlipPreview';
import { AUJournalistList } from './pages/dashboard/AUJournalistList';
import { AUJournalistDetail } from './pages/dashboard/AUJournalistDetail';
import { AUAccreditedJournalists } from './pages/dashboard/AUAccreditedJournalists';
import { UserManagement } from './pages/dashboard/UserManagement';
import { EmailTemplates } from './pages/dashboard/EmailTemplates';
import { RegistrationFormBuilder } from './pages/dashboard/RegistrationFormBuilder';
import { BadgeTemplates } from './pages/dashboard/BadgeTemplates';
import { SystemSettings } from './pages/dashboard/SystemSettings';
import { OrganizationManagement } from './pages/dashboard/OrganizationManagement';
import { WorkflowBuilder } from './pages/dashboard/WorkflowBuilder';
import { PermissionManagement } from './pages/dashboard/PermissionManagement';
import { Toaster } from 'sonner';

import { useEffect } from 'react';
import { initEmailJS } from './lib/emailService';

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

                            {/* EMA Officer Routes */}
                            <Route element={<ProtectedRoute allowedRoles={[UserRole.EMA_OFFICER, UserRole.NISS_OFFICER]} />}>
                                <Route path="/dashboard" element={<DashboardLayout />}>
                                    <Route index element={<Navigate to="journalists" replace />} />
                                    <Route path="journalists" element={<JournalistList />} />
                                    <Route path="journalists/:id" element={<JournalistDetail />} />
                                    <Route path="accredited" element={<AccreditedJournalists />} />
                                </Route>
                            </Route>

                            {/* Super Admin Routes */}
                            <Route element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]} />}>
                                <Route path="/admin" element={<DashboardLayout />}>
                                    <Route index element={<SuperAdminDashboard />} />
                                    <Route path="journalists" element={<AdminJournalistList />} />
                                    <Route path="journalists/:id" element={<JournalistProfile />} />
                                    <Route path="accredited" element={<AccreditedJournalists />} />
                                    <Route path="users" element={<UserManagement />} />
                                    <Route path="email-templates" element={<EmailTemplates />} />
                                    <Route path="form-builder" element={<RegistrationFormBuilder />} />
                                    <Route path="form-builder" element={<RegistrationFormBuilder />} />
                                    <Route path="badge-templates" element={<BadgeTemplates />} />
                                    <Route path="badge-templates" element={<BadgeTemplates />} />
                                    <Route path="settings" element={<SystemSettings />} />
                                    <Route path="organizations" element={<OrganizationManagement />} />
                                    <Route path="workflow" element={<WorkflowBuilder />} />
                                    <Route path="permissions" element={<PermissionManagement />} />
                                </Route>
                            </Route>

                            {/* ICS Officer Routes */}
                            <Route element={<ProtectedRoute allowedRoles={[UserRole.ICS_OFFICER]} />}>
                                <Route path="/ics" element={<DashboardLayout />}>
                                    <Route index element={<Navigate to="journalists" replace />} />
                                    <Route path="journalists" element={<ICSJournalistList />} />
                                    <Route path="journalists/:id" element={<ICSJournalistDetail />} />
                                    <Route path="accredited" element={<ICSAccreditedJournalists />} />
                                </Route>
                            </Route>

                            {/* NISS Officer Routes - Read-only access to specific Super Admin features */}
                            <Route element={<ProtectedRoute allowedRoles={[UserRole.NISS_OFFICER]} />}>
                                <Route path="/niss" element={<DashboardLayout />}>
                                    <Route index element={<SuperAdminDashboard />} />
                                    <Route path="journalists" element={<AdminJournalistList />} />
                                    <Route path="journalists/:id" element={<JournalistProfile />} />
                                    <Route path="accredited" element={<AccreditedJournalists />} />
                                    <Route path="users" element={<UserManagement />} />
                                </Route>
                            </Route>

                            {/* INSA Officer Routes */}
                            <Route element={<ProtectedRoute allowedRoles={[UserRole.INSA_OFFICER]} />}>
                                <Route path="/insa" element={<DashboardLayout />}>
                                    <Route index element={<Navigate to="journalists" replace />} />
                                    <Route path="journalists" element={<INSAJournalistList />} />
                                    <Route path="journalists/:id" element={<INSAJournalistDetail />} />
                                    <Route path="accredited" element={<INSAAccreditedJournalists />} />
                                </Route>
                            </Route>

                            {/* Customs Officer Routes */}
                            <Route element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMS_OFFICER]} />}>
                                <Route path="/customs" element={<DashboardLayout />}>
                                    <Route index element={<Navigate to="journalists" replace />} />
                                    <Route path="journalists" element={<CustomsJournalistList />} />
                                    <Route path="journalists/:id" element={<CustomsJournalistDetail />} />
                                    <Route path="accredited" element={<CustomsAccreditedJournalists />} />
                                </Route>
                            </Route>

                            {/* AU Admin Routes */}
                            <Route element={<ProtectedRoute allowedRoles={[UserRole.AU_ADMIN]} />}>
                                <Route path="/au-admin" element={<DashboardLayout />}>
                                    <Route index element={<Navigate to="journalists" replace />} />
                                    <Route path="journalists" element={<AUJournalistList />} />
                                    <Route path="journalists/:id" element={<AUJournalistDetail />} />
                                    <Route path="accredited" element={<AUAccreditedJournalists />} />
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
