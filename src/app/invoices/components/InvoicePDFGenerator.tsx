'use client';

import jsPDF from 'jspdf';

interface InvoiceData {
    id: string;
    invoice_type: 'PAYABLE' | 'RECEIVABLE';
    counterparty_name: string;
    invoice_number?: string;
    amount: number;
    tax_amount: number;
    invoice_date: string;
    due_date: string;
    status: string;
    notes?: string;
}

interface CompanyInfo {
    name: string;
    address: string;
    gst_number?: string;
    phone?: string;
    email?: string;
}

export function generateInvoicePDF(invoice: InvoiceData, company?: CompanyInfo) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Default company info if not provided
    const companyInfo: CompanyInfo = company || {
        name: 'Your Company Name',
        address: 'Company Address, City, State - PIN',
        gst_number: 'GSTIN: XXXXXXXXXXXXXXXXX',
        phone: '+91 XXXXXXXXXX',
        email: 'contact@company.com'
    };

    // Colors
    const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
    const darkText: [number, number, number] = [31, 41, 55];
    const lightText: [number, number, number] = [107, 114, 128];

    let yPos = 20;

    // Header Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Company Name (White text on colored header)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(companyInfo.name, 20, 25);

    // Company Details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.address, 20, 33);
    if (companyInfo.gst_number) {
        doc.text(companyInfo.gst_number, 20, 39);
    }

    // Invoice Title (Right side)
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    const invoiceTitle = invoice.invoice_type === 'RECEIVABLE' ? 'INVOICE' : 'BILL';
    doc.text(invoiceTitle, pageWidth - 20, 30, { align: 'right' });

    yPos = 60;

    // Invoice Details Section
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Number:', 20, yPos);
    doc.text('Invoice Date:', 20, yPos + 8);
    doc.text('Due Date:', 20, yPos + 16);
    doc.text('Status:', 20, yPos + 24);

    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoice_number || 'N/A', 60, yPos);
    doc.text(new Date(invoice.invoice_date).toLocaleDateString('en-IN'), 60, yPos + 8);
    doc.text(new Date(invoice.due_date).toLocaleDateString('en-IN'), 60, yPos + 16);
    doc.text(invoice.status.replace('_', ' '), 60, yPos + 24);

    // Bill To Section (Right side)
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoice_type === 'RECEIVABLE' ? 'Bill To:' : 'Bill From:', pageWidth - 80, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.counterparty_name, pageWidth - 80, yPos + 8);

    yPos = 105;

    // Table Header
    doc.setFillColor(243, 244, 246);
    doc.rect(20, yPos, pageWidth - 40, 12, 'F');

    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 25, yPos + 8);
    doc.text('Amount', pageWidth - 25, yPos + 8, { align: 'right' });

    yPos += 18;

    // Table Row - Main Amount
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoice_type === 'RECEIVABLE' ? 'Service / Product Charges' : 'Expense / Purchase', 25, yPos);
    doc.text(formatCurrency(invoice.amount - invoice.tax_amount), pageWidth - 25, yPos, { align: 'right' });

    yPos += 10;

    // Tax Row
    if (invoice.tax_amount > 0) {
        doc.setTextColor(...lightText);
        doc.text('GST / Tax', 25, yPos);
        doc.text(formatCurrency(invoice.tax_amount), pageWidth - 25, yPos, { align: 'right' });
        yPos += 10;
    }

    // Separator Line
    yPos += 5;
    doc.setDrawColor(229, 231, 235);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // Total
    doc.setTextColor(...darkText);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 25, yPos);
    doc.text(formatCurrency(invoice.amount), pageWidth - 25, yPos, { align: 'right' });

    yPos += 8;

    // Amount in Words
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightText);
    doc.text(`(${numberToWords(invoice.amount)} Only)`, 25, yPos);

    yPos += 25;

    // Notes Section
    if (invoice.notes) {
        doc.setTextColor(...darkText);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 50);
        doc.text(splitNotes, 20, yPos + 8);
        yPos += 8 + (splitNotes.length * 5);
    }

    yPos += 15;

    // Payment Terms / Bank Details Box
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');

    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information', 25, yPos + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...lightText);
    doc.text('Please make payment by the due date mentioned above.', 25, yPos + 20);
    doc.text('For bank transfer details, please contact us.', 25, yPos + 28);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setDrawColor(229, 231, 235);
    doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);

    doc.setTextColor(...lightText);
    doc.setFontSize(8);
    doc.text('This is a computer-generated document. No signature required.', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Generated by ONCA Financial System', pageWidth / 2, footerY + 5, { align: 'center' });

    // Download the PDF
    const filename = `${invoiceTitle}_${invoice.invoice_number || invoice.id}.pdf`;
    doc.save(filename);
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

function numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';

    const integer = Math.floor(num);

    if (integer < 20) return ones[integer] + ' Rupees';
    if (integer < 100) return tens[Math.floor(integer / 10)] + (integer % 10 ? ' ' + ones[integer % 10] : '') + ' Rupees';
    if (integer < 1000) return ones[Math.floor(integer / 100)] + ' Hundred' + (integer % 100 ? ' ' + numberToWords(integer % 100).replace(' Rupees', '') : '') + ' Rupees';
    if (integer < 100000) {
        const thousands = Math.floor(integer / 1000);
        const remainder = integer % 1000;
        return (thousands < 20 ? ones[thousands] : tens[Math.floor(thousands / 10)] + (thousands % 10 ? ' ' + ones[thousands % 10] : ''))
            + ' Thousand' + (remainder ? ' ' + numberToWords(remainder).replace(' Rupees', '') : '') + ' Rupees';
    }
    if (integer < 10000000) {
        const lakhs = Math.floor(integer / 100000);
        const remainder = integer % 100000;
        return (lakhs < 20 ? ones[lakhs] : tens[Math.floor(lakhs / 10)] + (lakhs % 10 ? ' ' + ones[lakhs % 10] : ''))
            + ' Lakh' + (remainder ? ' ' + numberToWords(remainder).replace(' Rupees', '') : '') + ' Rupees';
    }

    const crores = Math.floor(integer / 10000000);
    const remainder = integer % 10000000;
    return (crores < 20 ? ones[crores] : tens[Math.floor(crores / 10)] + (crores % 10 ? ' ' + ones[crores % 10] : ''))
        + ' Crore' + (remainder ? ' ' + numberToWords(remainder).replace(' Rupees', '') : '') + ' Rupees';
}

export function DownloadPDFButton({ invoice }: { invoice: InvoiceData }) {
    const handleDownload = () => {
        generateInvoicePDF(invoice);
    };

    return (
        <button
            onClick={handleDownload}
            style={{
                padding: '6px 12px',
                background: 'var(--brand-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: '600'
            }}
            title="Download PDF"
        >
            📄 PDF
        </button>
    );
}
