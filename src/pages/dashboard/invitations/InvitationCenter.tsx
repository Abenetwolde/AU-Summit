import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, History, Mail, FileText, Send } from "lucide-react";
import { DesignGallery } from './components/DesignGallery';
import { ConfigList } from './components/ConfigList';
import { SendingHistory } from './components/SendingHistory';
import { LetterEditor } from './components/LetterEditor';
import { BulkSendTool } from './components/BulkSendTool';
import { LetterConfig } from '@/store/services/api';

export const InvitationCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState("designs");
    const [editingConfig, setEditingConfig] = useState<LetterConfig | null>(null);
    const [sendingConfig, setSendingConfig] = useState<LetterConfig | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

    // Navigation helpers
    const goToEditor = (templateId: number) => {
        setSelectedTemplateId(templateId);
        setEditingConfig(null);
        setActiveTab("editor");
    };

    const editConfig = (config: LetterConfig) => {
        setEditingConfig(config);
        setSelectedTemplateId(config.templateId);
        setActiveTab("editor");
    };

    const goToSend = (config: LetterConfig) => {
        setSendingConfig(config);
        setActiveTab("bulk-send");
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invitation Center</h1>
                <p className="text-gray-500">Design, customize, and bulk send personalized invitation letters.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-8 bg-slate-100 p-1 rounded-xl h-auto">
                    <TabsTrigger value="designs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">
                        <Palette className="h-4 w-4 mr-2" /> Designs
                    </TabsTrigger>
                    <TabsTrigger value="configs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">
                        <FileText className="h-4 w-4 mr-2" /> Saved Configs
                    </TabsTrigger>
                    <TabsTrigger value="editor" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">
                        <Mail className="h-4 w-4 mr-2" /> Letter Editor
                    </TabsTrigger>
                    <TabsTrigger value="bulk-send" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">
                        <Send className="h-4 w-4 mr-2" /> Bulk Send
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">
                        <History className="h-4 w-4 mr-2" /> History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="designs">
                    <DesignGallery onSelect={goToEditor} />
                </TabsContent>

                <TabsContent value="configs">
                    <ConfigList onEdit={editConfig} onSend={goToSend} />
                </TabsContent>

                <TabsContent value="editor">
                    <LetterEditor
                        templateId={selectedTemplateId}
                        existingConfig={editingConfig}
                        onSaved={() => setActiveTab("configs")}
                        onCancel={() => setActiveTab("designs")}
                    />
                </TabsContent>

                <TabsContent value="bulk-send">
                    <BulkSendTool
                        config={sendingConfig}
                    />
                </TabsContent>

                <TabsContent value="history">
                    <SendingHistory />
                </TabsContent>
            </Tabs>
        </div>
    );
};
