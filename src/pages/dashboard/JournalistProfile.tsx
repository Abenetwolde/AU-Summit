import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Briefcase, Check, X, ShieldCheck, Download, ChevronLeft, Loader2 } from 'lucide-react';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';
import { SystemCheckSuccess } from '@/components/SystemCheckSuccess';
import { exportJournalistDetailToPDF } from '@/lib/export-utils';
import { useAuth, UserRole } from '@/auth/context';
import { MOCK_JOURNALISTS } from '@/data/mock';
import {
    useApproveWorkflowStepMutation,
    Equipment as EquipmentType,
    useUpdateEquipmentStatusMutation,
    getFileUrl,
    useGetFormFieldTemplatesQuery
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

    const handleDecision = async (status: 'APPROVED' | 'REJECTED') => {
        if (!application) return;

        // Ensure we have a workflow key
        const stepKey = user?.workflowStepKey;
        console.log('User Workflow Key:', stepKey);

        // Use user's key if available, otherwise fallback to the relevant step we found, then 'super_admin'
        const effectiveStepKey = stepKey || (relevantStep as any)?.key || 'super_admin';
        console.log('Effective Step Key:', effectiveStepKey);

        try {
            await approveWorkflow({
                applicationId: Number(application.id),
                stepKey: effectiveStepKey,
                status,
                notes
            }).unwrap();

            toast.success(`Application ${status.toLowerCase()} successfully`);

            // Optimistic Update: Update the specific approval in the list
            const updatedApprovals = (application.applicationApprovals || application.approvals || []).map((app: any) => {
                const stepKey = app.workflowStep?.key || app.approvalWorkflowStep?.key;
                if (stepKey === effectiveStepKey) {
                    return { ...app, status };
                }
                return app;
            });

            setApplication({
                ...application,
                applicationApprovals: updatedApprovals,
                approvals: updatedApprovals,
                status: status === 'APPROVED' ? application.status : 'REJECTED' // Don't flip global to APPROVED immediately unless logic dictates, but definitely flip REJECTED
            });
            setNotes('');
        } catch (err: any) {
            toast.error(err?.data?.message || `Failed to ${status.toLowerCase()} application`);
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
    const country = formData.country || 'ET';

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

    // Authorization
    const canApprove = user?.role === UserRole.SUPER_ADMIN || !!user?.workflowStepKey;
    const isCustoms = user?.role === UserRole.CUSTOMS_OFFICER;
    const canUpdateEquipment = checkPermission('verification:equipment:single:update');

    // Role Match Logic
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN || user?.roleName === 'SUPER_ADMIN';
    const approvals = application.applicationApprovals || application.approvals || [];

    // Find the relevant step for the current user
    const currentStepApproval = approvals.find((a: any) => {
        const step = a.workflowStep || a.approvalWorkflowStep;
        if (!step) return false;

        // Match by user's specific workflow key
        if (user?.workflowStepKey && step.key === user.workflowStepKey) return true;

        // Or match by required role
        if (step.requiredRole && (step.requiredRole === user?.role || step.requiredRole === user?.roleName)) return true;

        return false;
    });

    const relevantStep = currentStepApproval?.workflowStep || currentStepApproval?.approvalWorkflowStep;
    const requiredRole = relevantStep?.requiredRole;

    // Authorization logic
    // Disable if strictly a role mismatch and NOT a super admin
    const isRoleMismatch = !isSuperAdmin && !!requiredRole && (user?.role !== requiredRole && user?.roleName !== requiredRole);

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
                <Button
                    variant="outline"
                    onClick={() => exportJournalistDetailToPDF(application as any)}
                    className="gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export PDF
                </Button>
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
                                        <span>{countryName(country)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>• {organization}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs defaultValue={templates && templates.length > 0 ? (templates[0]?.category?.name || 'Other Details') : "equipment"} className="w-full">
                        <div className="bg-white rounded-lg p-1 shadow-sm mb-4">
                            <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-6 border-b rounded-none px-4 flex-wrap">
                                {/* Dynamic Tabs */}
                                {templates && Object.keys(
                                    templates.reduce((acc: any, t: any) => {
                                        const cat = t.category?.name || 'Other Details';
                                        if (cat.toLowerCase() === 'equipment') return acc;
                                        acc[cat] = true;
                                        return acc;
                                    }, {})
                                ).map((cat: string) => (
                                    <TabsTrigger key={cat} value={cat} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 gap-2 font-bold text-gray-500">
                                        <FileText className="h-4 w-4" /> {cat}
                                    </TabsTrigger>
                                ))}

                                <TabsTrigger value="equipment" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 gap-2 font-bold text-gray-500">
                                    <Briefcase className="h-4 w-4" /> Equipment
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Dynamic Content Tabs */}
                        {Object.entries(
                            (templates || []).reduce((acc: any, template: any) => {
                                const catName = template.category?.name || 'Other Details';
                                // Skip equipment category if it exists in templates, handled separately
                                if (catName.toLowerCase() === 'equipment') return acc;
                                if (!acc[catName]) acc[catName] = [];
                                acc[catName].push(template);
                                return acc;
                            }, {})
                        ).map(([categoryName, catTemplates]: [string, any]) => (
                            <TabsContent key={categoryName} value={categoryName}>
                                <Card className="bg-white border-0 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-lg font-bold">{categoryName}</CardTitle>
                                        <FileText className="h-5 w-5 text-gray-500" />
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                                        {(catTemplates as any[])
                                            .sort((a, b) => a.display_order - b.display_order)
                                            .map((template) => {
                                                const value = formData[template.field_name];
                                                if (template.field_type === 'file') {
                                                    const files = getFiles(value);
                                                    if (files.length === 0) return null;
                                                    return (
                                                        <div key={template.field_name} className="col-span-1 sm:col-span-2 lg:col-span-4 mt-2">
                                                            <p className="text-xs font-bold text-gray-400 uppercase mb-3">{template.label}</p>
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
                                                                                {template.label} {idx + 1}
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
                                                    <div key={template.field_name} className={template.field_type === 'textarea' ? 'col-span-1 sm:col-span-2 lg:col-span-4' : ''}>
                                                        <p className="text-xs font-bold text-gray-400 uppercase">{template.label}</p>
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
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">STATUS</p>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.status === 'APPROVED' ? 'bg-green-100 text-green-700' : item.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
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
                                                    {canUpdateEquipment && item.status !== 'APPROVED' && (
                                                        <div className="mt-4 pt-4 border-t flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="bg-[#009b4d] hover:bg-[#007a3d] text-white font-bold"
                                                                onClick={() => openEquipmentDialog(item, EquipmentStatus.APPROVED)}
                                                                disabled={isEquipmentUpdating}
                                                            >
                                                                {isEquipmentUpdating && selectedEquipment?.id === item.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                ) : (
                                                                    <Check className="h-4 w-4 mr-2" />
                                                                )}
                                                                Approve Equipment
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 border-red-200 hover:bg-red-50 font-bold"
                                                                onClick={() => openEquipmentDialog(item, EquipmentStatus.REJECTED)}
                                                                disabled={isEquipmentUpdating}
                                                            >
                                                                <X className="h-4 w-4 mr-2" />
                                                                Reject Equipment
                                                            </Button>
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
                                    <p className="text-xs text-gray-500 leading-tight">Current Status: <span className="font-bold">{application.status}</span></p>
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
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-[#009b4d] hover:bg-[#007a3d] font-bold shadow-md"
                                        onClick={() => handleDecision('APPROVED')}
                                        disabled={
                                            isStatusUpdating ||
                                            currentStepApproval?.status === 'APPROVED' ||
                                            !!isRoleMismatch ||
                                            (!isSuperAdmin && !currentStepApproval)
                                        }
                                    >
                                        {isStatusUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                        {currentStepApproval?.status === 'APPROVED' ? 'Approved' : 'Approve'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-bold shadow-sm"
                                        onClick={() => handleDecision('REJECTED')}
                                        disabled={
                                            isStatusUpdating ||
                                            currentStepApproval?.status === 'APPROVED' ||
                                            !!isRoleMismatch ||
                                            (!isSuperAdmin && !currentStepApproval)
                                        }
                                    >
                                        <X className="h-4 w-4 mr-2" /> Reject
                                    </Button>
                                </div>
                                {(user?.workflowStepKey || relevantStep?.key) && (
                                    <p className="text-[10px] text-center text-gray-500">
                                        Acting as: <span className="font-bold uppercase">{user?.workflowStepKey || relevantStep?.key}</span>
                                    </p>
                                )}
                            </div>
                            {/* )} */}

                            {isCustoms && (
                                <>
                                    <Button
                                        className="w-full bg-[#009b4d] hover:bg-[#007a3d] font-bold shadow-md"
                                        onClick={() => setShowSystemCheck(true)}
                                    >
                                        <Check className="h-4 w-4 mr-2" /> Approve Visa
                                    </Button>
                                    <Button className="w-full bg-red-100 hover:bg-red-200 text-red-600 font-bold shadow-none">
                                        <X className="h-4 w-4 mr-2" /> Reject Application
                                    </Button>
                                </>
                            )}

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