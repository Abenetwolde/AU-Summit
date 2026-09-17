'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle, Clock, XCircle, ChevronDown,
  Filter, Building2, Volume2, Plane, Shield, TrendingUp, Factory,
  Package, LayoutDashboard, Eye, CalendarDays, Calendar,
  Download as DownloadIcon, FileText as FileTextIcon,
  Plus, Minus, LogOut
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, BarChart, Bar, LabelList } from 'recharts';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import en from 'react-phone-number-input/locale/en';
import {
  useGetFormsQuery,
  useGetDashboardDataQuery,
  useGetUsersQuery,
  useGetOrganizationsQuery,
  useGetApplicationsQuery,
  useGetSuperAdminOverviewQuery,
  useGetSuperAdminChartsQuery,

  useGetSuperAdminStakeholderStatusQuery,
  useGetSuperAdminPerformanceQuery,
  useGetSuperAdminEntryExitStatsQuery,
  useGetSuperAdminOfficerPerformanceQuery,
  useGetRegistrationStatsQuery
} from '@/store/services/api';
import { exportDashboardAnalyticsToCSV, exportDashboardAnalyticsToPDF, captureElement, type DashboardExportData } from '@/lib/export-utils';
import { OfficerPerformance } from '@/components/dashboard/OfficerPerformance';
import CountryDistributionWidget from '@/components/dashboard/CountryDistributionWidget';
import { FormFilter } from '@/components/dashboard/FormFilter';

// --- UTILITY ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CONSTANTS ---



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
  const [mounted, setMounted] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | undefined>(undefined);

  // Dashboard Data
  const { data: dashboardData, isLoading: isDashboardLoading, isError: isDashboardError } = useGetDashboardDataQuery({
    // Keep using formName if needed elsewhere, but ideally we should migrate this too if possible
    // For now, let's stick to the SuperAdmin metrics using formId
  });

  // Active Forms List for Event Scope Indicator
  const { data: forms = [] } = useGetFormsQuery();
  const activeForms = forms?.filter(f => f?.status === 'PUBLISHED') || [];
  const selectedForm = forms?.find(f => f?.form_id?.toString() === selectedFormId);

  // New Super Admin Data
  const { data: overview, isLoading: isOverviewLoading } = useGetSuperAdminOverviewQuery({ 
    formId: selectedFormId ? Number(selectedFormId) : undefined 
  });
  const { data: adminCharts, isLoading: isChartsLoading } = useGetSuperAdminChartsQuery({ 
    formId: selectedFormId ? Number(selectedFormId) : undefined 
  });

  const { data: entryStakeholderStatus, isLoading: isEntryStatusLoading } = useGetSuperAdminStakeholderStatusQuery({ 
    type: 'ENTRY',
    formId: selectedFormId ? Number(selectedFormId) : undefined 
  });
  const { data: exitStakeholderStatus, isLoading: isExitStatusLoading } = useGetSuperAdminStakeholderStatusQuery({ 
    type: 'EXIT',
    formId: selectedFormId ? Number(selectedFormId) : undefined 
  });
  const { data: performanceData = [], isLoading: isPerformanceLoading } = useGetSuperAdminPerformanceQuery({ 
    formId: selectedFormId ? Number(selectedFormId) : undefined 
  });
  const { data: entryExitStats, isLoading: isEntryExitLoading } = useGetSuperAdminEntryExitStatsQuery({ 
    timeframe: 'month',
    formId: selectedFormId ? Number(selectedFormId) : undefined 
  });
  const { data: officerKPIs, isLoading: isOfficerLoading } = useGetSuperAdminOfficerPerformanceQuery({ 
    timeframe: 'month',
    formId: selectedFormId ? Number(selectedFormId) : undefined 
  });
  const { data: registrationStats } = useGetRegistrationStatsQuery();

  const [selectedStakeholder, setSelectedStakeholder] = useState<string>("");
  const [appTrendRange, setAppTrendRange] = useState<'thisMonth' | 'lastMonth'>('thisMonth');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Stakeholder aggregation states (Grouping review steps by common key across all forms)
  const [stakeholderWorkflowType, setStakeholderWorkflowType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [stakeholderMetricType, setStakeholderMetricType] = useState<'pending' | 'total' | 'approved'>('pending');
  const [selectedStakeholderDetail, setSelectedStakeholderDetail] = useState<string | null>(null);

  // Curated harmonious color palette for dynamically fetched organizations
  const DYNAMIC_ORG_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#84cc16', // Lime
    '#e11d48', // Rose
    '#64748b', // Slate
  ];

  // Helper to dynamically resolve stakeholder key and organization name from DB
  const getStakeholderIdentity = (stepData: any, stepName: string) => {
    // 1. Primary: Use the organization name fetched directly from the database where step approver role exists
    const orgName = (stepData?.organizationName || stepData?.organization || '').trim();
    if (orgName) {
      const orgId = stepData.organizationId ? `org_${stepData.organizationId}` : orgName.toLowerCase().replace(/[^a-z0-9]/gi, '_');
      let hash = 0;
      for (let i = 0; i < orgId.length; i++) {
        hash = ((hash << 5) - hash) + orgId.charCodeAt(i);
        hash |= 0;
      }
      const color = stepData?.color || DYNAMIC_ORG_COLORS[Math.abs(hash) % DYNAMIC_ORG_COLORS.length];
      return { id: orgId, label: orgName, color };
    }

    // 2. Fallback: If role has no organization in DB, use role or step name from DB
    const fallbackLabel = (stepData?.role || stepName || stepData?.key || 'Unassigned Organization').trim();
    const rawId = fallbackLabel.toLowerCase().replace(/[^a-z0-9]/gi, '_');
    let fallbackHash = 0;
    for (let i = 0; i < rawId.length; i++) {
      fallbackHash = ((fallbackHash << 5) - fallbackHash) + rawId.charCodeAt(i);
      fallbackHash |= 0;
    }
    const color = stepData?.color || DYNAMIC_ORG_COLORS[Math.abs(fallbackHash) % DYNAMIC_ORG_COLORS.length];
    return { id: rawId, label: fallbackLabel, color };
  };

  // Aggregated stakeholder workload across all active forms
  const aggregatedStakeholderStats = React.useMemo(() => {
    const targetStatus = stakeholderWorkflowType === 'ENTRY' ? entryStakeholderStatus : exitStakeholderStatus;
    if (!targetStatus) return [];

    const map: Record<string, {
      id: string;
      label: string;
      color: string;
      pending: number;
      approved: number;
      rejected: number;
      total: number;
      formsCount: number;
      formContributions: {
        formId: number;
        formName: string;
        stepName: string;
        role?: string;
        pending: number;
        approved: number;
        rejected: number;
        total: number;
      }[];
    }> = {};

    if (targetStatus.forms && Array.isArray(targetStatus.forms) && targetStatus.forms.length > 0) {
      targetStatus.forms.forEach((formItem: any) => {
        Object.entries(formItem.steps || {}).forEach(([stepName, stepData]: [string, any]) => {
          const { id, label, color } = getStakeholderIdentity(stepData, stepName);
          if (!map[id]) {
            map[id] = {
              id,
              label,
              color: stepData.color || color,
              pending: 0,
              approved: 0,
              rejected: 0,
              total: 0,
              formsCount: 0,
              formContributions: []
            };
          }

          const pending = Number(stepData.PENDING || 0);
          const approved = Number(stepData.APPROVED || 0);
          const rejected = Number(stepData.REJECTED || 0);
          const total = Number(stepData.TOTAL || (pending + approved + rejected) || 0);

          map[id].pending += pending;
          map[id].approved += approved;
          map[id].rejected += rejected;
          map[id].total += total;

          map[id].formContributions.push({
            formId: formItem.formId,
            formName: formItem.formName,
            stepName,
            role: stepData.role,
            pending,
            approved,
            rejected,
            total
          });
        });
      });

      Object.values(map).forEach(item => {
        item.formsCount = new Set(item.formContributions.map(c => c.formId)).size;
      });
    } else {
      // Legacy flat fallback
      Object.entries(targetStatus).forEach(([stepName, stats]: [string, any]) => {
        if (stepName === 'forms' || typeof stats !== 'object' || stats === null) return;
        const { id, label, color } = getStakeholderIdentity(stats, stepName);
        if (!map[id]) {
          map[id] = {
            id,
            label,
            color: stats.color || color,
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0,
            formsCount: 1,
            formContributions: []
          };
        }
        const pending = Number(stats.PENDING || 0);
        const approved = Number(stats.APPROVED || 0);
        const rejected = Number(stats.REJECTED || 0);
        const total = Number(stats.TOTAL || (pending + approved + rejected) || 0);

        map[id].pending += pending;
        map[id].approved += approved;
        map[id].rejected += rejected;
        map[id].total += total;

        map[id].formContributions.push({
          formId: 0,
          formName: 'Global Workflow',
          stepName,
          role: stats.role,
          pending,
          approved,
          rejected,
          total
        });
      });
    }

    return Object.values(map).sort((a, b) => b[stakeholderMetricType] - a[stakeholderMetricType]);
  }, [entryStakeholderStatus, exitStakeholderStatus, stakeholderWorkflowType, stakeholderMetricType]);

  const stakeholderPieData = React.useMemo(() => {
    return aggregatedStakeholderStats.map(item => ({
      name: item.label,
      value: item[stakeholderMetricType],
      color: item.color,
      id: item.id,
      pending: item.pending,
      approved: item.approved,
      rejected: item.rejected,
      total: item.total,
      formsCount: item.formsCount,
      formContributions: item.formContributions
    })).filter(i => i.value > 0);
  }, [aggregatedStakeholderStats, stakeholderMetricType]);

  const totalStakeholderMetricSum = React.useMemo(() => {
    return stakeholderPieData.reduce((acc, curr) => acc + curr.value, 0);
  }, [stakeholderPieData]);

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



  // Derived metrics from Journalists Status chart data for mini cards consistency
  const chartDerivedStats = React.useMemo(() => {
    if (!adminCharts?.statusDistribution) return { total: 0, approved: 0, pending: 0, rejected: 0, submitted: 0 };

    const approved = adminCharts.statusDistribution.find((s: any) => s.status === 'APPROVED')?.count || 0;
    const rejected = adminCharts.statusDistribution.find((s: any) => s.status === 'REJECTED')?.count || 0;
    // Strictly count IN_REVIEW for the "In Review" card
    const pending = adminCharts.statusDistribution.find((s: any) => s.status === 'IN_REVIEW')?.count || 0;
    const submitted = adminCharts.statusDistribution.find((s: any) => s.status === 'SUBMITTED')?.count || 0;

    // Total should include ALL applications (Submitted, In Review, Approved, Rejected, etc.)
    const total = adminCharts.statusDistribution.reduce((acc: number, curr: any) => acc + curr.count, 0);

    return { total, approved, pending, rejected, submitted };
  }, [adminCharts?.statusDistribution]);

  if (!mounted) return null;

  const isLoading = isDashboardLoading || isOverviewLoading || isChartsLoading || isEntryStatusLoading || isExitStatusLoading || isPerformanceLoading || isEntryExitLoading;
  const isError = isDashboardError || !dashboardData || !overview || !adminCharts || !entryStakeholderStatus || !performanceData || !entryExitStats;

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



  const totalDistribution = adminCharts.statusDistribution.reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);
  const donutData = adminCharts.statusDistribution.map((item: { status: string; count: number }) => ({
    name: item.status,
    value: item.count,
    percentage: Math.round((item.count / (totalDistribution || 1)) * 100),
    color: item.status === 'APPROVED' ? '#10b981' : item.status === 'REJECTED' ? '#ef4444' : item.status === 'IN_REVIEW' ? '#f59e0b' : '#3b82f6'
  }));



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

  // Export Handlers
  const handleExportCSV = () => {
    if (!overview || !adminCharts || !dashboardData) return;

    const exportData: DashboardExportData = {
      kpis: overview as any,
      charts: {
        timeSeries: adminCharts.timeSeries,
        statusDistribution: adminCharts.statusDistribution,
        roleDistribution: adminCharts.roleDistribution,
        registrationStats: registrationStats
      },
      geographicDistribution: dashboardData.countries,
      officerPerformance: officerKPIs?.officers || []
    };

    exportDashboardAnalyticsToCSV('Super Admin Dashboard', exportData);
  };

  const handleExportPDF = async () => {
    if (!overview || !adminCharts || !dashboardData) return;
    setIsExportingPDF(true);

    try {
      const exportData: DashboardExportData = {
        kpis: overview as any,
        charts: {
          timeSeries: adminCharts.timeSeries,
          statusDistribution: adminCharts.statusDistribution,
          roleDistribution: adminCharts.roleDistribution,
          registrationStats: registrationStats
        },
        geographicDistribution: dashboardData.countries,
        officerPerformance: officerKPIs?.officers || []
      };

      const images = {
        'chart-application-trends': await captureElement('chart-application-trends'),
        'chart-journalist-status': await captureElement('chart-journalist-status'),
        'chart-geographic-dist': await captureElement('chart-geographic-dist'),
        'chart-coverage-type': await captureElement('chart-coverage-type'),
        'chart-media-type': await captureElement('chart-media-type'),
      };

      await exportDashboardAnalyticsToPDF('Super Admin Dashboard', exportData, images);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="font-sans min-h-screen bg-slate-50/50 flex text-slate-600">
      {/* INJECTED STYLES */}
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
      
      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      
      .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
      .animate-slide-up { animation: slideUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px); }
      
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

      .glass-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.5);
      }
    `}</style>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto animate-fade-in">

          {/* Scope Indicator + Filter + Export Controls */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4 bg-white/70 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Analytics Scope:</span>
                {selectedForm ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                    <FileTextIcon className="h-3.5 w-3.5 text-blue-600" />
                    <span>{selectedForm.name}</span>
                    <span className="text-[11px] text-blue-500 font-normal">({activeForms.length} active forms available)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
                    <span>All Active Forms Combined</span>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-200/70 text-emerald-800 rounded-full font-extrabold">
                      {activeForms.length} Active Events
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <FormFilter 
                value={selectedFormId} 
                onChange={setSelectedFormId} 
              />
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 justify-center">
                <DownloadIcon className="h-4 w-4" /> <span className="hidden sm:inline">Export</span> CSV
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="gap-2 text-white min-w-[120px] justify-center"
              >
                {isExportingPDF ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileTextIcon className="h-4 w-4" /> Export PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 1. Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            {/* Total Entered */}


            {/* Total Applications (Entry) */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-500 to-blue-600 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Users className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative">
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Total Applications</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-4xl font-bold">
                    {chartDerivedStats.total}
                  </h3>
                  <span className="text-white/60 text-sm mb-1 font-medium">Total Registered</span>
                </div>
              </CardContent>
            </Card>

            {/* Submitted (Entry) */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-cyan-600 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                <FileTextIcon className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative">
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Submitted</p>
                <div className="flex items-end justify-between">
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold">
                      {chartDerivedStats.submitted}
                    </h3>
                    <span className="text-white/60 text-sm mb-1 font-medium">Journalists</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold">
                    {(() => {
                      const total = chartDerivedStats.total;
                      const submitted = chartDerivedStats.submitted;
                      return total > 0 ? Math.round((submitted / total) * 100) : 0;
                    })()}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approved (Entry) */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                <CheckCircle className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative">
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Approved Entry</p>
                <div className="flex items-end justify-between">
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold">
                      {chartDerivedStats.approved}
                    </h3>
                    <span className="text-white/60 text-sm mb-1 font-medium">Journalists</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold">
                    {(() => {
                      const total = chartDerivedStats.total;
                      const approved = chartDerivedStats.approved;
                      return total > 0 ? Math.round((approved / total) * 100) : 0;
                    })()}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending (Entry) */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Clock className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative">
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">In Review</p>
                <div className="flex items-end justify-between">
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold">
                      {chartDerivedStats.pending}
                    </h3>
                    <span className="text-white/60 text-sm mb-1 font-medium">Journalists</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold">
                    {(() => {
                      const total = chartDerivedStats.total;
                      const pending = chartDerivedStats.pending;
                      return total > 0 ? Math.round((pending / total) * 100) : 0;
                    })()}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rejected (Entry) */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-red-500 to-rose-600 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                <XCircle className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative">
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Rejected Entry</p>
                <div className="flex items-end justify-between">
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold">
                      {chartDerivedStats.rejected}
                    </h3>
                    <span className="text-white/60 text-sm mb-1 font-medium">Journalists</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold">
                    {(() => {
                      const total = chartDerivedStats.total;
                      const rejected = chartDerivedStats.rejected;
                      return total > 0 ? Math.round((rejected / total) * 100) : 0;
                    })()}%
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Plane className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative">
                <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">Journalists Entered</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-4xl font-bold">
                    {overview?.totalEntered?.value || 0}
                  </h3>
                  <span className="text-white/60 text-sm mb-1 font-medium">Recorded</span>
                </div>

              </CardContent>
            </Card>

            {/* Total Exited */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-500 to-red-600 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -p-4 opacity-10 group-hover:scale-110 transition-transform">
                <LogOut className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative">
                <p className="text-orange-50 text-sm font-semibold uppercase tracking-wider mb-1">Actual Exits</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-4xl font-bold">
                    {overview?.totalExited?.value || 0}
                  </h3>
                  <span className="text-white/60 text-sm mb-1 font-medium">Recorded</span>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* ROW 1: Application Trends + Stakeholder Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            {/* Application Trends */}
            <Card id="chart-application-trends" className="border-0 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Application Trends</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">Daily submission volume</p>
                </div>
                <p className="text-md text-black font-semibold mt-1">
                  Total: {filterByMonthRange(adminCharts.timeSeries, appTrendRange).reduce((acc, curr) => acc + curr.count, 0)}
                </p>
                <div className="relative group">
                  <select
                    value={appTrendRange}
                    onChange={(e) => setAppTrendRange(e.target.value as 'thisMonth' | 'lastMonth')}
                    className="appearance-none border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs bg-white outline-none font-medium hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-[200px] sm:h-[240px] overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                    <BarChart data={filterByMonthRange(adminCharts.timeSeries, appTrendRange)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#26f765ff" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#26f765ff" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                        tickFormatter={v => new Date(v).toLocaleDateString('en-US', { day: 'numeric' })} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }} />
                      <Bar dataKey="count" fill="url(#colorTrend)" radius={[6, 6, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Stakeholder Performance */}
            <Card id="chart-stakeholder-performance" className="border-0 shadow-sm bg-white overflow-hidden h-full">
              <CardHeader className="pb-3 border-b border-slate-50 flex flex-row items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Stakeholder Performance</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">Avg Processing Time Trend (Current Month)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900 leading-none">{formatMinutes(thisMonthAverage)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Avg Process Time</p>
                </div>
                <div className="relative group">
                  <select
                    value={selectedStakeholder}
                    onChange={(e) => setSelectedStakeholder(e.target.value)}
                    className="appearance-none border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs bg-white outline-none font-medium hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    {performanceData.map((p, i) => (
                      <option key={i} value={p.stakeholder}>{p.stakeholder}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-[200px] sm:h-[240px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={300}>
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
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                        tickFormatter={v => new Date(v).toLocaleDateString('en-US', { day: 'numeric' })} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} tickFormatter={v => formatMinutes(v)} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                        formatter={(v: number | undefined) => [formatMinutes(v || 0), 'Avg Process Time']} />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#colorValue)" dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* New Country Distribution Widget */}
          <CountryDistributionWidget />

          {/* Stakeholder Workload Aggregation (Pie Chart by Review Step Key) */}
          <Card id="chart-stakeholder-breakdown" className="border-0 shadow-sm animate-slide-up bg-white rounded-2xl overflow-hidden" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <CardTitle className="text-lg font-bold text-slate-800">
                    Stakeholder Status Breakdown (Summation by Review Step)
                  </CardTitle>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Consolidated Across Active Events
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Aggregates workflow review steps by organization where step approvers exist across all active forms
                </p>
              </div>

              {/* Controls: Workflow Phase Switcher + Metric Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Workflow Phase Toggle: Entry vs Exit */}
                <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/60 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setStakeholderWorkflowType('ENTRY')}
                    className={cn(
                      "px-3 py-1 rounded-lg transition-all",
                      stakeholderWorkflowType === 'ENTRY' 
                        ? "bg-white text-blue-700 shadow-sm font-bold" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Entry Workflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setStakeholderWorkflowType('EXIT')}
                    className={cn(
                      "px-3 py-1 rounded-lg transition-all",
                      stakeholderWorkflowType === 'EXIT' 
                        ? "bg-white text-orange-700 shadow-sm font-bold" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Exit Workflow
                  </button>
                </div>

                {/* Metric Toggle: Pending vs Total vs Approved */}
                <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/60 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setStakeholderMetricType('pending')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all",
                      stakeholderMetricType === 'pending'
                        ? "bg-amber-500 text-white shadow-sm font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setStakeholderMetricType('total')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all",
                      stakeholderMetricType === 'total'
                        ? "bg-slate-900 text-white shadow-sm font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setStakeholderMetricType('approved')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all",
                      stakeholderMetricType === 'approved'
                        ? "bg-emerald-600 text-white shadow-sm font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Approved
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {stakeholderPieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <CheckCircle className="h-10 w-10 text-emerald-500 mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700">No {stakeholderMetricType} applications</p>
                  <p className="text-xs text-slate-400 mt-1">There are currently no {stakeholderMetricType} applications for this workflow phase.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Donut Pie Chart */}
                  <div className="lg:col-span-6 flex flex-col items-center justify-center">
                    <div className="h-[300px] sm:h-[340px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stakeholderPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={120}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {stakeholderPieData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              borderRadius: '12px',
                              border: '1px solid rgba(226, 232, 240, 0.8)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                              fontSize: '12px'
                            }}
                            formatter={(val: any, name: any, item: any) => {
                              const numVal = Number(val || 0);
                              const percent = totalStakeholderMetricSum > 0 ? Math.round((numVal / totalStakeholderMetricSum) * 100) : 0;
                              return [`${numVal} applications (${percent}%)`, item.payload.name];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center Summary Counter */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-slate-900">{totalStakeholderMetricSum}</span>
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                          {stakeholderMetricType === 'pending' ? 'Pending Total' : stakeholderMetricType === 'approved' ? 'Approved Total' : 'Total Workload'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-2 text-center">
                      {stakeholderPieData.length} unique reviewer stakeholder {stakeholderPieData.length === 1 ? 'group' : 'groups'} across active forms
                    </p>
                  </div>

                  {/* Right: Stakeholder Breakdown List with Accordion */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
                      <span>Stakeholder / Step Key</span>
                      <span>{stakeholderMetricType === 'pending' ? 'Pending Count' : stakeholderMetricType === 'approved' ? 'Approved Count' : 'Workload'}</span>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {stakeholderPieData.map((item) => {
                        const percentage = totalStakeholderMetricSum > 0 ? Math.round((item.value / totalStakeholderMetricSum) * 100) : 0;
                        const isExpanded = selectedStakeholderDetail === item.id;

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedStakeholderDetail(isExpanded ? null : item.id)}
                            className={cn(
                              "p-3 rounded-xl border transition-all cursor-pointer",
                              isExpanded 
                                ? "bg-slate-50 border-slate-300 shadow-sm" 
                                : "bg-white hover:bg-slate-50/70 border-slate-100"
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                                  <p className="text-[11px] text-slate-400 font-medium">
                                    Active in {item.formsCount} {item.formsCount === 1 ? 'form' : 'forms'} • {percentage}% of {stakeholderMetricType}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <span className="text-base font-black text-slate-900">{item.value}</span>
                                  <span className="text-xs text-slate-400 ml-1">apps</span>
                                </div>
                                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isExpanded && "rotate-180")} />
                              </div>
                            </div>

                            {/* Expanded: Per-form breakdown contribution */}
                            {isExpanded && item.formContributions && item.formContributions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 text-xs">
                                <p className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                                  Applications breakdown across forms:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {item.formContributions.map((contrib, cIdx) => (
                                    <div key={cIdx} className="bg-white p-2.5 rounded-lg border border-slate-200/70 flex items-center justify-between gap-2">
                                      <div className="min-w-0 mr-2">
                                        <span className="font-medium text-slate-700 truncate block" title={contrib.formName}>
                                          {contrib.formName}
                                        </span>
                                        {contrib.stepName && (
                                          <span className="text-[10px] text-slate-400 block truncate" title={`Step: ${contrib.stepName}${contrib.role ? ` • Role: ${contrib.role}` : ''}`}>
                                            Step: {contrib.stepName}{contrib.role ? ` • ${contrib.role}` : ''}
                                          </span>
                                        )}
                                      </div>
                                      <span className="font-bold text-slate-900 shrink-0">
                                        {contrib[stakeholderMetricType]} {stakeholderMetricType}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>



          {/* ROW 3: Officer Performance KPIs – full width */}
          {/*<div className="animate-slide-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center justify-between mb-5">
             <div>
                <h2 className="text-2xl font-bold text-slate-800">Officer Performance KPIs</h2>
                <p className="text-sm text-slate-500 mt-1">Processing efficiency and workload distribution</p>
              </div>
            </div>
            <OfficerPerformance data={officerKPIs} isLoading={isOfficerLoading} viewMode="organization" />
          </div>*/}

          {/* ROW 4: Registration by Coverage Type + Media Type */}
          {registrationStats && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 animate-slide-up w-full">

              {/* Coverage Type – Horizontal Bar */}
              <Card
                id="chart-coverage-type"
                className="border-0 shadow-sm flex flex-col"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg">
                    Registration by Coverage Type
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 p-3 sm:p-5">
                  <div className="w-full h-[clamp(260px,35vh,420px)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={registrationStats.coverage}
                        margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#e2e8f0"
                        />

                        <XAxis type="number" hide />

                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          width={window.innerWidth < 640 ? 100 : 140}
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                          }}
                          cursor={{ fill: "#f1f5f9" }}
                        />

                        <Bar
                          dataKey="value"
                          radius={[0, 6, 6, 0]}
                          barSize={window.innerWidth < 640 ? 18 : 28}
                        >
                          {registrationStats.coverage.map((_, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={
                                ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"][
                                i % 5
                                ]
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Media Type */}
              <Card
                id="chart-media-type"
                className="border-0 shadow-sm flex flex-col"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg">
                    Registration by Media Type
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 p-3 sm:p-5 flex flex-col justify-between">

                  {/* Stacked Bar */}
                  <div className="w-full h-[clamp(70px,12vh,120px)] mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={[
                          registrationStats.mediaType.reduce(
                            (acc, item) => ({
                              ...acc,
                              [item.name]: item.value,
                            }),
                            { name: "Total" }
                          ),
                        ]}
                      >
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                          }}
                          cursor={false}
                        />

                        {registrationStats.mediaType.map((entry, i) => (
                          <Bar
                            key={i}
                            dataKey={entry.name}
                            stackId="a"
                            fill={
                              ["#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316"][
                              i % 5
                              ]
                            }
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                    {registrationStats.mediaType.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: [
                                "#3b82f6",
                                "#8b5cf6",
                                "#ec4899",
                                "#f43f5e",
                                "#f97316",
                              ][i % 5],
                            }}
                          />
                          <span className="text-sm font-medium text-slate-700 truncate">
                            {entry.name}
                          </span>
                        </div>

                        <span className="text-base sm:text-lg font-bold text-slate-900">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ROW 5: Journalists Status + Role Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-slide-up" style={{ animationDelay: '0.45s' }}>
            {/* Journalists Status – Donut */}
            <Card id="chart-journalist-status" className="border-0 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle>Journalists Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
                  <div className="space-y-3 sm:space-y-4 w-full sm:min-w-[180px] sm:w-auto">
                    {donutData.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md text-xs">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 w-full sm:min-w-[260px] relative">
                    <ResponsiveContainer width="100%" height={220} className="sm:h-[260px]">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-4xl font-bold text-slate-800">{totalDistribution}</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total Journalists</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card id="chart-role-distribution" className="border-0 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                <div className="h-[300px] sm:h-[360px] overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%" minWidth={350}>
                    <BarChart
                      layout="vertical"
                      data={adminCharts.roleDistribution.map((role, i) => ({
                        name: role.roleName.replace('_', ' '),
                        count: role.count,
                        fill: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
                      }))}
                      margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                      {/* X axis is numeric now */}
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12, fill: '#475569' }}
                        allowDecimals={false}
                      />

                      {/* Y axis holds role names */}
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#475569' }}
                        width={120}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.96)',
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        }}
                      />

                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {adminCharts.roleDistribution.map((_, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Workflow Step Status by Active Event / Form Section */}
          <div className="animate-slide-up space-y-8" style={{ animationDelay: '0.55s' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Workflow Step Status by Active Form</h2>
                  {entryStakeholderStatus?.forms && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {entryStakeholderStatus.forms.length} {entryStakeholderStatus.forms.length === 1 ? 'Active Form' : 'Active Forms'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Per-event workflow review pipeline status and approval metrics across active accreditation forms
                </p>
              </div>
            </div>

            {/* If structured per-form status exists, render dedicated cards per active form */}
            {entryStakeholderStatus?.forms && entryStakeholderStatus.forms.length > 0 ? (
              entryStakeholderStatus.forms.map((formItem) => {
                const exitFormItem = exitStakeholderStatus?.forms?.find(f => f.formId === formItem.formId);
                const entrySteps = Object.entries(formItem.steps || {});
                const exitSteps = Object.entries(exitFormItem?.steps || {});

                return (
                  <Card key={formItem.formId} className="border border-slate-200/80 shadow-md bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                    {/* Form Header Banner */}
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm mt-0.5">
                          <FileTextIcon className="h-6 w-6 text-blue-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-lg font-bold text-white tracking-wide">{formItem.formName}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Active Event
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-white/10 text-slate-300">
                              ID: #{formItem.formId}
                            </span>
                          </div>
                          {formItem.formDescription && (
                            <p className="text-xs text-slate-300 mt-1 line-clamp-1 max-w-2xl">{formItem.formDescription}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                          <Users className="h-5 w-5 text-indigo-300" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Total Form Applications</p>
                            <p className="text-xl font-black text-white">{formItem.totalApplications}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-6">
                      {/* Entry Workflow Steps */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                            <Shield className="h-4 w-4" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Entry Workflow Steps ({entrySteps.length})
                          </h4>
                        </div>

                        {entrySteps.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-3">No entry workflow steps configured for this form.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {entrySteps.map(([stepName, stepData], i) => {
                              const data = [
                                { name: 'Approved', value: stepData.APPROVED, color: '#10b981' },
                                { name: 'Rejected', value: stepData.REJECTED, color: '#ef4444' },
                                { name: 'Pending', value: stepData.PENDING, color: '#f59e0b' },
                              ];
                              const total = stepData.TOTAL || (stepData.APPROVED + stepData.REJECTED + stepData.PENDING);
                              const stepColor = stepData.color || '#3b82f6';

                              return (
                                <div key={i} className="border border-slate-100 rounded-xl bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stepColor }} />
                                      <span className="text-sm font-bold text-slate-800 line-clamp-1">{stepName}</span>
                                    </div>
                                    {stepData.role && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                                        {stepData.role}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="w-[120px] h-[120px] relative shrink-0">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={52} paddingAngle={3} dataKey="value" stroke="none">
                                            {data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
                                          </Pie>
                                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 3px 10px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                        </PieChart>
                                      </ResponsiveContainer>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-base font-bold text-slate-800">
                                          {total > 0 ? Math.round((stepData.APPROVED / total) * 100) : 0}%
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-slate-400">Approved</span>
                                      </div>
                                    </div>

                                    <div className="space-y-1.5 flex-1 min-w-0">
                                      <div className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                          <span className="text-slate-600 font-medium">Approved</span>
                                        </div>
                                        <span className="font-bold text-emerald-700">{stepData.APPROVED}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                                          <span className="text-slate-600 font-medium">Pending</span>
                                        </div>
                                        <span className="font-bold text-amber-700">{stepData.PENDING}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                                          <span className="text-slate-600 font-medium">Rejected</span>
                                        </div>
                                        <span className="font-bold text-rose-700">{stepData.REJECTED}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs pt-1">
                                        <span className="text-slate-400 font-semibold">Total</span>
                                        <span className="font-extrabold text-slate-800">{total}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Exit Workflow Steps (if any exist for this form) */}
                      {exitSteps.length > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                              <LogOut className="h-4 w-4" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                              Exit Workflow Steps ({exitSteps.length})
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {exitSteps.map(([stepName, stepData], i) => {
                              const data = [
                                { name: 'Approved', value: stepData.APPROVED, color: '#10b981' },
                                { name: 'Rejected', value: stepData.REJECTED, color: '#ef4444' },
                                { name: 'Pending', value: stepData.PENDING, color: '#f59e0b' },
                              ];
                              const total = stepData.TOTAL || (stepData.APPROVED + stepData.REJECTED + stepData.PENDING);
                              const stepColor = stepData.color || '#f97316';

                              return (
                                <div key={i} className="border border-slate-100 rounded-xl bg-orange-50/20 p-4 hover:bg-orange-50/40 transition-colors">
                                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stepColor }} />
                                      <span className="text-sm font-bold text-slate-800 line-clamp-1">{stepName}</span>
                                    </div>
                                    {stepData.role && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                                        {stepData.role}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="w-[120px] h-[120px] relative shrink-0">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={52} paddingAngle={3} dataKey="value" stroke="none">
                                            {data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
                                          </Pie>
                                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 3px 10px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                        </PieChart>
                                      </ResponsiveContainer>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-base font-bold text-slate-800">
                                          {total > 0 ? Math.round((stepData.APPROVED / total) * 100) : 0}%
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-slate-400">Approved</span>
                                      </div>
                                    </div>

                                    <div className="space-y-1.5 flex-1 min-w-0">
                                      <div className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                          <span className="text-slate-600 font-medium">Approved</span>
                                        </div>
                                        <span className="font-bold text-emerald-700">{stepData.APPROVED}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                                          <span className="text-slate-600 font-medium">Pending</span>
                                        </div>
                                        <span className="font-bold text-amber-700">{stepData.PENDING}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                                          <span className="text-slate-600 font-medium">Rejected</span>
                                        </div>
                                        <span className="font-bold text-rose-700">{stepData.REJECTED}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs pt-1">
                                        <span className="text-slate-400 font-semibold">Total</span>
                                        <span className="font-extrabold text-slate-800">{total}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              /* Graceful fallback to legacy flat cards if per-form data is loading or empty */
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-700 mb-3">Entry Workflow Steps</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {entryStakeholderStatus && Object.entries(entryStakeholderStatus).filter(([k]) => k !== 'forms').map(([name, status], i) => {
                      const data = [
                        { name: 'Approved', value: status.APPROVED, color: '#10b981' },
                        { name: 'Rejected', value: status.REJECTED, color: '#ef4444' },
                        { name: 'Pending', value: status.PENDING, color: '#f59e0b' },
                      ];
                      const total = status.APPROVED + status.REJECTED + status.PENDING;

                      return (
                        <Card key={i} className="border-0 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2 border-b border-slate-50 flex flex-row items-center justify-between">
                            <CardTitle className="text-base border-l-4 pl-3" style={{ borderColor: '#3b82f6' }}>{name}</CardTitle>
                            <span className="text-xs font-bold text-slate-400">Total: {total}</span>
                          </CardHeader>
                          <CardContent className="p-5 flex items-center gap-5">
                            <div className="flex-1 h-[160px] relative">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                                    {data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
                                  </Pie>
                                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-xl font-bold text-slate-800">
                                  {total > 0 ? Math.round((status.APPROVED / total) * 100) : 0}%
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2.5 min-w-[110px]">
                              {data.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 text-xs">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-slate-600 font-medium">{item.name}</span>
                                  <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-700 mb-3">Exit Workflow Steps</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {exitStakeholderStatus && Object.entries(exitStakeholderStatus).filter(([k]) => k !== 'forms').map(([name, status], i) => {
                      const data = [
                        { name: 'Approved', value: status.APPROVED, color: '#10b981' },
                        { name: 'Rejected', value: status.REJECTED, color: '#ef4444' },
                        { name: 'Pending', value: status.PENDING, color: '#f59e0b' },
                      ];
                      const total = status.APPROVED + status.REJECTED + status.PENDING;

                      return (
                        <Card key={i} className="border-0 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2 border-b border-slate-50 flex flex-row items-center justify-between">
                            <CardTitle className="text-base border-l-4 pl-3" style={{ borderColor: '#f97316' }}>{name}</CardTitle>
                            <span className="text-xs font-bold text-slate-400">Total: {total}</span>
                          </CardHeader>
                          <CardContent className="p-5 flex items-center gap-5">
                            <div className="flex-1 h-[160px] relative">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                                    {data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
                                  </Pie>
                                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-xl font-bold text-slate-800">
                                  {total > 0 ? Math.round((status.APPROVED / total) * 100) : 0}%
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2.5 min-w-[110px]">
                              {data.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 text-xs">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-slate-600 font-medium">{item.name}</span>
                                  <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
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
          </div>

          {/* Recent Applications */}
          <div className="animate-slide-up" style={{ animationDelay: '0.65s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Recent Applications Feed</h2>
              <Button variant="link" className="text-blue-600 font-bold" onClick={() => window.location.href = '/dashboard/journalists'}>
                View All →
              </Button>
            </div>
            <Card className="border-0 shadow-sm overflow-hidden bg-white">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead className="bg-slate-50/70">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Journalist</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentApplications.map((app: any) => (
                      <tr key={app.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {(() => {
                              const firstName = app.formData?.first_name || '';
                              const lastName = app.formData?.last_name || '';
                              const applicantName = `${firstName} ${lastName}`.trim() || app.user?.fullName || '—';
                              const initials = applicantName.charAt(0).toUpperCase();

                              return (
                                <>
                                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-700 font-semibold text-sm shadow-sm">
                                    {initials}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">{applicantName}</p>
                                    <p className="text-xs text-slate-500">{app.formData?.country || app.user?.country || '—'}</p>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {app.formData?.organization_name || 'Individual'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                            app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            <div className={`h-2 w-2 rounded-full ${app.status === 'APPROVED' ? 'bg-emerald-500' :
                              app.status === 'REJECTED' ? 'bg-red-500' :
                                'bg-amber-500'
                              }`} />
                            {app.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            onClick={() => window.location.href = `/dashboard/journalists/${app.id}`}>
                            <Eye className="h-4.5 w-4.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {recentApplications.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-slate-400">
                          No recent applications to show
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="text-center text-sm text-slate-400 py-10 border-t border-slate-100 mt-8">
            © 2025 Official Ethiopia Media Authority Portal. All rights reserved.
          </div>

        </div>
      </main >
    </div >
  );
}
