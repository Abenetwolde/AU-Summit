import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Eye, CheckCircle, XCircle, Clock, ArrowLeft, LogOut, Download, FileText, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGetEntryWorkflowApplicationsQuery } from '@/store/services/api';
import { useAuth } from '@/auth/context';

export function EntryWorkflowDashboard() {
    const navigate = useNavigate();
    const { user, checkPermission } = useAuth();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const limit = 10;

    // Check if user has permission to approve/reject in entry workflow
    const canApproveEntry = checkPermission('application:approve:dynamic');

    const { data, isLoading, error, refetch } = useGetEntryWorkflowApplicationsQuery({
        page,
        limit,
        search,
        status: statusFilter !== 'PENDING' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
    });

    useEffect(() => {
        refetch();
    }, [page, search, statusFilter, startDate, endDate, refetch]);

    const getRoleApprovalStatus = (app: any) => {
        if (user?.role === 'SUPER_ADMIN') return app.status;

        // Try matching by recognized role strings first (roleName is more likely to match backend logic)
        const relevantApproval = app.approvals?.find((a: any) => {
            const step = a.workflowStep;
            if (!step || step.isExitStep) return false;

            // Match by ID if we have authorized steps (most reliable)
            // if (user?.authorizedWorkflowSteps?.some(s => s.id === step.id)) return true;

            // Fallback to role name matching
            return step.requiredRole === user?.roleName;
        });

        return relevantApproval ? relevantApproval.status : app.status;
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            SUBMITTED: { variant: 'secondary', icon: Clock, label: 'Submitted' },
            PENDING: { variant: 'outline', icon: Clock, label: 'Pending' },
            IN_REVIEW: { variant: 'default', icon: Clock, label: 'In Review' },
            APPROVED: { variant: 'success', icon: CheckCircle, label: 'Approved' },
            REJECTED: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
            EXITED: { variant: 'destructive', icon: LogOut, label: 'Exited' },
            NOT_APPLICABLE: { variant: 'ghost', icon: Clock, label: 'N/A' }
        };

        const config = variants[status] || variants.SUBMITTED;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant as any} className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    };

    const handleViewDetails = (app: any) => {
        navigate(`/dashboard/journalists/${app.id}`, { state: { application: app, phase: 'entry' } });
    };

    const handleExport = async (format: 'PDF' | 'EXCEL') => {
        try {
            const token = localStorage.getItem('managment_token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
            const queryParams = new URLSearchParams({
                format,
                ...(search && { search }),
                ...(statusFilter !== 'PENDING' && { status: statusFilter }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            });

            const response = await fetch(`${baseUrl}/applications/entry-workflow/export?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const extension = format === 'EXCEL' ? 'xlsx' : 'pdf';
            const timestamp = new Date().toISOString().slice(0, 10);
            a.download = `entry_applications_${timestamp}.${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`Exported as ${format}`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export applications');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/dashboard')}
                        className="mb-4 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Entry Approvals</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage applications in the entry approval phase
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleExport('EXCEL')}
                        className="gap-2 border-green-600 text-green-700 hover:bg-green-50"
                    >
                        <Download className="w-4 h-4" />
                        Export Excel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleExport('PDF')}
                        className="gap-2 border-red-600 text-red-700 hover:bg-red-50"
                    >
                        <FileText className="w-4 h-4" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-blue-900">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">Pending </SelectItem>
                                <SelectItem value="IN_REVIEW">In Review </SelectItem>
                                <SelectItem value="APPROVED">Approved </SelectItem>
                                <SelectItem value="REJECTED">Rejected </SelectItem>
                                <SelectItem value="EXITED">Exited</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-9"
                                    placeholder="Start Date"
                                />
                            </div>
                            <span className="text-muted-foreground">to</span>
                            <div className="relative flex-1">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-9"
                                    placeholder="End Date"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('PENDING');
                                setStartDate('');
                                setEndDate('');
                                setPage(1);
                            }}
                            className="gap-2"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Applications Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Entry Phase Applications</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">
                            Error loading applications. Please try again.
                        </div>
                    ) : data?.applications?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No applications found in entry workflow.
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Applicant</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Your Approval</TableHead>
                                        <TableHead>Phase Progress</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.applications?.map((app: any) => (
                                        <TableRow key={app.id} className="hover:bg-blue-50/50">
                                            <TableCell className="font-mono font-medium">
                                                #{app.id}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {app.user?.fullName || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {app.user?.email || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(getRoleApprovalStatus(app))}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-medium text-blue-700">
                                                        {app.approvals?.filter((a: any) => a.workflowStep && !a.workflowStep.isExitStep && a.status === 'APPROVED').length} / {app.approvals?.filter((a: any) => a.workflowStep && !a.workflowStep.isExitStep).length}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground text-blue-400">Steps</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(app)}
                                                    className="gap-2"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {data && data.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing page {data?.currentPage} of {data?.totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={!!data?.totalPages && page >= data.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
