import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useAuth, UserRole } from '@/auth/context';
import { airlineOfficeSchema } from '@/lib/validation-schemas';

type AirlineOfficeFormData = z.infer<typeof airlineOfficeSchema>;

export default function AirlineOfficeManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOffice, setSelectedOffice] = useState<AirlineOffice | null>(null);

    const { checkPermission, user } = useAuth();
    const isManagementRole = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.PMO;
    const canCreateAirline = isManagementRole || checkPermission('airline:create');
    const canUpdateAirline = isManagementRole || checkPermission('airline:update');
    const canDeleteAirline = isManagementRole || checkPermission('airline:delete');

    // API Hooks
    const { data: offices = [], isLoading: isOfficesLoading } = useGetAirlineOfficesQuery();
    const { data: countries = [] } = useGetCountriesQuery();
    const [createOffice, { isLoading: isCreating }] = useCreateAirlineOfficeMutation();
    const [updateOffice, { isLoading: isUpdating }] = useUpdateAirlineOfficeMutation();
    const [deleteOffice] = useDeleteAirlineOfficeMutation();

    // Create Form
    const {
        register: registerCreate,
        handleSubmit: handleSubmitCreate,
        width: resetCreate,
        setValue: setValueCreate,
        watch: watchCreate,
        formState: { errors: errorsCreate }
    } = useForm<AirlineOfficeFormData>({
        resolver: zodResolver(airlineOfficeSchema),
        defaultValues: {
            name: '',
            address: '',
            city: '',
            contactPhone: '',
            contactEmail: '',
            countryIds: []
        }
    });

    const createCountryIds = watchCreate('countryIds');

    // Edit Form
    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        setValue: setValueEdit,
        watch: watchEdit,
        formState: { errors: errorsEdit }
    } = useForm<AirlineOfficeFormData>({
        resolver: zodResolver(airlineOfficeSchema),
        defaultValues: {
            name: '',
            address: '',
            city: '',
            contactPhone: '',
            contactEmail: '',
            countryIds: []
        }
    });

    const editCountryIds = watchEdit('countryIds');

    // Derived Data
    const filteredOffices = offices.filter(off =>
        off.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handlers
    const onCreateSubmit = async (data: AirlineOfficeFormData) => {
        if (!canCreateAirline) {
            toast.error("You don't have permission to create airline offices");
            return;
        }
        try {
            await createOffice(data).unwrap();
            toast.success("Airline office created successfully");
            setIsCreateModalOpen(false);
            resetCreate({
                name: '',
                address: '',
                city: '',
                contactPhone: '',
                contactEmail: '',
                countryIds: []
            });
        } catch (err: any) {
            toast.error(err.data?.message || "Failed to create airline office");
        }
    };

    const onUpdateSubmit = async (data: AirlineOfficeFormData) => {
        if (!selectedOffice) return;

        if (!canUpdateAirline) {
            toast.error("You don't have permission to update airline offices");
            return;
        }

        try {
            await updateOffice({ id: selectedOffice.id, data }).unwrap();
            toast.success("Airline office updated successfully");
            setIsEditModalOpen(false);
            setSelectedOffice(null);
            resetEdit();
        } catch (err: any) {
            toast.error(err.data?.message || "Failed to update airline office");
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDeleteAirline) {
            toast.error("You don't have permission to delete airline offices");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this airline office?")) return;
        try {
            await deleteOffice(id).unwrap();
            toast.success("Airline office deleted successfully");
        } catch (err: any) {
            toast.error(err.data?.message || "Failed to delete airline office");
        }
    };

    const openEditModal = (office: AirlineOffice) => {
        if (!canUpdateAirline) {
            toast.error("You don't have permission to edit airline offices");
            return;
        }
        setSelectedOffice(office);
        // Pre-fill edit form
        setValueEdit('name', office.name);
        setValueEdit('address', office.address || '');
        setValueEdit('city', office.city || '');
        setValueEdit('contactPhone', office.contactPhone || '');
        setValueEdit('contactEmail', office.contactEmail || '');
        setValueEdit('countryIds', office.overseeingCountries?.map(c => c.id) || []);

        setIsEditModalOpen(true);
    };

    const toggleCreateCountry = (countryId: number) => {
        const currentIds = createCountryIds || [];
        const newIds = currentIds.includes(countryId)
            ? currentIds.filter(id => id !== countryId)
            : [...currentIds, countryId];
        setValueCreate('countryIds', newIds, { shouldValidate: true });
    };

    const toggleEditCountry = (countryId: number) => {
        const currentIds = editCountryIds || [];
        const newIds = currentIds.includes(countryId)
            ? currentIds.filter(id => id !== countryId)
            : [...currentIds, countryId];
        setValueEdit('countryIds', newIds, { shouldValidate: true });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Airline Office Management</h1>
                    <p className="text-muted-foreground">Manage Ethiopian Airlines offices and their overseeing countries.</p>
                </div>
                {canCreateAirline && (
                    <Button onClick={() => {
                        resetCreate({
                            name: '',
                            address: '',
                            city: '',
                            contactPhone: '',
                            contactEmail: '',
                            countryIds: []
                        });
                        setIsCreateModalOpen(true);
                    }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Office
                    </Button>
                )}
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
                                    {(canUpdateAirline || canDeleteAirline) && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {canUpdateAirline && (
                                                    <DropdownMenuItem onClick={() => openEditModal(office)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                )}
                                                {canDeleteAirline && (
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(office.id)}>
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

            {/* Create Dialog */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add New Airline Office</DialogTitle>
                        <DialogDescription>
                            Enter airline office details and select oversee countries.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="create-name">Office Name</Label>
                                <Input
                                    id="create-name"
                                    placeholder="e.g. Dubai Regional Office"
                                    {...registerCreate('name')}
                                    error={errorsCreate.name?.message}
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="create-address">Address</Label>
                                <Input
                                    id="create-address"
                                    placeholder="Full office address"
                                    {...registerCreate('address')}
                                    error={errorsCreate.address?.message}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-city">City</Label>
                                <Input
                                    id="create-city"
                                    placeholder="City"
                                    {...registerCreate('city')}
                                    error={errorsCreate.city?.message}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-phone">Contact Phone</Label>
                                <Input
                                    id="create-phone"
                                    placeholder="+971 ..."
                                    {...registerCreate('contactPhone')}
                                    error={errorsCreate.contactPhone?.message}
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="create-email">Contact Email (Mandatory for notifications)</Label>
                                <Input
                                    id="create-email"
                                    type="email"
                                    placeholder="office@ethiopianairlines.com"
                                    {...registerCreate('contactEmail')}
                                    error={errorsCreate.contactEmail?.message}
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
                                                id={`create-country-${country.id}`}
                                                checked={createCountryIds?.includes(country.id)}
                                                onCheckedChange={() => toggleCreateCountry(country.id)}
                                            />
                                            <Label
                                                htmlFor={`create-country-${country.id}`}
                                                className="text-sm font-normal cursor-pointer truncate"
                                            >
                                                {country.name} ({country.code})
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            {errorsCreate.countryIds && (
                                <p className="text-xs text-red-500">{errorsCreate.countryIds.message}</p>
                            )}
                            <div className="text-xs text-muted-foreground">
                                Selected: {createCountryIds?.length || 0} countries
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Airline Office</DialogTitle>
                        <DialogDescription>
                            Enter airline office details and select oversee countries.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitEdit(onUpdateSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="edit-name">Office Name</Label>
                                <Input
                                    id="edit-name"
                                    {...registerEdit('name')}
                                    error={errorsEdit.name?.message}
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="edit-address">Address</Label>
                                <Input
                                    id="edit-address"
                                    placeholder="Full office address"
                                    {...registerEdit('address')}
                                    error={errorsEdit.address?.message}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-city">City</Label>
                                <Input
                                    id="edit-city"
                                    placeholder="City"
                                    {...registerEdit('city')}
                                    error={errorsEdit.city?.message}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone">Contact Phone</Label>
                                <Input
                                    id="edit-phone"
                                    placeholder="+971 ..."
                                    {...registerEdit('contactPhone')}
                                    error={errorsEdit.contactPhone?.message}
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="edit-email">Contact Email (Mandatory for notifications)</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    placeholder="office@ethiopianairlines.com"
                                    {...registerEdit('contactEmail')}
                                    error={errorsEdit.contactEmail?.message}
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
                                                id={`edit-country-${country.id}`}
                                                checked={editCountryIds?.includes(country.id)}
                                                onCheckedChange={() => toggleEditCountry(country.id)}
                                            />
                                            <Label
                                                htmlFor={`edit-country-${country.id}`}
                                                className="text-sm font-normal cursor-pointer truncate"
                                            >
                                                {country.name} ({country.code})
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            {errorsEdit.countryIds && (
                                <p className="text-xs text-red-500">{errorsEdit.countryIds.message}</p>
                            )}
                            <div className="text-xs text-muted-foreground">
                                Selected: {editCountryIds?.length || 0} countries
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
