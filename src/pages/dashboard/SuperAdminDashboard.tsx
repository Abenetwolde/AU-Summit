'use client';

import React, { useState, useEffect } from 'react';
import {
    Users, CheckCircle, Clock, XCircle, Calendar, ChevronDown,
    Filter, Building2, Volume2, Plane, Shield, TrendingUp, Factory,
    FileText, Package, Download, CalendarDays
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILITY ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- FORMS DATA ---
const forms = [
    { id: "all", name: "All Forms" },
    { id: "journalist-accreditation", name: "Journalist Accreditation Form" },
    { id: "media-organization", name: "Media Organization Registration" },
    { id: "press-pass", name: "Press Pass Application" },
    { id: "equipment-clearance", name: "Equipment Clearance Form" },
    { id: "visa-application", name: "Visa Application Form" },
    { id: "special-access", name: "Special Access Request" },
];

// --- DATA ---
const dashboardData = {
    filters: {
        date: "MM/DD/YYYY",
        organization: "All organization",
        journalistCountry: "All Country",
        status: "All status",
        formName: "All Forms"
    },
    keyMetrics: {
        totalRegistered: { value: 115, label: "Total Registered Journalists", trend: "up" },
        fullyAccredited: { value: 102, label: "Fully Accredited", progress: 88.7 },
        pendingApproval: { value: 9, label: "Pending Approval" },
        totalRejected: { value: 5, label: "Total Rejected", percentage: 1.2 }
    },
    journalistStatus: {
        rejected: { value: 38, percentage: 38, color: "#ef4444" },
        approved: { value: 38, percentage: 38, color: "#3b82f6" },
        pending: { value: 25, percentage: 25, color: "#94a3b8" }
    },
    mediaOrganizationType: [
        { name: "Foreign Media", count: 17, color: "#3b82f6" },
        { name: "AU Member State Media", count: 22, color: "#8b5cf6" },
        { name: "NGO / Int. Org", count: 3, color: "#f97316" },
        { name: "Others", count: 2, color: "#000000" }
    ],
    countries: [
        { name: "USA", count: 12, color: "#f97316", code: "USA" },
        { name: "UK", count: 10, color: "#a855f7", code: "GBR" },
        { name: "Nigeria", count: 7, color: "#3b82f6", code: "NGA" },
        { name: "South Africa", count: 5, color: "#22c55e", code: "ZAF" },
        { name: "Cairo", count: 5, color: "#ef4444", code: "EGY" }
    ],
    allCountries: [
        "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
        "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
        "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
        "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
        "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
        "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
        "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
        "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
        "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
        "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
        "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
        "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
        "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan",
        "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
        "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
        "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
        "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
        "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
        "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
        "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
    ],
    decisionsAndApprovals: [
        { authority: "Ethiopian Media Authority", icon: "speaker", approved: 101, rejected: 12, color: "#ec4899" },
        { authority: "Customs", icon: "package", approved: 101, rejected: 12, color: "#ec4899" },
        { authority: "INSA", icon: "building", approved: 101, rejected: 12, color: "#22c55e" },
        { authority: "Immigration and Citizenship Services", icon: "airplane", visaGranted: 100, visaDenied: 4, color: "#22c55e" },
        { authority: "Border Security Officer", icon: "shield", allowedEntry: 92, deniedEntry: 0, color: "#ef4444" }
    ],
    journalistsEntered: [
        { date: "2025-12-22", day: "Monday", total: 45, foreign: 12 },
        { date: "2025-12-23", day: "Tuesday", total: 52, foreign: 15 },
        { date: "2025-12-24", day: "Wednesday", total: 38, foreign: 8 },
        { date: "2025-12-25", day: "Thursday", total: 65, foreign: 25 }, // Users requested specific date example
        { date: "2025-12-26", day: "Friday", total: 48, foreign: 18 },
        { date: "2025-12-27", day: "Saturday", total: 25, foreign: 5 },
        { date: "2025-12-28", day: "Sunday", total: 30, foreign: 7 }
    ],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]
};

// --- CONSTANTS ---
const GEO_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const countryDataMap = new Map(dashboardData.countries.map(c => [c.code, c]));

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
export function SuperAdminDashboard() {
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [mounted, setMounted] = useState(false);
    const [selectedForm, setSelectedForm] = useState<string>("all");

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 8));
    const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 1));

    const donutData = [
        { name: 'Rejected', value: dashboardData.journalistStatus.rejected.percentage, color: dashboardData.journalistStatus.rejected.color },
        { name: 'Approved', value: dashboardData.journalistStatus.approved.percentage, color: dashboardData.journalistStatus.approved.color },
        { name: 'Pending', value: dashboardData.journalistStatus.pending.percentage, color: dashboardData.journalistStatus.pending.color },
    ];

    const orgTotal = dashboardData.mediaOrganizationType.reduce((sum, org) => sum + org.count, 0);

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
        const csvData: string[] = [];
        const selectedFormData = forms.find(f => f.id === selectedForm);
        const formName = selectedFormData?.name || 'All Forms';

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
        const formSlug = selectedFormData?.name.replace(/\s+/g, '-').toLowerCase() || 'all-forms';
        link.setAttribute('download', `dashboard-report-${formSlug}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export to PDF function
    const exportToPDF = () => {
        const doc = new jsPDF();
        let yPos = 20;
        const selectedFormData = forms.find(f => f.id === selectedForm);
        const formName = selectedFormData?.name || 'All Forms';

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
        yPos += 8;

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
        const formSlug = selectedFormData?.name.replace(/\s+/g, '-').toLowerCase() || 'all-forms';
        doc.save(`dashboard-report-${formSlug}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (!mounted) return null;

    return (
        <div className="w-full space-y-8 animate-fade-in max-w-[1600px] mx-auto">
            {/* Export Buttons with Form Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mb-6">
                {/* Form Selector */}
                <div className="relative group flex-1 sm:flex-none">
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 bg-white sm:min-w-[280px] hover:border-blue-400 transition-colors">
                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <select
                            value={selectedForm}
                            onChange={(e) => setSelectedForm(e.target.value)}
                            className="appearance-none border-0 outline-none text-sm flex-1 bg-transparent text-slate-700 font-medium cursor-pointer"
                        >
                            {forms.map((form) => (
                                <option key={form.id} value={form.id}>
                                    {form.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="h-4 w-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        className="flex-1 sm:flex-none gap-2 h-14 sm:h-auto"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="gradient"
                        size="sm"
                        onClick={exportToPDF}
                        className="flex-1 sm:flex-none gap-2 h-14 sm:h-auto"
                    >
                        <FileText className="h-4 w-4" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Filters Section */}
            <Card className="border-0 shadow-sm glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 bg-white hover:border-blue-400 transition-colors">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <input
                                    type="date"
                                    placeholder={dashboardData.filters.date}
                                    className="border-0 outline-none text-sm flex-1 bg-transparent text-slate-600 font-medium w-full"
                                />
                            </div>

                            <div className="relative group">
                                <select className="appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white outline-none w-full text-slate-700 font-medium hover:border-blue-400 transition-colors cursor-pointer">
                                    <option>{dashboardData.filters.organization}</option>
                                    <option>Foreign Media</option>
                                    <option>AU Member State Media</option>
                                    <option>NGO / Int. Org</option>
                                    <option>Others</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                            </div>

                            <div className="relative group">
                                <select className="appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white outline-none w-full text-slate-700 font-medium hover:border-blue-400 transition-colors cursor-pointer">
                                    <option>{dashboardData.filters.journalistCountry}</option>
                                    {dashboardData.allCountries.map((country, i) => (
                                        <option key={i} value={country}>{country}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                            </div>

                            <div className="relative group">
                                <select className="appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white outline-none w-full text-slate-700 font-medium hover:border-blue-400 transition-colors cursor-pointer">
                                    <option>{dashboardData.filters.status}</option>
                                    <option>Approved</option>
                                    <option>Pending</option>
                                    <option>Rejected</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>

                        <Button variant="gradient" className="gap-2 px-6 py-2.5 w-full md:w-auto">
                            <Filter className="h-4 w-4" />
                            Review
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
                            <div className="space-y-3 flex-shrink-0 w-40">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top Countries</div>
                                {dashboardData.countries.map((country, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: country.color }} />
                                            <span className="text-sm font-semibold text-slate-700">{country.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{country.count}</span>
                                    </div>
                                ))}
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

        </div>
    );
}