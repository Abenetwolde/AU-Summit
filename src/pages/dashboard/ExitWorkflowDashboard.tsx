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
import { Loader2, Search, Eye, CheckCircle, XCircle, Clock, ArrowLeft, LogOut, Download, FileText, Calendar, Filter, RotateCcw, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGetExitWorkflowApplicationsQuery, useInitializeExitWorkflowMutation } from '@/store/services/api';
import { useAuth } from '@/auth/context';
import { exportJournalistsToCSV, exportJournalistsToPDF } from '@/lib/export-utils';

export function ExitWorkflowDashboard() {
    const navigate = useNavigate();
    const { user, checkPermission } = useAuth();
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
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

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setNationalityFilter('');
        setHasDroneFilter(undefined);
        setDeclarationStatusFilter(undefined);
        setDateRange({ start: '', end: '' });
        setPage(1);
        toast.success('Filters reset');
    };

    // Check if user has permission to manage exit workflow (approve/reject/initialize)
    const canManageExit = checkPermission('application:manage-exit-workflow');

    const { data, isLoading, error, refetch } = useGetExitWorkflowApplicationsQuery({
        page,
        limit,
        search: searchQuery,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        nationality: nationalityFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        hasDrone: hasDroneFilter,
        declarationStatus: declarationStatusFilter
    });

    const [initializeExit, { isLoading: isInitializing }] = useInitializeExitWorkflowMutation();

    const { data: exportData, isFetching: isExportFetching } = useGetExitWorkflowApplicationsQuery({
        page: 1,
        limit: exportLimit === 'all' ? 10000 : limit,
        search: searchQuery,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        nationality: nationalityFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        hasDrone: hasDroneFilter,
        declarationStatus: declarationStatusFilter
    }, { skip: !isExporting });

    useEffect(() => {
        refetch();
    }, [page, searchQuery, statusFilter, nationalityFilter, hasDroneFilter, declarationStatusFilter, dateRange.start, dateRange.end, refetch]);

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
            if (!step || !step.isExitStep) return false;

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
        navigate(`/dashboard/journalists/${app.id}`, { state: { application: app, phase: 'exit' } });
    };

    const handleInitializeExit = async (id: number) => {
        try {
            await initializeExit(id).unwrap();
            toast.success('Exit workflow initialized successfully');
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to initialize exit workflow');
        }
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
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-900">Exit Approvals</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Manage applications in the exit approval phase
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
            <Card className="border-purple-100 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-purple-50/50 border-b border-purple-100 py-3 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-purple-600" />
                        <CardTitle className="text-sm font-semibold text-purple-900 uppercase tracking-wider">Filter Exit Applications</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="h-8 text-purple-600 hover:text-purple-700 hover:bg-purple-100/50 gap-2 font-medium"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Clear All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Search className="w-3 h-3 text-purple-500" />
                                Search Metadata
                            </label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                <Input
                                    placeholder="Search by name, email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Clock className="w-3 h-3 text-purple-500" />
                                Approval Status
                            </label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white text-sm h-10">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="PENDING">Pending Exit Approval</SelectItem>
                                    <SelectItem value="IN_REVIEW">Under Review</SelectItem>
                                    <SelectItem value="APPROVED">Exit Approved</SelectItem>
                                    <SelectItem value="REJECTED">Exit Rejected</SelectItem>
                                    <SelectItem value="EXITED">Officially Exited</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Globe className="w-3 h-3 text-purple-500" />
                                Nationality
                            </label>
                            <div className="relative group">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                <Input
                                    placeholder="Any country..."
                                    value={nationalityFilter}
                                    onChange={(e) => setNationalityFilter(e.target.value)}
                                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Calendar className="w-3 h-3 text-purple-500" />
                                Exit Date Range
                            </label>
                            <div className="flex gap-2 items-center">
                                <div className="relative flex-1 group">
                                    <Input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all text-xs h-10 px-2"
                                    />
                                </div>
                                <span className="text-slate-400 text-xs font-bold font-mono">TO</span>
                                <div className="relative flex-1 group">
                                    <Input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all text-xs h-10 px-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasDroneFilter ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                                <CheckCircle className="w-4 h-4" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="hasDrone-exit"
                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    checked={!!hasDroneFilter}
                                    onChange={(e) => setHasDroneFilter(e.target.checked ? true : undefined)}
                                />
                                <label htmlFor="hasDrone-exit" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                    Includes Drones
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${declarationStatusFilter ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="declarationStatus-exit"
                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    checked={!!declarationStatusFilter}
                                    onChange={(e) => setDeclarationStatusFilter(e.target.checked ? true : undefined)}
                                />
                                <label htmlFor="declarationStatus-exit" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                    Equipment Declared
                                </label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Applications Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-purple-900">Exit Phase Applications</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">
                            Error loading applications. Please try again.
                        </div>
                    ) : (data?.applications?.length === 0) ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No applications found in exit workflow.
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
                                        <TableRow key={app.id} className="hover:bg-purple-50/50">
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
                                                    <div className="text-sm font-medium text-purple-700">
                                                        {app.approvals?.filter((a: any) => a.workflowStep && a.workflowStep.isExitStep && a.status === 'APPROVED').length} / {app.approvals?.filter((a: any) => a.workflowStep && a.workflowStep.isExitStep).length}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground text-purple-400">Steps</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right flex items-center justify-end gap-2">
                                                {/* {canManageExit && app.status !== 'APPROVED' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleInitializeExit(app.id)}
                                                        className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                        Initialize
                                                    </Button>
                                                )} */}
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
