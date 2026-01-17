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
import { Loader2, Search, Eye, CheckCircle, XCircle, Clock, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGetEntryWorkflowApplicationsQuery } from '@/store/services/api';
import { useAuth } from '@/auth/context';

export function EntryWorkflowDashboard() {
    const navigate = useNavigate();
    const { user, checkPermission } = useAuth();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const limit = 10;

    // Check if user has permission to approve/reject in entry workflow
    const canApproveEntry = checkPermission('application:approve:dynamic');

    const { data, isLoading, error, refetch } = useGetEntryWorkflowApplicationsQuery({
        page,
        limit,
        search,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
    });

    useEffect(() => {
        refetch();
    }, [page, search, statusFilter, refetch]);

    const getRoleApprovalStatus = (app: any) => {
        if (user?.role === 'SUPER_ADMIN') return app.status;

        // Find the approval step that matches the user's role and is NOT an exit step
        const relevantApproval = app.approvals?.find((a: any) =>
            a.workflowStep?.requiredRole === user?.role &&
            a.workflowStep?.isExitStep === false
        );

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
        navigate(`/dashboard/journalists/${app.id}`, { state: { application: app } });
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
                    <h1 className="text-3xl font-bold tracking-tight">Entry Workflow</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage applications in the entry approval phase
                    </p>
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
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('ALL');
                                setPage(1);
                            }}
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
                                        <TableHead>Status</TableHead>
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
                                        Showing page {data.currentPage} of {data.totalPages}
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
                                            disabled={page >= data.totalPages}
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
