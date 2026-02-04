'use client';

import React, { useState, useEffect } from 'react';
import {
    CheckCircle, Clock, XCircle, TrendingUp,
    Eye, Activity, Calendar, Plane
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useGetAdminAnalyticsQuery, useGetAdminEntryExitStatsQuery, useGetAdminOfficerKPIsQuery } from '@/store/services/api';
import { exportDashboardAnalyticsToCSV, exportElementToPDF } from '@/lib/export-utils';
import { Download, FileText, User as UserIcon } from 'lucide-react';
import { OfficerPerformance } from '@/components/dashboard/OfficerPerformance';
import { useAuth, UserRole } from '@/auth/context';

// --- UTILITY ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- UI COMPONENTS ---
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-bold leading-none tracking-tight text-slate-800", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }>(({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-xl text-sm font-semibold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
                {
                    "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20": variant === "default",
                    "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900": variant === "outline",
                    "h-10 px-4 py-2": size === "default",
                    "h-9 rounded-lg px-3": size === "sm",
                },
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Button.displayName = "Button";

const Badge = ({ children, className, variant = "neutral" }: { children: React.ReactNode, className?: string, variant?: string }) => {
    const variants: Record<string, string> = {
        APPROVED: "bg-emerald-100 text-emerald-700",
        PENDING: "bg-amber-100 text-amber-700",
        REJECTED: "bg-red-100 text-red-700",
        neutral: "bg-slate-100 text-slate-700",
    };
    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider", variants[variant] || variants.neutral, className)}>
            {children}
        </span>
    );
};

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
    indicatorClassName?: string;
}
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className, value = 0, indicatorClassName, ...props }, ref) => (
    <div ref={ref} className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100", className)} {...props}>
        <div className={cn("h-full w-full flex-1 transition-all duration-500 ease-out", indicatorClassName)} style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
    </div>
));
Progress.displayName = "Progress";

export default function AdminDashboard() {
    const { user } = useAuth();
    const { data: analytics, isLoading: isAnalyticsLoading, isError: isAnalyticsError } = useGetAdminAnalyticsQuery();
    const { data: entryExitStats, isLoading: isEntryExitLoading, isError: isEntryExitError } = useGetAdminEntryExitStatsQuery({ timeframe: 'month' });
    const { data: officerKPIs, isLoading: isOfficerLoading } = useGetAdminOfficerKPIsQuery({ timeframe: 'month' });
    const isLoading = isAnalyticsLoading || isEntryExitLoading;
    const isError = isAnalyticsError || isEntryExitError;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
    );

    if (isError || !analytics || !entryExitStats) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
            <div className="p-4 bg-red-100 text-red-600 rounded-full">
                <XCircle className="h-12 w-12" />
            </div>
            <p className="text-slate-600 font-medium">Error loading dashboard data.</p>
            <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
        </div>
    );

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-fade-in font-sans">
            <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
      `}</style>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Overview</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        {[UserRole.SUPER_ADMIN, UserRole.PMO, UserRole.ORG_ADMIN].includes(user?.role as any)
                            ? "Review your assignment status and performance metrics."
                            : "Review your current assignment status."}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => exportDashboardAnalyticsToCSV('Admin Dashboard', { kpis: analytics.kpis, charts: analytics.chartData })}>
                            <Download className="h-4 w-4" />
                            CSV
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary/5" onClick={() => exportElementToPDF('dashboard-visual-export', 'Executive_Dashboard')}>
                            <FileText className="h-4 w-4" />
                            PDF
                        </Button>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div className="pr-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Current Date</p>
                            <p className="text-sm font-bold text-slate-700 leading-none">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Assigned */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-500 to-blue-600 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Activity className="h-24 w-24" />
                    </div>
                    <CardContent className="p-6 relative">
                        <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">{analytics.kpis.totalApplicationsReceived.label}</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-4xl font-bold">{analytics.kpis.totalApplicationsReceived.value}</h3>
                            <div className="flex items-center gap-1 text-white/90 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full mb-1">
                                <Activity className="h-3 w-3" />
                                <span>Overview</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Approved by You */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-24 w-24" />
                    </div>
                    <CardContent className="p-6 relative">
                        <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">{analytics.kpis.approvedByYou.label}</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-4xl font-bold">{analytics.kpis.approvedByYou.value}</h3>
                            <div className="flex items-center gap-1 text-white/90 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full mb-1">
                                <TrendingUp className={cn("h-3 w-3", analytics.kpis.approvedByYou.trend === 'down' && "rotate-180")} />
                                <span>{analytics.kpis.approvedByYou.percentage}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Your Review */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform text-white">
                        <Clock className="h-24 w-24" />
                    </div>
                    <CardContent className="p-6 relative">
                        <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">{analytics.kpis.pendingDecision.label}</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-4xl font-bold">{analytics.kpis.pendingDecision.value}</h3>
                            <div className="flex items-center gap-1 text-white/90 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full mb-1">
                                <Clock className="h-3 w-3" />
                                <span>Review</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Rejected by You */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-red-500 to-rose-600 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <XCircle className="h-24 w-24" />
                    </div>
                    <CardContent className="p-6 relative">
                        <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">{analytics.kpis.rejectedByYou.label}</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-4xl font-bold">{analytics.kpis.rejectedByYou.value}</h3>
                            <div className="flex items-center gap-1 text-white/90 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full mb-1">
                                <TrendingUp className={cn("h-3 w-3", analytics.kpis.rejectedByYou.trend === 'down' && "rotate-180")} />
                                <span>{analytics.kpis.rejectedByYou.percentage}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* MOFA Specific Sections */}
            {analytics.mofaData && (
                <div className="space-y-8 animate-slide-up mt-8" style={{ animationDelay: '0.1s' }}>
                    {/* 1. Application Distribution by Role */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-800">Ministry Reviewing Role Distribution</h2>
                            <Badge variant="neutral" className="bg-indigo-50 text-indigo-700">Workflow Stages</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {analytics.mofaData.roleDistribution.map((role: any, i: number) => (
                                <Card key={i} className="border-0 shadow-sm bg-white overflow-hidden relative group h-full">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                        <UserIcon className="h-16 w-16" />
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-4">
                                            {/* Header */}
                                            <div>
                                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 truncate">
                                                    {(role.name || 'Unknown Role').replace(/_/g, ' ')}
                                                </p>
                                                <div className="flex items-end gap-2">
                                                    <h3 className="text-3xl font-bold text-slate-800">{role.total || 0}</h3>
                                                    <span className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Assigned</span>
                                                </div>
                                            </div>

                                            {/* Status Grid */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-emerald-50 p-2 rounded-lg">
                                                    <p className="text-emerald-600 text-[9px] font-black uppercase tracking-tighter mb-0.5">Approved</p>
                                                    <p className="text-lg font-bold text-slate-800 leading-none">{role.approved}</p>
                                                    <p className="text-[9px] font-bold text-emerald-600/70 mt-0.5">
                                                        {role.total > 0 ? Math.round((role.approved / role.total) * 100) : 0}%
                                                    </p>
                                                </div>
                                                <div className="bg-amber-50 p-2 rounded-lg">
                                                    <p className="text-amber-600 text-[9px] font-black uppercase tracking-tighter mb-0.5">Pending</p>
                                                    <p className="text-lg font-bold text-slate-800 leading-none">{role.pending}</p>
                                                    <p className="text-[9px] font-bold text-amber-600/70 mt-0.5">Review</p>
                                                </div>
                                                <div className="bg-red-50 p-2 rounded-lg">
                                                    <p className="text-red-600 text-[9px] font-black uppercase tracking-tighter mb-0.5">Rejected</p>
                                                    <p className="text-lg font-bold text-slate-800 leading-none">{role.rejected}</p>
                                                    <p className="text-[9px] font-bold text-red-600/70 mt-0.5">
                                                        {role.total > 0 ? Math.round((role.rejected / role.total) * 100) : 0}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* 2. Embassy Statistical Overview */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-800">Embassy Statistical Overview</h2>
                            <Badge variant="neutral" className="bg-blue-50 text-blue-700">Birds-eye View</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {analytics.mofaData.embassyStats.map((embassy, i) => {
                                const data = [
                                    { name: 'Approved', value: embassy.approved, color: '#10b981' },
                                    { name: 'Rejected', value: embassy.rejected, color: '#ef4444' },
                                    { name: 'Pending', value: embassy.pending, color: '#f59e0b' },
                                ];
                                return (
                                    <Card key={i} className="border-0 shadow-sm bg-white hover:shadow-md transition-all overflow-hidden">
                                        <CardHeader className="pb-2 border-b border-slate-50 flex flex-row items-center justify-between">
                                            <CardTitle className="text-base truncate max-w-[200px]">{embassy.name}</CardTitle>
                                            <div className="text-[10px] font-bold text-slate-400">TOTAL: {embassy.total}</div>
                                        </CardHeader>
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="h-32 w-32 relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={40} paddingAngle={2} dataKey="value" stroke="none">
                                                            {data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <span className="text-lg font-bold text-slate-700">
                                                        {embassy.total > 0 ? Math.round((embassy.approved / embassy.total) * 100) : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                {data.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                            <span className="text-slate-500 font-medium">{item.name}</span>
                                                        </div>
                                                        <span className="font-bold text-slate-800">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

                {/* Entry/Exit Workflow Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {/* Entry Workflow */}
                    <Card className="border-0 shadow-sm bg-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <Plane className="h-32 w-32 rotate-45" />
                        </div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Entry Workflow</p>
                                    <h3 className="text-3xl font-bold text-slate-800">
                                        {entryExitStats?.entry.total} <span className="text-lg text-slate-400 font-medium">Total Applications</span>
                                    </h3>
                                </div>
                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${entryExitStats?.entry.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    <TrendingUp className={`h-3 w-3 ${entryExitStats?.entry.trend === 'up' ? '' : 'rotate-180'}`} />
                                    {entryExitStats?.entry.percentage}%
                                </div>
                            </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-emerald-50 p-3 rounded-xl">
                                <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-1">Approved</p>
                                <h4 className="text-xl font-bold text-slate-800">{entryExitStats?.entry.approved}</h4>
                                <Progress value={(entryExitStats?.entry.approved || 0) / (entryExitStats?.entry.total || 1) * 100} className="mt-2 h-1 bg-emerald-200" indicatorClassName="bg-emerald-600" />
                            </div>
                            <div className="bg-amber-50 p-3 rounded-xl">
                                <p className="text-amber-600 text-[10px] font-bold uppercase tracking-wider mb-1">Pending</p>
                                <h4 className="text-xl font-bold text-slate-800">{entryExitStats?.entry.pending}</h4>
                                <Progress value={(entryExitStats?.entry.pending || 0) / (entryExitStats?.entry.total || 1) * 100} className="mt-2 h-1 bg-amber-200" indicatorClassName="bg-amber-600" />
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl">
                                <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider mb-1">Rejected</p>
                                <h4 className="text-xl font-bold text-slate-800">{entryExitStats?.entry.rejected}</h4>
                                <Progress value={(entryExitStats?.entry.rejected || 0) / (entryExitStats?.entry.total || 1) * 100} className="mt-2 h-1 bg-red-200" indicatorClassName="bg-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                    {/* Exit Workflow */}
                    <Card className="border-0 shadow-sm bg-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <Plane className="h-32 w-32 -rotate-45" />
                        </div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Exit Workflow</p>
                                    <h3 className="text-3xl font-bold text-slate-800">
                                        {entryExitStats?.exit.total} <span className="text-lg text-slate-400 font-medium">Total Applications</span>
                                    </h3>
                                </div>
                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${entryExitStats?.exit.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    <TrendingUp className={`h-3 w-3 ${entryExitStats?.exit.trend === 'up' ? '' : 'rotate-180'}`} />
                                    {entryExitStats?.exit.percentage}%
                                </div>
                            </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-emerald-50 p-3 rounded-xl">
                                <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-1">Approved</p>
                                <h4 className="text-xl font-bold text-slate-800">{entryExitStats?.exit.approved}</h4>
                                <Progress value={(entryExitStats?.exit.approved || 0) / (entryExitStats?.exit.total || 1) * 100} className="mt-2 h-1 bg-emerald-200" indicatorClassName="bg-emerald-600" />
                            </div>
                            <div className="bg-amber-50 p-3 rounded-xl">
                                <p className="text-amber-600 text-[10px] font-bold uppercase tracking-wider mb-1">Pending</p>
                                <h4 className="text-xl font-bold text-slate-800">{entryExitStats?.exit.pending}</h4>
                                <Progress value={(entryExitStats?.exit.pending || 0) / (entryExitStats?.exit.total || 1) * 100} className="mt-2 h-1 bg-amber-200" indicatorClassName="bg-amber-600" />
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl">
                                <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider mb-1">Rejected</p>
                                <h4 className="text-xl font-bold text-slate-800">{entryExitStats?.exit.rejected}</h4>
                                <Progress value={(entryExitStats?.exit.rejected || 0) / (entryExitStats?.exit.total || 1) * 100} className="mt-2 h-1 bg-red-200" indicatorClassName="bg-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Application Trends */}
                    <Card className="lg:col-span-2 shadow-sm border-slate-100">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Application Processing Trends</CardTitle>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Activity className="h-4 w-4" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.chartData.timeSeries}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                            dy={10}
                                            tickFormatter={(str) => {
                                                const date = new Date(str);
                                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                            }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Distribution */}
                    <Card className="shadow-sm border-slate-100">
                        <CardHeader>
                            <CardTitle>Status Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics.chartData.statusDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="count"
                                            nameKey="status"
                                        >
                                            {analytics.chartData.statusDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-2">
                                {analytics.chartData.statusDistribution.map((item, i) => (
                                    <div key={item.status} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                            <span className="text-slate-600 font-medium">{item.status}</span>
                                        </div>
                                        <span className="font-bold text-slate-900">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            {/* Second Row: Org Distribution & Performance */}
            {([UserRole.SUPER_ADMIN, UserRole.PMO, UserRole.ORG_ADMIN] as string[]).includes(user?.role || '') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Metric */}
                    <Card className="shadow-sm border-slate-100 flex flex-col justify-center items-center p-8 bg-slate-900 text-white overflow-hidden relative h-[350px]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                        <div className="p-4 bg-white/10 rounded-2xl mb-4">
                            <Clock className="h-8 w-8 text-blue-400" />
                        </div>
                        <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">{analytics.performance.label}</p>
                        <h3 className="text-5xl font-bold mb-2">
                            {Math.floor(analytics.performance.averageProcessingTimeMinutes / 60)}h {analytics.performance.averageProcessingTimeMinutes % 60}m
                        </h3>
                        <p className="text-white/40 text-xs font-medium">Average across all your processed applications</p>
                    </Card>

                    {/* Officer Performance KPIs */}
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Team Performance KPIs</h2>
                                <p className="text-sm text-slate-500">Monitor your team's application processing efficiency</p>
                            </div>
                        </div>
                        <OfficerPerformance data={officerKPIs} isLoading={isOfficerLoading} />
                    </div>
                </div>
            )}


            {/* Recent Activity Table */}
            <Card className="shadow-sm border-slate-100">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Activity</CardTitle>
                    <Button variant="outline" size="sm">View All</Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-y border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">App ID</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {analytics.recentActivity.map((activity) => (
                                    <tr key={activity.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                                                    {activity.applicant.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-900 text-sm">{activity.applicant}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-600">#{activity.applicationId}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={activity.status}>{activity.status}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(activity.actionAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
