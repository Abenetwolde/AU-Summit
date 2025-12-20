import { useState } from 'react';
import { MOCK_JOURNALISTS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, BadgeCheck, UserX, CircleDashed, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';
import { Download, Edit2 } from 'lucide-react';
import { exportJournalistsToCSV, exportJournalistsToPDF } from '@/lib/export-utils';
import { StatusChangeModal } from '@/components/modals/StatusChangeModal';
import { useAuth, UserRole } from '@/auth/context';

export function ICSAccreditedJournalists() {
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [itemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedJournalist, setSelectedJournalist] = useState<any>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const { user } = useAuth();
    const isReadOnly = user?.role === UserRole.NISS_OFFICER;

    const filteredData = MOCK_JOURNALISTS.filter(j =>
        j.status === 'Approved' &&
        (j.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            j.passportNo.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCountry ? j.country === selectedCountry : true)
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const countryName = (code: string) => en[code as keyof typeof en] || code;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700';
            case 'Pending': return 'bg-orange-100 text-orange-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-500';
            case 'Pending': return 'bg-orange-500';
            case 'Rejected': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">&gt; Journalists</p>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Accredited Journalists (ICS)</h2>
                    <p className="text-muted-foreground">View and manage journalists who have been approved for entry.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => exportJournalistsToCSV(filteredData)}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => exportJournalistsToPDF(filteredData)}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* ICS Approved */}
                <Card className="bg-green-100/50 border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                            <BadgeCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">ICS Approved</p>
                            <p className="text-2xl font-bold text-gray-900">56</p>
                        </div>
                    </CardContent>
                </Card>

                {/* ICS Reject */}
                <Card className="bg-red-100/50 border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-red-200 flex items-center justify-center">
                            <UserX className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">ICS Reject</p>
                            <p className="text-2xl font-bold text-gray-900">05</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Partially Accredited */}
                
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
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <label className="text-sm font-medium">Country</label>
                            <CountrySelect
                                value={selectedCountry}
                                onChange={setSelectedCountry}
                                placeholder="All countries"
                            />
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <input
                                type="date"
                                className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2">
                            <Button className="flex-1 bg-blue-700 hover:bg-blue-800 text-white h-11">
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
            <Card>
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">No</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">FULLNAME</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">COUNTRY</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">PASSPORT NO</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">ETHIOPIA MEDIA<br />AUTHORITY</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">CUSTOMS</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">IMMIGRATION<br />AND CITIZENSHIP</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {paginatedData.map((journalist, index) => {
                                const emaStatus = 'Approved';
                                const custStatus = index % 3 === 0 ? 'Rejected' : 'Approved';
                                const immStatus = index % 2 === 0 ? 'Approved' : 'Pending';

                                return (
                                    <tr key={journalist.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">{journalist.id}</td>
                                        <td className="p-4 align-middle font-medium">{journalist.fullname}</td>
                                        <td className="p-4 align-middle">
                                            <span className="flex items-center gap-2 font-bold">
                                                <span className="text-lg leading-none">{getFlagEmoji(journalist.country)}</span>
                                                {countryName(journalist.country)}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">{journalist.passportNo}</td>

                                        {/* EMA Status */}
                                        <td className="p-4 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(emaStatus)}`}>
                                                <span className={`h-2 w-2 rounded-full ${getStatusDot(emaStatus)}`} />
                                                {emaStatus}
                                            </span>
                                        </td>
                                        {/* Customs Status */}
                                        <td className="p-4 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(custStatus)}`}>
                                                <span className={`h-2 w-2 rounded-full ${getStatusDot(custStatus)}`} />
                                                {custStatus}
                                            </span>
                                        </td>
                                        {/* Immigration Status */}
                                        <td className="p-4 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(immStatus)}`}>
                                                <span className={`h-2 w-2 rounded-full ${getStatusDot(immStatus)}`} />
                                                {immStatus}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            {!isReadOnly && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedJournalist(journalist);
                                                        setIsStatusModalOpen(true);
                                                    }}
                                                    className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                    Change Status
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            Showing {paginatedData.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length}
                        </span>
                    </div>
                </div>
            </Card>

            <StatusChangeModal
                open={isStatusModalOpen}
                onOpenChange={(open) => setIsStatusModalOpen(open)}
                journalistName={selectedJournalist?.fullname || ''}
                currentStatus="Approved"
                onConfirm={(newStatus, reason) => {
                    console.log(`Changing status to ${newStatus} for reason: ${reason}`);
                    setIsStatusModalOpen(false);
                }}
            />
        </div>
    );
}
