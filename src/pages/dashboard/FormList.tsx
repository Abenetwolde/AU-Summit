
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Plus,
    MoreHorizontal,
    Search,
    FileText,
    Pencil,
    Trash2,
    Loader2,
    Calendar,
    CheckCircle2,
    Archive,
    Users,
    UserX,
    Clock,
    AlignLeft,
    Save,
    Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    useGetFormsQuery,
    useDeleteFormMutation,
    useUpdateFormMutation,
    useCreateFormMutation,
    useLazyGetFormByIdQuery,
    Form
} from '@/store/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/auth/context';

export default function FormList() {
    const navigate = useNavigate();
    const { data: forms, isLoading, isError, refetch } = useGetFormsQuery();
    const [deleteForm] = useDeleteFormMutation();
    const [updateForm] = useUpdateFormMutation();
    const [createForm] = useCreateFormMutation();
    const [fetchFormById] = useLazyGetFormByIdQuery();
    const [searchTerm] = useState('');

    // Duplicate Form State
    const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [duplicateTarget, setDuplicateTarget] = useState<Form | null>(null);
    const [duplicateName, setDuplicateName] = useState('');
    const [duplicateDescription, setDuplicateDescription] = useState('');
    const [duplicateDeadline, setDuplicateDeadline] = useState('');

    // Confirmation Modals State
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [statusTarget, setStatusTarget] = useState<{ id: number; status: string; statusName: string } | null>(null);

    const [isTogglingMultiMember, setIsTogglingMultiMember] = useState(false);
    const [multiMemberTarget, setMultiMemberTarget] = useState<{ id: number; formName: string; allowMultiMember: boolean } | null>(null);
    
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isConfirmingStatus, setIsConfirmingStatus] = useState(false);
    const [isConfirmingMultiMember, setIsConfirmingMultiMember] = useState(false);

    // Description Editing State
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isSavingDescription, setIsSavingDescription] = useState(false);
    const [editDescriptionTarget, setEditDescriptionTarget] = useState<{ id: number; name: string; description: string } | null>(null);
    const [formDescriptionInput, setFormDescriptionInput] = useState('');

    const { checkPermission } = useAuth();
    const canCreateForm = checkPermission('form:create');
    const canUpdateForm = checkPermission('form:update');
    const canDeleteForm = checkPermission('form:delete');

    const handleDeleteClick = (id: number) => {
        if (!canDeleteForm) {
            toast.error("You don't have permission to delete forms");
            return;
        }
        setDeleteTarget(id);
        setIsConfirmingDelete(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        
        setIsDeleting(true);
        try {
            await deleteForm(deleteTarget).unwrap();
            toast.success('Form deleted successfully');
            refetch(); // Manually refetch for instant update
        } catch (error) {
            toast.error('Failed to delete form');
        } finally {
            setIsDeleting(false);
            setIsConfirmingDelete(false);
            setDeleteTarget(null);
        }
    };

    const handleStatusChangeClick = (id: number, newStatus: string, statusName: string) => {
        if (!canUpdateForm) {
            toast.error("You don't have permission to update forms");
            return;
        }
        setStatusTarget({ id, status: newStatus, statusName });
        setIsConfirmingStatus(true);
    };

    const confirmStatusChange = async () => {
        if (!statusTarget) return;
        
        const { id, status: newStatus, statusName } = statusTarget;
        setIsChangingStatus(true);
        try {
            const formData = new FormData();
            formData.append('status', newStatus);
            await updateForm({ id, data: formData }).unwrap();
            toast.success(`Form marked as ${statusName} successfully`);
            refetch(); // Manually refetch for instant update
        } catch (error: any) {
            toast.error(error?.data?.error || `Failed to change form status to ${statusName}`);
        } finally {
            setIsChangingStatus(false);
            setIsConfirmingStatus(false);
            setStatusTarget(null);
        }
    };

    const handleMultiMemberClick = (form: Form) => {
        if (!canUpdateForm) {
            toast.error("You don't have permission to update forms");
            return;
        }
        setMultiMemberTarget({
            id: form.form_id,
            formName: form.name,
            allowMultiMember: !form.allowMultiMember
        });
        setIsConfirmingMultiMember(true);
    };

    const confirmMultiMemberChange = async () => {
        if (!multiMemberTarget) return;

        const { id, formName, allowMultiMember } = multiMemberTarget;
        setIsTogglingMultiMember(true);
        try {
            const formData = new FormData();
            formData.append('allowMultiMember', String(allowMultiMember));
            await updateForm({ id, data: formData }).unwrap();
            toast.success(
                allowMultiMember
                    ? `Crew applications enabled for "${formName}"`
                    : `Crew applications disabled for "${formName}"`
            );
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.error || "Failed to change form crew configuration");
        } finally {
            setIsTogglingMultiMember(false);
            setIsConfirmingMultiMember(false);
            setMultiMemberTarget(null);
        }
    };

    const handleOpenEditDescription = (form: Form) => {
        if (!canUpdateForm) {
            toast.error("You don't have permission to update forms");
            return;
        }
        setEditDescriptionTarget({
            id: form.form_id,
            name: form.name,
            description: form.description || ''
        });
        setFormDescriptionInput(form.description || '');
        setIsEditingDescription(true);
    };

    const handleSaveDescription = async () => {
        if (!editDescriptionTarget) return;

        setIsSavingDescription(true);
        try {
            const formData = new FormData();
            formData.append('description', formDescriptionInput);
            await updateForm({ id: editDescriptionTarget.id, data: formData }).unwrap();
            toast.success(`Description updated for "${editDescriptionTarget.name}"`);
            refetch();
            setIsEditingDescription(false);
            setEditDescriptionTarget(null);
        } catch (error: any) {
            toast.error(error?.data?.error || "Failed to update form description");
        } finally {
            setIsSavingDescription(false);
        }
    };

    const handleOpenDuplicate = (form: Form) => {
        if (!canCreateForm) {
            toast.error("You don't have permission to create forms");
            return;
        }
        setDuplicateTarget(form);
        setDuplicateName(`${form.name} (Copy)`);
        setDuplicateDescription(form.description || '');
        setDuplicateDeadline(form.deadline ? new Date(form.deadline).toISOString().slice(0, 16) : '');
        setIsDuplicateOpen(true);
    };

    const confirmDuplicate = async () => {
        if (!duplicateTarget) return;
        if (!duplicateName.trim()) {
            toast.error('Please enter a name for the duplicated form');
            return;
        }

        setIsDuplicating(true);
        try {
            // Fetch complete source form details (including all categories and fields)
            const sourceDetail = await fetchFormById(String(duplicateTarget.form_id)).unwrap();
            if (!sourceDetail) {
                toast.error('Failed to retrieve original form details');
                return;
            }

            const formatNestedFields = (nestedFieldsMap: Record<string, any[]> | undefined) => {
                if (!nestedFieldsMap) return undefined;
                const result: Record<string, any[]> = {};
                for (const [opt, subArr] of Object.entries(nestedFieldsMap)) {
                    if (Array.isArray(subArr) && subArr.length > 0) {
                        result[opt] = subArr.map(sub => ({
                            id: sub.id,
                            label: sub.label,
                            field_name: sub.fieldName || sub.field_name || (sub.label ? sub.label.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'field'),
                            fieldName: sub.fieldName || sub.field_name || (sub.label ? sub.label.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'field'),
                            field_type: sub.type || sub.field_type || 'text',
                            type: sub.type || sub.field_type || 'text',
                            is_required: !!(sub.required || sub.is_required),
                            required: !!(sub.required || sub.is_required),
                            placeholder: sub.placeholder || '',
                            validation_criteria: sub.validation || sub.validation_criteria || {},
                            validation: sub.validation || sub.validation_criteria || {}
                        }));
                    }
                }
                return Object.keys(result).length > 0 ? result : undefined;
            };

            const formatFieldForCreate = (f: any, index: number) => {
                let parsedOptions: any = f.field_options;
                if (typeof parsedOptions === 'string') {
                    try {
                        parsedOptions = JSON.parse(parsedOptions);
                    } catch {
                        parsedOptions = null;
                    }
                }

                let parsedValidation: any = f.validation_criteria;
                if (typeof parsedValidation === 'string') {
                    try {
                        parsedValidation = JSON.parse(parsedValidation);
                    } catch {
                        parsedValidation = {};
                    }
                }

                let fieldOptionsPayload = null;
                if (parsedOptions) {
                    fieldOptionsPayload = {
                        ...parsedOptions,
                        ...(parsedOptions.nestedFields ? { nestedFields: formatNestedFields(parsedOptions.nestedFields) } : {}),
                        ...(parsedOptions.nested_fields ? { nestedFields: formatNestedFields(parsedOptions.nested_fields) } : {})
                    };
                }

                return {
                    field_name: f.field_name || (f.label ? f.label.toLowerCase().replace(/[^a-z0-9]+/g, '_') : `field_${index + 1}`),
                    field_type: f.field_type === 'radio' && f.options?.includes('True') ? 'boolean' : f.field_type === 'dropdown' ? 'select' : (f.field_type || 'text'),
                    label: f.label || '',
                    is_required: Boolean(f.is_required),
                    display_order: f.display_order !== undefined ? f.display_order : index + 1,
                    validation_criteria: parsedValidation || {},
                    visibility_condition: f.visibility_condition || null,
                    applies_to_crew: Boolean(f.applies_to_crew),
                    field_options: fieldOptionsPayload
                };
            };

            const categoriesPayload = (sourceDetail.categories || []).map((cat: any, index: number) => ({
                name: cat.name,
                description: cat.description || null,
                display_order: cat.display_order !== undefined ? cat.display_order : index + 1,
                fields: (cat.fields || []).map((f: any, fIndex: number) => formatFieldForCreate(f, fIndex))
            }));

            const uncategorizedFieldsPayload = (sourceDetail.uncategorizedFields || []).map((f: any, index: number) =>
                formatFieldForCreate(f, index)
            );

            const payload = {
                name: duplicateName.trim(),
                description: duplicateDescription.trim() || undefined,
                status: 'DRAFT',
                type: sourceDetail.type || 'ACCREDITATION',
                deadline: duplicateDeadline ? new Date(duplicateDeadline).toISOString() : null,
                allowMultiMember: Boolean(sourceDetail.allowMultiMember),
                icon: sourceDetail.icon || null,
                categories: categoriesPayload,
                fields: uncategorizedFieldsPayload
            };

            await createForm(payload).unwrap();
            toast.success(`Form duplicated successfully as "${duplicateName.trim()}"`);
            refetch();
            setIsDuplicateOpen(false);
            setDuplicateTarget(null);
        } catch (error: any) {
            console.error('Failed to duplicate form:', error);
            toast.error(error?.data?.error || error?.message || 'Failed to duplicate form');
        } finally {
            setIsDuplicating(false);
        }
    };

    const filteredForms = forms?.filter(form =>
        form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Published</Badge>;
            case 'DRAFT':
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">Draft</Badge>;
            case 'ARCHIVED':
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Archived</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (isError) {
        return <div className="p-8 text-center text-red-500">Failed to load forms. Please try again later.</div>;
    }

    return (
        <div className="p-8 space-y-6 bg-gray-50/50 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Form Management</h1>
                    <p className="text-gray-500 mt-1">Create and manage application forms for accreditation and other processes.</p>
                </div>
                {canCreateForm && (
                    <Button onClick={() => navigate('/dashboard/forms/builder')} className="bg-black hover:bg-gray-800 text-white gap-2">
                        <Plus className="h-4 w-4" /> Create New Form
                    </Button>
                )}
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">All Forms</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search forms..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="w-[360px]">Form Details</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredForms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                            No forms found. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredForms.map((form) => (
                                        <TableRow key={form.form_id}>
                                            <TableCell className="font-medium align-top py-3.5">
                                                <div className="flex items-start gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 border border-blue-100/80">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 max-w-sm sm:max-w-md">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-gray-900 text-sm">{form.name}</span>
                                                            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                                ID: {form.form_id}
                                                            </span>
                                                        </div>
                                                        {form.description ? (
                                                            <div className="group/desc mt-1 flex items-start gap-1.5">
                                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed" title={form.description}>
                                                                    {form.description}
                                                                </p>
                                                                {canUpdateForm && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenEditDescription(form)}
                                                                        className="opacity-0 group-hover/desc:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 shrink-0 p-0.5 rounded"
                                                                        title="Quick edit description"
                                                                    >
                                                                        <Pencil className="h-3 w-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 italic">
                                                                <span>No description provided</span>
                                                                {canUpdateForm && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenEditDescription(form)}
                                                                        className="not-italic text-blue-600 hover:text-blue-700 hover:underline font-medium text-[11px]"
                                                                    >
                                                                        + Add Description
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {form.type}
                                                    </Badge>
                                                    {form.allowMultiMember && (
                                                        <Badge variant="secondary" className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border-indigo-200 gap-1 px-1.5 py-0">
                                                            <Users className="h-2.5 w-2.5" /> Crew Allowed
                                                        </Badge>
                                                    )}
                                                    {form.deadline && (
                                                        <span className={`text-[10px] font-medium flex items-center gap-1 mt-0.5 ${
                                                            new Date(form.deadline).getTime() < Date.now()
                                                                ? 'text-rose-600 font-semibold'
                                                                : 'text-amber-600'
                                                        }`}>
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {new Date(form.deadline).getTime() < Date.now() ? 'Expired: ' : 'Deadline: '}
                                                            {format(new Date(form.deadline), 'MMM d, yyyy HH:mm')}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(form.status)}</TableCell>
                                            <TableCell className="text-gray-500 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(form.updated_at), 'MMM d, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {(canUpdateForm || canDeleteForm || canCreateForm) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            {canUpdateForm && (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => navigate(`/dashboard/forms/builder/${form.form_id}`)}>
                                                                        <Pencil className="mr-2 h-4 w-4" /> Edit Form
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleOpenEditDescription(form)}>
                                                                        <AlignLeft className="mr-2 h-4 w-4 text-slate-600" /> Edit Description
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {canCreateForm && (
                                                                <DropdownMenuItem onClick={() => handleOpenDuplicate(form)}>
                                                                    <Copy className="mr-2 h-4 w-4 text-blue-600" /> Duplicate Form
                                                                </DropdownMenuItem>
                                                            )}
                                                            
                                                            {canUpdateForm && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuLabel className="text-xs text-gray-500 font-normal py-1">Change Status</DropdownMenuLabel>
                                                                    
                                                                    {form.status !== 'PUBLISHED' && (
                                                                        <DropdownMenuItem onClick={() => handleStatusChangeClick(form.form_id, 'PUBLISHED', 'Published')}>
                                                                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Publish Form
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    
                                                                    {form.status !== 'DRAFT' && (
                                                                        <DropdownMenuItem onClick={() => handleStatusChangeClick(form.form_id, 'DRAFT', 'Draft')}>
                                                                            <FileText className="mr-2 h-4 w-4 text-gray-600" /> Mark as Draft
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    
                                                                    {form.status !== 'ARCHIVED' && (
                                                                        <DropdownMenuItem onClick={() => handleStatusChangeClick(form.form_id, 'ARCHIVED', 'Archived')}>
                                                                            <Archive className="mr-2 h-4 w-4 text-amber-600" /> Archive Form
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </>
                                                            )}

                                                            {canUpdateForm && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuLabel className="text-xs text-gray-500 font-normal py-1">Crew Configuration</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => handleMultiMemberClick(form)}>
                                                                        {form.allowMultiMember ? (
                                                                            <>
                                                                                <UserX className="mr-2 h-4 w-4 text-amber-600" /> Disallow Crew (Single Only)
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Users className="mr-2 h-4 w-4 text-indigo-600" /> Allow Crew (Multi-Member)
                                                                            </>
                                                                        )}
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}

                                                            <DropdownMenuSeparator />
                                                            {canDeleteForm && (
                                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(form.form_id)}>
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to delete this form?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the form and all its associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmingDelete(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete Form
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Change Confirmation Modal */}
            <Dialog open={isConfirmingStatus} onOpenChange={setIsConfirmingStatus}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Status Change</DialogTitle>
                        <DialogDescription>
                            {statusTarget?.status === 'PUBLISHED' 
                                ? "Are you sure you want to publish this form? Publishing this form will automatically archive any currently published form and make this form live for new applications."
                                : `Are you sure you want to change this form's status to ${statusTarget?.statusName}?`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmingStatus(false)} disabled={isChangingStatus}>
                            Cancel
                        </Button>
                        <Button 
                            className={statusTarget?.status === 'PUBLISHED' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-black hover:bg-gray-800 text-white'} 
                            onClick={confirmStatusChange} 
                            disabled={isChangingStatus}
                        >
                            {isChangingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Confirm {statusTarget?.statusName}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Multi-Member Crew Configuration Confirmation Modal */}
            <Dialog open={isConfirmingMultiMember} onOpenChange={setIsConfirmingMultiMember}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" />
                            {multiMemberTarget?.allowMultiMember ? "Allow Multi-Member / Crew Applications" : "Disable Crew Applications"}
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            {multiMemberTarget?.allowMultiMember
                                ? `Are you sure you want to enable crew applications for "${multiMemberTarget?.formName}"? Applicants will be able to add and manage multiple production crew members (e.g. Director, Producer, Cameraperson) in a single application.`
                                : `Are you sure you want to disable crew applications for "${multiMemberTarget?.formName}"? New applicants will only be able to submit standard individual applications.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmingMultiMember(false)} disabled={isTogglingMultiMember}>
                            Cancel
                        </Button>
                        <Button
                            className={multiMemberTarget?.allowMultiMember ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-black hover:bg-gray-800 text-white"}
                            onClick={confirmMultiMemberChange}
                            disabled={isTogglingMultiMember}
                        >
                            {isTogglingMultiMember ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                            {multiMemberTarget?.allowMultiMember ? "Enable Crew" : "Disable Crew"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quick Edit Description Modal */}
            <Dialog open={isEditingDescription} onOpenChange={setIsEditingDescription}>
                <DialogContent className="sm:max-w-[540px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlignLeft className="h-5 w-5 text-blue-600" />
                            Edit Form Description
                        </DialogTitle>
                        <DialogDescription>
                            Provide a clear description for <strong>{editDescriptionTarget?.name}</strong>.
                            This will be displayed on the accreditation program card for media applicants.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="form-description-input" className="text-xs font-semibold text-gray-700">
                                Public Program Description
                            </label>
                            <span className="text-[11px] font-normal text-gray-400">
                                {formDescriptionInput.length} characters
                            </span>
                        </div>
                        <textarea
                            id="form-description-input"
                            value={formDescriptionInput}
                            onChange={(e) => setFormDescriptionInput(e.target.value)}
                            placeholder="Describe accreditation scope, eligible media representatives, required press credentials, and key instructions..."
                            rows={5}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y leading-relaxed"
                        />
                        <p className="text-[11px] text-gray-500">
                            Tip: Explain who should apply and what credentials (press badge, assignment letter, passport) they will need.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditingDescription(false)}
                            disabled={isSavingDescription}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveDescription}
                            disabled={isSavingDescription}
                            className="bg-black hover:bg-gray-800 text-white gap-2"
                        >
                            {isSavingDescription ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Description
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Duplicate Form Modal */}
            <Dialog open={isDuplicateOpen} onOpenChange={setIsDuplicateOpen}>
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-gray-900">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                <Copy className="h-4 w-4" />
                            </div>
                            Duplicate Form
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 pt-1">
                            Create a new form with its own unique ID based on{' '}
                            <strong className="text-gray-900 font-semibold">{duplicateTarget?.name}</strong> (ID: #{duplicateTarget?.form_id}).
                            All categories, fields, and options will be duplicated into a new Draft form.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2 space-y-4">
                        {/* Form Name */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="duplicate-form-name" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                    New Form Name <span className="text-red-500">*</span>
                                </label>
                                <span className="text-[11px] text-gray-400">
                                    {duplicateName.length} characters
                                </span>
                            </div>
                            <Input
                                id="duplicate-form-name"
                                value={duplicateName}
                                onChange={(e) => setDuplicateName(e.target.value)}
                                placeholder="e.g. Press Accreditation 2027"
                                className="w-full text-sm"
                                autoFocus
                            />
                        </div>

                        {/* Form Description */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="duplicate-form-description" className="text-xs font-semibold text-gray-700">
                                    Form Description
                                </label>
                                <span className="text-[11px] text-gray-400">
                                    {duplicateDescription.length} characters
                                </span>
                            </div>
                            <textarea
                                id="duplicate-form-description"
                                value={duplicateDescription}
                                onChange={(e) => setDuplicateDescription(e.target.value)}
                                placeholder="Describe the accreditation scope, eligible media representatives, and key instructions..."
                                rows={3}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y leading-relaxed"
                            />
                        </div>

                        {/* Expiration Date / Deadline */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="duplicate-form-deadline" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                                    Expiration Date & Time (Deadline)
                                </label>
                                {duplicateDeadline && (
                                    <button
                                        type="button"
                                        onClick={() => setDuplicateDeadline('')}
                                        className="text-[11px] text-gray-400 hover:text-red-600 underline"
                                    >
                                        Clear deadline
                                    </button>
                                )}
                            </div>
                            <Input
                                id="duplicate-form-deadline"
                                type="datetime-local"
                                value={duplicateDeadline}
                                onChange={(e) => setDuplicateDeadline(e.target.value)}
                                className="w-full text-sm font-sans"
                            />
                            <p className="text-[11px] text-gray-500">
                                Optional deadline after which applicants will no longer be able to submit this form.
                            </p>
                        </div>

                        <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-3 text-xs text-blue-900 space-y-1">
                            <div className="font-semibold flex items-center gap-1.5 text-blue-800">
                                <FileText className="h-3.5 w-3.5" /> What gets duplicated?
                            </div>
                            <p className="text-blue-700 leading-relaxed">
                                The new form will be created as a <strong>Draft</strong> with its own unique form ID. All {duplicateTarget?.allowMultiMember ? 'categories, fields, and multi-member crew configuration' : 'categories and fields'} from the original form will be cloned.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDuplicateOpen(false)}
                            disabled={isDuplicating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDuplicate}
                            disabled={isDuplicating || !duplicateName.trim()}
                            className="bg-black hover:bg-gray-800 text-white gap-2"
                        >
                            {isDuplicating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Duplicating Form...
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" /> Duplicate Form
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
