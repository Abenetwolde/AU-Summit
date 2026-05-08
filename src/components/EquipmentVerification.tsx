import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X, ShieldCheck, RotateCcw, ChevronLeft, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '@/auth/context';
import { useUpdateEquipmentStatusMutation, EquipmentStatus, useGetEquipmentByApplicationQuery, Equipment } from '@/store/services/api';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EquipmentVerificationProps {
    applicationId: number;
    onApprove?: () => void;
    onReject?: () => void;
    showActions?: boolean;
}

export function EquipmentVerification({
    applicationId,
    onApprove,
    onReject,
    showActions = true
}: EquipmentVerificationProps) {
    const { user, checkPermission } = useAuth();

    // Pagination and Filtering State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Fetch equipment with pagination and filtering
    const { data, isLoading, isError, refetch } = useGetEquipmentByApplicationQuery({
        applicationId,
        page,
        limit,
        status: statusFilter === 'ALL' ? undefined : statusFilter
    });

    const [updateStatus, { isLoading: isUpdating }] = useUpdateEquipmentStatusMutation();
    const [securityCheck, setSecurityCheck] = useState(false);
    const [restrictedAreaAccess, setRestrictedAreaAccess] = useState(false);
    const [equipmentVerified, setEquipmentVerified] = useState(true);

    const items = data?.equipment || [];
    const totalPages = data?.pages || 0;
    const totalItems = data?.total || 0;

    // Determine if current user can perform actions
    const hasPermission = checkPermission('verification:equipment:single:update');
    // For safety with existing mock roles
    const isCustoms = user?.role === UserRole.CUSTOMS_OFFICER;
    const isINSA = user?.role === UserRole.INSA_OFFICER;
    const canPerformActions = showActions && (hasPermission || isCustoms || isINSA || user?.role === UserRole.SUPER_ADMIN);

    const updateItemStatus = async (item: Equipment, newStatus: EquipmentStatus, rejectionReason?: string) => {
        try {
            await updateStatus({
                equipmentId: item.id,
                status: newStatus,
                rejectionReason
            }).unwrap();

            toast.success(`Equipment status updated to ${newStatus}`);
            // RTK Query will handle the cache invalidation and refetch if tags are set correctly
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to update equipment status');
        }
    };

    const getStatusBadge = (status: string) => {
        const s = status as EquipmentStatus;
        switch (s) {
            case EquipmentStatus.APPROVED:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700"><Check className="h-3 w-3 mr-1" /> Approved</span>;
            case EquipmentStatus.REJECTED:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><X className="h-3 w-3 mr-1" /> Rejected</span>;
            case EquipmentStatus.PENDING:
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">Pending</span>;
        }
    };

    return (
        <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex flex-col">
                    <CardTitle className="text-lg font-bold">Equipment List</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">Total items: {totalItems}</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value={EquipmentStatus.PENDING}>Pending</SelectItem>
                                <SelectItem value={EquipmentStatus.APPROVED}>Approved</SelectItem>
                                <SelectItem value={EquipmentStatus.REJECTED}>Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        {isINSA && <span className="text-xs text-blue-600 font-semibold flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Security Review (INSA)</span>}
                        {isCustoms && <span className="text-xs text-green-600 font-semibold">Customs Control</span>}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Equipment Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                    )}
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-tighter">Type</th>
                                <th className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-tighter">Model / Specs</th>
                                <th className="text-center px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-tighter">Status</th>
                                {canPerformActions && (
                                    <th className="text-right px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-tighter">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="min-h-[200px]">
                            {items.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={canPerformActions ? 4 : 3} className="px-4 py-8 text-center text-gray-500">
                                        No equipment found matching the criteria.
                                    </td>
                                </tr>
                            )}
                            {items.map((item, index) => {
                                const itemStatus = item.status as EquipmentStatus;
                                return (
                                    <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{item.type}</span>
                                                {item.category && <span className="text-[10px] text-blue-500 font-black uppercase">{item.category}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-gray-700 font-medium">{item.model || item.description}</span>
                                                {(item.weight || item.frequency) && (
                                                    <div className="flex gap-2 mt-0.5">
                                                        {item.weight && <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-500">WT: {item.weight}</span>}
                                                        {item.frequency && <span className="text-[10px] bg-amber-50 px-1.5 rounded text-amber-600 border border-amber-100">FREQ: {item.frequency}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        {canPerformActions && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    {itemStatus !== EquipmentStatus.APPROVED && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => updateItemStatus(item, EquipmentStatus.APPROVED)}
                                                            disabled={isUpdating}
                                                            title="Approve Item"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {itemStatus === EquipmentStatus.APPROVED && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                            onClick={() => updateItemStatus(item, EquipmentStatus.PENDING)}
                                                            disabled={isUpdating}
                                                            title="Revoke Approval (Set to Pending)"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {itemStatus !== EquipmentStatus.REJECTED && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => {
                                                                const reason = window.prompt('Enter rejection reason:');
                                                                if (reason) updateItemStatus(item, EquipmentStatus.REJECTED, reason);
                                                            }}
                                                            disabled={isUpdating}
                                                            title="Reject Item"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-gray-500">
                            Showing page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || isLoading}
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Verification Checklist and Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* Verification Checklist */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            {isINSA ? 'INSA Security Checklist' : 'Customs Verification Checklist'}
                        </h4>
                        <div className="space-y-3">
                            {isINSA ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Checkbox id="sec-bg" checked={securityCheck} onCheckedChange={(c) => setSecurityCheck(c as boolean)} />
                                        <label htmlFor="sec-bg" className="text-sm font-medium text-gray-600 cursor-pointer">Security Background Check Cleared</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox id="area-acc" checked={restrictedAreaAccess} onCheckedChange={(c) => setRestrictedAreaAccess(c as boolean)} />
                                        <label htmlFor="area-acc" className="text-sm font-medium text-gray-600 cursor-pointer">Restricted Area Access Authorized</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox id="drone-freq" defaultChecked />
                                        <label htmlFor="drone-freq" className="text-sm font-medium text-gray-600 cursor-pointer">Communication Frequencies Verified</label>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Checkbox id="eq-ver" checked={equipmentVerified} onCheckedChange={(c) => setEquipmentVerified(c as boolean)} />
                                        <label htmlFor="eq-ver" className="text-sm font-medium text-gray-600 cursor-pointer">Equipment Serial Numbers Verified</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox id="temp-imp" defaultChecked />
                                        <label htmlFor="temp-imp" className="text-sm font-medium text-gray-600 cursor-pointer">Temporary Import Permit Issued</label>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Batch Action Buttons */}
                    <div className="flex flex-col justify-end gap-3">
                        {canPerformActions && (
                            <>
                                <Button
                                    onClick={onApprove}
                                    className="bg-primary hover:bg-primary/90 text-white font-bold h-11 shadow-lg shadow-blue-100"
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    {isINSA ? 'Settle & Grant Clearance' : 'Approve Application'}
                                </Button>
                                <Button
                                    onClick={onReject}
                                    variant="outline"
                                    className="bg-white hover:bg-rose-50 text-rose-600 border-rose-100 font-bold h-11"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject Application
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
