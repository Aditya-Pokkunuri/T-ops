import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Common/Toast';
import Modal from '../components/Common/Modal';
import FeedbackForm from '../components/Feedback/FeedbackForm';
import {
    Search,
    Filter,
    MessageSquare,
    Star,
    ThumbsUp,
    ThumbsDown,
    Minus,
    User,
    Calendar,
    Briefcase
} from 'lucide-react';
import { RATING_CRITERIA, RECOMMENDATIONS } from '../utils/constants';
import { formatDate, getInitials } from '../utils/helpers';

const Feedback = () => {
    const {
        feedback,
        interviews,
        candidates,
        createFeedback,
        updateFeedback,
        getAggregateFeedback
    } = useData();
    const { user, users, hasPermission, isInterviewer } = useAuth();
    const { success, error } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [recommendationFilter, setRecommendationFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [viewingFeedback, setViewingFeedback] = useState(null);

    // Get interviews that need feedback from current user
    const myPendingInterviews = interviews.filter(i =>
        i.status === 'completed' &&
        i.interviewers?.includes(user?.id) &&
        !feedback.some(f => f.interviewId === i.id && f.interviewerId === user?.id)
    );

    // Filter feedback
    let filteredFeedback = feedback;

    // Apply search
    filteredFeedback = filteredFeedback.filter(f => {
        const matchesSearch = !searchQuery ||
            f.candidateName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRecommendation = recommendationFilter === 'all' ||
            f.recommendation === recommendationFilter;
        return matchesSearch && matchesRecommendation;
    });

    // Sort by date
    filteredFeedback = [...filteredFeedback].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    const handleSubmitFeedback = async (data) => {
        try {
            await createFeedback({
                ...data,
                interviewId: selectedInterview.id,
                candidateId: selectedInterview.candidateId,
                candidateName: selectedInterview.candidateName,
                jobId: selectedInterview.jobId,
                jobTitle: selectedInterview.jobTitle,
                interviewerId: user.id,
                interviewerName: user.name,
                panelType: selectedInterview.panelType
            });
            setShowModal(false);
            setSelectedInterview(null);
            success('Feedback submitted successfully!');
        } catch (err) {
            error('Failed to submit feedback');
        }
    };

    const getRecommendationIcon = (rec) => {
        switch (rec) {
            case 'hire': return <ThumbsUp size={16} className="text-success" />;
            case 'reject': return <ThumbsDown size={16} className="text-error" />;
            default: return <Minus size={16} className="text-warning" />;
        }
    };

    const getRecommendationBadge = (rec) => {
        const badges = {
            hire: { label: 'Hire', class: 'badge-success' },
            hold: { label: 'Hold', class: 'badge-warning' },
            reject: { label: 'Reject', class: 'badge-error' }
        };
        return badges[rec] || badges.hold;
    };

    const renderStars = (rating) => {
        return (
            <div className="stars">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        size={14}
                        className={star <= rating ? 'filled' : ''}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="feedback-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Feedback</h1>
                    <p className="page-subtitle">Submit and review interview feedback</p>
                </div>
            </div>

            {/* Pending Feedback Alert */}
            {hasPermission('canSubmitFeedback') && myPendingInterviews.length > 0 && (
                <div className="pending-alert glass-card mb-xl">
                    <div className="alert-icon">
                        <MessageSquare size={24} />
                    </div>
                    <div className="alert-content">
                        <h3>You have {myPendingInterviews.length} pending feedback submission(s)</h3>
                        <p>Please submit feedback for completed interviews</p>
                    </div>
                    <div className="pending-interviews">
                        {myPendingInterviews.slice(0, 3).map(interview => (
                            <button
                                key={interview.id}
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                    setSelectedInterview(interview);
                                    setShowModal(true);
                                }}
                            >
                                {interview.candidateName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by candidate..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <Filter size={18} />
                    <select
                        className="form-select"
                        value={recommendationFilter}
                        onChange={(e) => setRecommendationFilter(e.target.value)}
                    >
                        <option value="all">All Recommendations</option>
                        <option value="hire">Hire</option>
                        <option value="hold">Hold</option>
                        <option value="reject">Reject</option>
                    </select>
                </div>
            </div>

            {/* Feedback List */}
            {filteredFeedback.length > 0 ? (
                <div className="feedback-grid">
                    {filteredFeedback.map(fb => {
                        const recBadge = getRecommendationBadge(fb.recommendation);
                        const interviewer = users.find(u => u.id === fb.interviewerId);

                        return (
                            <div key={fb.id} className="feedback-card glass-card">
                                <div className="card-header">
                                    <div className="candidate-info">
                                        <div className="avatar">
                                            {getInitials(fb.candidateName)}
                                        </div>
                                        <div>
                                            <h3>{fb.candidateName}</h3>
                                            <p>{fb.jobTitle}</p>
                                        </div>
                                    </div>
                                    <span className={`badge ${recBadge.class}`}>
                                        {getRecommendationIcon(fb.recommendation)}
                                        {recBadge.label}
                                    </span>
                                </div>

                                <div className="card-body">
                                    {/* Ratings */}
                                    <div className="ratings-summary">
                                        {Object.entries(fb.ratings || {}).map(([key, value]) => {
                                            const criteria = RATING_CRITERIA.find(c => c.id === key);
                                            return (
                                                <div key={key} className="rating-item">
                                                    <span className="rating-label">{criteria?.name || key}</span>
                                                    {renderStars(value)}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Comments */}
                                    {fb.comments && (
                                        <div className="comments-section">
                                            <h4>Comments</h4>
                                            <p>{fb.comments}</p>
                                        </div>
                                    )}

                                    {/* Strengths & Weaknesses */}
                                    {(fb.strengths || fb.weaknesses) && (
                                        <div className="sw-section">
                                            {fb.strengths && (
                                                <div className="sw-item strengths">
                                                    <h5><ThumbsUp size={14} /> Strengths</h5>
                                                    <p>{fb.strengths}</p>
                                                </div>
                                            )}
                                            {fb.weaknesses && (
                                                <div className="sw-item weaknesses">
                                                    <h5><ThumbsDown size={14} /> Areas for Improvement</h5>
                                                    <p>{fb.weaknesses}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="card-footer">
                                    <div className="meta-info">
                                        <div className="meta-item">
                                            <User size={14} />
                                            <span>{interviewer?.name || fb.interviewerName}</span>
                                        </div>
                                        <div className="meta-item">
                                            <Briefcase size={14} />
                                            <span className="capitalize">{fb.panelType} Round</span>
                                        </div>
                                        <div className="meta-item">
                                            <Calendar size={14} />
                                            <span>{formatDate(fb.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state glass-card">
                    <div className="icon">
                        <MessageSquare size={48} />
                    </div>
                    <h3>No feedback found</h3>
                    <p>
                        {searchQuery || recommendationFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Complete interviews to see feedback here'}
                    </p>
                </div>
            )}

            {/* Feedback Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedInterview(null);
                }}
                title="Submit Interview Feedback"
                size="lg"
            >
                {selectedInterview && (
                    <FeedbackForm
                        interview={selectedInterview}
                        onSubmit={handleSubmitFeedback}
                        onCancel={() => {
                            setShowModal(false);
                            setSelectedInterview(null);
                        }}
                    />
                )}
            </Modal>

            <style>{`
        .feedback-page {
          animation: fadeIn var(--transition-normal);
        }

        .pending-alert {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-lg);
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
        }

        .alert-icon {
          width: 48px;
          height: 48px;
          background: rgba(245, 158, 11, 0.2);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--status-warning);
          flex-shrink: 0;
        }

        .alert-content {
          flex: 1;
        }

        .alert-content h3 {
          font-size: 1rem;
          margin-bottom: 4px;
        }

        .alert-content p {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .pending-interviews {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .filters-bar {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--text-secondary);
        }

        .filter-group .form-select {
          min-width: 180px;
        }

        .feedback-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: var(--spacing-lg);
        }

        .feedback-card .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--spacing-md);
        }

        .feedback-card .candidate-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .feedback-card .candidate-info h3 {
          font-size: 1.0625rem;
          font-weight: 600;
        }

        .feedback-card .candidate-info p {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .feedback-card .badge {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .text-success { color: var(--status-success); }
        .text-error { color: var(--status-error); }
        .text-warning { color: var(--status-warning); }

        .ratings-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
        }

        .rating-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }

        .rating-label {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .stars {
          display: flex;
          gap: 2px;
        }

        .stars svg {
          color: var(--text-muted);
        }

        .stars svg.filled {
          color: #fbbf24;
          fill: #fbbf24;
        }

        .comments-section {
          margin-bottom: var(--spacing-md);
        }

        .comments-section h4 {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .comments-section p {
          font-size: 0.9375rem;
          color: var(--text-primary);
          line-height: 1.5;
        }

        .sw-section {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
        }

        .sw-item h5 {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.8125rem;
          margin-bottom: var(--spacing-xs);
        }

        .sw-item.strengths h5 { color: var(--status-success); }
        .sw-item.weaknesses h5 { color: var(--status-error); }

        .sw-item p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .feedback-card .card-footer {
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border-secondary);
        }

        .meta-info {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .capitalize {
          text-transform: capitalize;
        }

        @media (max-width: 768px) {
          .ratings-summary,
          .sw-section {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

export default Feedback;
