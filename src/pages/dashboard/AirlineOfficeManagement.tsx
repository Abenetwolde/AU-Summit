import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, Plane, Loader2, Edit, Trash, Globe, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
    useGetAirlineOfficesQuery,
    useGetCountriesQuery,
    useCreateAirlineOfficeMutation,
    useUpdateAirlineOfficeMutation,
    useDeleteAirlineOfficeMutation,
    AirlineOffice
} from '@/store/services/api';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AirlineOfficeManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOffice, setSelectedOffice] = useState<AirlineOffice | null>(null);

    // API Hooks
    const { data: offices = [], isLoading: isOfficesLoading } = useGetAirlineOfficesQuery();
    const { data: countries = [] } = useGetCountriesQuery();
    const [createOffice, { isLoading: isCreating }] = useCreateAirlineOfficeMutation();
    const [updateOffice, { isLoading: isUpdating }] = useUpdateAirlineOfficeMutation();
    const [deleteOffice] = useDeleteAirlineOfficeMutation();

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        contactPhone: '',
        contactEmail: '',
        countryIds: [] as number[]
    });

    // Derived Data
    const filteredOffices = offices.filter(off =>
        off.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handlers
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createOffice(formData).unwrap();
            toast.success("Airline office created successfully");
            setIsCreateModalOpen(false);
            resetForm();
        } catch (err: any) {
            toast.error(err.data?.message || "Failed to create airline office");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOffice) return;

        try {
            await updateOffice({ id: selectedOffice.id, data: formData }).unwrap();
            toast.success("Airline office updated successfully");
            setIsEditModalOpen(false);
            resetForm();
        } catch (err: any) {
            toast.error(err.data?.message || "Failed to update airline office");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this airline office?")) return;
        try {
            await deleteOffice(id).unwrap();
            toast.success("Airline office deleted successfully");
        } catch (err: any) {
            toast.error(err.data?.message || "Failed to delete airline office");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            city: '',
            contactPhone: '',
            contactEmail: '',
            countryIds: [] as number[]
        });
        setSelectedOffice(null);
    };

    const openEditModal = (office: AirlineOffice) => {
        setSelectedOffice(office);
        setFormData({
            name: office.name,
            address: office.address || '',
            city: office.city || '',
            contactPhone: office.contactPhone || '',
            contactEmail: office.contactEmail || '',
            countryIds: office.overseeingCountries?.map(c => c.id) || []
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
                    <h1 className="text-2xl font-bold tracking-tight">Airline Office Management</h1>
                    <p className="text-muted-foreground">Manage Ethiopian Airlines offices and their overseeing countries.</p>
                </div>
                <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Office
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search airline offices..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isOfficesLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOffices.map((office) => (
                        <Card key={office.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Plane className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold leading-none">{office.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {office.city || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditModal(office)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(office.id)}>
                                                <Trash className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Globe className="h-3 w-3" /> Overseeing Countries
                                        </span>
                                        <Badge variant="secondary">{office.overseeingCountries?.length || 0}</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {office.overseeingCountries?.slice(0, 5).map(country => (
                                            <Badge key={country.id} variant="outline" className="text-[10px]">
                                                {country.name}
                                            </Badge>
                                        ))}
                                        {office.overseeingCountries?.length > 5 && (
                                            <Badge variant="outline" className="text-[10px]">
                                                +{office.overseeingCountries.length - 5} more
                                            </Badge>
                                        )}
                                        {(!office.overseeingCountries || office.overseeingCountries.length === 0) && (
                                            <span className="text-xs text-muted-foreground italic text-center w-full py-1">No countries assigned</span>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                                    {office.address && <div className="truncate" title={office.address}>Addr: {office.address}</div>}
                                    {office.contactPhone && <div>Tel: {office.contactPhone}</div>}
                                    {office.contactEmail && <div className="font-medium text-emerald-600 dark:text-emerald-400">Email: {office.contactEmail}</div>}
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
                        <DialogTitle>{isEditModalOpen ? 'Edit Airline Office' : 'Add New Airline Office'}</DialogTitle>
                        <DialogDescription>
                            Enter airline office details and select oversee countries.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={isEditModalOpen ? handleUpdate : handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="name">Office Name</Label>
                                <Input
                                    id="name"
                                    required
                                    placeholder="e.g. Dubai Regional Office"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    placeholder="Full office address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    placeholder="City"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Contact Phone</Label>
                                <Input
                                    id="phone"
                                    placeholder="+971 ..."
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="email">Contact Email (Mandatory for notifications)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="office@ethiopianairlines.com"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                />
                                <p className="text-[10px] text-muted-foreground">Notifications will be sent to this email upon application approval for overseen countries.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Overseeing Countries</Label>
                            <ScrollArea className="h-48 border rounded-md p-4 bg-muted/20">
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
