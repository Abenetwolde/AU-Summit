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

    return (
        <div className="space-y-6 w-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invitation Center</h1>
                <p className="text-gray-500">Design, customize, and bulk send personalized invitation letters.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl h-auto">
                    <TabsTrigger value="designs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">
                        <Palette className="h-4 w-4 mr-2" /> Designs
                    </TabsTrigger>
                    <TabsTrigger value="configs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">
                        <FileText className="h-4 w-4 mr-2" /> Saved Configs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="designs">
                    <DesignGallery onSelect={() => { }} />
                </TabsContent>

                <TabsContent value="configs">
                    <ConfigList onEdit={() => { }} onSend={() => { }} />
                </TabsContent>
            </Tabs>
        </div>
    );
};
