import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_JOURNALISTS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Search, Filter, Eye, Printer, Users, Clock, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';

export function BadgeManagement() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedJournalists, setSelectedJournalists] = useState<string[]>([]);

    const countryName = (code: string) => en[code as keyof typeof en] || code;

    // Filter only approved journalists
    const approvedJournalists = MOCK_JOURNALISTS.filter(j => j.status === 'Approved');

    const filteredData = approvedJournalists.filter(j =>
        (j.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            j.passportNo.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCountry ? j.country === selectedCountry : true)
    );

    const handleSelectJournalist = (id: string) => {
        setSelectedJournalists(prev =>
            prev.includes(id) ? prev.filter(jId => jId !== id) : [...prev, id]
        );
    };

    const handlePrintSelected = () => {
        console.log('Printing badges for:', selectedJournalists);
        // Navigate to print view or trigger print dialog
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold font-sans text-gray-900">Badge Management</h2>
                    <p className="text-sm text-muted-foreground">Print event badge for approved journalists.</p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 w-full sm:w-auto">
                    <Printer className="h-4 w-4" />
                    Printer Ready
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Approved */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Approved</p>
                            <p className="text-2xl font-bold text-gray-900">102</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Printing */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending Printing</p>
                            <p className="text-2xl font-bold text-gray-900">72</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Badge Issued */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <BadgeCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Badge Issued</p>
                            <p className="text-2xl font-bold text-gray-900">114</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Section */}
            <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
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
                        <Button variant="outline" className="h-11 px-6 gap-2 bg-gray-50 border-gray-200 text-gray-700 font-bold w-full lg:w-auto">
                            Filter <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Ready to Print Badge */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-blue-600 font-bold">
                    <Printer className="h-4 w-4" />
                    Ready to Print
                </div>
                {selectedJournalists.length > 0 && (
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full sm:w-auto"
                        onClick={handlePrintSelected}
                    >
                        <Printer className="h-4 w-4" />
                        Print Selected ({selectedJournalists.length})
                    </Button>
                )}
            </div>

            {/* Table */}
            <Card className="border-0 shadow-sm">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b bg-gray-50/50">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedJournalists(filteredData.map(j => j.id));
                                            } else {
                                                setSelectedJournalists([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">No</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">JOURNALIST</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">ROLE</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">MEDIA ORG</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">COUNTRY</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">STATUS</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredData.map((journalist, index) => {
                                const isReady = index % 3 !== 2; // Most are ready, some are on hold
                                const isSelected = selectedJournalists.includes(journalist.id);

                                return (
                                    <tr key={journalist.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300"
                                                checked={isSelected}
                                                onChange={() => handleSelectJournalist(journalist.id)}
                                            />
                                        </td>
                                        <td className="p-4 align-middle text-gray-500">0{index + 1}</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                                                    <img src={journalist.photoUrl} alt={journalist.fullname} className="h-full w-full object-cover" />
                                                </div>
                                                <div className="font-bold text-gray-900">{journalist.fullname}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-gray-700">{journalist.role}</td>
                                        <td className="p-4 align-middle text-gray-700">CNN NEWS</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2 font-bold text-gray-700">
                                                <span className="text-lg leading-none">{getFlagEmoji(journalist.country)}</span>
                                                {countryName(journalist.country)}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isReady ? 'bg-cyan-100 text-cyan-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {isReady ? 'Ready' : 'Hold'}
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
                                                    Print
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => navigate(`/au-admin/badge-slip/${journalist.id}`)}
                                                >
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm text-gray-500">Showing {filteredData.length} records</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 mr-2">Previous</span>
                        <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 border-0 h-8 w-8 p-0">1</Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">2</Button>
                        <span className="text-gray-400">...</span>
                        <span className="text-sm text-gray-500 ml-2">Next</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
