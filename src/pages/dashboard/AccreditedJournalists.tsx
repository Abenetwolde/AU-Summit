import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Download, Loader2, Eye, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MOCK_JOURNALISTS } from '@/data/mock';
import { CountrySelect } from '@/components/ui/country-select';
import en from 'react-phone-number-input/locale/en';
import { exportJournalistsToCSV, exportJournalistsToPDF } from '@/lib/export-utils';
import { useAuth, UserRole } from '@/auth/context';
import {
    useGetApprovedApplicationsQuery,
    useUpdateApplicationStatusMutation,
    ApplicationStatus,
    Application
} from '@/store/services/api';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function AccreditedJournalists() {
    const navigate = useNavigate();
    const { user, checkPermission } = useAuth();
    const isReadOnly = user?.role === UserRole.NISS_OFFICER;

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // API
    const { data, isLoading, isError, error, refetch } = useGetApprovedApplicationsQuery({
        page: currentPage,
        limit: itemsPerPage,
    });
    const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();

    // Raw data: API first, fallback to mock
    const rawApplications: Application[] = useMemo(() => {
        const apiApps = data?.applications || (Array.isArray(data) ? data : []);

        if (apiApps.length > 0) return apiApps;

        // Fallback to mock data
        return MOCK_JOURNALISTS
            .filter(j => j.status === 'Approved')
            .map(j => ({
                id: parseInt(j.id) || 0,
                user: { fullName: j.fullname, email: '' },
                formData: {
                    country: j.country,
                    passport_number: j.passportNo,
                    occupation: j.role,
                    arrival_date: j.arrivalDate || '',
                },
                status: 'APPROVED' as ApplicationStatus,
                createdAt: j.createdAt || new Date().toISOString(),
            }));
    }, [data]);

    // Client-side filtering
    const filteredApplications = useMemo(() => {
        return rawApplications.filter(app => {
            const name = (app.user?.fullName || '').toLowerCase();
            const passport = (app.formData?.passport_number || '').toLowerCase();
            const countryCode = app.formData?.country || '';
            const countryName = countryCode ? (en[countryCode as keyof typeof en] || countryCode) : '';

            const arrivalDate = app.formData?.arrival_date
                ? new Date(app.formData.arrival_date).toISOString().split('T')[0]
                : '';
            const submissionDate = app.createdAt
                ? new Date(app.createdAt).toISOString().split('T')[0]
                : '';

            const matchesSearch = !searchTerm ||
                name.includes(searchTerm.toLowerCase()) ||
                passport.includes(searchTerm.toLowerCase());

            const matchesCountry = !selectedCountry ||
                countryCode === selectedCountry ||
                countryName.toLowerCase().includes(selectedCountry.toLowerCase());

            const matchesDate = !selectedDate ||
                arrivalDate === selectedDate ||
                submissionDate === selectedDate;

            return matchesSearch && matchesCountry && matchesDate;
        });
    }, [rawApplications, searchTerm, selectedCountry, selectedDate]);

    // Client-side pagination
    const totalItems = filteredApplications.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedApplications = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredApplications.slice(start, end);
    }, [filteredApplications, currentPage, itemsPerPage]);

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Handlers
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCountry('');
        setSelectedDate('');
        setCurrentPage(1);
    };

    const handleStatusChange = async (applicationId: number, newStatus: ApplicationStatus) => {
        try {
            await updateStatus({ applicationId, status: newStatus }).unwrap();
            toast.success(`Status updated to ${newStatus}`);
            refetch();
        } catch (err) {
            toast.error('Failed to update status');
            console.error(err);
        }
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, any> = {
            APPROVED: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-600', label: 'Approved' },
            SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-600', label: 'Submitted' },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-600', label: 'Rejected' },
            IN_REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-600', label: 'In Review' },
        };
        const config = configs[status] || configs.SUBMITTED;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                {config.label}
            </span>
        );
    };

    const handleExportCSV = () => {
        const exportData = filteredApplications.map(app => ({
            id: app.id,
            fullname: app.user?.fullName || '',
            country: en[app.formData?.country as keyof typeof en] || app.formData?.country || '',
            passportNo: app.formData?.passport_number || '',
            occupation: app.formData?.occupation || '',
            arrivalDate: app.formData?.arrival_date || '',
            status: app.status,
        }));
        exportJournalistsToCSV(exportData);
    };

    const handleExportPDF = () => {
        const exportData = filteredApplications.map(app => ({
            id: app.id,
            fullname: app.user?.fullName || '',
            country: en[app.formData?.country as keyof typeof en] || app.formData?.country || '',
            passportNo: app.formData?.passport_number || '',
            status: app.status,
        }));
        exportJournalistsToPDF(exportData);
    };

    // Country name helper
    const getCountryName = (code: string) => en[code as keyof typeof en] || code;

    if (isLoading) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading accredited journalists...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-6 text-center p-6">
                <div className="p-4 bg-red-50 rounded-full">
                    <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-bold">Failed to load data</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        {(error as any)?.data?.message || 'An error occurred while fetching journalists.'}
                    </p>
                </div>
                <Button onClick={() => refetch()} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Accredited Journalists</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        View and manage journalists approved for entry.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                        <Download className="h-4 w-4" /> Export PDF
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-gray-50/50">
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-4 items-end">
                        {/* Search */}
                        <div className="lg:col-span-4 space-y-2">
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Name or Passport Number..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Country */}
                        <div className="lg:col-span-3 space-y-2">
                            <label className="text-sm font-medium">Country</label>
                            <CountrySelect
                                value={selectedCountry}
                                onChange={(val) => {
                                    setSelectedCountry(val);
                                    setCurrentPage(1);
                                }}
                                placeholder="All countries"
                            />
                        </div>

                        {/* Date */}
                        <div className="lg:col-span-3 space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <input
                                type="date"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        {/* Actions */}
                        <div className="lg:col-span-2 flex gap-2">
                            <Button
                                variant="default"
                                className="flex-1 h-10 bg-blue-700 hover:bg-blue-800"
                                onClick={resetFilters}
                            >
                                Clear
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => refetch()}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b bg-muted/30">
                                <th className="h-12 px-4 text-left font-medium text-muted-foreground">No</th>
                                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Full Name</th>
                                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Country</th>
                                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Passport No</th>
                                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Occupation</th>
                                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Arrival Date</th>
                                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
                                <th className="h-12 px-4 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedApplications.map((app) => (
                                <tr key={app.id} className="border-b hover:bg-muted/50">
                                    <td className="p-4">{app.id}</td>
                                    <td className="p-4 font-medium">{app.user?.fullName || 'N/A'}</td>
                                    <td className="p-4">
                                        <span className="font-medium">
                                            {app.formData?.country ? getCountryName(app.formData.country) : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4">{app.formData?.passport_number || 'N/A'}</td>
                                    <td className="p-4">{app.formData?.occupation || 'N/A'}</td>
                                    <td className="p-4 text-xs font-mono">
                                        {app.formData?.arrival_date
                                            ? new Date(app.formData.arrival_date).toLocaleDateString()
                                            : 'N/A'}
                                    </td>
                                    <td className="p-4">{getStatusBadge(app.status as string)}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {checkPermission('application:view:by-id') && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                    onClick={() => navigate(`/dashboard/journalists/${app.id}`, { state: { application: app } })}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="hidden sm:inline">View</span>
                                                </Button>
                                            )}
                                            {!isReadOnly ? (
                                                <Select
                                                    value={app.status}
                                                    onValueChange={(val) => handleStatusChange(app.id, val as ApplicationStatus)}
                                                    disabled={isUpdating}
                                                >
                                                    <SelectTrigger className="w-32 h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={ApplicationStatus.SUBMITTED}>Submitted</SelectItem>
                                                        <SelectItem value={ApplicationStatus.APPROVED}>Approved</SelectItem>
                                                        <SelectItem value={ApplicationStatus.IN_REVIEW}>In Review</SelectItem>
                                                        <SelectItem value={ApplicationStatus.REJECTED}>Rejected</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">View Only</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedApplications.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-muted-foreground">
                                        No accredited journalists found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalItems > 0 && (
                    <div className="border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                                Showing {startItem}–{endItem} of {totalItems} journalists
                            </span>
                            <select
                                className="h-8 rounded-md border border-input bg-background px-3 text-sm"
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>

                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(pageNum)}
                                            className="w-9"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}