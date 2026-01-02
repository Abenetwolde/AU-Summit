'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle, Clock, XCircle, Calendar, ChevronDown,
  Filter, Building2, Volume2, Plane, Shield, TrendingUp, Factory,
  FileText, Package, Download, CalendarDays, LayoutDashboard, Eye
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  useGetDashboardFormsQuery,
  useGetDashboardDataQuery,
  useGetUsersQuery,
  useGetOrganizationsQuery,
  useGetApplicationsQuery
} from '@/store/services/api';

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
  const { data: forms = [] } = useGetDashboardFormsQuery();
  const { data: dashboardData, isLoading: isDashboardLoading, isError: isDashboardError } = useGetDashboardDataQuery({
    formName: selectedForm === 'all' ? undefined : selectedForm
  });

  // Additional System Data
  const { data: users = [] } = useGetUsersQuery();
  const { data: organizations = [] } = useGetOrganizationsQuery();
  const { data: appsData } = useGetApplicationsQuery({ page: 1, limit: 10 });
  const recentApplications = appsData?.applications || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLoading = isDashboardLoading;
  const isError = isDashboardError || !dashboardData;

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

  const donutData = [
    { name: 'Rejected', value: dashboardData.journalistStatus.rejected.percentage, color: dashboardData.journalistStatus.rejected.color },
    { name: 'Approved', value: dashboardData.journalistStatus.approved.percentage, color: dashboardData.journalistStatus.approved.color },
    { name: 'Pending', value: dashboardData.journalistStatus.pending.percentage, color: dashboardData.journalistStatus.pending.color },
  ];

  const orgTotal = dashboardData.mediaOrganizationType.reduce((sum, org) => sum + org.count, 0);

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

  // Export to CSV function
  const exportToCSV = () => {
    if (!dashboardData) return;
    const csvData: string[] = [];
    const formName = dashboardData.form?.name || 'All Forms';

    // Header
    csvData.push('Dashboard Report - Media Accreditation Portal');
    csvData.push(`Generated: ${new Date().toLocaleString()}`);
    csvData.push(`Form Filter: ${formName}`);
    csvData.push('');

    // Key Metrics
    csvData.push('KEY METRICS');
    csvData.push('Metric,Value');
    csvData.push(`Total Registered Journalists,${dashboardData.keyMetrics.totalRegistered.value}`);
    csvData.push(`Fully Accredited,${dashboardData.keyMetrics.fullyAccredited.value} (${dashboardData.keyMetrics.fullyAccredited.progress}%)`);
    csvData.push(`Pending Approval,${dashboardData.keyMetrics.pendingApproval.value}`);
    csvData.push(`Total Rejected,${dashboardData.keyMetrics.totalRejected.value} (${dashboardData.keyMetrics.totalRejected.percentage}%)`);
    csvData.push('');

    // Journalist Status
    csvData.push('JOURNALIST STATUS');
    csvData.push('Status,Count,Percentage');
    csvData.push(`Approved,${dashboardData.journalistStatus.approved.value},${dashboardData.journalistStatus.approved.percentage}%`);
    csvData.push(`Rejected,${dashboardData.journalistStatus.rejected.value},${dashboardData.journalistStatus.rejected.percentage}%`);
    csvData.push(`Pending,${dashboardData.journalistStatus.pending.value},${dashboardData.journalistStatus.pending.percentage}%`);
    csvData.push('');

    // Organization Types
    csvData.push('MEDIA ORGANIZATION TYPES');
    csvData.push('Organization Type,Count');
    dashboardData.mediaOrganizationType.forEach(org => {
      csvData.push(`${org.name},${org.count}`);
    });
    csvData.push('');

    // Countries
    csvData.push('GEOGRAPHIC DISTRIBUTION');
    csvData.push('Country,Count,Code');
    dashboardData.countries.forEach(country => {
      csvData.push(`${country.name},${country.count},${country.code}`);
    });
    csvData.push('');

    // Authority Decisions
    csvData.push('DECISIONS & APPROVALS BY AUTHORITY');
    csvData.push('Authority,Approved,Rejected,Visa Granted,Visa Denied,Entry Allowed,Entry Denied');
    dashboardData.decisionsAndApprovals.forEach(auth => {
      const approved = auth.approved || '';
      const rejected = auth.rejected || '';
      const visaGranted = auth.visaGranted || '';
      const visaDenied = auth.visaDenied || '';
      const allowedEntry = auth.allowedEntry || '';
      const deniedEntry = auth.deniedEntry || '';
      csvData.push(`${auth.authority},${approved},${rejected},${visaGranted},${visaDenied},${allowedEntry},${deniedEntry}`);
    });
    csvData.push('');

    // Journalist Entries
    csvData.push('JOURNALIST ENTRY TRENDS');
    csvData.push('Date,Day,Total Entries,Foreign Entries');
    dashboardData.journalistsEntered.forEach(entry => {
      csvData.push(`${entry.date},${entry.day},${entry.total},${entry.foreign}`);
    });

    // Create and download CSV
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const formSlug = formName.replace(/\s+/g, '-').toLowerCase();
    link.setAttribute('download', `dashboard-report-${formSlug}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF function
  const exportToPDF = () => {
    if (!dashboardData) return;
    const doc = new jsPDF();
    let yPos = 20;
    const formName = dashboardData.form?.name || 'All Forms';

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Dashboard Report - Media Accreditation Portal', 14, yPos);
    yPos += 10;

    // Date and Form Filter
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Form Filter: ${formName}`, 14, yPos);
    yPos += 15;

    // Key Metrics Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Metrics', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Total Registered Journalists', dashboardData.keyMetrics.totalRegistered.value.toString()],
        ['Fully Accredited', `${dashboardData.keyMetrics.fullyAccredited.value} (${dashboardData.keyMetrics.fullyAccredited.progress}%)`],
        ['Pending Approval', dashboardData.keyMetrics.pendingApproval.value.toString()],
        ['Total Rejected', `${dashboardData.keyMetrics.totalRejected.value} (${dashboardData.keyMetrics.totalRejected.percentage}%)`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Journalist Status Table
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Journalist Status Distribution', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Status', 'Count', 'Percentage']],
      body: [
        ['Approved', dashboardData.journalistStatus.approved.value.toString(), `${dashboardData.journalistStatus.approved.percentage}%`],
        ['Rejected', dashboardData.journalistStatus.rejected.value.toString(), `${dashboardData.journalistStatus.rejected.percentage}%`],
        ['Pending', dashboardData.journalistStatus.pending.value.toString(), `${dashboardData.journalistStatus.pending.percentage}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Organization Types Table
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Media Organization Types', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Organization Type', 'Count']],
      body: dashboardData.mediaOrganizationType.map(org => [org.name, org.count.toString()]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Countries Table
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Geographic Distribution', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Country', 'Count', 'Code']],
      body: dashboardData.countries.map(country => [country.name, country.count.toString(), country.code]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Authority Decisions Table
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Decisions & Approvals by Authority', 14, yPos);
    yPos += 8;

    const decisionsBody = dashboardData.decisionsAndApprovals.map(auth => [
      auth.authority,
      auth.approved?.toString() || '-',
      auth.rejected?.toString() || '-',
      auth.visaGranted?.toString() || '-',
      auth.visaDenied?.toString() || '-',
      auth.allowedEntry?.toString() || '-',
      auth.deniedEntry?.toString() || '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Authority', 'Approved', 'Rejected', 'Visa Granted', 'Visa Denied', 'Entry Allowed', 'Entry Denied']],
      body: decisionsBody,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Journalist Entries Table
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Journalist Entry Trends', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Day', 'Total Entries', 'Foreign Entries']],
      body: dashboardData.journalistsEntered.map(entry => [
        entry.date,
        entry.day,
        entry.total.toString(),
        entry.foreign.toString(),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Save PDF
    const formSlug = formName.replace(/\s+/g, '-').toLowerCase();
    doc.save(`dashboard-report-${formSlug}-${new Date().toISOString().split('T')[0]}.pdf`);
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
                  <h3 className="text-4xl font-bold">{users.length}</h3>
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
              onClick={exportToCSV}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={exportToPDF}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>

          {/* Filters Section */}
          <Card className="border-0 shadow-sm glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap justify-between">
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
                    {dashboardData.filterOptions.organizations.map((org, i) => (
                      <option key={i} value={org}>{org}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                </div>

                <div className="relative group">
                  <select className="appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white outline-none min-w-[220px] text-slate-700 font-medium hover:border-blue-400 transition-colors cursor-pointer">
                    <option>All Countries</option>
                    {dashboardData.filterOptions.countries.map((country, i) => (
                      <option key={i} value={country}>{country}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                </div>

                <div className="relative group">
                  <select className="appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white outline-none min-w-[200px] text-slate-700 font-medium hover:border-blue-400 transition-colors cursor-pointer">
                    <option>All status</option>
                    {dashboardData.filterOptions.statuses.map((status, i) => (
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
          </Card>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {/* Total Registered Journalists */}
            <Card className="border-0 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm relative">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Total Registered</p>
                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{dashboardData.keyMetrics.totalRegistered.value}</h3>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-lg w-fit">
                  <TrendingUp className="h-4 w-4" />
                  <span>Rising Activity</span>
                </div>
              </CardContent>
            </Card>

            {/* Fully Accredited */}
            <Card className="border-0 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Fully Accredited</p>
                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{dashboardData.keyMetrics.fullyAccredited.value}</h3>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-emerald-700">Completion Rate</span>
                    <span className="text-emerald-700">{dashboardData.keyMetrics.fullyAccredited.progress}%</span>
                  </div>
                  <Progress value={dashboardData.keyMetrics.fullyAccredited.progress} className="h-2.5 bg-emerald-100" indicatorClassName="bg-emerald-500" />
                </div>
              </CardContent>
            </Card>

            {/* Pending Approval */}
            <Card className="border-0 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Pending Approval</p>
                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{String(dashboardData.keyMetrics.pendingApproval.value).padStart(2, '0')}</h3>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-lg w-fit">
                  <span>Needs Review</span>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                </div>
              </CardContent>
            </Card>

            {/* Total Rejected */}
            <Card className="border-0 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Total Rejected</p>
                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{String(dashboardData.keyMetrics.totalRejected.value).padStart(2, '0')}</h3>
                  </div>
                  <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                    <XCircle className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-lg w-fit">
                  {dashboardData.keyMetrics.totalRejected.percentage}% of applications
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Second Row: Journalist Status, Media Organization Type, and Countries */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {/* Journalist Status - Donut Chart */}
            <Card className="border-0 shadow-sm xl:col-span-2">
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
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{item.value}%</span>
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
                          outerRadius={90}
                          paddingAngle={5}
                          cornerRadius={5}
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
                      <span className="text-3xl font-bold text-slate-800">{orgTotal}</span>
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Journalists</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Organization Type */}
            <Card className="border-0 shadow-sm xl:col-span-1">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle>Organization Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {dashboardData.mediaOrganizationType.map((org, i) => {
                  const percentage = (org.count / orgTotal) * 100;
                  let indicatorColor = 'bg-slate-300';
                  if (org.color === '#3b82f6') indicatorColor = 'bg-blue-500';
                  else if (org.color === '#8b5cf6') indicatorColor = 'bg-purple-500';
                  else if (org.color === '#f97316') indicatorColor = 'bg-orange-500';
                  else if (org.color === '#000000') indicatorColor = 'bg-slate-800';

                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-700">{org.name}</span>
                        <span className="font-bold text-slate-900">{String(org.count).padStart(2, '0')}</span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2"
                        indicatorClassName={indicatorColor}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Lists of Country */}
            <Card className="border-0 shadow-sm xl:col-span-2">
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
                  <div className="h-[220px] relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-1 shadow-inner">
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
          </div>

          {/* Decisions and Approvals Section */}
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Decisions & Approvals</h2>
            </div>

            <div className="space-y-6">
              {/* First Row: Ethiopian Media Authority, Immigration, Border Security */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardData.decisionsAndApprovals.filter(d =>
                  d.authority === "Ethiopian Media Authority" ||
                  d.authority === "Immigration and Citizenship Services" ||
                  d.authority === "Border Security Officer"
                ).map((decision, i) => {
                  const IconComponent = getIcon(decision.icon);
                  return (
                    <Card key={i} className="relative overflow-hidden border-0 bg-white shadow-sm hover:shadow-md transition-all duration-300 group rounded-xl ring-1 ring-slate-100">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: decision.color }} />
                      <CardContent className="p-5 pl-7">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-slate-800 text-lg leading-tight pr-4">{decision.authority}</h3>
                          <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                            <IconComponent className="h-5 w-5" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {decision.approved !== undefined ? (
                            <>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved</p>
                                <p className="text-xl font-bold text-slate-900">{decision.approved}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rejected</p>
                                <p className="text-xl font-bold text-slate-900">{decision.rejected}</p>
                              </div>
                            </>
                          ) : decision.visaGranted !== undefined ? (
                            <>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visa Granted</p>
                                <p className="text-xl font-bold text-slate-900">{decision.visaGranted}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visa Denied</p>
                                <p className="text-xl font-bold text-slate-900">{String(decision.visaDenied).padStart(2, '0')}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entry Allowed</p>
                                <p className="text-xl font-bold text-slate-900">{decision.allowedEntry}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entry Denied</p>
                                <p className="text-xl font-bold text-slate-900">{String(decision.deniedEntry).padStart(2, '0')}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Second Row: Customs, Chart, and INSA below Customs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Customs and INSA stacked */}
                <div className="space-y-6">
                  {/* Customs Card */}
                  {dashboardData.decisionsAndApprovals.filter(d => d.authority === "Customs").map((decision, i) => {
                    const IconComponent = getIcon(decision.icon);
                    return (
                      <Card key={i} className="border border-slate-100 shadow-none hover:border-slate-300 transition-all duration-300 bg-white">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4 h-full">
                            <div className="p-3.5 rounded-xl flex-shrink-0" style={{ backgroundColor: `${decision.color}15`, color: decision.color }}>
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <p className="font-bold text-base text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">{decision.authority}</p>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900">
                                  <span className="text-xs font-semibold">Approved</span>
                                  <span className="text-sm font-bold">{decision.approved}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 text-red-900">
                                  <span className="text-xs font-semibold">Rejected</span>
                                  <span className="text-sm font-bold">{decision.rejected}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* INSA Card below Customs */}
                  {dashboardData.decisionsAndApprovals.filter(d => d.authority === "INSA").map((decision, i) => {
                    const IconComponent = getIcon(decision.icon);
                    return (
                      <Card key={i} className="border border-slate-100 shadow-none hover:border-slate-300 transition-all duration-300 bg-white">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4 h-full">
                            <div className="p-3.5 rounded-xl flex-shrink-0" style={{ backgroundColor: `${decision.color}15`, color: decision.color }}>
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <p className="font-bold text-base text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">{decision.authority}</p>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900">
                                  <span className="text-xs font-semibold">Approved</span>
                                  <span className="text-sm font-bold">{decision.approved}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 text-red-900">
                                  <span className="text-xs font-semibold">Rejected</span>
                                  <span className="text-sm font-bold">{decision.rejected}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Right Side - Total Journalists Entered Chart */}
                <div className="lg:col-span-2">
                  <Card className="border-0 shadow-sm bg-white h-full hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3 border-b border-slate-50 flex flex-row justify-between items-center">
                      <CardTitle>Journalist Entry Trends</CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8">Weekly</Button>
                        <Button size="sm" variant="ghost" className="h-8">Monthly</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dashboardData.journalistsEntered} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
                              dy={10}
                              tickFormatter={(value: string) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                              }}
                            />
                            <YAxis
                              yAxisId="left"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
                              domain={[0, 'auto']}
                              label={{ value: 'Journalists', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                              yAxisId="left"
                              type="monotone"
                              dataKey="total"
                              name="Total Entered"
                              stroke="#3b82f6"
                              strokeWidth={4}
                              fill="url(#colorPrimary)"
                            />
                            <Legend iconType="circle" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
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
                    {recentApplications.map((app) => (
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
            � 2025 Official Ethiopia Media Authority Portal. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
}
