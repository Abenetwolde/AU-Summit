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
        'Country': j.formData?.country || j.country || 'N/A',
        'Passport No': j.formData?.passport_number || j.passportNo || 'N/A',
        'Role': j.formData?.occupation || j.role || 'N/A',
        'Status': j.status || 'N/A',
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
        { header: 'Country', key: 'country' },
        { header: 'Passport No', key: 'passportNo' },
        { header: 'Role', key: 'role' },
        { header: 'Status', key: 'status' },
        { header: 'Date', key: 'date' }
    ];

    const data = journalists.map(j => ({
        fullname: j.user?.fullName || j.fullname || 'N/A',
        country: j.formData?.country || j.country || 'N/A',
        passportNo: j.formData?.passport_number || j.passportNo || 'N/A',
        role: j.formData?.occupation || j.role || 'N/A',
        status: j.status || 'N/A',
        date: j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'N/A'
    }));

    exportToPDF(data, columns, 'journalists_list', 'Journalist List');
}

/**
 * Export journalist detail to PDF
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
