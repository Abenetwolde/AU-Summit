import { useState, useMemo } from 'react';
import { sanitizeHTML } from '@/utils/sanitization';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Check,
    Eye,
    Palette,
    QrCode,
    Printer,
    Settings2,
    Layout,
    Code,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import {
    useGetBadgeTemplatesQuery,
    useUpdateBadgeTemplateMutation,
    useDeleteBadgeTemplateMutation,
    useCreateBadgeTemplateMutation,
    BadgeTemplate,
    CreateBadgeTemplatePayload,
} from '@/store/services/api';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
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
    badgeType: "DELEGATE",
    referenceNumber: "AU-2025-001",
};

export function BadgeTemplates() {
    const { data: templates, isLoading } = useGetBadgeTemplatesQuery();
    const [updateTemplate] = useUpdateBadgeTemplateMutation();
    const [createTemplate] = useCreateBadgeTemplateMutation();
    const [deleteTemplate] = useDeleteBadgeTemplateMutation();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState<Partial<CreateBadgeTemplatePayload>>({
        name: '',
        description: '',
        htmlContent: '',
        cssStyles: '',
        badgeType: 'Standard',
        width: 337,
        height: 512,
        dynamicVariables: ['userName', 'badgeType', 'organization', 'referenceNumber'],
    });

    // Local state for editing cards
    const [editStates, setEditStates] = useState<Record<number, { isCode: boolean; html: string; css: string }>>({});

    const handleToggleMode = (id: number, currentHtml: string, currentCss: string) => {
        setEditStates(prev => {
            const current = prev[id] || { isCode: false, html: currentHtml, css: currentCss };
            return {
                ...prev,
                [id]: { ...current, isCode: !current.isCode }
            };
        });
    };

    const handleSave = async (id: number) => {
        const state = editStates[id];
        if (!state) return;
        try {
            await updateTemplate({
                id,
                data: {
                    htmlContent: state.html,
                    cssStyles: state.css,
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
            await createTemplate(newTemplate as CreateBadgeTemplatePayload).unwrap();
            toast.success("Badge template created");
            setIsAddOpen(false);
        } catch (err) {
            toast.error("Failed to create template");
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-64">Loading templates...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Badge Templates</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage event badge designs with live rendering and code editing</p>
                </div>
                <div className="flex gap-3">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#009b4d] hover:bg-[#007a3d] gap-2 shadow-md">
                                <Plus className="h-4 w-4" />
                                New Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Badge Template</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="e.g. VIP Badge" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Badge Type</Label>
                                        <Input value={newTemplate.badgeType} onChange={e => setNewTemplate({ ...newTemplate, badgeType: e.target.value })} placeholder="e.g. VIP" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea value={newTemplate.description} onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>HTML Content</Label>
                                    <Textarea className="font-mono h-32" value={newTemplate.htmlContent} onChange={e => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>CSS Styles</Label>
                                    <Textarea className="font-mono h-32" value={newTemplate.cssStyles} onChange={e => setNewTemplate({ ...newTemplate, cssStyles: e.target.value })} />
                                </div>
                                <Button onClick={handleCreate} className="w-full bg-[#009b4d]">Create Template</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                {templates?.map((template) => {
                    const localState = editStates[template.id] || { isCode: false, html: template.htmlContent, css: template.cssStyles };

                    return (
                        <div key={template.id} className="space-y-4">
                            <Card className={cn(
                                "relative overflow-hidden transition-all duration-500 border-0 shadow-xl bg-white",
                                template.isDefault ? "ring-2 ring-green-500" : ""
                            )}>
                                <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{template.name}</h3>
                                        <p className="text-[10px] text-gray-500">{template.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center space-x-2 mr-2">
                                            <Label htmlFor={`mode-${template.id}`} className="text-[10px] font-bold uppercase text-gray-400">
                                                {localState.isCode ? 'Code' : 'Preview'}
                                            </Label>
                                            <Switch
                                                id={`mode-${template.id}`}
                                                checked={localState.isCode}
                                                onCheckedChange={() => handleToggleMode(template.id, template.htmlContent, template.cssStyles)}
                                            />
                                        </div>
                                        {localState.isCode && (
                                            <Button size="icon" variant="ghost" onClick={() => handleSave(template.id)} className="h-8 w-8 text-blue-600 hover:text-blue-700">
                                                <Save className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button size="icon" variant="ghost" onClick={() => handleDelete(template.id)} className="h-8 w-8 text-red-500 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <CardContent className="p-0">
                                    {localState.isCode ? (
                                        <div className="flex flex-col h-[512px]">
                                            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto bg-slate-900 text-white">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] text-slate-400 font-mono">HTML</Label>
                                                        <Code className="h-3 w-3 text-slate-500" />
                                                    </div>
                                                    <Textarea
                                                        className="font-mono text-xs bg-slate-800 border-slate-700 h-48 focus:ring-blue-500"
                                                        value={localState.html}
                                                        onChange={e => setEditStates(prev => ({ ...prev, [template.id]: { ...(prev[template.id] || localState), html: e.target.value } }))}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] text-slate-400 font-mono">CSS</Label>
                                                        <Palette className="h-3 w-3 text-slate-500" />
                                                    </div>
                                                    <Textarea
                                                        className="font-mono text-xs bg-slate-800 border-slate-700 h-48 focus:ring-blue-500"
                                                        value={localState.css}
                                                        onChange={e => setEditStates(prev => ({ ...prev, [template.id]: { ...(prev[template.id] || localState), css: e.target.value } }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center bg-slate-100/50 p-8 h-[512px] overflow-auto">
                                            <div
                                                className="shadow-2xl bg-white origin-top"
                                                style={{
                                                    transform: `scale(${template.width > 350 ? 0.7 : 0.85})`,
                                                    width: `${template.width}px`,
                                                    height: `${template.height}px`,
                                                    flexShrink: 0
                                                }}
                                            >
                                                <style dangerouslySetInnerHTML={{ __html: localState.css }} />
                                                <div
                                                    className="badge-preview-content h-full w-full overflow-hidden"
                                                    dangerouslySetInnerHTML={{
                                                        __html: sanitizeHTML(interpolateTemplate(localState.html, {
                                                            ...MOCK_VARS,
                                                            badgeType: template.badgeType || "MEMBER"
                                                        }))
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                {template.isDefault && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-bl-lg shadow-sm">
                                        ACTIVE
                                    </div>
                                )}
                            </Card>

                            {!template.isDefault && (
                                <Button
                                    onClick={() => updateTemplate({ id: template.id, data: { isDefault: true } })}
                                    variant="outline"
                                    className="w-full hover:bg-green-50 hover:text-green-700 hover:border-green-200 border-gray-200"
                                >
                                    Set as Default Template
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
                {[
                    { label: 'Security Level', value: 'High', icon: Settings2 },
                    { label: 'Templates', value: `${templates?.length || 0} Total`, icon: Palette },
                    { label: 'Dynamic Vars', value: '4 Support', icon: QrCode },
                    { label: 'Preview DPI', value: '300 DPI', icon: Printer }
                ].map((stat, i) => (
                    <Card key={i} className="bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-sm font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
