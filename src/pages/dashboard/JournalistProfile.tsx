import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Briefcase, Check, X, ShieldCheck, Download, ChevronLeft, Loader2, RotateCcw } from 'lucide-react';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';
import { SystemCheckSuccess } from '@/components/SystemCheckSuccess';
import { exportJournalistDetailToPDF, exportJournalistDetailToCSV } from '@/lib/export-utils';
import { useAuth, UserRole } from '@/auth/context';
import { MOCK_JOURNALISTS } from '@/data/mock';
import {
    useApproveWorkflowStepMutation,
    useActivateExitWorkflowMutation,
    Equipment as EquipmentType,
    useUpdateEquipmentStatusMutation,
    getFileUrl,
    useGetFormFieldTemplatesQuery,
    useGetApplicationByIdQuery
} from '@/store/services/api';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Define EquipmentStatus enum to match backend
enum EquipmentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export function JournalistProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, checkPermission } = useAuth();
    console.log(user);

    // Workflow Mutation
    const [approveWorkflow, { isLoading: isStatusUpdating }] = useApproveWorkflowStepMutation();
    // Equipment status mutation
    const [updateEquipmentStatus, { isLoading: isEquipmentUpdating }] = useUpdateEquipmentStatusMutation();
    // Exit Workflow mutation
    const [activateExit, { isLoading: isActivatingExit }] = useActivateExitWorkflowMutation();

    // Fetch dynamic form templates
    const { data: templates, isLoading: templatesLoading } = useGetFormFieldTemplatesQuery();

    const [application, setApplication] = useState<any>(null);
    const [notes, setNotes] = useState('');
    const [showSystemCheck, setShowSystemCheck] = useState(false);

    // Equipment approval states
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
    const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
    const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStatus>(EquipmentStatus.PENDING);
    const [rejectionReason, setRejectionReason] = useState('');
    const [equipmentNotes, setEquipmentNotes] = useState('');

    // Field-specific rejection states
    const [showRejectionDialog, setShowRejectionDialog] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [fieldNotes, setFieldNotes] = useState<Record<string, string>>({});

    const { data: fetchedApplication, isLoading: applicationLoading } = useGetApplicationByIdQuery(Number(id), { skip: !id });

    useEffect(() => {
        if (fetchedApplication) {
            setApplication(fetchedApplication);
        }
    }, [fetchedApplication]);

    useEffect(() => {
        if (location.state?.application) {
            setApplication(location.state.application);
        } else {
            // Robust Fallback to Mock Data to "restore static data" appearance if API data is missing
            const mock = MOCK_JOURNALISTS.find(j => j.id === id);
            if (mock) {
                setApplication({
                    id: mock.id,
                    formData: {
                        first_name: mock.fullname.split(' ')[0],
                        last_name: mock.fullname.split(' ').slice(1).join(' '),
                        occupation: mock.role,
                        country: mock.country,
                        passport_number: mock.passportNo,
                        city: 'Addis Ababa', // Mock static
                        email: 'journalist@example.com', // Mock static
                        phone: mock.contact,
                        citizenship: mock.country,
                        arrival_date: '2024-01-20',
                        departure_date: '2024-02-10',
                        address_line_1: 'Bole Road',
                        place_of_birth: 'London',
                        airlines_and_flight_number: 'ET 701',
                        accommodation_details: 'Skylight Hotel'
                    },
                    user: { fullName: mock.fullname },
                    equipment: [],
                    status: mock.status,
                    createdAt: new Date().toISOString()
                });
            }
        }
    }, [location.state, id]);

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
            const step = userActionableApproval.workflowStep || userActionableApproval.approvalWorkflowStep;
            effectiveStepId = step?.id;
        }

        console.log('Effective Step ID:', effectiveStepId);

        if (!effectiveStepId && isSuperAdmin) {
            // Fallback for Super Admin: Find the first PENDING approval to act on
            const approvalsList = application.applicationApprovals || application.approvals || [];
            const pendingStep = approvalsList.find((a: any) => a.status === 'PENDING');

            if (pendingStep) {
                const step = pendingStep.workflowStep || pendingStep.approvalWorkflowStep;
                effectiveStepId = step?.id;
            } else if (approvalsList.length > 0) {
                // If no pending steps (e.g., all approved), act on the last one (e.g. to Revoke)
                const lastStep = approvalsList[approvalsList.length - 1];
                const step = lastStep.workflowStep || lastStep.approvalWorkflowStep;
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
                rejectionDetails // NEW: Sending structured details
            }).unwrap();

            toast.success(`Application ${status.toLowerCase()} successfully`);

            // Optimistic Update: Update the specific approval in the list by ID
            const updatedApprovals = (application.applicationApprovals || application.approvals || []).map((app: any) => {
                const step = app.workflowStep || app.approvalWorkflowStep;
                // Match by ID if we have it
                if (step && step.id === effectiveStepId) {
                    return { ...app, status, isResubmitted: false };
                }
                return app;
            });

            setApplication({
                ...application,
                approvals: updatedApprovals,
                applicationApprovals: updatedApprovals,
                status: status === 'APPROVED' ? application.status : 'REJECTED'
            });
            setNotes('');
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

            // Update the equipment list in state
            if (application && application.equipment) {
                const updatedEquipment = application.equipment.map((item: EquipmentType) =>
                    item.id === equipmentId
                        ? { ...item, status, rejectionReason: payload.rejectionReason }
                        : item
                );
                setApplication({ ...application, equipment: updatedEquipment });
            }

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
    const equipmentList: EquipmentType[] = application.equipment || [];

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
    const approvals = application.applicationApprovals || application.approvals || [];

    const isCustoms = user?.role === UserRole.CUSTOMS_OFFICER;
    const canUpdateEquipment = checkPermission('verification:equipment:single:update');

    // Find the relevant approval record for the current user based on authorized IDs AND Phase
    const currentPhase = location.state?.phase; // 'entry' or 'exit'

    // Form rendering priority: 1. Specific Form definition attached to application, 2. Global Templates
    const formCategories = application?.form?.categories;
    const formUncategorizedFields = (application?.form as any)?.FormFields;

    let displayCategories: { name: string; fields: any[] }[] = [];

    if (formCategories && formCategories.length > 0) {
        displayCategories = formCategories.map((cat: any) => ({
            name: cat.name,
            fields: (cat.fields || []).map((f: any) => ({
                field_name: f.field_name,
                field_type: f.field_type,
                label: f.label,
                display_order: f.display_order
            }))
        }));

        if (formUncategorizedFields && formUncategorizedFields.length > 0) {
            displayCategories.push({
                name: 'Other Details',
                fields: formUncategorizedFields.map((f: any) => ({
                    field_name: f.field_name,
                    field_type: f.field_type,
                    label: f.label,
                    display_order: f.display_order
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
                display_order: t.display_order
            });
            return acc;
        }, {});

        displayCategories = Object.entries(grouped).map(([name, fields]) => ({
            name,
            fields: fields as any[]
        }));
    }

    // Filter out equipment category as it's handled separately, and sort
    displayCategories = displayCategories
        .filter(cat => cat.name.toLowerCase() !== 'equipment')
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

    const userActionableApproval = approvals.find((a: any) => {
        const step = a.workflowStep || a.approvalWorkflowStep;
        if (!step) return false;

        // Strict check: User must be authorized for this specific step ID
        const isAuthorized = user?.authorizedWorkflowSteps?.some(s => s.id === step.id && s.formId === application.formId);

        if (!isAuthorized) return false;

        // Phase check: If we know the phase, filter accordingly
        if (currentPhase === 'entry') return step.isExitStep === false;
        if (currentPhase === 'exit') return step.isExitStep === true;

        return true; // Fallback if no phase specified
    });

    // Determine current user's approval status for this application
    const isStepApproved = userActionableApproval?.status === 'APPROVED';

    // Legacy support for relevantStep used in rendering
    const relevantStep = userActionableApproval?.workflowStep || userActionableApproval?.approvalWorkflowStep;

    // Authorization
    const isExitPhase = relevantStep?.isExitStep;
    const canApprove = isSuperAdmin || (
        isExitPhase
            ? checkPermission('application:manage-exit-workflow')
            : checkPermission('application:approve:dynamic')
    ) && !!userActionableApproval;


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
                </div>
            </div>

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
                                            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                                            .map((field) => {
                                                const value = formData[field.field_name];
                                                if (field.field_type === 'file') {
                                                    const files = getFiles(value);
                                                    if (files.length === 0) return null;
                                                    return (
                                                        <div key={field.field_name} className="col-span-1 sm:col-span-2 lg:col-span-4 mt-2">
                                                            <p className="text-xs font-bold text-gray-400 uppercase mb-3">{field.label}</p>
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
                                                                                {field.label} {idx + 1}
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
                                                return (
                                                    <div key={field.field_name} className={field.field_type === 'textarea' ? 'col-span-1 sm:col-span-2 lg:col-span-4' : ''}>
                                                        <p className="text-xs font-bold text-gray-400 uppercase">{field.label}</p>
                                                        <p className="text-sm font-bold text-gray-900 mt-1">{value?.toString() || 'N/A'}</p>
                                                    </div>
                                                );
                                            })}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}

                        {/* Equipment Content - Prioritized */}
                        <TabsContent value="equipment">
                            <Card className="bg-white border-0 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg font-bold">Equipment Details</CardTitle>
                                    <Briefcase className="h-5 w-5 text-gray-500" />
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {equipmentList.length === 0 ? (
                                        <p className="text-gray-500 italic">No equipment declared.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {equipmentList.map((item, idx) => (
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
                                                                    Approve
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
                                                            {item.status?.toUpperCase() !== 'REJECTED' && (
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
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Sidebar - Decision Panel */}
                <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
                    <Card className="bg-white border-0 shadow-sm">
                        <CardHeader>
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
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SystemCheckSuccess show={showSystemCheck} />

                            {/* {canApprove && ( */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Decision Notes</label>
                                    <Textarea
                                        placeholder="Enter approval/rejection notes..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="min-h-[100px] text-sm"
                                    />
                                </div>
                                {isStepApproved ? (
                                    <Button
                                        variant="outline"
                                        className="w-full bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 font-bold shadow-sm"
                                        onClick={() => handleDecision('PENDING')}
                                        disabled={isStatusUpdating}
                                    >
                                        <X className="h-4 w-4 mr-2" /> Revoke Approval
                                    </Button>
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
                                            Approve
                                        </Button>
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
                                    </div>
                                )}
                                {(user?.workflowStepKey || relevantStep?.key) && (
                                    <p className="text-[10px] text-center text-gray-500">
                                        Acting as: <span className="font-bold uppercase">{user?.workflowStepKey || relevantStep?.key}</span>
                                    </p>
                                )}
                            </div>

                            {/* Exit Workflow Activation Button */}
                            {application.status === 'APPROVED' && !approvals.some((a: any) => (a.workflowStep || a.approvalWorkflowStep)?.isExitStep) && (
                                <div className="pt-4 border-t">

                                    <p className="text-[10px] text-center text-gray-400 mt-2">
                                        Click when the journalist is ready to begin the exit approval process.
                                    </p>
                                </div>
                            )}
                            {/* )} */}


                            {!canApprove && (
                                <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-600 text-center">
                                    Read-only view for this role.
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
                                                setSelectedFields(prev => prev.filter(f => f !== template.field_name));
                                            } else {
                                                setSelectedFields(prev => [...prev, template.field_name]);
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
                                                onChange={(e) => setFieldNotes(prev => ({ ...prev, [fieldName]: e.target.value }))}
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
                                selectedFields.forEach(field => {
                                    const template = templates?.find(t => t.field_name === field);
                                    rejectionDetails[template?.label || field] = fieldNotes[field] || 'Incorrect information provided.';
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
        </div>
    );
}