import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X, ShieldCheck, Forward } from 'lucide-react';
import { useAuth, UserRole } from '@/auth/context';

interface Equipment {
    type: string;
    model: string;
    status?: 'Pending' | 'Approved' | 'Forwarded' | 'Rejected';
    // Drone specific fields
    weight?: string;
    frequency?: string;
    category?: string;
}

interface EquipmentVerificationProps {
    equipment: Equipment[];
    onApprove?: () => void;
    onReject?: () => void;
    showActions?: boolean;
}

export function EquipmentVerification({
    equipment: initialEquipment,
    onApprove,
    onReject,
    showActions = true
}: EquipmentVerificationProps) {
    const { user } = useAuth();
    const [securityCheck, setSecurityCheck] = useState(false);
    const [restrictedAreaAccess, setRestrictedAreaAccess] = useState(false);
    const [equipmentVerified, setEquipmentVerified] = useState(true);

    // Manage local status for mock demonstration
    const [items, setItems] = useState<Equipment[]>(
        initialEquipment.map(item => ({ ...item, status: item.status || 'Pending' }))
    );

    // Determine if current user can perform actions
    const isCustoms = user?.role === UserRole.CUSTOMS_OFFICER;
    const isINSA = user?.role === UserRole.INSA_OFFICER;
    const canPerformActions = showActions && (isCustoms || isINSA);

    const updateItemStatus = (index: number, newStatus: NonNullable<Equipment['status']>) => {
        const newItems = [...items];
        newItems[index].status = newStatus;
        setItems(newItems);
    };

    const getStatusBadge = (status: Equipment['status']) => {
        switch (status) {
            case 'Approved':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700"><Check className="h-3 w-3 mr-1" /> Approved</span>;
            case 'Forwarded':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><Forward className="h-3 w-3 mr-1" /> Forwarded to INSA</span>;
            case 'Rejected':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><X className="h-3 w-3 mr-1" /> Rejected</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">Pending</span>;
        }
    };

    return (
        <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold">Equipment List</CardTitle>
                <div className="flex items-center gap-2">
                    {isINSA && <span className="text-xs text-blue-600 font-semibold flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Security Review (INSA)</span>}
                    {isCustoms && <span className="text-xs text-green-600 font-semibold">Customs Control</span>}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Equipment Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{item.type}</span>
                                            {item.category && <span className="text-[10px] text-blue-500 font-black uppercase">{item.category}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-gray-700 font-medium">{item.model}</span>
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
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => updateItemStatus(index, 'Approved')}
                                                    title="Approve Item"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                {isCustoms && !isINSA && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => updateItemStatus(index, 'Forwarded')}
                                                        title="Forward to INSA"
                                                    >
                                                        <Forward className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => updateItemStatus(index, 'Rejected')}
                                                    title="Reject Item"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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
                                    {isINSA ? 'Settle & Grant Clearance' : 'Approve All Equipment'}
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
