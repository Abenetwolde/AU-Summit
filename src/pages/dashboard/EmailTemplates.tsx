import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Mail,
    Plus,
    Pencil,
    Trash2,
    Eye,
    FileText,
    X,
    Save,
    Paperclip,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/auth/context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    attachment?: string;
    lastModified: string;
    description?: string;
}

const MOCK_TEMPLATES: EmailTemplate[] = [
    {
        id: '1',
        name: 'Registration Success',
        subject: 'Accreditation Request Received',
        description: 'Sent immediately after a journalist submits their registration form.',
        body: 'Dear {{name}},\n\nYour registration for the upcoming AU Summit has been received and is being processed by our team.\n\nYou can track your status using your passport number: {{passportNo}}.\n\nBest regards,\nAU Media Team',
        lastModified: '2024-12-18',
    },
    {
        id: '2',
        name: 'Approval Notification',
        subject: 'Accreditation Approved - Badge Attached',
        description: 'Sent when the application is fully approved by all authorities.',
        body: 'Congratulations {{name}}!\n\nYour accreditation has been approved. Please find your digital badge attached to this email.\n\nYou will need to present this badge (printed or digital) at the entrance.\n\nSafe travels!',
        attachment: 'Standard Badge Template',
        lastModified: '2024-12-17',
    },
    {
        id: '3',
        name: 'Rejection Notice',
        subject: 'Update on Your Accreditation Request',
        description: 'Sent if the application is rejected by any authority.',
        body: 'Dear {{name}},\n\nUnfortunately, your accreditation request has not been approved at this time.\n\nReason: {{reason}}\n\nYou may contact the support team for further clarification.',
        lastModified: '2024-12-16',
    },
];

export function EmailTemplates() {
    const [templates, setTemplates] = useState<EmailTemplate[]>(MOCK_TEMPLATES);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const { user } = useAuth();
    const isReadOnly = user?.role === 'NISS_OFFICER';

    const handleCreate = () => {
        setEditingTemplate({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            subject: '',
            body: '',
            description: '',
            lastModified: new Date().toISOString().split('T')[0]
        });
        setIsEditorOpen(true);
        setIsPreviewMode(false);
    };

    const handleEdit = (template: EmailTemplate) => {
        setEditingTemplate({ ...template });
        setIsEditorOpen(true);
        setIsPreviewMode(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            setTemplates(templates.filter(t => t.id !== id));
            toast.success('Template deleted successfully');
        }
    };

    const handleSave = () => {
        if (!editingTemplate) return;

        if (!editingTemplate.name || !editingTemplate.subject || !editingTemplate.body) {
            toast.error('Please fill in all required fields');
            return;
        }

        const templateExists = templates.find(t => t.id === editingTemplate.id);
        if (templateExists) {
            setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...editingTemplate, lastModified: new Date().toISOString().split('T')[0] } : t));
            toast.success('Template updated successfully');
        } else {
            setTemplates([...templates, { ...editingTemplate, lastModified: new Date().toISOString().split('T')[0] }]);
            toast.success('Template created successfully');
        }
        setIsEditorOpen(false);
    };

    const renderPreview = (body: string) => {
        return body
            .replace(/{{name}}/g, '<strong>John Doe</strong>')
            .replace(/{{event}}/g, '<strong>AU Summit 2025</strong>')
            .replace(/{{passportNo}}/g, '<strong>EP1234567</strong>')
            .replace(/{{reason}}/g, '<em>missing press credentials</em>')
            .split('\n')
            .map((line, i) => <p key={i} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />);
    };

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
                                <CardTitle className="text-lg font-bold text-gray-900">{template.name}</CardTitle>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    Modified: {template.lastModified}
                                </p>
                            </div>
                            <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-600 transition-colors">
                                <Mail className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                                {template.description || 'No description provided.'}
                            </p>

                            <div className="space-y-3 pt-2">
                                <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject Line</p>
                                    <p className="text-sm font-medium text-gray-700 truncate">{template.subject}</p>
                                </div>

                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2 text-xs font-bold">
                                        <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                                        <span className={cn(
                                            template.attachment ? "text-green-600" : "text-gray-400"
                                        )}>
                                            {template.attachment || 'None'}
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
                                    >
                                        <Trash2 className="h-4 w-4" />
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

            {/* Template Editor Modal */}
            {isEditorOpen && editingTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-0">
                        <CardHeader className="border-b bg-white p-6 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 rounded-xl">
                                    <Mail className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle>{isReadOnly ? 'Template Details' : (templates.find(t => t.id === editingTemplate.id) ? 'Edit Template' : 'New Template')}</CardTitle>
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
                                                value={editingTemplate.name}
                                                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                                placeholder="e.g., Welcome Email"
                                                readOnly={isReadOnly}
                                                className="h-11 border-gray-200 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Subject</label>
                                            <Input
                                                value={editingTemplate.subject}
                                                onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                                placeholder="Enter email subject line..."
                                                readOnly={isReadOnly}
                                                className="h-11 border-gray-200 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description (Optional)</label>
                                            <Input
                                                value={editingTemplate.description}
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
                                            <div className="min-h-[250px] bg-white border border-gray-200 rounded-xl p-6 shadow-inner text-gray-700 leading-relaxed overflow-y-auto">
                                                {renderPreview(editingTemplate.body)}
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <textarea
                                                    value={editingTemplate.body}
                                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                                    placeholder="Type your email content here. Use {{name}}, {{event}}, etc. for dynamic data."
                                                    readOnly={isReadOnly}
                                                    className="w-full min-h-[250px] p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm leading-relaxed"
                                                />
                                                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                                    <div className="flex gap-1.5 p-1 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-100">
                                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded cursor-help" title="Insert Dynamic Name">
                                                            &#123;&#123;name&#125;&#125;
                                                        </span>
                                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded cursor-help" title="Insert Dynamic Event">
                                                            &#123;&#123;event&#125;&#125;
                                                        </span>
                                                    </div>
                                                </div>
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
                                                    { key: '{{name}}', label: 'Full Name' },
                                                    { key: '{{event}}', label: 'Event Title' },
                                                    { key: '{{passportNo}}', label: 'Passport Number' },
                                                    { key: '{{status}}', label: 'Current Status' }
                                                ].map(v => (
                                                    <div key={v.key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group cursor-pointer hover:bg-blue-50"
                                                        onClick={() => !isReadOnly && setEditingTemplate({ ...editingTemplate, body: editingTemplate.body + ' ' + v.key })}>
                                                        <code className="text-[10px] font-mono font-bold text-blue-600">{v.key}</code>
                                                        <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">{v.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attachment</label>
                                        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-white hover:border-blue-400 transition-colors group cursor-pointer">
                                            <div className="flex flex-col items-center gap-2 text-center text-gray-400 group-hover:text-blue-500">
                                                <Paperclip className="h-8 w-8 opacity-20 group-hover:opacity-100 transition-all" />
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-bold">Select Badge Template</p>
                                                    <p className="text-[10px]">PDF layout attached to email</p>
                                                </div>
                                                <Button variant="outline" size="sm" className="mt-2 h-8 text-xs font-bold border-gray-200 group-hover:border-blue-200">
                                                    Choose File
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {editingTemplate.body.length > 0 && (
                                        <div className="p-4 bg-green-50 rounded-xl flex items-start gap-3 border border-green-100 animate-in slide-in-from-bottom-2 duration-300">
                                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-green-800">Ready to Publish</p>
                                                <p className="text-[10px] text-green-700/80">All mandatory fields are filled and valid markers detected.</p>
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
                                >
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
