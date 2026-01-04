import React, { useState } from 'react';
import { LetterConfig, useBulkSendInvitationsMutation } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileUp, CheckCircle2, ChevronRight, Users, AlertCircle } from "lucide-react";
import Papa from 'papaparse';
import { toast } from "sonner";

interface Props {
    config: LetterConfig | null;
}

export const BulkSendTool: React.FC<Props> = ({ config }) => {
    const [step, setStep] = useState(1);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [bulkSend, { isLoading: isSending }] = useBulkSendInvitationsMutation();

    const placeholders = ['userName', 'email', 'eventTitle', 'organization', 'referenceNumber', 'date', 'venue'];

    const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data.length > 0) {
                    setCsvData(results.data);
                    setHeaders(Object.keys(results.data[0] as object));
                    setStep(2);
                    toast.success(`Successfully parsed ${results.data.length} records`);
                }
            },
            error: (err) => {
                toast.error("Failed to parse CSV: " + err.message);
            }
        });
    };

    const handleMappingChange = (placeholder: string, header: string) => {
        setMapping(prev => ({ ...prev, [placeholder]: header }));
    };

    const handleSend = async () => {
        if (!config) return;

        // Transform CSV data to match placeholders
        const usersToSend = csvData.map(row => {
            const userData: any = {};
            Object.keys(mapping).forEach(p => {
                userData[p] = (row as any)[mapping[p]];
            });
            // Ensure ID and email are present if possible
            userData.email = userData.email || row['email'] || row['Email'];
            return userData;
        });

        try {
            await bulkSend({ configId: config.id, users: usersToSend }).unwrap();
            setStep(3);
            toast.success(`Started sending ${usersToSend.length} invitations`);
        } catch (err) {
            toast.error("Failed to start bulk send");
        }
    };

    if (!config) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50 border-2 border-dashed rounded-2xl">
                <FileUp className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900">No Configuration Selected</h3>
                <p className="text-slate-500 mb-6 text-center">Select a saved configuration from the "Saved Configs" tab to send letters.</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-20">
            {/* Steps Indicator */}
            <div className="flex items-center justify-between px-10 mb-10">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= i ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                            {i}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${step >= i ? 'text-slate-900' : 'text-slate-400'}`}>
                            {i === 1 ? 'Upload' : i === 2 ? 'Map Columns' : 'Finished'}
                        </span>
                        {i < 3 && <div className={`w-12 h-0.5 ${step > i ? 'bg-primary' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <Card className="border-slate-200 bg-white">
                    <CardHeader className="text-center p-10">
                        <div className="bg-primary/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Upload className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Upload Recipient List</CardTitle>
                        <CardDescription>
                            Upload a CSV file containing the data for your invitations.
                            The system will help you map columns to your letter placeholders.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-0 text-center">
                        <label className="block w-full cursor-pointer">
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 hover:border-primary/50 hover:bg-slate-50 transition-all">
                                <FileUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-sm font-medium text-slate-900">Click to upload CSV</p>
                                <p className="text-xs text-slate-500 mt-1">or drag and drop file here</p>
                                <input type="file" accept=".csv" onChange={onFileUpload} className="hidden" />
                            </div>
                        </label>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ChevronRight className="h-4 w-4 text-primary" /> Map Data Columns
                            </CardTitle>
                            <CardDescription>Match your CSV headers to the letter placeholders.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                {placeholders.map(p => (
                                    <div key={p} className="flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">{`{{${p}}}`}</p>
                                            <p className="text-[10px] text-slate-500">Placeholder in letter</p>
                                        </div>
                                        <div className="w-1/2">
                                            <Select
                                                onValueChange={(val) => handleMappingChange(p, val)}
                                                value={mapping[p]}
                                            >
                                                <SelectTrigger className="h-9 text-xs">
                                                    <SelectValue placeholder="Skip Field" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">-- Skip Field --</SelectItem>
                                                    {headers.map(h => (
                                                        <SelectItem key={h} value={h}>{h}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-md font-bold">Data Preview (First 3 rows)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {headers.map(h => <TableHead key={h} className="text-[10px] uppercase">{h}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {csvData.slice(0, 3).map((row, i) => (
                                        <TableRow key={i}>
                                            {headers.map(h => <TableCell key={h} className="text-xs">{row[h]}</TableCell>)}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4 bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                        <p className="text-xs text-yellow-800">
                            <strong>Note:</strong> You are about to send <strong>{csvData.length}</strong> invitations using the <strong>"{config.name}"</strong> configuration. This action will log all sent letters in the history.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={handleSend} disabled={isSending} className="flex-1 h-12 bg-slate-900 hover:bg-black gap-2">
                            {isSending ? 'Processing...' : `Send ${csvData.length} Invitations Now`}
                        </Button>
                        <Button variant="outline" onClick={() => setStep(1)} className="h-12 px-6">Back</Button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <Card className="border-slate-200 bg-white">
                    <CardHeader className="text-center p-10">
                        <div className="bg-green-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <CardTitle className="text-3xl font-bold">Success!</CardTitle>
                        <CardDescription className="text-lg mt-2">
                            The bulk sending process has been initiated.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-0 text-center space-y-6">
                        <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-around">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-slate-900">{csvData.length}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Processed</p>
                            </div>
                            <div className="w-px h-10 bg-slate-200" />
                            <div className="text-center">
                                <p className="text-3xl font-bold text-slate-900">0</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Failed</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button onClick={() => window.location.reload()} className="h-11 bg-slate-900 hover:bg-black">
                                Go to History
                            </Button>
                            <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-500 text-xs h-8">
                                Send another batch
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
