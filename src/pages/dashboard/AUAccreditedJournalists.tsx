import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_JOURNALISTS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';
import { Download, Edit2 } from 'lucide-react';
import { exportJournalistsToCSV, exportJournalistsToPDF } from '@/lib/export-utils';
import { StatusChangeModal } from '@/components/modals/StatusChangeModal';
import { useAuth, UserRole } from '@/auth/context';

export function AUAccreditedJournalists() {
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [itemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedJournalist, setSelectedJournalist] = useState<any>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const { user } = useAuth();
    const isReadOnly = user?.role === UserRole.NISS_OFFICER;
    const navigate = useNavigate();

    const filteredData = MOCK_JOURNALISTS.filter(j =>
        j.status === 'Approved' &&
        (j.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            j.passportNo.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCountry ? j.country === selectedCountry : true)
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const countryName = (code: string) => en[code as keyof typeof en] || code;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">&gt; Journalists</p>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Accredited Journalists</h2>
                    <p className="text-muted-foreground">View and print badges for accredited journalists.</p>
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
                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">BADGE STATUS</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {paginatedData.map((journalist, index) => {
                                const isPrinted = index % 3 !== 2;

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
                                        <td className="p-4 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isPrinted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {isPrinted ? 'Printed' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white h-8 gap-1"
                                                    onClick={() => navigate(`/au-admin/badge-slip/${journalist.id}`)}
                                                >
                                                    <Printer className="h-3 w-3" />
                                                    Print Badge
                                                </Button>
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
                                            </div>
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
