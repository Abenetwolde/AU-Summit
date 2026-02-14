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
import { exportJournalistsToCSV, exportJournalistsToPDF } from '@/lib/export-utils';
import { useAuth } from '@/auth/context';

export function EntryWorkflowDashboard() {
    const navigate = useNavigate();
    const { user, checkPermission } = useAuth();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');
    const [nationalityFilter, setNationalityFilter] = useState('');
    const [hasDroneFilter, setHasDroneFilter] = useState<boolean | undefined>(undefined);
    const [declarationStatusFilter, setDeclarationStatusFilter] = useState<boolean | undefined>(undefined);
    const [exportLimit, setExportLimit] = useState<'current' | 'all'>('current');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: '',
        end: ''
    });
    const [exportType, setExportType] = useState<'csv' | 'pdf' | null>(null);
    const limit = 10;
    const isExporting = exportType !== null;

    // Check if user has permission to approve/reject in entry workflow
    const canApproveEntry = checkPermission('application:approve:dynamic');

    const { data, isLoading, error, refetch } = useGetEntryWorkflowApplicationsQuery({
        page,
        limit,
        search,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        nationality: nationalityFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        hasDrone: hasDroneFilter,
        declarationStatus: declarationStatusFilter
    });

    const { data: exportData, isFetching: isExportFetching } = useGetEntryWorkflowApplicationsQuery({
        page: 1,
        limit: exportLimit === 'all' ? 10000 : limit, // Use a large number for 'all', or current page limit
        search,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        nationality: nationalityFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        hasDrone: hasDroneFilter,
        declarationStatus: declarationStatusFilter
    }, { skip: !isExporting });

    useEffect(() => {
        refetch();
    }, [page, search, statusFilter, nationalityFilter, hasDroneFilter, declarationStatusFilter, dateRange, refetch]);

    useEffect(() => {
        if (isExporting && exportData?.applications && !isExportFetching) {
            if (exportType === 'csv') {
                exportJournalistsToCSV(exportData.applications);
            } else if (exportType === 'pdf') {
                exportJournalistsToPDF(exportData.applications);
            }
            setExportType(null);
            toast.success(`Exported as ${exportType.toUpperCase()}`);
        }
    }, [isExporting, exportData, isExportFetching, exportType]);

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

    const handleExport = (type: 'csv' | 'pdf') => {
        setExportType(type);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/dashboard')}
                        className="mb-2 sm:mb-4 gap-2 px-0 hover:bg-transparent"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Entry Approvals</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Manage applications in the entry approval phase
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleExport('csv')}
                        disabled={isExporting}
                        className="gap-2"
                    >
                        {isExporting && exportType === 'csv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting}
                        className="gap-2"
                    >
                        {isExporting && exportType === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export PDF
                    </Button>
                    <div className="flex items-center gap-2 border rounded-md px-2 py-1">
                        <label className="text-xs font-medium">Size:</label>
                        <select
                            className="text-xs border-none bg-transparent outline-none cursor-pointer"
                            value={exportLimit}
                            onChange={(e) => setExportLimit(e.target.value as 'current' | 'all')}
                        >
                            <option value="current">Current Page</option>
                            <option value="all">All Records</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-blue-900">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Name or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="PENDING">Pending </SelectItem>
                                    <SelectItem value="IN_REVIEW">In Review </SelectItem>
                                    <SelectItem value="APPROVED">Approved </SelectItem>
                                    <SelectItem value="REJECTED">Rejected </SelectItem>
                                    <SelectItem value="EXITED">Exited</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nationality</label>
                            <Input
                                placeholder="Country name..."
                                value={nationalityFilter}
                                onChange={(e) => setNationalityFilter(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date Range</label>
                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                />
                                <Input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 flex flex-col justify-end">
                            <div className="flex items-center space-x-4 h-10">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="hasDrone"
                                        className="w-4 h-4 rounded border-gray-300"
                                        checked={!!hasDroneFilter}
                                        onChange={(e) => setHasDroneFilter(e.target.checked ? true : undefined)}
                                    />
                                    <label htmlFor="hasDrone" className="text-sm font-medium cursor-pointer">
                                        Has Drone
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="declarationStatus"
                                        className="w-4 h-4 rounded border-gray-300"
                                        checked={!!declarationStatusFilter}
                                        onChange={(e) => setDeclarationStatusFilter(e.target.checked ? true : undefined)}
                                    />
                                    <label htmlFor="declarationStatus" className="text-sm font-medium cursor-pointer">
                                        Equipment Declaration
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('PENDING');
                                setNationalityFilter('');
                                setHasDroneFilter(undefined);
                                setDeclarationStatusFilter(undefined);
                                setDateRange({ start: '', end: '' });
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
                    ) : (data?.applications?.length === 0) ? (
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
                                                {app.formData?.first_name
                                                    ? `${app.formData.first_name} ${app.formData.last_name || ''}`
                                                    : app.user?.fullName || 'N/A'}
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
