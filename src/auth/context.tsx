import { createContext, useContext, useState, ReactNode } from 'react';

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
    CLIENT: 'CLIENT'
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
    authorizedWorkflowSteps?: { id: number; formId: number; key: string; targetAudience: string }[]; // Full step details for authorization
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
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const checkPermission = (permissionKey: string): boolean => {
        if (!user || !user.permissions) return false;
        // Super admin generally has all permissions, but based on strict requirement we check the list.
        // If needed, we can add a bypass for SUPER_ADMIN here.
        return user.permissions.some(p => p.key === permissionKey);
    };

    const login = (email: string, role: UserRole, permissions: Permission[] = [], fullName: string = 'Officer Sara Kamil', roleName?: string, id: string = '1234-AU', workflowStepKey?: string, organization?: Organization, authorizedWorkflowSteps: any[] = [], requirePasswordChange: boolean = false) => {
        // Use provided name/permissions if available (from API), otherwise default
        const newUser: User = {
            id,
            name: fullName,
            email,
            role,
            roleName,
            workflowStepKey,
            organization,
            // gate: 'GATE 1',
            permissions,
            authorizedWorkflowSteps,
            requirePasswordChange
        };
        setUser(newUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        // Also remove the token
        localStorage.removeItem('managment_token');
    };

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
