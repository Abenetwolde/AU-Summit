import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, CheckCircle, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
    useGetEntriesQuery,
    useMarkAsEnteredMutation,
    useMarkAsExitedMutation,
    ApplicationStatus
} from '@/store/services/api';
import { LogOut } from 'lucide-react';
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
    const [exitDialogOpen, setExitDialogOpen] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // API Hooks
    const { data, isLoading, refetch, isFetching } = useGetEntriesQuery({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: statusFilter === 'ALL' ? undefined : statusFilter
    });

    const [markAsEntered, { isLoading: isMarking }] = useMarkAsEnteredMutation();
    const [markAsExited, { isLoading: isMarkingExit }] = useMarkAsExitedMutation();

    const applications = data?.entries || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleMarkAsEntered = async () => {
        if (!selectedAppId) return;

        try {
            await markAsEntered({
                applicationId: selectedAppId,
                location: selectedLocation
            }).unwrap();

            toast.success('Journalist marked as entered successfully');
            setConfirmDialogOpen(false);
            setSelectedAppId(null);
            refetch();
        } catch (error) {
            toast.error('Failed to mark entry');
            console.error(error);
        }
    };

    const handleMarkAsExited = async () => {
        if (!selectedAppId) return;

        try {
            await markAsExited({
                applicationId: selectedAppId
            }).unwrap();

            toast.success('Journalist marked as exited successfully');
            setExitDialogOpen(false);
            setSelectedAppId(null);
            refetch();
        } catch (error) {
            toast.error('Failed to mark exit');
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
                    <p className="text-sm text-muted-foreground mb-1">&gt; Entry Control</p>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Journalist Entry Tracking</h2>
                    <p className="text-muted-foreground">Manage and track journalist entries at the airport.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="bg-gray-50/50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-8 space-y-2">
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    placeholder="Search by Name, Passport Number..."
                                    className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && refetch()}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-4 space-y-2">
                            <label className="text-sm font-medium">Status Filter</label>
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending Entry</option>
                                <option value="ENTERED">Entered</option>
                                <option value="EXITED">Exited</option>
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
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase text-xs">Entry/Exit Detail</th>
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
                                                        Mark Entered
                                                    </Button>
                                                )}
                                                {isEntered(app) && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-1"
                                                        onClick={() => {
                                                            setSelectedAppId(app.id);
                                                            setExitDialogOpen(true);
                                                        }}
                                                    >
                                                        <LogOut className="h-3.5 w-3.5" />
                                                        Mark Exited
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
                        <DialogTitle>Confirm Entry</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to mark this journalist as having entered the country?
                            This action will record the timestamp and location.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="location" className="text-right">
                            Location / Gate
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
                        <Button onClick={handleMarkAsEntered} disabled={isMarking} className="bg-green-600 hover:bg-green-700">
                            {isMarking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Entry
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Exit</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to mark this journalist as having exited the country?
                            This will record the exit timestamp.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExitDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleMarkAsExited} disabled={isMarkingExit} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {isMarkingExit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Exit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
