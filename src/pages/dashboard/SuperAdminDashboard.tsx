'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle, Clock, XCircle, ChevronDown,
  Filter, Building2, Volume2, Plane, Shield, TrendingUp, Factory,
  Package, LayoutDashboard, Eye, CalendarDays, Calendar,
  Download as DownloadIcon, FileText as FileTextIcon,
  Plus, Minus, LogOut
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import en from 'react-phone-number-input/locale/en';
import {
  useGetDashboardFormsQuery,
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

  const { data: stakeholderStatus, isLoading: isStatusLoading } = useGetSuperAdminStakeholderStatusQuery();
  const { data: performanceData = [], isLoading: isPerformanceLoading } = useGetSuperAdminPerformanceQuery();
  const { data: entryExitStats, isLoading: isEntryExitLoading } = useGetSuperAdminEntryExitStatsQuery({ timeframe: 'month' });
  const { data: officerKPIs, isLoading: isOfficerLoading } = useGetSuperAdminOfficerPerformanceQuery({ timeframe: 'month' });
  const { data: registrationStats } = useGetRegistrationStatsQuery();

  const [selectedStakeholder, setSelectedStakeholder] = useState<string>("");
  const [appTrendRange, setAppTrendRange] = useState<'thisMonth' | 'lastMonth'>('thisMonth');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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

  const countryDataMap = React.useMemo(() => {
    if (!dashboardData?.countries) return new Map();

    // Map 2-letter codes to 3-letter codes for the GeoJSON compatibility
    const iso2to3: Record<string, string> = {
      'AF': 'AFG', 'AX': 'ALA', 'AL': 'ALB', 'DZ': 'DZA', 'AS': 'ASM', 'AD': 'AND', 'AO': 'AGO', 'AI': 'AIA', 'AQ': 'ATA', 'AG': 'ATG',
      'AR': 'ARG', 'AM': 'ARM', 'AW': 'ABW', 'AU': 'AUS', 'AT': 'AUT', 'AZ': 'AZE', 'BS': 'BHS', 'BH': 'BHR', 'BD': 'BGD', 'BB': 'BRB',
      'BY': 'BLR', 'BE': 'BEL', 'BZ': 'BLZ', 'BJ': 'BEN', 'BM': 'BMU', 'BT': 'BTN', 'BO': 'BOL', 'BQ': 'BES', 'BA': 'BIH', 'BW': 'BWA',
      'BV': 'BVT', 'BR': 'BRA', 'IO': 'IOT', 'BN': 'BRN', 'BG': 'BGR', 'BF': 'BFA', 'BI': 'BDI', 'CV': 'CPV', 'KH': 'KHM', 'CM': 'CMR',
      'CA': 'CAN', 'KY': 'CYM', 'CF': 'CAF', 'TD': 'TCD', 'CL': 'CHL', 'CN': 'CHN', 'CX': 'CXR', 'CC': 'CCK', 'CO': 'COL', 'KM': 'COM',
      'CD': 'COD', 'CG': 'COG', 'CK': 'COK', 'CR': 'CRI', 'CI': 'CIV', 'HR': 'HRV', 'CU': 'CUB', 'CW': 'CUW', 'CY': 'CYP', 'CZ': 'CZE',
      'DK': 'DNK', 'DJ': 'DJI', 'DM': 'DMA', 'DO': 'DOM', 'EC': 'ECU', 'EG': 'EGY', 'SV': 'SLV', 'GQ': 'GNQ', 'ER': 'ERI', 'EE': 'EST',
      'SZ': 'SWZ', 'ET': 'ETH', 'FK': 'FLK', 'FO': 'FRO', 'FJ': 'FJI', 'FI': 'FIN', 'FR': 'FRA', 'GF': 'GUF', 'PF': 'PYF', 'TF': 'ATF',
      'GA': 'GAB', 'GM': 'GMB', 'GE': 'GEO', 'DE': 'DEU', 'GH': 'GHA', 'GI': 'GIB', 'GR': 'GRC', 'GL': 'GRL', 'GD': 'GRD', 'GP': 'GLP',
      'GU': 'GUM', 'GT': 'GTM', 'GG': 'GGY', 'GN': 'GIN', 'GW': 'GNB', 'GY': 'GUY', 'HT': 'HTI', 'HM': 'HMD', 'VA': 'VAT', 'HN': 'HND',
      'HK': 'HKG', 'HU': 'HUN', 'IS': 'ISL', 'IN': 'IND', 'ID': 'IDN', 'IR': 'IRN', 'IQ': 'IRQ', 'IE': 'IRL', 'IM': 'IMN', 'IL': 'ISR',
      'IT': 'ITA', 'JM': 'JAM', 'JP': 'JPN', 'JE': 'JEY', 'JO': 'JOR', 'KZ': 'KAZ', 'KE': 'KEN', 'KI': 'KIR', 'KP': 'PRK', 'KR': 'KOR',
      'KW': 'KWT', 'KG': 'KGZ', 'LA': 'LAO', 'LV': 'LVA', 'LB': 'LBN', 'LS': 'LSO', 'LR': 'LBR', 'LY': 'LBY', 'LI': 'LIE', 'LT': 'LTU',
      'LU': 'LUX', 'MO': 'MAC', 'MG': 'MDG', 'MW': 'MWI', 'MY': 'MYS', 'MV': 'MDV', 'ML': 'MLI', 'MT': 'MLT', 'MH': 'MHL', 'MQ': 'MTQ',
      'MR': 'MRT', 'MU': 'MUS', 'YT': 'MYT', 'MX': 'MEX', 'FM': 'FSM', 'MD': 'MDA', 'MC': 'MCO', 'MN': 'MNG', 'ME': 'MNE', 'MS': 'MSR',
      'MA': 'MAR', 'MZ': 'MOZ', 'MM': 'MMR', 'NA': 'NAM', 'NR': 'NRU', 'NP': 'NPL', 'NL': 'NLD', 'NC': 'NCL', 'NZ': 'NZL', 'NI': 'NIC',
      'NE': 'NER', 'NG': 'NGA', 'NU': 'NIU', 'NF': 'NFK', 'MP': 'MNP', 'NO': 'NOR', 'OM': 'OMN', 'PK': 'PAK', 'PW': 'PLW', 'PS': 'PSE',
      'PA': 'PAN', 'PG': 'PNG', 'PY': 'PRY', 'PE': 'PER', 'PH': 'PHL', 'PN': 'PCN', 'PL': 'POL', 'PT': 'PRT', 'PR': 'PRI', 'QA': 'QAT',
      'RE': 'REU', 'RO': 'ROU', 'RU': 'RUS', 'RW': 'RWA', 'BL': 'BLM', 'SH': 'SHN', 'KN': 'KNA', 'LC': 'LCA', 'MF': 'MAF', 'PM': 'SPM',
      'VC': 'VCT', 'WS': 'WSM', 'SM': 'SMR', 'ST': 'STP', 'SA': 'SAU', 'SN': 'SEN', 'RS': 'SRB', 'SC': 'SYC', 'SL': 'SLE', 'SG': 'SGP',
      'SX': 'SXM', 'SK': 'SVK', 'SI': 'SVN', 'SB': 'SLB', 'SO': 'SOM', 'ZA': 'ZAF', 'GS': 'SGS', 'SS': 'SSD', 'ES': 'ESP', 'LK': 'LKA',
      'SD': 'SDN', 'SR': 'SUR', 'SJ': 'SJM', 'SE': 'SWE', 'CH': 'CHE', 'SY': 'SYR', 'TW': 'TWN', 'TJ': 'TJK', 'TZ': 'TZA', 'TH': 'THA',
      'TL': 'TLS', 'TG': 'TGO', 'TK': 'TKL', 'TO': 'TON', 'TT': 'TTO', 'TN': 'TUN', 'TR': 'TUR', 'TM': 'TKM', 'TC': 'TCA', 'TV': 'TUV',
      'UG': 'UGA', 'UA': 'UKR', 'AE': 'ARE', 'GB': 'GBR', 'UM': 'UMI', 'US': 'USA', 'UY': 'URY', 'UZ': 'UZB', 'VU': 'VUT', 'VE': 'VEN',
      'VN': 'VNM', 'VG': 'VGB', 'VI': 'VIR', 'WF': 'WLF', 'EH': 'ESH', 'YE': 'YEM', 'ZM': 'ZMB', 'ZW': 'ZWE'
    };

    // Filter out Ethiopia (ETH) from the map
    return new Map(dashboardData.countries
      .filter(c => c.code?.toUpperCase() !== 'ETH')
      .map(c => {
        const upperCode = (c.code || '').toUpperCase().trim();
        const code = upperCode.length === 2 ? iso2to3[upperCode] || upperCode : upperCode;
        return [code, c];
      }));
  }, [dashboardData?.countries]);

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

  const isLoading = isDashboardLoading || isOverviewLoading || isChartsLoading || isStatusLoading || isPerformanceLoading || isEntryExitLoading;
  const isError = isDashboardError || !dashboardData || !overview || !adminCharts || !stakeholderStatus || !performanceData || !entryExitStats;

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

  const getCountryName = (code: string) => {
    if (!code) return 'Unknown';
    const upper = code.toUpperCase().trim();

    // ISO-2 to Name mapping (from react-phone-number-input)
    const iso2Name = en[upper as keyof typeof en];
    if (iso2Name) return iso2Name;

    // ISO-3 fallback (a few common ones if needed, but backend usually provides full name now)
    const iso3Map: Record<string, string> = {
      'ETH': 'Ethiopia',
      'USA': 'United States',
      'GBR': 'United Kingdom',
      'CAN': 'Canada',
      'FRA': 'France'
    };

    return iso3Map[upper] || code;
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

          {/* Export + Form Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mb-4">
            <div className="relative group">
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 bg-white w-full sm:min-w-[280px] sm:w-auto hover:border-blue-400 transition-colors">
                <CalendarDays className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <select
                  value={selectedForm}
                  onChange={(e) => setSelectedForm(e.target.value)}
                  className="appearance-none border-0 outline-none text-sm flex-1 bg-transparent text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">All Events</option>
                  {forms.map((form) => (
                    <option key={form.id} value={form.name}>{form.name}</option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 flex-1 sm:flex-initial justify-center">
              <DownloadIcon className="h-4 w-4" /> <span className="hidden sm:inline">Export</span> CSV
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="gap-2 text-white flex-1 sm:flex-initial sm:min-w-[120px] justify-center"
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
                {/* {overview?.totalEntered?.trend && (
                  <div className={cn("absolute bottom-6 right-6 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/10")}>
                    {overview.totalEntered.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                    {overview.totalEntered.percentage}%
                  </div>
                )} */}
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
                {/* {overview?.totalExited?.trend && (
                  <div className={cn("absolute bottom-6 right-6 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/10")}>
                    {overview.totalExited.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                    {overview.totalExited.percentage}%
                  </div>
                )} */}
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
          {/* ROW 2: Geographic Distribution – full width, taller */}
          <Card id="chart-geographic-dist" className="border-0 shadow-sm animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-50">
              <CardTitle>Geographic Distribution</CardTitle>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                <Button variant="ghost" size="icon" className="h-7 w-7 bg-white shadow-sm hover:bg-slate-50 text-blue-600 border border-slate-200" onClick={handleZoomIn}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 bg-white shadow-sm hover:bg-slate-50 text-blue-600 border border-slate-200" onClick={handleZoomOut}>
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                <div className="h-[300px] sm:h-[400px] lg:h-[480px] lg:flex-1 relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                  <ComposableMap
                    projection="geoMercator"
                    style={{ width: "100%", height: "100%" }}
                  >
                    <ZoomableGroup
                      zoom={zoom}
                      center={[20, 0]}
                      onMoveEnd={({ zoom }) => setZoom(zoom)}
                    >
                      <Geographies geography={GEO_URL}>
                        {({ geographies }) => geographies.map((geo) => {
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
                              style={{ default: { outline: "none" }, hover: { fill: "#94a3b8", outline: "none" }, pressed: { outline: "none" } }}
                            />
                          );
                        })}
                      </Geographies>
                    </ZoomableGroup>
                  </ComposableMap>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md shadow-lg border border-slate-100 rounded-xl px-4 py-2.5">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Selected</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5 max-w-[200px] truncate">{hoveredCountry || "Hover a country"}</div>
                  </div>
                </div>

                <div className="lg:w-80 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top Nationalities</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">Top 10</div>
                  </div>
                  <div className="space-y-3 sm:space-y-4 h-[250px] sm:h-[350px] lg:h-[420px] pr-2 overflow-y-auto custom-scrollbar">
                    {dashboardData.countries.filter(c => c.code?.toUpperCase() !== 'ETH').slice(0, 10).map((country, idx) => {
                      const maxCount = Math.max(...dashboardData.countries.filter(c => c.code?.toUpperCase() !== 'ETH').slice(0, 10).map(c => c.count), 1);
                      const percentage = (country.count / maxCount) * 100;
                      return (
                        <div key={idx} className="group relative">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                {idx + 1}
                              </span>
                              <span className="text-sm font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                                {country.name}
                              </span>
                              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400 uppercase tracking-tight">
                                {country.code}
                              </span>
                            </div>
                            <span className="text-sm font-black text-slate-900">{country.count}</span>
                          </div>
                          <Progress
                            value={percentage}
                            className="h-1.5 bg-slate-100"
                            indicatorClassName={cn(
                              "transition-all duration-1000",
                              idx === 0 ? "bg-blue-600" :
                                idx === 1 ? "bg-indigo-500" :
                                  idx === 2 ? "bg-violet-500" : "bg-slate-300 group-hover:bg-blue-400"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stakeholder Status Breakdown (Entry) */}
          <Card id="chart-stakeholder-breakdown" className="border-0 shadow-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle>Stakeholder Status Breakdown (Entry Workflow)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] overflow-x-auto">
                <ResponsiveContainer width="100%" height="100%" minWidth={400}>
                  <BarChart
                    layout="vertical"
                    data={Object.entries(stakeholderStatus || {}).map(([name, stats]: any) => ({ name, ...stats }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={150}
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                      interval={0}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="APPROVED" name="Approved" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                    <Bar dataKey="PENDING" name="Pending" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={20} />
                    <Bar dataKey="REJECTED" name="Rejected" stackId="a" fill="#ef4444" radius={[4, 0, 0, 4]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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

          {/* Stakeholder Status Breakdown */}
          <div className="animate-slide-up" style={{ animationDelay: '0.55s' }}>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Stakeholder Status Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Object.entries(stakeholderStatus).map(([name, status], i) => {
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
      </main>
    </div>
  );
}
