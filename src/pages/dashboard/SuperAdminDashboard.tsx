'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle, Clock, XCircle, ChevronDown,
  Filter, Building2, Volume2, Plane, Shield, TrendingUp, Factory,
  Package, LayoutDashboard, Eye, CalendarDays, Calendar,
  Download as DownloadIcon, FileText as FileTextIcon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  useGetDashboardFormsQuery,
  useGetDashboardDataQuery,
  useGetUsersQuery,
  useGetOrganizationsQuery,
  useGetApplicationsQuery,
  useGetSuperAdminOverviewQuery,
  useGetSuperAdminChartsQuery,
  useGetSuperAdminStakeholdersQuery,
  useGetSuperAdminStakeholderStatusQuery,
  useGetSuperAdminPerformanceQuery,
  useGetSuperAdminEntryExitStatsQuery
} from '@/store/services/api';
import { exportDashboardAnalyticsToCSV, exportDashboardAnalyticsToPDF } from '@/lib/export-utils';

// --- UTILITY ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CONSTANTS ---
const GEO_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";


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

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "gradient";
  size?: "default" | "sm" | "lg" | "icon";
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", size = "default", ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl text-sm font-semibold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
        {
          "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20": variant === "default",
          "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30": variant === "gradient",
          "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900": variant === "outline",
          "hover:bg-slate-100 hover:text-slate-900": variant === "ghost",
          "text-slate-900 underline-offset-4 hover:underline": variant === "link",
          "h-10 px-4 py-2": size === "default",
          "h-9 rounded-lg px-3": size === "sm",
          "h-12 rounded-xl px-8": size === "lg",
          "h-10 w-10": size === "icon",
        },
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

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

// --- MAIN PAGE ---
export default function SuperAdminDashboard() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string>("all");

  // Dashboard Data
  // Dashboard Data
  const { data: forms = [] } = useGetDashboardFormsQuery();
  const { data: dashboardData, isLoading: isDashboardLoading, isError: isDashboardError } = useGetDashboardDataQuery({
    formName: selectedForm === 'all' ? undefined : selectedForm
  });

  // New Super Admin Data
  const { data: overview, isLoading: isOverviewLoading } = useGetSuperAdminOverviewQuery();
  const { data: adminCharts, isLoading: isChartsLoading } = useGetSuperAdminChartsQuery();
  const { data: stakeholders, isLoading: isStakeholdersLoading } = useGetSuperAdminStakeholdersQuery();
  const { data: stakeholderStatus, isLoading: isStatusLoading } = useGetSuperAdminStakeholderStatusQuery();
  const { data: performanceData = [], isLoading: isPerformanceLoading } = useGetSuperAdminPerformanceQuery();
  const { data: entryExitStats, isLoading: isEntryExitLoading } = useGetSuperAdminEntryExitStatsQuery({ timeframe: 'month' });

  const [selectedStakeholder, setSelectedStakeholder] = useState<string>("");
  const [appTrendRange, setAppTrendRange] = useState<'thisMonth' | 'lastMonth'>('thisMonth');

  useEffect(() => {
    if (performanceData.length > 0 && !selectedStakeholder) {
      setSelectedStakeholder(performanceData[0].stakeholder);
    }
  }, [performanceData, selectedStakeholder]);

  // Utility to filter data for a specific month
  const filterByMonthRange = (data: any[], range: 'thisMonth' | 'lastMonth') => {
    const now = new Date();
    let targetMonth = now.getMonth();
    let targetYear = now.getFullYear();

    if (range === 'lastMonth') {
      targetMonth -= 1;
      if (targetMonth < 0) {
        targetMonth = 11;
        targetYear -= 1;
      }
    }

    return (data || []).filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });
  };

  // Utility to format minutes
  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
  };

  // Additional System Data
  const { data: usersData } = useGetUsersQuery();
  const { data: organizations = [] } = useGetOrganizationsQuery();
  const { data: appsData } = useGetApplicationsQuery({ page: 1, limit: 10 });
  const recentApplications = appsData?.applications || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLoading = isDashboardLoading || isOverviewLoading || isChartsLoading || isStakeholdersLoading || isStatusLoading || isPerformanceLoading || isEntryExitLoading;
  const isError = isDashboardError || !dashboardData || !overview || !adminCharts || !stakeholders || !stakeholderStatus || !performanceData || !entryExitStats;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-600 font-medium">Loading command center...</p>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
      <div className="p-4 bg-red-100 text-red-600 rounded-full">
        <XCircle className="h-12 w-12" />
      </div>
      <p className="text-slate-600 font-medium">Error loading dashboard data. Please try again.</p>
      <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
    </div>
  );

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 8));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 1));

  const totalDistribution = adminCharts.statusDistribution.reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);
  const donutData = adminCharts.statusDistribution.map((item: { status: string; count: number }) => ({
    name: item.status,
    value: item.count,
    percentage: Math.round((item.count / (totalDistribution || 1)) * 100),
    color: item.status === 'APPROVED' ? '#10b981' : item.status === 'REJECTED' ? '#ef4444' : item.status === 'IN_REVIEW' ? '#f59e0b' : '#3b82f6'
  }));

  const countryDataMap = new Map(dashboardData.countries.map(c => [c.code, c]));

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'speaker': return Volume2;
      case 'package': return Package;
      case 'airplane': return Plane;
      case 'shield': return Shield;
      case 'building': return Factory;
      default: return Building2;
    }
  };
  const selectedPerformance = performanceData.find(
    p => p.stakeholder === selectedStakeholder
  );

  const thisMonthData = filterByMonthRange(
    selectedPerformance?.trend || [],
    'thisMonth'
  );

  const thisMonthAverage = thisMonthData.length
    ? thisMonthData.reduce((sum, item) => sum + item.value, 0) /
    thisMonthData.length
    : 0;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-100">
          <p className="font-bold text-slate-800 mb-2">{formattedDate}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-slate-500">Total Entered:</span>
              <span className="font-bold text-slate-900">{payload[0].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Placeholder for internal functions that were removed

  if (!mounted) return null;

  return (
    <div className="font-sans min-h-screen bg-slate-50/50 flex text-slate-600">
      {/* INJECTED STYLES */}
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
                
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                }
                
                .animate-fade-in {
                    animation: fadeIn 0.6s ease-out forwards;
                    opacity: 0;
                }
                
                .animate-slide-up {
                    animation: slideUp 0.6s ease-out forwards;
                    opacity: 0;
                    transform: translateY(20px);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .glass-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                }
            `}</style>



      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-fade-in">
          {/* System Summary (Admin/Org counts) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-500 to-blue-600 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Shield className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative">
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">System Administrators</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-4xl font-bold">{usersData?.total || 0}</h3>
                  <span className="text-white/60 text-sm mb-1 font-medium">Active Users</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Building2 className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative">
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Partner Organizations</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-4xl font-bold">{organizations.length}</h3>
                  <span className="text-white/60 text-sm mb-1 font-medium">Registered</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-700 to-slate-900 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative">
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Total Active Roles</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-4xl font-bold">12</h3>
                  <span className="text-white/60 text-sm mb-1 font-medium">Defined Roles</span>
                </div>
              </CardContent>
            </Card>
          </div>

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
                      {entryExitStats?.entry.total} <span className="text-lg text-slate-400 font-medium">Total Apps</span>
                    </h3>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${entryExitStats?.entry.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    <TrendingUp className={`h-3 w-3 ${entryExitStats?.entry.trend === 'up' ? '' : 'rotate-180'}`} />
                    {entryExitStats?.entry.percentage}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Active</p>
                    <h4 className="text-2xl font-bold text-slate-800">{entryExitStats?.entry.active}</h4>
                    <Progress value={(entryExitStats?.entry.active || 0) / (entryExitStats?.entry.total || 1) * 100} className="mt-2 h-1.5 bg-blue-200" indicatorClassName="bg-blue-600" />
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl">
                    <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Completed</p>
                    <h4 className="text-2xl font-bold text-slate-800">{entryExitStats?.entry.completed}</h4>
                    <Progress value={(entryExitStats?.entry.completed || 0) / (entryExitStats?.entry.total || 1) * 100} className="mt-2 h-1.5 bg-emerald-200" indicatorClassName="bg-emerald-600" />
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
                      {entryExitStats?.exit.total} <span className="text-lg text-slate-400 font-medium">Total Apps</span>
                    </h3>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${entryExitStats?.exit.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    <TrendingUp className={`h-3 w-3 ${entryExitStats?.exit.trend === 'up' ? '' : 'rotate-180'}`} />
                    {entryExitStats?.exit.percentage}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-50 p-4 rounded-xl">
                    <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">Active</p>
                    <h4 className="text-2xl font-bold text-slate-800">{entryExitStats?.exit.active}</h4>
                    <Progress value={(entryExitStats?.exit.active || 0) / (entryExitStats?.exit.total || 1) * 100} className="mt-2 h-1.5 bg-amber-200" indicatorClassName="bg-amber-600" />
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl">
                    <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Completed</p>
                    <h4 className="text-2xl font-bold text-slate-800">{entryExitStats?.exit.completed}</h4>
                    <Progress value={(entryExitStats?.exit.completed || 0) / (entryExitStats?.exit.total || 1) * 100} className="mt-2 h-1.5 bg-emerald-200" indicatorClassName="bg-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Export Buttons with Event Filter */}
          <div className="flex items-center justify-end gap-3 mb-4">
            {/* Event Selector */}
            <div className="relative group">
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 bg-white min-w-[280px] hover:border-blue-400 transition-colors">
                <CalendarDays className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <select
                  value={selectedForm}
                  onChange={(e) => setSelectedForm(e.target.value)}
                  className="appearance-none border-0 outline-none text-sm flex-1 bg-transparent text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">All Forms</option>
                  {forms.map((form) => (
                    <option key={form.id} value={form.name}>
                      {form.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportDashboardAnalyticsToCSV('Super Admin Dashboard', overview, adminCharts)}
              className="gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => exportDashboardAnalyticsToPDF('Super Admin Dashboard', overview, adminCharts)}
              className="gap-2 text-white"
            >
              <FileTextIcon className="h-4 w-4" />
              Export PDF
            </Button>
          </div>

          {/* Filters Section */}
          {/* <Card className="border-0 shadow-sm glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap justify-wrap">
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 bg-white min-w-[200px] hover:border-blue-400 transition-colors">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <input
                    type="date"
                    placeholder="MM/DD/YYYY"
                    className="border-0 outline-none text-sm flex-1 bg-transparent text-slate-600 font-medium"
                  />
                </div>

                <div className="relative group">
                  <select className="appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white outline-none min-w-[220px] text-slate-700 font-medium hover:border-blue-400 transition-colors cursor-pointer">
                    <option>All organizations</option>
                    {dashboardData?.filterOptions.organizations.map((org: string, i: number) => (
                      <option key={i} value={org}>{org}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                </div>

                <div className="relative group">
                  <select className="appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white outline-none min-w-[220px] text-slate-700 font-medium hover:border-blue-400 transition-colors cursor-pointer">
                    <option>All Countries</option>
                    {dashboardData?.filterOptions.countries.map((country: string, i: number) => (
                      <option key={i} value={country}>{country}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                </div>

                <div className="relative group">
                  <select className="appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white outline-none min-w-[200px] text-slate-700 font-medium hover:border-blue-400 transition-colors cursor-pointer">
                    <option>All status</option>
                    {dashboardData?.filterOptions.statuses.map((status: string, i: number) => (
                      <option key={i} value={status}>{status}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                </div>

                <Button variant="gradient" className="gap-2 px-6 py-2.5">
                  <Filter className="h-4 w-4" />
                  Review Filters
                </Button>
              </div>
            </CardContent>
          </Card> */}

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {/* Total Applications */}
            <Card className="border-0 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm relative">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">{overview.totalApplications.label}</p>
                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{overview.totalApplications.value}</h3>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium ${overview.totalApplications.trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'} px-3 py-1 rounded-lg w-fit`}>
                  <TrendingUp className={`h-4 w-4 ${overview.totalApplications.trend === 'up' ? '' : 'rotate-180'}`} />
                  <span>{overview.totalApplications.percentage}% Growth</span>
                </div>
              </CardContent>
            </Card>

            {/* Approved Applications */}
            <Card className="border-0 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-500 mb-1">{overview.approvedApplications.label}</p>
                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{overview.approvedApplications.value}</h3>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium ${overview.approvedApplications.trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'} px-3 py-1 rounded-lg w-fit mt-4`}>
                  <TrendingUp className={`h-4 w-4 ${overview.approvedApplications.trend === 'up' ? '' : 'rotate-180'}`} />
                  <span>{overview.approvedApplications.percentage}% Growth</span>
                </div>
              </CardContent>
            </Card>

            {/* Pending Approval */}
            <Card className="border-0 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">{overview.pendingApplications.label}</p>
                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{String(overview.pendingApplications.value).padStart(2, '0')}</h3>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium ${overview.pendingApplications.trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'} px-3 py-1 rounded-lg w-fit`}>
                  <Clock className="h-4 w-4" />
                  <span>{overview.pendingApplications.percentage}% Pending</span>
                </div>
              </CardContent>
            </Card>

            {/* System Admins (Moved logic from summary) */}
            <Card className="border-0 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm relative group">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">System Admins</p>
                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{usersData?.total || 0}</h3>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active System Users</div>
              </CardContent>
            </Card>
          </div>

          {/* First Row: Geographic Distribution & Stakeholder Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {/* Lists of Country */}
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-50">
                <CardTitle>Geographic Distribution</CardTitle>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  <Button variant="ghost" size="icon" className="h-7 w-7 bg-white shadow-sm" onClick={handleZoomIn}>
                    <ChevronDown className="h-3 w-3 rotate-180" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/50" onClick={handleZoomOut}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="h-[320px] relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-1 shadow-inner">
                    <ComposableMap
                      projection="geoMercator"
                      projectionConfig={{ scale: 160 * zoom, center: [20, 0] }}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <Geographies geography={GEO_URL}>
                        {({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => {
                          const countryData = countryDataMap.get(geo.id);
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              onMouseEnter={() => setHoveredCountry(`${geo.properties.name}${countryData ? `: ${countryData.count}` : ''}`)}
                              onMouseLeave={() => setHoveredCountry(null)}
                              fill={countryData ? countryData.color : "#cbd5e1"}
                              stroke="#ffffff"
                              strokeWidth={0.5}
                              style={{
                                default: { outline: "none" },
                                hover: { fill: "#94a3b8", outline: "none" },
                                pressed: { outline: "none" },
                              }}
                            />
                          );
                        })}
                      </Geographies>
                    </ComposableMap>
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md shadow-lg border border-slate-100 rounded-xl px-4 py-2">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Selected</div>
                      <div className="text-sm font-bold text-slate-900">{hoveredCountry || "Hover a country"}</div>
                    </div>
                  </div>
                  <div className="space-y-3 flex-shrink-0 w-64">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top Nationalities</div>
                    <div className="h-[200px] w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashboardData.countries.slice(0, 5)} layout="vertical" margin={{ left: -20, right: 10, top: 0, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                            width={70}
                          />
                          <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white border p-2 rounded-lg shadow-sm text-xs border-slate-100">
                                    <p className="font-bold">{payload[0].payload.name}</p>
                                    <p className="text-blue-600">{payload[0].value} Journalists</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stakeholder Performance Charts */}
            <Card className="border-0 shadow-sm bg-white overflow-hidden h-full">
              <CardHeader className="pb-3 border-b border-slate-50 flex flex-row items-center justify-between">
                <div className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Stakeholder Performance</CardTitle>
                    <p className="text-xs text-slate-400 mt-1">Average Processing Time Trend (Current Month)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 leading-none">
                      {formatMinutes(thisMonthAverage)}
                    </p>

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Avg Process Time</p>
                  </div>
                </div>
                <div className="relative group mt-3">
                  <select
                    value={selectedStakeholder}
                    onChange={(e) => setSelectedStakeholder(e.target.value)}
                    className="appearance-none w-full border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs bg-white outline-none font-medium hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    {performanceData.map((p: { stakeholder: string }, i: number) => (
                      <option key={i} value={p.stakeholder}>{p.stakeholder}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filterByMonthRange(performanceData.find(p => p.stakeholder === selectedStakeholder)?.trend || [], 'thisMonth')}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric' })}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                        tickFormatter={(value) => formatMinutes(value)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: number | undefined) => [formatMinutes(value || 0), 'Avg Process Time']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row: Application Trends & Stakeholder Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
            {/* Application Trends - Time Series Chart */}
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Application Trends</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">Daily submission volume</p>
                </div>
                <p className="text-md text-black font-semibold mt-1">Total: {filterByMonthRange(adminCharts.timeSeries, appTrendRange).reduce((acc: number, curr: { count: number }) => acc + curr.count, 0)}</p>
                <div className="relative group">
                  <select
                    value={appTrendRange}
                    onChange={(e) => setAppTrendRange(e.target.value as any)}
                    className="appearance-none border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs bg-white outline-none font-medium hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filterByMonthRange(adminCharts.timeSeries, appTrendRange)}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#26f765ff" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#26f765ff" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString('en-US', { day: 'numeric' })
                        }
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        labelFormatter={(label) =>
                          new Date(label).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        }
                      />

                      <Bar
                        dataKey="count"
                        fill="url(#colorTrend)"
                        radius={[6, 6, 0, 0]}
                        barSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>

            </Card>

            {/* Stakeholder Analysis */}
            <Card className="border-0 shadow-sm h-full bg-white">
              <CardHeader className="pb-3 border-b border-slate-50 flex flex-row items-center justify-between">
                <CardTitle>Participant Institutional Background</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {stakeholders.map((org: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{org.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Organization Type</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">{org.value || org.applicationsCount}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Apps</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Third Row: Journalists Status & Role Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {/* Journalist Status - Donut Chart */}
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle>Journalists Status</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="space-y-4 flex-shrink-0">
                    {donutData.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-slate-600">{item.name}</span>
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-bold text-slate-800">{totalDistribution}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="flex-1 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={adminCharts.roleDistribution.map((role, i) => ({
                            name: `${role.roleName.replace('_', ' ')} (${role.count})`,
                            value: role.count,
                            color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          stroke="none"
                        >
                          {adminCharts.roleDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stakeholder Status Breakdown */}
          <div className="animate-slide-up" style={{ animationDelay: '0.45s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Stakeholder Status Breakdown</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(stakeholderStatus).map(([name, status], i) => {
                const data = [
                  { name: 'Approved', value: status.APPROVED, color: '#10b981' },
                  { name: 'Rejected', value: status.REJECTED, color: '#ef4444' },
                  { name: 'Pending', value: status.PENDING, color: '#f59e0b' },
                ];
                const total = status.APPROVED + status.REJECTED + status.PENDING;

                return (
                  <Card key={i} className="border-0 shadow-sm bg-white overflow-hidden group">
                    <CardHeader className="pb-2 border-b border-slate-50 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm border-l-4 pl-3" style={{ borderColor: '#3b82f6' }}>{name}</CardTitle>
                      <span className="text-xs font-bold text-slate-400">Total: {total}</span>
                    </CardHeader>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-1 h-[140px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={50}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-lg font-bold text-slate-800">{String(Math.round((status.APPROVED / (total || 1)) * 100))}%</span>
                        </div>
                      </div>
                      <div className="space-y-2 flex-shrink-0">
                        {data.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[10px] font-bold">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-500 w-12">{item.name}</span>
                            <span className="text-slate-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recent Applications Feed */}
          <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Recent Applications Feed</h2>
              <Button variant="link" className="text-blue-600 font-bold" onClick={() => window.location.href = '/dashboard/journalists'}>
                View All Applications
              </Button>
            </div>
            <Card className="border-0 shadow-sm overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Journalist</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentApplications.map((app: any) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                              {app.user?.fullName?.charAt(0) || 'J'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{app.user?.fullName || 'Anonymous'}</p>
                              <p className="text-xs text-slate-400">{app.formData?.country || app.user?.country || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-600">{app.formData?.organization_name || 'Individual'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                            app.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${app.status === 'APPROVED' ? 'bg-emerald-500' :
                              app.status === 'REJECTED' ? 'bg-red-500' :
                                'bg-amber-500'
                              }`} />
                            {app.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-medium text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" onClick={() => window.location.href = `/dashboard/journalists/${app.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {recentApplications.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                          No recent applications to display.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-slate-400 py-8">
            © 2025 Official Ethiopia Media Authority Portal. All rights reserved.
          </div>
        </div>
      </main >
    </div >
  );
}
