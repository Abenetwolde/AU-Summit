import { useGetBadgeTemplatesQuery } from '@/store/services/api';
import { sanitizeHTML } from '@/utils/sanitization';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layout, Maximize2 } from 'lucide-react';

export function BadgeGallery({ onSelect }: { onSelect: (templateId: number) => void }) {
    const { data: templates, isLoading } = useGetBadgeTemplatesQuery();

    if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading templates...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates?.map((template) => (
                <Card key={template.id} className="flex flex-col overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group">
                    <div className="relative aspect-[3/4] bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
                        {/* Simplified CSS-based preview of the template */}
                        <div
                            className="bg-white shadow-xl origin-center group-hover:scale-110 transition-transform duration-700"
                            style={{
                                width: `${template.width}px`,
                                height: `${template.height}px`,
                                transform: 'scale(0.4)'
                            }}
                        >
                            <style dangerouslySetInnerHTML={{ __html: template.cssStyles }} />
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(template.htmlContent.replace(/{{[^}]+}}/g, '...')) }} />
                        </div>
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="secondary" size="sm" className="shadow-lg" onClick={() => onSelect(template.id)}>
                                <Maximize2 className="mr-2 h-4 w-4" /> Preview Template
                            </Button>
                        </div>
                    </div>
                    <CardContent className="p-6 flex-1">
                        <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{template.description || 'Professional event badge template.'}</p>
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                        <Button className="w-full" variant="outline" onClick={() => onSelect(template.id)}>
                            <Layout className="mr-2 h-4 w-4" /> Use Template
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
