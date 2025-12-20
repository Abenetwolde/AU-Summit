import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormField {
    id: string;
    type: 'text' | 'number' | 'checkbox' | 'radio' | 'date' | 'file' | 'dropdown';
    label: string;
    placeholder?: string;
    required: boolean;
    helpText?: string;
    options?: string[]; // For radio/checkbox
}

const FIELD_TYPES = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'radio', label: 'Radio Group', icon: CircleDot },
    { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
    { type: 'date', label: 'Date Picker', icon: Calendar },
    { type: 'file', label: 'File Upload', icon: Upload },
] as const;

export function RegistrationFormBuilder() {
    const [fields, setFields] = useState<FormField[]>([
        { id: '1', type: 'text', label: 'Full Name', placeholder: 'Enter full name here...', required: true },
        { id: '2', type: 'radio', label: 'Gender', options: ['Male', 'Female'], required: true },
    ]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>('1');

    const addField = (type: FormField['type']) => {
        const newField: FormField = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            label: `New ${type} field`,
            required: false,
        };
        setFields([...fields, newField]);
        setSelectedFieldId(newField.id);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const selectedField = fields.find(f => f.id === selectedFieldId);

    return (
        <div className="flex h-[calc(100vh-160px)] gap-6 bg-gray-50/50 p-1">
            {/* Left Sidebar - Field Types */}
            <div className="w-64 space-y-4">
                <Card className="border-none shadow-sm h-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Add Fields</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                        {FIELD_TYPES.map((ft) => (
                            <Button
                                key={ft.type}
                                variant="outline"
                                className="flex flex-col h-20 gap-2 text-xs border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50"
                                onClick={() => addField(ft.type)}
                            >
                                <ft.icon className="h-5 w-5" />
                                {ft.label}
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Center Area - Form Preview */}
            <div className="flex-1 min-w-0">
                <Card className="h-full border-none shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex flex-row items-center justify-between py-4">
                        <div>
                            <CardTitle className="text-lg">Registration Form Preview</CardTitle>
                            <CardDescription>Drag and drop fields to reorder</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" /> Preview
                            </Button>
                            <Button size="sm" className="bg-[#009b4d] hover:bg-[#007a3d] gap-2">
                                <Save className="h-4 w-4" /> Save Changes
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 overflow-y-auto bg-gray-50/30">
                        <div className="max-w-2xl mx-auto space-y-4">
                            {fields.map((field) => (
                                <div
                                    key={field.id}
                                    onClick={() => setSelectedFieldId(field.id)}
                                    className={cn(
                                        "group relative bg-white p-6 rounded-xl border-2 transition-all cursor-pointer",
                                        selectedFieldId === field.id
                                            ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
                                            : "border-transparent hover:border-gray-200 shadow-sm"
                                    )}
                                >
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-900">{field.label}</span>
                                            {field.required && <span className="text-red-500">*</span>}
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                            {field.type}
                                        </span>
                                    </div>

                                    {/* Mock Inputs */}
                                    <div className="pointer-events-none opacity-60">
                                        {field.type === 'text' && <div className="h-10 w-full bg-gray-50 border rounded-md px-3 flex items-center text-sm text-gray-400">{field.placeholder || "Enter text..."}</div>}
                                        {field.type === 'number' && <div className="h-10 w-full bg-gray-50 border rounded-md px-3 flex items-center text-sm text-gray-400">0</div>}
                                        {field.type === 'date' && <div className="h-10 w-full bg-gray-50 border rounded-md px-3 flex items-center text-sm text-gray-400">DD/MM/YYYY</div>}
                                        {field.type === 'file' && (
                                            <div className="h-24 w-full bg-gray-50 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400">
                                                <Upload className="h-6 w-6 mb-2" />
                                                <span className="text-xs">Click to upload or drag and drop</span>
                                            </div>
                                        )}
                                        {field.type === 'radio' && (
                                            <div className="flex gap-4">
                                                {field.options?.map(opt => (
                                                    <div key={opt} className="flex items-center gap-2">
                                                        <div className="h-4 w-4 rounded-full border" />
                                                        <span className="text-sm">{opt}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {field.type === 'checkbox' && (
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 rounded border" />
                                                <span className="text-sm">{field.label}</span>
                                            </div>
                                        )}
                                        {field.type === 'dropdown' && (
                                            <div className="h-10 w-full bg-gray-50 border rounded-md px-3 flex items-center justify-between text-sm text-gray-400">
                                                <span>{field.placeholder || "Select an option..."}</span>
                                                <ChevronDown className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>

                                    {field.helpText && <p className="mt-2 text-xs text-gray-500 italic flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {field.helpText}</p>}
                                </div>
                            ))}
                            {fields.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed rounded-xl text-gray-400">
                                    No fields added yet. Choose a field type from the left to start building your form.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Sidebar - Properties */}
            <div className="w-80">
                <Card className="h-full border-none shadow-sm flex flex-col">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <Settings2 className="h-4 w-4" /> Field Properties
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 overflow-y-auto">
                        {selectedField ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-600 uppercase">Field Label</label>
                                    <Input
                                        value={selectedField.label}
                                        onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                    />
                                </div>

                                {['text', 'number', 'date', 'file'].includes(selectedField.type) && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-600 uppercase">Placeholder</label>
                                        <Input
                                            value={selectedField.placeholder || ''}
                                            onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-600 uppercase">Helper Text</label>
                                    <Input
                                        value={selectedField.helpText || ''}
                                        onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <label className="text-sm font-bold text-gray-700">Required Field</label>
                                    <input
                                        type="checkbox"
                                        checked={selectedField.required}
                                        onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </div>

                                {['radio', 'dropdown'].includes(selectedField.type) && (
                                    <div className="space-y-3 pt-4 border-t border-dashed">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Options</label>
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">{selectedField.type} mode</span>
                                        </div>
                                        <div className="space-y-2">
                                            {(selectedField.options || []).map((opt, idx) => (
                                                <div key={idx} className="flex gap-2 group">
                                                    <div className="relative flex-1">
                                                        <Input
                                                            value={opt}
                                                            className="pr-8 h-10 border-gray-200 focus:border-blue-400"
                                                            onChange={(e) => {
                                                                const newOpts = [...(selectedField.options || [])];
                                                                newOpts[idx] = e.target.value;
                                                                updateField(selectedField.id, { options: newOpts });
                                                            }}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="shrink-0 h-10 w-10 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => {
                                                            const newOpts = selectedField.options?.filter((_, i) => i !== idx);
                                                            updateField(selectedField.id, { options: newOpts });
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full gap-2 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 h-10"
                                            onClick={() => {
                                                const newOpts = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
                                                updateField(selectedField.id, { options: newOpts });
                                            }}
                                        >
                                            <Plus className="h-4 w-4" /> Add Option
                                        </Button>
                                    </div>
                                )}

                                <div className="pt-6 border-t">
                                    <Button
                                        variant="ghost"
                                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                                        onClick={() => removeField(selectedField.id)}
                                    >
                                        <Trash2 className="h-4 w-4" /> Remove Field
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                                <Settings2 className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-sm">Select a field in the preview area to edit its properties.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
