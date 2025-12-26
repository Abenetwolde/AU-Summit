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
    deadlineDate: string | null;
    privacyPolicyContent: string;
    contactEmail: string;
    contactLink: string;
    languages: { name: string; code: string; flagEmoji: string }[];
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

export const FILE_BASE_URL = 'https://cw761gt5-3000.uks1.devtunnels.ms';
//172.20.82.12:3000
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

    if (/^https?:\/\//i.test(trimmedPath)) {
        console.log('[getFileUrl] absolute URL:', trimmedPath);
        return trimmedPath;
    }

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
    tagTypes: ['Role', 'Permission', 'Category', 'Application', 'Organization', 'User', 'EmailTemplate', 'LandingPage'],
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
        createPermission: builder.mutation<Permission, Partial<Permission> & { categoryId: string | null }>({
            query: (body) => ({
                url: '/permissions/permissions',
                method: 'POST',
                body,
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
                method: 'PATCH',
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
    useCreateFormMutation,
    useGetEmailTemplatesQuery,
    useGetEmailTemplateByIdQuery,
    useCreateEmailTemplateMutation,
    useUpdateEmailTemplateMutation,
    useDeleteEmailTemplateMutation,
    useGetLandingPageSettingsQuery,
    useCreateLandingPageSettingsMutation,
    useDeleteLandingPageSettingsMutation
} = api;
