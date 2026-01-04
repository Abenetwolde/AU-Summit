import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Filter, Eye, Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/context';
import { Card, CardContent } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import en from 'react-phone-number-input/locale/en';
import { exportJournalistsToCSV, exportJournalistsToPDF } from '@/lib/export-utils';
import { useGetApplicationsQuery, useGetWorkflowApplicationsQuery } from '@/store/services/api';

// Type for workflow step info
interface WorkflowStepInfo {
    key: string;
    name: string;
    displayOrder: number;
}

export function JournalistList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');

    const { checkPermission, user } = useAuth();

    // Conditional API Query based on user role
    const isSuperAdmin = user?.roleName === 'SUPER_ADMIN';

    // Use workflow API for non-super-admin users
    const { data: workflowData, isLoading: isWorkflowLoading, isError: isWorkflowError } = useGetWorkflowApplicationsQuery(
        { page: 1, limit: 50, search: searchTerm },
        { skip: isSuperAdmin } // Skip this query if user is super admin
    );

    // Use regular API for super admin
    const { data: regularData, isLoading: isRegularLoading, isError: isRegularError } = useGetApplicationsQuery(
        { page: 1, limit: 50 },
        { skip: !isSuperAdmin } // Skip this query if user is NOT super admin
    );

    // Select the appropriate data based on role
    const apiData = isSuperAdmin ? regularData : workflowData;
    const isLoading = isSuperAdmin ? isRegularLoading : isWorkflowLoading;

    const countryName = (code: string) => code ? en[code as keyof typeof en] || code : 'Unknown';

    const getBasePath = () => {
        return '/dashboard';
    };

    const basePath = getBasePath();

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

    // Filter Logic
    const filteredData = displayData.filter((app: any) => {
        const fullName = app.formData?.first_name
            ? `${app.formData.first_name} ${app.formData.last_name || ''}`
            : app.user?.fullName || 'Unknown';

        const passport = app.formData?.passport_number || '';
        const country = app.formData?.country || '';
        const countryNameVal = countryName(country);

        const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            passport.toLowerCase().includes(searchTerm.toLowerCase());

        // Check if selectedCountry matches either the code or the resolved name
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
                        onClick={() => exportJournalistsToCSV(filteredData as any)}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => exportJournalistsToPDF(filteredData as any)}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export PDF
                    </Button>
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
            <Card className="border-0 shadow-sm overflow-hidden bg-white">
                <div className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                    <table className="w-full caption-bottom text-sm min-w-[800px]">
                        <thead className="[&_tr]:border-b bg-gray-50/50">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">No</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">JOURNALIST</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider hidden sm:table-cell">COUNTRY</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">PASSPORT NO</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider hidden md:table-cell">SUBMISSION DATE</th>
                                
                                {/* EMA Status - Using application.status */}
                                <th className="h-12 px-4 text-center align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">EMA STATUS</th>
                                
                                {/* Dynamic workflow step columns using workflowStep.name */}
                                {workflowStepInfo.map((step) => (
                                    <th 
                                        key={step.key}
                                        className="h-12 px-4 text-center align-middle font-medium text-gray-500 uppercase text-xs tracking-wider hidden xl:table-cell"
                                    >
                                        {step.name.toUpperCase()}
                                    </th>
                                ))}
                                
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredData.map((app: any, index: number) => {
                                // Data mapping
                                const fullName = app.formData?.first_name
                                    ? `${app.formData.first_name} ${app.formData.last_name || ''}`
                                    : app.user?.fullName || 'Unknown';
                                const occupation = app.formData?.occupation || 'Journalist';
                                const country = app.formData?.country || '';
                                const passport = app.formData?.passport_number || 'N/A';
                                const submissionDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB') : 'N/A';

                                // EMA Status - using application.status
                                const emaStatus = app.status || 'PENDING';

                                return (
                                    <tr key={app.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle text-gray-500">0{index + 1}</td>
                                        <td className="p-4 align-middle">
                                            <div className="font-bold text-gray-900">{fullName}</div>
                                            <div className="text-xs text-gray-500">{occupation}</div>
                                        </td>
                                        <td className="p-4 align-middle hidden sm:table-cell">
                                            <div className="flex items-center gap-2 font-bold text-gray-700">
                                                {countryName(country)}
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
                                        
                                        <td className="p-4 align-middle">
                                            {checkPermission('application:view:by-id') && (
                                                <Button variant="outline" size="sm" className="hidden lg:flex h-8 text-blue-500 border-blue-200 hover:bg-blue-50 hover:text-blue-700 font-bold" onClick={() => navigate(`${basePath}/journalists/${app.id}`, { state: { application: app } })}>
                                                    View More <Eye className="ml-1 h-3 w-3" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {displayData.length === 0 && (
                                <tr>
                                    <td colSpan={5 + workflowStepInfo.length} className="p-8 text-center text-muted-foreground">
                                        No applications found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm text-gray-500">Page {apiData?.currentPage || 1} of {apiData?.totalPages || 1}</span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={apiData?.currentPage === 1} className="h-8 w-16">Prev</Button>
                        <Button variant="outline" size="sm" disabled={!apiData?.totalPages || apiData.currentPage >= apiData.totalPages} className="h-8 w-16">Next</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}