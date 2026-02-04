import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserRole = string;

export const UserRole = {
    EMA_OFFICER: 'EMA_OFFICER',
    STAKEHOLDER: 'STAKEHOLDER',
    SUPER_ADMIN: 'SUPER_ADMIN',
    ICS_OFFICER: 'ICS_OFFICER',
    NISS_OFFICER: 'NISS_OFFICER',
    INSA_OFFICER: 'INSA_OFFICER',
    CUSTOMS_OFFICER: 'CUSTOMS_OFFICER',
    AU_ADMIN: 'AU_ADMIN',
    IMMIGRATION_OFFICER: 'IMMIGRATION_OFFICER',
    MEDIA_EQUIPMENT_VERIFIER: 'MEDIA_EQUIPMENT_VERIFIER',
    DRONE_CLEARANCE_OFFICER: 'DRONE_CLEARANCE_OFFICER',
    EMBASSY_OFFICER: 'EMBASSY_OFFICER',
    ORG_ADMIN: 'ORG_ADMIN',
    CLIENT: 'CLIENT',
    PMO: 'PMO'
} as const;

export interface Permission {
    key: string;
    label: string;
    description: string | null;
    category?: string;
}

export interface Organization {
    id: number;
    name: string;
    logo: string;
    description: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    roleName?: string;
    workflowStepKey?: string;
    gate?: string;
    organization?: Organization;
    permissions?: Permission[]; // For storing API permissions
    authorizedWorkflowSteps?: { id: number; formId: number; key: string; name: string; targetAudience: string; isExitStep: boolean }[]; // Full step details for authorization
    requirePasswordChange?: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, role: string, permissions?: Permission[], fullName?: string, roleName?: string, id?: string, workflowStepKey?: string, organization?: Organization, authorizedWorkflowSteps?: any[], requirePasswordChange?: boolean) => void;
    logout: () => void;
    isAuthenticated: boolean;
    checkPermission: (permissionKey: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'managment_user';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = 'http://localhost:3000/api/v1'; // Should match FILE_BASE_URL in api.ts

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Try to get current user session using HttpOnly cookie
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        const userData = result.data;
                        setUser({
                            id: userData.id,
                            name: userData.fullName,
                            email: userData.email,
                            role: userData.roleName || userData.role?.name,
                            roleName: userData.roleName || userData.role?.name,
                            permissions: userData.permissions,
                            organization: userData.organization,
                            workflowStepKey: userData.workflowStepKey,
                            authorizedWorkflowSteps: userData.authorizedWorkflowSteps
                        });
                    }
                }
            } catch (error) {
                console.error("Auth initialization failed", error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const checkPermission = (permissionKey: string): boolean => {
        if (!user) return false;
        if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.PMO) return true;
        if (!user.permissions) return false;
        return user.permissions.some(p => (typeof p === 'string' ? p : p.key) === permissionKey);
    };

    const login = (email: string, role: UserRole, permissions: any[] = [], fullName: string = '', roleName?: string, id: string = '', workflowStepKey?: string, organization?: Organization, authorizedWorkflowSteps: any[] = [], requirePasswordChange: boolean = false) => {
        const newUser: User = {
            id,
            name: fullName,
            email,
            role,
            roleName,
            workflowStepKey,
            organization,
            permissions: permissions.map(p => typeof p === 'string' ? { key: p, label: p, description: '' } : p),
            authorizedWorkflowSteps,
            requirePasswordChange
        };
        setUser(newUser);
    };

    const logout = async () => {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem('managment_token');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, checkPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
