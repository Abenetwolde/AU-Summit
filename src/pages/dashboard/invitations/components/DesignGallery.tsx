import React from 'react';
import { useGetInvitationTemplatesQuery } from '@/store/services/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette, ArrowRight } from "lucide-react";

interface Props {
    onSelect: (id: number) => void;
}

export const DesignGallery: React.FC<Props> = ({ onSelect }) => {
    const { data: templates, isLoading } = useGetInvitationTemplatesQuery();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {templates?.map((template) => (
                    <Card key={template.id} className="group overflow-hidden border-slate-200 hover:border-primary/50 transition-all hover:shadow-lg bg-white">
                        <div className="h-48 bg-slate-50 flex items-center justify-center p-4 border-b">
                            {/* Visual Placeholder for the template style */}
                            <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center bg-white/50 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                                <Palette className="h-10 w-10 text-slate-300 group-hover:text-primary/30 mb-2" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{template.name} Style</span>
                            </div>
                        </div>
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg font-bold truncate">{template.name}</CardTitle>
                            <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
                                {template.description}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                            <Button
                                onClick={() => onSelect(template.id)}
                                className="w-full bg-slate-900 hover:bg-primary text-white transition-colors h-9 text-xs"
                            >
                                Select Design <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};
