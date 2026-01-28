import { useState } from 'react';
import { useGetApplicationsWithBadgeStatusQuery, useGenerateBadgeMutation, FILE_BASE_URL } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileCheck, Search, Loader2, User as UserIcon, Building2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export function ManualBadgePrint() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'generated' | 'ungenerated'>('all');
    const [printingId, setPrintingId] = useState<number | null>(null);

    // Fetch applications with badge status
    const { data, isLoading, refetch } = useGetApplicationsWithBadgeStatusQuery({
        page,
        limit,
        search: searchTerm,
        status: statusFilter
    });

    // Badge generation mutation
    const [generateBadge, { isLoading: isGenerating }] = useGenerateBadgeMutation();

    const handleGenerate = async (applicationId: number) => {
        setPrintingId(applicationId);
        try {
            const result = await generateBadge(applicationId).unwrap();
            toast.success(result.message || 'Badge generated successfully! Go to History tab to download it.');
        } catch (error: any) {
            console.error('Generation Error:', error);
            toast.error(error.data?.error || 'Failed to generate badge');
        } finally {
            setPrintingId(null);
        }
    };

    const applications = data?.applications || [];
    const totalPages = data?.totalPages || 1;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Manual Badge Printing</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Select an approved applicant to generate and print their official badge.
                    </p>
                </div>
            </div>

            <Card className="border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 pb-8 border-b">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="font-sans text-xl font-bold">Approved Applicants</CardTitle>
                                <CardDescription>Only fully approved applications are available for badge printing.</CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                                    <SelectTrigger className="w-[180px] h-11 bg-white">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Applications</SelectItem>
                                        <SelectItem value="generated">Badge Generated</SelectItem>
                                        <SelectItem value="ungenerated">Not Generated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 bg-white border-slate-200"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="font-bold py-4">Applicant</TableHead>
                                    <TableHead className="font-bold">Affiliation</TableHead>
                                    <TableHead className="font-bold">Badge Status</TableHead>
                                    <TableHead className="font-bold text-right pr-8">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                <p className="text-sm text-slate-500">Loading applicants...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : applications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <UserIcon className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <p className="text-slate-500 font-medium">No approved applicants found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    applications.map((app: any) => (
                                        <TableRow
                                            key={app.id}
                                            className={`hover:bg-slate-50/50 transition-colors ${app.hasBadge ? 'bg-green-50/30' : ''}`}
                                        >
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                        {app.formData?.profile_photo ? (
                                                            <img
                                                                src={`${FILE_BASE_URL}/uploads/${(Array.isArray(app.formData.profile_photo) ? app.formData.profile_photo[0] : app.formData.profile_photo).split(/[\\/]/).pop()}`}
                                                                className="h-full w-full object-cover"
                                                                alt={app.user.fullName}
                                                            />
                                                        ) : (
                                                            <UserIcon className="h-5 w-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{app.user.fullName}</p>
                                                        <p className="text-xs text-slate-500">{app.user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm text-slate-700 font-medium">
                                                        {app.formData?.media_affiliation || app.formData?.organization || 'N/A'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {app.hasBadge ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 font-bold gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Generated
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-slate-600 font-bold">
                                                        Not Generated
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <Button
                                                    onClick={() => handleGenerate(app.id)}
                                                    disabled={printingId === app.id}
                                                    className="bg-primary hover:bg-primary/90 text-white shadow-sm font-bold h-9"
                                                >
                                                    {printingId === app.id ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileCheck className="mr-2 h-4 w-4" />
                                                            {app.hasBadge ? 'Regenerate' : 'Generate Badge'}
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {!isLoading && applications.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/30">
                            <div className="text-sm text-slate-600">
                                Page {page} of {totalPages} • {data?.total || 0} total applications
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-9"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="h-9"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
