import React, { useState } from 'react';
import {
    Plus,
    Trash2,
    Edit,
    Globe,
    Database,
    Terminal,
    Layers,
    Save,
    Loader2,
    Search,
    Shield
} from 'lucide-react';
import {
    useGetApiProvidersQuery,
    useCreateApiProviderMutation,
    useUpdateApiProviderMutation,
    useDeleteApiProviderMutation,
    useGetIntegrationsQuery,
    useCreateIntegrationMutation,
    useUpdateIntegrationMutation,
    useDeleteIntegrationMutation,
    ApiProvider,
    IntegrationConfig,
    IntegrationTrigger,
    HttpMethod
} from '@/store/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ApiManagement() {
    const [activeTab, setActiveTab] = useState('providers');
    const [searchTerm, setSearchTerm] = useState('');

    // API Queries
    const { data: providers = [], isLoading: providersLoading } = useGetApiProvidersQuery();
    const { data: integrations = [], isLoading: integrationsLoading } = useGetIntegrationsQuery();

    // API Mutations
    const [createProvider] = useCreateApiProviderMutation();
    const [updateProvider] = useUpdateApiProviderMutation();
    const [deleteProvider] = useDeleteApiProviderMutation();

    const [createIntegration] = useCreateIntegrationMutation();
    const [updateIntegration] = useUpdateIntegrationMutation();
    const [deleteIntegration] = useDeleteIntegrationMutation();

    // State for Modals
    const [providerModalOpen, setProviderModalOpen] = useState(false);
    const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Partial<ApiProvider> | null>(null);
    const [editingIntegration, setEditingIntegration] = useState<Partial<IntegrationConfig> | null>(null);

    const handleCreateProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            name: formData.get('name') as string,
            baseUrl: formData.get('baseUrl') as string,
            headers: formData.get('headers') ? JSON.parse(formData.get('headers') as string) : {},
            isActive: true
        };

        try {
            if (editingProvider?.id) {
                await updateProvider({ id: editingProvider.id, data }).unwrap();
                toast.success('Provider updated successfully');
            } else {
                await createProvider(data).unwrap();
                toast.success('Provider created successfully');
            }
            setProviderModalOpen(false);
            setEditingProvider(null);
        } catch (err: any) {
            toast.error(err?.data?.message || 'Action failed');
        }
    };

    const handleCreateIntegration = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        try {
            const data = {
                providerId: parseInt(formData.get('providerId') as string),
                triggerEvent: formData.get('triggerEvent') as IntegrationTrigger,
                endpoint: formData.get('endpoint') as string,
                method: formData.get('method') as HttpMethod,
                requestMapping: formData.get('requestMapping') ? JSON.parse(formData.get('requestMapping') as string) : null,
                responseMapping: formData.get('responseMapping') ? JSON.parse(formData.get('responseMapping') as string) : null,
                isActive: true,
                order: parseInt(formData.get('order') as string || '0')
            };

            if (editingIntegration?.id) {
                await updateIntegration({ id: editingIntegration.id, data }).unwrap();
                toast.success('Integration updated successfully');
            } else {
                await createIntegration(data).unwrap();
                toast.success('Integration created successfully');
            }
            setIntegrationModalOpen(false);
            setEditingIntegration(null);
        } catch (err: any) {
            toast.error(err?.data?.message || 'Action failed - check JSON format');
        }
    };

    const filteredProviders = providers.filter((p: ApiProvider) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredIntegrations = integrations.filter((i: IntegrationConfig) => i.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) || i.provider?.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        API Management Center
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Configure external providers and dynamic integration workflows.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search..."
                            className="pl-10 w-[240px] rounded-full border-slate-200 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                        onClick={() => {
                            if (activeTab === 'providers') {
                                setEditingProvider(null);
                                setProviderModalOpen(true);
                            } else {
                                setEditingIntegration(null);
                                setIntegrationModalOpen(true);
                            }
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New {activeTab === 'providers' ? 'Provider' : 'Integration'}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-full w-fit mb-6">
                    <TabsTrigger value="providers" className="rounded-full px-8 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Globe className="h-4 w-4 mr-2" />
                        API Providers
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="rounded-full px-8 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Layers className="h-4 w-4 mr-2" />
                        Integrations
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="providers" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {providersLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i} className="animate-pulse h-48 bg-slate-50 border-slate-100" />
                            ))
                        ) : filteredProviders.length > 0 ? (
                            filteredProviders.map((provider: ApiProvider) => (
                                <Card key={provider.id} className="group overflow-hidden border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="p-2 bg-blue-50 rounded-xl">
                                                <Database className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <Badge variant={provider.isActive ? "default" : "secondary"}>
                                                {provider.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                        <CardTitle className="mt-4 text-xl">{provider.name}</CardTitle>
                                        <CardDescription className="font-mono text-xs truncate mt-1">
                                            {provider.baseUrl}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                                Created: {new Date(provider.createdAt).toLocaleDateString()}
                                            </span>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    onClick={() => {
                                                        setEditingProvider(provider);
                                                        setProviderModalOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    onClick={async () => {
                                                        if (confirm('Are you sure? This will delete all associated integrations.')) {
                                                            await deleteProvider(provider.id);
                                                            toast.success('Provider deleted');
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                                <Shield className="h-12 w-12 mb-4 opacity-20" />
                                <p>No providers found. Add your first external API.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="integrations" className="space-y-6">
                    <Card className="border-slate-100 shadow-lg overflow-hidden rounded-3xl">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-lg">Event Integration Logic</CardTitle>
                            <CardDescription>Configure what happens when specific system events occur.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {integrationsLoading ? (
                                <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                            ) : filteredIntegrations.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-left border-b border-slate-100">
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Order</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Trigger Event</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Provider</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Method/Endpoint</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredIntegrations.map((integration: IntegrationConfig) => (
                                                <tr key={integration.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-slate-400">#{integration.order}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 rounded-full text-[10px] font-bold">
                                                            {integration.triggerEvent}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                                                {integration.provider?.name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-semibold text-slate-700">{integration.provider?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                                    integration.method === 'POST' ? "bg-emerald-100 text-emerald-700" :
                                                                        integration.method === 'GET' ? "bg-blue-100 text-blue-700" : "bg-slate-100"
                                                                )}>
                                                                    {integration.method}
                                                                </span>
                                                                <span className="text-sm font-mono text-slate-600">{integration.endpoint}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                                onClick={() => {
                                                                    setEditingIntegration(integration);
                                                                    setIntegrationModalOpen(true);
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                                onClick={async () => {
                                                                    if (confirm('Delete this integration?')) {
                                                                        await deleteIntegration(integration.id);
                                                                        toast.success('Integration deleted');
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-12 flex flex-col items-center text-slate-400">
                                    <Terminal className="h-10 w-10 mb-2 opacity-20" />
                                    <p>No integration rules defined.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Provider Modal */}
            <Dialog open={providerModalOpen} onOpenChange={setProviderModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl">
                    <form onSubmit={handleCreateProvider}>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{editingProvider ? 'Edit' : 'Add'} API Provider</DialogTitle>
                            <DialogDescription>
                                Define an external system to integrate with.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-bold text-slate-700 uppercase tracking-widest">Friendly Name</Label>
                                <Input id="name" name="name" defaultValue={editingProvider?.name} placeholder="e.g. Ethiopia E-Visa Portal" required className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="baseUrl" className="text-sm font-bold text-slate-700 uppercase tracking-widest">Base API URL</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="baseUrl" name="baseUrl" defaultValue={editingProvider?.baseUrl} placeholder="https://api.external.com/v1" required className="pl-10 rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="headers" className="text-sm font-bold text-slate-700 uppercase tracking-widest">Auth Headers (JSON)</Label>
                                <Textarea
                                    id="headers"
                                    name="headers"
                                    defaultValue={editingProvider?.headers ? JSON.stringify(editingProvider.headers, null, 2) : '{\n  "Authorization": "Bearer YOUR_TOKEN"\n}'}
                                    placeholder="{}"
                                    className="h-32 font-mono text-xs bg-slate-50 border-slate-100 rounded-xl"
                                />
                                <p className="text-[10px] text-slate-400 italic font-medium">Headers will be encrypted at rest.</p>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="ghost" className="rounded-full" onClick={() => setProviderModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="rounded-full bg-blue-600 hover:bg-blue-700 px-8">
                                <Save className="h-4 w-4 mr-2" />
                                {editingProvider ? 'Update' : 'Create'} Provider
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Integration Modal */}
            <Dialog open={integrationModalOpen} onOpenChange={setIntegrationModalOpen}>
                <DialogContent className="sm:max-w-[700px] border-none shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleCreateIntegration}>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{editingIntegration ? 'Edit' : 'Add'} Integration Rule</DialogTitle>
                            <DialogDescription>
                                Map a system event to an external API call.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Select Provider</Label>
                                <Select name="providerId" defaultValue={editingIntegration?.providerId?.toString()}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select API Provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {providers.map((p: ApiProvider) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Trigger Event</Label>
                                <Select name="triggerEvent" defaultValue={editingIntegration?.triggerEvent}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="System Event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(IntegrationTrigger).map(trigger => (
                                            <SelectItem key={trigger} value={trigger}>{trigger}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="method" className="text-sm font-bold text-slate-700 uppercase tracking-widest">HTTP Method</Label>
                                <Select name="method" defaultValue={editingIntegration?.method || 'POST'}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(HttpMethod).map(method => (
                                            <SelectItem key={method} value={method}>{method}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endpoint" className="text-sm font-bold text-slate-700 uppercase tracking-widest">Endpoint Path</Label>
                                <Input id="endpoint" name="endpoint" defaultValue={editingIntegration?.endpoint} placeholder="/notify/approve" required className="rounded-xl" />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Request Payload Mapping (JSON)</Label>
                                <Card className="border-slate-100 bg-slate-50 overflow-hidden rounded-2xl">
                                    <div className="bg-slate-200/50 px-4 py-2 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Template Editor</span>
                                        <Badge variant="outline" className="text-[9px] border-slate-300">Supports handle-bars</Badge>
                                    </div>
                                    <Textarea
                                        name="requestMapping"
                                        defaultValue={editingIntegration?.requestMapping ? JSON.stringify(editingIntegration.requestMapping, null, 2) : '{\n  "email": "{{user.email}}",\n  "status": "APPROVED"\n}'}
                                        className="h-40 font-mono text-xs border-none bg-transparent"
                                    />
                                </Card>
                                <p className="text-[10px] text-slate-400 italic font-medium">Use {"{{field}}"} for dynamic data injection.</p>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Response Mapping (Application Fields)</Label>
                                <Card className="border-slate-100 bg-slate-50 overflow-hidden rounded-2xl">
                                    <div className="bg-slate-200/50 px-4 py-2 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Result Handler</span>
                                        <Badge variant="outline" className="text-[9px] border-slate-300">Updates DB</Badge>
                                    </div>
                                    <Textarea
                                        name="responseMapping"
                                        defaultValue={editingIntegration?.responseMapping ? JSON.stringify(editingIntegration.responseMapping, null, 2) : '{\n  "immigrationStatus": "PROCESSED"\n}'}
                                        className="h-24 font-mono text-xs border-none bg-transparent"
                                    />
                                </Card>
                                <p className="text-[10px] text-slate-400 italic font-medium">Map external response keys to Application model fields.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" className="rounded-full" onClick={() => setIntegrationModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="rounded-full bg-blue-600 hover:bg-blue-700 px-8 shadow-lg shadow-blue-200">
                                <Save className="h-4 w-4 mr-2" />
                                {editingIntegration ? 'Update' : 'Create'} Integration
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
