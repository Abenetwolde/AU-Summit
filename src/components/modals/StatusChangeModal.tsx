import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface StatusChangeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    journalistName: string;
    currentStatus: string;
    onConfirm: (newStatus: string, reason: string) => void;
}

export function StatusChangeModal({
    open,
    onOpenChange,
    journalistName,
    currentStatus,
    onConfirm,
}: StatusChangeModalProps) {
    const [newStatus, setNewStatus] = useState('');
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (newStatus && reason) {
            onConfirm(newStatus, reason);
            setNewStatus('');
            setReason('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Change Application Status</DialogTitle>
                    <DialogDescription>
                        Change the accreditation status for <span className="font-semibold text-gray-900">{journalistName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-status">Current Status</Label>
                        <div className="px-3 py-2 bg-gray-100 rounded-md text-sm font-medium text-gray-700">
                            {currentStatus}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new-status">New Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger id="new-status">
                                <SelectValue placeholder="Select new status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                                <SelectItem value="Under Review">Under Review</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Change</Label>
                        <Textarea
                            id="reason"
                            placeholder="Please provide a reason for this status change..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!newStatus || !reason}
                        className="bg-[#009b4d] hover:bg-[#007a3d]"
                    >
                        Confirm Change
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
