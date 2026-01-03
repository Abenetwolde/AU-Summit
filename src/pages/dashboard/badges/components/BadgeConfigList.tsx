import { BadgeConfig, useGetBadgeConfigsQuery, useUpdateBadgeConfigMutation, useDeleteBadgeConfigMutation } from '@/store/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MoreVertical, Edit2, Trash2, Eye, BadgeCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function BadgeConfigList({ onEdit }: { onEdit: (config: BadgeConfig) => void }) {
    const { data: configs, isLoading } = useGetBadgeConfigsQuery();
    const [updateConfig] = useUpdateBadgeConfigMutation();
    const [deleteConfig] = useDeleteBadgeConfigMutation();

    const handleToggleActive = async (config: BadgeConfig) => {
        try {
            await updateConfig({ id: config.id, data: { isActive: !config.isActive } }).unwrap();
            toast.success(`Configuration ${!config.isActive ? 'activated' : 'deactivated'}`);
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this configuration?')) return;
        try {
            await deleteConfig(id).unwrap();
            toast.success('Configuration deleted');
        } catch (err) {
            toast.error('Failed to delete configuration');
        }
    };

    if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading configurations...</div>;
    if (!configs?.length) return (
        <div className="py-12 text-center">
            <p className="text-muted-foreground">No configurations found. Create your first one in the Designer tab.</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map((config) => (
                <Card key={config.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                    <div className="h-2 bg-primary" style={{ backgroundColor: config.primaryColor }} />
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{config.name}</h3>
                                <p className="text-xs text-slate-500">Template: {config.template?.name || 'Default'}</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => onEdit(config)}>
                                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(config.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={config.isActive}
                                    onCheckedChange={() => handleToggleActive(config)}
                                />
                                <span className="text-xs font-medium text-slate-600">
                                    {config.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            {config.isActive && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-tighter">
                                    <BadgeCheck className="h-3 w-3" /> Default for printing
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
