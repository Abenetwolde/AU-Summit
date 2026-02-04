import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetUserApplicationHistoryQuery, UserWithDuplicates, DuplicateApplication } from '@/store/services/api';
import { Badge } from '@/components/ui/badge';

export function DuplicateApplications() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const limit = 10;

    const { data, isLoading, error } = useGetUserApplicationHistoryQuery({
        page,
        limit,
        search
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/dashboard')}
                        className="mb-2 sm:mb-4 gap-2 px-0 hover:bg-transparent"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Applicant History & Duplications</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Identify users who have submitted multiple applications or are acting as agents.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-blue-900">Search Users</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by user name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Applications Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Users with Multiple Applications</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">
                            Error loading data. Please try again.
                        </div>
                    ) : (data?.users?.length === 0) ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No duplicate applications found.
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">User Name</TableHead>
                                        <TableHead className="w-[200px]">User Email</TableHead>
                                        <TableHead>Applications (Apply For)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.users?.map((user: UserWithDuplicates) => (
                                        <TableRow key={user.userId} className="hover:bg-blue-50/50 align-top">
                                            <TableCell className="font-medium">
                                                {user.fullName}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.email}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-3">
                                                    {user.applications.map((app: DuplicateApplication) => (
                                                        <div key={app.applicationId} className="bg-slate-50 p-3 rounded-md border text-sm">
                                                            <div className="flex justify-between mb-1">
                                                                <span className="font-semibold">ID: #{app.applicationId}</span>
                                                                <Badge variant="outline">{app.status}</Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-gray-600">
                                                                <div><span className="font-medium text-gray-900">Name:</span> {app.firstName} {app.lastName}</div>
                                                                <div><span className="font-medium text-gray-900">Country:</span> {app.country}</div>
                                                                <div className="col-span-2"><span className="font-medium text-gray-900">Passport:</span> {app.passportNumber}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {data && data.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing page {data?.currentPage} of {data?.totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={!!data?.totalPages && page >= data.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card >
        </div >
    );
}
