import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, Building2, Loader2, Edit, Trash, Globe } from 'lucide-react';
import { toast } from 'sonner';
import {
    useGetEmbassiesQuery,
    useGetCountriesQuery,
    useCreateEmbassyMutation,
    useUpdateEmbassyMutation,
    useDeleteEmbassyMutation,
    Embassy
} from '@/store/services/api';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth, UserRole } from '@/auth/context';

export default function EmbassyManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEmbassy, setSelectedEmbassy] = useState<Embassy | null>(null);

    const { checkPermission, user } = useAuth();
    const isManagementRole = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PMO;
    const canCreateEmbassy = isManagementRole || checkPermission('embassy:create');
    const canUpdateEmbassy = isManagementRole || checkPermission('embassy:update');
    const canDeleteEmbassy = isManagementRole || checkPermission('embassy:delete');

    // API Hooks
    const { data: embassies = [], isLoading: isEmbassyLoading } = useGetEmbassiesQuery();
    const { data: countries = [] } = useGetCountriesQuery();
    const [createEmbassy, { isLoading: isCreating }] = useCreateEmbassyMutation();
    const [updateEmbassy, { isLoading: isUpdating }] = useUpdateEmbassyMutation();
    const [deleteEmbassy] = useDeleteEmbassyMutation();

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contactPhone: '',
        contactEmail: '',
        countryIds: [] as number[]
    });

    // Derived Data
    const filteredEmbassies = embassies.filter(emb =>
        emb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emb.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handlers
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canCreateEmbassy) {
            toast.error("You don't have permission to create embassies");
            return;
        }
        try {
            await createEmbassy(formData).unwrap();
            toast.success("Embassy created successfully");
            setIsCreateModalOpen(false);
            resetForm();
        } catch (err: any) {
            toast.error(err.data?.message || "Failed to create embassy");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmbassy) return;

        if (!canUpdateEmbassy) {
            toast.error("You don't have permission to update embassies");
            return;
        }

        try {
            await updateEmbassy({ id: selectedEmbassy.id, data: formData }).unwrap();
            toast.success("Embassy updated successfully");
            setIsEditModalOpen(false);
            resetForm();
        } catch (err: any) {
            toast.error(err.data?.message || "Failed to update embassy");
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDeleteEmbassy) {
            toast.error("You don't have permission to delete embassies");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this embassy?")) return;
        try {
            await deleteEmbassy(id).unwrap();
            toast.success("Embassy deleted successfully");
        } catch (err: any) {
            toast.error(err.data?.message || "Failed to delete embassy");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            contactPhone: '',
            contactEmail: '',
            countryIds: [] as number[]
        });
        setSelectedEmbassy(null);
    };

    const openEditModal = (embassy: Embassy) => {
        if (!canUpdateEmbassy) {
            toast.error("You don't have permission to edit embassies");
            return;
        }
        setSelectedEmbassy(embassy);
        setFormData({
            name: embassy.name,
            address: embassy.address || '',
            contactPhone: embassy.contactPhone || '',
            contactEmail: embassy.contactEmail || '',
            countryIds: embassy.overseeingCountries.map(c => c.id)
        });
        setIsEditModalOpen(true);
    };

    const toggleCountry = (countryId: number) => {
        setFormData(prev => ({
            ...prev,
            countryIds: prev.countryIds.includes(countryId)
                ? prev.countryIds.filter(id => id !== countryId)
                : [...prev.countryIds, countryId]
        }));
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Embassy Management</h1>
                    <p className="text-muted-foreground">Manage embassies and their overseeing countries.</p>
                </div>
                {canCreateEmbassy && (
                    <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Embassy
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search embassies..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isEmbassyLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmbassies.map((embassy) => (
                        <Card key={embassy.id} className="overflow-hidden">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold leading-none">{embassy.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{embassy.address}</p>
                                        </div>
                                    </div>
                                    {(canUpdateEmbassy || canDeleteEmbassy) && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {canUpdateEmbassy && (
                                                    <DropdownMenuItem onClick={() => openEditModal(embassy)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                )}
                                                {canDeleteEmbassy && (
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(embassy.id)}>
                                                        <Trash className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Globe className="h-3 w-3" /> Overseeing Countries
                                        </span>
                                        <Badge variant="secondary">{embassy.overseeingCountries?.length || 0}</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {embassy.overseeingCountries?.slice(0, 5).map(country => (
                                            <Badge key={country.id} variant="outline" className="text-[10px]">
                                                {country.name}
                                            </Badge>
                                        ))}
                                        {embassy.overseeingCountries?.length > 5 && (
                                            <Badge variant="outline" className="text-[10px]">
                                                +{embassy.overseeingCountries.length - 5} more
                                            </Badge>
                                        )}
                                        {(!embassy.overseeingCountries || embassy.overseeingCountries.length === 0) && (
                                            <span className="text-xs text-muted-foreground italic text-center w-full py-1">No countries assigned</span>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                                    {embassy.contactPhone && <div>Tel: {embassy.contactPhone}</div>}
                                    {embassy.contactEmail && <div>Email: {embassy.contactEmail}</div>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                }
            }}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditModalOpen ? 'Edit Embassy' : 'Add New Embassy'}</DialogTitle>
                        <DialogDescription>
                            Enter embassy details and select oversee countries.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={isEditModalOpen ? handleUpdate : handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="name">Embassy Name</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Contact Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Contact Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Overseeing Countries</Label>
                            <ScrollArea className="h-48 border rounded-md p-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {countries.map((country) => (
                                        <div key={country.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`country-${country.id}`}
                                                checked={formData.countryIds.includes(country.id)}
                                                onCheckedChange={() => toggleCountry(country.id)}
                                            />
                                            <Label
                                                htmlFor={`country-${country.id}`}
                                                className="text-sm font-normal cursor-pointer truncate"
                                            >
                                                {country.name} ({country.code})
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <div className="text-xs text-muted-foreground">
                                Selected: {formData.countryIds.length} countries
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreating || isUpdating}>
                                {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditModalOpen ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
