import { useState, useRef, useEffect } from 'react';
import { sanitizeHTML } from '@/utils/sanitization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BadgeCheck, Save, Move, Trash2, Image as ImageIcon, QrCode, Type, Layout, Settings as SettingsIcon, User, Building2 } from 'lucide-react';
import {
    useGetBadgeTemplatesQuery,
    useCreateBadgeConfigMutation,
    useGetBadgeConfigByIdQuery,
    useUpdateBadgeConfigMutation,
    BadgeTemplate
} from '@/store/services/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface DesignerElement {
    id: string;
    type: 'logo' | 'qr' | 'text' | 'photo' | 'header';
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    opacity?: number;
    placeholder?: string; // e.g. '{{userName}}'
}

export function BadgeDesigner({ onSave, configId }: { onSave?: () => void; configId?: number | null }) {
    const { data: templates } = useGetBadgeTemplatesQuery();
    const { data: existingConfig, isLoading: isLoadingConfig } = useGetBadgeConfigByIdQuery(configId as number, { skip: !configId });
    const [createConfig] = useCreateBadgeConfigMutation();
    const [updateBadgeConfig] = useUpdateBadgeConfigMutation();

    const [selectedTemplate, setSelectedTemplate] = useState<BadgeTemplate | null>(null);
    const [elements, setElements] = useState<DesignerElement[]>([]);
    const [configName, setConfigName] = useState('New Badge Configuration');
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState('#D4AF37');
    const [secondaryColor, setSecondaryColor] = useState('#ffffff');
    const [isActive, setIsActive] = useState(false);

    const canvasRef = useRef<HTMLDivElement>(null);

    // Initialize elements when template changes OR when loading existing config
    useEffect(() => {
        if (existingConfig) {
            setConfigName(existingConfig.name);
            setSelectedTemplate(existingConfig.template || null);
            setPrimaryColor(existingConfig.primaryColor);
            setSecondaryColor(existingConfig.secondaryColor);
            setIsActive(existingConfig.isActive);
            if (existingConfig.layoutConfig) {
                try {
                    setElements(JSON.parse(existingConfig.layoutConfig));
                } catch (e) {
                    console.error("Failed to parse layout config", e);
                }
            }
        } else if (selectedTemplate && !configId) {
            setElements([
                { id: 'logo', type: 'logo', x: selectedTemplate.width / 2 - 25, y: 30, width: 50, height: 50 },
                { id: 'qr', type: 'qr', x: selectedTemplate.width / 2 - 40, y: selectedTemplate.height - 100, width: 80, height: 80 },
                { id: 'user-name', type: 'text', x: 20, y: 150, width: selectedTemplate.width - 40, height: 30, placeholder: '{{userName}}', fontSize: 20, fontWeight: 'bold', content: 'FULL NAME' },
                { id: 'user-org', type: 'text', x: 20, y: 180, width: selectedTemplate.width - 40, height: 20, placeholder: '{{organization}}', fontSize: 14, fontWeight: 'medium', content: 'ORGANIZATION' },
                { id: 'user-title', type: 'text', x: 20, y: 200, width: selectedTemplate.width - 40, height: 20, placeholder: '{{title}}', fontSize: 12, content: 'JOB TITLE' },
                { id: 'user-photo', type: 'photo', x: selectedTemplate.width / 2 - 45, y: 40, width: 90, height: 110 },
            ]);
            setPrimaryColor('#D4AF37');
        }
    }, [selectedTemplate, existingConfig, configId]);

    const handleSave = async () => {
        if (!selectedTemplate) return;

        const qrElement = elements.find(e => e.type === 'qr');
        const payload = {
            name: configName,
            templateId: selectedTemplate.id,
            primaryColor,
            secondaryColor,
            qrSize: qrElement?.width || 80,
            qrX: qrElement?.x || 0,
            qrY: qrElement?.y || 0,
            layoutConfig: JSON.stringify(elements),
            isActive
        };

        try {
            if (configId) {
                await updateBadgeConfig({ id: configId, data: payload }).unwrap();
                toast.success('Badge configuration updated successfully!');
            } else {
                await createConfig(payload).unwrap();
                toast.success('Badge configuration saved successfully!');
            }
            onSave?.();
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('Failed to save configuration');
        }
    };

    const handleAddElement = (type: DesignerElement['type'], placeholder?: string) => {
        const id = `${type}-${Date.now()}`;
        const newElement: DesignerElement = {
            id,
            type,
            x: 50,
            y: 50,
            width: type === 'text' ? 150 : (type === 'header' ? 200 : 80),
            height: type === 'text' ? 30 : (type === 'header' ? 40 : 80),
            content: type === 'text' ? 'New Text' : (type === 'header' ? '' : undefined),
            backgroundColor: type === 'header' ? '#f47424' : undefined,
            placeholder
        };
        setElements(prev => [...prev, newElement]);
        setSelectedElementId(id);
    };

    const handleElementDrag = (id: string, e: React.MouseEvent) => {
        if (!canvasRef.current || !selectedTemplate) return;

        const startX = e.clientX;
        const startY = e.clientY;

        const element = elements.find(el => el.id === id);
        if (!element) return;

        const initialX = element.x;
        const initialY = element.y;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            setElements(prev => prev.map(el =>
                el.id === id
                    ? {
                        ...el, x: Math.max(0, Math.min(initialX + dx, selectedTemplate.width - el.width)),
                        y: Math.max(0, Math.min(initialY + dy, selectedTemplate.height - el.height))
                    }
                    : el
            ));
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    if (isLoadingConfig) {
        return (
            <div className="flex h-[600px] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const selectedElement = elements.find(e => e.id === selectedElementId);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Panel: Elements & Settings */}
            <div className="w-full lg:w-80 space-y-6">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Layout className="h-5 w-5 text-primary" />
                            General Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Configuration Name</Label>
                            <Input
                                value={configName}
                                onChange={(e) => setConfigName(e.target.value)}
                                placeholder="e.g. Summit 2025 VIP"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Base Template</Label>
                            <Select
                                value={selectedTemplate?.id.toString()}
                                onValueChange={(val) => setSelectedTemplate(templates?.find(t => t.id === parseInt(val)) || null)}
                                disabled={!!configId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates?.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <Label className="cursor-pointer" htmlFor="active-mode">Set as Active</Label>
                            <Switch
                                id="active-mode"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Type className="h-5 w-5 text-primary" />
                            Add Elements
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleAddElement('text')} className="gap-2">
                            <Type className="h-4 w-4" /> Text
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddElement('text', '{{userName}}')} className="gap-2 text-[10px]">
                            <User className="h-4 w-4" /> Name
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddElement('text', '{{title}}')} className="gap-2 text-[10px]">
                            <Type className="h-4 w-4" /> Title
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddElement('text', '{{organization}}')} className="gap-2 text-[10px]">
                            <Building2 className="h-4 w-4" /> Org
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddElement('photo')} className="gap-2">
                            <User className="h-4 w-4" /> Photo
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddElement('header')} className="gap-2">
                            <Layout className="h-4 w-4" /> Bar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddElement('logo')} className="gap-2">
                            <ImageIcon className="h-4 w-4" /> Logo/Flag
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddElement('qr')} className="gap-2">
                            <QrCode className="h-4 w-4" /> QR Code
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-primary" />
                            Appearance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                                <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-8 w-12 p-0 border-none" />
                                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-8 text-xs" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2">
                                <Input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-8 w-12 p-0 border-none" />
                                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-8 text-xs" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Button className="w-full shadow-lg h-12 text-lg" onClick={handleSave} disabled={!selectedTemplate}>
                    <Save className="mr-2 h-5 w-5" />
                    Save Configuration
                </Button>
            </div>

            {/* Center: Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 rounded-2xl p-8 min-h-[600px] relative overflow-hidden">
                {!selectedTemplate ? (
                    <div className="text-center space-y-4">
                        <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <BadgeCheck className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold font-sans">Select a base template to start</h3>
                        <p className="text-slate-500">Choose one of our professionally designed templates to begin customizing.</p>
                    </div>
                ) : (
                    <div className="relative group">
                        <div
                            ref={canvasRef}
                            className="bg-white shadow-2xl relative overflow-hidden transition-all duration-300 border border-slate-200"
                            style={{
                                width: `${selectedTemplate.width}px`,
                                height: `${selectedTemplate.height}px`,
                                fontFamily: selectedTemplate.name.includes('Premium') ? 'serif' : 'sans-serif'
                            }}
                        >
                            <style dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedTemplate.cssStyles) }} />
                            <div
                                className="absolute inset-0 z-0 pointer-events-none"
                                dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedTemplate.htmlContent.replace(/{{[^}]+}}/g, '')) }}
                            />

                            {/* Elements */}
                            {elements.map(el => (
                                <div
                                    key={el.id}
                                    onMouseDown={(e) => handleElementDrag(el.id, e)}
                                    onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                                    className={cn(
                                        "absolute cursor-move group transition-all duration-75 flex items-center justify-center",
                                        selectedElementId === el.id ? "ring-2 ring-primary ring-offset-2 z-50" : "hover:ring-1 hover:ring-primary/50"
                                    )}
                                    style={{
                                        left: el.x,
                                        top: el.y,
                                        width: el.width,
                                        height: el.height,
                                        fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                                        fontWeight: el.fontWeight || 'normal',
                                        color: el.color || 'inherit',
                                        backgroundColor: el.backgroundColor || 'transparent',
                                        borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                                        opacity: el.opacity !== undefined ? el.opacity : 1,
                                        textAlign: 'center'
                                    }}
                                >
                                    <div className={cn(
                                        "w-full h-full flex items-center justify-center overflow-hidden",
                                        (el.type === 'qr' || el.type === 'logo' || el.type === 'photo') ? "bg-slate-200/20 border border-dashed border-slate-300" : ""
                                    )}>
                                        {el.type === 'logo' && (
                                            el.content && (el.content.startsWith('http') || el.content.startsWith('data:'))
                                                ? <img src={el.content} className="w-full h-full object-contain" alt="Logo" />
                                                : <ImageIcon className="h-2/3 w-2/3 text-slate-400" />
                                        )}
                                        {el.type === 'qr' && <QrCode className="h-2/3 w-2/3 text-slate-600" />}
                                        {el.type === 'header' && <Layout className="h-2/3 w-2/3 text-slate-300" />}
                                        {el.type === 'photo' && (
                                            el.content && el.content.startsWith('http')
                                                ? <img src={el.content} className="w-full h-full object-cover" alt="User" />
                                                : <User className="h-2/3 w-2/3 text-slate-400" />
                                        )}
                                        {el.type === 'text' && (
                                            <span className="px-2">{el.content || 'Text'}</span>
                                        )}
                                    </div>

                                    {selectedElementId === el.id && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap uppercase">
                                            {el.placeholder ? `Placeholder: ${el.placeholder.replace(/[{}]/g, '')}` : el.type}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-6 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><Move className="h-3 w-3" /> Drag elements to position</span>
                            <span className="flex items-center gap-1.5"><Layout className="h-3 w-3" /> Canvas: {selectedTemplate.width}x{selectedTemplate.height}px</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Element Properties */}
            <div className="w-full lg:w-72 space-y-6">
                <Card className="border-0 shadow-lg h-full">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-primary" />
                            Properties
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedElement ? (
                            <div className="space-y-6">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Editing</div>
                                    <div className="text-sm font-bold text-slate-900 capitalize">{selectedElement.type}</div>
                                </div>

                                <div className="space-y-4">
                                    {(selectedElement.type === 'text' || selectedElement.type === 'logo' || selectedElement.type === 'photo') && (
                                        <div className="space-y-2">
                                            <Label>{selectedElement.type === 'text' ? 'Text Content' : 'Image URL'}</Label>
                                            <Input
                                                value={selectedElement.content || ''}
                                                onChange={(e) => setElements(prev => prev.map(el =>
                                                    el.id === selectedElementId ? { ...el, content: e.target.value } : el
                                                ))}
                                                placeholder={selectedElement.type === 'text' ? 'Enter text...' : 'https://example.com/image.png'}
                                                disabled={!!selectedElement.placeholder}
                                            />
                                            {selectedElement.placeholder && (
                                                <p className="text-[10px] text-orange-600 font-medium">This field will be replaced by {selectedElement.placeholder} in the PDF by default, unless you provide a URL above.</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Width</Label>
                                            <Input type="number" value={selectedElement.width} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, width: parseInt(e.target.value) || 0 } : el))} className="h-8 text-xs" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Height</Label>
                                            <Input type="number" value={selectedElement.height} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, height: parseInt(e.target.value) || 0 } : el))} className="h-8 text-xs" />
                                        </div>
                                    </div>

                                    {selectedElement.type === 'text' && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Text Color</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="color"
                                                        value={selectedElement.color || '#000000'}
                                                        onChange={(e) => setElements(prev => prev.map(el =>
                                                            el.id === selectedElementId ? { ...el, color: e.target.value } : el
                                                        ))}
                                                        className="h-8 w-12 p-0 border-none"
                                                    />
                                                    <Input
                                                        value={selectedElement.color || '#000000'}
                                                        onChange={(e) => setElements(prev => prev.map(el =>
                                                            el.id === selectedElementId ? { ...el, color: e.target.value } : el
                                                        ))}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Font Size ({selectedElement.fontSize || 12}px)</Label>
                                                <Slider
                                                    value={[selectedElement.fontSize || 12]}
                                                    min={8} max={72} step={1}
                                                    onValueChange={([v]) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, fontSize: v } : el))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Font Weight</Label>
                                                <Select value={selectedElement.fontWeight || 'normal'} onValueChange={(v) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, fontWeight: v } : el))}>
                                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="medium">Medium</SelectItem>
                                                        <SelectItem value="bold">Bold</SelectItem>
                                                        <SelectItem value="black">Black</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">Background Color</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="color"
                                                        value={selectedElement.backgroundColor || '#ffffff'}
                                                        onChange={(e) => setElements(prev => prev.map(el =>
                                                            el.id === selectedElementId ? { ...el, backgroundColor: e.target.value } : el
                                                        ))}
                                                        className="h-8 w-12 p-0 border-none"
                                                    />
                                                    <Input
                                                        value={selectedElement.backgroundColor || '#ffffff'}
                                                        onChange={(e) => setElements(prev => prev.map(el =>
                                                            el.id === selectedElementId ? { ...el, backgroundColor: e.target.value } : el
                                                        ))}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">Opacity ({Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100)}%)</Label>
                                                <Slider
                                                    value={[(selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100]}
                                                    min={0} max={100} step={1}
                                                    onValueChange={([v]) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, opacity: v / 100 } : el))}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedElement.type === 'header' && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Background Color</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="color"
                                                        value={selectedElement.backgroundColor || '#f47424'}
                                                        onChange={(e) => setElements(prev => prev.map(el =>
                                                            el.id === selectedElementId ? { ...el, backgroundColor: e.target.value } : el
                                                        ))}
                                                        className="h-8 w-12 p-0 border-none"
                                                    />
                                                    <Input
                                                        value={selectedElement.backgroundColor || '#f47424'}
                                                        onChange={(e) => setElements(prev => prev.map(el =>
                                                            el.id === selectedElementId ? { ...el, backgroundColor: e.target.value } : el
                                                        ))}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Opacity ({Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100)}%)</Label>
                                                <Slider
                                                    value={[(selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100]}
                                                    min={0} max={100} step={1}
                                                    onValueChange={([v]) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, opacity: v / 100 } : el))}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedElement.type === 'logo' && (
                                        <div className="space-y-2">
                                            <Label className="text-xs">Opacity ({Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100)}%)</Label>
                                            <Slider
                                                value={[(selectedElement.opacity !== undefined ? selectedElement.opacity : 1) * 100]}
                                                min={0} max={100} step={1}
                                                onValueChange={([v]) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, opacity: v / 100 } : el))}
                                            />
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="w-full text-red-500 border-red-100 hover:bg-red-50"
                                        onClick={() => {
                                            setElements(prev => prev.filter(el => el.id !== selectedElementId));
                                            setSelectedElementId(null);
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center space-y-3">
                                <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <Move className="h-6 w-6 text-slate-300" />
                                </div>
                                <p className="text-xs text-slate-500">Select an element to edit properties.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
