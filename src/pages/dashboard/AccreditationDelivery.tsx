import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Mail, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
    useGetAccreditationStatusesQuery,
    useResendAccreditationMutation,
    useSyncAccreditationMutation,
    AccreditationStatus
} from '@/store/services/api';
import { toast } from 'sonner';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function AccreditationDelivery() {
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // API Hooks
    const { data, isLoading, refetch, isFetching } = useGetAccreditationStatusesQuery({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
    });
    const [resendAccreditation, { isLoading: isResending }] = useResendAccreditationMutation();
    const [syncAccreditation, { isLoading: isSyncing }] = useSyncAccreditationMutation();

    const statuses = data?.data || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleResend = async (applicationId: number) => {
        try {
            await resendAccreditation(applicationId).unwrap();
            toast.success('Resend process initiated');
        } catch (error: any) {
            toast.error(error.data?.error || 'Failed to resend accreditation');
        }
    };

    const StatusIcon = ({ status, type }: { status: string, type: string }) => {
        switch (status) {
            case 'sent':
            case 'generated':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'not_required':
                return <Clock className="h-4 w-4 text-slate-300" />;
            default:
                return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">&gt; Delivery Tracking</p>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Accreditation Delivery</h2>
                    <p className="text-muted-foreground">Monitor the status of emails, QR codes, and invitation letters sent to journalists.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={async () => {
                            try {
                                const result = await syncAccreditation().unwrap();
                                toast.success(result.message);
                            } catch (err: any) {
                                toast.error(err.data?.error || 'Sync failed');
                            }
                        }}
                        disabled={isSyncing}
                        className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync Missing Records
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="bg-gray-50/50">
                <CardContent className="p-6">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">Search Journalists</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    placeholder="Search by Name......"
                                    className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button className="bg-blue-700 hover:bg-blue-800 text-white h-11" onClick={() => setCurrentPage(1)}>
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-0 shadow-sm overflow-hidden bg-white">
                <div className="relative w-full overflow-x-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b bg-slate-50">
                            <tr className="border-b transition-colors hover:bg-muted/50">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">ID</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">Journalist</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground uppercase text-xs">Email</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground uppercase text-xs">QR Code</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground uppercase text-xs">Invite Letter</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">Last Attempt</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground uppercase text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {statuses.map((item: AccreditationStatus) => (
                                <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle text-gray-500 font-mono text-xs">#{item.applicationId}</td>
                                    <td className="p-4 align-middle">
                                        <div className="font-bold text-slate-800">{item.application?.user?.fullName || 'N/A'}</div>
                                        <div className="text-xs text-slate-500">{item.application?.user?.email}</div>
                                    </td>
                                    <td className="p-4 align-middle text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <StatusIcon status={item.emailStatus} type="email" />
                                            <span className="text-[10px] uppercase font-bold text-slate-400">{item.emailStatus}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <StatusIcon status={item.qrCodeStatus} type="qr" />
                                            <span className="text-[10px] uppercase font-bold text-slate-400">{item.qrCodeStatus}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <StatusIcon status={item.invitationStatus} type="invitation" />
                                            <span className="text-[10px] uppercase font-bold text-slate-400">{item.invitationStatus}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-xs text-slate-600">
                                        {item.lastAttemptAt ? new Date(item.lastAttemptAt).toLocaleString() : 'Never'}
                                        {item.errorLog && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertTriangle className="h-3 w-3 text-red-500 mt-1" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs bg-slate-900 text-white border-0">
                                                        <p className="text-[10px] whitespace-pre-wrap">{item.errorLog}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                                            onClick={() => handleResend(item.applicationId)}
                                            disabled={isResending}
                                        >
                                            <Mail className="h-3.5 w-3.5" />
                                            Resend
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {statuses.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        No accreditation delivery records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-4 border-t flex items-center justify-between">
                    <span className="text-sm text-muted-foreground text-xs uppercase font-bold">
                        Total {total} Journalists
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                        >
                            &lt;
                        </Button>
                        <span className="text-xs font-bold">Page {currentPage} of {totalPages}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                        >
                            &gt;
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
