import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Common/Toast';
import Modal from '../components/Common/Modal';
import ResumeCard from '../components/Candidates/ResumeCard';
import {
    Search,
    Filter,
    Plus,
    Users,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Calendar,
    FileText,
    ArrowLeft,
    Edit,
    Trash2,
    ChevronRight
} from 'lucide-react';
import { PIPELINE_STAGES, DEPARTMENTS } from '../utils/constants';
import { formatDate, getRelativeTime, getInitials } from '../utils/helpers';

const Candidates = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        candidates,
        jobs,
        getInterviewsByCandidate,
        getFeedbackByCandidate,
        getAggregateFeedback,
        createCandidate,
        updateCandidate,
        deleteCandidate
    } = useData();
    const { hasPermission } = useAuth();
    const { success, error } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState('all');
    const [jobFilter, setJobFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [candidateToDelete, setCandidateToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const canManage = hasPermission('canManageCandidates');

    // If viewing single candidate
    if (id) {
        const candidate = candidates.find(c => c.id === id);
        if (!candidate) {
            return (
                <div className="candidate-not-found">
                    <h2>Candidate not found</h2>
                    <button className="btn btn-secondary" onClick={() => navigate('/candidates')}>
                        <ArrowLeft size={18} />
                        Back to Candidates
                    </button>
                </div>
            );
        }

        const interviews = getInterviewsByCandidate(id);
        const feedback = getFeedbackByCandidate(id);
        const aggregateFeedback = getAggregateFeedback(id);
        const job = jobs.find(j => j.id === candidate.jobId);
        const stage = PIPELINE_STAGES.find(s => s.id === candidate.stage);

        return (
            <div className="candidate-profile">
                <button className="btn btn-ghost mb-lg" onClick={() => navigate('/candidates')}>
                    <ArrowLeft size={18} />
                    Back to Candidates
                </button>

                <div className="profile-grid">
                    {/* Main Info */}
                    <div className="profile-main glass-card">
                        <div className="profile-header">
                            <div className="avatar avatar-lg" style={{ background: `linear-gradient(135deg, ${stage?.color || '#8b5cf6'}, ${stage?.color || '#8b5cf6'}88)` }}>
                                {getInitials(candidate.name)}
                            </div>
                            <div className="profile-info">
                                <h1>{candidate.name}</h1>
                                <p className="job-title">{candidate.jobTitle}</p>
                                <span
                                    className="badge"
                                    style={{
                                        background: `${stage?.color}20`,
                                        color: stage?.color
                                    }}
                                >
                                    {stage?.name || candidate.stage}
                                </span>
                            </div>
                            {canManage && (
                                <div className="profile-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setEditingCandidate(candidate);
                                            setShowModal(true);
                                        }}
                                    >
                                        <Edit size={18} />
                                        Edit
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="contact-info">
                            <a href={`mailto:${candidate.email}`} className="contact-item">
                                <Mail size={16} />
                                {candidate.email}
                            </a>
                            {candidate.phone && (
                                <a href={`tel:${candidate.phone}`} className="contact-item">
                                    <Phone size={16} />
                                    {candidate.phone}
                                </a>
                            )}
                        </div>

                        {candidate.skills && candidate.skills.length > 0 && (
                            <div className="section">
                                <h3>Skills</h3>
                                <div className="skills-list">
                                    {candidate.skills.map((skill, i) => (
                                        <span key={i} className="skill-tag">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {candidate.notes && (
                            <div className="section">
                                <h3>Notes</h3>
                                <p className="notes-text">{candidate.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="profile-sidebar">
                        {/* Quick Info */}
                        <div className="sidebar-card glass-card">
                            <h3>Quick Info</h3>
                            <div className="info-list">
                                <div className="info-item">
                                    <Briefcase size={16} />
                                    <span>{job?.department || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <MapPin size={16} />
                                    <span>{job?.location || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <Calendar size={16} />
                                    <span>Applied {formatDate(candidate.appliedAt)}</span>
                                </div>
                                {candidate.experience && (
                                    <div className="info-item">
                                        <FileText size={16} />
                                        <span>{candidate.experience} experience</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resume Card */}
                        <ResumeCard candidate={candidate} />

                        {/* Feedback Summary */}
                        {aggregateFeedback && (
                            <div className="sidebar-card glass-card">
                                <h3>Feedback Summary</h3>
                                <div className="feedback-summary">
                                    <div className="recommendation">
                                        <span className="label">Recommendation:</span>
                                        <span className={`badge badge-${aggregateFeedback.overallRecommendation === 'hire' ? 'success' : aggregateFeedback.overallRecommendation === 'hold' ? 'warning' : 'error'}`}>
                                            {aggregateFeedback.overallRecommendation}
                                        </span>
                                    </div>
                                    <div className="feedback-count">
                                        {aggregateFeedback.totalFeedback} feedback(s) received
                                    </div>
                                    <div className="vote-breakdown">
                                        <div className="vote-item">
                                            <span>Hire</span>
                                            <span className="count">{aggregateFeedback.recommendations.hire}</span>
                                        </div>
                                        <div className="vote-item">
                                            <span>Hold</span>
                                            <span className="count">{aggregateFeedback.recommendations.hold}</span>
                                        </div>
                                        <div className="vote-item">
                                            <span>Reject</span>
                                            <span className="count">{aggregateFeedback.recommendations.reject}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Interview History */}
                        <div className="sidebar-card glass-card">
                            <h3>Interview History</h3>
                            {interviews.length > 0 ? (
                                <div className="interview-timeline">
                                    {interviews.map(interview => (
                                        <div key={interview.id} className="timeline-item">
                                            <div className={`timeline-dot ${interview.status}`} />
                                            <div className="timeline-content">
                                                <span className="interview-type">{interview.panelType} Round</span>
                                                <span className="interview-date">{formatDate(interview.scheduledAt)}</span>
                                                <span className={`badge badge-${interview.status === 'completed' ? 'success' : interview.status === 'cancelled' ? 'error' : 'info'}`}>
                                                    {interview.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">No interviews scheduled yet</p>
                            )}
                        </div>
                    </div>
                </div>

                <style>{`
          .candidate-profile {
            animation: fadeIn var(--transition-normal);
          }

          .profile-grid {
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: var(--spacing-xl);
          }

          .profile-main {
            padding: var(--spacing-xl);
          }

          .profile-header {
            display: flex;
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-xl);
          }

          .profile-info {
            flex: 1;
          }

          .profile-info h1 {
            font-size: 1.75rem;
            margin-bottom: var(--spacing-xs);
          }

          .profile-info .job-title {
            font-size: 1.125rem;
            color: var(--text-secondary);
            margin-bottom: var(--spacing-sm);
          }

          .contact-info {
            display: flex;
            gap: var(--spacing-xl);
            margin-bottom: var(--spacing-xl);
            padding-bottom: var(--spacing-xl);
            border-bottom: 1px solid var(--border-secondary);
          }

          .contact-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            color: var(--text-secondary);
            text-decoration: none;
            transition: color var(--transition-fast);
          }

          .contact-item:hover {
            color: var(--accent-primary);
          }

          .section {
            margin-bottom: var(--spacing-xl);
          }

          .section h3 {
            font-size: 1rem;
            margin-bottom: var(--spacing-md);
            color: var(--text-secondary);
          }

          .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-sm);
          }

          .skill-tag {
            padding: var(--spacing-xs) var(--spacing-md);
            background: var(--accent-glow);
            border-radius: var(--radius-full);
            font-size: 0.875rem;
            color: var(--accent-tertiary);
          }

          .notes-text {
            color: var(--text-primary);
            line-height: 1.6;
          }

          .profile-sidebar {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
          }

          .sidebar-card {
            padding: var(--spacing-lg);
          }

          .sidebar-card h3 {
            font-size: 1rem;
            margin-bottom: var(--spacing-md);
          }

          .info-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
          }

          .info-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            font-size: 0.9375rem;
            color: var(--text-secondary);
          }

          .feedback-summary {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .recommendation {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
          }

          .recommendation .label {
            color: var(--text-secondary);
          }

          .feedback-count {
            font-size: 0.875rem;
            color: var(--text-muted);
          }

          .vote-breakdown {
            display: flex;
            gap: var(--spacing-md);
          }

          .vote-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
            padding: var(--spacing-sm);
            background: var(--bg-tertiary);
            border-radius: var(--radius-md);
          }

          .vote-item span:first-child {
            font-size: 0.75rem;
            color: var(--text-secondary);
          }

          .vote-item .count {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
          }

          .interview-timeline {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .timeline-item {
            display: flex;
            gap: var(--spacing-md);
          }

          .timeline-dot {
            width: 12px;
            height: 12px;
            border-radius: var(--radius-full);
            margin-top: 4px;
            flex-shrink: 0;
          }

          .timeline-dot.scheduled { background: var(--status-info); }
          .timeline-dot.completed { background: var(--status-success); }
          .timeline-dot.cancelled { background: var(--status-error); }

          .timeline-content {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .interview-type {
            font-size: 0.9375rem;
            font-weight: 500;
            text-transform: capitalize;
          }

          .interview-date {
            font-size: 0.8125rem;
            color: var(--text-secondary);
          }

          .no-data {
            font-size: 0.875rem;
            color: var(--text-muted);
            text-align: center;
            padding: var(--spacing-lg) 0;
          }

          @media (max-width: 992px) {
            .profile-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

                {/* Edit Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setEditingCandidate(null);
                    }}
                    title="Edit Candidate"
                    size="lg"
                >
                    <CandidateForm
                        candidate={editingCandidate}
                        jobs={jobs}
                        onSubmit={async (data) => {
                            try {
                                await updateCandidate(editingCandidate.id, data);
                                setShowModal(false);
                                setEditingCandidate(null);
                                success('Candidate updated successfully!');
                            } catch (err) {
                                error(err.message || 'Failed to update candidate');
                            }
                        }}
                        onCancel={() => {
                            setShowModal(false);
                            setEditingCandidate(null);
                        }}
                    />
                </Modal>
            </div>
        );
    }

    // Candidate list view
    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = !searchQuery ||
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStage = stageFilter === 'all' || c.stage === stageFilter;
        const matchesJob = jobFilter === 'all' || c.jobId === jobFilter;

        return matchesSearch && matchesStage && matchesJob;
    });

    const initiateDelete = (candidate) => {
        // Check for linked interviews
        const linkedInterviews = getInterviewsByCandidate(candidate.id);
        const activeInterviews = linkedInterviews.filter(
            i => i.status !== 'completed' && i.status !== 'cancelled'
        );

        if (activeInterviews.length > 0) {
            error(`Cannot delete candidate. They have ${activeInterviews.length} active interview(s). Please cancel or complete them first.`);
            return;
        }

        setCandidateToDelete(candidate);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!candidateToDelete) return;

        setIsDeleting(true);
        try {
            await deleteCandidate(candidateToDelete.id);
            success('Candidate deleted successfully!');
            setShowDeleteModal(false);
            setCandidateToDelete(null);
        } catch (err) {
            error(err.message || 'Failed to delete candidate');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="candidates-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Candidates</h1>
                    <p className="page-subtitle">Manage all candidates in your recruitment pipeline</p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Add Candidate
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search candidates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        className="form-select"
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                    >
                        <option value="all">All Stages</option>
                        {PIPELINE_STAGES.map(stage => (
                            <option key={stage.id} value={stage.id}>{stage.name}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <select
                        className="form-select"
                        value={jobFilter}
                        onChange={(e) => setJobFilter(e.target.value)}
                    >
                        <option value="all">All Jobs</option>
                        {jobs.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Candidates Table */}
            {filteredCandidates.length > 0 ? (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Candidate</th>
                                <th>Applied For</th>
                                <th>Stage</th>
                                <th>Applied</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCandidates.map(candidate => {
                                const stage = PIPELINE_STAGES.find(s => s.id === candidate.stage);
                                return (
                                    <tr key={candidate.id}>
                                        <td>
                                            <div className="candidate-cell">
                                                <div className="avatar" style={{ background: `linear-gradient(135deg, ${stage?.color || '#8b5cf6'}, ${stage?.color || '#8b5cf6'}88)` }}>
                                                    {getInitials(candidate.name)}
                                                </div>
                                                <div>
                                                    <div className="candidate-name">{candidate.name}</div>
                                                    <div className="candidate-email">{candidate.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{candidate.jobTitle}</td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: `${stage?.color}20`,
                                                    color: stage?.color
                                                }}
                                            >
                                                {stage?.name || candidate.stage}
                                            </span>
                                        </td>
                                        <td>{getRelativeTime(candidate.appliedAt)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => navigate(`/candidates/${candidate.id}`)}
                                                >
                                                    View <ChevronRight size={16} />
                                                </button>
                                                {canManage && (
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => initiateDelete(candidate)}
                                                        title="Delete candidate"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state glass-card">
                    <div className="icon">
                        <Users size={48} />
                    </div>
                    <h3>No candidates found</h3>
                    <p>
                        {searchQuery || stageFilter !== 'all' || jobFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Add your first candidate to get started'}
                    </p>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingCandidate(null);
                }}
                title={editingCandidate ? 'Edit Candidate' : 'Add Candidate'}
                size="lg"
            >
                <CandidateForm
                    candidate={editingCandidate}
                    jobs={jobs}
                    onSubmit={async (data) => {
                        try {
                            if (editingCandidate) {
                                await updateCandidate(editingCandidate.id, data);
                            } else {
                                await createCandidate(data);
                            }
                            setShowModal(false);
                            setEditingCandidate(null);
                            success(editingCandidate ? 'Candidate updated!' : 'Candidate added!');
                        } catch (err) {
                            error('Operation failed');
                        }
                    }}
                    onCancel={() => {
                        setShowModal(false);
                        setEditingCandidate(null);
                    }}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    if (!isDeleting) {
                        setShowDeleteModal(false);
                        setCandidateToDelete(null);
                    }
                }}
                title="Delete Candidate"
                size="sm"
            >
                <div>
                    <p className="mb-lg">
                        Are you sure you want to delete <strong>{candidateToDelete?.name}</strong>?
                        This action cannot be undone and will permanently remove all candidate data.
                    </p>
                    <div className="flex justify-end gap-md">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setCandidateToDelete(null);
                            }}
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Candidate'}
                        </button>
                    </div>
                </div>
            </Modal>

            <style>{`
        .candidates-page {
          animation: fadeIn var(--transition-normal);
        }

        .filters-bar {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
          flex-wrap: wrap;
        }

        .filter-group .form-select {
          min-width: 160px;
        }

        .candidate-cell {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .candidate-name {
          font-weight: 500;
        }

        .candidate-email {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .action-buttons {
          display: flex;
          gap: var(--spacing-xs);
        }

        .mb-lg { margin-bottom: var(--spacing-lg); }
        .flex { display: flex; }
        .justify-end { justify-content: flex-end; }
        .gap-md { gap: var(--spacing-md); }
        .btn-danger {
          background: var(--status-error);
          color: white;
          border: none;
        }
        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }
        .btn-danger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
};

// Simple Candidate Form Component
const CandidateForm = ({ candidate, jobs, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: candidate?.name || '',
        email: candidate?.email || '',
        phone: candidate?.phone || '',
        jobId: candidate?.jobId || '',
        jobTitle: candidate?.jobTitle || '',
        stage: candidate?.stage || 'applied',
        skills: candidate?.skills || [],
        experience: candidate?.experience || '',
        notes: candidate?.notes || ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            // Auto-fill job title when job is selected
            if (name === 'jobId') {
                const selectedJob = jobs.find(j => j.id === value);
                if (selectedJob) {
                    newData.jobTitle = selectedJob.title;
                }
            }
            return newData;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="candidate-form">
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                        type="text"
                        name="name"
                        className="form-input"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                        type="email"
                        name="email"
                        className="form-input"
                        placeholder="john@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                        type="text"
                        name="phone"
                        className="form-input"
                        placeholder="+1 555-0123"
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Apply for Job *</label>
                    <select
                        name="jobId"
                        className="form-select"
                        value={formData.jobId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Job</option>
                        {jobs.filter(j => j.status === 'published').map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Experience</label>
                    <input
                        type="text"
                        name="experience"
                        className="form-input"
                        placeholder="e.g., 5 years"
                        value={formData.experience}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Stage</label>
                    <select
                        name="stage"
                        className="form-select"
                        value={formData.stage}
                        onChange={handleChange}
                    >
                        {PIPELINE_STAGES.map(stage => (
                            <option key={stage.id} value={stage.id}>{stage.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                    name="notes"
                    className="form-textarea"
                    placeholder="Additional notes about this candidate..."
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                />
            </div>
            <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                    {candidate ? 'Update' : 'Add Candidate'}
                </button>
            </div>

            <style>{`
        .candidate-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg);
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

export default Candidates;
