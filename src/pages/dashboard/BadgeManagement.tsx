import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Filter, Eye, Printer, Users, Clock, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';
import { useGetApprovedApplicationsQuery, useBulkGenerateBadgesMutation, FILE_BASE_URL } from '@/store/services/api';
import { toast } from 'sonner';

export function BadgeManagement() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedJournalists, setSelectedJournalists] = useState<number[]>([]);
    const [page, setPage] = useState(1);

    const { data: approvedData, isLoading } = useGetApprovedApplicationsQuery({ page, limit: 10 });
    const [bulkGenerate] = useBulkGenerateBadgesMutation();

    const countryName = (code: string) => en[code as keyof typeof en] || code;

    const filteredData = (approvedData?.applications || []).filter(app => {
        const fullname = app.user?.fullName?.toLowerCase() || '';
        const passport = app.formData?.passport_number?.toLowerCase() || '';
        return (fullname.includes(searchTerm.toLowerCase()) || passport.includes(searchTerm.toLowerCase())) &&
            (selectedCountry ? app.formData?.country === selectedCountry : true);
    });

    const handleSelectJournalist = (id: number) => {
        setSelectedJournalists(prev =>
            prev.includes(id) ? prev.filter(jId => jId !== id) : [...prev, id]
        );
    };

    const handlePrint = (applicationId: number) => {
        const url = `${FILE_BASE_URL}/api/v1/badges/generate/${applicationId}`;
        window.open(url, '_blank');
    };

    const handlePrintSelected = async () => {
        if (selectedJournalists.length === 0) return;

        const toastId = toast.loading(`Generating badges for ${selectedJournalists.length} individuals...`);
        try {
            const blob = await bulkGenerate({ applicationIds: selectedJournalists }).unwrap();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Bulk_Badges_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Badges generated successfully', { id: toastId });
        } catch (err) {
            console.error('Bulk generation failed:', err);
            toast.error('Failed to generate bulk badges', { id: toastId });
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading approved personnel...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Badge Management</h2>
                    <p className="text-muted-foreground">Print event badge for approved journalists and delegates.</p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <Printer className="h-4 w-4" />
                    Printer Ready
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Approved</p>
                            <p className="text-2xl font-bold text-gray-900">{approvedData?.total || 0}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Available to Print</p>
                            <p className="text-2xl font-bold text-gray-900">{approvedData?.applications?.filter(a => !a.entranceBadgeIssued).length || 0}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <BadgeCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Badges Issued</p>
                            <p className="text-2xl font-bold text-gray-900">{approvedData?.applications?.filter(a => a.entranceBadgeIssued).length || 0}</p>
                        </div>
                    </CardContent>
                </Card>
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

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600 font-bold">
                    <Printer className="h-4 w-4" />
                    Ready to Print
                </div>
                {selectedJournalists.length > 0 && (
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        onClick={handlePrintSelected}
                    >
                        <Printer className="h-4 w-4" />
                        Print Selected ({selectedJournalists.length})
                    </Button>
                )}
            </div>

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
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">PERSONNEL</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">APPLICATION TYPE</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">MEDIA/ORG</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">COUNTRY</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">STATUS</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredData.map((app, index) => {
                                const isSelected = selectedJournalists.includes(app.id);
                                const isIssued = app.entranceBadgeIssued;

                                return (
                                    <tr key={app.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300"
                                                checked={isSelected}
                                                onChange={() => handleSelectJournalist(app.id)}
                                            />
                                        </td>
                                        <td className="p-4 align-middle text-gray-500">{(page - 1) * 10 + index + 1}</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                                                    <img
                                                        src={app.formData?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.user?.fullName}`}
                                                        alt={app.user?.fullName}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="font-bold text-gray-900">{app.user?.fullName}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-gray-700 capitalize">{app.form?.type || 'Standard'}</td>
                                        <td className="p-4 align-middle text-gray-700">{app.formData?.organization || 'N/A'}</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2 font-bold text-gray-700">
                                                <span className="text-lg leading-none">{getFlagEmoji(app.formData?.country || '')}</span>
                                                {app.formData?.country ? countryName(app.formData?.country) : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isIssued ? 'bg-green-100 text-green-700' : 'bg-cyan-100 text-cyan-700'
                                                }`}>
                                                {isIssued ? 'Issued' : 'Ready'}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white h-8 gap-1"
                                                    onClick={() => handlePrint(app.id)}
                                                >
                                                    <Printer className="h-3 w-3" />
                                                    Print
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => navigate(`/au-admin/badge-slip/${app.id}`)}
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
                <div className="p-4 border-t flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-sm font-medium">Page {page} of {approvedData?.totalPages || 1}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= (approvedData?.totalPages || 1)}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            </Card>
        </div>
    );
}
