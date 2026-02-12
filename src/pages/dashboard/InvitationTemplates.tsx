import { useState } from 'react';
import { sanitizeHTML } from '@/utils/sanitization';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Eye,
    Palette,
    FileText,
    Settings2,
    Save,
    Trash2,
    X,
    Mail,
    Image as ImageIcon,
    Type,
} from 'lucide-react';
import {
    useGetInvitationTemplatesQuery,
    useUpdateInvitationTemplateMutation,
    useDeleteInvitationTemplateMutation,
    useCreateInvitationTemplateMutation,
} from '@/store/services/api';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Helper to replace template variables for preview
const interpolateTemplate = (content: string, variables: Record<string, string>) => {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value);
    });
    return result;
};

const MOCK_VARS = {
    userName: "JOHN DOE",
    organization: "AFRICAN UNION",
    eventTitle: "38th AU Summit",
    eventDate: "Feb 15-16, 2025",
    venue: "Addis Ababa, Ethiopia",
    referenceNumber: "INV-2025-0812",
};

const DEFAULT_STYLES = `
.letter-container {
    padding: 0.5in;
    font-family: 'Times New Roman', Times, serif;
    line-height: 1.6;
    color: #000;
    height: 100%;
    display: flex;
    flex-direction: column;
}
.logo-container {
    text-align: center;
    margin-bottom: 2.5rem;
}
.logo-img {
    max-height: 80px;
    width: auto;
}
.letter-body {
    text-align: justify;
    margin-bottom: 2rem;
    white-space: pre-wrap;
    flex-grow: 1;
}
.reference-box {
    margin-top: auto;
    padding: 1.5rem;
    background: #f8fafc;
    border-left: 4px solid #007a3d;
    font-size: 0.9rem;
}
`;

const constructHtml = (logoUrl: string, content: string) => `
<div class="letter-container">
    <div class="logo-container">
        <img src="${logoUrl || 'https://via.placeholder.com/150?text=Logo'}" alt="Logo" class="logo-img" />
    </div>
    <div class="letter-body">
${content}
    </div>
    <div class="reference-box">
        <p><strong>Reference Number:</strong> {{referenceNumber}}</p>
    </div>
</div>
`;

// Helper to extract clean text content and logo from stored HTML
const deconstructHtml = (html: string) => {
    // 1. Extract Logo
    const logoMatch = html.match(/<img[^>]+src="([^">]+)"/);

    // 2. Extract Body Content
    const bodyMatch = html.match(/<div class="letter-body">([\s\S]*?)<\/div>/);
    let content = bodyMatch ? bodyMatch[1].trim() : (html || ''); // Fallback to full HTML if structure is missing

    // 3. Strip all HTML tags but attempt to preserve line breaks
    content = content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '') // Strip remaining tags
        .replace(/&nbsp;/g, ' ')
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Consolidate multiple newlines
        .trim();

    return {
        logoUrl: logoMatch ? logoMatch[1] : '',
        content: content,
    };
};

export function InvitationTemplates() {
    const { data: templates, isLoading } = useGetInvitationTemplatesQuery();
    const [updateTemplate] = useUpdateInvitationTemplateMutation();
    const [createTemplate] = useCreateInvitationTemplateMutation();
    const [deleteTemplate] = useDeleteInvitationTemplateMutation();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        logoUrl: '',
        content: `Ref: {{referenceNumber}}\nDate: ${new Date().toLocaleDateString()}\n\nTO: {{userName}}\nTITLE: DELEGATE\nORGANIZATION: {{organization}}\n\nSUBJECT: OFFICIAL INVITATION FOR THE {{eventTitle}}\n\nDear {{userName}},\n\nOn behalf of the {{organization}}, we are pleased to formally invite you to participate in the {{eventTitle}}, which will be held from February 15-16, 2025, in {{venue}}.\n\nYour participation as a representative of {{organization}} is highly valued. This event serves as a critical platform for strategic dialogue and cooperation across the continent. We are confident that your expertise will contribute significantly to the success of this summit.\n\nAll necessary arrangements for your accreditation and access to the venue are being processed. Please ensure that you carry a printed copy of this letter along with your travel documents for verification at the immigration desk.\n\nWe look forward to welcoming you to the {{eventTitle}}.\n\nSincerely,\n\n[Signature Space]\n\nEMA Accreditation Team\nAfrican Union Headquarters`,
    });

    const [editStates, setEditStates] = useState<Record<number, { logoUrl: string; content: string; name: string; description: string }>>({});
    const [previewTemplate, setPreviewTemplate] = useState<{ logoUrl: string; content: string } | null>(null);

    const handleSave = async (id: number) => {
        const state = editStates[id];
        if (!state) return;
        try {
            await updateTemplate({
                id,
                data: {
                    name: state.name,
                    description: state.description,
                    htmlContent: constructHtml(state.logoUrl, state.content),
                    cssStyles: DEFAULT_STYLES,
                }
            }).unwrap();
            toast.success("Template updated");
        } catch (err) {
            toast.error("Failed to save template");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            await deleteTemplate(id).unwrap();
            toast.success("Template deleted");
        } catch (err) {
            toast.error("Failed to delete template");
        }
    };

    const handleCreate = async () => {
        try {
            await createTemplate({
                name: newTemplate.name,
                description: newTemplate.description,
                htmlContent: constructHtml(newTemplate.logoUrl, newTemplate.content),
                cssStyles: DEFAULT_STYLES,
                dynamicVariables: ['userName', 'eventTitle', 'organization', 'referenceNumber', 'eventDate', 'venue'],
            }).unwrap();
            toast.success("Invitation template created");
            setIsAddOpen(false);
            setNewTemplate({
                name: '',
                description: '',
                logoUrl: '',
                content: `Ref: {{referenceNumber}}\nDate: ${new Date().toLocaleDateString()}\n\nTO: {{userName}}\nTITLE: DELEGATE\nORGANIZATION: {{organization}}\n\nSUBJECT: OFFICIAL INVITATION FOR THE {{eventTitle}}\n\nDear {{userName}},\n\nOn behalf of the {{organization}}, we are pleased to formally invite you to participate in the {{eventTitle}}, which will be held from February 15-16, 2025, in {{venue}}.\n\nYour participation as a representative of {{organization}} is highly valued. This event serves as a critical platform for strategic dialogue and cooperation across the continent. We are confident that your expertise will contribute significantly to the success of this summit.\n\nAll necessary arrangements for your accreditation and access to the venue are being processed. Please ensure that you carry a printed copy of this letter along with your travel documents for verification at the immigration desk.\n\nWe look forward to welcoming you to the {{eventTitle}}.\n\nSincerely,\n\n[Signature Space]\n\nEMA Accreditation Team\nAfrican Union Headquarters`,
            });
        } catch (err) {
            toast.error("Failed to create template");
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-64">Loading templates...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Invitation Templates</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage official invitation letters for approved applicants</p>
                </div>
                <div className="flex gap-3">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-md">
                                <Plus className="h-4 w-4" />
                                New Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create Invitation Template</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Template Name</Label>
                                        <Input value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="e.g. AU Summit Official Letter" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Logo URL</Label>
                                        <Input value={newTemplate.logoUrl} onChange={e => setNewTemplate({ ...newTemplate, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input value={newTemplate.description} onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })} placeholder="Brief purpose of this template" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Letter Content</Label>
                                    <p className="text-[10px] text-gray-500 mb-1 italic">Use variables like {'{{userName}}'}, {'{{eventTitle}}'}, etc.</p>
                                    <Textarea className="min-h-[200px]" value={newTemplate.content} onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })} />
                                </div>
                                <Button onClick={handleCreate} className="w-full bg-blue-600">Create Template</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
                <DialogContent className="max-w-[900px] h-[95vh] overflow-y-auto bg-slate-100 p-0 border-none shadow-2xl">
                    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-4 border-b flex justify-between items-center px-8">
                        <div>
                            <h3 className="font-bold text-gray-900">Letter Preview</h3>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">A4 Scale Proofing</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setPreviewTemplate(null)} className="h-8 w-8 rounded-full">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex justify-center p-8 bg-slate-200/30">
                        <div
                            className="shadow-2xl bg-white p-[1in] animate-in zoom-in-95 duration-300"
                            style={{
                                width: `8.5in`,
                                minHeight: `11in`,
                                flexShrink: 0
                            }}
                        >
                            <style dangerouslySetInnerHTML={{ __html: DEFAULT_STYLES }} />
                            <div
                                className="invitation-preview-content"
                                dangerouslySetInnerHTML={{
                                    __html: sanitizeHTML(interpolateTemplate(constructHtml(previewTemplate?.logoUrl || '', previewTemplate?.content || ''), MOCK_VARS))
                                }}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-8">
                {templates?.map((template) => {
                    const deconstructed = deconstructHtml(template.htmlContent);
                    const localState = editStates[template.id] || {
                        logoUrl: deconstructed.logoUrl,
                        content: deconstructed.content,
                        name: template.name,
                        description: template.description || '',
                    };

                    const handleFieldChange = (field: keyof typeof localState, value: string) => {
                        setEditStates(prev => ({
                            ...prev,
                            [template.id]: {
                                ...(prev[template.id] || localState),
                                [field]: value
                            }
                        }));
                    };

                    const isModified = editStates[template.id] && (
                        editStates[template.id].logoUrl !== deconstructed.logoUrl ||
                        editStates[template.id].content !== deconstructed.content ||
                        editStates[template.id].name !== template.name ||
                        editStates[template.id].description !== (template.description || '')
                    );

                    return (
                        <div key={template.id} className="space-y-4">
                            <Card className={cn(
                                "relative overflow-hidden transition-all duration-500 border-0 shadow-xl bg-white flex flex-col h-[750px]",
                                template.isDefault ? "ring-2 ring-blue-500" : ""
                            )}>
                                <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                                    <div className="flex-1 mr-4">
                                        <Input
                                            value={localState.name}
                                            onChange={e => handleFieldChange('name', e.target.value)}
                                            className="font-bold border-transparent bg-transparent hover:border-gray-200 focus:bg-white h-7 px-1 text-sm transition-all"
                                        />
                                        <Input
                                            value={localState.description}
                                            onChange={e => handleFieldChange('description', e.target.value)}
                                            className="text-[10px] text-gray-500 border-transparent bg-transparent hover:border-gray-200 focus:bg-white h-5 px-1 mt-0.5 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 gap-2 bg-white hover:bg-slate-50 border-gray-200 text-gray-600 font-bold"
                                            onClick={() => setPreviewTemplate({ logoUrl: localState.logoUrl, content: localState.content })}
                                        >
                                            <Eye className="h-3.5 w-3.5" /> Full Preview
                                        </Button>
                                        {isModified && (
                                            <Button size="sm" onClick={() => handleSave(template.id)} className="h-8 bg-green-600 hover:bg-green-700 gap-1.5 px-3">
                                                <Save className="h-3.5 w-3.5" /> Save
                                            </Button>
                                        )}
                                        <Button size="icon" variant="ghost" onClick={() => handleDelete(template.id)} className="h-8 w-8 text-red-500 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <CardContent className="p-0 flex flex-1 overflow-hidden">
                                    {/* Structured Editor - Full Width */}
                                    <div className="w-full flex flex-col bg-slate-50/30">
                                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                                                        <ImageIcon className="h-3 w-3" /> Logo URL
                                                    </div>
                                                    <Input
                                                        value={localState.logoUrl}
                                                        onChange={e => handleFieldChange('logoUrl', e.target.value)}
                                                        placeholder="https://..."
                                                        className="bg-white text-xs h-10"
                                                    />
                                                </div>
                                                <div className="flex items-end pb-1">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {['userName', 'eventTitle', 'organization', 'referenceNumber'].map(v => (
                                                            <span key={v} className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded cursor-help font-mono" title={`Includes dynamic ${v}`}>
                                                                {`{{${v}}}`}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                                                    <Type className="h-3 w-3" /> Letter Content
                                                </div>
                                                <Textarea
                                                    value={localState.content}
                                                    onChange={e => handleFieldChange('content', e.target.value)}
                                                    className="bg-white text-sm min-h-[450px] leading-relaxed resize-none border-gray-200 focus:ring-blue-500 font-serif p-6"
                                                    placeholder="Write your letter content here..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                {template.isDefault && (
                                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-bl-lg shadow-sm">
                                        DEFAULT
                                    </div>
                                )}
                            </Card>

                            {!template.isDefault && (
                                <Button
                                    onClick={() => updateTemplate({ id: template.id, data: { isDefault: true } })}
                                    variant="outline"
                                    className="w-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border-gray-200"
                                >
                                    Set as Default Invitation
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
                {[
                    { label: 'Document Type', value: 'PDF / A4', icon: FileText },
                    { label: 'Active Letter', value: templates?.find(t => t.isDefault)?.name || 'None', icon: Mail },
                    { label: 'Dynamic Fields', value: '6 Supported', icon: Palette },
                    { label: 'Security', value: 'Watermarked', icon: Settings2 }
                ].map((stat, i) => (
                    <Card key={i} className="bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-sm font-bold text-gray-900 line-clamp-1">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
