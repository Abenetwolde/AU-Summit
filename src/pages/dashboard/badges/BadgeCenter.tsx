import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Layout, Settings as SettingsIcon, History, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BadgeDesigner } from './components/BadgeDesigner';
import { BadgeConfigList } from './components/BadgeConfigList';
import { BadgeGallery } from './components/BadgeGallery';
import { ManualBadgePrint } from './ManualBadgePrint';
import { BadgeHistory } from './components/BadgeHistory';
import { useAuth } from '@/auth/context';

export function BadgeCenter() {
    const { user } = useAuth()
    const readOnly = user?.role === 'PMO';
    const [activeTab, setActiveTab] = useState('configs');
    const [editingConfigId, setEditingConfigId] = useState<number | null>(null);

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 font-sans">Badge Center</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Design, configure, and manage event badges with automatic QR integration.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => {
                            setEditingConfigId(null);
                            setActiveTab('designer');
                        }}
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95 px-5 sm:px-6 h-10 sm:h-11 text-sm sm:text-base font-bold"
                        disabled={readOnly}
                    >
                        <Plus className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                        Create New Config
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex w-full overflow-x-auto justify-start lg:w-auto h-auto min-h-12 p-1.5 bg-gray-100/80 backdrop-blur-sm border border-gray-200 shadow-sm rounded-2xl mb-8 scrollbar-none">
                    <TabsTrigger value="configs" className="shrink-0 whitespace-nowrap rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-bold text-xs sm:text-sm py-2 px-3">
                        <SettingsIcon className="mr-1.5 sm:mr-2 h-4 w-4" />
                        Configurations
                    </TabsTrigger>
                    <TabsTrigger value="designer" className="shrink-0 whitespace-nowrap rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-bold text-xs sm:text-sm py-2 px-3">
                        <Layout className="mr-1.5 sm:mr-2 h-4 w-4" />
                        Designer
                    </TabsTrigger>
                    <TabsTrigger value="gallery" className="shrink-0 whitespace-nowrap rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-bold text-xs sm:text-sm py-2 px-3">
                        <BadgeCheck className="mr-1.5 sm:mr-2 h-4 w-4" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="manual-print" className="shrink-0 whitespace-nowrap rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-bold text-xs sm:text-sm py-2 px-3">
                        <Printer className="mr-1.5 sm:mr-2 h-4 w-4" />
                        Manual Print
                    </TabsTrigger>
                    <TabsTrigger value="history" className="shrink-0 whitespace-nowrap rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all font-bold text-xs sm:text-sm py-2 px-3">
                        <History className="mr-1.5 sm:mr-2 h-4 w-4" />
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

                <TabsContent value="manual-print" className="focus-visible:outline-none">
                    <ManualBadgePrint />
                </TabsContent>

                <TabsContent value="history" className="focus-visible:outline-none">
                    <BadgeHistory />
                </TabsContent>
            </Tabs>
        </div>
    );
}
