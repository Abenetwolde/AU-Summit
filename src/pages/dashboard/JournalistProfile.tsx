import React, { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Briefcase, Check, X, ShieldCheck, Download, ChevronLeft, Loader2, RotateCcw, History, ChevronRight, Filter, Building2, UserCheck, MessageSquare, CheckCircle2, XCircle, Clock, Building, ChevronDown, ChevronUp, Paperclip, Image as ImageIcon } from 'lucide-react';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';
import { SystemCheckSuccess } from '@/components/SystemCheckSuccess';
import { exportJournalistDetailToPDF, exportJournalistDetailToCSV, exportClearanceLetterToPDF } from '@/lib/export-utils';
import { useAuth, UserRole } from '@/auth/context';
import {
    useApproveWorkflowStepMutation,
    useActivateExitWorkflowMutation,
    Equipment as EquipmentType,
    useUpdateEquipmentStatusMutation,
    getFileUrl,
    FILE_BASE_URL,
    useGetFormFieldTemplatesQuery,
    useGetApplicationByIdQuery,
    useGetEquipmentByApplicationQuery
} from '@/store/services/api';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor, NoteAttachment } from '@/components/RichTextEditor';
import { DecisionNoteViewer } from '@/components/DecisionNoteViewer';

// Define EquipmentStatus enum to match backend
enum EquipmentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export function JournalistProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, checkPermission } = useAuth();
    // const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

    // Detect if accessed from Entry or Exit workflow pages
    // const currentPhase = location.pathname.includes('/exit-workflow') ? 'exit' :
                         location.pathname.includes('/entry-workflow') ? 'entry' : 'unknown';

    console.log(user);

    // Workflow Mutation
    const [approveWorkflow, { isLoading: isStatusUpdating }] = useApproveWorkflowStepMutation();
    // Equipment status mutation
    const [updateEquipmentStatus, { isLoading: isEquipmentUpdating }] = useUpdateEquipmentStatusMutation();
    // Exit Workflow mutation
    const [activateExit, { isLoading: isActivatingExit }] = useActivateExitWorkflowMutation();

    // Fetch dynamic form templates
    const { data: templates, isLoading: templatesLoading } = useGetFormFieldTemplatesQuery();

    const [notes, setNotes] = useState('');
    const [noteAttachments, setNoteAttachments] = useState<NoteAttachment[]>([]);
    const [isUploadingNoteFile, setIsUploadingNoteFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showSystemCheck, setShowSystemCheck] = useState(false);
    const [showConsentsExpanded, setShowConsentsExpanded] = useState(false);

    const handleNoteFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploadingNoteFile(true);
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('files', file));

        try {
            const token = localStorage.getItem('managment_token') || localStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const uploadUrl = `${FILE_BASE_URL}/api/v1/applications/decision-note-files/upload`;
            let res = await fetch(uploadUrl, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: formData
            });

            if (!res.ok && res.status === 404) {
                res = await fetch(`${FILE_BASE_URL}/api/v1/applications/decision-note-files/upload`, {
                    method: 'POST',
                    headers,
                    credentials: 'include',
                    body: formData
                });
            }

            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setNoteAttachments((prev) => [...prev, ...data.data]);
            } else if (data.data && Array.isArray(data.data)) {
                setNoteAttachments((prev) => [...prev, ...data.data]);
            }
            toast.success('File attached successfully');
        } catch (err) {
            console.error('Failed to upload decision note attachment:', err);
            toast.error('Failed to upload attachment');
        } finally {
            setIsUploadingNoteFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Equipment approval states
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
    const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStatus>(EquipmentStatus.PENDING);
    const [rejectionReason, setRejectionReason] = useState('');
    const [equipmentNotes, setEquipmentNotes] = useState('');

    // Equipment pagination & filter state
    const [eqFilter, setEqFilter] = useState<string>('PENDING');
    const [eqPage, setEqPage] = useState(1);
    const eqLimit = 10;

    // Field-specific rejection states
    const [showRejectionDialog, setShowRejectionDialog] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [fieldNotes, setFieldNotes] = useState<Record<string, string>>({});

    // Fetch application data solely by ID
    const { data: application, isLoading: applicationLoading } = useGetApplicationByIdQuery(Number(id), {
        skip: !id,
        refetchOnMountOrArgChange: true
    });

    // Server-side paginated equipment query
    const { data: eqData, isLoading: eqLoading, isFetching: eqFetching } = useGetEquipmentByApplicationQuery({
        applicationId: Number(id),
        page: eqPage,
        limit: eqLimit,
        ...(eqFilter !== 'ALL' && { status: eqFilter })
    }, {
        skip: !id,
        refetchOnMountOrArgChange: true
    });

    if (applicationLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">Loading Application Details...</p>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <ShieldCheck className="h-16 w-16 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-900">Application Not Found</h3>
                <p className="text-muted-foreground">The requested application could not be loaded.</p>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }

    // Removed manual useEffect for setting 'application' state -- direct usage of query data is preferred.
    // Removed MOCK_JOURNALISTS fallback.

    const countryName = (code: string) => code ? (en[code as keyof typeof en] || code) : 'Unknown';

    const handleDecision = async (status: 'APPROVED' | 'REJECTED' | 'PENDING', rejectionDetails?: any) => {
        if (!application) return;

        if (status === 'REJECTED' && !rejectionDetails) {
            setShowRejectionDialog(true);
            return;
        }

        // Ensure we have a workflow key
        const stepKey = user?.workflowStepKey;
        console.log('User Workflow Key:', stepKey);

        // Determine effective Step ID to modify
        let effectiveStepId: number | undefined;

        if (userActionableApproval) {
            // Priority: Use the specific approval record found for this form & user
            const step = (userActionableApproval as any).workflowStep || (userActionableApproval as any).approvalWorkflowStep;
            effectiveStepId = step?.id || (userActionableApproval as any).workflowStepId;
        }

        console.log('Effective Step ID:', effectiveStepId);

        if (!effectiveStepId && isSuperAdmin) {
            // Fallback for Super Admin: Find the first PENDING approval to act on in the CURRENT phase
            const approvalsList = (application.approvals || []).filter((a: any) => {
                const step = (a as any).workflowStep || (a as any).approvalWorkflowStep;
                if (!step) return false;
                if (currentPhase === 'exit') return step.isExitStep;
                if (currentPhase === 'entry') return !step.isExitStep;
                return true; // Default to allowing all if phase unknown
            });

            const pendingStep = approvalsList.find((a: any) => a.status === 'PENDING');

            if (pendingStep) {
                const step = (pendingStep as any).workflowStep || (pendingStep as any).approvalWorkflowStep;
                effectiveStepId = step?.id;
            } else if (approvalsList.length > 0) {
                // If no pending steps (e.g., all approved), act on the last one (e.g. to Revoke) in the current phase
                const lastStep = approvalsList[approvalsList.length - 1];
                const step = (lastStep as any).workflowStep || (lastStep as any).approvalWorkflowStep;
                effectiveStepId = step?.id;
            }
        }

        console.log('Effective Step ID (Final):', effectiveStepId);

        if (!effectiveStepId) {
            toast.error("No actionable workflow step found. Please verify the workflow configuration.");
            return;
        }

        try {
            await approveWorkflow({
                applicationId: Number(application.id),
                stepKey: 'legacy_fallback', // Backend ignores this as stepId takes precedence
                stepId: effectiveStepId, // NEW: Sending explicit ID
                status: status as any,
                notes,
                rejectionDetails, // NEW: Sending structured details
                noteAttachments
            }).unwrap();

            toast.success(`Application ${status.toLowerCase()} successfully`);

            // Optimistic Update removed as application comes from RTK Query
            setNotes('');
            setNoteAttachments([]);
            setShowRejectionDialog(false);
            setSelectedFields([]);
            setFieldNotes({});
        } catch (err: any) {
            toast.error(err?.data?.message || `Failed to ${status.toLowerCase()} application`);
        }
    };

    const handleActivateExit = async () => {
        if (!application) return;
        try {
            await activateExit(Number(application.id)).unwrap();
            toast.success("Exit workflow activated successfully");
            // Reload or refresh data
            navigate(0); // Simple reload to refresh the profile with new steps
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to activate exit workflow");
        }
    };

    // Handle equipment approval
    const handleEquipmentApproval = async (equipmentId: number, status: EquipmentStatus) => {
        if (!checkPermission('verification:equipment:single:update')) {
            toast.error("You don't have permission to update equipment status");
            return;
        }

        // Validate rejection reason if status is REJECTED
        if (status === EquipmentStatus.REJECTED && !rejectionReason.trim()) {
            toast.error('Rejection reason is required when rejecting equipment');
            return;
        }

        try {
            const payload = {
                status,
                rejectionReason: status === EquipmentStatus.REJECTED ? rejectionReason : undefined,
                notes: equipmentNotes || undefined
            };

            await updateEquipmentStatus({
                equipmentId,
                ...payload
            }).unwrap();

            toast.success(`Equipment ${status.toLowerCase()} successfully`);

            // UI update handled by RTK Query invalidation

            // Reset and close dialog
            setSelectedEquipment(null);
            setShowEquipmentDialog(false);
            setRejectionReason('');
            setEquipmentNotes('');
        } catch (err: any) {
            toast.error(err?.data?.message || `Failed to update equipment status`);
        }
    };

    // Open equipment approval dialog
    const openEquipmentDialog = (equipment: EquipmentType, status: EquipmentStatus) => {
        setSelectedEquipment(equipment);
        setEquipmentStatus(status);
        setShowEquipmentDialog(true);
    };

    if (!application || templatesLoading) {
        return <div className="p-8 text-center text-gray-500">Loading profile data...</div>;
    }

    // Data Mapping - Extensive
    const formData = application.formData || {};
    // Equipment now fetched via dedicated paginated query (eqData)
    const totalDeclaredEquipment = application.equipment?.length ?? eqData?.total ?? 0;

    const fullname = formData.first_name
        ? `${formData.first_name} ${formData.last_name || ''}`
        : (application.user?.fullName || 'Unknown');

    const roleTitle = formData.occupation || 'Journalist';
    const country = application.applyingFromCountry?.code || formData.country || 'ET';
    const fullCountryName = application.applyingFromCountry?.name || countryName(country);

    // Photo/Document Handling
    const getFiles = (field: any) => {
        if (!field) return [];
        return Array.isArray(field) ? field : [field];
    };

    const profilePhotos = getFiles(formData.profile_photo || formData.passport_photo);

    const photoUrl = profilePhotos.length > 0
        ? getFileUrl(profilePhotos[0])
        : "https://tse4.mm.bing.net/th/id/OIP.YjAp0OwzYdsFmoWOeoK57AHaEg?pid=Api&P=0&h=220";

    const organization = "News Org"; // Placeholder or from API if avail

    // Role Match Logic
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN || user?.roleName === 'SUPER_ADMIN';
    const userRoleStr = (user?.role || user?.roleName || user?.workflowStepKey || '').toUpperCase();
    const isPmoOrGc = userRoleStr.includes('PMO') || userRoleStr.includes('GC');
    const isMfaOfficer = userRoleStr.includes('MFA') || userRoleStr.includes('EFA');
    const approvals = application.approvals || [];

    const pmoGcApprovals = (application?.approvals || []).filter((a: any) => {
        const step = a.workflowStep || a.approvalWorkflowStep;
        const key = (step?.key || step?.name || step?.requiredRole || a.verifier?.roleName || a.verifier?.organization?.name || '').toUpperCase();
        return key.includes('PMO') || key.includes('GC');
    });

    const isCustoms = user?.role === UserRole.CUSTOMS_OFFICER;
    const isFromEntryApproval = (location.state as any)?.phase === 'entry' || 
                               (location.state as any)?.from === 'entry-workflow' ||
                               location.pathname.includes('/entry-workflow') ||
                               location.pathname.includes('/entry-control');

    const canUpdateEquipment = isFromEntryApproval && checkPermission('verification:equipment:single:update');

    // Find the relevant approval record for the current user based on authorized IDs AND Phase
    const currentPhase = (location.state as any)?.phase; // 'entry' or 'exit'

    // Form rendering priority: 1. Specific Form definition attached to application, 2. Global Templates
    const formCategories = application?.form?.categories;
    const formUncategorizedFields = (application?.form as any)?.FormFields;

    let displayCategories: { name: string; fields: any[] }[] = [];

    if (formCategories && formCategories.length > 0) {
        displayCategories = formCategories.map((cat: any) => ({
            name: cat.name,
            depends_on: cat.depends_on,
            fields: (cat.fields || []).map((f: any) => ({
                field_name: f.field_name,
                field_type: f.field_type,
                label: f.label,
                display_order: f.display_order,
                field_options: f.field_options
            }))
        }));

        if (formUncategorizedFields && formUncategorizedFields.length > 0) {
            displayCategories.push({
                name: 'Other Details',
                fields: formUncategorizedFields.map((f: any) => ({
                    field_name: f.field_name,
                    field_type: f.field_type,
                    label: f.label,
                    display_order: f.display_order,
                    field_options: f.field_options
                }))
            });
        }
    } else if (templates) {
        // Fallback to legacy template-based grouping
        const grouped = templates.reduce((acc: any, t: any) => {
            const cat = t.category?.name || 'Other Details';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push({
                field_name: t.field_name,
                field_type: t.field_type,
                label: t.label,
                display_order: t.display_order,
                field_options: t.field_options
            });
            return acc;
        }, {});

        displayCategories = Object.entries(grouped).map(([name, fields]) => ({
            name,
            fields: fields as any[]
        }));
    }

    // Filter out equipment category and categories with unmet depends_on conditions
    displayCategories = displayCategories
        .filter((cat: any) => {
            if (cat.name.toLowerCase() === 'equipment') return false;
            if (cat.depends_on) {
                const dep = cat.depends_on;
                const targetVal = String(formData[dep.field] || '').toLowerCase();
                const expectedVal = String(dep.value || '').toLowerCase();
                if (dep.operator === 'contains' && !targetVal.includes(expectedVal)) return false;
                if (dep.operator === 'eq' && targetVal !== expectedVal) return false;
            }
            return true;
        })
        .sort((a, b) => {
            // Try to maintain a reasonable default order if display_order isn't on category itself
            const order: Record<string, number> = {
                'Personal Details': 1,
                'Travel & Passport': 2,
                'Contact Information': 3,
                'Media Profile & Documents': 4,
                'Additional Information': 5,
                'Legal & Agreements': 6
            };
            return (order[a.name] || 99) - (order[b.name] || 99);
        });

    const userActionableApproval = (application?.approvals || []).find((a: any) => {
        const step = (a as any).workflowStep || (a as any).approvalWorkflowStep;
        if (!step) return false;

        // NEW: Phase Filtering
        // When coming from a specific workflow dashboard, we MUST only act on steps in that phase.
        if (currentPhase === 'exit' && !step.isExitStep) {
            console.log(`[Phase Check] Skipping Entry Step ${step.id} because we are in EXIT phase.`);
            return false;
        }
        if (currentPhase === 'entry' && step.isExitStep) {
            console.log(`[Phase Check] Skipping Exit Step ${step.id} because we are in ENTRY phase.`);
            return false;
        }

        const stepId = step.id || a.workflowStepId;
        const stepKey = step.key;

        // DEBUG: Detailed Trace for Authorization
        console.log(`[Step Authorization Trace] Checking Step ID:${stepId} (${stepKey})`);

        // 1. Find the corresponding authorized step in user object
        const userAuthStep = user?.authorizedWorkflowSteps?.find(s => Number(s.id) === Number(stepId));

        if (!userAuthStep) {
            return false;
        }

        console.log(`[Step Authorization Trace] ✅ User is authorized for Step ID:${stepId} (${userAuthStep.name})`);

        // 2. Authorization Check only
        // We no longer filter by status here, because we want to FIND the step 
        // that belongs to the user so we can show "Approve/Reject" OR "Revoke".

        console.log(`[Step Authorization Trace] ⭐ MATCH FOUND! User can act on/view Step ${stepId}.`);
        return true;
    });

    // Determine current user's approval status for this application


    // Legacy support for relevantStep used in rendering
    const relevantStep = (userActionableApproval as any)?.workflowStep || (userActionableApproval as any)?.approvalWorkflowStep;

    // Authorization
    const isExitPhase = relevantStep?.isExitStep;

    const canApprove = isSuperAdmin || !!userActionableApproval;

    // DEBUG: Permission Check
    // const hasDynamicApprove = checkPermission('application:approve:dynamic');
    // const hasManageExit = checkPermission('application:manage-exit-workflow');
    // console.log('DEBUG: canApprove breakdown:', {
    //     isSuperAdmin,
    //     isExitPhase,
    //     hasDynamicApprove,
    //     hasManageExit,
    //     hasActionableApproval: !!userActionableApproval,
    //     relevantStepId: relevantStep?.id,
    //     userPermissionsCount: user?.permissions?.length,
    //     userPermissions: user?.permissions?.map(p => p.key) 
    // });


    return (
        <div className="space-y-6">
            


            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-gray-500 hover:text-gray-900"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Journalist Profile</h2>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => exportJournalistDetailToCSV(application)}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => exportJournalistDetailToPDF(application as any)}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export PDF
                    </Button>
                    {application.equipment?.some((e: any) => e.status === 'APPROVED') && (
                        <Button
                            variant="default"
                            onClick={() => exportClearanceLetterToPDF(application)}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Clearance Letter
                        </Button>
                    )}
                </div>
            </div>

            {/* Debug Panel Removed */}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content - Left */}
                <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
                    {/* Basic Info Card */}
                    <Card className="bg-white border-0 shadow-sm">
                        <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                            <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <img src={photoUrl} alt={fullname} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1 w-full">
                                <h3 className="text-xl font-bold text-gray-900">{fullname}</h3>
                                <div className="text-gray-500 text-sm flex flex-col gap-1 mt-1">
                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                        <Briefcase className="h-3 w-3" />
                                        <span>{roleTitle}</span>
                                    </div>
                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                        <span className="text-lg leading-none">{getFlagEmoji(country)}</span>
                                        <span>{fullCountryName}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>• {organization}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs defaultValue={displayCategories.length > 0 ? displayCategories[0].name : "equipment"} className="w-full">
                        <div className="bg-white rounded-lg p-1 shadow-sm mb-4">
                            <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-6 border-b rounded-none px-4 flex-wrap">
                                {/* Dynamic Tabs */}
                                {displayCategories.map((cat) => (
                                    <TabsTrigger key={cat.name} value={cat.name} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 gap-2 font-bold text-gray-500">
                                        <FileText className="h-4 w-4" /> {cat.name}
                                    </TabsTrigger>
                                ))}

                                <TabsTrigger value="equipment" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 gap-2 font-bold text-gray-500">
                                    <Briefcase className="h-4 w-4" /> Equipment
                                    <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">{totalDeclaredEquipment}</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Dynamic Content Tabs */}
                        {displayCategories.map((category) => (
                            <TabsContent key={category.name} value={category.name}>
                                <Card className="bg-white border-0 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-lg font-bold">{category.name}</CardTitle>
                                        <FileText className="h-5 w-5 text-gray-500" />
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                                        {category.fields
                                            .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                                            .map((field: any) => {
                                                const value = formData[field.field_name];

                                                let activeSubFields: any[] = [];
                                                if ((field.field_type === 'select' || field.field_type === 'dropdown') && field.field_options) {
                                                    let parsedOpts: any = {};
                                                    try {
                                                        parsedOpts = typeof field.field_options === 'string' ? JSON.parse(field.field_options) : field.field_options || {};
                                                    } catch { }
                                                    const nestedMap = parsedOpts?.nestedFields || parsedOpts?.nested_fields || {};
                                                    const strVal = value ? String(value).trim() : '';
                                                    const matchKey = strVal ? Object.keys(nestedMap).find(k => k.trim().toLowerCase() === strVal.toLowerCase()) : null;
                                                    if (matchKey) {
                                                        activeSubFields = nestedMap[matchKey].map((sf: any) => ({
                                                            field_name: sf.field_name || sf.fieldName || (sf.label ? sf.label.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'sub_field'),
                                                            field_type: sf.field_type || sf.type || 'text',
                                                            label: sf.label || '',
                                                            is_sub_field: true
                                                        }));
                                                    }
                                                }

                                                const renderFieldData = (f: any, val: any) => {
                                                    if (f.field_type === 'file') {
                                                        const files = getFiles(val);
                                                        if (files.length === 0) return null;
                                                        return (
                                                            <div key={f.field_name} className={`col-span-1 sm:col-span-2 lg:col-span-4 mt-2 ${f.is_sub_field ? 'pl-4 border-l-2 border-emerald-500 bg-emerald-50/30 py-3 pr-3 rounded-2xl' : ''}`}>
                                                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">{f.label}</p>
                                                                <div className="flex flex-wrap gap-4">
                                                                    {files.map((file: string, idx: number) => (
                                                                        <a
                                                                            key={idx}
                                                                            href={getFileUrl(file)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="group relative h-32 w-48 rounded-lg overflow-hidden border bg-gray-50 flex-shrink-0"
                                                                        >
                                                                            <div className="h-full w-full flex flex-col items-center justify-center p-2">
                                                                                <FileText className="h-8 w-8 text-blue-400 mb-2" />
                                                                                <span className="text-[10px] text-gray-500 truncate w-full text-center px-2">
                                                                                    {f.label} {idx + 1}
                                                                                </span>
                                                                            </div>
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <Download className="h-5 w-5 text-white" />
                                                                            </div>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    if (f.field_type === 'repeater' || f.field_type === 'table' || f.field_type === 'repeater_table') {
                                                        const rows = Array.isArray(val) ? val : [];
                                                        let opts: any = {};
                                                        try {
                                                            opts = typeof f.field_options === 'string' ? JSON.parse(f.field_options) : f.field_options || {};
                                                        } catch { }
                                                        const subfields: any[] = opts.subfields || [];

                                                        return (
                                                            <div key={f.field_name} className="col-span-1 sm:col-span-2 lg:col-span-4 mt-2">
                                                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">{f.label}</p>
                                                                {rows.length === 0 ? (
                                                                    <p className="text-sm font-medium text-gray-400 italic">No entries provided</p>
                                                                ) : (
                                                                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-left border-collapse text-xs">
                                                                                <thead>
                                                                                    <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500">
                                                                                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                                                                                        {subfields.length > 0 ? (
                                                                                            subfields.map((sf: any) => (
                                                                                                <th key={sf.key} className="py-2.5 px-3">{sf.label}</th>
                                                                                            ))
                                                                                        ) : (
                                                                                            Object.keys(rows[0] || {}).map((k) => (
                                                                                                <th key={k} className="py-2.5 px-3 uppercase">{k.replace(/_/g, ' ')}</th>
                                                                                            ))
                                                                                        )}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                                                                                    {rows.map((row: any, rIdx: number) => (
                                                                                        <tr key={rIdx} className="hover:bg-slate-50/60">
                                                                                            <td className="py-2 px-3 text-center text-slate-400 font-bold">{rIdx + 1}</td>
                                                                                            {subfields.length > 0 ? (
                                                                                                subfields.map((sf: any) => (
                                                                                                    <td key={sf.key} className="py-2 px-3">{row[sf.key] || '-'}</td>
                                                                                                ))
                                                                                            ) : (
                                                                                                Object.keys(row).map((k) => (
                                                                                                    <td key={k} className="py-2 px-3">{row[k]?.toString() || '-'}</td>
                                                                                                ))
                                                                                            )}
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    if (f.field_type === 'checkbox_group') {
                                                        const items = Array.isArray(val) ? val : typeof val === 'string' && val.trim() ? [val] : [];
                                                        return (
                                                            <div key={f.field_name} className="col-span-1 sm:col-span-2 lg:col-span-4">
                                                                <p className="text-xs font-bold text-gray-400 uppercase">{f.label}</p>
                                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                                    {items.length > 0 ? (
                                                                        items.map((item: string, iIdx: number) => (
                                                                            <span key={iIdx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-xs rounded-lg">
                                                                                {item}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-sm font-medium text-gray-400 italic">None selected</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div key={f.field_name} className={`${f.field_type === 'textarea' ? 'col-span-1 sm:col-span-2 lg:col-span-4' : ''} ${f.is_sub_field ? 'pl-4 border-l-2 border-emerald-500 bg-emerald-50/30 p-3 rounded-2xl' : ''}`}>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">{f.label}</p>
                                                            <p className="text-sm font-bold text-gray-900 mt-1">{val?.toString() || 'N/A'}</p>
                                                        </div>
                                                    );
                                                };

                                                return (
                                                    <React.Fragment key={field.field_name}>
                                                        {renderFieldData(field, value)}
                                                        {activeSubFields.map(sf => renderFieldData(sf, formData[sf.field_name]))}
                                                    </React.Fragment>
                                                );
                                            })}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}

                        {/* Equipment Content - Server Paginated */}
                        <TabsContent value="equipment">
                            <Card className="bg-white border-0 shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-lg font-bold">Equipment Details</CardTitle>
                                            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-full">
                                                {eqData?.total ?? totalDeclaredEquipment} declared
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                                            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => { setEqFilter(status); setEqPage(1); }}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                        eqFilter === status
                                                            ? status === 'APPROVED' ? 'bg-green-600 text-white shadow-sm'
                                                            : status === 'REJECTED' ? 'bg-red-600 text-white shadow-sm'
                                                            : status === 'PENDING' ? 'bg-yellow-500 text-white shadow-sm'
                                                            : 'bg-white text-gray-900 shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                                >
                                                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {eqLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                            <span className="ml-2 text-sm text-gray-500">Loading equipment...</span>
                                        </div>
                                    ) : !eqData?.equipment || eqData.equipment.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 italic">No equipment found{eqFilter !== 'ALL' ? ` with status "${eqFilter}"` : ''}.</p>
                                        </div>
                                    ) : (
                                        <div className={`space-y-4 ${eqFetching ? 'opacity-50 pointer-events-none' : ''}`}>
                                            {eqData.equipment.map((item, idx) => (
                                                <div key={item.id || idx} className="border rounded-md p-4 bg-gray-50/50">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">TYPE</p>
                                                            <p className="text-sm font-bold text-gray-900">{item.type}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">DESCRIPTION</p>
                                                            <p className="text-sm text-gray-900">{item.description}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">SERIAL NO.</p>
                                                            <p className="text-sm font-mono text-gray-700">{item.serialNumber || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">VALUE</p>
                                                            <p className="text-sm font-bold text-gray-900">{item.value} {item.currency}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">QUANTITY</p>
                                                            <p className="text-sm font-bold text-gray-900">{item.quantity}</p>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <p className="text-xs font-bold text-gray-400 uppercase">STATUS</p>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${item.status?.toUpperCase() === 'APPROVED' ? 'bg-green-100 text-green-700' : item.status?.toUpperCase() === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {item.rejectionReason && item.status === 'REJECTED' && (
                                                        <div className="mt-2 pt-2 border-t">
                                                            <p className="text-xs font-bold text-gray-400 uppercase">REJECTION REASON</p>
                                                            <p className="text-sm text-red-600">{item.rejectionReason}</p>
                                                        </div>
                                                    )}

                                                    {/* Equipment Approval Buttons */}
                                                    {canUpdateEquipment && (
                                                        <div className="mt-4 pt-4 border-t flex gap-2">
                                                            {item.status?.toUpperCase() !== 'APPROVED' && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-[#009b4d] hover:bg-[#007a3d] text-white font-bold"
                                                                    onClick={() => openEquipmentDialog(item, EquipmentStatus.APPROVED)}
                                                                    disabled={isEquipmentUpdating}
                                                                >
                                                                    {isEquipmentUpdating && selectedEquipment?.id === item.id && equipmentStatus === EquipmentStatus.APPROVED ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                    ) : (
                                                                        <Check className="h-4 w-4 mr-2" />
                                                                    )}
                                                                    {isPmoOrGc ? 'Send Consent' : 'Approve'}
                                                                </Button>
                                                            )}
                                                            {item.status?.toUpperCase() === 'APPROVED' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-amber-600 border-amber-200 hover:bg-amber-50 font-bold"
                                                                    onClick={() => handleEquipmentApproval(item.id, EquipmentStatus.PENDING)}
                                                                    disabled={isEquipmentUpdating}
                                                                >
                                                                    {isEquipmentUpdating && selectedEquipment?.id === item.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                    ) : (
                                                                        <RotateCcw className="h-4 w-4 mr-2" />
                                                                    )}
                                                                    Revoke Approval
                                                                </Button>
                                                            )}
                                                            {!isPmoOrGc && item.status?.toUpperCase() !== 'REJECTED' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 border-red-200 hover:bg-red-50 font-bold"
                                                                    onClick={() => openEquipmentDialog(item, EquipmentStatus.REJECTED)}
                                                                    disabled={isEquipmentUpdating}
                                                                >
                                                                    <X className="h-4 w-4 mr-2" />
                                                                    Reject
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Pagination Controls */}
                                    {eqData && eqData.pages > 1 && (
                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <p className="text-xs text-gray-500">
                                                Showing {((eqData.currentPage - 1) * eqData.limit) + 1}–{Math.min(eqData.currentPage * eqData.limit, eqData.total)} of {eqData.total}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={eqPage <= 1 || eqFetching}
                                                    onClick={() => setEqPage(p => Math.max(1, p - 1))}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                {Array.from({ length: Math.min(eqData.pages, 5) }, (_, i) => {
                                                    let pageNum: number;
                                                    if (eqData.pages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (eqPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (eqPage >= eqData.pages - 2) {
                                                        pageNum = eqData.pages - 4 + i;
                                                    } else {
                                                        pageNum = eqPage - 2 + i;
                                                    }
                                                    return (
                                                        <Button
                                                            key={pageNum}
                                                            variant={eqPage === pageNum ? 'default' : 'outline'}
                                                            size="sm"
                                                            className={`h-8 w-8 p-0 text-xs font-bold ${eqPage === pageNum ? 'bg-blue-600 text-white' : ''}`}
                                                            onClick={() => setEqPage(pageNum)}
                                                            disabled={eqFetching}
                                                        >
                                                            {pageNum}
                                                        </Button>
                                                    );
                                                })}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={eqPage >= (eqData?.pages || 1) || eqFetching}
                                                    onClick={() => setEqPage(p => p + 1)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Sidebar - Decision Panel */}
                <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
                    <Card className="bg-white border-0 shadow-sm">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <h3 className="font-bold text-gray-900">Decision Panel</h3>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-xs text-gray-500 leading-tight">Current Status: <span className="font-bold">{application.status}</span></p>
                                            {userActionableApproval?.isResubmitted && (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 w-fit animate-pulse border border-amber-200 uppercase tracking-wider">
                                                    <RotateCcw className="h-2.5 w-2.5" /> Resubmitted / Updated
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 font-bold"
                                    onClick={() => setShowHistoryDialog(true)}
                                >
                                    <History className="h-4 w-4 mr-2" />
                                    History
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SystemCheckSuccess show={showSystemCheck} />
                            {isFromEntryApproval ? (
                                canApprove ? (
                                    <div className="space-y-4">
                                        {/* PMO & GC Consents section for MFA Officer */}
                                        {isMfaOfficer && (
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                                            PMO & GC Consents
                                                        </span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowConsentsExpanded(!showConsentsExpanded)}
                                                        className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 flex items-center gap-1"
                                                    >
                                                        {showConsentsExpanded ? 'View Less' : 'View More'}
                                                        {showConsentsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    {pmoGcApprovals.length > 0 ? (
                                                        pmoGcApprovals.map((appr: any) => {
                                                            const step = appr.workflowStep || appr.approvalWorkflowStep;
                                                            const isApproved = appr.status === 'APPROVED' || appr.status === 'NOT_APPLICABLE';
                                                            const isRejected = appr.status === 'REJECTED';
                                                            const orgName = step?.name || (step?.key?.toUpperCase().includes('PMO') ? 'PMO Consent' : 'GC Consent');

                                                            return (
                                                                <div key={appr.id} className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-xs space-y-2">
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                                                            <Building2 className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                                                                            <span className="font-bold text-gray-900 truncate">{orgName}</span>
                                                                        </div>
                                                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider ${
                                                                            isApproved ? 'bg-green-100 text-green-700 border border-green-200' :
                                                                            isRejected ? 'bg-red-100 text-red-700 border border-red-200' :
                                                                            'bg-amber-50 text-amber-700 border border-amber-200'
                                                                        }`}>
                                                                            {isApproved ? <CheckCircle2 className="h-3 w-3" /> :
                                                                             isRejected ? <XCircle className="h-3 w-3" /> :
                                                                             <Clock className="h-3 w-3" />}
                                                                            {appr.status}
                                                                        </span>
                                                                    </div>

                                                                    {showConsentsExpanded && (
                                                                        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                                                                            {appr.verifier && (
                                                                                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                                                                    <UserCheck className="h-3 w-3 text-gray-400" />
                                                                                    <span className="font-semibold">{appr.verifier.fullName}</span>
                                                                                    {appr.verifier.email && <span className="text-gray-400">({appr.verifier.email})</span>}
                                                                                </p>
                                                                            )}
                                                                            {appr.verifiedAt && (
                                                                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                                    <Clock className="h-3 w-3 text-gray-400" />
                                                                                    {new Date(appr.verifiedAt).toLocaleString()}
                                                                                </p>
                                                                            )}
                                                                            <div className="mt-1">
                                                                                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Decision Note / Feedback:</p>
                                                                                {appr.notes || (appr.noteAttachments && appr.noteAttachments.length > 0) ? (
                                                                                    <DecisionNoteViewer htmlContent={appr.notes} attachments={appr.noteAttachments} />
                                                                                ) : (
                                                                                    <p className="text-gray-400 italic text-[11px]">No notes provided.</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-gray-500 italic text-center">
                                                            No PMO or GC approval records found.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Decision Notes</label>
                                            <Textarea
                                                placeholder="Enter approval/rejection notes, guidelines..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={4}
                                                className="w-full resize-y rounded-md border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />
                                            <div className="pt-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500 font-medium">Attach supporting files (optional)</span>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        multiple
                                                        className="hidden"
                                                        onChange={handleNoteFileUpload}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isUploadingNoteFile}
                                                        className="h-7 text-xs gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-100"
                                                    >
                                                        {isUploadingNoteFile ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Paperclip className="h-3.5 w-3.5" />
                                                        )}
                                                        Attach File
                                                    </Button>
                                                </div>
                                                {noteAttachments && noteAttachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        {noteAttachments.map((file, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-700 shadow-2xs"
                                                            >
                                                                {file.mimeType?.startsWith('image/') ? (
                                                                    <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                                                                ) : (
                                                                    <FileText className="h-3.5 w-3.5 text-emerald-500" />
                                                                )}
                                                                <span className="max-w-[140px] truncate font-medium">{file.originalName}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = [...noteAttachments];
                                                                        updated.splice(idx, 1);
                                                                        setNoteAttachments(updated);
                                                                    }}
                                                                    className="ml-1 text-gray-400 hover:text-red-500 rounded p-0.5"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {userActionableApproval?.status && ['APPROVED', 'REJECTED'].includes(userActionableApproval.status) ? (
                                            <Button
                                                variant="outline"
                                                className="w-full bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 font-bold shadow-sm"
                                                onClick={() => handleDecision('PENDING')}
                                                disabled={isStatusUpdating}
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" /> Revoke Decision
                                            </Button>
                                        ) : relevantStep?.isCommenterOnly ? (
                                            <div className="flex gap-2 w-full">
                                                <Button
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold shadow-md"
                                                    onClick={() => handleDecision('APPROVED')}
                                                    disabled={
                                                        isStatusUpdating ||
                                                        (!isSuperAdmin && !canApprove)
                                                    }
                                                >
                                                    {isStatusUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                                    Mark as Reviewed & Submit Notes
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 w-full">
                                                <Button
                                                    className="flex-1 bg-[#009b4d] hover:bg-[#007a3d] font-bold shadow-md"
                                                    onClick={() => handleDecision('APPROVED')}
                                                    disabled={
                                                        isStatusUpdating ||
                                                        (!isSuperAdmin && !canApprove)
                                                    }
                                                >
                                                    {isStatusUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                                    {isPmoOrGc ? 'Send Consent' : 'Approve'}
                                                </Button>
                                                {!isPmoOrGc && (
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-bold shadow-sm"
                                                        onClick={() => handleDecision('REJECTED')}
                                                        disabled={
                                                            isStatusUpdating ||
                                                            (!isSuperAdmin && !canApprove)
                                                        }
                                                    >
                                                        <X className="h-4 w-4 mr-2" /> Reject
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        {(user?.workflowStepKey || relevantStep?.key) && (
                                            <p className="text-[10px] text-center text-gray-500">
                                                Acting as: <span className="font-bold uppercase">{user?.workflowStepKey || relevantStep?.key}</span>
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-600 text-center">
                                        Read-only view for this role.
                                    </div>
                                )
                            ) : (
                                <div className="space-y-4">
                                    {/* Read-Only Stakeholder Notification Banner */}
                                    <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                                            <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                            <span>Read-Only Stakeholder View</span>
                                        </div>
                                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                            Here you can view the approval status of each organization. Decision making is only available when accessing applications from the <strong>Entry Approval Page</strong>.
                                        </p>
                                    </div>

                                    {/* Organization Status Matrix in Decision Panel */}
                                    {approvals && approvals.length > 0 && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                                                <Building2 className="h-4 w-4 text-slate-600" /> Stakeholder Organization Status
                                            </h4>
                                            <div className="space-y-2">
                                                {approvals.map((appr: any) => {
                                                    const step = appr.workflowStep || appr.approvalWorkflowStep;
                                                    const isApproved = appr.status === 'APPROVED' || appr.status === 'NOT_APPLICABLE';
                                                    const isRejected = appr.status === 'REJECTED';
                                                    const orgName = appr.verifier?.organization?.name || step?.requiredRole || step?.name || 'Stakeholder';
                                                    const verifierName = appr.verifier?.fullName;

                                                    return (
                                                        <div key={appr.id} className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-xs flex items-center justify-between text-xs">
                                                            <div className="min-w-0 flex-1 pr-2">
                                                                <p className="font-bold text-gray-900 truncate">{step?.name || 'Approval Step'}</p>
                                                                <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                                                    <Building className="h-3 w-3 text-gray-400" />
                                                                    <span className="font-semibold text-gray-700">{orgName}</span>
                                                                    {verifierName && <span>• {verifierName}</span>}
                                                                </p>
                                                            </div>
                                                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider ${
                                                                isApproved ? 'bg-green-100 text-green-700 border border-green-200' :
                                                                isRejected ? 'bg-red-100 text-red-700 border border-red-200' :
                                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                                            }`}>
                                                                {isApproved ? <CheckCircle2 className="h-3 w-3" /> :
                                                                 isRejected ? <XCircle className="h-3 w-3" /> :
                                                                 <Clock className="h-3 w-3" />}
                                                                {appr.status}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Exit Workflow Activation Button */}
                            {isFromEntryApproval && application.status === 'APPROVED' && !approvals.some((a: any) => ((a as any).workflowStep || (a as any).approvalWorkflowStep)?.isExitStep) && (
                                <div className="pt-4 border-t">
                                    <p className="text-[10px] text-center text-gray-400 mt-2">
                                        Click when the journalist is ready to begin the exit approval process.
                                    </p>
                                </div>
                            )}

                            <p className="text-xs text-center text-gray-400">Applied: {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Structured Rejection Dialog */}
            <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <X className="h-5 w-5" /> Detailed Rejection Feedback
                        </DialogTitle>
                        <DialogDescription>
                            Select the specific fields that are incorrect and provide feedback for each. The applicant will see these notes on their dashboard and in their notification email.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase text-gray-400 tracking-wider">Select Fields to Flag</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {templates?.filter(t => t.field_type !== 'file').map((template) => (
                                    <div
                                        key={template.field_name}
                                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedFields.includes(template.field_name)
                                            ? 'border-red-200 bg-red-50 text-red-700'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        onClick={() => {
                                            if (selectedFields.includes(template.field_name)) {
                                                setSelectedFields((prev: string[]) => prev.filter((f: string) => f !== template.field_name));
                                            } else {
                                                setSelectedFields((prev: string[]) => [...prev, template.field_name]);
                                            }
                                        }}
                                    >
                                        <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors ${selectedFields.includes(template.field_name) ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300'
                                            }`}>
                                            {selectedFields.includes(template.field_name) && <Check className="h-3 w-3" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold">{template.label}</p>
                                            <p className="text-xs opacity-70 truncate">{formData[template.field_name] || 'N/A'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedFields.length > 0 && (
                            <div className="space-y-4 pt-4 border-t">
                                <Label className="text-sm font-bold uppercase text-gray-400 tracking-wider">Provide Feedback for Selected Fields</Label>
                                {selectedFields.map((fieldName) => {
                                    const template = templates?.find(t => t.field_name === fieldName);
                                    return (
                                        <div key={fieldName} className="space-y-2 p-4 rounded-lg bg-gray-50 border">
                                            <Label className="text-sm font-bold">{template?.label || fieldName}</Label>
                                            <Textarea
                                                placeholder={`Explain why ${template?.label || fieldName} is being rejected...`}
                                                className="bg-white"
                                                value={fieldNotes[fieldName] || ''}
                                                onChange={(e) => setFieldNotes((prev: Record<string, string>) => ({ ...prev, [fieldName]: e.target.value }))}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="space-y-2 pt-4 border-t">
                            <Label className="text-sm font-bold uppercase text-gray-400 tracking-wider">General Rejection Note (Optional)</Label>
                            <Textarea
                                placeholder="Any additional context or summary of the rejection..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-6 border-t mt-6">
                        <Button variant="ghost" onClick={() => setShowRejectionDialog(false)}>Cancel</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 shadow-lg shadow-red-100"
                            disabled={isStatusUpdating || (selectedFields.length === 0 && !notes.trim())}
                            onClick={() => {
                                const rejectionDetails: Record<string, string> = {};
                                selectedFields.forEach((fieldName: string) => {
                                    const template = templates?.find(t => t.field_name === fieldName);
                                    rejectionDetails[template?.label || fieldName] = fieldNotes[fieldName] || 'Incorrect information provided.';
                                });
                                handleDecision('REJECTED', rejectionDetails);
                            }}
                        >
                            {isStatusUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Equipment Approval Dialog */}
            <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {equipmentStatus === EquipmentStatus.APPROVED ? 'Approve Equipment' : 'Reject Equipment'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEquipment && (
                                <div className="mt-2">
                                    <p className="font-semibold">{selectedEquipment.type}</p>
                                    <p className="text-sm text-gray-600">{selectedEquipment.description}</p>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="equipment-notes">Notes (Optional)</Label>
                            <Textarea
                                id="equipment-notes"
                                placeholder="Enter any notes about this equipment..."
                                value={equipmentNotes}
                                onChange={(e) => setEquipmentNotes(e.target.value)}
                                className="min-h-[80px]"
                            />
                        </div>

                        {equipmentStatus === EquipmentStatus.REJECTED && (
                            <div className="space-y-2">
                                <Label htmlFor="rejection-reason" className="text-red-600">
                                    Rejection Reason *
                                </Label>
                                <Textarea
                                    id="rejection-reason"
                                    placeholder="Please provide a reason for rejecting this equipment..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="min-h-[100px] border-red-200 focus-visible:ring-red-500"
                                    required
                                />
                                <p className="text-xs text-red-500">Rejection reason is required</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEquipmentDialog(false);
                                setRejectionReason('');
                                setEquipmentNotes('');
                            }}
                            disabled={isEquipmentUpdating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => selectedEquipment && handleEquipmentApproval(selectedEquipment.id, equipmentStatus)}
                            disabled={isEquipmentUpdating || (equipmentStatus === EquipmentStatus.REJECTED && !rejectionReason.trim())}
                            className={
                                equipmentStatus === EquipmentStatus.APPROVED
                                    ? 'bg-[#009b4d] hover:bg-[#007a3d]'
                                    : 'bg-red-600 hover:bg-red-700'
                            }
                        >
                            {isEquipmentUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : equipmentStatus === EquipmentStatus.APPROVED ? (
                                <Check className="h-4 w-4 mr-2" />
                            ) : (
                                <X className="h-4 w-4 mr-2" />
                            )}
                            {equipmentStatus === EquipmentStatus.APPROVED ? 'Approve Equipment' : 'Reject Equipment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Decision Notes History Dialog */}
            <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col">
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
                            <History className="h-6 w-6 text-blue-600" /> Stakeholder Approval & Decision History
                        </DialogTitle>
                        <DialogDescription>
                            Complete transparent record of stakeholder approvals, feedback comments, and reviewer identities across all organizations.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 pt-4 pb-4">
                        {/* Timeline of Decisions with Comments and Approver Info */}
                        {approvals && approvals.length > 0 ? (
                            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pt-2">
                                {approvals
                                    .slice()
                                    .sort((a: any, b: any) => {
                                        const dateA = a.verifiedAt ? new Date(a.verifiedAt).getTime() : new Date(a.updatedAt).getTime();
                                        const dateB = b.verifiedAt ? new Date(b.verifiedAt).getTime() : new Date(b.updatedAt).getTime();
                                        return dateB - dateA; // Descending (newest first)
                                    })
                                    .filter((appr: any) => appr.status !== 'PENDING') // Only show concluded actions
                                    .map((appr: any, idx: number) => {
                                        const step = appr.workflowStep || appr.approvalWorkflowStep;
                                        const stepName = step?.name || 'Unknown Step';
                                        const timestamp = appr.verifiedAt || appr.updatedAt;

                                        const isApproved = appr.status === 'APPROVED' || appr.status === 'NOT_APPLICABLE';
                                        const isRejected = appr.status === 'REJECTED';

                                        const verifier = appr.verifier;
                                        const orgName = verifier?.organization?.name || step?.requiredRole || 'Stakeholder Organization';

                                        return (
                                            <div key={appr.id || idx} className="relative pl-6">
                                                {/* Timeline dot */}
                                                <div className={`absolute -left-[9px] top-2 h-4 w-4 rounded-full border-2 border-white ${
                                                    isApproved ? 'bg-green-500 shadow-sm' : isRejected ? 'bg-red-500 shadow-sm' : 'bg-gray-400'
                                                }`} />

                                                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-blue-200 transition-colors">
                                                    {/* Header */}
                                                    <div className="flex flex-wrap justify-between items-start gap-2 border-b border-gray-100 pb-3">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-gray-900 text-base">{stepName}</h4>
                                                                {step?.isExitStep && (
                                                                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase">
                                                                        Exit Workflow
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-gray-400" />
                                                                {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
                                                            </p>
                                                        </div>
                                                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                                                            isApproved ? 'bg-green-100 text-green-700 border border-green-200' :
                                                            isRejected ? 'bg-red-100 text-red-700 border border-red-200' :
                                                            'bg-gray-200 text-gray-700'
                                                        }`}>
                                                            {isApproved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                                            {appr.status}
                                                        </span>
                                                    </div>

                                                    {/* Stakeholder Comment Box */}
                                                    <div className="space-y-1.5">
                                                        <p className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1">
                                                            <MessageSquare className="h-3.5 w-3.5 text-blue-500" /> Stakeholder Feedback & Decision Notes
                                                        </p>
                                                        {appr.notes || (appr.noteAttachments && appr.noteAttachments.length > 0) ? (
                                                            <DecisionNoteViewer
                                                                htmlContent={appr.notes}
                                                                attachments={appr.noteAttachments}
                                                            />
                                                        ) : (
                                                            <div className="bg-gray-50 border border-dashed border-gray-200 p-3 rounded-lg text-xs text-gray-400 italic">
                                                                No specific feedback comments entered for this decision.
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Stakeholder & Approver Metadata Card (Below Note) */}
                                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                                                                <Building2 className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase text-gray-400">Organization</p>
                                                                <p className="font-bold text-gray-900">{orgName}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                                                                <UserCheck className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase text-gray-400">Approved By</p>
                                                                <p className="font-bold text-gray-900">{verifier?.fullName || 'Authorized System Officer'}</p>
                                                                {verifier?.email && <p className="text-[10px] text-gray-500 truncate">{verifier.email}</p>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Field-level Rejection Details if present */}
                                                    {appr.rejectionDetails && Object.keys(appr.rejectionDetails).length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                                            <h5 className="text-xs font-bold text-red-700 uppercase mb-2 flex items-center gap-1">
                                                                <XCircle className="h-3.5 w-3.5 text-red-600" /> Field Modifications Requested
                                                            </h5>
                                                            <div className="space-y-2">
                                                                {Object.entries(appr.rejectionDetails).map(([fieldName, detailNote]) => (
                                                                    <div key={fieldName} className="bg-red-50 border border-red-200 text-red-900 p-2.5 rounded-lg text-xs">
                                                                        <span className="font-bold text-red-700">{fieldName}:</span> {String(detailNote)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                {approvals.filter((appr: any) => appr.status !== 'PENDING').length === 0 && (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed text-gray-500 italic text-sm">
                                        No concluded stakeholder decisions recorded yet for this application.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed text-gray-500 italic text-sm">
                                No history available for this application.
                            </div>
                        )}

                        {/* Stakeholder Organization Status Matrix (Positioned below all stakeholder notes/statuses) */}
                        {approvals && approvals.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mt-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 text-slate-600" /> Stakeholder Organization Status Matrix
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {approvals.map((appr: any) => {
                                        const step = appr.workflowStep || appr.approvalWorkflowStep;
                                        const isApproved = appr.status === 'APPROVED' || appr.status === 'NOT_APPLICABLE';
                                        const isRejected = appr.status === 'REJECTED';
                                        const orgName = appr.verifier?.organization?.name || step?.requiredRole || step?.name || 'Stakeholder';
                                        const verifierName = appr.verifier?.fullName;

                                        return (
                                            <div key={appr.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex items-center justify-between">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{step?.name || 'Approval Step'}</p>
                                                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                                        <Building className="h-3 w-3 text-gray-400" />
                                                        <span className="font-semibold text-gray-700">{orgName}</span>
                                                        {verifierName && <span>• {verifierName}</span>}
                                                    </p>
                                                </div>
                                                <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider ${
                                                    isApproved ? 'bg-green-100 text-green-700 border border-green-200' :
                                                    isRejected ? 'bg-red-100 text-red-700 border border-red-200' :
                                                    'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    {isApproved ? <CheckCircle2 className="h-3 w-3" /> :
                                                     isRejected ? <XCircle className="h-3 w-3" /> :
                                                     <Clock className="h-3 w-3" />}
                                                    {appr.status}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="pt-4 border-t">
                        <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
