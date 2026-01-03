import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Hardcoded token as requested by the user
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBhdXNtYy5vcmciLCJyb2xlSWQiOjQsInJvbGVOYW1lIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3NjY1OTIxNTIsImV4cCI6MTc2NjY3ODU1Mn0.6xht6C_HifW8uKqa6gkJ44jQvKOTTGJPFNFJnJ3ipKk";

export enum ApplicationStatus {
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    IN_REVIEW = 'IN_REVIEW'
}

export interface Role {
    id: number;
    name: string;
    description?: string | null;
    organizationId?: number | null;
    organizationName?: string | null;
    organization?: Organization | null;
}

export interface Permission {
    id: number;
    key: string;
    label: string;
    description: null | string;
    grantedRoles: number[];
    category?: string;
}

export interface Category {
    id: number;
    name: string;
    description: string;
    displayOrder?: number;
    permissions?: Permission[];
}

export interface Equipment {
    id: number;
    applicationId: number;
    type: string;
    description: string;
    serialNumber: string | null;
    quantity: number;
    value: string;
    currency: string;
    isDrone: boolean;
    needsSpecialCare: boolean;
    status: string;
    notes: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ApplicationFormData {
    city: string;
    email: string;
    phone: string;
    country: string;
    has_drone: string;
    last_name: string;
    first_name: string;
    occupation: string;
    citizenship: string;
    arrival_date: string;
    address_line_1: string;
    address_line_2: string;
    place_of_birth: string;
    passport_number: string;
    zip_postal_code: string;
    country_of_birth: string;
    declaration_status: string;
    special_requirements: string;
    accommodation_details: string;
    state_province_region: string;
    airlines_and_flight_number: string;
    departure_country_and_city: string;
    [key: string]: any;
}

export interface Application {
    id: number;
    userId: number;
    formId: number;
    status: ApplicationStatus | string;
    requiresDroneClearance: boolean;
    entranceBadgeIssued: boolean;
    verificationStatus: string;
    immigrationStatus: string;
    immigrationVerifiedBy: string | null;
    immigrationVerifiedAt: string | null;
    immigrationNotes: string | null;
    equipmentStatus: string;
    equipmentVerifiedBy: string | null;
    equipmentVerifiedAt: string | null;
    equipmentNotes: string | null;
    droneStatus: string;
    droneVerifiedBy: string | null;
    droneVerifiedAt: string | null;
    droneNotes: string | null;
    formData: ApplicationFormData;
    createdAt: string;
    updatedAt: string;
    user: {
        id: number;
        fullName: string;
        email: string;
    };
    form: {
        form_id: number;
        name: string;
        type: string;
    };
    equipment: Equipment[];
}

export interface Organization {
    id: number;
    name: string;
    description: string;
    logo: string | null;
    logoUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: number;
    fullName: string;
    email: string;
    password?: string; // Only for creation/update
    status: string;
    roleId: number;
    createdAt: string;
    updatedAt: string;
    role?: Role;
    roleName?: string;
}

export interface FormFieldTemplate {
    template_id: number;
    field_name: string;
    field_type: string;
    label: string;
    is_required: boolean;
    validation_criteria: string | null;
    field_options: string | null;
    display_order: number;
    visibility_condition: string | null;
    created_at: string;
    updated_at: string;
}

export interface EmailTemplate {
    id: number;
    templateName: string;
    emailSubject: string;
    description: string;
    emailContent: string;
    dynamicVariables: string[] | string; // API might return stringified JSON or array
    attachmentUrl: string | null;
    type: 'APPROVED' | 'REJECTED' | null;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LandingPageSettings {
    id: number;
    heroMotto: string;
    description: string;
    mainLogoUrl: string | null;
    footerLogoUrl: string | null;
    heroBackgroundUrl: string | null;
    deadlineDate: string | null;
    privacyPolicyContent: string;
    contactEmail: string;
    contactLink: string;
    languages: { name: string; code: string; flagEmoji: string }[];
    gallery: string[];
    heroSectionConfig: any;
    processTrackerConfig: any;
    infoSectionConfig: any;
    footerConfig: any;
    createdAt: string;
    updatedAt: string;
}

export interface LandingPageResponse {
    success: boolean;
    message: string;
    data: LandingPageSettings;
}

export interface EmailTemplatesResponse {
    success: boolean;
    message: string;
    data: {
        templates: EmailTemplate[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

// Workflow Types
export interface WorkflowStep {
    id: number;
    name: string;
    key: string; // Unique identifier like 'immigration_check'
    description: string;
    displayOrder: number;
    isActive: boolean;
    requiredRole: string | 'ICS' | 'SECURITY_OFFICER' | 'CUSTOM_OFFICER' | 'INSA_OFFICER' | 'MEDIA_LIAISON';
    formId: number | null;
    icon: string | null;
    color: string | null; // Hex color code
    dependencyType: 'ALL' | 'ANY' | 'NONE';
    dependsOn: string[]; // Array of step KEYs that this step depends on
    createdAt: string;
    updatedAt: string;
}

export interface CreateWorkflowStepPayload {
    name: string;
    key: string;
    description: string;
    displayOrder: number;
    requiredRole: string;
    formId: number | null;
    icon: string | null;
    color: string | null;
    dependencyType: 'ALL' | 'ANY' | 'NONE';
    dependsOn: string[];
}

export interface UpdateWorkflowStepPayload {
    name?: string;
    key?: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
    requiredRole?: string;
    formId?: number | null;
    icon?: string | null;
    color?: string | null;
    dependencyType?: 'ALL' | 'ANY' | 'NONE';
    dependsOn?: string[];
}

export interface BulkUpdateWorkflowStepsPayload {
    steps: Partial<WorkflowStep>[];
}

// Response Wrappers
export interface WorkflowStepsResponse {
    success: boolean;
    message: string;
    data: WorkflowStep[];
}

export interface SingleWorkflowStepResponse {
    success: boolean;
    message: string;
    data: WorkflowStep;
}

// Badge Templates
export interface BadgeTemplate {
    id: number;
    name: string;
    description: string;
    htmlContent: string;
    cssStyles: string;
    badgeType: string;
    logoUrl: string | null;
    width: number;
    height: number;
    dynamicVariables: string; // JSON string array
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

// Badge Configurations
export interface BadgeConfig {
    id: number;
    name: string;
    templateId: number;
    template?: BadgeTemplate;
    logoUrl: string | null;
    headerUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    qrSize: number;
    qrX: number;
    qrY: number;
    layoutConfig: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBadgeConfigPayload {
    name: string;
    templateId: number;
    logoUrl?: string;
    headerUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    qrSize?: number;
    qrX?: number;
    qrY?: number;
    layoutConfig?: string;
    isActive?: boolean;
}

export interface BadgeProfile {
    id: number;
    userHash: string;
    applicationId: number;
    application?: Application;
    fullName: string;
    organization: string;
    title: string;
    photoUrl: string | null;
    expiryDate: string | null;
    metadata: string | null;
    createdAt: string;
    updatedAt: string;
}

// Invitation Templates
export interface InvitationTemplate {
    id: number;
    name: string;
    description: string | null;
    htmlContent: string;
    cssStyles: string;
    dynamicVariables: string; // JSON string array
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LetterConfig {
    id: number;
    name: string;
    description?: string;
    templateId: number;
    template?: InvitationTemplate;
    logoUrl?: string;
    headerText?: string;
    paragraphs: string[];
    footerText?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLetterConfigPayload {
    name: string;
    description?: string;
    templateId: number;
    logoUrl?: string;
    headerText?: string;
    paragraphs: string[];
    footerText?: string;
    isActive?: boolean;
}

export interface SentInvitationLog {
    id: number;
    userId: number;
    user?: User;
    configId: number;
    config?: LetterConfig;
    recipientEmail: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: string;
    errorMessage?: string;
    createdAt: string;
}

export interface CreateInvitationTemplatePayload {
    name: string;
    description?: string;
    htmlContent: string;
    cssStyles: string;
    dynamicVariables: string[];
    isDefault?: boolean;
}

export interface CreateBadgeTemplatePayload {
    name: string;
    description?: string;
    htmlContent: string;
    cssStyles: string;
    badgeType: string;
    logoUrl?: string | null;
    width: number;
    height: number;
    dynamicVariables: string[];
    isDefault?: boolean;
}

export interface SingleBadgeTemplateResponse {
    success: boolean;
    message: string;
    data: BadgeTemplate;
}

export interface BadgeTemplatesResponse {
    success: boolean;
    message: string;
    data: BadgeTemplate[];
}

// Form Type for selection in workflow step
export interface Form {
    form_id: number;
    name: string;
    type: string;
    status: string;
    created_at: string;
    updated_at: string;
}

// Responses
export interface RolesResponse {
    success: boolean;
    data: {
        roles: Role[];
    };
}

export interface MatrixResponse {
    categories: Category[];
    roles: Role[];
}

export interface BulkUpdatePayload {
    updates: {
        roleId: string;
        permissionId: string;
        granted: string;
    }[];
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: {
            id: number;
            fullName: string;
            email: string;
            roleId: number;
            roleName: string;
            permissions: Permission[];
        };
        token: string;
    };
}

export interface ApplicationsResponse {
    success: boolean;
    message: string;
    data: {
        applications: Application[];
        total: number;
        currentPage: number;
        totalPages: number;
    };
}

export interface OrganizationsResponse {
    success: boolean;
    message: string;
    data: {
        organizations: Organization[];
        total: number;
        currentPage: number;
        totalPages: number;
    };
}

export interface DashboardMetric {
    value: number;
    label: string;
    trend?: 'up' | 'down' | 'stable';
    progress?: number;
    percentage?: number;
}

export interface DashboardKeyMetrics {
    totalRegistered: DashboardMetric;
    fullyAccredited: DashboardMetric;
    pendingApproval: DashboardMetric;
    totalRejected: DashboardMetric;
}

export interface DashboardStatus {
    value: number;
    percentage: number;
    color: string;
}

export interface DashboardJournalistStatus {
    approved: DashboardStatus;
    rejected: DashboardStatus;
    pending: DashboardStatus;
}

export interface DashboardOrgType {
    name: string;
    count: number;
    color: string;
}

export interface DashboardCountry {
    name: string;
    count: number;
    color: string;
    code: string;
}

export interface DashboardAuthorityDecision {
    authority: string;
    icon: string;
    approved?: number;
    rejected?: number;
    visaGranted?: number;
    visaDenied?: number;
    allowedEntry?: number;
    deniedEntry?: number;
    color: string;
}

export interface DashboardJournalistEntry {
    date: string;
    day: string;
    total: number;
    foreign: number;
}

export interface DashboardFilterOptions {
    organizations: string[];
    countries: string[];
    statuses: string[];
}

export interface DashboardData {
    form: { id: string; name: string } | null;
    keyMetrics: DashboardKeyMetrics;
    journalistStatus: DashboardJournalistStatus;
    mediaOrganizationType: DashboardOrgType[];
    countries: DashboardCountry[];
    decisionsAndApprovals: DashboardAuthorityDecision[];
    journalistsEntered: DashboardJournalistEntry[];
    filterOptions: DashboardFilterOptions;
}

export interface DashboardForm {
    id: string;
    name: string;
}

export interface DashboardDataResponse {
    success: boolean;
    message: string;
    data: DashboardData;
}

export interface DashboardFormsResponse {
    success: boolean;
    message: string;
    data: DashboardForm[];
}

export interface UsersResponse {
    success: boolean;
    message: string;
    data: {
        users: User[];
        total: number;
        currentPage: number;
        totalPages: number;
    };
}

export const FILE_BASE_URL = 'http://localhost:3000';
// export const FILE_BASE_URL = 'https://cw761gt5-3000.uks1.devtunnels.ms';

export const getFileUrl = (path?: string | null): string => {
    if (!path) {
        console.log('[getFileUrl] empty path:', path);
        return '';
    }

    const trimmedPath = path.trim();
    if (!trimmedPath) {
        console.log('[getFileUrl] blank path after trim');
        return '';
    }

    // 🔁 Replace localhost base URL if present
    if (/^https?:\/\/localhost:3000/i.test(trimmedPath)) {
        const replaced = trimmedPath.replace(
            /^https?:\/\/localhost:3000/i,
            FILE_BASE_URL
        );
        console.log('[getFileUrl] replaced localhost URL:', replaced);
        return replaced;
    }

    // ✅ Keep other absolute URLs as-is
    if (/^https?:\/\//i.test(trimmedPath)) {
        console.log('[getFileUrl] absolute URL:', trimmedPath);
        return trimmedPath;
    }

    // ✅ Handle relative paths
    const separator = trimmedPath.startsWith('/') ? '' : '/';
    const finalUrl = `${FILE_BASE_URL}${separator}${trimmedPath}`;

    console.log('[getFileUrl] resolved URL:', finalUrl);
    return finalUrl;
};



export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: `${FILE_BASE_URL}/api/v1`,
        prepareHeaders: (headers) => {
            const dynamicToken = localStorage.getItem('managment_token');
            if (dynamicToken) {
                headers.set('authorization', `Bearer ${dynamicToken}`);
            } else {
                headers.set('authorization', `Bearer ${TOKEN}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Role', 'Permission', 'Category', 'Application', 'Organization', 'User', 'EmailTemplate', 'LandingPage', 'Workflow', 'Badge', 'Invitation'],
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, any>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        getRoles: builder.query<Role[], void>({
            query: () => '/roles',
            transformResponse: (response: RolesResponse) => response.data.roles,
            providesTags: ['Role'],
        }),
        createRole: builder.mutation<Role, Partial<Role>>({
            query: (body) => ({
                url: '/roles',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Role'],
        }),
        updateRole: builder.mutation<Role, { id: number, data: Partial<Role> }>({
            query: ({ id, data }) => ({
                url: `/roles/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Role'],
        }),
        getPermissionsMatrix: builder.query<MatrixResponse, void>({
            query: () => '/permissions/matrix',
            providesTags: ['Permission', 'Category'],
        }),
        getCategories: builder.query<Category[], void>({
            query: () => '/permissions/categories',
            transformResponse: (response: any) => {
                if (Array.isArray(response)) return response;
                if (response?.data?.categories) return response.data.categories;
                if (Array.isArray(response?.data)) return response.data;
                return [];
            },
            providesTags: ['Category'],
        }),
        createPermission: builder.mutation<Permission, Partial<Permission>>({
            query: (body) => ({
                url: '/permissions/resources',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Permission'],
        }),
        deletePermission: builder.mutation<void, number>({
            query: (id) => ({
                url: `/permissions/permissions/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Permission'],
        }),
        createCategory: builder.mutation<Category, Partial<Category>>({
            query: (body) => ({
                url: '/permissions/categories',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Category'],
        }),
        updateCategory: builder.mutation<Category, { id: number; data: Partial<Category> }>({
            query: ({ id, data }) => ({
                url: `/permissions/categories/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Category'],
        }),
        deleteCategory: builder.mutation<void, number>({
            query: (id) => ({
                url: `/permissions/categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Category'],
        }),
        togglePermission: builder.mutation<void, { roleId: number, permissionId: number, granted: boolean }>({
            query: ({ roleId, permissionId, granted }) => ({
                url: `/permissions/roles/${roleId}/permissions/${permissionId}/toggle`,
                method: 'PUT',
                body: { granted: String(granted) }
            }),
            invalidatesTags: ['Permission'],
            async onQueryStarted({ roleId, permissionId, granted }, { dispatch, queryFulfilled }) {
                // Optimistic logic...
                const patchResult = dispatch(
                    api.util.updateQueryData('getPermissionsMatrix', undefined, (draft) => {
                        draft.categories.forEach(cat => {
                            cat.permissions?.forEach(perm => {
                                if (perm.id === permissionId) {
                                    if (granted) {
                                        if (!perm.grantedRoles.includes(roleId)) {
                                            perm.grantedRoles.push(roleId);
                                        }
                                    } else {
                                        perm.grantedRoles = perm.grantedRoles.filter(id => id !== roleId);
                                    }
                                }
                            });
                        });
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),
        bulkUpdatePermissions: builder.mutation<void, BulkUpdatePayload>({
            query: (body) => ({
                url: '/permissions/roles/bulk-permissions',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Permission'],
        }),
        // Applications
        getApplications: builder.query<ApplicationsResponse['data'], { page?: number; limit?: number } | void>({
            query: (params) => {
                const page = params && 'page' in params ? params.page : 1;
                const limit = params && 'limit' in params ? params.limit : 10;
                return `/applications?page=${page}&limit=${limit}`;
            },
            transformResponse: (response: ApplicationsResponse) => response.data,
            providesTags: ['Application'],
        }),
        getApplicationById: builder.query<Application, string>({
            query: (id) => `/applications/${id}`,
            transformResponse: (response: any) => response.data || response,
            providesTags: (result, error, id) => [{ type: 'Application', id }],
        }),
        updateApplicationStatus: builder.mutation<void, { applicationId: number, status: string }>({
            query: (body) => ({
                url: '/verification/status',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Application'],
        }),
        getApprovedApplications: builder.query<ApplicationsResponse['data'], { page?: number; limit?: number } | void>({
            query: (params) => {
                const page = params && 'page' in params ? params.page : 1;
                const limit = params && 'limit' in params ? params.limit : 10;
                return `/applications/approved?page=${page}&limit=${limit}`;
            },
            transformResponse: (response: ApplicationsResponse) => response.data,
            providesTags: ['Application'],
        }),
        // Organizations
        getOrganizations: builder.query<Organization[], void>({
            query: () => '/organizations',
            transformResponse: (response: OrganizationsResponse) => response.data.organizations,
            providesTags: ['Organization'],
        }),
        createOrganization: builder.mutation<Organization, FormData>({
            query: (formData) => ({
                url: '/organizations',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Organization'],
        }),
        updateOrganization: builder.mutation<Organization, { id: number; data: FormData | Partial<Organization> }>({
            query: ({ id, data }) => ({
                url: `/organizations/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Organization'],
        }),
        // Users
        getUsers: builder.query<User[], void>({
            query: () => '/users',
            transformResponse: (response: UsersResponse) => response.data.users,
            providesTags: ['User'],
        }),
        createUser: builder.mutation<User, Partial<User>>({
            query: (body) => ({
                url: '/users',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),
        updateUser: builder.mutation<User, { id: number, data: Partial<User> }>({
            query: ({ id, data }) => ({
                url: `/users/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),
        // Form Templates
        getFormFieldTemplates: builder.query<FormFieldTemplate[], void>({
            query: () => '/form-field-templates',
            transformResponse: (response: { templates: FormFieldTemplate[] }) => response.templates,
        }),
        createForm: builder.mutation<any, any>({
            query: (body) => ({
                url: '/forms',
                method: 'POST',
                body,
            }),
        }),
        getFormById: builder.query<any, string>({
            query: (id) => `/forms/${id}`,
        }),
        updateForm: builder.mutation<any, { id: number; data: any }>({
            query: ({ id, data }) => ({
                url: `/forms/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteForm: builder.mutation<void, number>({
            query: (id) => ({
                url: `/forms/${id}`,
                method: 'DELETE',
            }),
        }),
        // Email Templates
        getEmailTemplates: builder.query<EmailTemplatesResponse['data'], { page?: number; limit?: number } | void>({
            query: (params) => {
                const page = params && 'page' in params ? params.page : 1;
                const limit = params && 'limit' in params ? params.limit : 10;
                return `/email-templates?page=${page}&limit=${limit}`;
            },
            transformResponse: (response: EmailTemplatesResponse) => response.data,
            providesTags: ['EmailTemplate'],
        }),
        getEmailTemplateById: builder.query<EmailTemplate, string>({
            query: (id) => `/email-templates/${id}`,
            transformResponse: (response: any) => response.data,
            providesTags: (result, error, id) => [{ type: 'EmailTemplate', id }],
        }),
        createEmailTemplate: builder.mutation<EmailTemplate, FormData>({
            query: (body) => ({
                url: '/email-templates',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['EmailTemplate'],
        }),
        updateEmailTemplate: builder.mutation<EmailTemplate, { id: number; data: FormData }>({
            query: ({ id, data }) => ({
                url: `/email-templates/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['EmailTemplate'],
        }),
        setDefaultEmailTemplate: builder.mutation<EmailTemplate, number>({
            query: (id) => ({
                url: `/email-templates/${id}/default`,
                method: 'PATCH',
            }),
            invalidatesTags: ['EmailTemplate'],
        }),
        deleteEmailTemplate: builder.mutation<void, number>({
            query: (id) => ({
                url: `/email-templates/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['EmailTemplate'],
        }),
        // Landing Page
        getLandingPageSettings: builder.query<LandingPageSettings, void>({
            query: () => '/landing-page/settings',
            transformResponse: (response: LandingPageResponse) => response.data,
            providesTags: ['LandingPage'],
        }),
        createLandingPageSettings: builder.mutation<LandingPageSettings, FormData>({
            query: (body) => ({
                url: '/landing-page/settings',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['LandingPage'],
        }),
        deleteLandingPageSettings: builder.mutation<void, void>({
            query: () => ({
                url: '/landing-page/settings',
                method: 'DELETE',
            }),
            invalidatesTags: ['LandingPage'],
        }),

        // Workflow Steps
        getWorkflowSteps: builder.query<WorkflowStep[], void>({
            query: () => '/workflow-steps',
            transformResponse: (response: WorkflowStepsResponse) => response.data,
            providesTags: ['Workflow'],
        }),
        createWorkflowStep: builder.mutation<WorkflowStep, CreateWorkflowStepPayload>({
            query: (body) => ({
                url: '/workflow-steps',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Workflow'],
        }),
        updateWorkflowStep: builder.mutation<WorkflowStep, { id: number; data: UpdateWorkflowStepPayload }>({
            query: ({ id, data }) => ({
                url: `/workflow-steps/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Workflow'],
        }),
        deleteWorkflowStep: builder.mutation<void, number>({
            query: (id) => ({
                url: `/workflow-steps/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Workflow'],
        }),
        bulkUpdateWorkflowSteps: builder.mutation<void, BulkUpdateWorkflowStepsPayload>({
            query: (body) => ({
                url: '/workflow-steps/bulk',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Workflow'],
        }),
        // Forms (for selection in workflow)
        getForms: builder.query<Form[], void>({
            query: () => '/forms',
            transformResponse: (response: { forms: Form[] }) => response.forms,
        }),
        // Badge Templates
        getBadgeTemplates: builder.query<BadgeTemplate[], void>({
            query: () => '/badges/templates',
            transformResponse: (response: BadgeTemplatesResponse) => response.data,
            providesTags: ['Badge'],
        }),
        createBadgeTemplate: builder.mutation<BadgeTemplate, CreateBadgeTemplatePayload>({
            query: (body) => ({
                url: '/badges/templates',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Badge'],
        }),
        updateBadgeTemplate: builder.mutation<BadgeTemplate, { id: number; data: Partial<CreateBadgeTemplatePayload> }>({
            query: ({ id, data }) => ({
                url: `/badges/templates/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Badge'],
        }),
        deleteBadgeTemplate: builder.mutation<void, number>({
            query: (id) => ({
                url: `/badges/templates/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Badge'],
        }),

        // Dashboard Endpoints
        getDashboardForms: builder.query<DashboardForm[], void>({
            query: () => '/dashboard/forms',
            transformResponse: (response: DashboardFormsResponse) => response.data,
        }),
        getDashboardData: builder.query<DashboardData, { formName?: string }>({
            query: ({ formName }) => {
                const params = new URLSearchParams();
                if (formName && formName !== 'all') {
                    params.append('formName', formName);
                }
                return `/dashboard/data?${params.toString()}`;
            },
            transformResponse: (response: DashboardDataResponse) => response.data,
        }),
        // Invitation Endpoints
        getInvitationTemplates: builder.query<InvitationTemplate[], void>({
            query: () => '/invitations/templates',
            transformResponse: (response: any) => response.data || response,
            providesTags: ['Invitation'],
        }),
        getInvitationTemplateById: builder.query<InvitationTemplate, number>({
            query: (id) => `/invitations/templates/${id}`,
            transformResponse: (response: any) => response.data || response,
            providesTags: (result, error, id) => [{ type: 'Invitation', id }],
        }),
        createInvitationTemplate: builder.mutation<InvitationTemplate, CreateInvitationTemplatePayload>({
            query: (payload) => ({
                url: '/invitations/templates',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Invitation'],
        }),
        updateInvitationTemplate: builder.mutation<InvitationTemplate, { id: number; data: Partial<CreateInvitationTemplatePayload> }>({
            query: ({ id, data }) => ({
                url: `/invitations/templates/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Invitation'],
        }),
        deleteInvitationTemplate: builder.mutation<void, number>({
            query: (id) => ({
                url: `/invitations/templates/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Invitation'],
        }),

        // LetterConfig Endpoints
        getLetterConfigs: builder.query<LetterConfig[], void>({
            query: () => '/invitations/configs',
            transformResponse: (response: any) => response.data || response,
            providesTags: ['Invitation'],
        }),
        getLetterConfigById: builder.query<LetterConfig, number>({
            query: (id) => `/invitations/configs/${id}`,
            transformResponse: (response: any) => response.data || response,
            providesTags: (result, error, id) => [{ type: 'Invitation', id }],
        }),
        createLetterConfig: builder.mutation<LetterConfig, CreateLetterConfigPayload>({
            query: (payload) => ({
                url: '/invitations/configs',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Invitation'],
        }),
        updateLetterConfig: builder.mutation<LetterConfig, { id: number; data: Partial<CreateLetterConfigPayload> }>({
            query: ({ id, data }) => ({
                url: `/invitations/configs/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Invitation'],
        }),
        deleteLetterConfig: builder.mutation<void, number>({
            query: (id) => ({
                url: `/invitations/configs/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Invitation'],
        }),

        // Bulk Sending
        bulkSendInvitations: builder.mutation<any, { configId: number; users: any[] }>({
            query: (payload) => ({
                url: '/invitations/bulk-send',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Invitation'],
        }),
        getSentInvitationLogs: builder.query<SentInvitationLog[], void>({
            query: () => '/invitations/sent-logs', // You might need to add this route to backend if not exists
            transformResponse: (response: any) => response.data || response,
            providesTags: ['Invitation'],
        }),
        // Badge Configurations
        getBadgeConfigs: builder.query<BadgeConfig[], void>({
            query: () => '/badges/configs',
            transformResponse: (response: any) => response.data || response,
            providesTags: ['Badge'],
        }),
        getBadgeConfigById: builder.query<BadgeConfig, number>({
            query: (id) => `/badges/configs/${id}`,
            transformResponse: (response: any) => response.data || response,
            providesTags: (result, error, id) => [{ type: 'Badge', id }],
        }),
        createBadgeConfig: builder.mutation<BadgeConfig, CreateBadgeConfigPayload>({
            query: (payload) => ({
                url: '/badges/configs',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Badge'],
        }),
        updateBadgeConfig: builder.mutation<BadgeConfig, { id: number; data: Partial<CreateBadgeConfigPayload> }>({
            query: ({ id, data }) => ({
                url: `/badges/configs/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Badge'],
        }),
        deleteBadgeConfig: builder.mutation<void, number>({
            query: (id) => ({
                url: `/badges/configs/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Badge'],
        }),
        getBadgeProfileByHash: builder.query<BadgeProfile, string>({
            query: (hash) => `/badges/profile/${hash}`,
            transformResponse: (response: any) => response.data || response,
        }),
        bulkGenerateBadges: builder.mutation<Blob, { applicationIds: number[]; configId?: number }>({
            query: (body) => ({
                url: '/badges/bulk',
                method: 'POST',
                body,
                responseHandler: (response) => response.blob(),
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useGetRolesQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useGetPermissionsMatrixQuery,
    useGetCategoriesQuery,
    useCreatePermissionMutation,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useTogglePermissionMutation,
    useBulkUpdatePermissionsMutation,
    useDeletePermissionMutation,
    useGetApplicationsQuery,
    useGetApplicationByIdQuery,
    useUpdateApplicationStatusMutation,
    useGetApprovedApplicationsQuery,
    useGetOrganizationsQuery,
    useCreateOrganizationMutation,
    useUpdateOrganizationMutation,
    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useGetFormFieldTemplatesQuery,
    useGetEmailTemplatesQuery,
    useGetEmailTemplateByIdQuery,
    useCreateEmailTemplateMutation,
    useUpdateEmailTemplateMutation,
    useDeleteEmailTemplateMutation,
    useSetDefaultEmailTemplateMutation,
    useGetLandingPageSettingsQuery,
    useCreateLandingPageSettingsMutation,
    useDeleteLandingPageSettingsMutation,

    // New Workflow hooks
    useGetWorkflowStepsQuery,
    useCreateWorkflowStepMutation,
    useUpdateWorkflowStepMutation,
    useDeleteWorkflowStepMutation,
    useBulkUpdateWorkflowStepsMutation,
    // Forms
    useGetFormsQuery,
    useGetFormByIdQuery,
    useUpdateFormMutation,
    useDeleteFormMutation,
    useCreateFormMutation,
    // Badge Templates
    useGetBadgeTemplatesQuery,
    useCreateBadgeTemplateMutation,
    useUpdateBadgeTemplateMutation,
    useDeleteBadgeTemplateMutation,
    // Invitation Hooks
    useGetInvitationTemplatesQuery,
    useCreateInvitationTemplateMutation,
    useUpdateInvitationTemplateMutation,
    useDeleteInvitationTemplateMutation,
    useGetInvitationTemplateByIdQuery,
    // LetterConfig Hooks
    useGetLetterConfigsQuery,
    useGetLetterConfigByIdQuery,
    useCreateLetterConfigMutation,
    useUpdateLetterConfigMutation,
    useDeleteLetterConfigMutation,
    useBulkSendInvitationsMutation,
    useGetSentInvitationLogsQuery,
    // Badge Config Hooks
    useGetBadgeConfigsQuery,
    useGetBadgeConfigByIdQuery,
    useCreateBadgeConfigMutation,
    useUpdateBadgeConfigMutation,
    useDeleteBadgeConfigMutation,
    useGetBadgeProfileByHashQuery,
    useBulkGenerateBadgesMutation,
    // Dashboard Hooks
    useGetDashboardFormsQuery,
    useGetDashboardDataQuery,
} = api;
