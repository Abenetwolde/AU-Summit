import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    LayoutTemplate,
    Save,
    Trash2,
    Upload,
    Globe,
    Calendar as CalendarIcon,
    Mail,
    Link as LinkIcon,
    Shield,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
    useGetLandingPageSettingsQuery,
    useCreateLandingPageSettingsMutation,
    useDeleteLandingPageSettingsMutation,
    LandingPageSettings as LandingPageSettingsType
} from '@/store/services/api';
import { format } from 'date-fns';

export function LandingPageSettings() {
    const { data: settings, isLoading } = useGetLandingPageSettingsQuery();
    const [createSettings, { isLoading: isSaving }] = useCreateLandingPageSettingsMutation();
    const [deleteSettings, { isLoading: isDeleting }] = useDeleteLandingPageSettingsMutation();

    // Form State
    const [heroMotto, setHeroMotto] = useState('');
    const [description, setDescription] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactLink, setContactLink] = useState('');
    const [privacyPolicyContent, setPrivacyPolicyContent] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');
    const [languages, setLanguages] = useState<{ name: string; code: string; flagEmoji: string }[]>([]);

    // File State
    const [mainLogo, setMainLogo] = useState<File | null>(null);
    const [footerLogo, setFooterLogo] = useState<File | null>(null);

    // Initial load
    useEffect(() => {
        if (settings) {
            setHeroMotto(settings.heroMotto || '');
            setDescription(settings.description || '');
            setContactEmail(settings.contactEmail || '');
            setContactLink(settings.contactLink || '');
            setPrivacyPolicyContent(settings.privacyPolicyContent || '');
            setDeadlineDate(settings.deadlineDate ? new Date(settings.deadlineDate).toISOString().split('T')[0] : '');
            setLanguages(settings.languages || []);
        }
    }, [settings]);

    const handleSave = async () => {
        const formData = new FormData();
        if (heroMotto) formData.append('heroMotto', heroMotto);
        if (description) formData.append('description', description);
        if (contactEmail) formData.append('contactEmail', contactEmail);
        if (contactLink) formData.append('contactLink', contactLink);
        if (privacyPolicyContent) formData.append('privacyPolicyContent', privacyPolicyContent);
        if (deadlineDate) formData.append('deadlineDate', new Date(deadlineDate).toISOString());
        if (languages.length > 0) formData.append('languages', JSON.stringify(languages));

        if (mainLogo) formData.append('mainLogo', mainLogo);
        if (footerLogo) formData.append('footerLogo', footerLogo);

        try {
            await createSettings(formData).unwrap();
            toast.success("Landing page settings saved successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to save settings. " + (error?.data?.message || ''));
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete all landing page settings? This cannot be undone.")) {
            try {
                await deleteSettings().unwrap();
                toast.success("Settings deleted successfully.");
                // Reset form
                setHeroMotto('');
                setDescription('');
                setContactEmail('');
                setContactLink('');
                setPrivacyPolicyContent('');
                setDeadlineDate('');
                setLanguages([]);
                setMainLogo(null);
                setFooterLogo(null);
            } catch (error) {
                toast.error("Failed to delete settings.");
            }
        }
    };

    const addLanguage = () => {
        setLanguages([...languages, { name: 'English', code: 'en', flagEmoji: '🇺🇸' }]);
    };

    const updateLanguage = (index: number, field: keyof typeof languages[0], value: string) => {
        const newLangs = [...languages];
        newLangs[index] = { ...newLangs[index], [field]: value };
        setLanguages(newLangs);
    };

    const removeLanguage = (index: number) => {
        setLanguages(languages.filter((_, i) => i !== index));
    };

    if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Landing Page Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure the public-facing portal content and branding</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleDelete} disabled={isDeleting}>
                        <Trash2 className="h-4 w-4 mr-2" /> Reset Defaults
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" /> Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LayoutTemplate className="h-5 w-5 text-blue-500" />
                                Hero Section
                            </CardTitle>
                            <CardDescription>Main headline and introductory text</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Hero Motto</Label>
                                <Input
                                    value={heroMotto}
                                    onChange={(e) => setHeroMotto(e.target.value)}
                                    placeholder="e.g. Welcome to the AU Summit 2025"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter a brief description for the landing page..."
                                    className="h-24"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-green-500" />
                                Supported Languages
                            </CardTitle>
                            <CardDescription>Manage available languages for the portal</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {languages.map((lang, index) => (
                                <div key={index} className="flex gap-2 items-end p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs">Language Name</Label>
                                        <Input value={lang.name} onChange={(e) => updateLanguage(index, 'name', e.target.value)} className="h-8 text-sm" />
                                    </div>
                                    <div className="w-20 space-y-1">
                                        <Label className="text-xs">Code</Label>
                                        <Input value={lang.code} onChange={(e) => updateLanguage(index, 'code', e.target.value)} className="h-8 text-sm" placeholder="en" />
                                    </div>
                                    <div className="w-20 space-y-1">
                                        <Label className="text-xs">Flag</Label>
                                        <Input value={lang.flagEmoji} onChange={(e) => updateLanguage(index, 'flagEmoji', e.target.value)} className="h-8 text-sm" placeholder="🇺🇸" />
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeLanguage(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addLanguage} className="w-full border-dashed">
                                + Add Language
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-purple-500" />
                                Privacy Policy
                            </CardTitle>
                            <CardDescription>HTML content for the privacy policy page</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={privacyPolicyContent}
                                onChange={(e) => setPrivacyPolicyContent(e.target.value)}
                                placeholder="<h1>Privacy Policy</h1><p>...</p>"
                                className="h-48 font-mono text-sm"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Branding & Contact */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Branding Assets</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Main Logo</Label>
                                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer relative" onClick={() => document.getElementById('mainLogoInput')?.click()}>
                                    {settings?.mainLogoUrl || mainLogo ? (
                                        <div className="text-sm font-bold text-green-600 truncate">
                                            {mainLogo ? mainLogo.name : 'Current Logo Set'}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Upload className="h-6 w-6" />
                                            <span className="text-xs">Upload Main Logo</span>
                                        </div>
                                    )}
                                    <input id="mainLogoInput" type="file" className="hidden" accept="image/*" onChange={(e) => setMainLogo(e.target.files?.[0] || null)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Footer Logo</Label>
                                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer" onClick={() => document.getElementById('footerLogoInput')?.click()}>
                                    {settings?.footerLogoUrl || footerLogo ? (
                                        <div className="text-sm font-bold text-green-600 truncate">
                                            {footerLogo ? footerLogo.name : 'Current Logo Set'}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Upload className="h-6 w-6" />
                                            <span className="text-xs">Upload Footer Logo</span>
                                        </div>
                                    )}
                                    <input id="footerLogoInput" type="file" className="hidden" accept="image/*" onChange={(e) => setFooterLogo(e.target.files?.[0] || null)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" /> Registration Deadline
                                </Label>
                                <Input
                                    type="date"
                                    value={deadlineDate}
                                    onChange={(e) => setDeadlineDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" /> Contact Email
                                </Label>
                                <Input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="contact@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4" /> Contact Link
                                </Label>
                                <Input
                                    value={contactLink}
                                    onChange={(e) => setContactLink(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
