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
import { useGetFormByIdQuery, useGetFormsQuery } from '@/store/services/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Eye, CheckCircle, XCircle, Clock, ArrowLeft, LogOut, Download, FileText, Calendar, Filter, RotateCcw, Globe, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGetEntryWorkflowApplicationsQuery } from '@/store/services/api';
import { exportJournalistsToCSV, exportJournalistsToPDF } from '@/lib/export-utils';
import { useAuth } from '@/auth/context';
import { FormFilter } from '@/components/dashboard/FormFilter';
import { cn } from '@/lib/utils';

export function EntryWorkflowDashboard() {
    const navigate = useNavigate();
    const { user, checkPermission } = useAuth();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedFormId, setSelectedFormId] = useState<string | undefined>(undefined);
    const [applicationPurposeFilter, setApplicationPurposeFilter] = useState<string | undefined>(undefined);
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

    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('ALL');
        setNationalityFilter('');
        setHasDroneFilter(undefined);
        setDeclarationStatusFilter(undefined);
        setDateRange({ start: '', end: '' });
        setApplicationPurposeFilter(undefined);
        setPage(1);
        toast.success('Filters reset');
    };

    // Check if user has permission to approve/reject in entry workflow
    const canApproveEntry = checkPermission('application:approve:dynamic');

    const { data: forms } = useGetFormsQuery();
    const activeFormId = selectedFormId ? Number(selectedFormId) : forms?.find((form) => form.status === 'PUBLISHED')?.form_id;
    const { data: activeFormDetails } = useGetFormByIdQuery(activeFormId?.toString() || '', { skip: !activeFormId });

    const allFormFields = [
        ...(activeFormDetails?.FormFields || []),
        ...(activeFormDetails?.uncategorizedFields || []),
        ...((activeFormDetails?.categories || []).flatMap((category: any) => category.fields || []))
    ];

    const applicationPurposeField = allFormFields.find((field: any) => field.field_name === 'application_purpose');
    const purposeOptions: string[] = (() => {
        const fieldOptions = applicationPurposeField?.field_options;

        if (!fieldOptions) return [];
        if (Array.isArray(fieldOptions?.options)) {
            return fieldOptions.options;
        }
        if (typeof fieldOptions === 'string') {
            try {
                const parsed = JSON.parse(fieldOptions);
                return Array.isArray(parsed?.options) ? parsed.options : [];
            } catch {
                return [];
            }
        }

        return [];
    })();
    const firstPurposeOption = purposeOptions[0];

    useEffect(() => {
        if (!purposeOptions.length) {
            if (applicationPurposeFilter !== undefined) {
                setApplicationPurposeFilter(undefined);
            }
            return;
        }

        if (!applicationPurposeFilter || (!purposeOptions.includes(applicationPurposeFilter) && applicationPurposeFilter !== 'ALL')) {
            setApplicationPurposeFilter('ALL');
        }
    }, [applicationPurposeFilter, firstPurposeOption, purposeOptions]);

    const mapPurposeFilter = () => {
        if (!applicationPurposeFilter || applicationPurposeFilter === 'ALL') return undefined;
        return applicationPurposeFilter;
    };

    const { data, isLoading, error, refetch } = useGetEntryWorkflowApplicationsQuery({
        page,
        limit,
        search,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        nationality: nationalityFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        hasDrone: hasDroneFilter,
        declarationStatus: declarationStatusFilter,
        formId: selectedFormId ? Number(selectedFormId) : undefined,
        applicationPurpose: mapPurposeFilter()
    });

    const { data: exportData, isFetching: isExportFetching } = useGetEntryWorkflowApplicationsQuery({
        page: 1,
        limit: exportLimit === 'all' ? 10000 : limit,
        search,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        nationality: nationalityFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        hasDrone: hasDroneFilter,
        declarationStatus: declarationStatusFilter,
        formId: selectedFormId ? Number(selectedFormId) : undefined,
        applicationPurpose: mapPurposeFilter()
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

    const getRoleApproval = (app: any) => {
        if (user?.role === 'SUPER_ADMIN') {
            return app.approvals?.find((a: any) => a.workflowStep && !a.workflowStep.isExitStep && (a.isResubmitted || a.status === 'PENDING' || a.status === 'IN_REVIEW')) || app.approvals?.[0];
        }

        return app.approvals?.find((a: any) => {
            const step = a.workflowStep;
            if (!step || step.isExitStep) return false;
            return step.requiredRole === user?.roleName;
        });
    };

    const getRoleApprovalStatus = (app: any) => {
        if (user?.role === 'SUPER_ADMIN') return app.status;
        const relevantApproval = getRoleApproval(app);
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
            <Card className="border-blue-100 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-blue-50/50 border-b border-blue-100 py-3 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-blue-600" />
                        <CardTitle className="text-sm font-semibold text-blue-900 uppercase tracking-wider">Filter Applications</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 gap-2 font-medium"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear All
                    </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Search className="w-3 h-3" />
                                Search Metadata
                            </label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Search by name, email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Clock className="w-3 h-3" />
                                Approval Status
                            </label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white text-sm h-10">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="PENDING">Pending Approval</SelectItem>
                                    <SelectItem value="IN_REVIEW">Under Review</SelectItem>
                                    <SelectItem value="APPROVED">Approved / Entered</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                    <SelectItem value="EXITED">Exited Country</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Filter className="w-3 h-3" />
                                Event Form
                            </label>
                            <FormFilter 
                                value={selectedFormId}
                                onChange={setSelectedFormId}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Globe className="w-3 h-3" />
                                Nationality
                            </label>
                            <div className="relative group">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Any country..."
                                    value={nationalityFilter}
                                    onChange={(e) => setNationalityFilter(e.target.value)}
                                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm h-10"
                                />
                            </div>
                        </div>
                        {purposeOptions.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Filter className="w-3 h-3" />
                                Application Purpose
                            </label>
                            <Select value={applicationPurposeFilter || 'ALL'} onValueChange={(value) => setApplicationPurposeFilter(value)}>
                              <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white text-sm h-10">
                                <SelectValue placeholder="Select purpose" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ALL">All Purposes</SelectItem>
                                {purposeOptions.map((option) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Calendar className="w-3 h-3" />
                                Applied Date Range
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
                                <span className="text-slate-400 text-xs font-bold">TO</span>
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasDroneFilter ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                <CheckCircle className="w-4 h-4" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="hasDrone"
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={!!hasDroneFilter}
                                    onChange={(e) => setHasDroneFilter(e.target.checked ? true : undefined)}
                                />
                                <label htmlFor="hasDrone" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                    Has Drone
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${declarationStatusFilter ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="declarationStatus"
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={!!declarationStatusFilter}
                                    onChange={(e) => setDeclarationStatusFilter(e.target.checked ? true : undefined)}
                                />
                                <label htmlFor="declarationStatus" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                    Equipment Declared
                                </label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Applications Table */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
                    <div>
                        <CardTitle>Entry Phase Applications</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            {selectedFormId ? (
                                <>Filtered by: <span className="font-semibold text-slate-700">{forms?.find(f => f.form_id === Number(selectedFormId))?.name || 'Selected Form'}</span></>
                            ) : (
                                <>Displaying incoming applications across <span className="font-semibold text-emerald-600">All Active Published Forms</span> for your workflow step</>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {data?.applications?.some((a: any) => a.approvals?.some((ap: any) => ap.isResubmitted)) && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 gap-1.5 py-1 px-2.5 text-xs font-semibold">
                                <RotateCcw className="w-3 h-3 text-amber-600 animate-pulse" />
                                Resubmitted Applications Present
                            </Badge>
                        )}
                        {!selectedFormId ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1 px-2.5 text-xs font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Active Published Forms
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 py-1 px-2.5 text-xs font-medium">
                                <Filter className="w-3 h-3 text-blue-600" />
                                Single Form Filtered
                            </Badge>
                        )}
                    </div>
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
                                        <TableHead>Applied Form</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Your Approval</TableHead>
                                        <TableHead>Phase Progress</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.applications?.map((app: any) => {
                                        const relevantApproval = getRoleApproval(app);
                                        const isResubmitted = Boolean(
                                            relevantApproval?.isResubmitted ||
                                            (user?.role === 'SUPER_ADMIN' && app.approvals?.some((a: any) => a.isResubmitted))
                                        );

                                        return (
                                            <TableRow 
                                                key={app.id} 
                                                className={cn(
                                                    "transition-colors",
                                                    isResubmitted 
                                                        ? "bg-amber-50/40 hover:bg-amber-100/50 border-l-4 border-l-amber-500" 
                                                        : "hover:bg-blue-50/50"
                                                )}
                                            >
                                                <TableCell className="font-mono font-medium">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span>#{app.id}</span>
                                                        {isResubmitted && (
                                                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0 h-4 shadow-2xs">
                                                                Resubmitted
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="font-semibold text-slate-900">
                                                            {app.formData?.first_name
                                                                ? `${app.formData.first_name} ${app.formData.last_name || ''}`
                                                                : app.user?.fullName || 'N/A'}
                                                        </span>
                                                        {isResubmitted && (
                                                            <Badge variant="outline" className="bg-amber-100/90 text-amber-900 border-amber-300 gap-1 text-[10px] font-bold py-0.5 px-2 tracking-tight">
                                                                <RotateCcw className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
                                                                Resubmitted
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <Badge variant="outline" className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 gap-1.5 py-0.5 px-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                            {app.form?.name || 'Standard Form'}
                                                        </Badge>
                                                        {app.form?.type && (
                                                            <span className="text-[10px] text-slate-400 capitalize font-medium pl-1">
                                                                {app.form.type.toLowerCase().replace(/_/g, ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {app.user?.email || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 items-start">
                                                        {getStatusBadge(getRoleApprovalStatus(app))}
                                                        {isResubmitted && (
                                                            <Badge variant="outline" className="text-[10px] font-bold text-amber-800 bg-amber-100/70 border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                                <RotateCcw className="w-2.5 h-2.5 text-amber-600" /> Resubmitted
                                                            </Badge>
                                                        )}
                                                    </div>
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
                                        );
                                    })}
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
            </Card >
        </div >
    );
}
