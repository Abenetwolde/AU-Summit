import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw, Globe, Search, RefreshCw, CheckCircle, Loader2, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    useGetEntriesQuery,
    useMarkAsEnteredMutation,
    ApplicationStatus
} from '@/store/services/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JournalistEntryControl() {
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    const [selectedLocation, setSelectedLocation] = useState('Addis Ababa Bole International Airport');
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
        setCurrentPage(1);
        toast.success('Filters reset');
    };

    // API Hooks
    const { data, isLoading, refetch, isFetching } = useGetEntriesQuery({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: statusFilter === 'ALL' ? undefined : statusFilter
    });

    const [markAsEntered, { isLoading: isMarking }] = useMarkAsEnteredMutation();

    const applications = data?.entries || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleConfirmArrival = async () => {
        if (!selectedAppId) return;

        try {
            await markAsEntered({
                applicationId: selectedAppId,
                location: selectedLocation
            }).unwrap();

            toast.success('Arrival confirmed successfully');
            setConfirmDialogOpen(false);
            setSelectedAppId(null);
            refetch();
        } catch (error) {
            toast.error('Failed to confirm arrival');
            console.error(error);
        }
    };

    const isEntered = (app: any) => {
        return app.journalistEntry?.status === 'ENTERED';
    };

    const isExited = (app: any) => {
        return app.journalistEntry?.status === 'EXITED';
    };

    const getStatusBadge = (app: any) => {
        if (isExited(app)) {
            return (
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none shadow-none">
                    Exited
                </Badge>
            );
        }
        if (isEntered(app)) {
            return (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none">
                    Entered
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                Pending Entry
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">&gt; Arrival Confirmation</p>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Journalist Arrival Management</h2>
                    <p className="text-muted-foreground">Confirm and track journalist arrivals at the port of entry.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-600" />
                        <CardTitle className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Arrival Filters</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-8 text-gray-600 hover:text-gray-700 hover:bg-gray-100/50 gap-2 font-medium"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear All
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Search className="w-3 h-3 text-gray-500" />
                                Search Journalist
                            </label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-gray-900 transition-colors" />
                                <input
                                    placeholder="Search by Name, Passport Number..."
                                    className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all h-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && refetch()}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                                <Clock className="w-3 h-3 text-gray-500" />
                                Arrival Status
                            </label>
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending Arrival</option>
                                <option value="ENTERED">Arrival Confirmed</option>
                                <option value="EXITED">Exited Country</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-0 shadow-sm overflow-hidden bg-white">
                <div className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">No</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">Fullname</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs hidden sm:table-cell">Passport No</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs hidden md:table-cell">Media House</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">Arrival/Exit Detail</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">Action</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {applications.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            No approved applications found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app: any) => (
                                        <tr key={app.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle text-gray-500">{app.id}</td>
                                            <td className="p-4 align-middle font-bold text-slate-800">
                                                {app.formData?.first_name} {app.formData?.last_name}
                                                <div className="text-xs font-normal text-muted-foreground">{app.user?.email || (app.formData as any)?.email}</div>
                                            </td>
                                            <td className="p-4 align-middle hidden sm:table-cell font-medium text-slate-600">
                                                {app.formData?.passport_number || 'N/A'}
                                            </td>
                                            <td className="p-4 align-middle hidden md:table-cell text-slate-600">
                                                {app.formData?.media_house || (app.formData as any)?.organization_name || 'N/A'}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {getStatusBadge(app)}
                                            </td>
                                            <td className="p-4 align-middle text-xs text-muted-foreground">
                                                {isExited(app) ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-orange-600 font-semibold uppercase text-[10px]">Exited</span>
                                                        <span>{new Date(app.journalistEntry?.exitDate).toLocaleString()}</span>
                                                    </div>
                                                ) : isEntered(app) ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" /> {app.journalistEntry?.location}
                                                        </span>
                                                        <span>{new Date(app.journalistEntry?.entryDate).toLocaleString()}</span>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {(!app.journalistEntry || app.journalistEntry.status === 'PENDING') && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 gap-1"
                                                        onClick={() => {
                                                            setSelectedAppId(app.id);
                                                            setConfirmDialogOpen(true);
                                                        }}
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        Confirm Arrival
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    )))}
                            </tbody>
                        </table>
                    )}
                </div>
                {/* Pagination */}
                <div className="p-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            Showing {applications.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-{Math.min(currentPage * itemsPerPage, total)} of {total}
                        </span>
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
                        <span className="text-sm font-medium px-2">Page {currentPage} of {totalPages}</span>
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

            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Arrival</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to confirm this journalist's arrival into the country?
                            This action will record the timestamp and point of entry.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="location" className="text-right">
                            Point of Entry / Gate
                        </Label>
                        <Input
                            id="location"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmArrival} disabled={isMarking} className="bg-green-600 hover:bg-green-700 text-white">
                            {isMarking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Arrival
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
