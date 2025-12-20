import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_JOURNALISTS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Search, Filter, Eye, Download } from 'lucide-react';
import { useAuth, UserRole } from '@/auth/context';
import { Card, CardContent } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';
import { exportJournalistsToCSV, exportJournalistsToPDF } from '@/lib/export-utils';

export function AdminJournalistList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');

    const { user } = useAuth();
    const countryName = (code: string) => en[code as keyof typeof en] || code;

    const getBasePath = () => {
        if (user?.role === UserRole.SUPER_ADMIN) return '/admin';
        if (user?.role === UserRole.NISS_OFFICER) return '/niss';
        return '/admin';
    };

    const basePath = getBasePath();

    const filteredData = MOCK_JOURNALISTS.filter(j =>
        (j.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            j.passportNo.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCountry ? j.country === selectedCountry : true)
    );

    // Mock statuses for the admin view since original mock data is simple
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
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Journalists List</h2>
                    <p className="text-muted-foreground font-bold">Total Applications: <span className="text-gray-900">560</span></p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => exportJournalistsToCSV(filteredData, 'journalists_list.csv')}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => exportJournalistsToPDF(filteredData, 'journalists_list.pdf', 'Journalists List')}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        placeholder="Search by Name, Passport Number...."
                                        className="w-full pl-9 pr-4 h-11 rounded-md border border-gray-200 bg-gray-50 text-sm focus:outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500">Country</label>
                                <CountrySelect
                                    value={selectedCountry}
                                    onChange={setSelectedCountry}
                                    placeholder="All countries"
                                />
                            </div>
                        </div>
                        <Button variant="outline" className="h-11 px-6 gap-2 bg-gray-50 border-gray-200 text-gray-700 font-bold">
                            Filter <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-0 shadow-sm">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b bg-gray-50/50">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">No</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">JOURNALIST</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">COUNTRY</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">PASSPORT NO</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">SUBMISSION DATE</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">ETHIOPIA MEDIA<br />AUTHORITY</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">IMMIGRATION<br />AND<br />CITIZENSHIP</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">CUSTOMS</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredData.map((journalist, index) => {
                                // Mock random statuses for demo
                                const emaStatus = journalist.status === 'Approved' ? 'Approved' : 'Pending';
                                const immStatus = index % 2 === 0 ? 'Approved' : 'Pending';
                                const custStatus = index % 3 === 0 ? 'Rejected' : 'Approved';

                                return (
                                    <tr key={journalist.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle text-gray-500">0{index + 1}</td>
                                        <td className="p-4 align-middle">
                                            <div className="font-bold text-gray-900">{journalist.fullname}</div>
                                            <div className="text-xs text-gray-500">{journalist.role}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2 font-bold text-gray-700">
                                                <span className="text-lg leading-none">{getFlagEmoji(journalist.country)}</span>
                                                {countryName(journalist.country)}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle font-bold text-gray-700">{journalist.passportNo}</td>
                                        <td className="p-4 align-middle font-bold text-gray-600 flex items-center gap-2">
                                            <span className="text-blue-400">📅</span> 16 Dec 2025
                                        </td>

                                        {/* EMA Status */}
                                        <td className="p-4 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(emaStatus)}`}>
                                                <span className={`h-2 w-2 rounded-full ${getStatusDot(emaStatus)}`} />
                                                {emaStatus}
                                            </span>
                                        </td>
                                        {/* Immigration Status */}
                                        <td className="p-4 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(immStatus)}`}>
                                                <span className={`h-2 w-2 rounded-full ${getStatusDot(immStatus)}`} />
                                                {immStatus}
                                            </span>
                                        </td>
                                        {/* Customs Status */}
                                        <td className="p-4 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(custStatus)}`}>
                                                <span className={`h-2 w-2 rounded-full ${getStatusDot(custStatus)}`} />
                                                {custStatus}
                                            </span>
                                        </td>

                                        <td className="p-4 align-middle">
                                            <Button variant="outline" size="sm" className="hidden lg:flex h-8 text-blue-500 border-blue-200 hover:bg-blue-50 hover:text-blue-700 font-bold" onClick={() => navigate(`${basePath}/journalists/${journalist.id}`)}>
                                                View More <Eye className="ml-1 h-3 w-3" />
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Simplified import from old one or reuse logic properly later, keep static for now per requirement to translate design) */}
                <div className="p-4 border-t flex items-center justify-end gap-2">
                    <span className="text-sm text-gray-500 mr-4">Previous</span>
                    <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 border-0 h-8 w-8 p-0">1</Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">2</Button>
                    <span className="text-gray-400">...</span>
                    <span className="text-sm text-gray-500 ml-2">Next</span>
                </div>
            </Card>
        </div>
    );
}
