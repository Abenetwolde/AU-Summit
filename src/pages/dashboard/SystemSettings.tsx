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
import { Badge } from '@/components/ui/badge';
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
    heroBackgroundUrls: string[];
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
    heroBackgroundUrls: [],
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
    const [newHeroFiles, setNewHeroFiles] = useState<File[]>([]);

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
                heroBackgroundUrls: apiSettings.heroBackgroundUrls || [],
            });
        }
    }, [apiSettings]);



    const handleSave = async () => {
        const formData = new FormData();
        formData.append('heroMotto', settings.heroMotto);
        formData.append('description', settings.description);

        formData.append('contactEmail', settings.contactEmail);
        formData.append('contactLink', settings.contactLink);

        if (settings.deadlineEnabled && settings.deadlineDate) {
            formData.append('deadlineDate', new Date(settings.deadlineDate).toISOString());
        }

        // Filter enabled languages and map to API expected format
        const enabledLangs = settings.languages
            .filter(l => l.enabled)
            .map(({ enabled, ...rest }) => rest);
        // formData.append('languages', JSON.stringify(enabledLangs));



        if (mainLogo) formData.append('mainLogo', mainLogo);
        if (footerLogo) formData.append('footerLogo', footerLogo);

        // Handle Hero Background Gallery
        // Filter out temporary blob URLs (they represent new files)
        const existingUrls = settings.heroBackgroundUrls.filter(url => !url.startsWith('blob:'));
        formData.append('heroBackgroundUrls', JSON.stringify(existingUrls));

        // Append new files
        newHeroFiles.forEach(file => {
            formData.append('heroBackgroundUrl', file);
        });

        // Append Languages as JSON string
        formData.append('languages', JSON.stringify(settings.languages));

        formData.append('privacyPolicyContent', settings.privacyPolicyContent);
        try {
            await createSettings(formData).unwrap();
            toast.success("Settings saved successfully");
            setMainLogo(null);
            setFooterLogo(null);
            setNewHeroFiles([]);
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
        <div className="space-y-6 w-full pb-10">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                            </div>

                            <Separator />

                            <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-bold">Hero Background Gallery</Label>
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                                        {settings.heroBackgroundUrls?.length || 0} / 5 Images
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Upload up to 5 high-quality images for the hero section background.
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                                    {/* Existing Images */}
                                    {settings.heroBackgroundUrls?.map((url, index) => (
                                        <div key={index} className="group relative aspect-video rounded-xl overflow-hidden border bg-slate-100 shadow-sm hover:shadow-md transition-all">
                                            <img
                                                src={url}
                                                alt={`Hero ${index + 1}`}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full shadow-lg"
                                                    onClick={() => {
                                                        setSettings(prev => ({
                                                            ...prev,
                                                            heroBackgroundUrls: prev.heroBackgroundUrls.filter((_, i) => i !== index)
                                                        }));
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-white font-bold">
                                                #{index + 1}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Dropzone for New Images */}
                                    {(settings.heroBackgroundUrls?.length || 0) < 5 && (
                                        <div
                                            onClick={() => document.getElementById('heroGalleryInput')?.click()}
                                            className="aspect-video rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                                <Plus className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add Image</span>
                                            <Input
                                                id="heroGalleryInput"
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    const remaining = 5 - (settings.heroBackgroundUrls?.length || 0);
                                                    const toAdd = files.slice(0, remaining);

                                                    if (files.length > remaining) {
                                                        toast.warning(`You can only add ${remaining} more images.`);
                                                    }

                                                    // Store actual files in state if needed, or just handle URLs for now
                                                    // For simplicity, we'll store them in a temporary 'newHeroFiles' state
                                                    setNewHeroFiles(prev => [...prev, ...toAdd]);

                                                    // Create temporary preview URLs
                                                    const newPreviews = toAdd.map(f => URL.createObjectURL(f));
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        heroBackgroundUrls: [...(prev.heroBackgroundUrls || []), ...newPreviews]
                                                    }));
                                                }}
                                            />
                                        </div>
                                    )}
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



            </Tabs>
        </div>
    );
}
