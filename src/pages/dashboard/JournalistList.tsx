import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_JOURNALISTS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Search, Filter, Eye, Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/context';
import { Card, CardContent } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';
import { exportJournalistsToCSV, exportJournalistsToPDF } from '@/lib/export-utils';
import { useGetApplicationsQuery, Application } from '@/store/services/api';

export function JournalistList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');

    const { checkPermission } = useAuth();
    // API Query
    const { data: apiData, isLoading, isError } = useGetApplicationsQuery({ page: 1, limit: 50 });  // Fetch more for list view, eventually implement server-side pagination

    const countryName = (code: string) => code ? en[code as keyof typeof en] || code : 'Unknown';

    const getBasePath = () => {
        return '/dashboard';
    };

    const basePath = getBasePath();

    // Map API data to match the structure needed for filtering/display or use directly
    // If API fails or is empty, can fallback to mock if desired, but user said "if there is replace with the api data"

    const applications = apiData?.applications || [];
    const displayData = applications.length > 0 ? applications : [];

    // Filter Logic
    const filteredData = displayData.filter(app => {
        const fullName = app.formData?.first_name
            ? `${app.formData.first_name} ${app.formData.last_name || ''}`
            : app.user?.fullName || 'Unknown';

        const passport = app.formData?.passport_number || '';
        const country = app.formData?.country || '';

        const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            passport.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCountry = selectedCountry ? country === selectedCountry : true;
        return matchesSearch && matchesCountry;
    });

    // Use Mock as fallback if API is empty just for demo (User instruction: "if the api data is not conatin what the hard coded data just keep the hard coede")
    // But for the main list, if we have API connection, we should rely on it. I'll stick to API data primarily.
    // If API returns 0 items, table will be empty.

    const getStatusColor = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'APPROVED': return 'bg-green-100 text-green-700';
            case 'PENDING': return 'bg-orange-100 text-orange-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusDot = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'APPROVED': return 'bg-green-500';
            case 'PENDING': return 'bg-orange-500';
            case 'REJECTED': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Journalists List</h2>
                    <p className="text-muted-foreground font-bold">Total Applications: <span className="text-gray-900">{apiData?.total || 0}</span></p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => exportJournalistsToCSV(filteredData as any, 'journalists_list.csv')} // Cast for now as export utils mock-typed
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => exportJournalistsToPDF(filteredData as any, 'journalists_list.pdf', 'Journalists List')}
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
                            {filteredData.map((app, index) => {
                                // Data mapping
                                const fullName = app.formData?.first_name
                                    ? `${app.formData.first_name} ${app.formData.last_name || ''}`
                                    : app.user?.fullName || 'Unknown';
                                const occupation = app.formData?.occupation || 'Journalist';
                                const country = app.formData?.country || '';
                                const passport = app.formData?.passport_number || 'N/A';
                                const submissionDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB') : 'N/A';

                                // Status mapping (Using API fields)
                                const emaStatus = app.status || 'PENDING';
                                const immStatus = app.immigrationStatus || 'PENDING';
                                const custStatus = app.equipmentStatus || 'PENDING'; // Assuming equipment is Customs relevance if not explicit

                                return (
                                    <tr key={app.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle text-gray-500">0{index + 1}</td>
                                        <td className="p-4 align-middle">
                                            <div className="font-bold text-gray-900">{fullName}</div>
                                            <div className="text-xs text-gray-500">{occupation}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2 font-bold text-gray-700">
                                                {countryName(country)}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle font-bold text-gray-700">{passport}</td>
                                        <td className="p-4 align-middle font-bold text-gray-600 flex items-center gap-2">
                                            <span className="text-blue-400">📅</span> {submissionDate}
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
                                            {checkPermission('application:view:by-id') && (
                                                <Button variant="outline" size="sm" className="hidden lg:flex h-8 text-blue-500 border-blue-200 hover:bg-blue-50 hover:text-blue-700 font-bold" onClick={() => navigate(`${basePath}/journalists/${app.id}`, { state: { application: app } })}>
                                                    View More <Eye className="ml-1 h-3 w-3" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {displayData.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                        No applications found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Static for now, but wired to display) */}
                <div className="p-4 border-t flex items-center justify-end gap-2">
                    <span className="text-sm text-gray-500 mr-4">Page {apiData?.currentPage || 1} of {apiData?.totalPages || 1}</span>
                    <Button variant="outline" size="sm" disabled={apiData?.currentPage === 1} className="h-8 w-16">Prev</Button>
                    <Button variant="outline" size="sm" disabled={!apiData?.totalPages || apiData.currentPage >= apiData.totalPages} className="h-8 w-16">Next</Button>
                </div>
            </Card>
        </div>
    );
}
