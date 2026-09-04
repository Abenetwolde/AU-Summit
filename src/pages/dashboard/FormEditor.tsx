import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogHeader,
    DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';
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
    ChevronUp,
    AlignLeft,
    Loader2,
    X,
    ArrowLeft,
    GripVertical,
    Layers,
    Users,
    FolderPlus,
    Pencil,
    Plus,
    AlertTriangle
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { useAuth } from '@/auth/context';

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

export interface NestedField {
    id: string;
    fieldName: string;
    type: 'text' | 'number' | 'checkbox' | 'radio' | 'date' | 'file' | 'dropdown' | 'textarea' | 'email';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    validation?: {
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        minValue?: number;
        maxValue?: number;
        errorMessage?: string;
    };
}

interface FormField {
    id: string;
    type: 'text' | 'number' | 'checkbox' | 'radio' | 'date' | 'file' | 'dropdown' | 'textarea' | 'boolean' | 'email';
    label: string;
    placeholder?: string;
    required: boolean;
    helpText?: string;
    options?: string[];
    descriptions?: Record<string, string>;
    nestedFields?: Record<string, NestedField[]>;
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
    fieldName?: string;
    categoryId?: number;
    categoryName?: string;
    applies_to_crew?: boolean;
}

export interface FormCategory {
    id: string;
    name: string;
    description?: string;
    displayOrder?: number;
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

    const { checkPermission } = useAuth();
    const canCreateForm = checkPermission('form:create');
    const canUpdateForm = checkPermission('form:update');
    const canOperate = isEditMode ? canUpdateForm : canCreateForm;

    const [categories, setCategories] = useState<FormCategory[]>([]);
    const [fields, setFields] = useState<FormField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

    // Category Modal states
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDescription, setNewCategoryDescription] = useState('');

    const [editingCategory, setEditingCategory] = useState<FormCategory | null>(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryDescription, setEditCategoryDescription] = useState('');

    const [categoryToDelete, setCategoryToDelete] = useState<FormCategory | null>(null);

    const [formName, setFormName] = useState("Press Accreditation Application");
    const [formDescription, setFormDescription] = useState("Standard application form for press accreditation.");
    const [formType, setFormType] = useState("ACCREDITATION");
    const [formStatus, setFormStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("PUBLISHED");
    const [allowMultiMember, setAllowMultiMember] = useState(false);
    const [deadline, setDeadline] = useState<string>("");

    useEffect(() => {
        if (isEditMode && existingForm) {
            setFormName(existingForm.name);
            setFormDescription(existingForm.description || "");
            setFormType(existingForm.type);
            setFormStatus(existingForm.status as any);
            setAllowMultiMember(Boolean(existingForm.allowMultiMember));
            setDeadline(existingForm.deadline ? new Date(existingForm.deadline).toISOString().slice(0, 16) : "");

            const sortedCategories = [...(existingForm.categories || [])].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

            const loadedCategories: FormCategory[] = sortedCategories.map((cat: any, idx: number) => ({
                id: String(cat.category_id || `cat_${idx}`),
                name: cat.name,
                description: cat.description || '',
                displayOrder: cat.display_order ?? (idx + 1)
            }));
            setCategories(loadedCategories);

            const allFields: FormField[] = [];

            sortedCategories.forEach((cat: any) => {
                const mapped = (cat.fields || []).map((f: any) => {
                    let parsedOpts: any = {};
                    try {
                        if (f.field_options) {
                            parsedOpts = typeof f.field_options === 'string' ? JSON.parse(f.field_options) : f.field_options;
                        }
                    } catch (e) {}

                    return {
                        id: String(f.field_id || Math.random()),
                        type: f.field_type === 'boolean' ? 'radio'
                            : (f.field_type === 'select' || f.field_type === 'dropdown') ? 'dropdown'
                                : f.field_type,
                        label: f.label,
                        required: f.is_required,
                        placeholder: f.placeholder || `Enter ${f.label.toLowerCase()}`,
                        options: parsedOpts.options || (f.field_type === 'boolean' ? ['True', 'False'] : undefined),
                        descriptions: parsedOpts.descriptions || undefined,
                        nestedFields: parsedOpts.nestedFields || parsedOpts.nested_fields || undefined,
                        validation: f.validation_criteria || {},
                        displayOrder: f.display_order,
                        fieldName: f.field_name,
                        categoryId: cat.category_id,
                        categoryName: cat.name,
                        applies_to_crew: Boolean(f.applies_to_crew),
                    };
                });
                mapped.sort((a: FormField, b: FormField) => (a.displayOrder || 0) - (b.displayOrder || 0));
                allFields.push(...mapped);
            });

            if (existingForm.uncategorizedFields) {
                const mappedUncategorized = existingForm.uncategorizedFields.map((f: any) => {
                    let parsedOpts: any = {};
                    try {
                        if (f.field_options) {
                            parsedOpts = typeof f.field_options === 'string' ? JSON.parse(f.field_options) : f.field_options;
                        }
                    } catch (e) {}

                    return {
                        id: String(f.field_id || Math.random()),
                        type: f.field_type === 'boolean' ? 'radio'
                            : (f.field_type === 'select' || f.field_type === 'dropdown') ? 'dropdown'
                                : f.field_type,
                        label: f.label,
                        required: f.is_required,
                        placeholder: f.placeholder || `Enter ${f.label.toLowerCase()}`,
                        options: parsedOpts.options || (f.field_type === 'boolean' ? ['True', 'False'] : undefined),
                        descriptions: parsedOpts.descriptions || undefined,
                        nestedFields: parsedOpts.nestedFields || parsedOpts.nested_fields || undefined,
                        validation: f.validation_criteria || {},
                        displayOrder: f.display_order,
                        fieldName: f.field_name,
                        applies_to_crew: Boolean(f.applies_to_crew),
                    };
                });
                mappedUncategorized.sort((a: FormField, b: FormField) => (a.displayOrder || 0) - (b.displayOrder || 0));
                allFields.push(...mappedUncategorized);
            }

            setFields(allFields);
        } else if (!isEditMode && templates && fields.length === 0) {
            const uniqueCatsMap = new Map<string, FormCategory>();
            templates.forEach(t => {
                const cat = (t as any).category;
                if (cat && cat.name && !uniqueCatsMap.has(cat.name)) {
                    uniqueCatsMap.set(cat.name, {
                        id: String(cat.template_category_id || `cat_${uniqueCatsMap.size}`),
                        name: cat.name,
                        description: cat.description || '',
                        displayOrder: uniqueCatsMap.size + 1
                    });
                }
            });
            setCategories(Array.from(uniqueCatsMap.values()));

            const mappedFields: FormField[] = templates.map(t => {
                let type: FormField['type'] = 'text';

                if (t.field_type === 'textarea') type = 'textarea';
                else if (t.field_type === 'date') type = 'date';
                else if (t.field_type === 'boolean') type = 'radio';
                else if (t.field_type === 'email') type = 'email';
                else if (t.field_type === 'number') type = 'number';
                else if (t.field_type === 'file') type = 'file';
                else if (t.field_type === 'select' || t.field_type === 'dropdown') type = 'dropdown';
                else if (t.field_type === 'radio') type = 'radio';
                else if (t.field_type === 'checkbox') type = 'checkbox';

                let parsedOptions: string[] | undefined;
                let parsedDescriptions: Record<string, string> | undefined;
                let parsedNestedFields: Record<string, NestedField[]> | undefined;
                try {
                    if (t.field_options) {
                        const rawOptions = t.field_options as any;
                        const parsed = typeof rawOptions === 'string' ? JSON.parse(rawOptions) : rawOptions;
                        parsedOptions = parsed.options || undefined;
                        parsedDescriptions = parsed.descriptions || undefined;
                        parsedNestedFields = parsed.nestedFields || parsed.nested_fields || undefined;
                    }
                } catch (e) {
                    console.error('Failed to parse field_options', e);
                }

                const options = parsedOptions || (t.field_type === 'boolean' ? ['True', 'False'] : undefined);

                return {
                    id: String(t.template_id),
                    templateId: t.template_id,
                    type,
                    label: t.label,
                    required: t.is_required,
                    placeholder: `Enter ${t.label.toLowerCase()}`,
                    options,
                    descriptions: parsedDescriptions,
                    nestedFields: parsedNestedFields,
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

    // CATEGORY HANDLERS
    const handleAddCategory = () => {
        if (!canOperate) {
            toast.error("You don't have permission to modify this form");
            return;
        }
        const trimmed = newCategoryName.trim();
        if (!trimmed) {
            toast.error("Section name is required");
            return;
        }
        if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
            toast.error("A section with this name already exists");
            return;
        }
        const newCat: FormCategory = {
            id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: trimmed,
            description: newCategoryDescription.trim() || undefined,
            displayOrder: categories.length + 1
        };
        setCategories([...categories, newCat]);
        setNewCategoryName('');
        setNewCategoryDescription('');
        setIsAddCategoryOpen(false);
        toast.success(`Section "${trimmed}" created!`);
    };

    const handleRenameCategory = () => {
        if (!editingCategory) return;
        const trimmed = editCategoryName.trim();
        if (!trimmed) {
            toast.error("Section name is required");
            return;
        }
        if (categories.some(c => c.id !== editingCategory.id && c.name.toLowerCase() === trimmed.toLowerCase())) {
            toast.error("A section with this name already exists");
            return;
        }
        const oldName = editingCategory.name;
        setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: trimmed, description: editCategoryDescription.trim() || undefined } : c));
        setFields(fields.map(f => f.categoryName === oldName ? { ...f, categoryName: trimmed } : f));
        setEditingCategory(null);
        toast.success(`Section updated to "${trimmed}"`);
    };

    const requestDeleteCategory = (cat: FormCategory) => {
        if (!canOperate) {
            toast.error("You don't have permission to modify this form");
            return;
        }
        const fieldsInCat = fields.filter(f => f.categoryName === cat.name);
        if (fieldsInCat.length === 0) {
            setCategories(categories.filter(c => c.id !== cat.id));
            toast.success(`Section "${cat.name}" removed`);
        } else {
            setCategoryToDelete(cat);
        }
    };

    const handleConfirmDeleteCategory = (action: 'delete_all' | 'keep_uncategorized') => {
        if (!categoryToDelete) return;
        const catName = categoryToDelete.name;
        if (action === 'delete_all') {
            const deletedFieldIds = new Set(fields.filter(f => f.categoryName === catName).map(f => f.id));
            if (selectedFieldId && deletedFieldIds.has(selectedFieldId)) {
                setSelectedFieldId(null);
            }
            setFields(fields.filter(f => f.categoryName !== catName));
            setCategories(categories.filter(c => c.id !== categoryToDelete.id));
            toast.success(`Section "${catName}" and all its fields were deleted`);
        } else {
            setFields(fields.map(f => f.categoryName === catName ? { ...f, categoryName: undefined, categoryId: undefined } : f));
            setCategories(categories.filter(c => c.id !== categoryToDelete.id));
            toast.success(`Section "${catName}" removed. Fields moved to Uncategorized.`);
        }
        setCategoryToDelete(null);
    };

    const moveCategory = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= categories.length) return;
        const newCats = arrayMove(categories, index, targetIndex).map((cat, idx) => ({
            ...cat,
            displayOrder: idx + 1
        }));
        setCategories(newCats);

        setFields(prevFields => {
            const sorted: FormField[] = [];
            newCats.forEach(cat => {
                const catFields = prevFields.filter(f => f.categoryName === cat.name);
                sorted.push(...catFields);
            });
            const uncategorized = prevFields.filter(f => !f.categoryName || !newCats.some(c => c.name === f.categoryName));
            sorted.push(...uncategorized);
            return sorted.map((f, idx) => ({ ...f, displayOrder: idx + 1 }));
        });
    };

    // FIELD HANDLERS
    const addField = (type: FormField['type'], categoryName?: string) => {
        if (!canOperate) {
            toast.error("You don't have permission to modify this form");
            return;
        }
        const label = `New ${type} field`;
        const newField: FormField = {
            id: `new_${Math.random().toString(36).substr(2, 9)}`,
            type,
            label,
            required: false,
            fieldName: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
            displayOrder: fields.length + 1,
            options: ['checkbox', 'radio', 'dropdown'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
            validation: {},
            categoryName: categoryName || undefined,
            categoryId: categoryName ? (Number(categories.find(c => c.name === categoryName)?.id) || undefined) : undefined
        };

        setFields(prev => {
            if (!categoryName) {
                return [...prev, newField];
            }
            let lastIdx = -1;
            for (let i = prev.length - 1; i >= 0; i--) {
                if (prev[i].categoryName === categoryName) {
                    lastIdx = i;
                    break;
                }
            }
            const updated = [...prev];
            if (lastIdx !== -1) {
                updated.splice(lastIdx + 1, 0, newField);
            } else {
                const catIndex = categories.findIndex(c => c.name === categoryName);
                let insertIdx = updated.length;
                for (let i = 0; i < updated.length; i++) {
                    const fCatIdx = categories.findIndex(c => c.name === updated[i].categoryName);
                    if (fCatIdx > catIndex || (!updated[i].categoryName && fCatIdx === -1)) {
                        insertIdx = i;
                        break;
                    }
                }
                updated.splice(insertIdx, 0, newField);
            }
            return updated.map((f, idx) => ({ ...f, displayOrder: idx + 1 }));
        });
        setSelectedFieldId(newField.id);
    };

    const removeField = (id: string) => {
        if (!canOperate) {
            toast.error("You don't have permission to modify this form");
            return;
        }
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

    const setFieldCategory = (fieldId: string, categoryName?: string) => {
        setFields(prevFields => {
            const field = prevFields.find(f => f.id === fieldId);
            if (!field) return prevFields;

            const targetCat = categories.find(c => c.name === categoryName);
            const updatedField: FormField = {
                ...field,
                categoryName: targetCat ? targetCat.name : undefined,
                categoryId: targetCat ? (Number(targetCat.id) || undefined) : undefined
            };

            const otherFields = prevFields.filter(f => f.id !== fieldId);

            if (targetCat) {
                let lastCatIndex = -1;
                for (let i = otherFields.length - 1; i >= 0; i--) {
                    if (otherFields[i].categoryName === targetCat.name) {
                        lastCatIndex = i;
                        break;
                    }
                }
                if (lastCatIndex !== -1) {
                    otherFields.splice(lastCatIndex + 1, 0, updatedField);
                } else {
                    const catIdx = categories.findIndex(c => c.name === targetCat.name);
                    let insertIdx = otherFields.length;
                    for (let i = 0; i < otherFields.length; i++) {
                        const fCatIdx = categories.findIndex(c => c.name === otherFields[i].categoryName);
                        if (fCatIdx > catIdx || (!otherFields[i].categoryName && fCatIdx === -1)) {
                            insertIdx = i;
                            break;
                        }
                    }
                    otherFields.splice(insertIdx, 0, updatedField);
                }
            } else {
                otherFields.push(updatedField);
            }

            return otherFields.map((f, idx) => ({ ...f, displayOrder: idx + 1 }));
        });
    };

    const addNestedField = (fieldId: string, optionName: string) => {
        const field = fields.find(f => f.id === fieldId);
        if (!field) return;

        const currentNestedMap = field.nestedFields || {};
        const optionSubFields = currentNestedMap[optionName] || [];

        const newSubField: NestedField = {
            id: `sub_${Math.random().toString(36).substring(2, 9)}`,
            label: `New Sub-Field`,
            fieldName: `sub_${optionName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${optionSubFields.length + 1}`,
            type: 'text',
            required: false,
            placeholder: '',
        };

        const updatedNestedMap = {
            ...currentNestedMap,
            [optionName]: [...optionSubFields, newSubField]
        };

        updateField(fieldId, { nestedFields: updatedNestedMap });
    };

    const updateNestedField = (fieldId: string, optionName: string, subFieldId: string, updates: Partial<NestedField>) => {
        const field = fields.find(f => f.id === fieldId);
        if (!field) return;

        const currentNestedMap = { ...(field.nestedFields || {}) };
        const optionSubFields = currentNestedMap[optionName] || [];

        const updatedSubFields = optionSubFields.map(sf => {
            if (sf.id === subFieldId) {
                const updated = { ...sf, ...updates };
                if (updates.label && !sf.fieldName.startsWith('custom_')) {
                    updated.fieldName = updates.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                }
                return updated;
            }
            return sf;
        });

        currentNestedMap[optionName] = updatedSubFields;
        updateField(fieldId, { nestedFields: currentNestedMap });
    };

    const removeNestedField = (fieldId: string, optionName: string, subFieldId: string) => {
        const field = fields.find(f => f.id === fieldId);
        if (!field) return;

        const currentNestedMap = { ...(field.nestedFields || {}) };
        const optionSubFields = currentNestedMap[optionName] || [];

        currentNestedMap[optionName] = optionSubFields.filter(sf => sf.id !== subFieldId);
        updateField(fieldId, { nestedFields: currentNestedMap });
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
                const targetField = items[newIndex];

                if (targetField && targetField.categoryName) {
                    movedField.categoryName = targetField.categoryName;
                    movedField.categoryId = targetField.categoryId;
                } else if (newIndex > 0 && newFields[newIndex - 1]?.categoryName) {
                    movedField.categoryName = newFields[newIndex - 1].categoryName;
                    movedField.categoryId = newFields[newIndex - 1].categoryId;
                } else if (newIndex < newFields.length - 1 && newFields[newIndex + 1]?.categoryName) {
                    movedField.categoryName = newFields[newIndex + 1].categoryName;
                    movedField.categoryId = newFields[newIndex + 1].categoryId;
                } else {
                    movedField.categoryName = undefined;
                    movedField.categoryId = undefined;
                }

                return newFields.map((f, idx) => ({ ...f, displayOrder: idx + 1 }));
            });
        }
    };

    const formatNestedFields = (nestedFieldsMap: Record<string, NestedField[]> | undefined) => {
        if (!nestedFieldsMap) return undefined;
        const result: Record<string, any[]> = {};
        for (const [opt, subArr] of Object.entries(nestedFieldsMap)) {
            if (Array.isArray(subArr) && subArr.length > 0) {
                result[opt] = subArr.map(sub => ({
                    id: sub.id,
                    label: sub.label,
                    field_name: sub.fieldName || sub.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                    fieldName: sub.fieldName || sub.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                    field_type: sub.type || 'text',
                    type: sub.type || 'text',
                    is_required: !!sub.required,
                    required: !!sub.required,
                    placeholder: sub.placeholder || '',
                    validation_criteria: sub.validation || {},
                    validation: sub.validation || {}
                }));
            }
        }
        return Object.keys(result).length > 0 ? result : undefined;
    };

    const handleSave = async () => {
        if (isEditMode && !canUpdateForm) {
            toast.error("You don't have permission to update forms");
            return;
        }
        if (!isEditMode && !canCreateForm) {
            toast.error("You don't have permission to create forms");
            return;
        }
        if (hasDuplicates) {
            toast.error("Form contains duplicate fields. Please fix errors before saving.");
            return;
        }

        const categoriesPayload = categories.map((cat, index) => {
            const catFields = fields.filter(f => f.categoryName === cat.name);
            return {
                name: cat.name,
                description: cat.description || null,
                display_order: index + 1,
                fields: catFields.map((f: any, fIndex: number) => ({
                    field_name: f.fieldName || f.label.toLowerCase().replace(/ /g, '_'),
                    field_type: f.type === 'radio' && f.options?.includes('True') ? 'boolean' : f.type === 'dropdown' ? 'select' : f.type,
                    label: f.label,
                    is_required: f.required,
                    display_order: fIndex + 1,
                    validation_criteria: f.validation || {},
                    applies_to_crew: Boolean(f.applies_to_crew),
                    field_options: f.options
                        ? {
                            options: f.options,
                            ...(f.descriptions && Object.keys(f.descriptions).length > 0 ? { descriptions: f.descriptions } : {}),
                            ...(f.nestedFields && Object.keys(f.nestedFields).length > 0 ? { nestedFields: formatNestedFields(f.nestedFields) } : {})
                        }
                        : null
                }))
            };
        });

        const uncategorizedFields = fields.filter(f => !f.categoryName || !categories.some(c => c.name === f.categoryName));
        const uncategorizedFieldsPayload = uncategorizedFields.map((f: any, index: number) => ({
            field_name: f.fieldName || f.label.toLowerCase().replace(/ /g, '_'),
            field_type: f.type === 'radio' && f.options?.includes('True') ? 'boolean' : f.type === 'dropdown' ? 'select' : f.type,
            label: f.label,
            is_required: f.required,
            display_order: index + 1,
            validation_criteria: f.validation || {},
            applies_to_crew: Boolean(f.applies_to_crew),
            field_options: f.options
                ? {
                    options: f.options,
                    ...(f.descriptions && Object.keys(f.descriptions).length > 0 ? { descriptions: f.descriptions } : {}),
                    ...(f.nestedFields && Object.keys(f.nestedFields).length > 0 ? { nestedFields: formatNestedFields(f.nestedFields) } : {})
                }
                : null
        }));

        const payload = {
            name: formName,
            description: formDescription,
            status: formStatus,
            type: formType,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            allowMultiMember,
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
    const uncategorizedFields = fields.filter(f => !f.categoryName || !categories.some(c => c.name === f.categoryName));

    const renderFieldItem = (field: FormField) => (
        <SortableField key={field.id} id={field.id}>
            {({ attributes, listeners, isDragging }) => (
                <div
                    className={cn(
                        "bg-white p-4 rounded-xl border group relative transition-all cursor-pointer hover:shadow-md",
                        selectedFieldId === field.id ? "border-blue-500 ring-2 ring-blue-50 shadow-md" : "border-gray-200",
                        isDragging && "shadow-xl ring-2 ring-blue-400 opacity-80"
                    )}
                    onClick={() => setSelectedFieldId(field.id)}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-600">
                                <GripVertical className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800">{field.label}</span>
                                    {field.required && <span className="text-red-500 font-bold text-xs">*</span>}
                                </div>
                                {field.nestedFields && Object.values(field.nestedFields).some(arr => arr && arr.length > 0) && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {Object.entries(field.nestedFields).map(([opt, subArr]) => subArr && subArr.length > 0 ? (
                                            <span key={opt} className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                {opt}: +{subArr.length} field{subArr.length > 1 ? 's' : ''}
                                            </span>
                                        ) : null)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {allowMultiMember && (
                                <div
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer select-none",
                                        field.applies_to_crew
                                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                            : "bg-gray-50 text-gray-400 border-gray-200 hover:text-gray-600"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateField(field.id, { applies_to_crew: !field.applies_to_crew });
                                    }}
                                    title="Click to toggle whether this field applies to crew members"
                                >
                                    <Users className="w-3 h-3" />
                                    <span>{field.applies_to_crew ? "Crew Field" : "Lead Only"}</span>
                                </div>
                            )}
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{field.type}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeField(field.id);
                                }}
                                title="Delete field"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                    <div className="h-8 w-full bg-gray-50/80 border border-dashed rounded-md flex items-center px-3 text-xs text-gray-400">
                        {field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    </div>
                </div>
            )}
        </SortableField>
    );

    const renderPreviewField = (f: FormField) => {
        const isDropdown = f.type === 'dropdown';
        const selectedOpt = previewValues[f.id];
        const subFields = isDropdown && selectedOpt && f.nestedFields ? f.nestedFields[selectedOpt] || [] : [];

        return (
            <div key={f.id} className="space-y-2 p-3 bg-white border rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-800">
                        {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    {f.applies_to_crew && (
                        <Badge variant="outline" className="text-[10px] text-indigo-700 bg-indigo-50 border-indigo-200">
                            Crew
                        </Badge>
                    )}
                </div>
                {isDropdown ? (
                    <Select value={selectedOpt || ''} onValueChange={(val) => setPreviewValues(prev => ({ ...prev, [f.id]: val }))}>
                        <SelectTrigger><SelectValue placeholder={`Select ${f.label}`} /></SelectTrigger>
                        <SelectContent>
                            {(f.options || []).map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : f.type === 'textarea' ? (
                    <textarea className="w-full h-20 p-2 text-xs border rounded-md bg-gray-50 resize-none" placeholder={f.placeholder} disabled />
                ) : (
                    <Input placeholder={f.placeholder} disabled />
                )}

                {subFields.length > 0 && (
                    <div className="pl-4 border-l-2 border-blue-500 space-y-3 mt-3 pt-3 bg-blue-50/50 p-3 rounded-r-xl animate-in fade-in slide-in-from-top-1">
                        <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                            Sub-Fields for "{selectedOpt}":
                        </p>
                        <div className="space-y-2">
                            {subFields.map((sub, idx) => (
                                <div key={idx} className="space-y-1">
                                    <label className="text-xs font-medium text-slate-700">
                                        {sub.label}{sub.required && <span className="text-red-500 ml-0.5">*</span>}
                                    </label>
                                    <Input placeholder={sub.placeholder || `Enter ${sub.label}`} className="h-8 text-xs bg-white" disabled />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)] gap-4 p-4 bg-gray-50/50">
            {/* Toolbox */}
            <div className="w-full lg:w-64 space-y-4">
                <Button variant="ghost" className="mb-2 gap-2 text-gray-500 hover:text-gray-900 w-full justify-start" onClick={() => navigate('/dashboard/forms')}>
                    <ArrowLeft className="h-4 w-4" /> Back to Forms
                </Button>

                {/* Sections Overview Card */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-blue-600" /> Sections ({categories.length})
                        </CardTitle>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 gap-1 text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100"
                            onClick={() => setIsAddCategoryOpen(true)}
                            disabled={!canOperate}
                        >
                            <Plus className="h-3 w-3" /> Add
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-1.5">
                        {categories.length === 0 ? (
                            <div className="text-center py-3 px-2 border border-dashed rounded-lg bg-gray-50">
                                <p className="text-xs text-gray-400 mb-2">No sections yet</p>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="text-xs h-7 w-full gap-1.5"
                                    onClick={() => setIsAddCategoryOpen(true)}
                                    disabled={!canOperate}
                                >
                                    <FolderPlus className="h-3.5 w-3.5" /> Create Section
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                                {categories.map((cat, idx) => {
                                    const count = fields.filter(f => f.categoryName === cat.name).length;
                                    return (
                                        <div
                                            key={cat.id}
                                            className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100 text-xs hover:bg-blue-50/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="font-mono text-[10px] text-gray-400 w-4">{idx + 1}.</span>
                                                <span className="font-medium text-slate-700 truncate max-w-[100px]" title={cat.name}>
                                                    {cat.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal">
                                                    {count}
                                                </Badge>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingCategory(cat);
                                                        setEditCategoryName(cat.name);
                                                        setEditCategoryDescription(cat.description || '');
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-blue-600 transition-opacity"
                                                    title="Edit section"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => requestDeleteCategory(cat)}
                                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-600 transition-opacity"
                                                    title="Delete section"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Field Types Card */}
                <Card className="border-none shadow-sm">
                    <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Field Types</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                        {FIELD_TYPES.map((ft) => (
                            <Button
                                key={ft.type}
                                variant="outline"
                                className="h-12 flex flex-row items-center justify-start gap-2.5 border-dashed px-3 text-left"
                                onClick={() => addField(ft.type as FormField['type'])}
                                disabled={!canOperate}
                            >
                                <ft.icon className="h-4 w-4 text-blue-600 shrink-0" />
                                <span className="text-xs font-medium">{ft.label}</span>
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Canvas */}
            <div className="flex-1">
                <Card className="min-h-full border-none shadow-md bg-white">
                    <CardHeader className="border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="text-xl font-bold border-none p-0 focus-visible:ring-0 shadow-none w-auto" />
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-50">
                                <Calendar className="h-4 w-4 text-emerald-600" />
                                <label htmlFor="form-deadline" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                    Deadline:
                                </label>
                                <input
                                    id="form-deadline"
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    disabled={!canOperate}
                                    className="text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                {deadline && (
                                    <button
                                        type="button"
                                        onClick={() => setDeadline("")}
                                        className="text-xs text-slate-400 hover:text-red-500 ml-0.5"
                                        title="Clear deadline"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-50">
                                <Users className="h-4 w-4 text-indigo-600" />
                                <label htmlFor="multi-member-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                    Allow Crew (Multi-Member)
                                </label>
                                <Switch
                                    id="multi-member-toggle"
                                    checked={allowMultiMember}
                                    onCheckedChange={setAllowMultiMember}
                                    disabled={!canOperate}
                                />
                            </div>
                            <Select value={formType} onValueChange={(val: any) => setFormType(val)}>
                                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACCREDITATION">Accreditation</SelectItem>
                                    <SelectItem value="EQUIPMENT_CLEARANCE">Equipment</SelectItem>
                                    <SelectItem value="VISA_SUPPORT">Visa Support</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => setPreviewOpen(true)}
                            >
                                <Eye className="h-4 w-4" /> Preview
                            </Button>
                            <Button size="sm" className="bg-black text-white gap-2" onClick={handleSave} disabled={isSaving || !canOperate}>
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4" /> Save Form
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-gray-50/30">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                <div className="max-w-3xl mx-auto space-y-6">

                                    {/* Empty categories state */}
                                    {categories.length === 0 && (
                                        <div className="text-center p-8 bg-blue-50/40 border-2 border-dashed border-blue-200 rounded-xl space-y-3">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                                                <Layers className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">No Sections (Categories) Created Yet</h4>
                                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                                    Sections organize form fields into clear steps (such as Personal Information, Media Organization, Passport Details) for applicants.
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                                                onClick={() => setIsAddCategoryOpen(true)}
                                                disabled={!canOperate}
                                            >
                                                <FolderPlus className="h-4 w-4" /> Create First Section
                                            </Button>
                                        </div>
                                    )}

                                    {/* Render Each Category Container */}
                                    {categories.map((cat, catIdx) => {
                                        const catFields = fields.filter(f => f.categoryName === cat.name);
                                        return (
                                            <div key={cat.id} className="rounded-xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
                                                {/* Section Header */}
                                                <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-1.5 bg-blue-100/80 rounded-md text-blue-800">
                                                            <Layers className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-sm font-bold text-slate-800 tracking-wide">{cat.name}</h3>
                                                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-700 border-blue-200">
                                                                    {catFields.length} {catFields.length === 1 ? 'field' : 'fields'}
                                                                </Badge>
                                                            </div>
                                                            {cat.description && (
                                                                <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Section Controls */}
                                                    <div className="flex items-center gap-1 sm:self-auto self-end">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                                            onClick={() => moveCategory(catIdx, 'up')}
                                                            disabled={catIdx === 0 || !canOperate}
                                                            title="Move section up"
                                                        >
                                                            <ChevronUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                                            onClick={() => moveCategory(catIdx, 'down')}
                                                            disabled={catIdx === categories.length - 1 || !canOperate}
                                                            title="Move section down"
                                                        >
                                                            <ChevronDown className="h-4 w-4" />
                                                        </Button>

                                                        {/* Add Field to this section Dropdown */}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 text-xs px-2 gap-1 text-emerald-700 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100"
                                                                    disabled={!canOperate}
                                                                >
                                                                    <Plus className="h-3.5 w-3.5" /> Add Field
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                {FIELD_TYPES.map(ft => (
                                                                    <DropdownMenuItem
                                                                        key={ft.type}
                                                                        className="gap-2 text-xs cursor-pointer"
                                                                        onClick={() => addField(ft.type as FormField['type'], cat.name)}
                                                                    >
                                                                        <ft.icon className="h-3.5 w-3.5 text-slate-500" />
                                                                        <span>{ft.label}</span>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>

                                                        {/* Edit Section */}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                                            onClick={() => {
                                                                setEditingCategory(cat);
                                                                setEditCategoryName(cat.name);
                                                                setEditCategoryDescription(cat.description || '');
                                                            }}
                                                            disabled={!canOperate}
                                                            title="Edit section details"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>

                                                        {/* Delete Section */}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => requestDeleteCategory(cat)}
                                                            disabled={!canOperate}
                                                            title="Delete section"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Section Fields Body */}
                                                <div className="p-4 space-y-3 bg-slate-50/30">
                                                    {catFields.length === 0 ? (
                                                        <div className="text-center py-6 px-4 border border-dashed border-slate-200 rounded-lg bg-white/60">
                                                            <Layers className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                                                            <p className="text-xs font-medium text-slate-600">This section has no fields yet</p>
                                                            <p className="text-[11px] text-slate-400 mb-3">Add fields using the button above or select an existing field to move here</p>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-7 text-xs gap-1 border-dashed text-blue-600 border-blue-300 hover:bg-blue-50"
                                                                        disabled={!canOperate}
                                                                    >
                                                                        <Plus className="h-3 w-3" /> Add First Field
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="center" className="w-48">
                                                                    {FIELD_TYPES.map(ft => (
                                                                        <DropdownMenuItem
                                                                            key={ft.type}
                                                                            className="gap-2 text-xs cursor-pointer"
                                                                            onClick={() => addField(ft.type as FormField['type'], cat.name)}
                                                                        >
                                                                            <ft.icon className="h-3.5 w-3.5 text-slate-500" />
                                                                            <span>{ft.label}</span>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    ) : (
                                                        catFields.map(field => renderFieldItem(field))
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Uncategorized Fields Container */}
                                    {uncategorizedFields.length > 0 && (
                                        <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/20 shadow-sm overflow-hidden">
                                            <div className="bg-amber-50/60 px-4 py-3 border-b border-amber-200 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-amber-900">Uncategorized Fields</span>
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-800 border-amber-300">
                                                        {uncategorizedFields.length} {uncategorizedFields.length === 1 ? 'field' : 'fields'}
                                                    </Badge>
                                                </div>
                                                <p className="text-[11px] text-amber-700 italic">Select a field to assign it to a section in Properties</p>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                {uncategorizedFields.map(field => renderFieldItem(field))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Prominent Add New Section Button */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full py-6 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 text-slate-600 hover:text-blue-700 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold"
                                        onClick={() => setIsAddCategoryOpen(true)}
                                        disabled={!canOperate}
                                    >
                                        <FolderPlus className="h-5 w-5" /> Add New Section (Category)
                                    </Button>

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

                            {/* Section (Category) Selector */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-600 uppercase">Section (Category)</label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[11px] text-blue-600 hover:text-blue-800 p-0 hover:bg-transparent flex items-center gap-1"
                                        onClick={() => setIsAddCategoryOpen(true)}
                                    >
                                        <Plus className="h-3 w-3" /> New Section
                                    </Button>
                                </div>
                                <Select
                                    value={selectedField.categoryName || "uncategorized"}
                                    onValueChange={(val) => {
                                        if (val === "uncategorized") {
                                            setFieldCategory(selectedField.id, undefined);
                                        } else {
                                            setFieldCategory(selectedField.id, val);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="uncategorized">Uncategorized (No Section)</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.name}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator className="my-4" />

                            {['checkbox', 'radio', 'dropdown'].includes(selectedField.type) && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-gray-600 uppercase">Options</Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs"
                                            onClick={() => {
                                                const currentOptions = selectedField.options || [];
                                                updateField(selectedField.id, {
                                                    options: [...currentOptions, `Option ${currentOptions.length + 1}`]
                                                });
                                            }}
                                        >
                                            + Add Option
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {(selectedField.options || []).map((option, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <div className="grid place-items-center h-8 w-8 bg-gray-100 rounded text-gray-500 text-xs font-mono">
                                                    {idx + 1}
                                                </div>
                                                <Input
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...(selectedField.options || [])];
                                                        const oldName = newOptions[idx];
                                                        newOptions[idx] = e.target.value;
                                                        if (selectedField.descriptions && selectedField.descriptions[oldName] !== undefined) {
                                                            const newDescs = { ...selectedField.descriptions };
                                                            newDescs[e.target.value] = newDescs[oldName];
                                                            delete newDescs[oldName];
                                                            updateField(selectedField.id, { options: newOptions, descriptions: newDescs });
                                                        } else {
                                                            updateField(selectedField.id, { options: newOptions });
                                                        }
                                                    }}
                                                    className="h-8 text-xs"
                                                    placeholder={`Option ${idx + 1}`}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => {
                                                        const removedOpt = (selectedField.options || [])[idx];
                                                        const newOptions = (selectedField.options || []).filter((_, i) => i !== idx);
                                                        const newDescs = { ...(selectedField.descriptions || {}) };
                                                        delete newDescs[removedOpt];
                                                        updateField(selectedField.id, { options: newOptions, descriptions: newDescs });
                                                    }}
                                                    disabled={(selectedField.options?.length || 0) <= 1}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Hover Descriptions per option */}
                                    {selectedField.type === 'dropdown' && (
                                        <div className="space-y-2 pt-2">
                                            <Label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
                                                <span>Option Hover Descriptions</span>
                                                <span className="text-[10px] font-normal text-gray-400 normal-case ml-1">(shown on hover)</span>
                                            </Label>
                                            <div className="space-y-2">
                                                {(selectedField.options || []).map((option, idx) => (
                                                    <div key={idx} className="space-y-1">
                                                        <p className="text-[10px] font-semibold text-emerald-700 pl-1">{option || `Option ${idx + 1}`}</p>
                                                        <Input
                                                            value={(selectedField.descriptions || {})[option] || ''}
                                                            onChange={(e) => {
                                                                const newDescs = { ...(selectedField.descriptions || {}) };
                                                                if (e.target.value.trim()) {
                                                                    newDescs[option] = e.target.value;
                                                                } else {
                                                                    delete newDescs[option];
                                                                }
                                                                updateField(selectedField.id, { descriptions: newDescs });
                                                            }}
                                                            className="h-8 text-xs placeholder:text-gray-300"
                                                            placeholder={`Describe "${option}" to applicants…`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Nested Dynamic Sub-Fields */}
                                    {selectedField.type === 'dropdown' && (
                                        <div className="space-y-4 pt-3 border-t">
                                            <div>
                                                <Label className="text-xs font-bold text-gray-600 uppercase">
                                                    Option Sub-Fields (Dynamic)
                                                </Label>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    Add dynamic extra fields revealed when an applicant selects a specific option.
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                {(selectedField.options || []).map((option, idx) => {
                                                    const subFields = (selectedField.nestedFields || {})[option] || [];
                                                    return (
                                                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-bold text-blue-900 truncate max-w-[150px]">
                                                                    {option || `Option ${idx + 1}`}
                                                                </span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-6 text-[11px] px-2 text-blue-700 border-blue-200 bg-white hover:bg-blue-50"
                                                                    onClick={() => addNestedField(selectedField.id, option)}
                                                                >
                                                                    + Add Field
                                                                </Button>
                                                            </div>

                                                            {subFields.length === 0 ? (
                                                                <p className="text-[10px] text-gray-400 italic">No extra fields for this option</p>
                                                            ) : (
                                                                <div className="space-y-2 pt-1">
                                                                    {subFields.map((sub) => (
                                                                        <div key={sub.id} className="p-2 bg-white rounded border border-slate-200 space-y-1.5 shadow-2xs">
                                                                            <div className="flex items-center justify-between">
                                                                                <Input
                                                                                    value={sub.label}
                                                                                    onChange={(e) => updateNestedField(selectedField.id, option, sub.id, { label: e.target.value })}
                                                                                    className="h-6 text-xs font-medium w-36"
                                                                                    placeholder="Field Label"
                                                                                />
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-6 w-6 text-red-500 hover:text-red-700"
                                                                                    onClick={() => removeNestedField(selectedField.id, option, sub.id)}
                                                                                >
                                                                                    <X className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-1.5">
                                                                                <Select
                                                                                    value={sub.type}
                                                                                    onValueChange={(val: any) => updateNestedField(selectedField.id, option, sub.id, { type: val })}
                                                                                >
                                                                                    <SelectTrigger className="h-6 text-[10px]">
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="text">Text</SelectItem>
                                                                                        <SelectItem value="number">Number</SelectItem>
                                                                                        <SelectItem value="date">Date</SelectItem>
                                                                                        <SelectItem value="email">Email</SelectItem>
                                                                                        <SelectItem value="textarea">Textarea</SelectItem>
                                                                                        <SelectItem value="file">File</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <Input
                                                                                    value={sub.placeholder || ''}
                                                                                    onChange={(e) => updateNestedField(selectedField.id, option, sub.id, { placeholder: e.target.value })}
                                                                                    className="h-6 text-[10px]"
                                                                                    placeholder="Placeholder"
                                                                                />
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 pt-0.5">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    id={`sub-req-${sub.id}`}
                                                                                    checked={sub.required}
                                                                                    onChange={(e) => updateNestedField(selectedField.id, option, sub.id, { required: e.target.checked })}
                                                                                    className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                                />
                                                                                <label htmlFor={`sub-req-${sub.id}`} className="text-[10px] text-gray-600 cursor-pointer select-none">
                                                                                    Required
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-gray-600 uppercase">Required</Label>
                                <Switch checked={selectedField.required} onCheckedChange={(val) => updateField(selectedField.id, { required: val })} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 uppercase">Placeholder</label>
                                <Input value={selectedField.placeholder || ''} onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })} />
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-gray-600 uppercase">Validation</Label>

                                {['text', 'textarea', 'email'].includes(selectedField.type) && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-500">Min Length</Label>
                                            <Input
                                                type="number"
                                                value={selectedField.validation?.minLength || ''}
                                                onChange={(e) => updateValidation(selectedField.id, 'minLength', parseInt(e.target.value) || undefined)}
                                                placeholder="e.g. 5"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-500">Max Length</Label>
                                            <Input
                                                type="number"
                                                value={selectedField.validation?.maxLength || ''}
                                                onChange={(e) => updateValidation(selectedField.id, 'maxLength', parseInt(e.target.value) || undefined)}
                                                placeholder="e.g. 100"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-500">Pattern (Regex)</Label>
                                            <Input
                                                value={selectedField.validation?.pattern || ''}
                                                onChange={(e) => updateValidation(selectedField.id, 'pattern', e.target.value)}
                                                placeholder="^[A-Z]+$"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </>
                                )}

                                {selectedField.type === 'number' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-500">Min Value</Label>
                                            <Input
                                                type="number"
                                                value={selectedField.validation?.minValue || ''}
                                                onChange={(e) => updateValidation(selectedField.id, 'minValue', parseInt(e.target.value) || undefined)}
                                                placeholder="0"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-500">Max Value</Label>
                                            <Input
                                                type="number"
                                                value={selectedField.validation?.maxValue || ''}
                                                onChange={(e) => updateValidation(selectedField.id, 'maxValue', parseInt(e.target.value) || undefined)}
                                                placeholder="100"
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Custom Error Message</Label>
                                    <Input
                                        value={selectedField.validation?.errorMessage || ''}
                                        onChange={(e) => updateValidation(selectedField.id, 'errorMessage', e.target.value)}
                                        placeholder="This field is required..."
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>

                            <Separator className="my-4" />

                            {canOperate && (
                                <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50 gap-2" onClick={() => removeField(selectedField.id)}>
                                    <Trash2 className="h-4 w-4" /> Delete Field
                                </Button>
                            )}
                        </CardContent>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">Select a field to edit</div>
                    )}
                </Card>
            </div>

            {/* ADD CATEGORY DIALOG */}
            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderPlus className="h-5 w-5 text-blue-600" />
                            <span>Create New Section (Category)</span>
                        </DialogTitle>
                        <DialogDescription>
                            Sections group related form fields into organized steps for applicants (e.g., "Personal Details", "Media Credentials", "Passport Info").
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="new-cat-name" className="text-xs font-bold uppercase text-slate-600">
                                Section Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="new-cat-name"
                                placeholder="e.g. Personal Information"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCategory();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-cat-desc" className="text-xs font-bold uppercase text-slate-600">
                                Description <span className="text-gray-400 font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="new-cat-desc"
                                placeholder="Brief description or instructions for applicants"
                                value={newCategoryDescription}
                                onChange={(e) => setNewCategoryDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5" onClick={handleAddCategory}>
                            <Plus className="h-4 w-4" /> Create Section
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* EDIT CATEGORY DIALOG */}
            <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-4 w-4 text-blue-600" />
                            <span>Edit Section</span>
                        </DialogTitle>
                        <DialogDescription>
                            Update section name or description. Fields currently in this section will stay attached to it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="edit-cat-name" className="text-xs font-bold uppercase text-slate-600">
                                Section Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit-cat-name"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleRenameCategory();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-cat-desc" className="text-xs font-bold uppercase text-slate-600">
                                Description <span className="text-gray-400 font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="edit-cat-desc"
                                value={editCategoryDescription}
                                onChange={(e) => setEditCategoryDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCategory(null)}>
                            Cancel
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleRenameCategory}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CATEGORY CONFIRMATION DIALOG */}
            <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            <DialogTitle>Delete Section "{categoryToDelete?.name}"</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2 text-slate-600">
                            This section currently contains{' '}
                            <strong className="text-slate-900">
                                {categoryToDelete ? fields.filter(f => f.categoryName === categoryToDelete.name).length : 0} field(s)
                            </strong>.
                            How would you like to proceed?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-3">
                        <div className="p-3 rounded-lg border bg-slate-50 text-xs text-slate-600 space-y-1">
                            <p className="font-semibold text-slate-800">Choose an option:</p>
                            <p>• <strong>Keep Fields:</strong> Removes this section, but keeps all its fields safely in "Uncategorized".</p>
                            <p>• <strong>Delete All:</strong> Permanently removes this section and all fields inside it.</p>
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCategoryToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                            onClick={() => handleConfirmDeleteCategory('keep_uncategorized')}
                        >
                            Keep Fields (Uncategorize)
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleConfirmDeleteCategory('delete_all')}
                        >
                            Delete Section & Fields
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* PREVIEW DIALOG */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Form Preview</DialogTitle></DialogHeader>
                    <div className="space-y-6 p-4">
                        <div className="p-6 bg-blue-600 text-white rounded-lg">
                            <h2 className="text-xl font-bold">{formName}</h2>
                            <p className="opacity-90">{formDescription}</p>
                        </div>
                        <div className="space-y-6">
                            {categories.map(cat => {
                                const catFields = fields.filter(f => f.categoryName === cat.name);
                                if (catFields.length === 0) return null;
                                return (
                                    <div key={cat.id} className="space-y-3">
                                        <div className="border-b pb-1.5 flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-blue-600" />
                                            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">{cat.name}</h3>
                                        </div>
                                        {cat.description && <p className="text-xs text-slate-500">{cat.description}</p>}
                                        <div className="space-y-3">
                                            {catFields.map(f => renderPreviewField(f))}
                                        </div>
                                    </div>
                                );
                            })}
                            {uncategorizedFields.length > 0 && (
                                <div className="space-y-3">
                                    <div className="border-b pb-1.5 flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Uncategorized Fields</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {uncategorizedFields.map(f => renderPreviewField(f))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
