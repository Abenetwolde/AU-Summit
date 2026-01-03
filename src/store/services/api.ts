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

// export const FILE_BASE_URL = 'https://cw761gt5-3000.uks1.devtunnels.ms';
export const FILE_BASE_URL = 'http://localhost:3000';
// Super Admin Dashboard Types
export interface SuperAdminMetric {
    value: number;
    percentage: number;
    trend: 'up' | 'down';
    label: string;
}

export interface SuperAdminOverview {
    totalApplications: SuperAdminMetric;
    approvedApplications: SuperAdminMetric;
    pendingApplications: SuperAdminMetric;
}

export interface SuperAdminCharts {
    timeSeries: { date: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
    roleDistribution: { roleName: string; count: number }[];
}

export interface SuperAdminStakeholder {
    name: string;
    value: number;
}

export interface SuperAdminStakeholderStatus {
    [stakeholderName: string]: {
        APPROVED: number;
        REJECTED: number;
        PENDING: number;
    };
}

export interface SuperAdminPerformance {
    stakeholder: string;
    averageProcessingTimeMinutes: number;
    trend: { date: string; value: number }[];
}

export interface SuperAdminOverviewResponse {
    success: boolean;
    message: string;
    data: SuperAdminOverview;
}

export interface SuperAdminChartsResponse {
    success: boolean;
    message: string;
    data: SuperAdminCharts;
}

export interface SuperAdminStakeholdersResponse {
    success: boolean;
    message: string;
    data: SuperAdminStakeholder[];
}

export interface SuperAdminStakeholderStatusResponse {
    success: boolean;
    message: string;
    data: SuperAdminStakeholderStatus;
}

export interface SuperAdminPerformanceResponse {
    success: boolean;
    message: string;
    data: SuperAdminPerformance[];
}

// Admin Dashboard Types (Limited Admin)
export interface AdminKPI {
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'neutral';
    label: string;
}

export interface AdminAnalyticsData {
    kpis: {
        totalApplicationsReceived: AdminKPI;
        approvedByYou: AdminKPI;
        pendingDecision: AdminKPI;
    };
    chartData: {
        timeSeries: { date: string; count: number }[];
        statusDistribution: { status: string; count: number }[];
        orgDistribution: { name: string; value: number }[];
    };
    performance: {
        averageProcessingTimeMinutes: number;
        label: string;
    };
    recentActivity: {
        id: number;
        applicationId: number;
        applicant: string;
        status: string;
        actionAt: string;
        notes: string | null;
    }[];
}

export interface AdminAnalyticsResponse {
    success: boolean;
    message: string;
    data: AdminAnalyticsData;
}

// export const FILE_BASE_URL = 'http://localhost:5000';
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
            query: (credentials: any) => ({
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
        approveWorkflowStep: builder.mutation<void, { applicationId: number, stepKey: string, status: 'APPROVED' | 'REJECTED', notes?: string }>({
            query: ({ applicationId, stepKey, ...body }) => ({
                url: `/applications/${applicationId}/approve/${stepKey}`,
                method: 'PUT',
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
        getWorkflowApplications: builder.query<ApplicationsResponse['data'], { page?: number; limit?: number; search?: string } | void>({
            query: (params) => {
                const page = params && 'page' in params ? params.page : 1;
                const limit = params && 'limit' in params ? params.limit : 10;
                const search = params && 'search' in params ? params.search : '';
                return `/dynamic/applications?page=${page}&limit=${limit}&search=${search}`;
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
        // Super Admin Dashboard Endpoints
        getSuperAdminOverview: builder.query<SuperAdminOverview, void>({
            query: () => '/super-admin/overview',
            transformResponse: (response: SuperAdminOverviewResponse) => response.data,
        }),
        getSuperAdminCharts: builder.query<SuperAdminCharts, void>({
            query: () => '/super-admin/charts',
            transformResponse: (response: SuperAdminChartsResponse) => response.data,
        }),
        getSuperAdminStakeholders: builder.query<SuperAdminStakeholder[], void>({
            query: () => '/super-admin/stakeholders',
            transformResponse: (response: SuperAdminStakeholdersResponse) => response.data,
        }),
        getSuperAdminStakeholderStatus: builder.query<SuperAdminStakeholderStatus, void>({
            query: () => '/super-admin/stakeholder-status',
            transformResponse: (response: SuperAdminStakeholderStatusResponse) => response.data,
        }),
        getSuperAdminPerformance: builder.query<SuperAdminPerformance[], void>({
            query: () => '/super-admin/performance',
            transformResponse: (response: SuperAdminPerformanceResponse) => response.data,
        }),
        getAdminAnalytics: builder.query<AdminAnalyticsData, void>({
            query: () => '/admins/analytics',
            transformResponse: (response: AdminAnalyticsResponse) => response.data,
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
    useApproveWorkflowStepMutation,
    useGetApprovedApplicationsQuery,
    useGetWorkflowApplicationsQuery,
    useGetOrganizationsQuery,
    useCreateOrganizationMutation,
    useUpdateOrganizationMutation,
    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useGetFormFieldTemplatesQuery,
    useCreateFormMutation,
    useGetEmailTemplatesQuery,
    useGetEmailTemplateByIdQuery,
    useCreateEmailTemplateMutation,
    useUpdateEmailTemplateMutation,
    useDeleteEmailTemplateMutation,
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
    // Dashboard Hooks
    useGetDashboardFormsQuery,
    useGetDashboardDataQuery,

    // Super Admin Dashboard Hooks
    useGetSuperAdminOverviewQuery,
    useGetSuperAdminChartsQuery,
    useGetSuperAdminStakeholdersQuery,
    useGetSuperAdminStakeholderStatusQuery,
    useGetSuperAdminPerformanceQuery,
    useGetAdminAnalyticsQuery,
} = api;
