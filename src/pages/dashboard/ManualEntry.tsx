import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    CheckCircle2
} from 'lucide-react';

import {
    useCreateManualApplicationMutation,
    useGetFormsQuery,
    useGetCountriesQuery,
    useGetFormByIdQuery
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
});

type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

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
    const [createManualApplication, { isLoading }] = useCreateManualApplicationMutation();
    const { data: formsData, isLoading: isLoadingForms } = useGetFormsQuery();
    const { data: countries, isLoading: isLoadingCountries } = useGetCountriesQuery();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ManualEntryFormValues>({
        resolver: zodResolver(manualEntrySchema),
        defaultValues: {
            externalPlatform: 'Manual Entry',
        }
    });

    const selectedFormId = watch('formId');
    const { data: fullForm, isLoading: isLoadingForm } = useGetFormByIdQuery(selectedFormId || '', { skip: !selectedFormId });

    // State for dynamic fields
    const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
    const [files, setFiles] = useState<Record<string, File[]>>({});

    // State for equipment
    const [equipments, setEquipments] = useState<EquipmentItem[]>([]);

    const handleDynamicChange = (name: string, value: any) => {
        setDynamicValues(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (name: string, fileList: FileList | null) => {
        if (fileList) {
            setFiles(prev => ({ ...prev, [name]: Array.from(fileList) }));
        }
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
                handleDynamicChange('has_drone', false);
            }
        }
    };

    const updateEquipment = (id: string, updates: Partial<EquipmentItem>) => {
        setEquipments(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    const addEquipmentWithStatus = () => {
        if (!dynamicValues.declaration_status) {
            handleDynamicChange('declaration_status', true);
        }
        addEquipment();
    };

    const addDroneWithStatus = () => {
        if (!dynamicValues.has_drone) {
            handleDynamicChange('has_drone', true);
            addEquipment('drone', true);
        }
    };

    const onSubmit = async (values: ManualEntryFormValues) => {
        try {
            const formData = new FormData();
            formData.append('fullName', values.fullName);
            formData.append('email', values.email);
            formData.append('formId', values.formId);
            if (values.applyingFromCountryId) formData.append('applyingFromCountryId', values.applyingFromCountryId);
            if (values.externalPlatform) formData.append('externalPlatform', values.externalPlatform);

            const formContent = {
                ...dynamicValues,
                registration_notes: values.registrationNotes,
                manually_added: true,
                added_at: new Date().toISOString(),
            };

            formData.append('form_data', JSON.stringify(formContent));
            formData.append('equipments', JSON.stringify(equipments.map(({ id, ...rest }) => rest)));

            // Append files
            Object.entries(files).forEach(([fieldName, fileArray]) => {
                fileArray.forEach(file => {
                    formData.append(fieldName, file);
                });
            });

            await createManualApplication(formData).unwrap();
            toast.success('Manual client entry successful!');
            navigate('/dashboard/journalists');
        } catch (err: any) {
            console.error('Manual entry failed:', err);
            toast.error(err.data?.message || err.message || 'Failed to create manual entry');
        }
    };

    const renderField = (field: any) => {
        const { field_name, label, field_type, is_required, field_options } = field;
        const value = dynamicValues[field_name] || '';

        switch (field_type) {
            case 'textarea':
                return (
                    <div key={field_name} className="space-y-2 col-span-2">
                        <Label className="text-sm font-medium">{label} {is_required && '*'}</Label>
                        <Textarea
                            placeholder={`Enter ${label.toLowerCase()}...`}
                            value={value}
                            onChange={(e) => handleDynamicChange(field_name, e.target.value)}
                            rows={field_options?.rows || 2}
                            className="resize-none"
                        />
                    </div>
                );
            case 'select':
                return (
                    <div key={field_name} className="space-y-2">
                        <Label className="text-sm font-medium">{label} {is_required && '*'}</Label>
                        <Select
                            value={value}
                            onValueChange={(val) => handleDynamicChange(field_name, val)}
                        >
                            <SelectTrigger>
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
                    </div>
                );
            case 'date':
                return (
                    <div key={field_name} className="space-y-2">
                        <Label className="text-sm font-medium">{label} {is_required && '*'}</Label>
                        <Input
                            type="date"
                            value={value}
                            onChange={(e) => handleDynamicChange(field_name, e.target.value)}
                        />
                    </div>
                );
            case 'boolean':
            case 'checkbox':
                return (
                    <div key={field_name} className="flex items-center gap-3 pt-6">
                        <input
                            type="checkbox"
                            id={field_name}
                            checked={!!value}
                            onChange={(e) => handleDynamicChange(field_name, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                        <Label htmlFor={field_name} className="text-sm font-medium cursor-pointer">{label} {is_required && '*'}</Label>
                    </div>
                );
            case 'file':
                return (
                    <div key={field_name} className="space-y-2">
                        <Label className="text-sm font-medium">{label} {is_required && '*'}</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                multiple
                                onChange={(e) => handleFileChange(field_name, e.target.files)}
                                className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </div>
                        {files[field_name] && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {files[field_name].map((file, i) => (
                                    <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1">
                                        <FileText className="h-3 w-3" /> {file.name}
                                    </span>
                                ))}
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
                            value={value}
                            onChange={(e) => handleDynamicChange(field_name, e.target.value)}
                        />
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
                                        {...register('fullName')}
                                    />
                                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                </div>
                                {errors.fullName && (
                                    <p className="text-xs text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> {errors.fullName.message}
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
                                        {...register('email')}
                                    />
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> {errors.email.message}
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
                                    onValueChange={(val) => setValue('formId', val)}
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
                                {errors.formId && (
                                    <p className="text-xs text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> {errors.formId.message}
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

                            <div className="space-y-4 md:col-span-2">
                                <Label className="text-sm font-semibold text-gray-700">Are you bringing professional media equipment? *</Label>
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant={dynamicValues.declaration_status === false ? "default" : "outline"}
                                        onClick={() => {
                                            handleDynamicChange('declaration_status', false);
                                            if (!dynamicValues.has_drone) {
                                                setEquipments([]);
                                            } else {
                                                setEquipments(prev => prev.filter(eq => eq.isDrone || eq.type === 'drone'));
                                            }
                                        }}
                                        className={dynamicValues.declaration_status === false ? "bg-gray-800 text-white" : ""}
                                    >
                                        No
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={dynamicValues.declaration_status === true ? "default" : "outline"}
                                        onClick={() => handleDynamicChange('declaration_status', true)}
                                        className={dynamicValues.declaration_status === true ? "bg-gray-800 text-white" : ""}
                                    >
                                        Yes
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4 md:col-span-2">
                                <Label className="text-sm font-semibold text-gray-700">Will you bring drone equipment? *</Label>
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant={dynamicValues.has_drone === false ? "default" : "outline"}
                                        onClick={() => {
                                            handleDynamicChange('has_drone', false);
                                            setEquipments(prev => prev.filter(eq => !eq.isDrone && eq.type !== 'drone'));
                                        }}
                                        className={dynamicValues.has_drone === false ? "bg-gray-800 text-white" : ""}
                                    >
                                        No
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={dynamicValues.has_drone === true ? "default" : "outline"}
                                        onClick={() => {
                                            if (dynamicValues.has_drone) return;
                                            handleDynamicChange('has_drone', true);
                                            addEquipment('drone', true);
                                        }}
                                        className={dynamicValues.has_drone === true ? "bg-gray-800 text-white" : ""}
                                    >
                                        Yes
                                    </Button>
                                </div>
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
                                    {fullForm?.categories?.map((category: any) => (
                                        <Card key={category.category_id} className="border-none shadow-lg bg-white/50 backdrop-blur-md overflow-hidden ring-1 ring-gray-100">
                                            <CardHeader className="bg-gray-50/50 py-3 border-b flex flex-row items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                                <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider">{category.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                                                {category.fields?.map((field: any) => renderField(field))}
                                            </CardContent>
                                        </Card>
                                    ))}

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

                                    <Card className="border-none shadow-lg bg-white/50 backdrop-blur-md overflow-hidden ring-1 ring-gray-100">
                                        <CardHeader className="bg-gray-50/50 py-3 border-b flex flex-row items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-5 w-5 text-primary" />
                                                <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider">Equipment Declaration</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            {(dynamicValues.declaration_status || dynamicValues.has_drone) ? (
                                                <div className="space-y-6">
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
                                                                                handleDynamicChange('has_drone', true);
                                                                            } else if (wasDrone) {
                                                                                const anyDroneRemaining = equipments.some(eq => (eq.id !== item.id && eq.isDrone) || (eq.id === item.id && isDrone));
                                                                                if (!anyDroneRemaining) {
                                                                                    handleDynamicChange('has_drone', false);
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
                                            ) : (
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
                            disabled={isLoading}
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
