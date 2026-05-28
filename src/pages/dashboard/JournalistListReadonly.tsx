import React, { useState } from 'react';
import { Search, Filter, Loader2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CountrySelect } from '@/components/ui/country-select';
import en from 'react-phone-number-input/locale/en';
import { useGetApplicationsQuery } from '@/store/services/api';
import { FormFilter } from '@/components/dashboard/FormFilter';

// Type for workflow step info
interface WorkflowStepInfo {
    key: string;
    name: string;
    displayOrder: number;
}

export function JournalistListReadonly() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedFormId, setSelectedFormId] = useState<string | undefined>(undefined);
    const [page, setPage] = useState(1);
    const limit = 50;

    // Use regular API since this page is for application:view:readonly which is mapped to the get all applications route
    const { data: apiData, isLoading, isError } = useGetApplicationsQuery(
        { 
            page, 
            limit, 
            search: searchTerm,
            formId: selectedFormId ? Number(selectedFormId) : undefined 
        }
    );

    const countryName = (code: string) => code ? en[code as keyof typeof en] || code : 'Unknown';

    // Helper function to get approval status by key
    const getApprovalStatus = (app: any, key: string): string => {
        if (!app.approvals || !Array.isArray(app.approvals)) {
            return 'PENDING'; // Fallback status
        }

        const approval = app.approvals.find((a: any) =>
            a.workflowStep && a.workflowStep.key === key
        );

        return approval?.status || 'PENDING';
    };

    // Helper function to get workflow step info (key, name, displayOrder)
    const getWorkflowStepInfo = (): WorkflowStepInfo[] => {
        if (!apiData?.applications || apiData.applications.length === 0) {
            // Return default steps if no data
            return [
                { key: 'immigration', name: 'Immigration Check', displayOrder: 50 },
                { key: 'equipment', name: 'Equipment Verification', displayOrder: 10 },
                { key: 'drone', name: 'Drone Clearance', displayOrder: 20 }
            ];
        }

        // Collect unique workflow steps from all applications
        const stepMap = new Map<string, WorkflowStepInfo>();

        apiData.applications.forEach((app: any) => {
            if (app.approvals && Array.isArray(app.approvals)) {
                app.approvals.forEach((approval: any) => {
                    if (approval.workflowStep) {
                        const { key, name, displayOrder } = approval.workflowStep;
                        if (key && name) {
                            // Only add if not already in map or if this has a higher displayOrder
                            if (!stepMap.has(key) || (stepMap.get(key)?.displayOrder || 0) < (displayOrder || 0)) {
                                stepMap.set(key, {
                                    key,
                                    name,
                                    displayOrder: displayOrder || 0
                                });
                            }
                        }
                    }
                });
            }
        });

        // Convert to array and sort by displayOrder
        const steps = Array.from(stepMap.values());
        return steps.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    };

    // Get workflow step info for dynamic column rendering
    const workflowStepInfo = getWorkflowStepInfo();

    const applications = apiData?.applications || [];
    const displayData = applications.length > 0 ? applications : [];

    // Filter Logic (Frontend filter as fallback)
    const filteredData = displayData.filter((app: any) => {
        const fullName = app.formData?.first_name
            ? `${app.formData.first_name} ${app.formData.last_name || ''}`
            : app.user?.fullName || 'Unknown';

        const passport = app.formData?.passport_number || '';
        const country = app.formData?.country || app.formData?.nationality || '';
        const countryNameVal = countryName(country);

        const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            passport.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCountry = selectedCountry
            ? (country === selectedCountry || countryNameVal === selectedCountry || country === countryName(selectedCountry))
            : true;

        return matchesSearch && matchesCountry;
    });

    const getStatusColor = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'APPROVED':
            case 'VERIFIED':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'PENDING':
            case 'IN_REVIEW':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'REJECTED':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'NOT_APPLICABLE':
                return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'EXITED':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusDot = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'APPROVED':
            case 'VERIFIED':
                return 'bg-green-500';
            case 'PENDING':
            case 'IN_REVIEW':
                return 'bg-orange-500';
            case 'REJECTED':
                return 'bg-red-500';
            case 'NOT_APPLICABLE':
                return 'bg-gray-500';
            case 'EXITED':
                return 'bg-purple-500';
            default:
                return 'bg-gray-500';
        }
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (isError) {
        return <div className="flex h-96 items-center justify-center text-red-500 font-medium">Failed to load applications. Make sure you have the necessary permissions.</div>;
    }

    return (
        <div className="space-y-6 mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Journalists List</h2>
                    <p className="text-muted-foreground font-bold">Total Applications: <span className="text-gray-900">{apiData?.total || 0}</span></p>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
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
                                <label className="text-sm font-medium text-gray-500">Nationality</label>
                                <CountrySelect
                                    value={selectedCountry}
                                    onChange={setSelectedCountry}
                                    placeholder="All Nationalities"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500">Event Form</label>
                                <FormFilter 
                                    value={selectedFormId}
                                    onChange={setSelectedFormId}
                                    className="w-full"
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
            <Card className="border-0 shadow-sm overflow-hidden bg-white flex flex-col max-h-[calc(100vh-10rem)]">
                <div className="relative w-full overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 flex-1">
                    <table className="w-full caption-bottom text-sm min-w-[800px]">
                        <thead className="sticky top-0 z-10 [&_tr]:border-b bg-gray-50 shadow-sm">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">No</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">JOURNALIST</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider hidden sm:table-cell">NATIONALITY</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">PASSPORT NO</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider hidden md:table-cell">SUBMISSION DATE</th>

                                {/* EMA Status - Using application.status */}
                                <th className="h-12 px-4 text-center align-middle font-medium text-gray-500 uppercase text-xs tracking-wider"> STATUS</th>

                                {/* Dynamic workflow step columns using workflowStep.name */}
                                {workflowStepInfo.map((step) => (
                                    <th
                                        key={step.key}
                                        className="h-12 px-4 text-center align-middle font-medium text-gray-500 uppercase text-xs tracking-wider hidden xl:table-cell"
                                    >
                                        {step.name.toUpperCase()}
                                    </th>
                                ))}

                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider sticky right-0 bg-gray-50 z-20 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredData.map((app: any, index: number) => {
                                // Data mapping
                                const fullName = app.formData?.first_name
                                    ? `${app.formData.first_name} ${app.formData.last_name || ''}`
                                    : app.user?.fullName || 'Unknown';
                                const occupation = app.formData?.occupation || 'Journalist';
                                const country = app.formData?.country || app.formData?.nationality || '';
                                const passport = app.formData?.passport_number || 'N/A';
                                const submissionDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB') : 'N/A';

                                // EMA Status - using application.status
                                const emaStatus = app.status || 'PENDING';

                                return (
                                    <tr key={app.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle text-gray-500">0{index + 1}</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                                    {app.formData?.profile_photo ? (
                                                        <img src={`${import.meta.env.VITE_API_BASE_URL}/${app.formData.profile_photo}`} alt={fullName} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-sm">

                                                            {fullName.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>

                                                    <div className="font-bold text-gray-900">{fullName}</div>
                                                    <div className="text-xs text-gray-500">{occupation}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle hidden sm:table-cell">
                                            <div className="flex items-center gap-2 font-bold text-gray-700">
                                                {app.applyingFromCountry?.name || countryName(country)}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle font-bold text-gray-700">{passport}</td>
                                        <td className="p-4 align-middle font-bold text-gray-600 hidden md:table-cell">
                                            <span className="text-blue-400 mr-2">📅</span> {submissionDate}
                                        </td>

                                        {/* EMA Status */}
                                        <td className="p-4 align-middle text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${getStatusColor(emaStatus)} border`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(emaStatus)}`} />
                                                {emaStatus}
                                            </span>
                                        </td>

                                        {/* Dynamic workflow step status columns */}
                                        {workflowStepInfo.map((step) => {
                                            const stepStatus = getApprovalStatus(app, step.key);
                                            return (
                                                <td
                                                    key={step.key}
                                                    className="p-4 align-middle text-center hidden xl:table-cell"
                                                >
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${getStatusColor(stepStatus)} border`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(stepStatus)}`} />
                                                        {stepStatus}
                                                    </span>
                                                </td>
                                            );
                                        })}

                                        <td className="p-4 align-middle sticky right-0 bg-white group-hover:bg-muted/50 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                                            <Button variant="outline" size="sm" className="hidden lg:flex h-8 text-blue-500 border-blue-200 hover:bg-blue-50 hover:text-blue-700 font-bold" onClick={() => window.location.href = `/dashboard/journalists-view/${app.id}`}>
                                                View More <Eye className="ml-1 h-3 w-3" />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {displayData.length === 0 && (
                                <tr>
                                    <td colSpan={7 + workflowStepInfo.length} className="p-8 text-center text-muted-foreground">
                                        No applications found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => p + 1)}
                            disabled={!apiData?.applications || apiData.applications.length < limit || isLoading}
                        >
                            Next
                        </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{page}</span>
                                {apiData?.total ? (
                                    <> of <span className="font-medium">{Math.ceil(apiData.total / limit)}</span> pages</>
                                ) : ''}
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <Button
                                    variant="outline"
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || isLoading}
                                >
                                    <span className="sr-only">Previous</span>
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 ml-2"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!apiData?.applications || apiData.applications.length < limit || isLoading}
                                >
                                    <span className="sr-only">Next</span>
                                    Next
                                </Button>
                            </nav>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
