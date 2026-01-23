import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FileText,
    Edit // Import Edit icon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // For navigation
import {
    useGetManualApplicationsQuery,
    Application
} from '@/store/services/api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function ManualApplications() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // API Hooks
    const {
        data: applicationsData,
        isLoading,
        isFetching
    } = useGetManualApplicationsQuery({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch
    });

    const applications = applicationsData?.applications || [];
    const totalApplications = applicationsData?.total || 0;
    const totalPages = applicationsData?.totalPages || 1;

    const handleEdit = (id: number) => {
        // Navigate to manual entry page with edit mode
        // Assuming route will be implemented to handle query param or path param
        // For now, let's route to a hypothetical edit path or the existing manual-entry with a query param
        navigate(`/dashboard/manual-entry?edit=${id}`);
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 font-sans">Manual Applications</h2>
                    <p className="text-muted-foreground mt-1">Manage and edit manually entered applications.</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                        <div className="relative flex-1 max-w-lg">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name, email or passport..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 border-gray-200 transition-all focus:ring-2 focus:ring-[#009b4d]/20 focus:border-[#009b4d]"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Applications Table Card */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardHeader className="subtle-border-b px-6 py-4 flex flex-row items-center justify-between bg-gray-50/50">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-[#009b4d]" /> : <div className="h-2 w-2 rounded-full bg-[#009b4d]" />}
                        Applications List
                        <span className="text-sm font-normal text-muted-foreground ml-1">({totalApplications} total)</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">Rows per page:</p>
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                            <SelectTrigger className="w-[70px] h-8 border-gray-200">
                                <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/30 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-100">
                                    <th className="text-left py-4 px-6 tracking-wider">Applicant</th>
                                    <th className="text-left py-4 px-6 tracking-wider">Nationality</th>
                                    <th className="text-left py-4 px-6 tracking-wider">Status</th>
                                    <th className="text-left py-4 px-6 tracking-wider">Submitted</th>
                                    <th className="text-right py-4 px-6 tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin h-10 w-10 text-[#009b4d]" />
                                                <p className="text-sm text-gray-500 font-medium">Fetching applications...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : applications.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <FileText className="h-12 w-12 opacity-20" />
                                                <p className="text-lg font-semibold mt-2">No applications found</p>
                                                <p className="text-sm">Try adjusting your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : applications.map((app: any) => (
                                    <tr key={app.id} className="group hover:bg-gray-50/80 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200 group-hover:bg-white transition-colors">
                                                    {/* Initials or generic icon */}
                                                    {app.user?.fullName ? app.user.fullName.charAt(0).toUpperCase() : 'A'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-bold text-gray-900 leading-tight">
                                                        {app.user?.fullName || 'Unknown User'}
                                                    </span>
                                                    <span className="text-sm text-gray-500">{app.user?.email || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm text-gray-700">
                                                {app.formData?.nationality || app.formData?.applying_from_country || '-'}
                                                <div className="text-xs text-gray-500 mt-0.5" >Passport: {app.formData?.passport_number || app.formData?.passportNumber || '-'}</div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium">
                                            <Badge variant="outline" className={`
                                                ${app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    app.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'}
                                            `}>
                                                {app.status}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600">
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(app.id)}
                                                className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 group-hover:shadow-sm"
                                                title="Edit Application"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>

                {/* Pagination Controls */}
                {totalApplications > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <div className="hidden sm:block">
                            <p className="text-sm text-gray-500 italic">
                                Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, totalApplications)}</span> of <span className="font-semibold text-gray-900">{totalApplications}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1 || isFetching}
                                className="h-9 w-9 p-0 border-gray-200 bg-white"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || isFetching}
                                className="h-9 w-9 p-0 border-gray-200 bg-white"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-1 px-2">
                                <span className="text-sm font-bold text-[#009b4d]">{currentPage}</span>
                                <span className="text-xs text-muted-foreground font-medium">/</span>
                                <span className="text-sm font-medium text-gray-600">{totalPages}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || isFetching}
                                className="h-9 w-9 p-0 border-gray-200 bg-white"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages || isFetching}
                                className="h-9 w-9 p-0 border-gray-200 bg-white"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
