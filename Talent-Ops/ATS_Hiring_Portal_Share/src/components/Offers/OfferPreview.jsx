import { formatDate, formatCurrency } from '../../utils/helpers';
import { Download, X } from 'lucide-react';

const OfferPreview = ({ offer, candidate, job, onDownload, onClose }) => {
    if (!offer || !candidate || !job) {
        return (
            <div className="preview-error">
                <p>Unable to load offer preview. Missing required data.</p>
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
        );
    }

    return (
        <div className="offer-preview">
            <div className="preview-document">
                {/* Company Header */}
                <div className="doc-header">
                    <div className="company-logo">
                        <span className="logo-text">TalentAcq</span>
                        <span className="logo-subtitle">Talent Acquisition System</span>
                    </div>
                </div>

                {/* Title */}
                <h1 className="doc-title">OFFER OF EMPLOYMENT</h1>

                {/* Date */}
                <p className="doc-date">Date: {formatDate(offer.createdAt || new Date())}</p>

                {/* Greeting */}
                <p className="greeting">Dear <strong>{candidate.name}</strong>,</p>

                {/* Opening */}
                <p className="paragraph">
                    We are pleased to extend this offer of employment to you for the position of
                    <strong> {job.title}</strong> at our company. We were impressed with your
                    qualifications and believe you will be a valuable addition to our team.
                </p>

                {/* Position Details */}
                <div className="section">
                    <h2>Position Details</h2>
                    <div className="details-table">
                        <div className="detail-row">
                            <span className="label">Position:</span>
                            <span className="value">{job.title}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Department:</span>
                            <span className="value">{job.department}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Location:</span>
                            <span className="value">{offer.location || job.location}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Start Date:</span>
                            <span className="value">{formatDate(offer.joiningDate)}</span>
                        </div>
                        {offer.reportingManager && (
                            <div className="detail-row">
                                <span className="label">Reporting To:</span>
                                <span className="value">{offer.reportingManager}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Compensation */}
                <div className="section">
                    <h2>Compensation Package</h2>
                    <div className="details-table">
                        <div className="detail-row">
                            <span className="label">Base Salary:</span>
                            <span className="value">{formatCurrency(offer.baseSalary)} per annum</span>
                        </div>
                        {offer.bonus && (
                            <div className="detail-row">
                                <span className="label">Bonus:</span>
                                <span className="value">{formatCurrency(offer.bonus)} (performance-based)</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Benefits */}
                {offer.benefits && offer.benefits.length > 0 && (
                    <div className="section">
                        <h2>Benefits</h2>
                        <ul className="benefits-list">
                            {offer.benefits.map((benefit, index) => (
                                <li key={index}>{benefit}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Terms */}
                <p className="paragraph">
                    This offer is contingent upon successful completion of background verification
                    and any other pre-employment requirements. This offer will remain valid until
                    <strong> {formatDate(offer.expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}</strong>.
                </p>

                {/* Closing */}
                <p className="paragraph">
                    We are excited about the possibility of you joining our team and look forward
                    to your positive response. Please sign and return a copy of this letter to
                    confirm your acceptance.
                </p>

                <p className="closing">Sincerely,</p>

                <div className="signature">
                    <p className="signatory-name">{offer.signatoryName || 'HR Department'}</p>
                    <p className="signatory-title">{offer.signatoryTitle || 'Human Resources'}</p>
                </div>

                {/* Acceptance Section */}
                <div className="acceptance-section">
                    <h2>Candidate Acceptance</h2>
                    <p>I accept this offer of employment as described above.</p>
                    <div className="signature-lines">
                        <div className="sig-line">
                            <span className="line">_______________________________</span>
                            <span className="label">Signature</span>
                        </div>
                        <div className="sig-line">
                            <span className="line">{candidate.name}</span>
                            <span className="label">Name</span>
                        </div>
                        <div className="sig-line">
                            <span className="line">_________________</span>
                            <span className="label">Date</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="doc-footer">
                    <p>This document is confidential and intended for the named recipient only.</p>
                </div>
            </div>

            {/* Actions */}
            <div className="preview-actions">
                <button className="btn btn-secondary" onClick={onClose}>
                    <X size={18} />
                    Close
                </button>
                <button className="btn btn-primary" onClick={onDownload}>
                    <Download size={18} />
                    Download PDF
                </button>
            </div>

            <style>{`
        .offer-preview {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .preview-document {
          background: white;
          color: #1a1a1a;
          padding: 48px;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          font-family: 'Georgia', serif;
          line-height: 1.6;
        }

        .doc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #8b5cf6;
        }

        .company-logo {
          display: flex;
          flex-direction: column;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 700;
          color: #8b5cf6;
          font-family: 'Inter', sans-serif;
        }

        .logo-subtitle {
          font-size: 12px;
          color: #666;
          font-family: 'Inter', sans-serif;
        }

        .doc-title {
          font-size: 20px;
          font-weight: 600;
          text-align: center;
          margin: 24px 0;
          color: #1a1a1a;
          font-family: 'Inter', sans-serif;
        }

        .doc-date {
          font-size: 14px;
          color: #666;
          margin-bottom: 24px;
        }

        .greeting {
          font-size: 16px;
          margin-bottom: 16px;
        }

        .paragraph {
          font-size: 14px;
          margin-bottom: 16px;
          text-align: justify;
        }

        .section {
          margin: 24px 0;
        }

        .section h2 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #333;
          font-family: 'Inter', sans-serif;
        }

        .details-table {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-row {
          display: flex;
          font-size: 14px;
        }

        .detail-row .label {
          width: 140px;
          font-weight: 600;
          color: #333;
        }

        .detail-row .value {
          flex: 1;
          color: #1a1a1a;
        }

        .benefits-list {
          list-style: disc;
          padding-left: 24px;
          font-size: 14px;
        }

        .benefits-list li {
          margin-bottom: 4px;
        }

        .closing {
          margin-top: 24px;
          font-size: 14px;
        }

        .signature {
          margin-top: 32px;
        }

        .signatory-name {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
        }

        .signatory-title {
          font-size: 14px;
          color: #666;
        }

        .acceptance-section {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 2px solid #8b5cf6;
        }

        .acceptance-section h2 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          font-family: 'Inter', sans-serif;
        }

        .acceptance-section p {
          font-size: 14px;
          margin-bottom: 24px;
        }

        .signature-lines {
          display: flex;
          gap: 48px;
          flex-wrap: wrap;
        }

        .sig-line {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sig-line .line {
          font-size: 14px;
          min-width: 150px;
        }

        .sig-line .label {
          font-size: 12px;
          color: #666;
        }

        .doc-footer {
          margin-top: 48px;
          padding-top: 16px;
          border-top: 1px solid #ddd;
          text-align: center;
        }

        .doc-footer p {
          font-size: 12px;
          color: #999;
        }

        .preview-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
        }

        .preview-error {
          text-align: center;
          padding: var(--spacing-xl);
        }

        @media (max-width: 768px) {
          .preview-document {
            padding: 24px;
          }

          .signature-lines {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
        </div>
    );
};

export default OfferPreview;
