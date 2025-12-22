import { useState } from 'react';
import { formatCurrency } from '../../utils/helpers';
import { DollarSign, Calendar, User, Building } from 'lucide-react';

const OfferForm = ({ offer, candidates, jobs, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        candidateId: offer?.candidateId || '',
        candidateName: offer?.candidateName || '',
        jobId: offer?.jobId || '',
        jobTitle: offer?.jobTitle || '',
        baseSalary: offer?.baseSalary || '',
        bonus: offer?.bonus || '',
        joiningDate: offer?.joiningDate ? new Date(offer.joiningDate).toISOString().split('T')[0] : '',
        location: offer?.location || '',
        reportingManager: offer?.reportingManager || '',
        signatoryName: offer?.signatoryName || 'HR Department',
        signatoryTitle: offer?.signatoryTitle || 'Human Resources',
        benefits: offer?.benefits || [
            'Health Insurance',
            'Paid Time Off',
            '401(k) Matching',
            'Remote Work Options'
        ],
        expiryDate: offer?.expiryDate
            ? new Date(offer.expiryDate).toISOString().split('T')[0]
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: offer?.status || 'draft'
    });

    const [benefitInput, setBenefitInput] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-fill candidate and job info
            if (name === 'candidateId') {
                const selectedCandidate = candidates.find(c => c.id === value);
                if (selectedCandidate) {
                    newData.candidateName = selectedCandidate.name;
                    newData.jobId = selectedCandidate.jobId;
                    newData.jobTitle = selectedCandidate.jobTitle;

                    const job = jobs.find(j => j.id === selectedCandidate.jobId);
                    if (job) {
                        newData.location = job.location;
                    }
                }
            }

            return newData;
        });
    };

    const addBenefit = () => {
        if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
            setFormData(prev => ({
                ...prev,
                benefits: [...prev.benefits, benefitInput.trim()]
            }));
            setBenefitInput('');
        }
    };

    const removeBenefit = (benefit) => {
        setFormData(prev => ({
            ...prev,
            benefits: prev.benefits.filter(b => b !== benefit)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            baseSalary: parseInt(formData.baseSalary, 10),
            bonus: formData.bonus ? parseInt(formData.bonus, 10) : null,
            joiningDate: new Date(formData.joiningDate).toISOString(),
            expiryDate: new Date(formData.expiryDate).toISOString()
        });
    };

    return (
        <form onSubmit={handleSubmit} className="offer-form">
            <div className="form-section">
                <h3><User size={18} /> Candidate Information</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Candidate *</label>
                        <select
                            name="candidateId"
                            className="form-select"
                            value={formData.candidateId}
                            onChange={handleChange}
                            required
                            disabled={!!offer}
                        >
                            <option value="">Select Candidate</option>
                            {candidates.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} - {c.jobTitle}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Position</label>
                        <input
                            type="text"
                            name="jobTitle"
                            className="form-input"
                            value={formData.jobTitle}
                            readOnly
                            disabled
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3><DollarSign size={18} /> Compensation</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Base Salary (Annual) *</label>
                        <input
                            type="number"
                            name="baseSalary"
                            className="form-input"
                            placeholder="e.g., 120000"
                            value={formData.baseSalary}
                            onChange={handleChange}
                            required
                        />
                        {formData.baseSalary && (
                            <span className="input-hint">{formatCurrency(formData.baseSalary)} per annum</span>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Performance Bonus</label>
                        <input
                            type="number"
                            name="bonus"
                            className="form-input"
                            placeholder="e.g., 15000"
                            value={formData.bonus}
                            onChange={handleChange}
                        />
                        {formData.bonus && (
                            <span className="input-hint">{formatCurrency(formData.bonus)} bonus</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3><Calendar size={18} /> Employment Details</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Joining Date *</label>
                        <input
                            type="date"
                            name="joiningDate"
                            className="form-input"
                            value={formData.joiningDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Offer Expires On</label>
                        <input
                            type="date"
                            name="expiryDate"
                            className="form-input"
                            value={formData.expiryDate}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Work Location</label>
                        <input
                            type="text"
                            name="location"
                            className="form-input"
                            placeholder="e.g., New York, NY / Remote"
                            value={formData.location}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Reporting Manager</label>
                        <input
                            type="text"
                            name="reportingManager"
                            className="form-input"
                            placeholder="e.g., John Smith"
                            value={formData.reportingManager}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3><Building size={18} /> Benefits</h3>
                <div className="benefits-wrapper">
                    <div className="benefits-input">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Add a benefit..."
                            value={benefitInput}
                            onChange={(e) => setBenefitInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addBenefit();
                                }
                            }}
                        />
                        <button type="button" className="btn btn-secondary" onClick={addBenefit}>
                            Add
                        </button>
                    </div>
                    <div className="benefits-list">
                        {formData.benefits.map((benefit, index) => (
                            <span key={index} className="benefit-tag">
                                {benefit}
                                <button type="button" onClick={() => removeBenefit(benefit)}>×</button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3>Signatory</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Signatory Name</label>
                        <input
                            type="text"
                            name="signatoryName"
                            className="form-input"
                            placeholder="e.g., Jane Doe"
                            value={formData.signatoryName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Signatory Title</label>
                        <input
                            type="text"
                            name="signatoryTitle"
                            className="form-input"
                            placeholder="e.g., HR Director"
                            value={formData.signatoryTitle}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                    {offer ? 'Update Offer' : 'Create Offer'}
                </button>
            </div>

            <style>{`
        .offer-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .form-section {
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--border-secondary);
        }

        .form-section:last-of-type {
          border-bottom: none;
        }

        .form-section h3 {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: 1rem;
          margin-bottom: var(--spacing-lg);
          color: var(--accent-secondary);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg);
        }

        .input-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--accent-secondary);
          margin-top: var(--spacing-xs);
        }

        .benefits-wrapper {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .benefits-input {
          display: flex;
          gap: var(--spacing-sm);
        }

        .benefits-input .form-input {
          flex: 1;
        }

        .benefits-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .benefit-tag {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-md);
          background: var(--accent-glow);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          color: var(--accent-tertiary);
        }

        .benefit-tag button {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 0 2px;
          font-size: 1.25rem;
          line-height: 1;
          opacity: 0.7;
        }

        .benefit-tag button:hover {
          opacity: 1;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--border-secondary);
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </form>
    );
};

export default OfferForm;
