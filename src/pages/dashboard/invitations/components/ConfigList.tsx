import React from 'react';
import { useGetLetterConfigsQuery, useDeleteLetterConfigMutation, LetterConfig } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Send, Trash2, FileText, Calendar, Layout } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
    onEdit: (config: LetterConfig) => void;
    onSend: (config: LetterConfig) => void;
}

export const ConfigList: React.FC<Props> = ({ onEdit, onSend }) => {
    const { data: configs, isLoading } = useGetLetterConfigsQuery();
    const [deleteConfig] = useDeleteLetterConfigMutation();

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this configuration?")) return;
        try {
            await deleteConfig(id).unwrap();
            toast.success("Configuration deleted");
        } catch (err) {
            toast.error("Failed to delete configuration");
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
        );
    }

    if (!configs || configs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50 border-2 border-dashed rounded-2xl">
                <FileText className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900">No Saved Configurations</h3>
                <p className="text-slate-500 text-center">Customize a design from the gallery to save it here.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map(config => (
                <Card key={config.id} className="group overflow-hidden border-slate-200 hover:border-primary/50 transition-all hover:shadow-lg bg-white">
                    <CardHeader className="p-5 pb-2">
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                                {config.template?.name || 'Unknown Template'}
                            </Badge>
                            {config.isActive && (
                                <Badge className="bg-green-500 text-white text-[10px]">Active</Badge>
                            )}
                        </div>
                        <CardTitle className="text-xl font-bold">{config.name}</CardTitle>
                        <CardDescription className="text-xs line-clamp-1">{config.description || 'No description provided'}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-4 space-y-4">
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Layout className="h-3.5 w-3.5" />
                                <span>{config.paragraphs.length} paragraphs configured</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Created {new Date(config.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-4 border-top border-slate-100 mt-2">
                            <Button
                                onClick={() => onEdit(config)}
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs border-slate-200 hover:bg-slate-50"
                            >
                                <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit Design
                            </Button>
                            <Button
                                onClick={() => onSend(config)}
                                size="sm"
                                className="h-9 text-xs bg-primary hover:bg-primary/90 text-white"
                            >
                                <Send className="h-3.5 w-3.5 mr-2" /> Bulk Send
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(config.id)}
                            className="w-full text-xs text-slate-400 hover:text-red-500 h-8 mt-2"
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Configuration
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
