import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
    UserPlus,
    Mail,
    User,
    Globe,
    FileText,
    Save,
    Loader2,
    AlertCircle,
    Layout,
    Plus,
    Trash2,
    Package,
    UploadCloud,
    Camera,
    Mic,
    Laptop,
    Tablet,
    Radio,
    DollarSign,
    ShieldCheck,
    CheckCircle2,
    Check,
    ChevronsUpDown
} from 'lucide-react';

import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import {
    useCreateManualApplicationMutation,
    useGetFormsQuery,
    useGetCountriesQuery,
    useGetFormByIdQuery,
    useGetApplicationByIdQuery,
    useUpdateManualApplicationMutation
} from '@/store/services/api';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const manualEntrySchema = z.object({
    fullName: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    formId: z.string().min(1, 'Please select a form type'),
    applyingFromCountryId: z.string().optional(),
    externalPlatform: z.string().optional(),
    registrationNotes: z.string().optional(),
}).passthrough();

type ManualEntryFormValues = z.infer<typeof manualEntrySchema> & Record<string, any>;

interface EquipmentItem {
    id: string;
    type: string;
    description: string;
    model?: string;
    serialNumber: string;
    quantity: number;
    value: number;
    currency: string;
    otherCurrency?: string;
    isDrone?: boolean;
}

const equipmentTypes = [
    { value: "camera", label: "Camera & Lens", icon: Camera },
    { value: "audio", label: "Audio/Mic", icon: Mic },
    { value: "lighting", label: "Lighting", icon: Radio },
    { value: "it", label: "Laptop/IT", icon: Laptop },
    { value: "cash", label: "Cash/Currency", icon: DollarSign },
    { value: "other", label: "Other", icon: Tablet },
];

export default function ManualEntry() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');

    const { data: editApplication, isFetching: isFetchingApplication } = useGetApplicationByIdQuery(Number(editId), { skip: !editId });
    const [updateManualApplication, { isLoading: isUpdating }] = useUpdateManualApplicationMutation();

    const [createManualApplication, { isLoading: isCreating }] = useCreateManualApplicationMutation();
    const isLoading = isCreating || isUpdating; // Unified loading state
    const { data: formsData, isLoading: isLoadingForms } = useGetFormsQuery();
    const { data: countries, isLoading: isLoadingCountries } = useGetCountriesQuery();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        trigger,
        setError,
        clearErrors,
        formState: { errors, isValid },
    } = useForm<ManualEntryFormValues>({
        mode: 'onTouched',
        defaultValues: {
            externalPlatform: 'Manual Entry',
        }
    });

    const selectedFormId = watch('formId');
    const { data: fullForm, isLoading: isLoadingForm } = useGetFormByIdQuery(selectedFormId || '', { skip: !selectedFormId });

    // State for files/equipment
    const [files, setFiles] = useState<Record<string, File[]>>({});
    const [equipments, setEquipments] = useState<EquipmentItem[]>([]);

    // Populate form for Edit Mode
    useEffect(() => {
        if (editApplication) {
            setValue('fullName', editApplication.user?.fullName || '');
            setValue('email', editApplication.user?.email || '');
            setValue('formId', String(editApplication.formId));
            if (editApplication.applyingFromCountryId) {
                setValue('applyingFromCountryId', String(editApplication.applyingFromCountryId));
            }
            setValue('externalPlatform', editApplication.user?.externalPlatform || 'Manual Entry');

            // Populate dynamic fields
            if (editApplication.formData) {
                Object.entries(editApplication.formData).forEach(([key, val]) => {
                    if (key !== 'equipments' && key !== 'manually_added' && key !== 'added_at' && key !== 'files') {
                        setValue(key, val);
                    }
                });
            }

            // Populate equipments
            if (editApplication.equipment && editApplication.equipment.length > 0) {
                const mappedEquipments: EquipmentItem[] = editApplication.equipment.map((eq: any) => ({
                    id: String(eq.id), // Use provided ID
                    type: eq.type?.toLowerCase() || 'other',
                    description: eq.description || '',
                    model: eq.model || '',
                    serialNumber: eq.serialNumber || '',
                    quantity: Number(eq.quantity || 1),
                    value: Number(eq.value || 0),
                    currency: eq.currency || 'USD',
                    isDrone: !!eq.isDrone
                }));
                setEquipments(mappedEquipments);

                // Set drone/declaration status
                const hasDrone = mappedEquipments.some(e => e.isDrone || e.type === 'drone');
                const hasEquip = mappedEquipments.length > 0;

                if (hasDrone) {
                    setValue('has_drone' as any, true);
                    setValue('declaration_status' as any, true);
                } else if (hasEquip) {
                    setValue('declaration_status' as any, true);
                }
            }
        }
    }, [editApplication, setValue]);

    const validateDynamicField = (name: string, value: any, field?: any) => {
        // Find field definition if not provided
        if (!field && fullForm) {
            for (const cat of fullForm.categories || []) {
                const f = cat.fields?.find((f: any) => f.field_name === name);
                if (f) { field = f; break; }
            }
            if (!field && fullForm.uncategorizedFields) {
                field = fullForm.uncategorizedFields.find((f: any) => f.field_name === name);
            }
        }
        if (!field) return true;

        let error = '';
        if (field.is_required) {
            if (field.field_type === 'file') {
                // Check if file is in local state OR in existing application documents
                const hasLocalFile = files[name] && files[name].length > 0;
                const hasServerFile = editApplication?.documents?.some((doc: any) =>
                    doc.filePath && doc.filePath.includes(name)
                );

                if (!hasLocalFile && !(editId && hasServerFile)) {
                    error = field.validation_criteria?.errorMessage || `${field.label} is required`;
                }
            } else if (value === undefined || value === null || value === '') {
                error = field.validation_criteria?.errorMessage || `${field.label} is required`;
            }
        } else if (value && field.field_type === 'email' && !field.validation_criteria?.pattern) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                error = 'Invalid email format';
            }
        }

        if (error) {
            setError(name as any, { type: 'manual', message: error });
            return false;
        } else {
            clearErrors(name as any);
            return true;
        }
    };

    // Real-time file validation
    useEffect(() => {
        if (!fullForm) return;

        const fields = [
            ...(fullForm.categories?.flatMap((c: any) => c.fields) || []),
            ...(fullForm.uncategorizedFields || [])
        ];

        fields.forEach((field: any) => {
            if (field.field_type === 'file' && field.is_required) {
                const currentFiles = files[field.field_name];
                // Check server files if editing
                const hasServerFile = editId && editApplication?.documents?.some((doc: any) => doc.filePath && doc.filePath.includes(field.field_name));

                // Only validate if the field has been interacted with or we are submitting
                if (currentFiles !== undefined) {
                    if (currentFiles.length > 0 || hasServerFile) {
                        clearErrors(field.field_name as any);
                    } else {
                        setError(field.field_name as any, {
                            type: 'manual',
                            message: field.validation_criteria?.errorMessage || `${field.label} is required`
                        });
                    }
                }
            }
        });
    }, [files, fullForm, setError, clearErrors, editId, editApplication]);

    const handleFileChange = (name: string, fileList: FileList | null) => {
        if (fileList && fileList.length > 0) {
            setFiles(prev => {
                const existing = prev[name] || [];
                const newFiles = Array.from(fileList);
                // Prevent duplicate files by name and size for basic deduping
                const uniqueNewFiles = newFiles.filter(nf =>
                    !existing.some(ef => ef.name === nf.name && ef.size === nf.size)
                );
                return { ...prev, [name]: [...existing, ...uniqueNewFiles] };
            });
        }
    };

    const removeFile = (name: string, index: number, field: any) => {
        setFiles(prev => {
            const existing = prev[name] || [];
            const updated = existing.filter((_, i) => i !== index);
            return { ...prev, [name]: updated };
        });
    };

    const addEquipment = (type: string = 'camera', isDrone: boolean = false) => {
        const newItem: EquipmentItem = {
            id: crypto.randomUUID(),
            type,
            description: '',
            model: '',
            serialNumber: '',
            quantity: 1,
            value: 0,
            currency: 'USD',
            isDrone
        };
        setEquipments(prev => [...prev, newItem]);
    };

    const removeEquipment = (id: string) => {
        const itemToRemove = equipments.find(e => e.id === id);
        const newList = equipments.filter(e => e.id !== id);
        setEquipments(newList);

        if (itemToRemove?.isDrone || itemToRemove?.type === 'drone') {
            const anyDroneRemaining = newList.some(eq => eq.isDrone || eq.type === 'drone');
            if (!anyDroneRemaining) {
                setValue('has_drone' as any, false);
            }
        }
    };

    const updateEquipment = (id: string, updates: Partial<EquipmentItem>) => {
        setEquipments(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    const addEquipmentWithStatus = () => {
        if (!watch('declaration_status' as any)) {
            setValue('declaration_status' as any, true);
        }
        addEquipment();
    };

    const addDroneWithStatus = () => {
        if (!watch('has_drone' as any)) {
            setValue('has_drone' as any, true);
        }
        addEquipment('drone', true);
    };

    const onSubmit = async (values: ManualEntryFormValues) => {
        // Special manual check for files and drone logic
        let hasErrors = false;
        if (fullForm) {
            const fields = [
                ...(fullForm.categories?.flatMap((c: any) => c.fields) || []),
                ...(fullForm.uncategorizedFields || [])
            ];

            for (const field of fields) {
                if (field.field_type === 'file') {
                    const isValid = validateDynamicField(field.field_name, values[field.field_name], field);
                    if (!isValid) hasErrors = true;
                }
            }
        }

        if (hasErrors) {
            toast.error('Please complete all required fields and file uploads.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('fullName', values.fullName);
            formData.append('email', values.email);
            formData.append('formId', values.formId);
            if (values.applyingFromCountryId) formData.append('applyingFromCountryId', values.applyingFromCountryId);
            if (values.externalPlatform) formData.append('externalPlatform', values.externalPlatform);

            // Filter out internal form fields from form_data
            const reserved = ['fullName', 'email', 'formId', 'applyingFromCountryId', 'externalPlatform', 'registrationNotes'];
            const dynamicData: Record<string, any> = {};
            Object.keys(values).forEach(key => {
                if (!reserved.includes(key)) {
                    dynamicData[key] = values[key];
                }
            });

            const formContent = {
                ...dynamicData,
                registration_notes: values.registrationNotes,
                manually_added: true,
                added_at: editId ? undefined : new Date().toISOString(), // Only set added_at on creation
                updated_at: editId ? new Date().toISOString() : undefined
            };

            formData.append('form_data', JSON.stringify(formContent));
            formData.append('equipments', JSON.stringify(equipments.map(({ id, ...rest }) => rest)));

            // Append files
            Object.entries(files).forEach(([fieldName, fileArray]) => {
                fileArray.forEach(file => {
                    formData.append(fieldName, file);
                });
            });

            if (editId) {
                await updateManualApplication({ id: Number(editId), data: formData }).unwrap();
                toast.success('Application updated successfully!');
                navigate('/dashboard/manual-applications');
            } else {
                await createManualApplication(formData).unwrap();
                toast.success('Manual client entry successful!');
                navigate('/dashboard/journalists');
            }
        } catch (err: any) {
            console.error('Manual entry failed:', err);
            toast.error(err.data?.message || err.message || 'Failed to submit application');
        }
    };

    const getValidationRules = (field: any) => {
        const { label, is_required, validation_criteria, field_type } = field;
        const rules: any = {};

        if (is_required) {
            rules.required = validation_criteria?.errorMessage || `${label} is required`;
        }

        if (validation_criteria) {
            if (validation_criteria.minLength) {
                rules.minLength = {
                    value: Number(validation_criteria.minLength),
                    message: validation_criteria.errorMessage || `Must be at least ${validation_criteria.minLength} characters`
                };
            }

            if (validation_criteria.maxLength) {
                rules.maxLength = {
                    value: Number(validation_criteria.maxLength),
                    message: validation_criteria.errorMessage || `Must be less than ${validation_criteria.maxLength} characters`
                };
            }

            if (validation_criteria.pattern) {
                try {
                    // Handle patterns that might come as strings with slashes from backend
                    let patternString = validation_criteria.pattern;
                    if (patternString.startsWith('/') && patternString.endsWith('/')) {
                        patternString = patternString.slice(1, -1);
                    }
                    rules.pattern = {
                        value: new RegExp(patternString),
                        message: validation_criteria.errorMessage || 'Invalid format'
                    };
                } catch (e) {
                    console.error('Invalid regex pattern:', validation_criteria.pattern);
                }
            }
        }

        // Default email validation if no specific pattern is provided
        if (field_type === 'email' && !rules.pattern) {
            rules.pattern = {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email format'
            };
        }

        return rules;
    };

    const renderField = (field: any) => {
        const { field_name, label, field_type, is_required, field_options } = field;

        // Skip rendering for boolean fields that are handled by custom UI
        if (field_name === 'has_drone' || field_name === 'declaration_status') {
            return null;
        }

        const value = watch(field_name) || '';
        const error = (errors as any)[field_name];

        // Check if this is the Nationality field
        if (field_name.toLowerCase() === 'nationality') {
            return (
                <div key={field_name} className="space-y-2">
                    <Label className="text-sm font-medium">{label} {is_required && '*'}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    "w-full justify-between h-11 font-normal",
                                    !value && "text-muted-foreground",
                                    error && "border-destructive ring-destructive"
                                )}
                            >
                                {value
                                    ? countries?.find((country: any) => country.name === value)?.name
                                    : `Select ${label.toLowerCase()}...`}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
                                <CommandList>
                                    <CommandEmpty>No country found.</CommandEmpty>
                                    <CommandGroup>
                                        {countries?.map((country: any) => (
                                            <CommandItem
                                                key={country.id}
                                                value={country.name}
                                                onSelect={(currentValue) => {
                                                    setValue(field_name as any, currentValue, { shouldValidate: true, shouldDirty: true });
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        value === country.name ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {country.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {error && (
                        <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 mt-1">
                            {error.message}
                        </p>
                    )}
                </div>
            );
        }

        switch (field_type) {
            case 'textarea':
                return (
                    <div key={field_name} className="space-y-2 col-span-2">
                        <Label className="text-sm font-medium">{label} {is_required && '*'}</Label>
                        <Textarea
                            placeholder={`Enter ${label.toLowerCase()}...`}
                            {...register(field_name, getValidationRules(field))}
                            rows={field_options?.rows || 2}
                            className={`resize-none ${error ? "border-destructive ring-destructive" : ""}`}
                        />
                        {error && (
                            <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 mt-1">
                                {error.message}
                            </p>
                        )}
                    </div>
                );
            case 'select':
                register(field_name, getValidationRules(field));
                return (
                    <div key={field_name} className="space-y-2">
                        <Label className="text-sm font-medium">{label} {is_required && '*'}</Label>
                        <Select
                            value={value}
                            onValueChange={(val) => {
                                setValue(field_name as any, val, { shouldValidate: true, shouldDirty: true });
                            }}
                        >
                            <SelectTrigger
                                className={error ? "border-destructive ring-destructive" : ""}
                                onBlur={() => trigger(field_name)}
                            >
                                <SelectValue placeholder={`Select ${label.toLowerCase()}...`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field_options?.options?.map((opt: any) => (
                                    <SelectItem key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                                        {typeof opt === 'string' ? opt : opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {error && (
                            <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 mt-1">
                                {error.message}
                            </p>
                        )}
                    </div>
                );
            case 'date':
                return (
                    <div key={field_name} className="space-y-2">
                        <Label className="text-sm font-medium">{label} {is_required && '*'}</Label>
                        <Input
                            type="date"
                            {...register(field_name, getValidationRules(field))}
                            className={error ? "border-destructive ring-destructive" : ""}
                        />
                        {error && (
                            <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 mt-1">
                                {error.message}
                            </p>
                        )}
                    </div>
                );
            case 'boolean':
            case 'checkbox':
                return (
                    <div key={field_name} className="flex flex-col gap-1 pt-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id={field_name}
                                {...register(field_name, getValidationRules(field))}
                                className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer ${error ? "border-destructive" : ""}`}
                            />
                            <Label htmlFor={field_name} className="text-sm font-medium cursor-pointer">{label} {is_required && '*'}</Label>
                        </div>
                        {error && (
                            <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 mt-1">
                                {error.message}
                            </p>
                        )}
                    </div>
                );
            case 'file':
                // Filter documents that contain the field name in their file path
                const serverFiles = editId && editApplication?.documents?.filter((doc: any) =>
                    doc.filePath && doc.filePath.includes(field_name)
                ) || [];
                const hasServerFiles = serverFiles.length > 0;

                return (
                    <div key={field_name} className="space-y-3">
                        <Label className="text-sm font-medium">{label} {is_required && '*'}</Label>

                        <div className={`border-2 border-dashed rounded-lg p-6 hover:bg-slate-50 transition-colors text-center cursor-pointer relative ${error ? "border-destructive bg-destructive/5" : "border-slate-200"}`}>
                            <Input
                                type="file"
                                multiple
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => {
                                    handleFileChange(field_name, e.target.files);
                                    e.target.value = ''; // Reset input to allow selecting same file again
                                }}
                            />
                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                <UploadCloud className="h-8 w-8 text-slate-400" />
                                <p className="text-sm text-slate-600 font-medium">Click to upload files</p>
                                <p className="text-xs text-slate-400">Supported formats: PDF, IMG (Max 5MB)</p>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> {error.message}
                            </p>
                        )}

                        {/* Server Files Display */}
                        {hasServerFiles && (
                            <div className="space-y-2 bg-slate-50 p-3 rounded-md border border-slate-100">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Existing Files ({serverFiles.length})</h4>
                                <div className="grid gap-2">
                                    {serverFiles.map((file: any) => {
                                        const fileName = file.filePath.split('/').pop() || file.filePath.split('\\').pop() || 'File';
                                        const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';
                                        return (
                                            <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 shadow-sm text-sm group">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center shrink-0 text-blue-500 font-bold text-xs uppercase">
                                                        {fileExt}
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <a href={file.filePath} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-slate-700 hover:text-blue-600 hover:underline" title={fileName}>
                                                            {fileName}
                                                        </a>
                                                        <span className="text-xs text-slate-400">Uploaded {new Date(file.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs italic text-gray-400 px-2">Saved</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {files[field_name] && files[field_name].length > 0 && (
                            <div className="space-y-2 bg-emerald-50/50 p-3 rounded-md border border-emerald-100">
                                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">New Uploads ({files[field_name].length})</h4>
                                <div className="grid gap-2">
                                    {files[field_name].map((file, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-white rounded border border-emerald-100 shadow-sm text-sm group">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span className="truncate font-medium text-slate-700" title={file.name}>{file.name}</span>
                                                <span className="text-xs text-slate-400 shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(field_name, i, field)}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return (
                    <div key={field_name} className="space-y-2">
                        <Label className="text-sm font-medium">{label} {is_required && '*'}</Label>
                        <Input
                            type={field_type === 'number' ? 'number' : 'text'}
                            placeholder={`Enter ${label.toLowerCase()}...`}
                            {...register(field_name, getValidationRules(field))}
                            className={error ? "border-destructive ring-destructive" : ""}
                        />
                        {error && (
                            <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 mt-1">
                                {error.message}
                            </p>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                        <UserPlus className="h-8 w-8 text-primary" />
                        Manual Client Entry
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Register clients who signed up on external platforms or need manual processing.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12 space-y-6">
                    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md overflow-hidden ring-1 ring-gray-200">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-gray-100">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Enter the client's primary profile details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-6 md:grid-cols-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                                <div className="relative">
                                    <Input
                                        id="fullName"
                                        placeholder="John Doe"
                                        className="pl-10 h-11"
                                        {...register('fullName', {
                                            required: 'Full name is required',
                                            minLength: { value: 3, message: 'Full name must be at least 3 characters' }
                                        })}
                                    />
                                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                </div>
                                {errors.fullName && (
                                    <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 mt-1">
                                        {errors.fullName.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        className="pl-10 h-11"
                                        {...register('email', {
                                            required: 'Email address is required',
                                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' }
                                        })}
                                    />
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 mt-1">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md overflow-hidden ring-1 ring-gray-200">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-gray-100">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Layout className="h-5 w-5 text-primary" />
                                Application Parameters
                            </CardTitle>
                            <CardDescription>
                                Specify the form type and origin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-6 md:grid-cols-4">
                            <div className="space-y-2 md:col-span-1">
                                <Label htmlFor="formId" className="text-sm font-medium">Form Type</Label>
                                <Select
                                    value={selectedFormId}
                                    onValueChange={(val) => {
                                        setValue('formId', val, { shouldValidate: true, shouldDirty: true });
                                    }}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder={isLoadingForms ? "Loading..." : "Select Type"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formsData?.map((form: any) => (
                                            <SelectItem key={form.form_id || form.id} value={String(form.form_id || form.id)}>
                                                {form.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {/* Register formId manually to track validation state */}
                                <input type="hidden" {...register('formId', { required: 'Please select a form type' })} />
                                {errors.formId && (
                                    <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 mt-1">
                                        {errors.formId.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-1">
                                <Label htmlFor="applyingFromCountryId" className="text-sm font-medium">Applying From</Label>
                                <Select
                                    onValueChange={(val) => setValue('applyingFromCountryId', val)}
                                >
                                    <SelectTrigger className="h-11">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-gray-400" />
                                            <SelectValue placeholder={isLoadingCountries ? "..." : "Country"} />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries?.map((country: any) => (
                                            <SelectItem key={country.id} value={String(country.id)}>
                                                {country.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 md:col-span-1">
                                <Label htmlFor="externalPlatform" className="text-sm font-medium">Platform Source</Label>
                                <Input
                                    id="externalPlatform"
                                    placeholder="e.g. Google Form"
                                    className="h-11"
                                    {...register('externalPlatform')}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-1">
                                <Label htmlFor="registrationNotes" className="text-sm font-medium">Internal Notes</Label>
                                <Input
                                    id="registrationNotes"
                                    placeholder="Notes..."
                                    className="h-11"
                                    {...register('registrationNotes')}
                                />
                            </div>
                        </CardContent>
                    </Card>


                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <h3 className="text-amber-800 font-bold text-sm mb-1 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Important Customs Notice
                        </h3>
                        <p className="text-amber-700 text-xs leading-relaxed">
                            If you miss any declared equipment while leaving Ethiopia, you must obtain a verification letter from your hosting stakeholder and present it at the airport upon checkout. Failure to do so may result in customs delays or penalties.
                        </p>
                    </div>

                    {/* Dynamic Form Content */}
                    {selectedFormId && (
                        <div className="animate-in slide-in-from-top-4 duration-500 space-y-6">
                            {isLoadingForm ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    {fullForm?.categories?.map((category: any) => {
                                        // Check if category has any visible fields
                                        const visibleFields = category.fields?.filter((f: any) =>
                                            f.field_name !== 'has_drone' && f.field_name !== 'declaration_status'
                                        );

                                        if (!visibleFields || visibleFields.length === 0) return null;

                                        return (
                                            <Card key={category.category_id} className="border-none shadow-lg bg-white/50 backdrop-blur-md overflow-hidden ring-1 ring-gray-100">
                                                <CardHeader className="bg-gray-50/50 py-3 border-b flex flex-row items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                    <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider">{category.name}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                                                    {category.fields?.map((field: any) => renderField(field))}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}

                                    {fullForm?.uncategorizedFields?.length > 0 && (
                                        <Card className="border-none shadow-lg bg-white/50 backdrop-blur-md overflow-hidden ring-1 ring-gray-100">
                                            <CardHeader className="bg-gray-50/50 py-3 border-b flex flex-row items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                                <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider">General Information</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                                                {fullForm.uncategorizedFields.map((field: any) => renderField(field))}
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md overflow-hidden ring-1 ring-gray-200">
                                        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-gray-100 pb-4">
                                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                                <Radio className="h-5 w-5 text-primary" />
                                                Drone Equipment
                                            </CardTitle>
                                            <CardDescription>
                                                Will you be bringing drone equipment?
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Button
                                                    type="button"
                                                    variant={watch('has_drone' as any) ? "default" : "outline"}
                                                    className={`h-12 text-base font-semibold transition-all ${watch('has_drone' as any) ? "ring-2 ring-primary ring-offset-2" : ""}`}
                                                    onClick={() => {
                                                        setValue('has_drone' as any, true);
                                                        if (!equipments.some(e => e.isDrone)) addEquipment('drone', true);
                                                    }}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={watch('has_drone' as any) === false ? "default" : "outline"}
                                                    className={`h-12 text-base font-semibold transition-all ${watch('has_drone' as any) === false ? "ring-2 ring-primary ring-offset-2" : ""}`}
                                                    onClick={() => {
                                                        setValue('has_drone' as any, false);
                                                        setEquipments(equipments.filter(e => !e.isDrone));
                                                    }}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md overflow-hidden ring-1 ring-gray-200">
                                        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-gray-100 pb-4">
                                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                                <Camera className="h-5 w-5 text-primary" />
                                                Professional Media Equipment
                                            </CardTitle>
                                            <CardDescription>
                                                Are you bringing professional media equipment?
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Button
                                                    type="button"
                                                    variant={watch('declaration_status' as any) ? "default" : "outline"}
                                                    className={`h-12 text-base font-semibold transition-all ${watch('declaration_status' as any) ? "ring-2 ring-primary ring-offset-2" : ""}`}
                                                    onClick={() => setValue('declaration_status' as any, true)}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={watch('declaration_status' as any) === false ? "default" : "outline"}
                                                    className={`h-12 text-base font-semibold transition-all ${watch('declaration_status' as any) === false ? "ring-2 ring-primary ring-offset-2" : ""}`}
                                                    onClick={() => {
                                                        setValue('declaration_status' as any, false);
                                                        setEquipments(equipments.filter(e => e.isDrone));
                                                    }}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-lg bg-white/50 backdrop-blur-md overflow-hidden ring-1 ring-gray-100">
                                        <CardHeader className="bg-gray-50/50 py-3 border-b flex flex-row items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-5 w-5 text-primary" />
                                                <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider">Equipment Declaration</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            {/* Equipment Listing Section */}
                                            {(watch('declaration_status' as any) || watch('has_drone' as any)) && (
                                                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                                                    {equipments.map((item, index) => (
                                                        <div key={item.id} className="p-4 border border-gray-200 rounded-lg space-y-4 relative bg-white/50">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeEquipment(item.id)}
                                                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Category</Label>
                                                                    <Select
                                                                        value={item.type}
                                                                        onValueChange={(val) => {
                                                                            const wasDrone = item.isDrone || item.type === "drone";
                                                                            const isDrone = val === "drone";
                                                                            const updates: Partial<EquipmentItem> = { type: val, isDrone };
                                                                            if (val !== "cash") {
                                                                                updates.value = 0;
                                                                                updates.currency = "USD";
                                                                            } else {
                                                                                updates.quantity = 1;
                                                                                updates.description = "CASH";
                                                                            }
                                                                            updateEquipment(item.id, updates);

                                                                            if (isDrone) {
                                                                                setValue('has_drone' as any, true, { shouldValidate: true });
                                                                            } else if (wasDrone) {
                                                                                const anyDroneRemaining = equipments.some(eq => (eq.id !== item.id && eq.isDrone) || (eq.id === item.id && isDrone));
                                                                                if (!anyDroneRemaining) {
                                                                                    setValue('has_drone' as any, false, { shouldValidate: true });
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-11 bg-white border-gray-200">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {item.isDrone ? (
                                                                                <SelectItem value="drone">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Radio className="w-4 h-4" />
                                                                                        Drone
                                                                                    </div>
                                                                                </SelectItem>
                                                                            ) : (
                                                                                equipmentTypes.map((t) => (
                                                                                    <SelectItem key={t.value} value={t.value}>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <t.icon className="w-4 h-4" />
                                                                                            {t.label}
                                                                                        </div>
                                                                                    </SelectItem>
                                                                                ))
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                {item.type !== "cash" && (
                                                                    <div className="md:col-span-2 space-y-2">
                                                                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Description</Label>
                                                                        <Input
                                                                            value={item.description}
                                                                            onChange={(e) => updateEquipment(item.id, { description: e.target.value })}
                                                                            placeholder="e.g. Sony A7S III w/ 24-70mm Lens"
                                                                            className="h-11 bg-white border-gray-200"
                                                                        />
                                                                    </div>
                                                                )}

                                                                {item.type !== "cash" && (
                                                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Model</Label>
                                                                            <Input
                                                                                value={item.model || ""}
                                                                                onChange={(e) => updateEquipment(item.id, { model: e.target.value })}
                                                                                placeholder="e.g. EOS R5"
                                                                                className="h-11 bg-white border-gray-200"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Serial Number</Label>
                                                                            <Input
                                                                                value={item.serialNumber}
                                                                                onChange={(e) => updateEquipment(item.id, { serialNumber: e.target.value })}
                                                                                placeholder="S/N: 12345678"
                                                                                className="h-11 bg-white border-gray-200"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className={`grid grid-cols-1 ${item.type === 'cash' ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4 md:col-span-3`}>
                                                                    {item.type !== 'cash' && (
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Quantity</Label>
                                                                            <Input
                                                                                type="number"
                                                                                min="1"
                                                                                value={item.quantity}
                                                                                onChange={(e) => updateEquipment(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                                                                className="h-11 bg-white border-gray-200"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Value</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={item.value}
                                                                            onChange={(e) => updateEquipment(item.id, { value: parseFloat(e.target.value) || 0 })}
                                                                            className="h-11 bg-white border-gray-200"
                                                                        />
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Currency</Label>
                                                                        <Select
                                                                            value={item.currency}
                                                                            onValueChange={(val) => updateEquipment(item.id, { currency: val })}
                                                                        >
                                                                            <SelectTrigger className="h-11 bg-white border-gray-200">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                                                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                                                                <SelectItem value="ETB">ETB (Br)</SelectItem>
                                                                                <SelectItem value="JPY">JPY (¥)</SelectItem>
                                                                                <SelectItem value="CNY">CNY (¥)</SelectItem>
                                                                                <SelectItem value="CHF">CHF (Fr)</SelectItem>
                                                                                <SelectItem value="CAD">CAD ($)</SelectItem>
                                                                                <SelectItem value="AUD">AUD ($)</SelectItem>
                                                                                <SelectItem value="AED">AED (د.إ)</SelectItem>
                                                                                <SelectItem value="SAR">SAR (﷼)</SelectItem>
                                                                                <SelectItem value="ZAR">ZAR (R)</SelectItem>
                                                                                <SelectItem value="other">Other</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    {item.currency === "other" && (
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Specify Currency</Label>
                                                                            <Input
                                                                                value={item.otherCurrency || ""}
                                                                                onChange={(e) => updateEquipment(item.id, { otherCurrency: e.target.value })}
                                                                                placeholder="e.g. INR"
                                                                                className="h-11 bg-white border-gray-200"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={addEquipmentWithStatus}
                                                        className="w-full py-10 border-dashed border-2 border-gray-200 bg-gray-50/50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all rounded-2xl flex items-center justify-center gap-2 font-bold"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                        Add Item to Declaration
                                                    </Button>
                                                </div>
                                            )}

                                            {!(watch('declaration_status' as any) || watch('has_drone' as any)) && (
                                                <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                                                    <Package className="h-10 w-10 opacity-20" />
                                                    <p className="text-sm italic">Please select 'Yes' for equipment or drone to begin declaration.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                            disabled={isLoading}
                            className="px-8 h-12"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="px-8 h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                            disabled={isLoading || !isValid}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creating Entry...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-5 w-5" />
                                    Finalize Manual Entry
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
