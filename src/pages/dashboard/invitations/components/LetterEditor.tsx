 import React, { useState, useEffect } from 'react';
import { useGetInvitationTemplateByIdQuery, useCreateLetterConfigMutation, useUpdateLetterConfigMutation, LetterConfig } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, X, Eye, Type, ImageIcon, FileText, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Props {
    templateId: number | null;
    existingConfig: LetterConfig | null;
    onSaved: () => void;
    onCancel: () => void;
}

export const LetterEditor: React.FC<Props> = ({ templateId, existingConfig, onSaved, onCancel }) => {
    const { data: template, isLoading: loadingTemplate } = useGetInvitationTemplateByIdQuery(templateId!, { skip: !templateId });
    const [createConfig] = useCreateLetterConfigMutation();
    const [updateConfig] = useUpdateLetterConfigMutation();

    const [formState, setFormState] = useState({
        name: '',
        description: '',
        logoUrl: '',
        headerText: '',
        paragraphs: [''],
        footerText: '',
        isActive: false
    });

    useEffect(() => {
        if (existingConfig) {
            setFormState({
                name: existingConfig.name,
                description: existingConfig.description || '',
                logoUrl: existingConfig.logoUrl || '',
                headerText: existingConfig.headerText || '',
                paragraphs: existingConfig.paragraphs.length > 0 ? existingConfig.paragraphs : [''],
                footerText: existingConfig.footerText || '',
                isActive: existingConfig.isActive
            });
        } else if (template) {
            setFormState(prev => ({
                ...prev,
                name: `New ${template.name} Config`
            }));
        }
    }, [existingConfig, template]);

    const handleAddParagraph = () => {
        setFormState(prev => ({ ...prev, paragraphs: [...prev.paragraphs, ''] }));
    };

    const handleRemoveParagraph = (index: number) => {
        setFormState(prev => ({
            ...prev,
            paragraphs: prev.paragraphs.filter((_, i) => i !== index)
        }));
    };

    const handleParagraphChange = (index: number, val: string) => {
        const newPara = [...formState.paragraphs];
        newPara[index] = val;
        setFormState(prev => ({ ...prev, paragraphs: newPara }));
    };

    const handleSave = async () => {
        if (!templateId) return;

        try {
            const payload = {
                ...formState,
                templateId: templateId
            };

            if (existingConfig) {
                await updateConfig({ id: existingConfig.id, data: payload }).unwrap();
                toast.success("Configuration updated successfully");
            } else {
                await createConfig(payload).unwrap();
                toast.success("Configuration created successfully");
            }
            onSaved();
        } catch (err: any) {
            toast.error(err.data?.error || "Failed to save configuration");
        }
    };

    if (loadingTemplate) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
        );
    }

    if (!templateId) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50 border-2 border-dashed rounded-2xl">
                <Palette className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900">No Template Selected</h3>
                <p className="text-slate-500 mb-6 text-center">Please select a design from the "Designs" tab first to start editing.</p>
                <Button onClick={onCancel} variant="outline">Browse Designs</Button>
            </div>
        );
    }

    const interpolate = (html: string, vars: any) => {
        let res = html;
        Object.keys(vars).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            res = res.replace(regex, vars[key]);
        });
        return res;
    };

    const previewVars = {
        logo: formState.logoUrl || 'https://via.placeholder.com/150?text=Your+Logo',
        header: formState.headerText || 'Header Text Preview',
        body: formState.paragraphs.filter(p => p).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n') || '<p>Your paragraphs will appear here...</p>',
        footer: formState.footerText || 'Footer Text Preview',
        userName: 'John Doe',
        referenceNumber: 'AU-SMC-000001',
        date: new Date().toLocaleDateString()
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
            {/* Editor Side */}
            <div className="space-y-6">
                <Card className="border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b p-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" /> General Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-slate-500">Config Name</Label>
                                <Input
                                    value={formState.name}
                                    onChange={e => setFormState({ ...formState, name: e.target.value })}
                                    placeholder="e.g. VIP Invitation for Summit"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold">Set as Active</Label>
                                    <p className="text-xs text-slate-500">Use this design for automatic approval letters.</p>
                                </div>
                                <Switch
                                    checked={formState.isActive}
                                    onCheckedChange={checked => setFormState({ ...formState, isActive: checked })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b p-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Palette className="h-4 w-4 text-primary" /> Content Customization
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
                                <ImageIcon className="h-3.5 w-3.5" /> Logo URL
                            </Label>
                            <Input
                                value={formState.logoUrl}
                                onChange={e => setFormState({ ...formState, logoUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
                                <Type className="h-3.5 w-3.5" /> Header Text
                            </Label>
                            <Input
                                value={formState.headerText}
                                onChange={e => setFormState({ ...formState, headerText: e.target.value })}
                                placeholder="Official Header..."
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs uppercase font-bold text-slate-500">Paragraphs</Label>
                                <Button onClick={handleAddParagraph} variant="outline" size="sm" className="h-7 text-[10px] px-2">
                                    <Plus className="h-3 w-3 mr-1" /> Add Paragraph
                                </Button>
                            </div>
                            {formState.paragraphs.map((p, i) => (
                                <div key={i} className="group relative">
                                    <Textarea
                                        value={p}
                                        onChange={e => handleParagraphChange(i, e.target.value)}
                                        className="min-h-[100px] text-sm resize-none pr-10"
                                        placeholder={`Paragraph ${i + 1} content...`}
                                    />
                                    {formState.paragraphs.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveParagraph(i)}
                                            className="absolute top-2 right-2 h-7 w-7 p-0 text-slate-400 hover:text-red-500 group-hover:opacity-100 opacity-0 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-500">Footer Text</Label>
                            <Input
                                value={formState.footerText}
                                onChange={e => setFormState({ ...formState, footerText: e.target.value })}
                                placeholder="Official Footer..."
                            />
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-[10px] font-bold text-blue-800 uppercase mb-2">Available Placeholders</p>
                            <div className="flex flex-wrap gap-2">
                                {['{{userName}}', '{{eventTitle}}', '{{date}}', '{{referenceNumber}}', '{{venue}}'].map(v => (
                                    <span key={v} className="bg-white px-2 py-0.5 rounded border border-blue-200 text-[10px] font-mono text-blue-700 select-all cursor-copy" title="Click to copy (simulated)">{v}</span>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center gap-3">
                    <Button onClick={handleSave} className="flex-1 bg-slate-900 hover:bg-black gap-2 h-11">
                        <Save className="h-4 w-4" /> Save Configuration
                    </Button>
                    <Button onClick={onCancel} variant="outline" className="h-11 px-6">
                        <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                </div>
            </div>

            {/* Preview Side */}
            <div className="lg:sticky lg:top-8 h-fit">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" /> Graceful Preview
                    </h3>
                    <Badge variant="outline" className="bg-white border-primary/20 text-primary text-[10px]">A4 Scale Proofing</Badge>
                </div>

                <Card className="overflow-hidden border-slate-200 bg-slate-100 p-8 flex justify-center shadow-inner min-h-[800px]">
                    <div
                        className="bg-white shadow-2xl origin-top transition-all duration-300"
                        style={{
                            width: '8.27in', // A4 Width
                            height: '11.69in', // A4 Height
                            transform: 'scale(0.6)',
                            transformOrigin: 'top center',
                            marginBottom: '-300px' // Compensate for scale empty space
                        }}
                    >
                        {template && (
                            <>
                                <style dangerouslySetInnerHTML={{ __html: template.cssStyles }} />
                                <div
                                    className="h-full w-full overflow-hidden"
                                    dangerouslySetInnerHTML={{
                                        __html: interpolate(template.htmlContent, previewVars)
                                    }}
                                />
                            </>
                        )}
                        {!template && (
                            <div className="h-full w-full flex items-center justify-center text-slate-300 italic">
                                Loading preview...
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
