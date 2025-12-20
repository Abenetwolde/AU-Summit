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

/**
 * Export data to CSV file
 */
export function exportToCSV(data: ExportData[], filename: string = 'export.csv') {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export data to PDF file with table
 */
export function exportToPDF(
    data: ExportData[],
    columns: ExportColumn[],
    filename: string = 'export.pdf',
    title: string = 'Export Data'
) {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    // Prepare table data
    const tableData = data.map(row =>
        columns.map(col => row[col.key] || '')
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
export function exportJournalistsToCSV(journalists: any[], filename: string = 'journalists.csv') {
    const data = journalists.map(j => ({
        'Full Name': j.fullname,
        'Country': j.country,
        'Passport No': j.passportNo,
        'Role': j.role,
        'Status': j.status,
    }));

    exportToCSV(data, filename);
}

/**
 * Export journalist list to PDF
 */
export function exportJournalistsToPDF(journalists: any[], filename: string = 'journalists.pdf', title: string = 'Journalist List') {
    const columns: ExportColumn[] = [
        { header: 'Full Name', key: 'fullname' },
        { header: 'Country', key: 'country' },
        { header: 'Passport No', key: 'passportNo' },
        { header: 'Role', key: 'role' },
        { header: 'Status', key: 'status' },
    ];

    const data = journalists.map(j => ({
        fullname: j.fullname,
        country: j.country,
        passportNo: j.passportNo,
        role: j.role,
        status: j.status,
    }));

    exportToPDF(data, columns, filename, title);
}

/**
 * Export journalist detail to PDF
 */
export function exportJournalistDetailToPDF(journalist: any, filename?: string) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Journalist Profile', 14, 15);

    // Personal Information
    doc.setFontSize(14);
    doc.text('Personal Information', 14, 30);
    doc.setFontSize(10);
    let y = 38;

    const personalInfo = [
        ['Full Name', journalist.fullname],
        ['Nationality', journalist.country],
        ['Passport Number', journalist.passportNo],
        ['Gender', journalist.gender],
        ['Date of Birth', journalist.dob],
        ['Contact', journalist.contact],
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
        ['Organization', 'CNN News'], // Placeholder as it's not in mock but in UI
        ['Role', journalist.role],
        ['Accommodation', journalist.accommodation],
        ['Visa Number', journalist.visaNumber],
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

    doc.save(filename || `journalist_${journalist.id}.pdf`);
}
