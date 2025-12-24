import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Hardcoded token as requested by the user
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBhdXNtYy5vcmciLCJyb2xlSWQiOjQsInJvbGVOYW1lIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3NjY1OTIxNTIsImV4cCI6MTc2NjY3ODU1Mn0.6xht6C_HifW8uKqa6gkJ44jQvKOTTGJPFNFJnJ3ipKk";

export interface Role {
    id: number;
    name: string;
    description?: string | null;
    organizationId?: number | null;
    organizationName?: string | null;
}

export interface Permission {
    id: number;
    key: string;
    label: string;
    description: null | string;
    grantedRoles: number[]; // Array of Role IDs
}

export interface Category {
    id: number;
    name: string;
    description: string;
    displayOrder?: number;
    permissions?: Permission[];
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
        granted: string; // "true" or "false"
    }[];
}

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://cw761gt5-3000.uks1.devtunnels.ms/api/v1',
        prepareHeaders: (headers) => {
            headers.set('authorization', `Bearer ${TOKEN}`);
            return headers;
        },
    }),
    tagTypes: ['Role', 'Permission', 'Category'],
    endpoints: (builder) => ({
        getRoles: builder.query<Role[], void>({
            query: () => '/roles',
            transformResponse: (response: RolesResponse) => response.data.roles,
            providesTags: ['Role'],
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
                body: { granted: String(granted) } // Convert boolean to "true"/"false" string as requested
            }),
            // access matrix cache to update optimistically or invalidate
            invalidatesTags: ['Permission'],
            async onQueryStarted({ roleId, permissionId, granted }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData('getPermissionsMatrix', undefined, (draft) => {
                        // Optimistic update
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
                url: '/permissions/roles/bulk-permissions', // Assuming endpoint name based on patterns
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Permission'],
        }),
    }),
});

export const {
    useGetRolesQuery,
    useGetPermissionsMatrixQuery,
    useGetCategoriesQuery,
    useCreatePermissionMutation,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useTogglePermissionMutation,
    useBulkUpdatePermissionsMutation
} = api;
