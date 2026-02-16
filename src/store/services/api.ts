import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Hardcoded token as requested by the user

export enum ApplicationStatus {
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    IN_REVIEW = 'IN_REVIEW'
}

export interface RegistrationStats {
    coverage: { name: string; value: number }[];
    mediaType: { name: string; value: number }[];
    totalApplications: number;
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
    categoryId?: number | string | null;
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

export interface ApplicationApproval {
    id: number;
    applicationId: number;
    workflowStepId: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_REVIEW' | 'NOT_APPLICABLE';
    notes: string | null;
    rejectionDetails: any | null;
    isResubmitted: boolean;
    verifiedBy: number | null;
    verifiedAt: string | null;
    workflowStep?: WorkflowStep;
}

export interface Document {
    id: number;
    applicationId: number;
    type: 'PASS' | 'VISA_LETTER' | 'CLEARANCE';
    filePath: string;
    createdAt: string;
    updatedAt: string;
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
        externalPlatform?: string;
    };
    form: {
        form_id: number;
        name: string;
        type: string;
        categories?: any[];
        FormFields?: any[];
    };
    equipment: Equipment[];
    approvals?: ApplicationApproval[];
    documents?: Document[];
    applyingFromCountryId?: number | null;
    applyingFromCountry?: Country;
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

export interface Country {
    id: number;
    code: string;
    name: string;
}

export interface Embassy {
    id: number;
    name: string;
    address?: string;
    contactPhone?: string;
    contactEmail?: string;
    overseeingCountries: Country[];
}

export interface AirlineOffice {
    id: number;
    name: string;
    address?: string;
    city?: string;
    contactPhone?: string;
    contactEmail: string;
    overseeingCountries: Country[];
}

export interface User {
    id: number;
    fullName: string;
    email: string;
    password?: string; // Only for creation/update
    status: string;
    roleId: number;
    organizationId?: number;
    createdAt: string;
    updatedAt: string;
    role?: Role;
    roleName?: string;
    permissions?: string[];
    workflowStepKey?: string;
    country?: string;
    embassyId?: number;
    embassy?: {
        id: number;
        name: string;
    };
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
    category?: {
        name: string;
        description?: string;
        icon?: string;
    };
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
    heroBackgroundUrls: string[];
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
    dependsOn: number[]; // Array of step IDs that this step depends on
    emailStep: boolean; // Controls if this step triggers the email
    targetAudience: 'LOCAL' | 'INTERNATIONAL';
    isExitStep: boolean;
    triggersExitStatus: boolean;
    emailTemplateId?: number;
    branchCondition?: any;
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
    dependsOn: number[];
    emailStep?: boolean;
    targetAudience?: 'LOCAL' | 'INTERNATIONAL';
    isExitStep?: boolean;
    triggersExitStatus?: boolean;
    emailTemplateId?: number;
    branchCondition?: any;
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
    dependsOn?: number[];
    emailStep?: boolean;
    targetAudience?: 'LOCAL' | 'INTERNATIONAL';
    isExitStep?: boolean;
    triggersExitStatus?: boolean;
    emailTemplateId?: number;
    branchCondition?: any;
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

// Notifications
export interface Notification {
    id: number;
    userId: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    applicationId?: number;
    workflowStepId?: number;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationsResponse {
    count: number;
    rows: Notification[];
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

export interface GeneratedBadge {
    id: number;
    applicationId: number;
    application?: Application;
    configId: number;
    config?: BadgeConfig;
    qrUrl: string;
    status: 'pending' | 'generated' | 'failed';
    filePath?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ApplicationWithBadgeStatus extends Application {
    hasBadge: boolean;
    latestBadge?: GeneratedBadge | null;
}

export interface ApplicationsWithBadgeStatusResponse {
    data: {
        applications: ApplicationWithBadgeStatus[];
        total: number;
        currentPage: number;
        totalPages: number;
    };
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
            workflowStepKey?: string;
        };
        token: string;
        requirePasswordChange?: boolean;
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

export interface DuplicateApplication {
    applicationId: number;
    firstName: string;
    lastName: string;
    country: string;
    passportNumber: string;
    status: string;
    createdAt: string;
}

export interface UserWithDuplicates {
    userId: number;
    fullName: string;
    email: string;
    applications: DuplicateApplication[];
}

export interface UserApplicationHistoryResponse {
    success: boolean;
    data: {
        users: UserWithDuplicates[];
        total: number;
        currentPage: number;
        totalPages: number;
    };
}


// API Management Types
export enum IntegrationTrigger {
    APPLICATION_CREATED = 'APPLICATION_CREATED',
    STATUS_CHANGED = 'STATUS_CHANGED',
    IMMIGRATION_VERIFIED = 'IMMIGRATION_VERIFIED',
    EQUIPMENT_VERIFIED = 'EQUIPMENT_VERIFIED',
    DRONE_VERIFIED = 'DRONE_VERIFIED',
    FINAL_APPROVAL = 'FINAL_APPROVAL'
}

export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE'
}

export interface ApiProvider {
    id: number;
    name: string;
    baseUrl: string;
    headers?: any;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IntegrationConfig {
    id: number;
    providerId: number;
    triggerEvent: IntegrationTrigger;
    endpoint: string;
    method: HttpMethod;
    requestMapping?: any;
    responseMapping?: any;
    isActive: boolean;
    order: number;
    provider?: ApiProvider;
    createdAt: string;
    updatedAt: string;
}

export interface ApiProvidersResponse {
    success: boolean;
    message: string;
    data: ApiProvider[];
}

export interface IntegrationsResponse {
    success: boolean;
    message: string;
    data: IntegrationConfig[];
}

export interface SingleApiProviderResponse {
    success: boolean;
    message: string;
    data: ApiProvider;
}

export interface SingleIntegrationResponse {
    success: boolean;
    message: string;
    data: IntegrationConfig;
}

export enum EquipmentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export interface UpdateEquipmentStatusPayload {
    equipmentId: number;
    status: EquipmentStatus;
    rejectionReason?: string;
    notes?: string;
}

export const FILE_BASE_URL = 'https://api.arrivalclearance.gov.et';
// export const FILE_BASE_URL = 'http://localhost:3001';
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
    totalEntered?: SuperAdminMetric;
    totalExited?: SuperAdminMetric;
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

export interface OfficerKPI {
    id: number;
    name: string;
    email: string;
    role: string;
    organization: string;
    totalProcessed: number;
    approved: number;
    rejected: number;
    avgDecisionTimeMinutes: number;
    successRate: number;
}

export interface OrganizationKPI {
    id: number;
    name: string;
    totalProcessed: number;
    approved: number;
    rejected: number;
    avgDecisionTimeMinutes: number;
    successRate: number;
}

export interface OfficerPerformanceResponse {
    officers: OfficerKPI[];
    organizations: OrganizationKPI[];
    throughputTrend: { date: string; count: number }[];
    timeframe: string;
    totalProcessedGlobal: number;
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

export interface EntryExitStats {
    entry: {
        approved: number;
        pending: number;
        rejected: number;
        total: number;
        percentage: number;
        trend: 'up' | 'down';
    };
    exit: {
        approved: number;
        pending: number;
        rejected: number;
        total: number;
        percentage: number;
        trend: 'up' | 'down';
    };
}

export interface EntryExitStatsResponse {
    success: boolean;
    message: string;
    data: EntryExitStats;
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
        rejectedByYou: AdminKPI;
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
    mofaData?: {
        embassyStats: {
            name: string;
            approved: number;
            rejected: number;
            pending: number;
            total: number;
        }[];
        roleDistribution: {
            name: string;
            total: number;
            pending: number;
            approved: number;
            rejected: number;
        }[];
    };
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
    if (/^https?:\/\/arrivalclearance.gov.et/i.test(trimmedPath)) {
        const replaced = trimmedPath.replace(
            /^https?:\/\/arrivalclearance.gov.et/i,
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

    // ✅ Handle relative paths (normalize backslashes to forward slashes for URLs)
    const normalizedPath = trimmedPath.replace(/\\/g, '/');
    const separator = normalizedPath.startsWith('/') ? '' : '/';
    const finalUrl = `${FILE_BASE_URL}${separator}${normalizedPath}`;

    console.log('[getFileUrl] resolved URL:', finalUrl);
    return finalUrl;
};



// Accreditation Types
export interface AccreditationStatus {
    id: number;
    applicationId: number;
    emailStatus: 'pending' | 'sent' | 'failed';
    badgeStatus: 'pending' | 'generated' | 'failed';
    invitationStatus: 'pending' | 'generated' | 'failed' | 'not_required';
    qrCodeStatus: 'pending' | 'generated' | 'failed';
    missingAttachments: string[];
    lastAttemptAt: string | null;
    errorLog: string | null;
    application?: Application;
}

export interface AccreditationStatusesResponse {
    data: AccreditationStatus[];
    total: number;
    currentPage: number;
    totalPages: number;
}


const baseQuery = fetchBaseQuery({
    baseUrl: `${FILE_BASE_URL}/api/v1`,
    credentials: 'include',
    prepareHeaders: (headers) => {
        return headers;
    },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
    let result = await baseQuery(args, api, extraOptions);
    if (result.error && result.error.status === 401) {
        localStorage.removeItem('managment_user');
        localStorage.removeItem('managment_token');
        // Let the auth context handle redirect or stay here
        // window.location.href = '/login'; 
    }
    return result;
};

export const api = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Role', 'Permission', 'Application', 'Form', 'User', 'Category', 'WorkflowStep', 'Invitation', 'Badge', 'EquipCatalog', 'Integration', 'APIProvider', 'Embassy', 'Country', 'Organization', 'EmailTemplate', 'LandingPage', 'Workflow', 'Notification', 'AirlineOffice', 'AccreditationStatus', 'Entries', 'SuperAdmin'],
    endpoints: (builder) => ({
        getRegistrationStats: builder.query<RegistrationStats, void>({
            query: () => '/analytics/stats',
            transformResponse: (response: { success: boolean, data: RegistrationStats }) => response.data,
        }),
        login: builder.mutation<LoginResponse, any>({
            query: (credentials: any) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        getAccreditationStatuses: builder.query<AccreditationStatusesResponse, { page?: number; limit?: number; search?: string }>({
            query: ({ page = 1, limit = 10, search = '' }) => `/accreditation/statuses?page=${page}&limit=${limit}&search=${search}`,
            providesTags: ['AccreditationStatus']
        }),
        resendAccreditation: builder.mutation<{ message: string }, number>({
            query: (applicationId) => ({
                url: `/accreditation/resend/${applicationId}`,
                method: 'POST',
            }),
            invalidatesTags: ['AccreditationStatus']
        }),
        syncAccreditation: builder.mutation<{ message: string; count: number }, void>({
            query: () => ({
                url: '/accreditation/sync',
                method: 'POST',
            }),
            invalidatesTags: ['AccreditationStatus']
        }),
        logout: builder.mutation<{ success: boolean }, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
        }),
        getMe: builder.query<any, void>({
            query: () => '/auth/me',
            transformResponse: (response: any) => response.data || response,
        }),
        changePassword: builder.mutation<any, any>({
            query: (data) => ({
                url: '/auth/change-password',
                method: 'POST',
                body: data,
            }),
        }),


        // Notifications
        getNotifications: builder.query<NotificationsResponse, { page?: number; limit?: number }>({
            query: ({ page = 1, limit = 20 }) => `/notifications?page=${page}&limit=${limit}`,
            providesTags: ['Notification'],
        }),
        getUnreadNotificationCount: builder.query<{ unreadCount: number }, void>({
            query: () => '/notifications/unread-count',
            providesTags: ['Notification'],
        }),
        markNotificationAsRead: builder.mutation<Notification, number>({
            query: (id) => ({
                url: `/notifications/${id}/read`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Notification'],
        }),
        markAllNotificationsAsRead: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/notifications/read-all',
                method: 'PATCH',
            }),
            invalidatesTags: ['Notification'],
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
        getApplicationsByForm: builder.query<ApplicationsResponse, { formId: number, page?: number, limit?: number }>({
            query: ({ formId, page = 1, limit = 10 }) => `/applications/form/${formId}?page=${page}&limit=${limit}`,
            providesTags: ['Application'],
        }),

        // API Management Endpoints
        getApiProviders: builder.query<ApiProvider[], void>({
            query: () => '/api-management/providers',
            transformResponse: (response: ApiProvidersResponse) => response.data,
            providesTags: ['ApiProvider' as any],
        }),
        createApiProvider: builder.mutation<ApiProvider, Partial<ApiProvider>>({
            query: (body) => ({
                url: '/api-management/providers',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['ApiProvider' as any],
        }),
        updateApiProvider: builder.mutation<ApiProvider, { id: number, data: Partial<ApiProvider> }>({
            query: ({ id, data }) => ({
                url: `/api-management/providers/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['ApiProvider' as any],
        }),
        deleteApiProvider: builder.mutation<void, number>({
            query: (id) => ({
                url: `/api-management/providers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ApiProvider' as any, 'Integration' as any],
        }),

        getIntegrations: builder.query<IntegrationConfig[], void>({
            query: () => '/api-management/integrations',
            transformResponse: (response: IntegrationsResponse) => response.data,
            providesTags: ['Integration' as any],
        }),
        createIntegration: builder.mutation<IntegrationConfig, Partial<IntegrationConfig>>({
            query: (body) => ({
                url: '/api-management/integrations',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Integration' as any],
        }),
        updateIntegration: builder.mutation<IntegrationConfig, { id: number, data: Partial<IntegrationConfig> }>({
            query: ({ id, data }) => ({
                url: `/api-management/integrations/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Integration' as any],
        }),
        deleteIntegration: builder.mutation<void, number>({
            query: (id) => ({
                url: `/api-management/integrations/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Integration' as any],
        }),
        getApplications: builder.query<ApplicationsResponse['data'], { page?: number; limit?: number } | void>({
            query: (params) => {
                const page = params && 'page' in params ? params.page : 1;
                const limit = params && 'limit' in params ? params.limit : 10;
                return `/applications?page=${page}&limit=${limit}`;
            },
            transformResponse: (response: ApplicationsResponse) => response.data,
            providesTags: ['Application'],
        }),
        getUserApplicationHistory: builder.query<UserApplicationHistoryResponse['data'], { page?: number; limit?: number; search?: string } | void>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params?.page) queryParams.append('page', params.page.toString());
                if (params?.limit) queryParams.append('limit', params.limit.toString());
                if (params?.search) queryParams.append('search', params.search);
                return `/applications/duplicates?${queryParams.toString()}`;
            },
            transformResponse: (response: UserApplicationHistoryResponse) => response.data,
            providesTags: ['Application'],
        }),
        getApplicationById: builder.query<Application, number>({
            query: (id) => `/applications/${id}`,
            transformResponse: (response: any) => response.data || response,
            providesTags: (_result, _error, id) => [{ type: 'Application', id }],
        }),

        // --- Embassy Management ---
        getEmbassies: builder.query<Embassy[], void>({
            query: () => '/embassies',
            transformResponse: (response: any) => response.data || response,
            providesTags: ['Embassy'],
        }),
        getCountries: builder.query<Country[], void>({
            query: () => '/embassies/countries',
            transformResponse: (response: any) => response.data || response,
            providesTags: ['Country'],
        }),
        createEmbassy: builder.mutation<Embassy, Partial<Embassy> & { countryIds?: number[] }>({
            query: (body) => ({
                url: '/embassies',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Embassy'],
        }),
        updateEmbassy: builder.mutation<Embassy, { id: number; data: Partial<Embassy> & { countryIds?: number[] } }>({
            query: ({ id, data }) => ({
                url: `/embassies/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Embassy'],
        }),
        deleteEmbassy: builder.mutation<void, number>({
            query: (id) => ({
                url: `/embassies/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Embassy'],
        }),
        // --- Airline Office Management ---
        getAirlineOffices: builder.query<AirlineOffice[], void>({
            query: () => '/airline-offices',
            transformResponse: (response: any) => response.data || response,
            providesTags: ['AirlineOffice'],
        }),
        createAirlineOffice: builder.mutation<AirlineOffice, Partial<AirlineOffice> & { countryIds?: number[] }>({
            query: (body) => ({
                url: '/airline-offices',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['AirlineOffice'],
        }),
        updateAirlineOffice: builder.mutation<AirlineOffice, { id: number; data: Partial<AirlineOffice> & { countryIds?: number[] } }>({
            query: ({ id, data }) => ({
                url: `/airline-offices/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['AirlineOffice'],
        }),
        deleteAirlineOffice: builder.mutation<void, number>({
            query: (id) => ({
                url: `/airline-offices/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AirlineOffice'],
        }),
        updateApplicationStatus: builder.mutation<void, { applicationId: number, status: string }>({
            query: (body) => ({
                url: '/verification/status',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Application'],
        }),
        approveWorkflowStep: builder.mutation<void, { applicationId: number, stepKey: string, stepId?: number, status: 'APPROVED' | 'REJECTED', notes?: string, rejectionDetails?: any }>({
            query: ({ applicationId, stepKey, stepId, ...body }) => ({
                url: `/applications/${applicationId}/approve/${stepKey}`,
                method: 'PUT',
                body: { ...body, stepId }, // Explicitly include stepId in the body
            }),
            invalidatesTags: ['Application'],
        }),
        activateExitWorkflow: builder.mutation<void, number>({
            query: (id) => ({
                url: `/applications/${id}/activate-exit-workflow`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Application', id }],
        }),
        // Two-Phase Workflow Endpoints
        getEntryWorkflowApplications: builder.query<ApplicationsResponse['data'], { page?: number; limit?: number; search?: string; status?: string; nationality?: string; startDate?: string; endDate?: string; hasDrone?: boolean; declarationStatus?: boolean }>({
            query: (params = {}) => {
                const { page = 1, limit = 10, search = '', status = '', nationality = '', startDate = '', endDate = '', hasDrone, declarationStatus } = params;
                const queryParams = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                    ...(search && { search }),
                    ...(status && { status }),
                    ...(nationality && { nationality }),
                    ...(startDate && { startDate }),
                    ...(endDate && { endDate }),
                    ...(hasDrone !== undefined && { hasDrone: String(hasDrone) }),
                    ...(declarationStatus !== undefined && { declarationStatus: String(declarationStatus) })
                });
                return `/applications/entry-workflow?${queryParams}`;
            },
            transformResponse: (response: ApplicationsResponse) => response.data,
            providesTags: ['Application'],
        }),
        getExitWorkflowApplications: builder.query<ApplicationsResponse['data'], { page?: number; limit?: number; search?: string; status?: string; nationality?: string; startDate?: string; endDate?: string; hasDrone?: boolean; declarationStatus?: boolean }>({
            query: (params = {}) => {
                const { page = 1, limit = 10, search = '', status = '', nationality = '', startDate = '', endDate = '', hasDrone, declarationStatus } = params;
                const queryParams = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                    ...(search && { search }),
                    ...(status && { status }),
                    ...(nationality && { nationality }),
                    ...(startDate && { startDate }),
                    ...(endDate && { endDate }),
                    ...(hasDrone !== undefined && { hasDrone: String(hasDrone) }),
                    ...(declarationStatus !== undefined && { declarationStatus: String(declarationStatus) })
                });
                return `/applications/exit-workflow?${queryParams}`;
            },
            transformResponse: (response: ApplicationsResponse) => response.data,
            providesTags: ['Application'],
        }),
        initializeExitWorkflow: builder.mutation<void, number>({
            query: (id) => ({
                url: `/applications/${id}/initialize-exit`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Application', id }, 'Application'],
        }),
        getApplicationPhaseStatus: builder.query<any, number>({
            query: (id) => `/applications/${id}/phase-status`,
            transformResponse: (response: any) => response.data || response,
            providesTags: (_result, _error, id) => [{ type: 'Application', id }],
        }),
        getApprovedApplications: builder.query<ApplicationsResponse['data'], { page?: number; limit?: number; search?: string; country?: string; date?: string } | void>({
            query: (params) => {
                const page = params && 'page' in params ? params.page : 1;
                const limit = params && 'limit' in params ? params.limit : 10;
                const search = params && 'search' in params ? params.search : '';
                const country = params && 'country' in params ? params.country : '';
                const date = params && 'date' in params ? params.date : '';

                let url = `/applications/approved?page=${page}&limit=${limit}`;
                if (search) url += `&search=${encodeURIComponent(search)}`;
                if (country) url += `&country=${encodeURIComponent(country)}`;
                if (date) url += `&date=${encodeURIComponent(date)}`;

                return url;
            },
            transformResponse: (response: ApplicationsResponse) => response.data,
            providesTags: ['Application'],
        }),
        getWorkflowApplications: builder.query<ApplicationsResponse['data'], { page?: number; limit?: number; search?: string; nationality?: string } | void>({
            query: (params) => {
                const page = params && 'page' in params ? params.page : 1;
                const limit = params && 'limit' in params ? params.limit : 10;
                const search = params && 'search' in params ? params.search : '';
                const nationality = params && 'nationality' in params ? params.nationality : '';
                return `/dynamic/applications?page=${page}&limit=${limit}&search=${search}&nationality=${nationality}`;
            },
            transformResponse: (response: ApplicationsResponse) => response.data,
            providesTags: ['Application'],
        }),
        getFilteredApplications: builder.query<ApplicationsResponse['data'], { page?: number; limit?: number; search?: string; country: string }>({
            query: ({ page = 1, limit = 10, search = '', country }) => {
                return `/applications/filter/country?page=${page}&limit=${limit}&search=${search}&country=${country}`;
            },
            transformResponse: (response: ApplicationsResponse) => response.data,
            providesTags: ['Application'],
        }),
        createManualApplication: builder.mutation<Application, any>({
            query: (body) => ({
                url: '/applications/manual-entry',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Application', 'User'],
        }),
        getManualApplications: builder.query<ApplicationsResponse['data'], { page?: number; limit?: number; search?: string }>({
            query: ({ page = 1, limit = 10, search = '' }) => `/applications?page=${page}&limit=${limit}&search=${search}&is_manual=true`,
            transformResponse: (response: ApplicationsResponse) => response.data,
            providesTags: ['Application'],
        }),
        updateApplication: builder.mutation<Application, { id: number; data: any }>({
            query: ({ id, data }) => ({
                url: `/applications/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Application', id }, 'Application'],
        }),
        updateManualApplication: builder.mutation<Application, { id: number; data: any }>({
            query: ({ id, data }) => ({
                url: `/applications/${id}/manual-update`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Application', id }, 'Application'],
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
        getUsers: builder.query<{ users: User[]; total: number; currentPage: number; totalPages: number }, { page?: number; limit?: number; search?: string; roleId?: number; status?: 'ACTIVE' | 'INACTIVE' } | void>({
            query: (params) => ({
                url: '/users',
                params: params || {},
            }),
            transformResponse: (response: UsersResponse) => response.data,
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

        // Add this endpoint to the endpoints builder (you can place it near other equipment/verification endpoints)
        updateEquipmentStatus: builder.mutation<Equipment, UpdateEquipmentStatusPayload>({
            query: ({ equipmentId, status, rejectionReason, notes }) => ({
                url: `/equipment/equipment/${equipmentId}/status`,
                method: 'PATCH',
                body: {
                    status,
                    ...(rejectionReason && { rejectionReason }),
                    ...(notes && { notes }),
                },
            }),
            invalidatesTags: (result, error, { equipmentId }) => [
                { type: 'Application', id: 'LIST' },
                { type: 'Application', id: equipmentId },
            ],
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
        exportProfilePictures: builder.query<Blob, void>({
            query: () => ({
                url: '/export/profile-pictures',
                method: 'GET',
                responseHandler: (response: any) => response.blob()
            }),
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
            providesTags: (_result, _error, id) => [{ type: 'Badge', id }],
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
        getPublicBadgeProfileByAppId: builder.query<any, number | string>({
            query: (applicationId) => `/badges/public/application/${applicationId}`,
            transformResponse: (response: any) => response.data || response,
        }),
        bulkGenerateBadges: builder.mutation<Blob, { applicationIds: number[]; configId?: number }>({
            query: (body) => ({
                url: '/badges/bulk',
                method: 'POST',
                body,
                responseHandler: (response: any) => response.blob(),
            }),
        }),
        getBadgeHistory: builder.query<GeneratedBadge[], void>({
            query: () => '/badges/history',
            transformResponse: (response: any) => response.data,
            providesTags: ['Badge']
        }),
        downloadBadge: builder.mutation<Blob, number>({
            query: (id) => ({
                url: `/badges/download/${id}`,
                method: 'GET',
                responseHandler: (response: any) => response.blob(),
            }),
        }),
        generateBadge: builder.mutation<{ success: boolean; message: string; data: any }, number>({
            query: (id) => ({
                url: `/badges/generate/${id}`,
                method: 'POST',
            }),
            invalidatesTags: ['Badge', 'Application'],
        }),
        getApplicationsWithBadgeStatus: builder.query<ApplicationsWithBadgeStatusResponse['data'], { page?: number; limit?: number; search?: string; status?: 'all' | 'generated' | 'ungenerated' }>({
            query: ({ page = 1, limit = 10, search = '', status = 'all' }) => `/badges/applications?page=${page}&limit=${limit}&search=${search}&status=${status}`,
            transformResponse: (response: ApplicationsWithBadgeStatusResponse) => response.data,
            providesTags: ['Badge', 'Application']
        }),

        // Organization User Management (ORG_ADMIN)
        getOrganizationUsers: builder.query<{ users: User[]; total: number; currentPage: number; totalPages: number }, { page?: number; limit?: number; search?: string; roleId?: number; organizationId?: number }>({
            query: ({ page = 1, limit = 10, search, roleId, organizationId }) => {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString(),
                });
                if (search) params.append('search', search);
                if (roleId) params.append('roleId', roleId.toString());
                if (organizationId) params.append('organizationId', organizationId.toString());
                return `/organization/users?${params}`;
            },
            transformResponse: (response: any) => response.data,
            providesTags: ['User'],
        }),
        createOrganizationUser: builder.mutation<User, { fullName: string; email: string; password: string; roleId: number; organizationId?: number; embassyId?: number }>({
            query: (body) => ({
                url: '/organization/users',
                method: 'POST',
                body,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['User'],
        }),
        updateOrganizationUser: builder.mutation<User, { id: number; data: { fullName?: string; email?: string; roleId?: number; status?: 'ACTIVE' | 'INACTIVE'; organizationId?: number; embassyId?: number } }>({
            query: ({ id, data }) => ({
                url: `/organization/users/${id}`,
                method: 'PUT',
                body: data,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['User'],
        }),
        deleteOrganizationUser: builder.mutation<void, { id: number; organizationId?: number }>({
            query: ({ id, organizationId }) => ({
                url: `/organization/users/${id}`,
                method: 'DELETE',
                params: organizationId ? { organizationId } : undefined
            }),
            invalidatesTags: ['User'],
        }),

        // Roles Endpoints
        getRoles: builder.query<{ roles: Role[]; total: number; currentPage: number; totalPages: number }, { page?: number; limit?: number; search?: string } | void>({
            query: (params) => {
                if (!params) return '/roles';
                const { page = 1, limit = 30, search } = params;
                const queryParams = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString(),
                });
                if (search) queryParams.append('search', search);
                return `/roles?${queryParams.toString()}`;
            },
            transformResponse: (response: any) => response.data || response,
            providesTags: ['Role'],
        }),
        createRole: builder.mutation<Role, { name: string; description?: string; organizationId?: number | null }>({
            query: (body) => ({
                url: '/roles',
                method: 'POST',
                body,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['Role'],
        }),
        updateRole: builder.mutation<Role, { id: number; data: { name?: string; description?: string; organizationId?: number | null } }>({
            query: ({ id, data }) => ({
                url: `/roles/${id}`,
                method: 'PUT',
                body: data,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['Role'],
        }),
        getOrganizationRoles: builder.query<Role[], number | void>({
            query: (organizationId) => {
                const url = '/organization/users/roles/available';
                return organizationId ? `${url}?organizationId=${organizationId}` : url;
            },
            transformResponse: (response: any) => response.data,
            providesTags: ['Role'],
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
        getSuperAdminEntryExitStats: builder.query<EntryExitStats, { timeframe?: string }>({
            query: (params) => ({
                url: '/dashboard/entry-exit-stats',
                method: 'GET',
                params
            }),
            transformResponse: (response: EntryExitStatsResponse) => response.data,
        }),
        getSuperAdminStakeholders: builder.query<SuperAdminStakeholder[], void>({
            query: () => '/super-admin/stakeholders',
            transformResponse: (response: SuperAdminStakeholdersResponse) => response.data,
        }),
        getSuperAdminStakeholderStatus: builder.query<SuperAdminStakeholderStatus, { type?: 'ENTRY' | 'EXIT' } | void>({
            query: (params) => {
                const type = params && 'type' in params ? params.type : 'ENTRY';
                return `/super-admin/stakeholder-status?type=${type}`;
            },
            transformResponse: (response: SuperAdminStakeholderStatusResponse) => response.data,
        }),
        getSuperAdminPerformance: builder.query<SuperAdminPerformance[], void>({
            query: () => '/super-admin/performance',
            transformResponse: (response: SuperAdminPerformanceResponse) => response.data,
        }),
        getAdminAnalytics: builder.query<AdminAnalyticsData, void>({
            query: () => '/admin/analytics',
            transformResponse: (response: AdminAnalyticsResponse) => response.data,
        }),
        getAdminEntryExitStats: builder.query<EntryExitStats, { timeframe?: string }>({
            query: (params) => ({
                url: '/admin/entry-exit-stats',
                method: 'GET',
                params
            }),
            transformResponse: (response: EntryExitStatsResponse) => response.data,
        }),
        getAdminOfficerKPIs: builder.query<OfficerPerformanceResponse, { timeframe?: string }>({
            query: (params) => ({
                url: '/admin/officer-kpis',
                method: 'GET',
                params
            }),
            transformResponse: (response: any) => response.data,
        }),
        getSuperAdminOfficerPerformance: builder.query<OfficerPerformanceResponse, { timeframe?: string }>({
            query: (params) => ({
                url: '/super-admin/officer-performance',
                method: 'GET',
                params
            }),
            transformResponse: (response: any) => response.data,
        }),
        // Entry Endpoints
        getEntries: builder.query<EntriesResponse, { page: number; limit: number; search?: string; status?: string }>({
            query: ({ page, limit, search, status }) => ({
                url: '/entry',
                params: { page, limit, search, status }
            }),
            providesTags: ['Entries']
        }),

        markAsEntered: builder.mutation<{ message: string; entry: JournalistEntry }, { applicationId: number; location?: string }>({
            query: (body) => ({
                url: '/entry/mark',
                method: 'POST',
                body
            }),
            invalidatesTags: ['Entries', 'SuperAdmin']
        }),

        markAsExited: builder.mutation<{ message: string; entry: JournalistEntry }, { applicationId: number }>({
            query: (body) => ({
                url: '/entry/mark-exit',
                method: 'POST',
                body
            }),
            invalidatesTags: ['Entries', 'SuperAdmin']
        }),

        getEntryStats: builder.query<{ totalEntered: number; totalExited: number }, void>({
            query: () => '/entry/stats'
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
    useLazyGetApplicationsQuery,
    useGetApplicationByIdQuery,
    useGetEmbassiesQuery,
    useGetCountriesQuery,
    useCreateEmbassyMutation,
    useUpdateEmbassyMutation,
    useDeleteEmbassyMutation,
    useUpdateApplicationStatusMutation,
    useApproveWorkflowStepMutation,
    useActivateExitWorkflowMutation,
    useGetApprovedApplicationsQuery,
    useGetWorkflowApplicationsQuery,
    useLazyGetWorkflowApplicationsQuery,
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
    useUpdateEquipmentStatusMutation,
    useGetEntryWorkflowApplicationsQuery,
    useGetExitWorkflowApplicationsQuery,
    useInitializeExitWorkflowMutation,
    useGetApplicationPhaseStatusQuery,
    useCreateManualApplicationMutation,

    // Notifications
    useGetNotificationsQuery,
    useGetUnreadNotificationCountQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,


    // New Workflow hooks
    useGetWorkflowStepsQuery,
    useCreateWorkflowStepMutation,
    useUpdateWorkflowStepMutation,
    useDeleteWorkflowStepMutation,
    useBulkUpdateWorkflowStepsMutation,
    useGetUserApplicationHistoryQuery,
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
    useGetPublicBadgeProfileByAppIdQuery,
    useBulkGenerateBadgesMutation,
    useGetBadgeHistoryQuery,
    useDownloadBadgeMutation,
    useGenerateBadgeMutation,
    useGetApplicationsWithBadgeStatusQuery,
    // Dashboard Hooks
    useGetDashboardFormsQuery,
    useGetDashboardDataQuery,

    // Super Admin Dashboard Hooks
    useGetSuperAdminOverviewQuery,
    useGetSuperAdminChartsQuery,
    useGetSuperAdminEntryExitStatsQuery,
    useGetSuperAdminStakeholdersQuery,
    useGetSuperAdminStakeholderStatusQuery,
    useGetSuperAdminPerformanceQuery,
    useGetAdminAnalyticsQuery,
    useGetAdminEntryExitStatsQuery,

    useGetAdminOfficerKPIsQuery,
    useGetSuperAdminOfficerPerformanceQuery,

    // API Management Hooks
    useGetApiProvidersQuery,
    useCreateApiProviderMutation,
    useUpdateApiProviderMutation,
    useDeleteApiProviderMutation,
    useGetIntegrationsQuery,
    useCreateIntegrationMutation,
    useUpdateIntegrationMutation,
    useDeleteIntegrationMutation,
    useChangePasswordMutation,

    // Organization User Management Hooks
    useGetOrganizationUsersQuery,
    useCreateOrganizationUserMutation,
    useUpdateOrganizationUserMutation,
    useDeleteOrganizationUserMutation,
    useGetOrganizationRolesQuery,


    // Airline Office Hooks
    useGetAirlineOfficesQuery,
    useCreateAirlineOfficeMutation,
    useUpdateAirlineOfficeMutation,
    useDeleteAirlineOfficeMutation,
    useGetRegistrationStatsQuery,
    useGetManualApplicationsQuery,
    useUpdateApplicationMutation,
    useUpdateManualApplicationMutation,
    useGetAccreditationStatusesQuery,
    useResendAccreditationMutation,
    useSyncAccreditationMutation,
    useLazyExportProfilePicturesQuery,
    useGetEntriesQuery,
    useMarkAsEnteredMutation,
    useMarkAsExitedMutation,
    useGetEntryStatsQuery,
} = api;

// Entry Management
// -----------------------------------------------------------------------------
export interface JournalistEntry {
    id: number;
    applicationId: number;
    application?: Application;
    entryDate?: string;
    enteredBy?: number;
    exitDate?: string;
    exitedBy?: number;
    location?: string;
    status: 'PENDING' | 'ENTERED' | 'EXITED';
    createdAt: string;
    updatedAt: string;
}

export interface EntriesResponse {
    total: number;
    totalPages: number;
    currentPage: number;
    entries: Application[]; // The controller returns Applications with journalistEntry included
}



