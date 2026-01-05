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
    GripVertical,
    Layers
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
    categoryId?: number;
    categoryName?: string;
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

    useEffect(() => {
        if (isEditMode && existingForm) {
            setFormName(existingForm.name);
            setFormDescription(existingForm.description || "");
            setFormType(existingForm.type);
            setFormStatus(existingForm.status as any);

            const allFields: FormField[] = [];

            // Sort categories by their display order first
            const sortedCategories = [...(existingForm.categories || [])].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

            sortedCategories.forEach((cat: any) => {
                const mapped = (cat.fields || []).map((f: any) => ({
                    id: String(f.field_id || Math.random()),
                    type: f.field_type === 'boolean' ? 'radio' : f.field_type,
                    label: f.label,
                    required: f.is_required,
                    placeholder: f.placeholder || `Enter ${f.label.toLowerCase()}`,
                    options: f.field_options?.options || (f.field_type === 'boolean' ? ['True', 'False'] : undefined),
                    validation: f.validation_criteria || {},
                    displayOrder: f.display_order,
                    fieldName: f.field_name,
                    categoryId: cat.category_id,
                    categoryName: cat.name,
                }));
                // Sort fields within each category
                mapped.sort((a: FormField, b: FormField) => (a.displayOrder || 0) - (b.displayOrder || 0));
                allFields.push(...mapped);
            });

            if (existingForm.uncategorizedFields) {
                const mappedUncategorized = existingForm.uncategorizedFields.map((f: any) => ({
                    id: String(f.field_id || Math.random()),
                    type: f.field_type === 'boolean' ? 'radio' : f.field_type,
                    label: f.label,
                    required: f.is_required,
                    placeholder: f.placeholder || `Enter ${f.label.toLowerCase()}`,
                    options: f.field_options?.options || (f.field_type === 'boolean' ? ['True', 'False'] : undefined),
                    validation: f.validation_criteria || {},
                    displayOrder: f.display_order,
                    fieldName: f.field_name,
                }));
                mappedUncategorized.sort((a: FormField, b: FormField) => (a.displayOrder || 0) - (b.displayOrder || 0));
                allFields.push(...mappedUncategorized);
            }

            setFields(allFields);
        } else if (!isEditMode && templates && fields.length === 0) {
            const mappedFields: FormField[] = templates.map(t => {
                let type: FormField['type'] = 'text';
                if (t.field_type === 'textarea') type = 'textarea';
                else if (t.field_type === 'date') type = 'date';
                else if (t.field_type === 'boolean') type = 'radio';
                else if (t.field_type === 'email') type = 'email';
                else if (t.field_type === 'number') type = 'number';

                const options = t.field_options?.options || (t.field_type === 'boolean' ? ['True', 'False'] : undefined);

                return {
                    id: String(t.template_id),
                    templateId: t.template_id,
                    type,
                    label: t.label,
                    required: t.is_required,
                    placeholder: t.placeholder || `Enter ${t.label.toLowerCase()}`,
                    options,
                    validation: typeof t.validation_criteria === 'string' ? JSON.parse(t.validation_criteria) : t.validation_criteria || {},
                    displayOrder: t.display_order,
                    fieldName: t.field_name,
                    categoryId: (t as any).category?.template_category_id,
                    categoryName: (t as any).category?.name
                };
            }).sort((a, b) => {
                const catA = a.categoryId || 999;
                const catB = b.categoryId || 999;
                if (catA !== catB) return catA - catB;
                return (a.displayOrder || 0) - (b.displayOrder || 0);
            });

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
            fieldName: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
            displayOrder: fields.length + 1,
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
                if (updates.label && !f.fieldName?.startsWith('custom_')) {
                    updated.fieldName = updates.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                }
                return updated;
            }
            return f;
        }));
    };

    const selectedField = fields.find(f => f.id === selectedFieldId);

    const hasDuplicates = fields.some((f, idx) =>
        fields.some((other, otherIdx) =>
            idx !== otherIdx && (
                f.label.toLowerCase() === other.label.toLowerCase() ||
                f.fieldName === other.fieldName
            )
        )
    );

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
                if (value === '' || value === undefined || value === null) delete newValidation[key];
                return { ...f, validation: newValidation };
            }
            return f;
        }));
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setFields((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);

                const newFields = arrayMove(items, oldIndex, newIndex);

                const movedField = newFields[newIndex];
                const prevField = newIndex > 0 ? newFields[newIndex - 1] : null;
                const nextField = newIndex < newFields.length - 1 ? newFields[newIndex + 1] : null;

                if (prevField && prevField.categoryName) {
                    movedField.categoryId = prevField.categoryId;
                    movedField.categoryName = prevField.categoryName;
                } else if (nextField && nextField.categoryName) {
                    movedField.categoryId = nextField.categoryId;
                    movedField.categoryName = nextField.categoryName;
                } else {
                    movedField.categoryId = undefined;
                    movedField.categoryName = undefined;
                }

                return newFields.map((f, idx) => ({ ...f, displayOrder: idx + 1 }));
            });
        }
    };

    const handleSave = async () => {
        if (hasDuplicates) {
            toast.error("Form contains duplicate fields. Please fix errors before saving.");
            return;
        }

        const categorizedFieldsMap = fields.reduce((acc: any, f) => {
            const catName = f.categoryName || '_uncategorized';
            if (!acc[catName]) acc[catName] = [];
            acc[catName].push(f);
            return acc;
        }, {});

        const categoriesPayload = Object.entries(categorizedFieldsMap)
            .filter(([name]) => name !== '_uncategorized')
            .map(([name, catFields]: [string, any], index) => ({
                name,
                display_order: index + 1,
                fields: catFields.map((f: any, fIndex: number) => ({
                    field_name: f.fieldName || f.label.toLowerCase().replace(/ /g, '_'),
                    field_type: f.type === 'radio' && f.options?.includes('True') ? 'boolean' : f.type === 'dropdown' ? 'select' : f.type,
                    label: f.label,
                    is_required: f.required,
                    display_order: fIndex + 1,
                    validation_criteria: f.validation || {},
                    field_options: f.options ? { options: f.options } : null
                }))
            }));

        const uncategorizedFieldsPayload = (categorizedFieldsMap['_uncategorized'] || []).map((f: any, index: number) => ({
            field_name: f.fieldName || f.label.toLowerCase().replace(/ /g, '_'),
            field_type: f.type === 'radio' && f.options?.includes('True') ? 'boolean' : f.type === 'dropdown' ? 'select' : f.type,
            label: f.label,
            is_required: f.required,
            display_order: index + 1,
            validation_criteria: f.validation || {},
            field_options: f.options ? { options: f.options } : null
        }));

        const payload = {
            name: formName,
            description: formDescription,
            status: formStatus,
            type: formType,
            icon: existingForm?.icon || null,
            categories: categoriesPayload,
            fields: uncategorizedFieldsPayload
        };

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
            toast.error("An error occurred while saving the form.");
        }
    };

    if (isLoadingForm || isLoadingTemplates) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    const isSaving = isCreating || isUpdating;

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)] gap-4 p-4 bg-gray-50/50">
            {/* Toolbox */}
            <div className="w-full lg:w-64">
                <Button variant="ghost" className="mb-4 gap-2 text-gray-500 hover:text-gray-900" onClick={() => navigate('/dashboard/forms')}>
                    <ArrowLeft className="h-4 w-4" /> Back to Forms
                </Button>
                <Card className="border-none shadow-sm">
                    <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Toolbox</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                        {FIELD_TYPES.map((ft) => (
                            <Button key={ft.type} variant="outline" className="h-20 flex flex-col gap-2 border-dashed" onClick={() => addField(ft.type as FormField['type'])}>
                                <ft.icon className="h-5 w-5" /> {ft.label}
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Canvas */}
            <div className="flex-1">
                <Card className="min-h-full border-none shadow-md bg-white">
                    <CardHeader className="border-b flex flex-row items-center justify-between">
                        <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="text-xl font-bold border-none p-0 focus-visible:ring-0 shadow-none w-auto" />
                        <div className="flex gap-2">
                            <Select value={formType} onValueChange={(val: any) => setFormType(val)}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACCREDITATION">Accreditation</SelectItem>
                                    <SelectItem value="EQUIPMENT_CLEARANCE">Equipment</SelectItem>
                                    <SelectItem value="VISA_SUPPORT">Visa Support</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" className="bg-black text-white gap-2" onClick={handleSave} disabled={isSaving || hasDuplicates}>
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4" /> Save Form
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 bg-gray-50/30">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                <div className="max-w-2xl mx-auto space-y-4">
                                    {fields.map((field, index) => {
                                        const prevField = index > 0 ? fields[index - 1] : null;
                                        const showHeader = field.categoryName && (!prevField || prevField.categoryName !== field.categoryName);
                                        return (
                                            <div key={field.id} className="space-y-4">
                                                {showHeader && (
                                                    <div className="pt-6 pb-2 border-b-2 border-blue-100 flex items-center gap-2">
                                                        <Layers className="h-4 w-4 text-blue-800" />
                                                        <h3 className="text-sm font-black text-blue-800 uppercase tracking-widest">{field.categoryName}</h3>
                                                    </div>
                                                )}
                                                <SortableField id={field.id}>
                                                    {({ attributes, listeners, isDragging }) => (
                                                        <div
                                                            className={cn(
                                                                "bg-white p-6 rounded-xl border group relative transition-all cursor-pointer hover:shadow-md",
                                                                selectedFieldId === field.id ? "border-blue-500 ring-2 ring-blue-50 shadow-md" : "border-gray-200",
                                                                isDragging && "shadow-xl ring-2 ring-blue-400 opacity-80"
                                                            )}
                                                            onClick={() => setSelectedFieldId(field.id)}
                                                        >
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-600"><GripVertical className="h-5 w-5" /></div>
                                                                    <span className="text-sm font-bold">{field.label}</span>
                                                                </div>
                                                                <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{field.type}</span>
                                                            </div>
                                                            <div className="h-10 w-full bg-gray-50 border rounded-md" />
                                                        </div>
                                                    )}
                                                </SortableField>
                                            </div>
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </CardContent>
                </Card>
            </div>

            {/* Properties */}
            <div className="w-full lg:w-80">
                <Card className="h-full border-none shadow-sm">
                    <CardHeader className="border-b"><CardTitle className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><Settings2 className="h-4 w-4" /> Properties</CardTitle></CardHeader>
                    {selectedField ? (
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 uppercase">Label</label>
                                <Input value={selectedField.label} onChange={(e) => updateField(selectedField.id, { label: e.target.value })} className={cn(isLabelDuplicate && "border-red-500")} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 uppercase">Field Name</label>
                                <Input value={selectedField.fieldName} onChange={(e) => updateField(selectedField.id, { fieldName: e.target.value })} className={cn(isKeyDuplicate && "border-red-500")} />
                            </div>
                            <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50 gap-2" onClick={() => removeField(selectedField.id)}>
                                <Trash2 className="h-4 w-4" /> Delete Field
                            </Button>
                        </CardContent>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">Select a field to edit</div>
                    )}
                </Card>
            </div>

            {/* PREVIEW DIALOG */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Form Preview</DialogTitle></DialogHeader>
                    <div className="space-y-6 p-4">
                        <div className="p-6 bg-blue-600 text-white rounded-lg">
                            <h2 className="text-xl font-bold">{formName}</h2>
                            <p className="opacity-90">{formDescription}</p>
                        </div>
                        <div className="space-y-4">
                            {fields.map(f => (
                                <div key={f.id} className="space-y-2">
                                    <label className="text-sm font-medium">{f.label}{f.required && <span className="text-red-500">*</span>}</label>
                                    <Input placeholder={f.placeholder} disabled />
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
