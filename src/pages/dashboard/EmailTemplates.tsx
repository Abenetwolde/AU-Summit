import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Mail,
    Plus,
    Trash2,
    Eye,
    X,
    Save,
    Paperclip,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/auth/context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    useGetEmailTemplatesQuery,
    useCreateEmailTemplateMutation,
    useUpdateEmailTemplateMutation,
    useDeleteEmailTemplateMutation,
    useSetDefaultEmailTemplateMutation,
    EmailTemplate
} from '@/store/services/api';

export function EmailTemplates() {
    // Pagination State
    const [page, setPage] = useState(1);
    const limit = 9; // Grid layout 3x3

    // API Hooks
    const { data, isLoading } = useGetEmailTemplatesQuery({ page, limit });
    const [createTemplate, { isLoading: isCreating }] = useCreateEmailTemplateMutation();
    const [updateTemplate, { isLoading: isUpdating }] = useUpdateEmailTemplateMutation();
    const [deleteTemplate, { isLoading: isDeleting }] = useDeleteEmailTemplateMutation();
    const [setDefaultTemplate, { isLoading: isSettingDefault }] = useSetDefaultEmailTemplateMutation();

    // Local State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate>>({});
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const { user } = useAuth();
    // Assuming NISS_OFFICER is read-only based on previous context, or use permission system if available
    const isReadOnly = user?.role === 'NISS_OFFICER';

    const templates = data?.templates || [];
    const pagination = data?.pagination;

    const handleCreate = () => {
        setEditingTemplate({
            templateName: '',
            emailSubject: '',
            emailContent: '',
            description: '',
            type: 'APPROVED',
            dynamicVariables: []
        });
        setAttachmentFile(null);
        setIsEditorOpen(true);
        setIsPreviewMode(false);
    };

    const handleEdit = (template: EmailTemplate) => {
        setEditingTemplate({ ...template });
        setAttachmentFile(null); // Reset file input
        setIsEditorOpen(true);
        setIsPreviewMode(false);
    };

    const handleSetDefault = async (id: number) => {
        try {
            await setDefaultTemplate(id).unwrap();
            toast.success('Template set as default successfully');
        } catch (error) {
            toast.error('Failed to set template as default');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                await deleteTemplate(id).unwrap();
                toast.success('Template deleted successfully');
            } catch (error) {
                toast.error('Failed to delete template');
            }
        }
    };

    const handleSave = async () => {
        // Use ref content if available for latest edits, otherwise state
        const currentContent = contentRef.current ? contentRef.current.innerHTML : (editingTemplate.emailContent || '');

        if (!editingTemplate.templateName || !editingTemplate.emailSubject || !currentContent) {
            toast.error('Please fill in all required fields');
            return;
        }

        const formData = new FormData();
        formData.append('templateName', editingTemplate.templateName);
        formData.append('emailSubject', editingTemplate.emailSubject);

        // Use ref content if available for latest edits, otherwise state
        const finalContent = contentRef.current ? contentRef.current.innerHTML : (editingTemplate.emailContent || '');
        formData.append('emailContent', finalContent);
        if (editingTemplate.type) formData.append('type', editingTemplate.type);
        if (editingTemplate.description) formData.append('description', editingTemplate.description);

        // Handle dynamic variables (extract from content or use explicit list)
        // For now, we rely on backend extracting or sending explicit list if needed
        // formData.append('dynamicVariables', JSON.stringify(['personName', 'status'])); 

        if (attachmentFile) {
            formData.append('attachment', attachmentFile);
        }

        try {
            if (editingTemplate.id) {
                await updateTemplate({ id: editingTemplate.id, data: formData }).unwrap();
                toast.success('Template updated successfully');
            } else {
                await createTemplate(formData).unwrap();
                toast.success('Template created successfully');
            }
            setIsEditorOpen(false);
        } catch (error: any) {
            console.error("Save Error:", error);
            // Handle specific validation errors from API
            if (error?.data?.errors?.errors?.[0]?.message) {
                toast.error(error.data.errors.errors[0].message);
            } else if (error?.data?.message) {
                toast.error(error.data.message);
            } else {
                toast.error('Failed to save template');
            }
        }
    };

    const renderPreview = (body: string) => {
        if (!body) return null;
        return body
            .replace(/{{personName}}/g, '<strong>John Doe</strong>')
            .replace(/{{fullName}}/g, '<strong>John Doe</strong>')
            .replace(/{{status}}/g, '<strong>APPROVED</strong>')
            .replace(/{{passportNumber}}/g, '<strong>EP1234567</strong>')
            .split('\n')
            .map((line, i) => <p key={i} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />);
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Email Templates</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage automated system emails, triggers, and attachments</p>
                </div>
                {!isReadOnly && (
                    <Button
                        onClick={handleCreate}
                        className="bg-[#009b4d] hover:bg-[#007a3d] gap-2 shadow-sm font-bold"
                    >
                        <Plus className="h-4 w-4" />
                        Create Template
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 bg-white overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CardHeader className="pb-3 flex flex-row items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold text-gray-900">{template.templateName}</CardTitle>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                        Last Updated: {new Date(template.updatedAt).toLocaleDateString()}
                                    </p>
                                    {template.type && (
                                        <span className={cn(
                                            "text-[10px] font-black px-2 py-0.5 rounded-full",
                                            template.type === 'APPROVED' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {template.type}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className={cn(
                                    "p-2.5 rounded-xl transition-colors",
                                    template.isDefault ? "bg-green-100" : "bg-blue-50 group-hover:bg-blue-600"
                                )}>
                                    <Mail className={cn(
                                        "h-5 w-5 transition-colors",
                                        template.isDefault ? "text-green-600" : "text-blue-600 group-hover:text-white"
                                    )} />
                                </div>
                                {template.isDefault && (
                                    <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                        ACTIVE
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                                {template.description || 'No description provided.'}
                            </p>

                            <div className="space-y-3 pt-2">
                                <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject Line</p>
                                    <p className="text-sm font-medium text-gray-700 truncate">{template.emailSubject}</p>
                                </div>

                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2 text-xs font-bold">
                                        <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                                        <span className={cn(
                                            template.attachmentUrl ? "text-green-600" : "text-gray-400"
                                        )}>
                                            {template.attachmentUrl ? 'Assessment attached' : 'None'}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-2 border-t border-gray-100 mt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(template)}
                                    className="flex-1 gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 font-bold"
                                >
                                    <Eye className="h-4 w-4" />
                                    {isReadOnly ? 'View' : 'Edit'}
                                </Button>
                                {!isReadOnly && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(template.id)}
                                        className="h-9 w-9 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        disabled={isDeleting || isSettingDefault}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                {!isReadOnly && !template.isDefault && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSetDefault(template.id)}
                                        className="text-[10px] font-bold h-9 px-3 border-gray-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                        disabled={isSettingDefault}
                                    >
                                        Set as Default
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!isReadOnly && templates.length === 0 && (
                    <div className="col-span-full py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                        <Mail className="h-12 w-12 mb-4 opacity-10" />
                        <p className="font-medium">No templates found. Create your first one!</p>
                        <Button onClick={handleCreate} variant="ghost" className="mt-4 text-blue-600 hover:text-blue-700">
                            Add Template
                        </Button>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    <Button
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm font-medium text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    >
                        Next <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            )}

            {/* Template Editor Modal */}
            {isEditorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-0">
                        <CardHeader className="border-b bg-white p-6 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 rounded-xl">
                                    <Mail className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle>{isReadOnly ? 'Template Details' : (editingTemplate.id ? 'Edit Template' : 'New Template')}</CardTitle>
                                    <CardDescription>Configure how your automated emails look and feel</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditorOpen(false)} className="rounded-full">
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                {/* Left Side - Form */}
                                <div className="lg:col-span-3 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Template Name</label>
                                            <Input
                                                value={editingTemplate.templateName || ''}
                                                onChange={(e) => setEditingTemplate({ ...editingTemplate, templateName: e.target.value })}
                                                placeholder="e.g., Welcome Email"
                                                readOnly={isReadOnly}
                                                className="h-11 border-gray-200 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Subject</label>
                                            <Input
                                                value={editingTemplate.emailSubject || ''}
                                                onChange={(e) => setEditingTemplate({ ...editingTemplate, emailSubject: e.target.value })}
                                                placeholder="Enter email subject line..."
                                                readOnly={isReadOnly}
                                                className="h-11 border-gray-200 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description (Optional)</label>
                                            <Input
                                                value={editingTemplate.description || ''}
                                                onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                                                placeholder="Briefly describe when this email is sent..."
                                                readOnly={isReadOnly}
                                                className="h-11 border-gray-200 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Content</label>
                                            <div className="flex p-0.5 bg-gray-100 rounded-lg">
                                                <button
                                                    onClick={() => setIsPreviewMode(false)}
                                                    className={cn(
                                                        "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                                                        !isPreviewMode ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                                    )}
                                                >
                                                    Editor
                                                </button>
                                                <button
                                                    onClick={() => setIsPreviewMode(true)}
                                                    className={cn(
                                                        "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                                                        isPreviewMode ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                                    )}
                                                >
                                                    Preview
                                                </button>
                                            </div>
                                        </div>

                                        {isPreviewMode ? (
                                            <div className="min-h-[300px] bg-white border border-gray-200 rounded-xl p-6 shadow-inner text-gray-700 leading-relaxed overflow-y-auto">
                                                {renderPreview(editingTemplate.emailContent || '')}
                                            </div>
                                        ) : (
                                            <div className="relative group">
                                                <div
                                                    ref={contentRef}
                                                    contentEditable={!isReadOnly}
                                                    onBlur={(e) => {
                                                        const html = e.currentTarget.innerHTML;
                                                        setEditingTemplate({ ...editingTemplate, emailContent: html });
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: editingTemplate.emailContent || '' }}
                                                    className={cn(
                                                        "w-full min-h-[300px] p-6 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm leading-relaxed overflow-y-auto transition-all",
                                                        !isReadOnly && "hover:border-blue-300 cursor-text shadow-sm"
                                                    )}
                                                />
                                                {!isReadOnly && (
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                                            VISUAL EDITOR ACTIVE
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side - Variables & Attachment */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="bg-white border-gray-200 shadow-sm">
                                        <CardHeader className="pb-3 px-4 pt-4">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-blue-500" />
                                                <CardTitle className="text-sm font-bold">Dynamic Variables</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4 space-y-3">
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                Use these placeholders to customize emails with recipient information.
                                            </p>
                                            <div className="space-y-2">
                                                {[
                                                    { key: '{{personName}}', label: 'Person Name' },
                                                    { key: '{{status}}', label: 'Status' },
                                                    { key: '{{passportNumber}}', label: 'Passport Number' }
                                                ].map(v => (
                                                    <div key={v.key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group cursor-pointer hover:bg-blue-50"
                                                        onClick={() => !isReadOnly && setEditingTemplate({ ...editingTemplate, emailContent: (editingTemplate.emailContent || '') + ' ' + v.key })}>
                                                        <code className="text-[10px] font-mono font-bold text-blue-600">{v.key}</code>
                                                        <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">{v.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attachment</label>
                                        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-white hover:border-blue-400 transition-colors group cursor-pointer relative">
                                            <Input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={(e) => setAttachmentFile(e.target.files ? e.target.files[0] : null)}
                                                disabled={isReadOnly}
                                            />
                                            <div className="flex flex-col items-center gap-2 text-center text-gray-400 group-hover:text-blue-500">
                                                <Paperclip className="h-8 w-8 opacity-20 group-hover:opacity-100 transition-all" />
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-bold">{attachmentFile ? attachmentFile.name : 'Select File (Optional)'}</p>
                                                    <p className="text-[10px]">PDF layout attached to email</p>
                                                </div>
                                                <Button variant="outline" size="sm" className="mt-2 h-8 text-xs font-bold border-gray-200 group-hover:border-blue-200">
                                                    {attachmentFile ? 'Change File' : 'Choose File'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {(editingTemplate.emailContent?.length || 0) > 0 && (
                                        <div className="p-4 bg-green-50 rounded-xl flex items-start gap-3 border border-green-100 animate-in slide-in-from-bottom-2 duration-300">
                                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-green-800">Ready to Save</p>
                                                <p className="text-[10px] text-green-700/80">Content looks good.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <CardHeader className="border-t bg-white p-6 flex flex-row items-center justify-between">
                            <Button variant="ghost" onClick={() => setIsEditorOpen(false)} className="px-6 font-bold text-gray-500 hover:text-gray-700">
                                Cancel
                            </Button>
                            {!isReadOnly && (
                                <Button
                                    onClick={handleSave}
                                    className="px-8 bg-blue-600 hover:bg-blue-700 gap-2 font-bold shadow-[0_4px_12px_rgba(37,99,235,0.3)] h-11"
                                    disabled={isCreating || isUpdating}
                                >
                                    {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="h-4 w-4" />
                                    Save Template
                                </Button>
                            )}
                        </CardHeader>
                    </Card>
                </div>
            )}
        </div>
    );
}
