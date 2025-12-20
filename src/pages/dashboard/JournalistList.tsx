import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MOCK_JOURNALISTS } from '@/data/mock';
import { Search, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';

export function JournalistList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = MOCK_JOURNALISTS.filter(j =>
        (j.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            j.passportNo.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCountry ? j.country === selectedCountry : true)
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const countryName = (code: string) => en[code as keyof typeof en] || code;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm text-muted-foreground mb-1">&gt; Journalists</p>
                <h2 className="text-3xl font-bold font-sans text-gray-900">List of Journalists</h2>
                <p className="text-muted-foreground">Manage and review all registered media personnel for the event.</p>
            </div>

            {/* Filter Section */}
            <Card className="bg-gray-50/50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5 space-y-2">
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

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <select className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                <option>All Role</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2">
                            <Button className="flex-1 bg-blue-700 hover:bg-blue-800 text-white h-11">
                                Filter
                            </Button>
                            <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => {
                                setSearchTerm('');
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
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ROLE</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">STATUS</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {paginatedData.map((journalist) => (
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
                                    <td className="p-4 align-middle">{journalist.role}</td>
                                    <td className="p-4 align-middle">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${journalist.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                            journalist.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${journalist.status === 'Approved' ? 'bg-green-600' :
                                                journalist.status === 'Pending' ? 'bg-yellow-600' :
                                                    'bg-red-600'
                                                }`} />
                                            {journalist.status}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-blue-500 border-blue-200 hover:bg-blue-50 hover:text-blue-700 font-bold"
                                            onClick={() => navigate(`/dashboard/journalists/${journalist.id}`)}
                                        >
                                            View More
                                        </Button>
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
                            Showing {paginatedData.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length}
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
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
                            >
                                {page}
                            </Button>
                        ))}
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
