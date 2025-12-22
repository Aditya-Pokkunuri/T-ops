import { useState } from 'react';
import { RATING_CRITERIA, RECOMMENDATIONS } from '../../utils/constants';
import { Star, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

const FeedbackForm = ({ interview, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        ratings: RATING_CRITERIA.reduce((acc, c) => ({ ...acc, [c.id]: 3 }), {}),
        comments: '',
        strengths: '',
        weaknesses: '',
        recommendation: 'hold'
    });

    const handleRatingChange = (criteriaId, rating) => {
        setFormData(prev => ({
            ...prev,
            ratings: { ...prev.ratings, [criteriaId]: rating }
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const calculateOverallRating = () => {
        const ratings = Object.values(formData.ratings);
        return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
    };

    return (
        <form onSubmit={handleSubmit} className="feedback-form">
            {/* Candidate Info */}
            <div className="interview-info">
                <div className="info-row">
                    <span className="label">Candidate:</span>
                    <span className="value">{interview.candidateName}</span>
                </div>
                <div className="info-row">
                    <span className="label">Position:</span>
                    <span className="value">{interview.jobTitle}</span>
                </div>
                <div className="info-row">
                    <span className="label">Round:</span>
                    <span className="value capitalize">{interview.panelType} Round</span>
                </div>
            </div>

            {/* Rating Criteria */}
            <div className="ratings-section">
                <h3>Performance Ratings</h3>
                <p className="section-desc">Rate the candidate on a scale of 1-5 for each criteria</p>

                <div className="ratings-grid">
                    {RATING_CRITERIA.map(criteria => (
                        <div key={criteria.id} className="rating-row">
                            <div className="rating-info">
                                <span className="rating-name">{criteria.name}</span>
                                <span className="rating-weight">(Weight: {criteria.weight * 100}%)</span>
                            </div>
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`star-btn ${formData.ratings[criteria.id] >= star ? 'filled' : ''}`}
                                        onClick={() => handleRatingChange(criteria.id, star)}
                                    >
                                        <Star size={24} />
                                    </button>
                                ))}
                                <span className="rating-value">{formData.ratings[criteria.id]}/5</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="overall-rating">
                    <span>Overall Rating:</span>
                    <span className="overall-value">{calculateOverallRating()}/5</span>
                </div>
            </div>

            {/* Comments */}
            <div className="form-group">
                <label className="form-label">General Comments *</label>
                <textarea
                    name="comments"
                    className="form-textarea"
                    placeholder="Provide detailed feedback about the candidate's performance..."
                    rows={4}
                    value={formData.comments}
                    onChange={handleChange}
                    required
                />
            </div>

            {/* Strengths & Weaknesses */}
            <div className="sw-grid">
                <div className="form-group">
                    <label className="form-label">
                        <ThumbsUp size={16} className="text-success" />
                        Key Strengths
                    </label>
                    <textarea
                        name="strengths"
                        className="form-textarea"
                        placeholder="What did the candidate do well?"
                        rows={3}
                        value={formData.strengths}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">
                        <ThumbsDown size={16} className="text-error" />
                        Areas for Improvement
                    </label>
                    <textarea
                        name="weaknesses"
                        className="form-textarea"
                        placeholder="What areas need improvement?"
                        rows={3}
                        value={formData.weaknesses}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* Recommendation */}
            <div className="form-group">
                <label className="form-label">Final Recommendation *</label>
                <div className="recommendation-options">
                    <label
                        className={`rec-option hire ${formData.recommendation === 'hire' ? 'selected' : ''}`}
                    >
                        <input
                            type="radio"
                            name="recommendation"
                            value="hire"
                            checked={formData.recommendation === 'hire'}
                            onChange={handleChange}
                        />
                        <ThumbsUp size={24} />
                        <span className="rec-label">Hire</span>
                        <span className="rec-desc">Strong candidate, recommend hiring</span>
                    </label>
                    <label
                        className={`rec-option hold ${formData.recommendation === 'hold' ? 'selected' : ''}`}
                    >
                        <input
                            type="radio"
                            name="recommendation"
                            value="hold"
                            checked={formData.recommendation === 'hold'}
                            onChange={handleChange}
                        />
                        <Minus size={24} />
                        <span className="rec-label">Hold</span>
                        <span className="rec-desc">Need more evaluation</span>
                    </label>
                    <label
                        className={`rec-option reject ${formData.recommendation === 'reject' ? 'selected' : ''}`}
                    >
                        <input
                            type="radio"
                            name="recommendation"
                            value="reject"
                            checked={formData.recommendation === 'reject'}
                            onChange={handleChange}
                        />
                        <ThumbsDown size={24} />
                        <span className="rec-label">Reject</span>
                        <span className="rec-desc">Not a good fit</span>
                    </label>
                </div>
            </div>

            <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                    Submit Feedback
                </button>
            </div>

            <style>{`
        .feedback-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .interview-info {
          display: flex;
          gap: var(--spacing-xl);
          padding: var(--spacing-md);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }

        .info-row {
          display: flex;
          gap: var(--spacing-sm);
        }

        .info-row .label {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .info-row .value {
          font-weight: 500;
          font-size: 0.875rem;
        }

        .capitalize {
          text-transform: capitalize;
        }

        .ratings-section h3 {
          font-size: 1.125rem;
          margin-bottom: var(--spacing-xs);
        }

        .section-desc {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-lg);
        }

        .ratings-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .rating-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md);
          background: var(--bg-glass);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
        }

        .rating-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .rating-name {
          font-weight: 500;
        }

        .rating-weight {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .star-rating {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .star-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }

        .star-btn:hover,
        .star-btn.filled {
          color: #fbbf24;
        }

        .star-btn.filled svg {
          fill: #fbbf24;
        }

        .rating-value {
          font-size: 0.875rem;
          font-weight: 500;
          min-width: 40px;
          text-align: center;
        }

        .overall-rating {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--accent-glow);
          border-radius: var(--radius-md);
        }

        .overall-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .sw-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg);
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .text-success { color: var(--status-success); }
        .text-error { color: var(--status-error); }

        .recommendation-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-md);
        }

        .rec-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--spacing-lg);
          background: var(--bg-glass);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .rec-option input {
          display: none;
        }

        .rec-option:hover {
          border-color: var(--border-accent);
        }

        .rec-option.hire.selected {
          border-color: var(--status-success);
          background: rgba(16, 185, 129, 0.1);
        }

        .rec-option.hire.selected svg {
          color: var(--status-success);
        }

        .rec-option.hold.selected {
          border-color: var(--status-warning);
          background: rgba(245, 158, 11, 0.1);
        }

        .rec-option.hold.selected svg {
          color: var(--status-warning);
        }

        .rec-option.reject.selected {
          border-color: var(--status-error);
          background: rgba(239, 68, 68, 0.1);
        }

        .rec-option.reject.selected svg {
          color: var(--status-error);
        }

        .rec-option svg {
          margin-bottom: var(--spacing-sm);
          color: var(--text-muted);
        }

        .rec-label {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 4px;
        }

        .rec-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--border-secondary);
        }

        @media (max-width: 768px) {
          .interview-info {
            flex-direction: column;
            gap: var(--spacing-sm);
          }

          .sw-grid,
          .recommendation-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </form>
    );
};

export default FeedbackForm;
