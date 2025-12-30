import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    Monitor,
    Smartphone,
    Tablet,
    X
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
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

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
            name: "Press Accreditation Application",
            description: "Standard application form for press accreditation including personal details, travel information, and equipment declarations.",
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
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)] gap-4 p-4 bg-gray-50/50">
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
            <div className="flex-1 min-w-0">
                <Card className="min-h-full border-none shadow-md overflow-hidden flex flex-col bg-white">
                    <CardHeader className="border-b bg-white z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
                        <div>
                            <CardTitle className="text-xl font-bold font-sans">Accreditation Form</CardTitle>
                            <CardDescription>{fields.length} fields configured</CardDescription>
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
                                <div className="space-y-2">
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
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <label className="text-sm font-bold text-gray-700">Required</label>
                                    <input
                                        type="checkbox"
                                        checked={selectedField.required}
                                        onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
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
                                <Button size="icon" variant={previewDevice === 'desktop' ? 'white' : 'ghost'} className="h-8 w-8" onClick={() => setPreviewDevice('desktop')}><Monitor className="h-4 w-4" /></Button>
                                <Button size="icon" variant={previewDevice === 'tablet' ? 'white' : 'ghost'} className="h-8 w-8" onClick={() => setPreviewDevice('tablet')}><Tablet className="h-4 w-4" /></Button>
                                <Button size="icon" variant={previewDevice === 'mobile' ? 'white' : 'ghost'} className="h-8 w-8" onClick={() => setPreviewDevice('mobile')}><Smartphone className="h-4 w-4" /></Button>
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
                                <h1 className="text-2xl font-bold">Press Accreditation</h1>
                                <p className="opacity-90 mt-1">Please fill in your details below.</p>
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
