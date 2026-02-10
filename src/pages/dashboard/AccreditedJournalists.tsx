import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Download, Loader2, Image as ImageIcon, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import {
    useGetApprovedApplicationsQuery,
    useUpdateApplicationStatusMutation,
    useLazyExportProfilePicturesQuery,
    ApplicationStatus
} from '@/store/services/api';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth, UserRole } from '@/auth/context';
import en from 'react-phone-number-input/locale/en';
import { exportJournalistsToCSV, exportJournalistsToPDF } from '@/lib/export-utils';

export function AccreditedJournalists() {
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const { user, checkPermission } = useAuth();
    const navigate = useNavigate();
    const isReadOnly = user?.role === UserRole.NISS_OFFICER;

    // API Hooks
    const { data, isLoading, refetch } = useGetApprovedApplicationsQuery({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        country: selectedCountry,
        date: date
    });
    const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();
    const [triggerExport, { isFetching: isExportingPhotos }] = useLazyExportProfilePicturesQuery();

    const applications = data?.applications || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    const countryName = (code: string) => en[code as keyof typeof en] || code;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleStatusChange = async (applicationId: number, newStatus: ApplicationStatus) => {
        try {
            await updateStatus({ applicationId, status: newStatus }).unwrap();
            toast.success(`Status updated to ${newStatus}`);
            refetch();
        } catch (error) {
            toast.error('Failed to update status');
            console.error(error);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            APPROVED: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-600', label: 'Approved' },
            SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-600', label: 'Submitted' },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-600', label: 'Rejected' },
            IN_REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-600', label: 'In Review' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SUBMITTED;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                {config.label}
            </span>
        );
    };

    // Export handlers
    const handleExportCSV = () => {
        exportJournalistsToCSV(applications);
    };

    const handleExportPDF = () => {
        exportJournalistsToPDF(applications);
    };

    const handleExportProfilePictures = async () => {
        try {
            const blob = await triggerExport().unwrap();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `accredited_photos_${new Date().toISOString().split('T')[0]}.zip`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Profile pictures exported successfully');
        } catch (error) {
            toast.error('Failed to export profile pictures');
            console.error('Export photos failed:', error);
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
                    <p className="text-sm text-muted-foreground mb-1">&gt; Journalists</p>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Accredited Journalists</h2>
                    <p className="text-muted-foreground">View and manage journalists who have been approved for entry.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export PDF
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleExportProfilePictures}
                        disabled={isExportingPhotos}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        {isExportingPhotos ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <ImageIcon className="h-4 w-4" />
                                Export Photos
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="bg-gray-50/50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4 space-y-2">
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    placeholder="Search by Name, Passport Number......"
                                    className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-3 space-y-2">
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

                        <div className="md:col-span-3 space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <input
                                type="date"
                                className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={date}
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2">
                            <Button className="flex-1 bg-blue-700 hover:bg-blue-800 text-white h-11" onClick={() => refetch()}>
                                Filter
                            </Button>
                            <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => {
                                setSearchTerm('');
                                setDate('');
                                setSelectedCountry('');
                                setCurrentPage(1);
                            }}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-0 shadow-sm overflow-hidden bg-white">
                <div className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">No</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">Fullname</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs hidden sm:table-cell">Country</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs hidden md:table-cell">Passport No</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs hidden lg:table-cell">Occupation</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs hidden xl:table-cell">Arrival</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">Status</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">Action</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {applications.map((application) => (
                                <tr key={application.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle text-gray-500">{application.id}</td>
                                    <td className="p-4 align-middle font-bold text-slate-800">
                                        {application.formData?.first_name} {application.formData?.last_name}
                                    </td>
                                    <td className="p-4 align-middle hidden sm:table-cell">
                                        <span className="flex items-center gap-2 font-medium text-slate-600">
                                            {application.applyingFromCountry?.name || countryName(application.formData.country)}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle hidden md:table-cell font-medium text-slate-600">{application.formData.passport_number}</td>
                                    <td className="p-4 align-middle hidden lg:table-cell text-slate-500">{application.formData.occupation || 'N/A'}</td>
                                    <td className="p-4 align-middle hidden xl:table-cell">
                                        <div className="text-slate-500 font-medium">{application.formData.arrival_date ? new Date(application.formData.arrival_date).toLocaleDateString() : 'N/A'}</div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        {getStatusBadge(application.status as string)}
                                    </td>
                                    <td className="p-4 align-middle">
                                        {checkPermission('application:view:by-id') && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate(`/dashboard/journalists/${application.id}`)}
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            Showing {applications.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-{Math.min(currentPage * itemsPerPage, total)} of {total}
                        </span>
                        <select
                            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
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

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            &lt;
                        </Button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                                page = i + 1;
                            } else if (currentPage <= 3) {
                                page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                page = totalPages - 4 + i;
                            } else {
                                page = currentPage - 2 + i;
                            }
                            return (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
                                >
                                    {page}
                                </Button>
                            );
                        })}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            &gt;
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
