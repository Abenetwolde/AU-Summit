
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Plus,
    MoreHorizontal,
    Search,
    FileText,
    Pencil,
    Trash2,
    Loader2,
    Calendar,
    CheckCircle2,
    Archive
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetFormsQuery, useDeleteFormMutation, Form } from '@/store/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/auth/context';

export default function FormList() {
    const navigate = useNavigate();
    const { data: forms, isLoading, isError } = useGetFormsQuery();
    const [deleteForm] = useDeleteFormMutation();
    const [searchTerm, setSearchTerm] = useState('');

    const { checkPermission } = useAuth();
    const canCreateForm = checkPermission('form:create');
    const canUpdateForm = checkPermission('form:update');
    const canDeleteForm = checkPermission('form:delete');

    const handleDelete = async (id: number) => {
        if (!canDeleteForm) {
            toast.error("You don't have permission to delete forms");
            return;
        }
        if (confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
            try {
                await deleteForm(id).unwrap();
                toast.success('Form deleted successfully');
            } catch (error) {
                toast.error('Failed to delete form');
            }
        }
    };

    const filteredForms = forms?.filter(form =>
        form.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Published</Badge>;
            case 'DRAFT':
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">Draft</Badge>;
            case 'ARCHIVED':
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Archived</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (isError) {
        return <div className="p-8 text-center text-red-500">Failed to load forms. Please try again later.</div>;
    }

    return (
        <div className="p-8 space-y-6 bg-gray-50/50 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Form Management</h1>
                    <p className="text-gray-500 mt-1">Create and manage application forms for accreditation and other processes.</p>
                </div>
                {canCreateForm && (
                    <Button onClick={() => navigate('/dashboard/forms/builder')} className="bg-black hover:bg-gray-800 text-white gap-2">
                        <Plus className="h-4 w-4" /> Create New Form
                    </Button>
                )}
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">All Forms</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search forms..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="w-[300px]">Form Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredForms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                            No forms found. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredForms.map((form) => (
                                        <TableRow key={form.form_id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span>{form.name}</span>
                                                        <span className="text-xs text-gray-400">ID: {form.form_id}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {form.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(form.status)}</TableCell>
                                            <TableCell className="text-gray-500 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(form.updated_at), 'MMM d, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {(canUpdateForm || canDeleteForm) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            {canUpdateForm && (
                                                                <DropdownMenuItem onClick={() => navigate(`/dashboard/forms/builder/${form.form_id}`)}>
                                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            {canDeleteForm && (
                                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(form.form_id)}>
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
