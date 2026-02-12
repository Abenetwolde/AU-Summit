import { useParams, useNavigate } from 'react-router-dom';
import { sanitizeHTML } from '@/utils/sanitization';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { useGetApplicationByIdQuery, useGetBadgeTemplatesQuery, FILE_BASE_URL } from '@/store/services/api';

// Helper to replace template variables for preview
const interpolateTemplate = (content: string, variables: Record<string, string>) => {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value);
    });
    return result;
};

export function BadgeSlipPreview() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: application, isLoading: isAppLoading } = useGetApplicationByIdQuery(Number(id));
    const { data: templates, isLoading: isTemplatesLoading } = useGetBadgeTemplatesQuery();

    const activeTemplate = templates?.find(t => t.isDefault);

    if (isAppLoading || isTemplatesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                    <p className="text-slate-500 font-medium">Generating Preview...</p>
                </div>
            </div>
        );
    }

    if (!application) return <div className="p-8 text-center text-red-500">Application not found</div>;
    if (!activeTemplate) return <div className="p-8 text-center text-orange-500">No active badge template found. Please set one in Badge Templates.</div>;

    const handlePrint = () => {
        const url = `${FILE_BASE_URL}/api/v1/badges/generate/${id}`;
        window.open(url, '_blank');
    };

    const previewVars = {
        userName: application.user?.fullName || 'N/A',
        organization: application.formData?.organization || 'N/A',
        badgeType: application.form?.type || 'DELEGATE',
        referenceNumber: application.formData?.passport_number || 'AU-PREVIEW',
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/au-admin/badge-templates')}>
                            Edit Template
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            Generate Official PDF
                        </Button>
                    </div>
                </div>

                <div className="bg-white p-12 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center">
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-bold text-slate-900 line-clamp-1">{activeTemplate.name}</h2>
                        <p className="text-sm text-slate-500">Live Preview of {application.user?.fullName}'s Badge</p>
                    </div>

                    <div
                        className="shadow-2xl bg-white relative overflow-hidden ring-1 ring-slate-200"
                        style={{
                            width: `${activeTemplate.width}px`,
                            height: `${activeTemplate.height}px`,
                        }}
                    >
                        <style dangerouslySetInnerHTML={{ __html: activeTemplate.cssStyles }} />
                        <div
                            className="badge-preview-content h-full w-full"
                            dangerouslySetInnerHTML={{
                                __html: sanitizeHTML(interpolateTemplate(activeTemplate.htmlContent, previewVars))
                            }}
                        />
                    </div>

                    <div className="mt-12 w-full grid grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block mb-1 uppercase font-bold tracking-wider">Dimensions</span>
                            <span className="text-slate-900 font-bold">{activeTemplate.width}px x {activeTemplate.height}px</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block mb-1 uppercase font-bold tracking-wider">Security</span>
                            <span className="text-slate-900 font-bold">Encrypted QR Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
