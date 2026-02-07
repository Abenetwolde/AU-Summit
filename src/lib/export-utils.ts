import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';

/**
 * Generate a filename with current timestamp
 */
export const generateFilename = (prefix: string, extension: string): string => {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    return `${prefix}_${date}_${time}.${extension}`;
};

/**
 * Export a DOM element to PDF using visual capture
 */
export async function exportElementToPDF(elementId: string, fileName: string) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with ID ${elementId} not found`);
        return;
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(generateFilename(fileName, 'pdf'));

    } catch (error) {
        console.error('Error generating PDF:', error);
    }
}

export interface ExportColumn {
    header: string;
    key: string;
}

export interface ExportData {
    [key: string]: any;
}

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
    if (!journalists || journalists.length === 0) return;

    // Helper to format field names to readable headers
    const formatHeader = (key: string) => {
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Helper to get country name (simple version for utils)
    const getCountryName = (j: any) => {
        return j.applyingFromCountry?.name || j.formData?.country || j.formData?.nationality || 'N/A';
    };

    const data = journalists.map(j => {
        // EXACTLY from formData as requested by user
        const firstName = j.formData?.first_name || '';
        const lastName = j.formData?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || j.user?.fullName || 'N/A';

        const row: any = {
            'Full Name': fullName,
            'Email': j.formData?.email || j.user?.email || j.email || 'N/A',
            'Nationality': getCountryName(j),
            'Passport No': j.formData?.passport_number || j.passportNo || 'N/A',
            'Organization': j.formData?.media_affiliation || j.formData?.organization_name || 'N/A',
            'Occupation': j.formData?.position_title || j.formData?.occupation || j.role || 'Journalist',
            'EMA Status': j.status || 'N/A',
            'Submission Date': j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'N/A'
        };

        // Add equipment summary
        if (j.equipment && Array.isArray(j.equipment) && j.equipment.length > 0) {
            row['Equipment'] = j.equipment.map((e: any) => `${e.type}: ${e.description}${e.serialNumber ? ` (SN: ${e.serialNumber})` : ''}`).join('; ');
        } else {
            row['Equipment'] = 'None';
        }

        // Add workflow step statuses
        if (j.approvals && Array.isArray(j.approvals)) {
            j.approvals.forEach((appr: any) => {
                if (appr.workflowStep?.name) {
                    const stepName = `${appr.workflowStep.name} Status`;
                    row[stepName] = appr.status || 'PENDING';
                }
            });
        }

        // Add all other formData that aren't technical/file/already included
        if (j.formData) {
            Object.entries(j.formData).forEach(([key, value]) => {
                const technicalKeys = [
                    'profile_photo', 'passport_photo', 'id', 'userId', 'formId', 'updatedAt',
                    'declaration_status', 'equipment', 'first_name', 'last_name', 'email',
                    'nationality', 'country', 'passport_number', 'media_affiliation',
                    'organization_name', 'position_title', 'occupation', 'press_card_copy',
                    'assignment_letter', 'terms_and_conditions', 'media_ethics_agreement'
                ];
                if (!technicalKeys.includes(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
                    const header = formatHeader(key);
                    // Only add if not already present in row
                    if (!row[header]) {
                        row[header] = value;
                    }
                }
            });
        }

        return row;
    });

    exportToCSV(data, 'journalists_list');
}

/**
 * Export journalist list to PDF
 */
export function exportJournalistsToPDF(journalists: any[]) {
    if (!journalists || journalists.length === 0) return;

    // Fixed columns for PDF to maintain layout, but with better data
    const columns: ExportColumn[] = [
        { header: 'Full Name', key: 'fullname' },
        { header: 'Email', key: 'email' },
        { header: 'Nationality', key: 'country' },
        { header: 'Passport No', key: 'passportNo' },
        { header: 'Organization', key: 'organization' },
        { header: 'Occupation', key: 'role' },
        { header: 'Status', key: 'status' }
    ];

    const data = journalists.map(j => {
        // EXACTLY from formData as requested by user
        const firstName = j.formData?.first_name || '';
        const lastName = j.formData?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || j.user?.fullName || 'N/A';

        return {
            fullname: fullName,
            email: j.formData?.email || j.user?.email || j.email || 'N/A',
            country: j.applyingFromCountry?.name || j.formData?.country || j.formData?.nationality || j.country || 'N/A',
            passportNo: j.formData?.passport_number || j.passportNo || 'N/A',
            organization: j.formData?.media_affiliation || j.formData?.organization_name || 'N/A',
            role: j.formData?.position_title || j.formData?.occupation || j.role || 'Journalist',
            status: j.status || 'N/A'
        };
    });

    const filename = generateFilename('journalists_list', 'pdf');
    const doc = new jsPDF('landscape');

    doc.setFontSize(16);
    doc.text('Journalist List', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: data.map(row => columns.map(col => String((row as any)[col.key] || ''))),
        startY: 28,
        styles: { fontSize: 8 },
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
 * Export journalist detail to CSV
 */
export function exportJournalistDetailToCSV(journalist: any) {
    if (!journalist) return;

    const row: any = {};

    // 1. Basic Info
    row['Application ID'] = journalist.id;
    row['Status'] = journalist.status;
    row['Full Name'] = journalist.formData?.first_name
        ? `${journalist.formData.first_name} ${journalist.formData.last_name || ''}`.trim()
        : (journalist.user?.fullName || journalist.fullname || 'N/A');

    // 2. Map all requested fields from formData
    const fieldMapping: Record<string, string> = {
        'first_name': 'First Name',
        'last_name': 'Last Name',
        'gender': 'Gender',
        'date_of_birth': 'Date of Birth',
        'nationality': 'Nationality',
        'place_of_birth': 'Place of Birth',
        'passport_number': 'Passport Number',
        'passport_issue_date': 'Passport Issue Date',
        'passport_expiry_date': 'Passport Expiry Date',
        'visa_information': 'Visa Information',
        'email': 'Email Address',
        'phone': 'Phone Number',
        'emergency_contact_name': 'Emergency Contact Name',
        'emergency_contact_phone': 'Emergency Contact Phone',
        'media_affiliation': 'Media Organization/Affiliation',
        'position_title': 'Position/Title',
        'media_type': 'Media Type',
        'press_card_number': 'Press Card Number',
        'coverage_type': 'Type of Coverage',
        'previous_coverage_examples': 'Portfolio Links',
        'terms_and_conditions': 'T&C Agreement',
        'media_ethics_agreement': 'Media Ethics Agreement',
        'photo_release': 'Photo Release Permission',
        'has_drone': 'Drone Equipment',
        'declaration_status': 'Professional Media Equipment'
    };

    Object.entries(fieldMapping).forEach(([key, label]) => {
        let value = journalist.formData?.[key];
        if (value === true || value === 'true') value = 'Yes';
        else if (value === false || value === 'false') value = 'No';
        row[label] = value || 'N/A';
    });

    // 3. Equipment Summary
    if (journalist.equipment && Array.isArray(journalist.equipment) && journalist.equipment.length > 0) {
        row['Equipment Summary'] = journalist.equipment.map((e: any) =>
            `${e.type}: ${e.description}${e.serialNumber ? ` (SN: ${e.serialNumber})` : ''} - Value: ${e.value} ${e.currency || 'USD'}`
        ).join('; ');
    }

    const filename = generateFilename(`journalist_${journalist.id || 'profile'}`, 'csv');
    exportToCSV([row], filename.replace('.csv', ''));
}

/**
 * Export journalist detail to PDF (Comprehensive)
 */
export function exportJournalistDetailToPDF(journalist: any) {
    const doc = new jsPDF();
    const filename = generateFilename(`journalist_${journalist.id || 'profile'}`, 'pdf');
    const AU_GREEN = [0, 155, 77] as [number, number, number];

    // Header
    doc.setFillColor(...AU_GREEN);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Journalist Accreditation Profile', 14, 20);

    doc.setTextColor(0, 0, 0);
    let y = 40;

    const addSection = (title: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(...AU_GREEN);
        doc.text(title, 14, y);
        y += 2;
        doc.setDrawColor(...AU_GREEN);
        doc.line(14, y, 60, y);
        y += 8;
        doc.setTextColor(0, 0, 0);
    };

    const addRow = (label: string, value: any) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 14, y);
        doc.setFont('helvetica', 'normal');

        let displayValue = String(value || 'N/A');
        if (value === true || value === 'true') displayValue = 'Yes';
        else if (value === false || value === 'false') displayValue = 'No';

        doc.text(displayValue, 65, y, { maxWidth: 130 });

        const textLines = doc.splitTextToSize(displayValue, 130);
        y += (textLines.length * 5) + 2;
    };

    const gd = (key: string) => journalist.formData?.[key];

    // 1. Personal Details
    addSection('Personal Details');
    addRow('First Name', gd('first_name'));
    addRow('Last Name', gd('last_name'));
    addRow('Gender', gd('gender'));
    addRow('Date of Birth', gd('date_of_birth') ? new Date(gd('date_of_birth')).toLocaleDateString() : 'N/A');
    addRow('Nationality', gd('nationality') || journalist.applyingFromCountry?.name);
    addRow('Place of Birth', gd('place_of_birth'));
    y += 5;

    // 2. Travel & Passport
    addSection('Travel & Passport');
    addRow('Passport Number', gd('passport_number'));
    addRow('Passport Issue Date', gd('passport_issue_date') ? new Date(gd('passport_issue_date')).toLocaleDateString() : 'N/A');
    addRow('Passport Expiry Date', gd('passport_expiry_date') ? new Date(gd('passport_expiry_date')).toLocaleDateString() : 'N/A');
    addRow('Visa Information', gd('visa_information'));
    y += 5;

    // 3. Contact Information
    addSection('Contact Information');
    addRow('Email Address', gd('email'));
    addRow('Phone Number', gd('phone'));
    addRow('Emergency Contact Name', gd('emergency_contact_name'));
    addRow('Emergency Contact Phone', gd('emergency_contact_phone'));
    y += 5;

    // 4. Media Profile & Documents
    addSection('Media Profile & Documents');
    addRow('Media Organization', gd('media_affiliation'));
    addRow('Position/Title', gd('position_title'));
    addRow('Media Type', gd('media_type'));
    addRow('Press Card Number', gd('press_card_number'));
    addRow('Type of Coverage', gd('coverage_type'));
    addRow('Portfolio/Links', gd('previous_coverage_examples'));
    y += 5;

    // 5. Legal & Agreements
    addSection('Legal & Agreements');
    addRow('T&C Agreement', gd('terms_and_conditions'));
    addRow('Media Ethics Agreement', gd('media_ethics_agreement'));
    addRow('Photo Release', gd('photo_release'));
    y += 5;

    // 6. Equipment Declaration
    addSection('Equipment Declaration');
    addRow('Will take drone?', gd('has_drone'));
    addRow('Has professional gear?', gd('declaration_status'));
    y += 8;

    if (journalist.equipment && Array.isArray(journalist.equipment) && journalist.equipment.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Type', 'Description', 'Serial No', 'Value', 'Qty', 'Status']],
            body: journalist.equipment.map((e: any) => [
                e.type || 'N/A',
                e.description || 'N/A',
                e.serialNumber || 'N/A',
                `${e.value || '0'} ${e.currency || 'USD'}`,
                e.quantity || 1,
                e.status || 'PENDING'
            ]),
            headStyles: { fillColor: AU_GREEN },
            theme: 'striped',
            margin: { left: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`African Union Media Accreditation - ID: ${journalist.id} - Generated: ${new Date().toLocaleString()}`, 14, 285);
        doc.text(`Page ${i} of ${pageCount}`, 190, 285);
    }

    doc.save(filename);
}

/**
 * Export duplicated applications to PDF
 */
export function exportDuplicatesToPDF(users: any[]) {
    const doc = new jsPDF();
    const filename = generateFilename('applicant_history_duplicates', 'pdf');
    const AU_GREEN = [0, 155, 77] as [number, number, number];

    // Header
    doc.setFillColor(...AU_GREEN);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Applicant History & Duplications', 14, 20);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38);

    let y = 45;

    users.forEach((user) => {
        // Check if we need a new page for the user header
        if (y > 250) {
            doc.addPage();
            y = 20;
        }

        // User Header
        doc.setFillColor(240, 240, 240);
        doc.rect(14, y, 182, 18, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`${user.fullName} (ID: ${user.userId})`, 18, y + 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(user.email, 18, y + 13);

        y += 25;

        // Applications Table for this user
        autoTable(doc, {
            startY: y,
            head: [['App ID', 'Name', 'Passport', 'Country', 'Status', 'Date']],
            body: user.applications.map((app: any) => [
                String(app.applicationId),
                `${app.firstName} ${app.lastName}`,
                app.passportNumber,
                app.country,
                app.status,
                new Date(app.createdAt).toLocaleDateString()
            ]),
            headStyles: {
                fillColor: [60, 60, 60],
                fontSize: 9
            },
            styles: { fontSize: 9 },
            margin: { left: 14 },
            showHead: 'firstPage'
        });

        y = (doc as any).lastAutoTable.finalY + 15;
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`African Union Media Accreditation System`, 14, 285);
        doc.text(`Page ${i} of ${pageCount}`, 190, 285);
    }

    doc.save(filename);
}
