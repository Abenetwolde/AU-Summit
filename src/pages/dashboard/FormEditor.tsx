import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
    Settings2,
    Trash2,
    Type,
    Hash,
    CheckSquare,
    CircleDot,
    Calendar,
    Upload,
    Save,
    Eye,
    ChevronDown,
    AlignLeft,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Monitor,
    Smartphone,
    Tablet,
    X,
    ArrowLeft,
    GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useGetFormFieldTemplatesQuery,
    useCreateFormMutation,
    useGetFormByIdQuery,
    useUpdateFormMutation
} from '@/store/services/api';
import { useParams, useNavigate } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableFieldProps {
    id: string;
    children: (props: { attributes: any; listeners: any; isDragging: boolean }) => React.ReactNode;
}

function SortableField({ id, children }: SortableFieldProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style}>
            {children({ attributes, listeners, isDragging })}
        </div>
    );
}

interface FormField {
    id: string;
    type: 'text' | 'number' | 'checkbox' | 'radio' | 'date' | 'file' | 'dropdown' | 'textarea' | 'boolean' | 'email';
    label: string;
    placeholder?: string;
    required: boolean;
    helpText?: string;
    options?: string[];
    templateId?: number;
    validation?: {
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        minValue?: number;
        maxValue?: number;
        errorMessage?: string;
    };
    displayOrder?: number;
    fieldName?: string; // Original field name from API
}

const FIELD_TYPES = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'textarea', label: 'Text Area', icon: AlignLeft },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'radio', label: 'Radio Group', icon: CircleDot },
    { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
    { type: 'date', label: 'Date Picker', icon: Calendar },
    { type: 'file', label: 'File Upload', icon: Upload },
] as const;

export function FormEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const { data: templates, isLoading: isLoadingTemplates } = useGetFormFieldTemplatesQuery();
    const { data: existingForm, isLoading: isLoadingForm } = useGetFormByIdQuery(id!, { skip: !isEditMode });

    const [createForm, { isLoading: isCreating }] = useCreateFormMutation();
    const [updateForm, { isLoading: isUpdating }] = useUpdateFormMutation();

    const [fields, setFields] = useState<FormField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewStep, setPreviewStep] = useState(1);
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    const [formName, setFormName] = useState("Press Accreditation Application");
    const [formDescription, setFormDescription] = useState("Standard application form for press accreditation.");
    const [formType, setFormType] = useState("ACCREDITATION");
    const [formStatus, setFormStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("PUBLISHED");

    // Populate fields from templates (only for new forms initially, or if we want sidebar templates)
    // Actually, distinct logic: 
    // If Edit Mode: populate from existingForm
    // If Create Mode: start empty or with default? The original utilized templates to pre-fill. 
    // Let's keep template logic for "toolbox" but initial state depends on mode.

    useEffect(() => {
        if (isEditMode && existingForm) {
            setFormName(existingForm.name);
            setFormDescription(existingForm.description || "");
            setFormType(existingForm.type);
            setFormStatus(existingForm.status as any); // Cast for safety if enum varies

            if (existingForm.FormFields) {
                const mapped: FormField[] = existingForm.FormFields.map((f: any) => {
                    let options: string[] = [];
                    if (f.field_options?.options) {
                        options = f.field_options.options;
                    }

                    return {
                        id: String(f.field_id || Math.random()), // Use API ID
                        type: f.field_type === 'boolean' ? 'radio' : f.field_type, // map boolean back to radio/checkbox UI
                        label: f.label,
                        required: f.is_required,
                        placeholder: `Enter ${f.label.toLowerCase()}`,
                        options: options.length > 0 ? options : undefined,
                        validation: f.validation_criteria || {},
                        displayOrder: f.display_order,
                        fieldName: f.field_name,
                        templateId: undefined // Identifying it's an existing field
                    };
                });
                setFields(mapped.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
            }
        } else if (!isEditMode && templates && fields.length === 0) {
            // Optional: Pre-load from templates IF desired. Original code did:
            // setFields(mappedFields);
            // We can preserve that behavior for new forms if that's the "Default"
            // But usually a "Builder" starts empty or with a specific template. 
            // Let's assume the user wants the "Default" template loads if it's a new form.

            const mappedFields: FormField[] = templates.map(t => {
                let type: FormField['type'] = 'text';
                let options: string[] = [];

                if (t.field_type === 'textarea') type = 'textarea';
                else if (t.field_type === 'date') type = 'date';
                else if (t.field_type === 'boolean') type = 'radio';
                else if (t.field_type === 'email') type = 'email';
                else if (t.field_type === 'number') type = 'number';

                if (t.field_options) {
                    try {
                        const parsed = typeof t.field_options === 'string' ? JSON.parse(t.field_options || '{}') : t.field_options;
                        if (parsed.options) options = parsed.options;
                    } catch (e) { }
                }
                if (t.field_type === 'boolean' && options.length === 0) {
                    options = ['True', 'False'];
                }

                return {
                    id: String(t.template_id),
                    templateId: t.template_id,
                    type,
                    label: t.label,
                    required: t.is_required,
                    placeholder: `Enter ${t.label.toLowerCase()}`,
                    options: options.length > 0 ? options : undefined,
                    validation: t.validation_criteria ? (typeof t.validation_criteria === 'string' ? JSON.parse(t.validation_criteria) : t.validation_criteria) : {},
                    displayOrder: t.display_order,
                    fieldName: t.field_name
                };
            }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

            setFields(mappedFields);
        }
    }, [isEditMode, existingForm, templates]);

    const addField = (type: FormField['type']) => {
        const label = `New ${type} field`;
        const newField: FormField = {
            id: `new_${Math.random().toString(36).substr(2, 9)}`,
            type,
            label,
            required: false,
            // Generate snake_case key from label
            fieldName: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
            displayOrder: fields.length + 1,
            // Add default options for choice components
            options: ['checkbox', 'radio', 'dropdown'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
            validation: {}
        };
        setFields([...fields, newField]);
        setSelectedFieldId(newField.id);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => {
            if (f.id === id) {
                const updated = { ...f, ...updates };
                // Keep fieldName in sync with label if it hasn't been manually edited (heuristic)
                // or just enforce user to edit it manually if they want custom.
                if (updates.label && !f.fieldName?.startsWith('custom_')) {
                    // Simple heuristic: always update key unless user specifically set a fixed one? 
                    // For now, let's just enable manual edit and auto-update if it matches pattern
                    updated.fieldName = updates.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                }
                return updated;
            }
            return f;
        }));
    };

    const selectedField = fields.find(f => f.id === selectedFieldId);

    // Check for duplicates across the entire form
    const hasDuplicates = fields.some((f, idx) =>
        fields.some((other, otherIdx) =>
            idx !== otherIdx && (
                f.label.toLowerCase() === other.label.toLowerCase() ||
                f.fieldName === other.fieldName
            )
        )
    );

    // Check specific duplicates for the selected field (for UI feedback)
    const isLabelDuplicate = selectedField
        ? fields.some(f => f.id !== selectedField.id && f.label.toLowerCase() === selectedField.label.toLowerCase())
        : false;

    const isKeyDuplicate = selectedField
        ? fields.some(f => f.id !== selectedField.id && f.fieldName === selectedField.fieldName)
        : false;

    const updateValidation = (id: string, key: keyof NonNullable<FormField['validation']>, value: any) => {
        setFields(fields.map(f => {
            if (f.id === id) {
                const newValidation = { ...f.validation, [key]: value };
                // Filter out empty/undefined
                if (value === '' || value === undefined || value === null) delete newValidation[key];
                return { ...f, validation: newValidation };
            }
            return f;
        }));
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setFields((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);

                const newFields = arrayMove(items, oldIndex, newIndex);
                // Update displayOrder
                return newFields.map((f, idx) => ({ ...f, displayOrder: idx + 1 }));
            });
        }
    };

    const handleSave = async () => {
        if (hasDuplicates) {
            toast.error("Form contains duplicate fields. Please fix errors before saving.");
            return;
        }

        // Construct Payload
        const payload = {
            name: formName,
            description: formDescription,
            status: formStatus,
            type: formType,
            icon: null,
            fields: fields.map((f, index) => ({
                field_name: f.fieldName || f.label.toLowerCase().replace(/ /g, '_'),
                field_type: f.type === 'radio' && f.options?.includes('True') ? 'boolean' : f.type, // Map back to API types if needed
                label: f.label,
                is_required: f.required,
                display_order: index + 1,
                validation_criteria: f.validation || {},
                field_options: f.options ? { options: f.options } : null
            }))
        };

        console.log("Saving Form Payload:", JSON.stringify(payload, null, 2));

        try {
            if (isEditMode) {
                await updateForm({ id: parseInt(id!), data: payload }).unwrap();
                toast.success("Form updated successfully!");
            } else {
                await createForm(payload).unwrap();
                toast.success("Form published successfully!");
            }
            navigate('/dashboard/forms');
        } catch (error) {
            console.error(error);
            toast.error(isEditMode ? "Failed to update form" : "Failed to publish form");
        }
    };

    // Preview Pagination Logic
    const FIELDS_PER_PAGE = 5;
    const totalPages = Math.ceil(fields.length / FIELDS_PER_PAGE);
    const currentPreviewFields = fields.slice((previewStep - 1) * FIELDS_PER_PAGE, previewStep * FIELDS_PER_PAGE);

    const isSaving = isCreating || isUpdating;

    if (isLoadingForm || isLoadingTemplates) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)] gap-4 p-4 bg-gray-50/50">
            {/* Left Sidebar - Tools */}
            <div className="w-full lg:w-64 h-auto lg:h-full flex-shrink-0">
                <div className="mb-4">
                    <Button variant="ghost" className="pl-0 gap-2 text-gray-500 hover:text-gray-900" onClick={() => navigate('/dashboard/forms')}>
                        <ArrowLeft className="h-4 w-4" /> Back to Forms
                    </Button>
                </div>
                <Card className="border-none shadow-sm h-full flex flex-col">
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Toolbox</CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1 px-4">
                        <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 pb-4">
                            {FIELD_TYPES.map((ft) => (
                                <Button
                                    key={ft.type}
                                    variant="outline"
                                    className="flex flex-col h-20 gap-2 text-xs border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50"
                                    onClick={() => addField(ft.type as FormField['type'])}
                                >
                                    <ft.icon className="h-5 w-5" />
                                    {ft.label}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            </div>

            {/* Center - Canvas */}
            <div className="flex-1 min-w-0">
                <Card className="min-h-full border-none shadow-md overflow-hidden flex flex-col bg-white">
                    <CardHeader className="border-b bg-white z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
                        <div className="space-y-1">
                            {isEditMode ? (
                                <Input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="text-xl font-bold font-sans border-none px-0 h-auto focus-visible:ring-0 shadow-none hover:bg-gray-50 rounded px-2 -ml-2 transition-colors"
                                />
                            ) : (
                                <CardTitle className="text-xl font-bold font-sans">{formName}</CardTitle>
                            )}
                            <CardDescription>{fields.length} fields configured</CardDescription>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="w-32">
                                <Select value={formStatus} onValueChange={(val: any) => setFormStatus(val)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                        <SelectItem value="PUBLISHED">Published</SelectItem>
                                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none" onClick={() => { setPreviewStep(1); setPreviewOpen(true); }}>
                                <Eye className="h-4 w-4" /> Preview
                            </Button>
                            <Button size="sm" className="bg-black hover:bg-gray-800 text-white gap-2 flex-1 sm:flex-none" onClick={handleSave} disabled={isSaving || hasDuplicates}>
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4" /> {isEditMode ? "Update" : "Publish"} Form
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 bg-gray-50/30 overflow-hidden">
                        <ScrollArea className="h-full p-4 lg:p-8">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                    <div className="max-w-3xl mx-auto space-y-4 pb-20">
                                        {fields.map((field, index) => (
                                            <SortableField key={field.id} id={field.id}>
                                                {({ attributes, listeners, isDragging }) => (
                                                    <div
                                                        onClick={() => setSelectedFieldId(field.id)}
                                                        className={cn(
                                                            "group relative bg-white p-6 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                                                            selectedFieldId === field.id
                                                                ? "border-blue-500 ring-2 ring-blue-50 shadow-md"
                                                                : "border-gray-200",
                                                            isDragging && "shadow-xl ring-2 ring-blue-400 opacity-80 z-50 transform scale-[1.02]",
                                                            (field.label.toLowerCase() === selectedField?.label.toLowerCase() && field.id !== selectedField?.id && isLabelDuplicate) || (field.fieldName === selectedField?.fieldName && field.id !== selectedField?.id && isKeyDuplicate) ? "border-red-500 bg-red-50" : ""
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-600 p-1 -ml-2 rounded hover:bg-gray-100 transition-colors outline-none">
                                                                    <GripVertical className="h-5 w-5" />
                                                                </div>
                                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                                                                    {index + 1}
                                                                </span>
                                                                <span className="text-sm font-bold text-gray-900">{field.label}</span>
                                                                {field.required && <span className="text-red-500 text-xs font-bold">*Required</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {field.templateId && <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Fixed</span>}
                                                                <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                                                    {field.type}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="pointer-events-none opacity-60">
                                                            {/* Mock Inputs for Canvas */}
                                                            {['text', 'email', 'number', 'date', 'password'].includes(field.type) && (
                                                                <div className="h-10 w-full bg-gray-50 border rounded-md px-3 flex items-center text-sm text-gray-400">
                                                                    {field.placeholder || "Input"}
                                                                </div>
                                                            )}
                                                            {field.type === 'textarea' && (
                                                                <div className="h-24 w-full bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-400">
                                                                    {field.placeholder || "Enter long text..."}
                                                                </div>
                                                            )}
                                                            {field.type === 'file' && (
                                                                <div className="h-20 w-full bg-gray-50 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400">
                                                                    <Upload className="h-5 w-5 mb-1" />
                                                                    <span className="text-xs">File Upload Area</span>
                                                                </div>
                                                            )}
                                                            {(field.type === 'radio' || field.type === 'checkbox') && (
                                                                <div className="flex flex-wrap gap-4">
                                                                    {(field.options || ['Option 1', 'Option 2']).map((opt, i) => (
                                                                        <div key={i} className="flex items-center gap-2">
                                                                            <div className={`h-4 w-4 border ${field.type === 'radio' ? 'rounded-full' : 'rounded'}`} />
                                                                            <span className="text-sm">{opt}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {field.type === 'dropdown' && (
                                                                <div className="h-10 w-full bg-gray-50 border rounded-md px-3 flex items-center justify-between text-sm text-gray-400">
                                                                    <span>Select option</span>
                                                                    <ChevronDown className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </SortableField>
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Right Sidebar - Properties */}
            <div className="w-full lg:w-80 h-auto lg:h-full flex-shrink-0">
                <Card className="h-full border-none shadow-sm flex flex-col">
                    <CardHeader className="py-4 border-b">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <Settings2 className="h-4 w-4" /> Properties
                        </CardTitle>
                    </CardHeader>
                    {selectedField ? (
                        <ScrollArea className="flex-1">
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-600 uppercase">Label</label>
                                        <Input
                                            value={selectedField.label}
                                            onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                            className={cn(isLabelDuplicate && "border-red-500 focus-visible:ring-red-500")}
                                        />
                                        {isLabelDuplicate && <p className="text-xs text-red-500">Duplicate label</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-600 uppercase">Input ID / Key</label>
                                        <Input
                                            value={selectedField.fieldName || ''}
                                            onChange={(e) => updateField(selectedField.id, { fieldName: e.target.value })}
                                            className={cn("font-mono text-xs", isKeyDuplicate && "border-red-500 focus-visible:ring-red-500")}
                                        />
                                        {isKeyDuplicate && <p className="text-xs text-red-500">Duplicate field key</p>}
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                        <label className="text-sm font-bold text-gray-700">Required</label>
                                        <input
                                            type="checkbox"
                                            checked={selectedField.required}
                                            onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Validation Section */}
                                    <div className="pt-4 border-t space-y-4">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase">Validation Rules</h4>

                                        {['text', 'textarea', 'email', 'password'].includes(selectedField.type) && (
                                            <>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-gray-500">Min Length</label>
                                                        <Input type="number"
                                                            value={selectedField.validation?.minLength || ''}
                                                            onChange={(e) => updateValidation(selectedField.id, 'minLength', e.target.value ? Number(e.target.value) : undefined)}
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs text-gray-500">Max Length</label>
                                                        <Input type="number"
                                                            value={selectedField.validation?.maxLength || ''}
                                                            onChange={(e) => updateValidation(selectedField.id, 'maxLength', e.target.value ? Number(e.target.value) : undefined)}
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Regex Pattern</label>
                                                    <Input
                                                        value={selectedField.validation?.pattern || ''}
                                                        onChange={(e) => updateValidation(selectedField.id, 'pattern', e.target.value)}
                                                        className="h-8 font-mono text-xs"
                                                        placeholder="e.g. ^[A-Z]+$"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {selectedField.type === 'number' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Min Value</label>
                                                    <Input type="number"
                                                        value={selectedField.validation?.minValue || ''}
                                                        onChange={(e) => updateValidation(selectedField.id, 'minValue', e.target.value ? Number(e.target.value) : undefined)}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Max Value</label>
                                                    <Input type="number"
                                                        value={selectedField.validation?.maxValue || ''}
                                                        onChange={(e) => updateValidation(selectedField.id, 'maxValue', e.target.value ? Number(e.target.value) : undefined)}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500">Custom Error Message</label>
                                            <Input
                                                value={selectedField.validation?.errorMessage || ''}
                                                onChange={(e) => updateValidation(selectedField.id, 'errorMessage', e.target.value)}
                                                className="h-8 text-xs"
                                                placeholder="e.g. Please enter a valid value"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t">
                                    <Button
                                        variant="ghost"
                                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                                        onClick={() => removeField(selectedField.id)}
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete Field
                                    </Button>
                                </div>
                            </CardContent>
                        </ScrollArea>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                            <p className="text-sm">Select a field to edit</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* PREVIEW MODAL */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-[100vw] w-screen h-screen flex flex-col p-0 gap-0 overflow-hidden bg-gray-100/90 backdrop-blur-sm sm:rounded-none border-none">
                    <DialogHeader className="p-4 border-b bg-white flex-shrink-0 shadow-sm z-50">
                        <div className="flex items-center justify-between w-full">
                            <div>
                                <DialogTitle>Form Preview</DialogTitle>
                                <DialogDescription>Registration Form - Step {previewStep} of {totalPages}</DialogDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                <Button size="icon" variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'} className="h-8 w-8" onClick={() => setPreviewDevice('desktop')}><Monitor className="h-4 w-4" /></Button>
                                <Button size="icon" variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'} className="h-8 w-8" onClick={() => setPreviewDevice('tablet')}><Tablet className="h-4 w-4" /></Button>
                                <Button size="icon" variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'} className="h-8 w-8" onClick={() => setPreviewDevice('mobile')}><Smartphone className="h-4 w-4" /></Button>
                                <div className="w-px h-4 bg-gray-300 mx-1" />
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setPreviewOpen(false)}><X className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Preview Content Area */}
                    <div className="flex-1 overflow-auto bg-gray-100/50 p-4 md:p-8 flex justify-center">
                        <div className={cn(
                            "bg-white shadow-xl min-h-[500px] transition-all duration-300 flex flex-col",
                            previewDevice === 'desktop' ? "w-full max-w-3xl rounded-none md:rounded-xl border" : "",
                            previewDevice === 'tablet' ? "w-[768px] rounded-xl border mt-4 mb-4" : "",
                            previewDevice === 'mobile' ? "w-[375px] rounded-3xl border-4 border-gray-800 mt-4 mb-4" : ""
                        )}>
                            {/* Form Header in Preview */}
                            <div className="p-8 border-b bg-blue-600 text-white rounded-t-inherit">
                                <h1 className="text-2xl font-bold">{formName}</h1>
                                <p className="opacity-90 mt-1">{formDescription}</p>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-100 h-2">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-500"
                                    style={{ width: `${(previewStep / totalPages) * 100}%` }}
                                />
                            </div>

                            {/* Form Fields */}
                            <div className="p-8 space-y-6 flex-1">
                                {currentPreviewFields.map((field) => (
                                    <div key={field.id} className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                            {field.label}
                                            {field.required && <span className="text-red-500">*</span>}
                                        </label>

                                        {field.type === 'textarea' ? (
                                            <textarea
                                                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder={field.placeholder}
                                            />
                                        ) : field.type === 'radio' || field.type === 'boolean' ? (
                                            <div className="flex gap-4 pt-1">
                                                {(field.options || ['Yes', 'No']).map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                        <input type="radio" name={field.id} className="h-4 w-4 text-blue-600" />
                                                        <span className="text-sm">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <Input placeholder={field.placeholder} type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'} />
                                        )}
                                        {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
                                    </div>
                                ))}
                            </div>

                            {/* Footer / Navigation */}
                            <div className="p-6 border-t bg-gray-50 flex justify-between rounded-b-inherit">
                                <Button
                                    variant="outline"
                                    onClick={() => setPreviewStep(Math.max(1, previewStep - 1))}
                                    disabled={previewStep === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                                </Button>
                                <div className="text-sm font-medium text-gray-400 self-center">
                                    Step {previewStep} of {totalPages}
                                </div>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => {
                                        if (previewStep < totalPages) setPreviewStep(previewStep + 1);
                                        else toast.success("Form Completed (Preview)");
                                    }}
                                >
                                    {previewStep === totalPages ? 'Submit' : 'Next'} <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
