import { jsPDF } from 'jspdf';
import { formatDate, formatCurrency } from '../utils/helpers';

// Generate offer letter PDF
export const generateOfferPDF = (offer, candidate, job) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Helper function to add text with word wrap
    const addWrappedText = (text, x, y, maxWidth, lineHeight = 7) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line, index) => {
            doc.text(line, x, y + (index * lineHeight));
        });
        return y + (lines.length * lineHeight);
    };

    // Company Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 92, 246); // Purple accent
    doc.text('TalentAcq', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Talent Acquisition System', margin, yPos);
    yPos += 20;

    // Offer Letter Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('OFFER OF EMPLOYMENT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Date
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(offer.createdAt || new Date())}`, margin, yPos);
    yPos += 15;

    // Candidate Details
    doc.setFont('helvetica', 'bold');
    doc.text(`Dear ${candidate.name},`, margin, yPos);
    yPos += 10;

    // Opening paragraph
    doc.setFont('helvetica', 'normal');
    const openingText = `We are pleased to extend this offer of employment to you for the position of ${job.title} at our company. We were impressed with your qualifications and believe you will be a valuable addition to our team.`;
    yPos = addWrappedText(openingText, margin, yPos, contentWidth);
    yPos += 10;

    // Position Details Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Position Details', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const details = [
        { label: 'Position:', value: job.title },
        { label: 'Department:', value: job.department },
        { label: 'Location:', value: offer.location || job.location },
        { label: 'Start Date:', value: formatDate(offer.joiningDate) },
        { label: 'Reporting To:', value: offer.reportingManager || 'To be assigned' }
    ];

    details.forEach(detail => {
        doc.setFont('helvetica', 'bold');
        doc.text(detail.label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(detail.value, margin + 40, yPos);
        yPos += 7;
    });
    yPos += 10;

    // Compensation Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Compensation Package', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const compensation = [
        { label: 'Base Salary:', value: `${formatCurrency(offer.baseSalary)} per annum` },
        { label: 'Bonus:', value: offer.bonus ? `${formatCurrency(offer.bonus)} (performance-based)` : 'As per policy' }
    ];

    compensation.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(item.value, margin + 40, yPos);
        yPos += 7;
    });
    yPos += 10;

    // Benefits
    if (offer.benefits && offer.benefits.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Benefits', margin, yPos);
        yPos += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        offer.benefits.forEach(benefit => {
            doc.text(`• ${benefit}`, margin + 5, yPos);
            yPos += 7;
        });
        yPos += 10;
    }

    // Terms
    const termsText = `This offer is contingent upon successful completion of background verification and any other pre-employment requirements. This offer will remain valid until ${formatDate(offer.expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}.`;
    yPos = addWrappedText(termsText, margin, yPos, contentWidth);
    yPos += 15;

    // Closing
    const closingText = 'We are excited about the possibility of you joining our team and look forward to your positive response. Please sign and return a copy of this letter to confirm your acceptance.';
    yPos = addWrappedText(closingText, margin, yPos, contentWidth);
    yPos += 15;

    doc.text('Sincerely,', margin, yPos);
    yPos += 15;

    doc.setFont('helvetica', 'bold');
    doc.text(offer.signatoryName || 'HR Department', margin, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(offer.signatoryTitle || 'Human Resources', margin, yPos);
    yPos += 20;

    // Acceptance Section
    if (yPos > 240) {
        doc.addPage();
        yPos = margin;
    }

    doc.setDrawColor(139, 92, 246);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Candidate Acceptance', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('I accept this offer of employment as described above.', margin, yPos);
    yPos += 20;

    doc.text('Signature: _______________________________', margin, yPos);
    yPos += 10;
    doc.text(`Name: ${candidate.name}`, margin, yPos);
    yPos += 10;
    doc.text('Date: _________________', margin, yPos);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('This document is confidential and intended for the named recipient only.', pageWidth / 2, footerY, { align: 'center' });

    return doc;
};

// Download offer PDF
export const downloadOfferPDF = (offer, candidate, job) => {
    const doc = generateOfferPDF(offer, candidate, job);
    const fileName = `Offer_Letter_${candidate.name.replace(/\s+/g, '_')}_${formatDate(new Date()).replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
};

// Get PDF as blob for email
export const getOfferPDFBlob = (offer, candidate, job) => {
    const doc = generateOfferPDF(offer, candidate, job);
    return doc.output('blob');
};

// Get PDF as data URL for preview
export const getOfferPDFDataUrl = (offer, candidate, job) => {
    const doc = generateOfferPDF(offer, candidate, job);
    return doc.output('dataurlstring');
};
