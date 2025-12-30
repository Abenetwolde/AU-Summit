import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Info, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Permission {
    id: string;
    label: string;
    description: string;
    inherited: boolean;
    value: boolean; // Computed value
    explicit?: boolean; // If explicitly set
}

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    'Admin': ['org.view', 'app.review', 'app.approve', 'users.manage'],
    'Approver': ['org.view', 'app.review', 'app.approve'],
    'Editor': ['org.view', 'app.review'],
    'Viewer': ['org.view'],
};

const ALL_PERMISSIONS = [
    { id: 'org.view', label: 'View Organization', description: 'Read-only access to organization details' },
    { id: 'org.edit', label: 'Edit Organization', description: 'Modify organization profile and logo' },
    { id: 'users.manage', label: 'Manage Users', description: 'Add or remove users from this organization' },
    { id: 'app.review', label: 'Review Applications', description: 'First-level review of incoming applications' },
    { id: 'app.approve', label: 'Approve Applications', description: 'Final approval authority' },
    { id: 'badge.print', label: 'Print Badges', description: 'Download and print verified badges' },
];

interface OrganizationUserPermissionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: { name: string; role: string; email: string } | null;
    orgName: string;
}

export function OrganizationUserPermissionsModal({ open, onOpenChange, user, orgName }: OrganizationUserPermissionsModalProps) {
    const [permissions, setPermissions] = useState<Permission[]>([]);

    useEffect(() => {
        if (user && open) {
            // Simulate loading inherited permissions based on role
            const rolePerms = DEFAULT_ROLE_PERMISSIONS[user.role] || [];

            const initialPerms = ALL_PERMISSIONS.map(p => {
                const isInherited = rolePerms.includes(p.id);
                return {
                    ...p,
                    inherited: isInherited,
                    value: isInherited, // Default to inherited value
                    explicit: false
                };
            });
            setPermissions(initialPerms);
        }
    }, [user, open]);

    const handleToggle = (id: string) => {
        setPermissions(prev => prev.map(p => {
            if (p.id === id) {
                const newValue = !p.value;
                return {
                    ...p,
                    value: newValue,
                    explicit: newValue !== p.inherited // It's explicit if it differs from inherited or just if changed? 
                    // Let's say explicit means manually toggled to override. 
                    // If I toggle it back to match inherited, is it still explicit?
                    // Simple logic: If I change it, it's an override.
                };
            }
            return p;
        }));
    };

    const handleReset = () => {
        if (!user) return;
        const rolePerms = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
        setPermissions(prev => prev.map(p => ({
            ...p,
            value: rolePerms.includes(p.id),
            explicit: false
        })));
        toast.info("Permissions reset to role defaults");
    };

    const handleSave = () => {
        toast.success(`Permissions updated for ${user?.name}`);
        onOpenChange(false);
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <Shield className="h-5 w-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Permission Management</span>
                    </div>
                    <DialogTitle>Manage Permissions for {user.name}</DialogTitle>
                    <DialogDescription>
                        Configure access rights for <span className="font-medium text-foreground">{user.email}</span> in <span className="font-medium text-foreground">{orgName}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between border">
                    <div>
                        <div className="text-sm font-medium text-gray-900">Assigned Role</div>
                        <div className="text-xs text-muted-foreground">Base permissions are inherited from this role.</div>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 text-sm bg-white">
                        {user.role}
                    </Badge>
                </div>

                <div className="space-y-4 py-2 max-h-[400px] overflow-y-auto pr-2">
                    {permissions.map((p) => (
                        <div key={p.id} className="flex items-start justify-between p-3 rounded-lg border hover:bg-gray-50/50 transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{p.label}</span>
                                    {p.inherited && !p.explicit && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground bg-gray-100">
                                                        Inherited
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>Permission granted by {user.role} role</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    {p.explicit && (
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-amber-200 bg-amber-50 text-amber-700">
                                            Override
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">{p.description}</p>
                            </div>
                            <Switch
                                checked={p.value}
                                onCheckedChange={() => handleToggle(p.id)}
                            />
                        </div>
                    ))}
                </div>

                <DialogFooter className="flex sm:justify-between items-center w-full">
                    <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
                        <RotateCcw className="h-4 w-4 mr-2" /> Reset Defaults
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
