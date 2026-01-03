import React from 'react';
import { useGetSentInvitationLogsQuery } from '@/store/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Search, Download, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const SendingHistory: React.FC = () => {
    const { data: logs, isLoading } = useGetSentInvitationLogsQuery();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50 border-2 border-dashed rounded-2xl">
                <History className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900">No History Yet</h3>
                <p className="text-slate-500 text-center">Your sent invitations will appear here for auditing.</p>
            </div>
        );
    }

    return (
        <Card className="border-slate-200">
            <CardHeader className="bg-slate-50/30 border-b p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold">Sending Logs</CardTitle>
                        <CardDescription>Audit trail of all personalized invitations sent through the system.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input placeholder="Search recipients..." className="pl-9 h-9 text-xs" />
                        </div>
                        <Button variant="outline" size="sm" className="h-9 text-xs">
                            <Download className="h-3.5 w-3.5 mr-2" /> Export CSV
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="text-[10px] items-center font-bold uppercase tracking-widest pl-8">Recipient</TableHead>
                            <TableHead className="text-[10px] items-center font-bold uppercase tracking-widest">Configuration</TableHead>
                            <TableHead className="text-[10px] items-center font-bold uppercase tracking-widest">Sent Date</TableHead>
                            <TableHead className="text-[10px] items-center font-bold uppercase tracking-widest">Status</TableHead>
                            <TableHead className="text-[10px] items-center font-bold uppercase tracking-widest pr-8 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="py-4 pl-8">
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">{(log as any).user?.fullName || 'Bulk Recipient'}</p>
                                        <p className="text-xs text-slate-500">{log.recipientEmail}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium">{(log as any).config?.name || 'Manual Send'}</p>
                                        <Badge variant="outline" className="w-fit text-[9px] h-4 bg-white">
                                            {(log as any).config?.template?.name || 'Default'}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Clock className="h-3 w-3" />
                                        {new Date(log.sentAt!).toLocaleString()}
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    {log.status === 'sent' && (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1.5 font-bold h-6">
                                            <CheckCircle2 className="h-3 w-3" /> Delivered
                                        </Badge>
                                    )}
                                    {log.status === 'failed' && (
                                        <Badge variant="destructive" className="gap-1.5 font-bold h-6">
                                            <AlertCircle className="h-3 w-3" /> Failed
                                        </Badge>
                                    )}
                                    {log.status === 'pending' && (
                                        <Badge variant="secondary" className="gap-1.5 font-bold h-6 animate-pulse">
                                            Processing
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="py-4 pr-8 text-right">
                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:bg-primary/5 font-bold">
                                        View Details
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
