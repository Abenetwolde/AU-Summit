import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Language {
    code: string;
    name: string;
    flag: string;
    enabled: boolean;
}

interface SystemSettings {
    motto: string;
    description: string;
    privacyPolicy: string;
    deadlineEnabled: boolean;
    deadlineDate: string;
    languages: Language[];
}

const DEFAULT_SETTINGS: SystemSettings = {
    motto: "Cover the Future of Africa",
    description: "Secure your official media accreditation for the African Union Summit. A streamlined, secure, and fully digital invitation process for global journalists.",
    privacyPolicy: "<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>",
    deadlineEnabled: true,
    deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    languages: [
        { code: 'en', name: 'English', flag: '🇺🇸', enabled: true },
        { code: 'es', name: 'Español', flag: '🇪🇸', enabled: true },
        { code: 'fr', name: 'Français', flag: '🇫🇷', enabled: true },
        { code: 'it', name: 'Italiano', flag: '🇮🇹', enabled: true },
        { code: 'sw', name: 'Kiswahili', flag: '🇰🇪', enabled: true },
    ]
};

export function SystemSettings() {
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
    const [showPreview, setShowPreview] = useState(false);
    const [newLang, setNewLang] = useState({ code: '', name: '', flag: '' });

    useEffect(() => {
        const saved = localStorage.getItem('system_settings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('system_settings', JSON.stringify(settings));
        toast.success("Settings saved successfully");
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
        if (!newLang.code || !newLang.name || !newLang.flag) {
            toast.error("Please fill all language fields");
            return;
        }
        setSettings(prev => ({
            ...prev,
            languages: [...prev.languages, { ...newLang, enabled: true }]
        }));
        setNewLang({ code: '', name: '', flag: '' });
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground">Manage landing page content, localization, and policies.</p>
                </div>
                <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" /> Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Landing Page Configuration</CardTitle>
                        <CardDescription>Customize the main texts displayed on the home page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Hero Motto (Big Text)</Label>
                            <Input
                                value={settings.motto}
                                onChange={(e) => setSettings({ ...settings, motto: e.target.value })}
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

                {/* Logo Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Branding & Logos</CardTitle>
                        <CardDescription>Upload organization logos for the header and documents.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Main Logo</Label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer">
                                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Plus className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <span className="text-sm text-gray-500">Click to upload main logo</span>
                                    <Input type="file" className="hidden" accept="image/*" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Footer Logo / Partner Logo</Label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer">
                                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Plus className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <span className="text-sm text-gray-500">Click to upload partner logo</span>
                                    <Input type="file" className="hidden" accept="image/*" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Registration Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Registration Control</CardTitle>
                        <CardDescription>Manage deadlines and registration availability.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border p-4 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-base">Registration Deadline</Label>
                                <p className="text-sm text-muted-foreground">Enable to show countdown and block access after date.</p>
                            </div>
                            <Switch
                                checked={settings.deadlineEnabled}
                                onCheckedChange={(c) => setSettings({ ...settings, deadlineEnabled: c })}
                            />
                        </div>
                        {settings.deadlineEnabled && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label>Deadline Date</Label>
                                <Input
                                    type="date"
                                    value={settings.deadlineDate}
                                    onChange={(e) => setSettings({ ...settings, deadlineDate: e.target.value })}
                                    className="max-w-xs"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Language Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Localization</CardTitle>
                        <CardDescription>Manage available languages for the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {settings.languages.map((lang) => (
                                <div key={lang.code} className="flex items-center justify-between bg-secondary/20 p-3 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{lang.flag}</span>
                                        <div>
                                            <p className="font-medium">{lang.name}</p>
                                            <p className="text-xs text-muted-foreground uppercase">{lang.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={lang.enabled}
                                            onCheckedChange={() => toggleLanguage(lang.code)}
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => deleteLanguage(lang.code)} className="text-destructive hover:text-destructive/90">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="grid grid-cols-4 gap-2 items-end">
                            <div className="space-y-1">
                                <Label className="text-xs">Code</Label>
                                <Input value={newLang.code} onChange={e => setNewLang({ ...newLang, code: e.target.value })} placeholder="en" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Name</Label>
                                <Input value={newLang.name} onChange={e => setNewLang({ ...newLang, name: e.target.value })} placeholder="English" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Flag Emoji</Label>
                                <Input value={newLang.flag} onChange={e => setNewLang({ ...newLang, flag: e.target.value })} placeholder="🇺🇸" />
                            </div>
                            <Button onClick={addLanguage} variant="secondary" className="gap-2">
                                <Plus className="w-4 h-4" /> Add
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy Policy */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Privacy Policy</CardTitle>
                                <CardDescription>Edit the HTML content for the privacy policy page.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                                {showPreview ? <><EyeOff className="w-4 h-4 mr-2" /> Editor</> : <><Eye className="w-4 h-4 mr-2" /> Preview</>}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {showPreview ? (
                            <div className="border rounded-md p-4 min-h-[300px] prose prose-sm max-w-none bg-white lg:prose-lg" dangerouslySetInnerHTML={{ __html: settings.privacyPolicy }} />
                        ) : (
                            <Textarea
                                value={settings.privacyPolicy}
                                onChange={(e) => setSettings({ ...settings, privacyPolicy: e.target.value })}
                                className="min-h-[300px] font-mono text-sm"
                                placeholder="<h1>Title</h1><p>Content...</p>"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
