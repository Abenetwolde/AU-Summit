import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    FileText, Briefcase, Check, X, ShieldCheck, Download, ChevronLeft, Loader2, RotateCcw,
    History, ChevronRight, Filter, Building2, UserCheck, MessageSquare, CheckCircle2,
    XCircle, Clock, Building, ChevronDown, ChevronUp, Paperclip, Image as ImageIcon,
    Users, Search, User, Globe, Phone, Mail, Camera, FileCheck, Shield, Compass,
    Layers, ExternalLink, Copy, CheckCheck, Eye, Calendar, Tag, ArrowLeft, ArrowRight,
    Sparkles, CheckSquare, HelpCircle, FileSpreadsheet
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { CrewMemberReviewTable } from '@/components/CrewMemberReviewTable';
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
    useGetEquipmentByApplicationQuery,
    useGetApplicationMembersQuery
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

// Category Icon resolution helper
const getCategoryIcon = (categoryName: string) => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('personal') || name.includes('applicant') || name.includes('profile') || name.includes('bio') || name.includes('identity')) {
        return User;
    }
    if (name.includes('travel') || name.includes('passport') || name.includes('visa') || name.includes('flight') || name.includes('itinerary')) {
        return Globe;
    }
    if (name.includes('contact') || name.includes('address') || name.includes('phone') || name.includes('location') || name.includes('emergency')) {
        return Phone;
    }
    if (name.includes('media') || name.includes('press') || name.includes('journalist') || name.includes('broadcast') || name.includes('organization') || name.includes('news')) {
        return Camera;
    }
    if (name.includes('vehicle') || name.includes('car') || name.includes('driver') || name.includes('transport')) {
        return Compass;
    }
    if (name.includes('legal') || name.includes('agreement') || name.includes('consent') || name.includes('declaration') || name.includes('terms')) {
        return ShieldCheck;
    }
    if (name.includes('security') || name.includes('clearance') || name.includes('police') || name.includes('background')) {
        return Shield;
    }
    if (name.includes('document') || name.includes('file') || name.includes('attachment') || name.includes('upload')) {
        return FileCheck;
    }
    if (name.includes('equipment') || name.includes('gear') || name.includes('device')) {
        return Briefcase;
    }
    if (name.includes('crew') || name.includes('member') || name.includes('team') || name.includes('staff')) {
        return Users;
    }
    return FileText;
};

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

    // Fetch individual crew members for multi-member application clearance
    const { data: crewData } = useGetApplicationMembersQuery(Number(id), { skip: !id });

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
    const [selectedCrewMembers, setSelectedCrewMembers] = useState<number[]>([]);
    const [crewMemberNotes, setCrewMemberNotes] = useState<Record<number, string>>({});
    const [fieldSearchQuery, setFieldSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

    // Tab navigation and UX states
    const [selectedTab, setSelectedTab] = useState<string>('');
    const tabsRailRef = useRef<HTMLDivElement>(null);
    const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
    const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);
    const [tabSearchQuery, setTabSearchQuery] = useState('');
    const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);

    const handleCopyValue = (val: string, fieldId: string) => {
        if (!val) return;
        navigator.clipboard.writeText(val);
        setCopiedFieldId(fieldId);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedFieldId(null), 2000);
    };

    // Fetch application data solely by ID
    const { data: application, isLoading: applicationLoading } = useGetApplicationByIdQuery(Number(id), {
        skip: !id,
        refetchOnMountOrArgChange: true
    });

    const crewMembersList = crewData?.members || application?.members || [];

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
            const approvalsList = (application?.approvals || []).filter((a: any) => {
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
            setSelectedCrewMembers([]);
            setCrewMemberNotes({});
            setFieldSearchQuery('');
            setSelectedCategoryFilter('ALL');
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

    // Data Mapping - Extensive
    const formData = application?.formData || {};
    // Equipment now fetched via dedicated paginated query (eqData)
    const totalDeclaredEquipment = application?.equipment?.length ?? eqData?.total ?? 0;

    const fullname = formData.first_name
        ? `${formData.first_name} ${formData.last_name || ''}`
        : (application?.user?.fullName || 'Unknown');

    const roleTitle = formData.occupation || 'Journalist';
    const country = application?.applyingFromCountry?.code || formData.country || 'ET';
    const fullCountryName = application?.applyingFromCountry?.name || countryName(country);

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
    const approvals = application?.approvals || [];

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

    const isMultiMemberForm = Boolean(
        application?.form?.allowMultiMember ||
        crewMembersList.length > 0
    );

    const allTabsList = useMemo(() => {
        const list: {
            id: string;
            name: string;
            type: 'category' | 'equipment' | 'crew';
            fieldCount: number;
            icon: any;
            index: number;
        }[] = displayCategories.map((cat, idx) => ({
            id: cat.name,
            name: cat.name,
            type: 'category',
            fieldCount: cat.fields.length,
            icon: getCategoryIcon(cat.name),
            index: idx
        }));

        list.push({
            id: 'equipment',
            name: 'Equipment',
            type: 'equipment',
            fieldCount: eqData?.total ?? totalDeclaredEquipment,
            icon: Briefcase,
            index: list.length
        });

        if (isMultiMemberForm) {
            list.push({
                id: 'crew',
                name: 'Crew Members',
                type: 'crew',
                fieldCount: crewMembersList.length,
                icon: Users,
                index: list.length
            });
        }

        return list;
    }, [displayCategories, eqData?.total, totalDeclaredEquipment, isMultiMemberForm, crewMembersList.length]);

    useEffect(() => {
        if (!selectedTab && allTabsList.length > 0) {
            setSelectedTab(allTabsList[0].id);
        }
    }, [allTabsList, selectedTab]);

    const currentActiveTab = selectedTab || (allTabsList[0]?.id || 'equipment');
    const currentTabIndex = allTabsList.findIndex(t => t.id === currentActiveTab);
    const prevTab = currentTabIndex > 0 ? allTabsList[currentTabIndex - 1] : null;
    const nextTab = currentTabIndex >= 0 && currentTabIndex < allTabsList.length - 1 ? allTabsList[currentTabIndex + 1] : null;

    const checkTabsScroll = () => {
        if (tabsRailRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsRailRef.current;
            setCanScrollTabsLeft(scrollLeft > 6);
            setCanScrollTabsRight(scrollLeft < scrollWidth - clientWidth - 6);
        }
    };

    useEffect(() => {
        checkTabsScroll();
        const handleResize = () => checkTabsScroll();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [allTabsList]);

    const scrollTabsRail = (direction: 'left' | 'right') => {
        if (tabsRailRef.current) {
            const scrollAmount = 280;
            tabsRailRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            setTimeout(checkTabsScroll, 320);
        }
    };

    const handleSelectTab = (tabId: string) => {
        setSelectedTab(tabId);
        setTabSearchQuery('');
        setTimeout(() => {
            const trigger = document.getElementById(`tab-pill-${tabId}`);
            if (trigger) {
                trigger.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
            checkTabsScroll();
        }, 60);
    };

    // Form-specific fields for the Rejection Dialog: strictly scoped to THIS application's form
    const applicationFormFields = (() => {
        const fieldsList: {
            field_name: string;
            label: string;
            field_type?: string;
            categoryName?: string;
            display_order?: number;
        }[] = [];
        const seenNames = new Set<string>();

        // 1. Extract from displayCategories (already scoped strictly to application.form)
        if (displayCategories && displayCategories.length > 0) {
            displayCategories.forEach((cat: any) => {
                (cat.fields || []).forEach((f: any) => {
                    if (f.field_name && !seenNames.has(f.field_name)) {
                        // In multi-member forms, individual crew fields are flagged in the dedicated Crew section
                        if (application?.form?.allowMultiMember && f.applies_to_crew) {
                            return;
                        }
                        seenNames.add(f.field_name);
                        fieldsList.push({
                            field_name: f.field_name,
                            label: f.label || f.field_name,
                            field_type: f.field_type,
                            categoryName: cat.name,
                            display_order: f.display_order
                        });
                    }
                });
            });
        }

        // 2. If no categories found, check direct application.form FormFields
        if (fieldsList.length === 0 && (application?.form as any)?.FormFields) {
            ((application?.form as any)?.FormFields || []).forEach((f: any) => {
                if (f.field_name && !seenNames.has(f.field_name)) {
                    if (application?.form?.allowMultiMember && f.applies_to_crew) {
                        return;
                    }
                    seenNames.add(f.field_name);
                    fieldsList.push({
                        field_name: f.field_name,
                        label: f.label || f.field_name,
                        field_type: f.field_type,
                        categoryName: 'General Information',
                        display_order: f.display_order
                    });
                }
            });
        }

        // 3. Fallback: if application.form is missing, infer solely from formData keys belonging to this application
        if (fieldsList.length === 0 && application?.formData) {
            Object.keys(application.formData).forEach((key) => {
                if (['manually_added', 'status', 'members', 'equipment', 'crewMembers'].includes(key)) return;
                if (!seenNames.has(key)) {
                    seenNames.add(key);
                    const matchingTpl = templates?.find((t: any) => t.field_name === key);
                    fieldsList.push({
                        field_name: key,
                        label: matchingTpl?.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        field_type: matchingTpl?.field_type || 'text',
                        categoryName: 'Application Fields'
                    });
                }
            });
        }

        return fieldsList;
    })();

    const availableCategories = (() => {
        const set = new Set<string>();
        applicationFormFields.forEach(f => {
            if (f.categoryName) set.add(f.categoryName);
        });
        return Array.from(set);
    })();

    const filteredFormFields = applicationFormFields.filter(f => {
        const matchesCat = selectedCategoryFilter === 'ALL' || f.categoryName === selectedCategoryFilter;
        if (!matchesCat) return false;
        if (!fieldSearchQuery.trim()) return true;
        const q = fieldSearchQuery.toLowerCase();
        return (
            f.label.toLowerCase().includes(q) ||
            f.field_name.toLowerCase().includes(q) ||
            (f.categoryName && f.categoryName.toLowerCase().includes(q))
        );
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

    if (applicationLoading || templatesLoading) {
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

    return (
        <div className="space-y-6">
            


            {/* Top Navigation & Breadcrumbs Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        onClick={() => navigate(-1)}
                        title="Go back"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <span className="hover:text-slate-600 cursor-pointer" onClick={() => navigate('/dashboard')}>Dashboard</span>
                            <span>/</span>
                            <span className="hover:text-slate-600 cursor-pointer" onClick={() => navigate(-1)}>Applications</span>
                            <span>/</span>
                            <span className="text-slate-600 font-semibold truncate max-w-[200px]">{fullname}</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Journalist Profile & Dossier</h2>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportJournalistDetailToCSV(application)}
                        className="gap-1.5 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs shadow-2xs"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportJournalistDetailToPDF(application as any)}
                        className="gap-1.5 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs shadow-2xs"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Export PDF
                    </Button>
                    {application.equipment?.some((e: any) => e.status === 'APPROVED') && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => exportClearanceLetterToPDF(application)}
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                        >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Clearance Letter
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content - Left */}
                <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
                    {/* Executive Dossier Header Card */}
                    <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                        {/* Reference header strip */}
                        <div className="bg-slate-50/80 border-b border-slate-100 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="bg-white text-slate-700 font-bold border-slate-200 shadow-2xs">
                                    {application?.form?.name || 'Accreditation Dossier'}
                                </Badge>
                                <span className="font-mono text-slate-500 font-medium">Ref: #APP-{application.id}</span>
                                <button
                                    type="button"
                                    onClick={() => handleCopyValue(String(application.id), 'app-id')}
                                    className="text-slate-400 hover:text-blue-600 transition-colors"
                                    title="Copy Application ID"
                                >
                                    {copiedFieldId === 'app-id' ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span>Applied: {application.createdAt ? new Date(application.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                            </div>
                        </div>

                        <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                                <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-md ring-1 ring-slate-200 shrink-0">
                                    <img src={photoUrl} alt={fullname} className="h-full w-full object-cover" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{fullname}</h3>
                                        {/* Status badge */}
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                                            application.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                            application.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                            'bg-amber-100 text-amber-800 border border-amber-200'
                                        }`}>
                                            {application.status === 'APPROVED' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                                             application.status === 'REJECTED' ? <XCircle className="h-3.5 w-3.5" /> :
                                             <Clock className="h-3.5 w-3.5" />}
                                            {application.status}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600">
                                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg font-semibold text-slate-700">
                                            <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                                            <span>{roleTitle}</span>
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg font-semibold text-slate-700">
                                            <span className="text-sm leading-none">{getFlagEmoji(country)}</span>
                                            <span>{fullCountryName}</span>
                                        </div>
                                        {organization && (
                                            <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg font-semibold text-slate-700">
                                                <Building className="h-3.5 w-3.5 text-slate-500" />
                                                <span>{formData.media_house || formData.media_organization || formData.organization || organization}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact metadata chips */}
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-500">
                                        {(formData.email || application.user?.email) && (
                                            <span className="inline-flex items-center gap-1 hover:text-slate-800 font-medium">
                                                <Mail className="h-3 w-3 text-slate-400" />
                                                {formData.email || application.user?.email}
                                            </span>
                                        )}
                                        {(formData.phone_number || formData.phone || application.user?.phoneNumber) && (
                                            <span className="inline-flex items-center gap-1 hover:text-slate-800 font-medium">
                                                <Phone className="h-3 w-3 text-slate-400" />
                                                {formData.phone_number || formData.phone || application.user?.phoneNumber}
                                            </span>
                                        )}
                                        {(formData.passport_number || formData.passportNumber) && (
                                            <span className="inline-flex items-center gap-1 font-mono text-slate-700 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                                                Passport: {formData.passport_number || formData.passportNumber}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Executive Multi-Tab Navigation Rail */}
                    <Tabs value={currentActiveTab} onValueChange={handleSelectTab} className="w-full">
                        {/* Tab Bar Container */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-2 mb-6">
                            <div className="flex items-center gap-1.5">
                                {/* Left Scroll Chevron */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => scrollTabsRail('left')}
                                    disabled={!canScrollTabsLeft}
                                    className={`h-9 w-9 shrink-0 rounded-xl transition-all ${
                                        canScrollTabsLeft
                                            ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                            : 'text-slate-300 opacity-40 cursor-not-allowed'
                                    }`}
                                    title="Scroll categories left"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {/* Horizontally Scrollable Tabs Rail */}
                                <div
                                    ref={tabsRailRef}
                                    onScroll={checkTabsScroll}
                                    className="flex-1 overflow-x-auto scrollbar-none scroll-smooth flex items-center gap-1.5 py-0.5 px-1"
                                >
                                    <TabsList className="bg-transparent h-auto p-0 gap-1.5 flex items-center shrink-0">
                                        {allTabsList.map((tab) => {
                                            const Icon = tab.icon;
                                            const isActive = currentActiveTab === tab.id;
                                            return (
                                                <TabsTrigger
                                                    key={tab.id}
                                                    id={`tab-pill-${tab.id}`}
                                                    value={tab.id}
                                                    onClick={() => handleSelectTab(tab.id)}
                                                    className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 select-none ${
                                                        isActive
                                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-600'
                                                            : 'bg-slate-50/80 hover:bg-slate-100/90 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                                                    }`}
                                                >
                                                    <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                                    <span className="truncate max-w-[160px] sm:max-w-[200px]">{tab.name}</span>
                                                    <span
                                                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0 transition-colors ${
                                                            isActive
                                                                ? 'bg-white/20 text-white'
                                                                : 'bg-slate-200/70 text-slate-600 group-hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        {tab.fieldCount}
                                                    </span>
                                                </TabsTrigger>
                                            );
                                        })}
                                    </TabsList>
                                </div>

                                {/* Right Scroll Chevron */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => scrollTabsRail('right')}
                                    disabled={!canScrollTabsRight}
                                    className={`h-9 w-9 shrink-0 rounded-xl transition-all ${
                                        canScrollTabsRight
                                            ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                            : 'text-slate-300 opacity-40 cursor-not-allowed'
                                    }`}
                                    title="Scroll categories right"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>

                                {/* DropdownMenu Jump Selector for Many Tabs */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-9 gap-1.5 px-3 rounded-xl border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 bg-slate-50/70 shrink-0 font-bold text-xs"
                                        >
                                            <Layers className="h-3.5 w-3.5 text-blue-600" />
                                            <span className="hidden sm:inline">All Sections</span>
                                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-slate-200/80 text-slate-700 font-bold">
                                                {allTabsList.length}
                                            </Badge>
                                            <ChevronDown className="h-3 w-3 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 max-h-[360px] overflow-y-auto p-1.5">
                                        <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5">
                                            Jump to Section ({allTabsList.length})
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {allTabsList.map((tab, idx) => {
                                            const Icon = tab.icon;
                                            const isActive = currentActiveTab === tab.id;
                                            return (
                                                <DropdownMenuItem
                                                    key={tab.id}
                                                    onClick={() => handleSelectTab(tab.id)}
                                                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs ${
                                                        isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 truncate pr-2">
                                                        <span className="text-[10px] font-bold text-slate-400 w-4 text-center">{idx + 1}</span>
                                                        <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                                        <span className="truncate">{tab.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 font-bold text-slate-600">
                                                            {tab.fieldCount}
                                                        </span>
                                                        {isActive && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                                    </div>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Dynamic Category Content Tabs */}
                        {displayCategories.map((category, catIdx) => {
                            const CatIcon = getCategoryIcon(category.name);
                            const sortedFields = (category.fields || []).slice().sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
                            const fieldsToRender = sortedFields.filter((field: any) => {
                                if (!tabSearchQuery.trim()) return true;
                                const q = tabSearchQuery.toLowerCase();
                                const label = (field.label || '').toLowerCase();
                                const fname = (field.field_name || '').toLowerCase();
                                const val = String(formData[field.field_name] || '').toLowerCase();
                                return label.includes(q) || fname.includes(q) || val.includes(q);
                            });

                            return (
                                <TabsContent key={category.name} value={category.name} className="mt-0 focus-visible:outline-none">
                                    <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                                        {/* Category Header Banner */}
                                        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                                                    <CatIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-lg font-bold text-slate-900">{category.name}</h3>
                                                        <Badge variant="outline" className="text-[10px] font-bold text-blue-700 bg-blue-50/80 border-blue-200">
                                                            Section {catIdx + 1} of {allTabsList.length}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {category.fields.length} {category.fields.length === 1 ? 'information field' : 'information fields'} declared in this category
                                                    </p>
                                                </div>
                                            </div>

                                            {/* In-category search filter if fields > 4 */}
                                            {category.fields.length > 4 && (
                                                <div className="relative sm:w-64">
                                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                    <Input
                                                        placeholder={`Filter ${category.name}...`}
                                                        value={tabSearchQuery}
                                                        onChange={(e) => setTabSearchQuery(e.target.value)}
                                                        className="h-8 pl-8 pr-8 text-xs bg-white rounded-lg border-slate-200"
                                                    />
                                                    {tabSearchQuery && (
                                                        <button
                                                            onClick={() => setTabSearchQuery('')}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-4 sm:p-6 space-y-6">
                                            {fieldsToRender.length === 0 ? (
                                                <div className="py-12 text-center text-slate-400 text-xs italic bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                                                    {tabSearchQuery ? `No fields match "${tabSearchQuery}".` : 'No fields found in this category.'}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {fieldsToRender.map((field: any) => {
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

                                                        const renderFieldTile = (f: any, val: any) => {
                                                            // File upload attachment field
                                                            if (f.field_type === 'file') {
                                                                const files = getFiles(val);
                                                                if (files.length === 0) return null;
                                                                return (
                                                                    <div key={f.field_name} className={`col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-3 ${f.is_sub_field ? 'border-l-4 border-l-blue-500 bg-blue-50/20' : ''}`}>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{f.label}</span>
                                                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                                                {files.length} {files.length === 1 ? 'file' : 'files'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                                            {files.map((file: string, idx: number) => {
                                                                                const url = getFileUrl(file);
                                                                                const isImg = file.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                                                                                return (
                                                                                    <a
                                                                                        key={idx}
                                                                                        href={url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="group relative flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-xs transition-all"
                                                                                    >
                                                                                        <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                                                            {isImg ? (
                                                                                                <img src={url} alt={f.label} className="h-full w-full object-cover" />
                                                                                            ) : (
                                                                                                <FileText className="h-5 w-5 text-blue-600" />
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="min-w-0 flex-1">
                                                                                            <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">
                                                                                                {f.label} {files.length > 1 ? `#${idx + 1}` : ''}
                                                                                            </p>
                                                                                            <p className="text-[10px] text-slate-400 truncate mt-0.5">Click to view document</p>
                                                                                        </div>
                                                                                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                                                                                    </a>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            // Repeater / Table field
                                                            if (f.field_type === 'repeater' || f.field_type === 'table' || f.field_type === 'repeater_table') {
                                                                const rows = Array.isArray(val) ? val : [];
                                                                let opts: any = {};
                                                                try {
                                                                    opts = typeof f.field_options === 'string' ? JSON.parse(f.field_options) : f.field_options || {};
                                                                } catch { }
                                                                const subfields: any[] = opts.subfields || [];

                                                                return (
                                                                    <div key={f.field_name} className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
                                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{f.label}</span>
                                                                        {rows.length === 0 ? (
                                                                            <p className="text-xs font-medium text-slate-400 italic">No entries provided</p>
                                                                        ) : (
                                                                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
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

                                                            // Checkbox group
                                                            if (f.field_type === 'checkbox_group') {
                                                                const items = Array.isArray(val) ? val : typeof val === 'string' && val.trim() ? [val] : [];
                                                                return (
                                                                    <div key={f.field_name} className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{f.label}</span>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {items.length > 0 ? (
                                                                                items.map((item: string, iIdx: number) => (
                                                                                    <span key={iIdx} className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200/60 font-semibold text-xs rounded-lg">
                                                                                        {item}
                                                                                    </span>
                                                                                ))
                                                                            ) : (
                                                                                <span className="text-xs text-slate-400 italic">None selected</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            // Long text / textarea
                                                            if (f.field_type === 'textarea') {
                                                                return (
                                                                    <div key={f.field_name} className="col-span-1 sm:col-span-2 lg:col-span-3 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2">
                                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{f.label}</span>
                                                                        <div className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-200/60">
                                                                            {val ? String(val) : <span className="text-xs text-slate-400 italic">Not provided</span>}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            // Default standard field tile
                                                            return (
                                                                <div
                                                                    key={f.field_name}
                                                                    className={`group relative bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-blue-200 hover:shadow-xs transition-all rounded-xl p-3.5 flex flex-col justify-between ${
                                                                        f.is_sub_field ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-1.5">
                                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 line-clamp-1" title={f.label}>
                                                                            {f.label}
                                                                        </span>
                                                                        {val && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleCopyValue(String(val), f.field_name)}
                                                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600 p-0.5 rounded"
                                                                                title="Copy value"
                                                                            >
                                                                                {copiedFieldId === f.field_name ? <CheckCheck className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-1.5">
                                                                        {val === undefined || val === null || val === '' ? (
                                                                            <span className="text-xs text-slate-400 italic">Not provided</span>
                                                                        ) : typeof val === 'boolean' ? (
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${val ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                                                {val ? 'Yes' : 'No'}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-sm font-bold text-slate-900 break-words">{String(val)}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        };

                                                        return (
                                                            <React.Fragment key={field.field_name}>
                                                                {renderFieldTile(field, value)}
                                                                {activeSubFields.map(sf => renderFieldTile(sf, formData[sf.field_name]))}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Linear Tab Navigation Controls at Bottom of Card */}
                                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                                                {prevTab ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleSelectTab(prevTab.id)}
                                                        className="text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl gap-1.5"
                                                    >
                                                        <ArrowLeft className="h-3.5 w-3.5" />
                                                        <span>Previous: {prevTab.name}</span>
                                                    </Button>
                                                ) : <div />}

                                                {nextTab && (
                                                    <Button
                                                        type="button"
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleSelectTab(nextTab.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl gap-1.5 shadow-xs"
                                                    >
                                                        <span>Next: {nextTab.name}</span>
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            );
                        })}

                        {/* Equipment Content - Server Paginated */}
                        <TabsContent value="equipment" className="mt-0 focus-visible:outline-none">
                            <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                                <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/30">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                                                <Briefcase className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg font-bold text-slate-900">Declared Equipment</CardTitle>
                                                    <Badge variant="outline" className="text-[10px] font-bold text-blue-700 bg-blue-50/80 border-blue-200">
                                                        {eqData?.total ?? totalDeclaredEquipment} Items
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">Media gear, cameras, transmission and drone hardware declared for customs clearance</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                                            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => { setEqFilter(status); setEqPage(1); }}
                                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                                        eqFilter === status
                                                            ? status === 'APPROVED' ? 'bg-emerald-600 text-white shadow-xs'
                                                            : status === 'REJECTED' ? 'bg-rose-600 text-white shadow-xs'
                                                            : status === 'PENDING' ? 'bg-amber-500 text-white shadow-xs'
                                                            : 'bg-white text-slate-900 shadow-xs'
                                                            : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                                >
                                                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 space-y-4">
                                    {eqLoading ? (
                                        <div className="flex items-center justify-center py-16">
                                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                            <span className="ml-2 text-sm text-slate-500 font-medium">Loading equipment records...</span>
                                        </div>
                                    ) : !eqData?.equipment || eqData.equipment.length === 0 ? (
                                        <div className="text-center py-16 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                            <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500 font-medium text-sm">No equipment found{eqFilter !== 'ALL' ? ` with status "${eqFilter}"` : ''}.</p>
                                        </div>
                                    ) : (
                                        <div className={`space-y-3.5 ${eqFetching ? 'opacity-50 pointer-events-none' : ''}`}>
                                            {eqData.equipment.map((item, idx) => (
                                                <div key={item.id || idx} className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TYPE</p>
                                                            <p className="text-sm font-bold text-slate-900 mt-0.5">{item.type}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DESCRIPTION</p>
                                                            <p className="text-sm text-slate-800 mt-0.5">{item.description}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SERIAL NO.</p>
                                                            <p className="text-sm font-mono text-slate-700 mt-0.5">{item.serialNumber || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VALUE</p>
                                                            <p className="text-sm font-bold text-slate-900 mt-0.5">{item.value} {item.currency}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QUANTITY</p>
                                                            <p className="text-sm font-bold text-slate-900 mt-0.5">{item.quantity}</p>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STATUS</p>
                                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full w-fit mt-0.5 ${item.status?.toUpperCase() === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : item.status?.toUpperCase() === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {item.rejectionReason && item.status === 'REJECTED' && (
                                                        <div className="mt-3 pt-3 border-t border-rose-100 bg-rose-50/50 p-2.5 rounded-lg">
                                                            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">REJECTION REASON</p>
                                                            <p className="text-xs text-rose-800 mt-0.5">{item.rejectionReason}</p>
                                                        </div>
                                                    )}

                                                    {/* Equipment Approval Buttons */}
                                                    {canUpdateEquipment && (
                                                        <div className="mt-3 pt-3 border-t border-slate-200/60 flex gap-2">
                                                            {item.status?.toUpperCase() !== 'APPROVED' && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-[#009b4d] hover:bg-[#007a3d] text-white font-bold text-xs rounded-lg"
                                                                    onClick={() => openEquipmentDialog(item, EquipmentStatus.APPROVED)}
                                                                    disabled={isEquipmentUpdating}
                                                                >
                                                                    {isEquipmentUpdating && selectedEquipment?.id === item.id && equipmentStatus === EquipmentStatus.APPROVED ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                                                    ) : (
                                                                        <Check className="h-3.5 w-3.5 mr-1.5" />
                                                                    )}
                                                                    {isPmoOrGc ? 'Send Consent' : 'Approve'}
                                                                </Button>
                                                            )}
                                                            {item.status?.toUpperCase() === 'APPROVED' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-amber-600 border-amber-200 hover:bg-amber-50 font-bold text-xs rounded-lg"
                                                                    onClick={() => handleEquipmentApproval(item.id, EquipmentStatus.PENDING)}
                                                                    disabled={isEquipmentUpdating}
                                                                >
                                                                    {isEquipmentUpdating && selectedEquipment?.id === item.id ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                                                    ) : (
                                                                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                                                    )}
                                                                    Revoke Approval
                                                                </Button>
                                                            )}
                                                            {!isPmoOrGc && item.status?.toUpperCase() !== 'REJECTED' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold text-xs rounded-lg"
                                                                    onClick={() => openEquipmentDialog(item, EquipmentStatus.REJECTED)}
                                                                    disabled={isEquipmentUpdating}
                                                                >
                                                                    <X className="h-3.5 w-3.5 mr-1.5" />
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
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <p className="text-xs text-slate-500 font-medium">
                                                Showing {((eqData.currentPage - 1) * eqData.limit) + 1}–{Math.min(eqData.currentPage * eqData.limit, eqData.total)} of {eqData.total}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={eqPage <= 1 || eqFetching}
                                                    onClick={() => setEqPage(p => Math.max(1, p - 1))}
                                                    className="h-8 w-8 p-0 rounded-lg"
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
                                                            className={`h-8 w-8 p-0 text-xs font-bold rounded-lg ${eqPage === pageNum ? 'bg-blue-600 text-white' : ''}`}
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
                                                    className="h-8 w-8 p-0 rounded-lg"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Linear Tab Navigation Controls at Bottom of Equipment Card */}
                                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                                        {prevTab ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSelectTab(prevTab.id)}
                                                className="text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl gap-1.5"
                                            >
                                                <ArrowLeft className="h-3.5 w-3.5" />
                                                <span>Previous: {prevTab.name}</span>
                                            </Button>
                                        ) : <div />}

                                        {nextTab && (
                                            <Button
                                                type="button"
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleSelectTab(nextTab.id)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl gap-1.5 shadow-xs"
                                            >
                                                <span>Next: {nextTab.name}</span>
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Crew Members Manifest Tab */}
                        {isMultiMemberForm && (
                            <TabsContent value="crew" className="mt-0 focus-visible:outline-none">
                                <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                                    <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg font-bold text-slate-900">Crew Members & Production Personnel</CardTitle>
                                                    <Badge variant="outline" className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 border-indigo-200">
                                                        {crewMembersList.length} Members
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">Review credential details, passport numbers, and roles for each crew member</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 space-y-6">
                                        <CrewMemberReviewTable applicationId={Number(id)} />

                                        {/* Linear Tab Navigation Controls at Bottom of Crew Card */}
                                        <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                                            {prevTab ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSelectTab(prevTab.id)}
                                                    className="text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl gap-1.5"
                                                >
                                                    <ArrowLeft className="h-3.5 w-3.5" />
                                                    <span>Previous: {prevTab.name}</span>
                                                </Button>
                                            ) : <div />}

                                            {nextTab && (
                                                <Button
                                                    type="button"
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleSelectTab(nextTab.id)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl gap-1.5 shadow-xs"
                                                >
                                                    <span>Next: {nextTab.name}</span>
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>

                {/* Right Sidebar - Decision Panel */}
                <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
                    <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                        <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4 sm:p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Decision Panel</h3>
                                        <div className="flex flex-col gap-1 mt-0.5">
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
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 font-bold rounded-xl text-xs"
                                    onClick={() => setShowHistoryDialog(true)}
                                >
                                    <History className="h-3.5 w-3.5 mr-1.5" />
                                    History
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 space-y-4">
                            <SystemCheckSuccess show={showSystemCheck} />

                            {/* Crew Manifest Information Card */}
                            {Boolean(application?.form?.allowMultiMember || (crewData?.members && crewData.members.length > 0) || (application?.members && application.members.length > 0)) && (
                                <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border border-indigo-200 rounded-xl p-3.5 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs uppercase tracking-wider">
                                            <Users className="h-4 w-4 text-indigo-600" />
                                            Crew Manifest
                                        </div>
                                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                                            {crewMembersList.length} Members
                                        </span>
                                    </div>
                                    <p className="text-xs text-indigo-800/90 leading-relaxed">
                                        Inspect personnel credentials in the <strong>Crew Members</strong> tab. If any member has issues, you can flag them with a targeted note during rejection.
                                    </p>
                                </div>
                            )}
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
            <Dialog open={showRejectionDialog} onOpenChange={(open) => {
                setShowRejectionDialog(open);
                if (!open) {
                    setSelectedCrewMembers([]);
                    setCrewMemberNotes({});
                    setSelectedFields([]);
                    setFieldNotes({});
                    setFieldSearchQuery('');
                    setSelectedCategoryFilter('ALL');
                }
            }}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <X className="h-5 w-5" /> Detailed Rejection Feedback
                        </DialogTitle>
                        <DialogDescription>
                            Select the specific fields of this <strong>{application.form?.name || 'Application'}</strong> that require correction and provide feedback for each. The applicant will see these notes on their dashboard and in their notification email.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <Label className="text-sm font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                                    <span>Select Fields to Flag</span>
                                    <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full border border-red-200">
                                        {selectedFields.length} of {applicationFormFields.length} selected
                                    </span>
                                </Label>
                                {selectedFields.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFields([])}
                                        className="text-xs text-red-600 hover:text-red-800 font-semibold"
                                    >
                                        Clear Selection ({selectedFields.length})
                                    </button>
                                )}
                            </div>

                            {/* Search & Category Filter */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        placeholder={`Search ${applicationFormFields.length} fields in this form...`}
                                        value={fieldSearchQuery}
                                        onChange={(e) => setFieldSearchQuery(e.target.value)}
                                        className="h-8 pl-8 text-xs bg-white"
                                    />
                                </div>
                                {availableCategories.length > 1 && (
                                    <select
                                        value={selectedCategoryFilter}
                                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                        className="h-8 text-xs border border-gray-200 rounded-md px-2.5 bg-white text-gray-700 font-medium shrink-0 focus:outline-none focus:ring-1 focus:ring-red-400"
                                    >
                                        <option value="ALL">All Categories ({availableCategories.length})</option>
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                                {filteredFormFields.length === 0 ? (
                                    <div className="col-span-2 py-6 text-center text-xs text-gray-400 italic bg-gray-50 rounded-lg border border-dashed">
                                        No form fields match your search.
                                    </div>
                                ) : (
                                    filteredFormFields.map((field) => {
                                        const isSelected = selectedFields.includes(field.field_name);
                                        const rawVal = formData[field.field_name];
                                        const valDisplay = rawVal !== undefined && rawVal !== null && rawVal !== ''
                                            ? (typeof rawVal === 'object' ? 'Document / Attachment' : String(rawVal))
                                            : 'No entry / Empty';

                                        return (
                                            <div
                                                key={field.field_name}
                                                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'border-red-300 bg-red-50 text-red-900 shadow-2xs'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedFields((prev: string[]) => prev.filter((f: string) => f !== field.field_name));
                                                    } else {
                                                        setSelectedFields((prev: string[]) => [...prev, field.field_name]);
                                                    }
                                                }}
                                            >
                                                <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                                    isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 bg-white'
                                                }`}>
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="text-xs font-bold truncate">{field.label}</p>
                                                        {field.field_type === 'file' && (
                                                            <span className="text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold shrink-0">
                                                                File
                                                            </span>
                                                        )}
                                                    </div>
                                                    {field.categoryName && (
                                                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                                            {field.categoryName}
                                                        </p>
                                                    )}
                                                    <p className="text-[11px] opacity-70 truncate mt-0.5 font-mono">
                                                        {valDisplay}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {selectedFields.length > 0 && (
                            <div className="space-y-3 pt-4 border-t">
                                <Label className="text-xs font-bold uppercase text-gray-700 tracking-wider">
                                    Provide Specific Feedback for Selected Fields ({selectedFields.length})
                                </Label>
                                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                    {selectedFields.map((fieldName) => {
                                        const field = applicationFormFields.find(f => f.field_name === fieldName);
                                        return (
                                            <div key={fieldName} className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold text-gray-900">{field?.label || fieldName}</Label>
                                                    {field?.categoryName && (
                                                        <span className="text-[10px] text-gray-500">{field.categoryName}</span>
                                                    )}
                                                </div>
                                                <Textarea
                                                    placeholder={`Explain why "${field?.label || fieldName}" is being rejected or what needs correction...`}
                                                    className="bg-white text-xs min-h-[60px]"
                                                    value={fieldNotes[fieldName] || ''}
                                                    onChange={(e) => setFieldNotes((prev: Record<string, string>) => ({ ...prev, [fieldName]: e.target.value }))}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Crew Members Selection */}
                        {crewMembersList && crewMembersList.length > 0 && (
                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold uppercase text-gray-700 tracking-wider flex items-center gap-2">
                                        <Users className="w-4 h-4 text-indigo-600" />
                                        Flag Specific Crew Member(s)
                                    </Label>
                                    <span className="text-xs text-gray-400">Click to select member needing corrections</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {crewMembersList.map((member: any) => {
                                        const isSelected = selectedCrewMembers.includes(member.id);
                                        return (
                                            <div
                                                key={member.id}
                                                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'border-red-300 bg-red-50 text-red-900 shadow-2xs'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedCrewMembers((prev) => prev.filter((mid) => mid !== member.id));
                                                    } else {
                                                        setSelectedCrewMembers((prev) => [...prev, member.id]);
                                                    }
                                                }}
                                            >
                                                <div
                                                    className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                                        isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{member.fullName}</p>
                                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                            {member.roleInProduction}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                                        Passport: {member.passportNumber || 'N/A'} • {member.nationality || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {selectedCrewMembers.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        <Label className="text-xs font-bold uppercase text-red-600 tracking-wider">
                                            Required Action / Correction for Flagged Crew Members
                                        </Label>
                                        {selectedCrewMembers.map((memberId) => {
                                            const member = crewMembersList.find((m: any) => m.id === memberId);
                                            return (
                                                <div key={memberId} className="space-y-1.5 p-3.5 rounded-xl bg-red-50/50 border border-red-200">
                                                    <div className="flex items-center justify-between text-xs font-bold text-red-900">
                                                        <span>{member?.fullName} ({member?.roleInProduction})</span>
                                                        <span className="font-mono text-red-700 text-[11px]">Passport: {member?.passportNumber || '—'}</span>
                                                    </div>
                                                    <Textarea
                                                        placeholder={`Explain what ${member?.fullName} or the coordinator must edit/re-upload (e.g. upload renewed passport, re-upload clear photo)...`}
                                                        className="bg-white text-xs"
                                                        rows={2}
                                                        value={crewMemberNotes[memberId] || ''}
                                                        onChange={(e) =>
                                                            setCrewMemberNotes((prev) => ({ ...prev, [memberId]: e.target.value }))
                                                        }
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowRejectionDialog(false);
                                setSelectedCrewMembers([]);
                                setCrewMemberNotes({});
                                setSelectedFields([]);
                                setFieldNotes({});
                                setFieldSearchQuery('');
                                setSelectedCategoryFilter('ALL');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 shadow-lg shadow-red-100"
                            disabled={isStatusUpdating || (selectedFields.length === 0 && selectedCrewMembers.length === 0 && !notes.trim())}
                            onClick={() => {
                                const rejectionDetails: Record<string, any> = {};
                                selectedFields.forEach((fieldName: string) => {
                                    const field = applicationFormFields.find(f => f.field_name === fieldName);
                                    rejectionDetails[field?.label || fieldName] = fieldNotes[fieldName] || 'Incorrect information provided.';
                                });

                                // Add targeted crew member feedback
                                if (selectedCrewMembers.length > 0) {
                                    rejectionDetails.crewMembers = {};
                                    selectedCrewMembers.forEach((memberId) => {
                                        const member = crewMembersList.find((m: any) => m.id === memberId);
                                        const reason = crewMemberNotes[memberId] || 'Correction required for this crew member.';
                                        rejectionDetails[`Crew Member: ${member?.fullName || memberId} (${member?.roleInProduction || 'Crew'})`] = reason;
                                        rejectionDetails.crewMembers[memberId] = {
                                            id: memberId,
                                            fullName: member?.fullName,
                                            role: member?.roleInProduction,
                                            reason
                                        };
                                    });
                                }

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
                                                                {Object.entries(appr.rejectionDetails).map(([fieldName, detailNote]) => {
                                                                    if (fieldName === 'crewMembers' || (typeof detailNote === 'object' && detailNote !== null)) return null;
                                                                    return (
                                                                        <div key={fieldName} className="bg-red-50 border border-red-200 text-red-900 p-2.5 rounded-lg text-xs">
                                                                            <span className="font-bold text-red-700">{fieldName}:</span> {String(detailNote)}
                                                                        </div>
                                                                    );
                                                                })}
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
