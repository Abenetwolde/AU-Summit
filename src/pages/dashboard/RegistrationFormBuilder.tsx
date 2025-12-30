import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
    Plus,
    GripVertical,
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
    MessageSquare,
    ChevronDown,
    AlignLeft,
    Loader2,
    ChevronRight,
    ChevronLeft,
    X,
    FileText,
    Mail,
    Globe,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetFormFieldTemplatesQuery, useCreateFormMutation } from '@/store/services/api';

interface FormField {
    id: string;
    type: 'text' | 'number' | 'checkbox' | 'radio' | 'date' | 'file' | 'dropdown' | 'textarea' | 'boolean' | 'email';
    label: string;
    placeholder?: string;
    required: boolean;
    helpText?: string;
    options?: string[];
    templateId?: number;
    validation?: any;
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

export function RegistrationFormBuilder() {
    const { data: templates, isLoading: isLoadingTemplates } = useGetFormFieldTemplatesQuery();
    const [createForm, { isLoading: isSaving }] = useCreateFormMutation();

    const [fields, setFields] = useState<FormField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewStep, setPreviewStep] = useState(1);
    const [formName, setFormName] = useState("Press Accreditation Application");
    const [formDescription, setFormDescription] = useState("Standard application form for press accreditation including personal details, travel information, and equipment declarations.");

    // Populate fields
    useEffect(() => {
        if (templates) {
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
                    } catch (e) {
                        // ignore
                    }
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
                    validation: t.validation_criteria ? (typeof t.validation_criteria === 'string' ? JSON.parse(t.validation_criteria) : t.validation_criteria) : null,
                    displayOrder: t.display_order,
                    fieldName: t.field_name
                };
            }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

            setFields(mappedFields);
        }
    }, [templates]);

    const addField = (type: FormField['type']) => {
        const timestamp = Date.now();
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
            options: ['checkbox', 'radio', 'dropdown'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : undefined
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
                // Here we'll just update the fieldName if the label changes and the previous fieldName matched the previous label
                // But simplified: Just let user edit manually for now, or auto-update only on creation logic. 
                // The user asked "key same as label with underscore". 
                // Let's force update the key if the label changes, unless that's annoying. 
                // Better approach: When label changes, if the current fieldName looks like a snake_case version of the OLD label, update it.
                // For simplicity/robustness based on request:
                if (updates.label) {
                    updated.fieldName = updates.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                }
                return updated;
            }
            return f;
        }));
    };

    const handleSave = async () => {
        // Construct Payload
        const payload = {
            name: formName,
            description: formDescription,
            status: "PUBLISHED",
            type: "ACCREDITATION",
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

        console.log("Creating Form Payload:", JSON.stringify(payload, null, 2));

        try {
            await createForm(payload).unwrap();
            toast.success("Form published successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to publish form");
        }
    };

    // Preview Pagination Logic
    const FIELDS_PER_PAGE = 5;
    const totalPages = Math.ceil(fields.length / FIELDS_PER_PAGE);
    const currentPreviewFields = fields.slice((previewStep - 1) * FIELDS_PER_PAGE, previewStep * FIELDS_PER_PAGE);

    const selectedField = fields.find(f => f.id === selectedFieldId);

    if (isLoadingTemplates) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-4 p-4 bg-gray-50/50">
            {/* Left Sidebar - Tools */}
            <div className="w-full lg:w-64 h-auto lg:h-full flex-shrink-0">
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
            <div className="flex-1 min-w-0 h-full">
                <Card className="h-full border-none shadow-md overflow-hidden flex flex-col bg-white">
                    <CardHeader className="border-b bg-white z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="text-xl font-bold font-sans bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 w-full hover:bg-gray-100/50 rounded transition-colors"
                                />
                            </div>
                            <Input
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                className="text-sm text-gray-500 bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 w-full hover:bg-gray-100/50 rounded transition-colors"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none" onClick={() => { setPreviewStep(1); setPreviewOpen(true); }}>
                                <Eye className="h-4 w-4" /> Preview
                            </Button>
                            <Button size="sm" className="bg-black hover:bg-gray-800 text-white gap-2 flex-1 sm:flex-none" onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4" /> Publish Form
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 bg-gray-50/30 overflow-hidden">
                        <ScrollArea className="h-full p-4 lg:p-8">
                            <div className="max-w-3xl mx-auto space-y-4 pb-20">
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        onClick={() => setSelectedFieldId(field.id)}
                                        className={cn(
                                            "group relative bg-white p-6 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                                            selectedFieldId === field.id
                                                ? "border-blue-500 ring-2 ring-blue-50 shadow-md"
                                                : "border-gray-200"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
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
                                ))}
                            </div>
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
                                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                            {FIELD_TYPES.find(ft => ft.type === selectedField.type)?.icon ?
                                                (() => {
                                                    const Icon = FIELD_TYPES.find(ft => ft.type === selectedField.type)!.icon;
                                                    return <Icon className="h-4 w-4" />;
                                                })() : <Type className="h-4 w-4" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Field Type</p>
                                            <p className="text-sm font-bold text-slate-900 capitalize">{selectedField.type}</p>
                                        </div>
                                    </div>
                                    {selectedField.templateId && (
                                        <div className="px-2 py-0.5 bg-blue-600 text-[9px] font-black text-white rounded uppercase italic tracking-widest">Fixed</div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-600 uppercase">Label</label>
                                    <Input
                                        value={selectedField.label}
                                        onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-600 uppercase">Input ID / Key</label>
                                    <Input
                                        value={selectedField.fieldName || ''}
                                        onChange={(e) => updateField(selectedField.id, { fieldName: e.target.value })}
                                        className="font-mono text-xs"
                                    />
                                </div>
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                        <div className="space-y-0.5">
                                            <label className="text-sm font-bold text-gray-700">Required</label>
                                            <p className="text-[10px] text-gray-400 font-medium">Mandatory for users</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={selectedField.required}
                                            onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-600 uppercase">Placeholder</Label>
                                        <Input
                                            placeholder="Enter placeholder text..."
                                            value={selectedField.placeholder || ''}
                                            onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-600 uppercase">Help Text</Label>
                                        <Textarea
                                            placeholder="Instruction for the user..."
                                            className="min-h-[60px] text-sm"
                                            value={selectedField.helpText || ''}
                                            onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
                                        />
                                    </div>

                                    {['radio', 'checkbox', 'dropdown'].includes(selectedField.type) && (
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-bold text-gray-600 uppercase">Options</Label>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-[10px] text-blue-600 font-bold hover:bg-blue-50"
                                                    onClick={() => {
                                                        const current = selectedField.options || [];
                                                        updateField(selectedField.id, { options: [...current, `Option ${current.length + 1}`] });
                                                    }}
                                                >
                                                    Add Option
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                {(selectedField.options || []).map((opt, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <Input
                                                            value={opt}
                                                            className="h-8 text-sm"
                                                            onChange={(e) => {
                                                                const newOpts = [...(selectedField.options || [])];
                                                                newOpts[i] = e.target.value;
                                                                updateField(selectedField.id, { options: newOpts });
                                                            }}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                const newOpts = (selectedField.options || []).filter((_, idx) => idx !== i);
                                                                updateField(selectedField.id, { options: newOpts });
                                                            }}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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
                <DialogContent className="max-w-[100vw] w-screen h-screen flex flex-col p-0 gap-0 overflow-hidden bg-[#F8F9FB] sm:rounded-none border-none">
                    <DialogHeader className="p-4 px-6 border-b bg-white flex-shrink-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] z-[60]">
                        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold text-slate-800">Form Live Preview</DialogTitle>
                                    <DialogDescription className="text-xs font-semibold text-slate-400">Experience the portal as a user would</DialogDescription>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl hover:bg-slate-100" onClick={() => setPreviewOpen(false)}>
                                    <X className="h-5 w-5 text-slate-500" />
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Preview Content Area */}
                    <div className="flex-1 overflow-auto bg-[#F8F9FB] p-6 md:p-12 lg:p-20 flex justify-center items-start">
                        <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col relative w-full max-w-2xl rounded-[2.5rem] border border-slate-200/60 overflow-hidden min-h-[70vh]">

                            <div className="flex-1 flex flex-col h-full rounded-[inherit]">
                                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                    <div className="p-8 pb-4 shrink-0">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="h-10 w-32 bg-slate-100 rounded-lg animate-pulse" />
                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 uppercase tracking-wider">
                                                <ShieldCheck className="h-3 w-3" />
                                                Secure Portal
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-center max-w-2xl mx-auto">
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{formName}</h2>
                                            <p className="text-sm text-slate-500 font-medium">{formDescription}</p>
                                        </div>
                                    </div>

                                    <ScrollArea className="flex-1 px-8 py-4">
                                        <div className="space-y-8 max-w-2xl pb-10">
                                            {currentPreviewFields.map((field) => (
                                                <div key={field.id} className="space-y-2.5 group animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[13px] font-bold text-slate-700 tracking-tight flex items-center gap-1.5">
                                                            {field.label}
                                                            {field.required && <span className="h-1 w-1 rounded-full bg-red-500" title="Required" />}
                                                        </label>
                                                        {field.templateId && <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded italic">EMA Core</span>}
                                                    </div>

                                                    <div className="relative">
                                                        {field.type === 'textarea' ? (
                                                            <textarea
                                                                className="flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none placeholder:text-slate-300"
                                                                placeholder={field.placeholder || "Describe here..."}
                                                            />
                                                        ) : field.type === 'radio' || field.type === 'checkbox' || field.type === 'dropdown' ? (
                                                            <div className={cn(
                                                                "grid gap-3 transition-all",
                                                                field.type === 'dropdown' ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                                                            )}>
                                                                {field.type === 'dropdown' ? (
                                                                    <div className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 flex items-center justify-between text-sm text-slate-400 group-hover:border-slate-300 cursor-pointer transition-all">
                                                                        <span>{field.placeholder || "Please select an option..."}</span>
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    </div>
                                                                ) : (
                                                                    (field.options || ['Option 1', 'Option 2']).map(opt => (
                                                                        <label key={opt} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/30 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all group/opt relative overflow-hidden">
                                                                            <div className={cn(
                                                                                "h-5 w-5 border-2 flex items-center justify-center transition-all",
                                                                                field.type === 'radio' ? "rounded-full" : "rounded-md",
                                                                                "border-slate-300 group-hover/opt:border-blue-400"
                                                                            )}>
                                                                                <div className={cn("h-2.5 w-2.5 bg-blue-600 transition-all scale-0", field.type === 'radio' ? "rounded-full" : "rounded-[2px]")} />
                                                                            </div>
                                                                            <span className="text-sm font-bold text-slate-600 group-hover/opt:text-blue-700 transition-all">{opt}</span>
                                                                        </label>
                                                                    ))
                                                                )}
                                                            </div>
                                                        ) : field.type === 'file' ? (
                                                            <div className="group/file relative h-40 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center transition-all hover:bg-blue-50/30 hover:border-blue-300">
                                                                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover/file:scale-110 transition-transform">
                                                                    <Upload className="h-6 w-6 text-blue-500" />
                                                                </div>
                                                                <p className="text-sm font-bold text-slate-700">Drop your file here</p>
                                                                <p className="text-[11px] text-slate-400 font-medium mt-1">Maximum size 10MB (PDF, JPG, PNG)</p>
                                                            </div>
                                                        ) : (
                                                            <div className="relative group/input">
                                                                <Input
                                                                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                                                                    type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                                                                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300"
                                                                />
                                                                {field.type === 'email' && <Mail className="h-4 w-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover/input:text-blue-300 transition-colors" />}
                                                                {field.type === 'date' && <Calendar className="h-4 w-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover/input:text-blue-300 transition-colors" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {field.helpText && (
                                                        <div className="flex items-start gap-2 px-1">
                                                            <MessageSquare className="h-3 w-3 text-slate-300 mt-0.5" />
                                                            <p className="text-[11px] text-slate-400 font-bold leading-tight">{field.helpText}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    {/* Footer / Navigation */}
                                    <div className="p-8 border-t bg-slate-50/50 flex items-center justify-between">
                                        <Button
                                            variant="ghost"
                                            className="h-12 px-6 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl gap-2 transition-all"
                                            onClick={() => setPreviewStep(Math.max(1, previewStep - 1))}
                                            disabled={previewStep === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" /> Back
                                        </Button>

                                        <div className="flex items-center gap-1.5">
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <div key={i} className={cn(
                                                    "h-1.5 rounded-full transition-all duration-300",
                                                    previewStep === i + 1 ? "w-8 bg-blue-600" : "w-1.5 bg-slate-200"
                                                )} />
                                            ))}
                                        </div>

                                        <Button
                                            className="h-12 px-8 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 rounded-xl gap-2 transition-all hover:scale-[1.02] active:scale-95"
                                            onClick={() => {
                                                if (previewStep < totalPages) setPreviewStep(previewStep + 1);
                                                else toast.success("Form response validated successfully");
                                            }}
                                        >
                                            {previewStep === totalPages ? 'Submit Application' : 'Continue'} <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
