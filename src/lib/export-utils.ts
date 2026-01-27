import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

export interface ExportColumn {
    header: string;
    key: string;
}

export interface ExportData {
    [key: string]: any;
}

const generateFilename = (baseName: string, extension: string): string => {
    const date = new Date().toISOString().split('T')[0];
    return `${baseName}_${date}.${extension}`;
};

/**
 * Export data to CSV file
 */
export function exportToCSV(data: ExportData[], baseFilename: string = 'export') {
    const filename = generateFilename(baseFilename, 'csv');
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if ((navigator as any).msSaveBlob) { // IE 10+
        (navigator as any).msSaveBlob(blob, filename);
    } else {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
    }
}

/**
 * Export data to PDF file with table
 */
export function exportToPDF(
    data: ExportData[],
    columns: ExportColumn[],
    baseFilename: string = 'export',
    title: string = 'Export Data'
) {
    const filename = generateFilename(baseFilename, 'pdf');
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    // Prepare table data
    const tableData = data.map(row =>
        columns.map(col => {
            const val = row[col.key];
            return val !== null && val !== undefined ? String(val) : '';
        })
    );

    // Add table
    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: tableData,
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 155, 77] }, // Green color
    });

    doc.save(filename);
}

/**
 * Export journalist list to CSV
 */
export function exportJournalistsToCSV(journalists: any[]) {
    const data = journalists.map(j => ({
        'Full Name': j.user?.fullName || j.fullname || 'N/A',
        'Email': j.user?.email || j.email || 'N/A',
        'Phone': j.formData?.phone || 'N/A',
        'Country': j.formData?.country || j.country || 'N/A',
        'Passport No': j.formData?.passport_number || j.passportNo || 'N/A',
        'Occupation': j.formData?.occupation || j.role || 'N/A',
        'Arrival Date': j.formData?.arrival_date || 'N/A',
        'Accommodation': j.formData?.accommodation_details || 'N/A',
        'EMA Status': j.status || 'N/A',
        'Immigration Status': j.immigrationStatus || 'N/A',
        'Customs Status': j.equipmentStatus || 'N/A',
        'Submission Date': j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'N/A'
    }));

    exportToCSV(data, 'journalists_list');
}

/**
 * Export journalist list to PDF
 */
export function exportJournalistsToPDF(journalists: any[]) {
    const columns: ExportColumn[] = [
        { header: 'Full Name', key: 'fullname' },
        { header: 'Email', key: 'email' },
        { header: 'Country', key: 'country' },
        { header: 'Passport No', key: 'passportNo' },
        { header: 'Occupation', key: 'role' },
        { header: 'Arrival', key: 'arrival' },
        { header: 'Status', key: 'status' }
    ];

    const data = journalists.map(j => ({
        fullname: j.user?.fullName || j.fullname || 'N/A',
        email: j.user?.email || j.email || 'N/A',
        country: j.formData?.country || j.country || 'N/A',
        passportNo: j.formData?.passport_number || j.passportNo || 'N/A',
        role: j.formData?.occupation || j.role || 'N/A',
        arrival: j.formData?.arrival_date || 'N/A',
        status: j.status || 'N/A'
    }));

    const filename = generateFilename('journalists_list', 'pdf');
    const doc = new jsPDF('landscape'); // Use landscape for more columns

    doc.setFontSize(16);
    doc.text('Journalist List', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: data.map(row => columns.map(col => String((row as any)[col.key] || ''))),
        startY: 28,
        styles: { fontSize: 7 }, // Smaller font to fit
        headStyles: { fillColor: [0, 155, 77] },
    });

    doc.save(filename);
}


/**
 * Comprehensive Dashboard Export Interfaces
 */
export interface DashboardExportData {
    kpis: Record<string, { label: string; value: any; percentage?: number; trend?: string }>;
    charts: {
        timeSeries?: any[];
        statusDistribution?: any[];
        roleDistribution?: any[];
        registrationStats?: {
            coverage: any[];
            mediaType: any[];
        };
    };
    geographicDistribution?: any[];
    officerPerformance?: any[];
    stakeholderPerformance?: {
        stakeholder: string;
        averageTime: string;
        trend: any[];
    }[];
}

/**
 * Capture a DOM element as a base64 image string
 */
export async function captureElement(elementId: string): Promise<string | null> {
    const html2canvas = (await import('html2canvas')).default;
    const element = document.getElementById(elementId);
    if (!element) return null;

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error(`Failed to capture element ${elementId}:`, error);
        return null;
    }
}

/**
 * Export Dashboard Analytics to CSV (Comprehensive)
 */
export function exportDashboardAnalyticsToCSV(title: string, data: DashboardExportData) {
    const csvRows: any[][] = [];
    csvRows.push([title.toUpperCase()]);
    csvRows.push([`Generated: ${new Date().toLocaleString()}`]);
    csvRows.push([]);

    // 1. Key Metrics
    csvRows.push(['SECTION: KEY PERFORMANCE INDICATORS']);
    csvRows.push(['Metric', 'Value', 'Percentage', 'Trend']);
    Object.values(data.kpis).forEach(kpi => {
        csvRows.push([kpi.label, kpi.value, kpi.percentage ? `${kpi.percentage}%` : 'N/A', kpi.trend || 'N/A']);
    });
    csvRows.push([]);

    // 2. Application Trends
    if (data.charts.timeSeries?.length) {
        csvRows.push(['SECTION: APPLICATION SUBMISSION TRENDS']);
        csvRows.push(['Date', 'Count']);
        data.charts.timeSeries.forEach(item => csvRows.push([item.date, item.count]));
        csvRows.push([]);
    }

    // 3. Status Distribution
    if (data.charts.statusDistribution?.length) {
        csvRows.push(['SECTION: STATUS DISTRIBUTION']);
        csvRows.push(['Status', 'Count']);
        data.charts.statusDistribution.forEach(item => csvRows.push([item.status || item.name, item.count || item.value]));
        csvRows.push([]);
    }

    // 4. Role Distribution
    if (data.charts.roleDistribution?.length) {
        csvRows.push(['SECTION: ROLE DISTRIBUTION']);
        csvRows.push(['Role', 'Count']);
        data.charts.roleDistribution.forEach(item => csvRows.push([item.roleName || item.name, item.count || item.value]));
        csvRows.push([]);
    }

    // 5. Geographic Distribution
    if (data.geographicDistribution?.length) {
        csvRows.push(['SECTION: GEOGRAPHIC DISTRIBUTION']);
        csvRows.push(['Country', 'Application Count', 'ISO Code']);
        data.geographicDistribution.forEach(item => csvRows.push([item.name, item.count, item.code]));
        csvRows.push([]);
    }

    // 6. Officer Performance
    if (data.officerPerformance?.length) {
        csvRows.push(['SECTION: OFFICER PERFORMANCE']);
        csvRows.push(['Officer Name', 'Email', 'Assigned', 'Approved', 'Rejected', 'Avg Time (min)']);
        data.officerPerformance.forEach(item => csvRows.push([
            item.fullName,
            item.email,
            item.totalHandled,
            item.approvedCount,
            item.rejectedCount,
            item.avgProcessingTime
        ]));
        csvRows.push([]);
    }

    // 7. Registration Stats (Coverage)
    if (data.charts.registrationStats?.coverage.length) {
        csvRows.push(['SECTION: REGISTRATION BY COVERAGE TYPE']);
        csvRows.push(['Type', 'Count']);
        data.charts.registrationStats.coverage.forEach(item => csvRows.push([item.name, item.value]));
        csvRows.push([]);
    }

    const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_full_report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export Dashboard Analytics to PDF (Comprehensive with Charts)
 */
export async function exportDashboardAnalyticsToPDF(
    title: string,
    data: DashboardExportData,
    chartImages?: Record<string, string | null>
) {
    const doc = new jsPDF();
    const AU_GREEN = [0, 155, 77] as [number, number, number];
    const SLATE_800 = [30, 41, 59] as [number, number, number];

    // Header
    doc.setFillColor(...AU_GREEN);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(title, 14, 25);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);

    let y = 50;

    // Helper to add a section title
    const addSection = (text: string) => {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(...SLATE_800);
        doc.text(text, 14, y);
        y += 6;
    };

    // Helper to add an image if available
    const addChartImage = (chartId: string, height: number = 60) => {
        const imgData = chartImages?.[chartId];
        if (imgData) {
            if (y + height > 270) { doc.addPage(); y = 20; }
            doc.addImage(imgData, 'PNG', 14, y, 180, height);
            y += height + 10;
        }
    };

    // 1. KPIs Section
    addSection('Key Performance Indicators');
    autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value', 'Relative %', 'Trend']],
        body: Object.values(data.kpis).map(kpi => [
            kpi.label,
            String(kpi.value),
            kpi.percentage ? `${kpi.percentage}%` : 'N/A',
            kpi.trend || 'N/A'
        ]),
        headStyles: { fillColor: AU_GREEN },
        margin: { left: 14 }
    });
    y = (doc as any).lastAutoTable.finalY + 15;

    // 2. Application Trends
    if (data.charts.timeSeries?.length) {
        addSection('Application Submission Trends');
        addChartImage('chart-application-trends');
        autoTable(doc, {
            startY: y,
            head: [['Date', 'Applications']],
            body: data.charts.timeSeries.slice(-10).map(item => [item.date, String(item.count)]), // Show last 10 for brevety
            headStyles: { fillColor: AU_GREEN },
            margin: { left: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    }

    // 3. Status & Lifecycle
    if (data.charts.statusDistribution?.length) {
        addSection('Journalists Status Distribution');
        addChartImage('chart-journalist-status', 80);
        autoTable(doc, {
            startY: y,
            head: [['Status', 'Count']],
            body: data.charts.statusDistribution.map(item => [item.status || item.name, String(item.count || item.value)]),
            headStyles: { fillColor: AU_GREEN },
            margin: { left: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    }

    // 4. Geographic Distribution
    if (data.geographicDistribution?.length) {
        addSection('Top Geographic Distribution');
        addChartImage('chart-geographic-dist', 90);
        autoTable(doc, {
            startY: y,
            head: [['Country', 'Total Applications', 'ISO Code']],
            body: data.geographicDistribution.slice(0, 15).map(item => [item.name, String(item.count), item.code]),
            headStyles: { fillColor: AU_GREEN },
            margin: { left: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    }

    // 5. Registration Stats
    if (data.charts.registrationStats) {
        addSection('Registration by Coverage & Media Type');
        addChartImage('chart-coverage-type', 80);
        addChartImage('chart-media-type', 80);
        y += 10;
    }

    // 6. Officer Performance
    if (data.officerPerformance?.length) {
        addSection('Officer Performance Metrics');
        autoTable(doc, {
            startY: y,
            head: [['Officer', 'Handled', 'Approved', 'Rejected', 'Avg Time']],
            body: data.officerPerformance.map(item => [
                item.fullName,
                String(item.totalHandled),
                String(item.approvedCount),
                String(item.rejectedCount),
                `${item.avgProcessingTime}m`
            ]),
            headStyles: { fillColor: AU_GREEN },
            margin: { left: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`African Union Media Accreditation System - Confidential Report`, 14, 285);
        doc.text(`Page ${i} of ${pageCount}`, 180, 285);
    }

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_full_report.pdf`);
}

/**
 * Export journalist detail to PDF (Existing - keep)
 */
export function exportJournalistDetailToPDF(journalist: any) {
    const doc = new jsPDF();
    const filename = generateFilename(`journalist_${journalist.id || 'profile'}`, 'pdf');

    // Title
    doc.setFontSize(18);
    doc.text('Journalist Profile', 14, 15);

    // Personal Information
    doc.setFontSize(14);
    doc.text('Personal Information', 14, 30);
    doc.setFontSize(10);
    let y = 38;

    // Helper to safely get data
    const getVal = (path: string, fallback = 'N/A') => {
        return path.split('.').reduce((obj, key) => obj?.[key], journalist) || fallback;
    };

    const personalInfo = [
        ['Full Name', journalist.user?.fullName || journalist.fullname],
        ['Nationality', getVal('formData.country', journalist.country)],
        ['Passport Number', getVal('formData.passport_number', journalist.passportNo)],
        ['Gender', getVal('formData.gender', 'N/A')],
        ['Date of Birth', getVal('formData.dob', 'N/A')],
        ['Contact', getVal('formData.phone', journalist.contact)],
        ['Email', journalist.user?.email || journalist.email],
    ];

    personalInfo.forEach(([label, value]) => {
        doc.text(`${label}:`, 14, y);
        doc.text(String(value || 'N/A'), 60, y);
        y += 7;
    });

    // Travel Info
    y += 5;
    doc.setFontSize(14);
    doc.text('Travel & Accreditation', 14, y);
    y += 8;
    doc.setFontSize(10);

    const travelInfo = [
        ['Role', getVal('formData.occupation', journalist.role)],
        ['Accommodation', getVal('formData.accommodation_details', 'N/A')],
        ['Arrival Date', getVal('formData.arrival_date', 'N/A')],
        ['Status', journalist.status],
    ];

    travelInfo.forEach(([label, value]) => {
        doc.text(`${label}:`, 14, y);
        doc.text(String(value || 'N/A'), 60, y);
        y += 7;
    });

    // Footer
    doc.setFontSize(8);
    doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        14,
        doc.internal.pageSize.height - 10
    );

    doc.save(filename);
}
