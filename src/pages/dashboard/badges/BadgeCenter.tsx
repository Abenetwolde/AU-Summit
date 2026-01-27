import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Layout, Settings as SettingsIcon, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BadgeDesigner } from './components/BadgeDesigner';
import { BadgeConfigList } from './components/BadgeConfigList';
import { BadgeGallery } from './components/BadgeGallery';
import { useAuth } from '@/auth/context';

export function BadgeCenter() {
    const {user}=useAuth()
    const readOnly = user?.role === 'PMO';
    const [activeTab, setActiveTab] = useState('configs');
    const [editingConfigId, setEditingConfigId] = useState<number | null>(null);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Badge Center</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Design, configure, and manage event badges with automatic QR integration.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => {
                            setEditingConfigId(null);
                            setActiveTab('designer');
                        }}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95 px-6 h-11 text-base font-bold"
                        disabled={readOnly}
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Create New Config
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] h-14 p-1.5 bg-gray-100/80 backdrop-blur-sm border border-gray-200 shadow-sm rounded-2xl mb-12">
                    <TabsTrigger value="configs" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-bold text-sm">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Configurations
                    </TabsTrigger>
                    <TabsTrigger value="designer" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-bold text-sm">
                        <Layout className="mr-2 h-4 w-4" />
                        Designer
                    </TabsTrigger>
                    <TabsTrigger value="gallery" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-bold text-sm">
                        <BadgeCheck className="mr-2 h-4 w-4" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-bold text-sm">
                        <History className="mr-2 h-4 w-4" />
                        History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="configs" className="space-y-6 focus-visible:outline-none">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-black text-slate-900 font-sans">Stored Configurations</h2>
                    </div>
                    <BadgeConfigList
                        onEdit={(config) => {
                            setEditingConfigId(config.id);
                            setActiveTab('designer');
                        }}
                    />
                </TabsContent>

                <TabsContent value="designer" className="focus-visible:outline-none">
                    <BadgeDesigner
                        configId={editingConfigId}
                        onSave={() => {
                            setEditingConfigId(null);
                            setActiveTab('configs');
                        }}
                    />
                </TabsContent>

                <TabsContent value="gallery" className="focus-visible:outline-none">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 font-sans">Design Gallery</h2>
                            <p className="text-slate-500">Choose a starting point for your custom badge design.</p>
                        </div>
                    </div>
                    <BadgeGallery onSelect={() => {
                        setActiveTab('designer');
                    }} />
                </TabsContent>

                <TabsContent value="history" className="focus-visible:outline-none">
                    <Card className="border-0 shadow-xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 pb-8 border-b">
                            <CardTitle className="font-sans text-xl font-bold">Generation Logs</CardTitle>
                            <CardDescription>Comprehensive history of all badges generated by the system.</CardDescription>
                        </CardHeader>
                        <CardContent className="min-h-[400px] flex flex-col items-center justify-center p-12">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <History className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No logs yet</h3>
                            <p className="text-slate-500 max-w-sm text-center mt-2">
                                When you start generating badges for approved journalists, the records will appear here for tracking and re-download.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
