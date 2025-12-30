import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Eye, EyeOff, Loader2, Upload, GripVertical, Image as ImageIcon, FileJson } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    useGetLandingPageSettingsQuery,
    useCreateLandingPageSettingsMutation,
    getFileUrl
} from '@/store/services/api';

interface Language {
    code: string;
    name: string;
    flagEmoji: string;
    enabled: boolean;
}

// Internal state structure matching form needs
interface SystemSettingsForm {
    heroMotto: string;
    description: string;
    privacyPolicyContent: string;
    deadlineEnabled: boolean;
    deadlineDate: string;
    contactEmail: string;
    contactLink: string;
    languages: Language[];
    heroSectionConfig: string;
    processTrackerConfig: string;
    infoSectionConfig: string;
    footerConfig: string;
}

const DEFAULT_SETTINGS: SystemSettingsForm = {
    heroMotto: "Cover the Future of Africa",
    description: "Secure your official media accreditation for the African Union Summit.",
    privacyPolicyContent: "<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>",
    deadlineEnabled: true,
    deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contactEmail: "",
    contactLink: "",
    languages: [
        { code: 'en', name: 'English', flagEmoji: '🇺🇸', enabled: true },
        { code: 'fr', name: 'Français', flagEmoji: '🇫🇷', enabled: true },
    ],
    heroSectionConfig: "{}",
    processTrackerConfig: "{}",
    infoSectionConfig: "{}",
    footerConfig: "{}"
};

export function SystemSettings() {
    // API Hooks
    const { data: apiSettings, isLoading } = useGetLandingPageSettingsQuery();
    const [createSettings, { isLoading: isSaving }] = useCreateLandingPageSettingsMutation();

    const [settings, setSettings] = useState<SystemSettingsForm>(DEFAULT_SETTINGS);
    const [showPreview, setShowPreview] = useState(false);
    const [newLang, setNewLang] = useState({ code: '', name: '', flagEmoji: '' });

    // File inputs state
    const [mainLogo, setMainLogo] = useState<File | null>(null);
    const [footerLogo, setFooterLogo] = useState<File | null>(null);
    const [heroBackground, setHeroBackground] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

    // Preview URLs for new uploads
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    // Sync API data to local state
    useEffect(() => {
        if (apiSettings) {
            setSettings({
                heroMotto: apiSettings.heroMotto || DEFAULT_SETTINGS.heroMotto,
                description: apiSettings.description || DEFAULT_SETTINGS.description,
                privacyPolicyContent: apiSettings.privacyPolicyContent || DEFAULT_SETTINGS.privacyPolicyContent,
                deadlineEnabled: !!apiSettings.deadlineDate,
                deadlineDate: apiSettings.deadlineDate ? new Date(apiSettings.deadlineDate).toISOString().split('T')[0] : DEFAULT_SETTINGS.deadlineDate,
                contactEmail: apiSettings.contactEmail || "",
                contactLink: apiSettings.contactLink || "",
                languages: apiSettings.languages && apiSettings.languages.length > 0
                    ? apiSettings.languages.map(l => ({ ...l, enabled: true }))
                    : DEFAULT_SETTINGS.languages,
                heroSectionConfig: JSON.stringify(apiSettings.heroSectionConfig || {}, null, 2),
                processTrackerConfig: JSON.stringify(apiSettings.processTrackerConfig || {}, null, 2),
                infoSectionConfig: JSON.stringify(apiSettings.infoSectionConfig || {}, null, 2),
                footerConfig: JSON.stringify(apiSettings.footerConfig || {}, null, 2),
            });
        }
    }, [apiSettings]);

    const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setGalleryFiles(prev => [...prev, ...newFiles]);

            // Create previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setGalleryPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeGalleryFile = (index: number) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => {
            // Revoke URL to avoid memory leak
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSave = async () => {
        const formData = new FormData();
        formData.append('heroMotto', settings.heroMotto);
        formData.append('description', settings.description);
        formData.append('privacyPolicyContent', settings.privacyPolicyContent);
        formData.append('contactEmail', settings.contactEmail);
        formData.append('contactLink', settings.contactLink);

        if (settings.deadlineEnabled && settings.deadlineDate) {
            formData.append('deadlineDate', new Date(settings.deadlineDate).toISOString());
        }

        // Filter enabled languages and map to API expected format
        const enabledLangs = settings.languages
            .filter(l => l.enabled)
            .map(({ enabled, ...rest }) => rest);
        formData.append('languages', JSON.stringify(enabledLangs));

        // Append configs (parsing to ensure validity or sending as JSON string if API expects string)
        // Adjusting based on requirement "JSON objects" likely means parsing string back to obj before sending, 
        // OR the API handles stringified JSON. The type in API I set to 'any', but multipart/form-data sends strings.
        // I will send valid JSON strings.
        try {
            JSON.parse(settings.heroSectionConfig);
            formData.append('heroSectionConfig', settings.heroSectionConfig);

            JSON.parse(settings.processTrackerConfig);
            formData.append('processTrackerConfig', settings.processTrackerConfig);

            JSON.parse(settings.infoSectionConfig);
            formData.append('infoSectionConfig', settings.infoSectionConfig);

            JSON.parse(settings.footerConfig);
        } catch (e) {
            toast.error("Invalid JSON in Advanced Configuration tabs");
            return;
        }

        if (mainLogo) formData.append('mainLogo', mainLogo);
        if (footerLogo) formData.append('footerLogo', footerLogo);
        if (heroBackground) formData.append('heroBackground', heroBackground);

        // Append Languages as JSON string
        formData.append('languages', JSON.stringify(settings.languages));

        // Append Gallery:
        // 1. Existing URLs as JSON string (backend likely parses this to keep/reorder)
        formData.append('gallery', JSON.stringify(settings.gallery || []));

        // 2. New Files (backend adds these)
        galleryFiles.forEach(file => {
            formData.append('gallery', file);
        });

        // Configs -> ensure they are strings
        formData.append('heroSectionConfig', typeof settings.heroSectionConfig === 'string' ? settings.heroSectionConfig : JSON.stringify(settings.heroSectionConfig));
        formData.append('processTrackerConfig', typeof settings.processTrackerConfig === 'string' ? settings.processTrackerConfig : JSON.stringify(settings.processTrackerConfig));
        formData.append('infoSectionConfig', typeof settings.infoSectionConfig === 'string' ? settings.infoSectionConfig : JSON.stringify(settings.infoSectionConfig));
        formData.append('footerConfig', typeof settings.footerConfig === 'string' ? settings.footerConfig : JSON.stringify(settings.footerConfig));

        try {
            await createSettings(formData).unwrap();
            toast.success("Settings saved successfully");
            setMainLogo(null);
            setFooterLogo(null);
            setHeroBackground(null);
            setGalleryFiles([]);
            setGalleryPreviews([]);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to save settings: " + (error?.data?.message || error.message));
        }
    };

    const toggleLanguage = (code: string) => {
        setSettings(prev => ({
            ...prev,
            languages: prev.languages.map(l => l.code === code ? { ...l, enabled: !l.enabled } : l)
        }));
    };

    const deleteLanguage = (code: string) => {
        setSettings(prev => ({
            ...prev,
            languages: prev.languages.filter(l => l.code !== code)
        }));
    };

    const addLanguage = () => {
        if (!newLang.code || !newLang.name || !newLang.flagEmoji) {
            toast.error("Please fill all language fields");
            return;
        }
        setSettings(prev => ({
            ...prev,
            languages: [...prev.languages, { ...newLang, enabled: true }]
        }));
        setNewLang({ code: '', name: '', flagEmoji: '' });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground">Manage landing page content, branding, and configurations.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-8 h-auto">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="registration">Registration</TabsTrigger>
                    <TabsTrigger value="languages">Languages</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                    <TabsTrigger value="gallery">Gallery</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Landing Page Configuration</CardTitle>
                            <CardDescription>Customize the main texts displayed on the home page.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Hero Motto (Big Text)</Label>
                                <Input
                                    value={settings.heroMotto}
                                    onChange={(e) => setSettings({ ...settings, heroMotto: e.target.value })}
                                    placeholder="e.g. Cover the Future of Africa"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={settings.description}
                                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                    placeholder="Short description of the event..."
                                    className="h-24"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Branding Settings */}
                <TabsContent value="branding" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Branding & Logos</CardTitle>
                            <CardDescription>Upload organization logos and backgrounds.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label>Main Logo</Label>
                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden h-40"
                                        onClick={() => document.getElementById('mainLogoInput')?.click()}
                                    >
                                        {mainLogo ? (
                                            <div className="text-center">
                                                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                                    <Upload className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{mainLogo.name}</p>
                                            </div>
                                        ) : apiSettings?.mainLogoUrl ? (
                                            <img
                                                src={getFileUrl(apiSettings.mainLogoUrl)}
                                                alt="Main Logo"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <Upload className="h-8 w-8 text-gray-300" />
                                        )}
                                        <Input id="mainLogoInput" type="file" className="hidden" accept="image/*" onChange={(e) => setMainLogo(e.target.files?.[0] || null)} />
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground">Header Logo</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Footer Logo</Label>
                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden h-40"
                                        onClick={() => document.getElementById('footerLogoInput')?.click()}
                                    >
                                        {footerLogo ? (
                                            <div className="text-center">
                                                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                                    <Upload className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{footerLogo.name}</p>
                                            </div>
                                        ) : apiSettings?.footerLogoUrl ? (
                                            <img
                                                src={getFileUrl(apiSettings.footerLogoUrl)}
                                                alt="Footer Logo"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <Upload className="h-8 w-8 text-gray-300" />
                                        )}
                                        <Input id="footerLogoInput" type="file" className="hidden" accept="image/*" onChange={(e) => setFooterLogo(e.target.files?.[0] || null)} />
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground">Footer / Partner Logo</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Hero Background</Label>
                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden h-40"
                                        onClick={() => document.getElementById('heroBgInput')?.click()}
                                    >
                                        {heroBackground ? (
                                            <div className="text-center">
                                                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                                    <Upload className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{heroBackground.name}</p>
                                            </div>
                                        ) : apiSettings?.heroBackgroundUrl ? (
                                            <img
                                                src={getFileUrl(apiSettings.heroBackgroundUrl)}
                                                alt="Hero Background"
                                                className="h-full w-full object-cover rounded-md"
                                            />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-gray-300" />
                                        )}
                                        <Input id="heroBgInput" type="file" className="hidden" accept="image/*,video/*" onChange={(e) => setHeroBackground(e.target.files?.[0] || null)} />
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground">Main Banner Image/Video</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Registration Settings */}
                <TabsContent value="registration" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Registration Control</CardTitle>
                            <CardDescription>Manage deadlines and registration availability.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between border p-4 rounded-lg bg-slate-50">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Enforce Deadline</Label>
                                    <p className="text-sm text-muted-foreground">If enabled, registration will close automatically after the date.</p>
                                </div>
                                <Switch
                                    checked={settings.deadlineEnabled}
                                    onCheckedChange={(c) => setSettings({ ...settings, deadlineEnabled: c })}
                                />
                            </div>
                            {settings.deadlineEnabled && (
                                <div className="space-y-2 animate-in fade-in max-w-sm">
                                    <Label>Deadline Date</Label>
                                    <Input
                                        type="date"
                                        value={settings.deadlineDate}
                                        onChange={(e) => setSettings({ ...settings, deadlineDate: e.target.value })}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Languages */}
                <TabsContent value="languages" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Localization</CardTitle>
                            <CardDescription>Manage supported languages.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {settings.languages.map((lang) => (
                                    <div key={lang.code} className={`flex items-center justify-between p-3 rounded-lg border ${lang.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{lang.flagEmoji}</span>
                                            <div>
                                                <p className="font-semibold text-sm">{lang.name}</p>
                                                <p className="text-xs text-muted-foreground uppercase">{lang.code}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Switch
                                                checked={lang.enabled}
                                                onCheckedChange={() => toggleLanguage(lang.code)}
                                                className="scale-75"
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => deleteLanguage(lang.code)} className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                                <Label className="text-sm font-semibold">Add New Language</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <Input value={newLang.code} onChange={e => setNewLang({ ...newLang, code: e.target.value })} placeholder="Code (e.g. es)" />
                                    <Input value={newLang.name} onChange={e => setNewLang({ ...newLang, name: e.target.value })} placeholder="Name (e.g. Spanish)" />
                                    <Input value={newLang.flagEmoji} onChange={e => setNewLang({ ...newLang, flagEmoji: e.target.value })} placeholder="Flag (e.g. 🇪🇸)" />
                                    <Button onClick={addLanguage} className="bg-slate-800 text-white hover:bg-slate-900">
                                        <Plus className="w-4 h-4 mr-2" /> Add
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Compliance */}
                <TabsContent value="compliance" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Privacy Policy</CardTitle>
                                <CardDescription>HTML content for the privacy policy page.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                                {showPreview ? <><EyeOff className="w-4 h-4 mr-2" /> Edit</> : <><Eye className="w-4 h-4 mr-2" /> Preview</>}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {showPreview ? (
                                <div className="border rounded-md p-6 min-h-[400px] prose prose-sm max-w-none bg-gray-50/50" dangerouslySetInnerHTML={{ __html: settings.privacyPolicyContent }} />
                            ) : (
                                <Textarea
                                    value={settings.privacyPolicyContent}
                                    onChange={(e) => setSettings({ ...settings, privacyPolicyContent: e.target.value })}
                                    className="min-h-[400px] font-mono text-sm leading-relaxed"
                                    placeholder="<h1>Privacy Policy</h1>..."
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contact */}
                <TabsContent value="contact" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>Public contact details for support.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-lg">
                            <div className="space-y-2">
                                <Label>Support Email</Label>
                                <Input
                                    value={settings.contactEmail}
                                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                    placeholder="contact@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Support Link / Help Desk</Label>
                                <Input
                                    value={settings.contactLink}
                                    onChange={(e) => setSettings({ ...settings, contactLink: e.target.value })}
                                    placeholder="https://support.example.com"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Gallery */}
                <TabsContent value="gallery" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Media Gallery</CardTitle>
                            <CardDescription>Images and videos displayed in the landing page gallery section.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Existing Gallery (Mocked for now as API response structure for existing gallery is array of strings, need to render them) */}
                            {apiSettings?.gallery && apiSettings.gallery.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Current Gallery</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {apiSettings.gallery.map((url, i) => (
                                            <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-gray-100 group">
                                                <img src={getFileUrl(url)} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                                {/* Delete functionality for existing would require separate endpoint or logic, skipping for now */}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Upload New Media</Label>
                                <div
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('galleryInput')?.click()}
                                >
                                    <ImageIcon className="h-10 w-10 text-gray-300" />
                                    <span className="text-sm text-gray-500 font-medium">Click to upload multiple images/videos</span>
                                    <Input id="galleryInput" type="file" multiple className="hidden" accept="image/*,video/*" onChange={handleGallerySelect} />
                                </div>
                            </div>

                            {/* Previews of new files */}
                            {galleryPreviews.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
                                    {galleryPreviews.map((url, i) => (
                                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-gray-100 group">
                                            <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeGalleryFile(i)}
                                                className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Advanced */}
                <TabsContent value="advanced" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Advanced Configuration</CardTitle>
                            <CardDescription>Raw JSON configurations for dynamic sections.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileJson className="w-4 h-4 text-blue-500" />
                                    <Label>Hero Section Config</Label>
                                </div>
                                <Textarea
                                    value={settings.heroSectionConfig}
                                    onChange={(e) => setSettings({ ...settings, heroSectionConfig: e.target.value })}
                                    className="font-mono text-xs h-40"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileJson className="w-4 h-4 text-blue-500" />
                                    <Label>Process Tracker Config</Label>
                                </div>
                                <Textarea
                                    value={settings.processTrackerConfig}
                                    onChange={(e) => setSettings({ ...settings, processTrackerConfig: e.target.value })}
                                    className="font-mono text-xs h-40"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileJson className="w-4 h-4 text-blue-500" />
                                    <Label>Info Section Config</Label>
                                </div>
                                <Textarea
                                    value={settings.infoSectionConfig}
                                    onChange={(e) => setSettings({ ...settings, infoSectionConfig: e.target.value })}
                                    className="font-mono text-xs h-40"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileJson className="w-4 h-4 text-blue-500" />
                                    <Label>Footer Config</Label>
                                </div>
                                <Textarea
                                    value={settings.footerConfig}
                                    onChange={(e) => setSettings({ ...settings, footerConfig: e.target.value })}
                                    className="font-mono text-xs h-40"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}