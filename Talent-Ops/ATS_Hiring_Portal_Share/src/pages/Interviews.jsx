import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Common/Toast';
import Modal from '../components/Common/Modal';
import {
    Search,
    Filter,
    Plus,
    Calendar,
    Clock,
    Video,
    MapPin,
    Users,
    ChevronRight,
    Edit,
    Trash2,
    Check,
    X as XIcon
} from 'lucide-react';
import { INTERVIEW_STATUS, INTERVIEW_MODES, PANEL_TYPES } from '../utils/constants';
import { formatDate, formatTime, getInitials } from '../utils/helpers';

const Interviews = () => {
    const {
        interviews,
        candidates,
        jobs,
        createInterview,
        updateInterview,
        deleteInterview
    } = useData();
    const { user, users, hasPermission, isInterviewer } = useAuth();
    const { success, error } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingInterview, setEditingInterview] = useState(null);
    const [interviewToDelete, setInterviewToDelete] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

    const canSchedule = hasPermission('canScheduleInterviews');

    // Filter interviews based on user role
    let filteredInterviews = interviews;
    if (isInterviewer() && !hasPermission('canManageCandidates')) {
        // Interviewers only see their assigned interviews
        filteredInterviews = interviews.filter(i => i.interviewers?.includes(user?.id));
    }

    // Apply search and status filters
    filteredInterviews = filteredInterviews.filter(i => {
        const candidate = candidates.find(c => c.id === i.candidateId);
        const name = i.candidateName || candidate?.name || '';
        const title = i.jobTitle || candidate?.jobTitle || '';

        const matchesSearch = !searchQuery ||
            name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Sort by date
    filteredInterviews = [...filteredInterviews].sort((a, b) =>
        new Date(a.scheduledAt) - new Date(b.scheduledAt)
    );

    const handleCreate = async (data) => {
        try {
            await createInterview(data);
            setShowModal(false);
            success('Interview scheduled successfully!');
        } catch (err) {
            console.error('Create Interview Error:', err);
            error(err.message || 'Failed to schedule interview');
        }
    };

    const handleUpdate = async (data) => {
        try {
            await updateInterview(editingInterview.id, data);
            setShowModal(false);
            setEditingInterview(null);
            success('Interview updated successfully!');
        } catch (err) {
            console.error('Update Interview Error:', err);
            error(err.message || 'Failed to update interview');
        }
    };

    const handleDeleteClick = (interview) => {
        setInterviewToDelete(interview);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!interviewToDelete) return;

        try {
            await deleteInterview(interviewToDelete.id);
            success('Interview deleted successfully!');
            setShowDeleteModal(false);
            setInterviewToDelete(null);
        } catch (err) {
            console.error('Delete Interview Error:', err);
            error(err.message || 'Failed to delete interview');
        }
    };

    const handleStatusChange = async (interviewId, newStatus) => {
        try {
            await updateInterview(interviewId, { status: newStatus });
            success(`Interview marked as ${newStatus}`);
        } catch (err) {
            error('Failed to update status');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: { label: 'Scheduled', class: 'badge-info' },
            completed: { label: 'Completed', class: 'badge-success' },
            cancelled: { label: 'Cancelled', class: 'badge-error' }
        };
        return badges[status] || badges.scheduled;
    };

    const interviewCounts = {
        all: filteredInterviews.length,
        scheduled: filteredInterviews.filter(i => i.status === 'scheduled').length,
        completed: filteredInterviews.filter(i => i.status === 'completed').length,
        cancelled: filteredInterviews.filter(i => i.status === 'cancelled').length
    };

    return (
        <div className="interviews-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Interviews</h1>
                    <p className="page-subtitle">Manage interview schedules and panels</p>
                </div>
                {canSchedule && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Schedule Interview
                    </button>
                )}
            </div>

            {/* Status Tabs */}
            <div className="tabs mb-lg">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'scheduled', label: 'Scheduled' },
                    { key: 'completed', label: 'Completed' },
                    { key: 'cancelled', label: 'Cancelled' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`tab ${statusFilter === tab.key ? 'active' : ''}`}
                        onClick={() => setStatusFilter(tab.key)}
                    >
                        {tab.label}
                        <span className="tab-count">{interviewCounts[tab.key]}</span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search interviews..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Interview List */}
            {filteredInterviews.length > 0 ? (
                <div className="interview-grid">
                    {filteredInterviews.map(interview => {
                        const statusBadge = getStatusBadge(interview.status);
                        const panelType = PANEL_TYPES.find(p => p.id === interview.panelType);
                        const mode = INTERVIEW_MODES.find(m => m.id === interview.mode);
                        const interviewers = interview.interviewers?.map(id => users.find(u => u.id === id)).filter(Boolean) || [];

                        return (
                            <div key={interview.id} className="interview-card glass-card">
                                <div className="card-header">
                                    <span className={`badge ${statusBadge.class}`}>
                                        {statusBadge.label}
                                    </span>
                                    <span className="panel-type">{panelType?.name || interview.panelType}</span>
                                </div>

                                <div className="card-body">
                                    <div className="candidate-row">
                                        <div className="avatar">
                                            {getInitials(interview.candidateName)}
                                        </div>
                                        <div className="candidate-info">
                                            <h3>{interview.candidateName || candidates.find(c => c.id === interview.candidateId)?.name || 'Unknown Candidate'}</h3>
                                            <p>{interview.jobTitle || candidates.find(c => c.id === interview.candidateId)?.jobTitle || 'Unknown Role'}</p>
                                        </div>
                                    </div>

                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <Calendar size={16} />
                                            <span>{formatDate(interview.scheduledAt)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <Clock size={16} />
                                            <span>{formatTime(interview.scheduledAt)}</span>
                                        </div>
                                        <div className="detail-item">
                                            {interview.mode === 'online' ? <Video size={16} /> : <MapPin size={16} />}
                                            <span>{mode?.name || interview.mode}</span>
                                        </div>
                                        <div className="detail-item">
                                            <Clock size={16} />
                                            <span>{interview.duration || 60} mins</span>
                                        </div>
                                    </div>

                                    {interviewers.length > 0 && (
                                        <div className="interviewers">
                                            <span className="label">Interviewers:</span>
                                            <div className="avatar-group">
                                                {interviewers.map(interviewer => (
                                                    <div key={interviewer.id} className="avatar avatar-sm" title={interviewer.name}>
                                                        {getInitials(interviewer.name)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {interview.meetingLink && interview.mode === 'online' && (
                                        <a
                                            href={interview.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="meeting-link"
                                        >
                                            <Video size={14} />
                                            Join Meeting
                                        </a>
                                    )}
                                </div>

                                <div className="card-footer">
                                    {interview.status === 'scheduled' && canSchedule && (
                                        <>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleStatusChange(interview.id, 'completed')}
                                            >
                                                <Check size={16} />
                                                Complete
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleStatusChange(interview.id, 'cancelled')}
                                            >
                                                <XIcon size={16} />
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {canSchedule && (
                                        <>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => {
                                                    setEditingInterview(interview);
                                                    setShowModal(true);
                                                }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleDeleteClick(interview)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state glass-card">
                    <div className="icon">
                        <Calendar size={48} />
                    </div>
                    <h3>No interviews found</h3>
                    <p>
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Schedule your first interview to get started'}
                    </p>
                </div>
            )}

            {/* Schedule Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingInterview(null);
                }}
                title={editingInterview ? 'Edit Interview' : 'Schedule Interview'}
                size="lg"
            >
                <InterviewForm
                    interview={editingInterview}
                    candidates={candidates.filter(c => c.stage !== 'hired' && c.stage !== 'rejected')}
                    users={users}
                    onSubmit={editingInterview ? handleUpdate : handleCreate}
                    onCancel={() => {
                        setShowModal(false);
                        setEditingInterview(null);
                    }}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setInterviewToDelete(null);
                }}
                title="Delete Interview"
                size="sm"
            >
                <div>
                    <p className="mb-lg">
                        Are you sure you want to delete the interview for <strong>{interviewToDelete?.candidateName || 'this candidate'}</strong>?
                        This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-md">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setInterviewToDelete(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-error"
                            onClick={handleConfirmDelete}
                        >
                            Delete Interview
                        </button>
                    </div>
                    <style>{`
                        .mb-lg { margin-bottom: var(--spacing-lg); }
                        .flex { display: flex; }
                        .justify-end { justify-content: flex-end; }
                        .gap-md { gap: var(--spacing-md); }
                        .btn-error {
                            background-color: var(--status-error);
                            color: white;
                            border: none;
                        }
                        .btn-error:hover {
                            background-color: #d32f2f;
                        }
                    `}</style>
                </div>
            </Modal>

            <style>{`
        .interviews-page {
          animation: fadeIn var(--transition-normal);
        }

        .tabs .tab {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .tab-count {
          background: var(--bg-tertiary);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .tab.active .tab-count {
          background: rgba(255, 255, 255, 0.2);
        }

        .filters-bar {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }

        .interview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: var(--spacing-lg);
        }

        .interview-card {
          display: flex;
          flex-direction: column;
        }

        .interview-card .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-md);
        }

        .panel-type {
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        .interview-card .card-body {
          flex: 1;
        }

        .candidate-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .candidate-info h3 {
          font-size: 1.0625rem;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .candidate-info p {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .interviewers {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .interviewers .label {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .meeting-link {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--accent-glow);
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          color: var(--accent-tertiary);
          text-decoration: none;
          transition: all var(--transition-fast);
        }

        .meeting-link:hover {
          background: var(--accent-primary);
          color: white;
        }

        .interview-card .card-footer {
          display: flex;
          gap: var(--spacing-xs);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border-secondary);
          flex-wrap: wrap;
        }
      `}</style>
        </div>
    );
};

// Interview Form Component
const InterviewForm = ({ interview, candidates, users, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        candidateId: interview?.candidateId || '',
        candidateName: interview?.candidateName || candidates.find(c => c.id === interview?.candidateId)?.name || '',
        jobId: interview?.jobId || '',
        jobTitle: interview?.jobTitle || candidates.find(c => c.id === interview?.candidateId)?.jobTitle || '',
        panelType: interview?.panelType || 'hr',
        interviewers: interview?.interviewers || [],
        scheduledAt: interview?.scheduledAt ? new Date(interview.scheduledAt).toISOString().slice(0, 16) : '',
        duration: interview?.duration || 60,
        mode: interview?.mode || 'online',
        meetingLink: interview?.meetingLink || '',
        location: interview?.location || '',
        notes: interview?.notes || '',
        status: interview?.status || 'scheduled'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-fill candidate info when candidate is selected
            if (name === 'candidateId') {
                const selectedCandidate = candidates.find(c => c.id === value);
                if (selectedCandidate) {
                    newData.candidateName = selectedCandidate.name;
                    newData.jobId = selectedCandidate.jobId;
                    newData.jobTitle = selectedCandidate.jobTitle;
                }
            }

            return newData;
        });
    };

    const handleInterviewerChange = (userId) => {
        setFormData(prev => ({
            ...prev,
            interviewers: prev.interviewers.includes(userId)
                ? prev.interviewers.filter(id => id !== userId)
                : [...prev.interviewers, userId]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            scheduledAt: new Date(formData.scheduledAt).toISOString()
        });
    };

    return (
        <form onSubmit={handleSubmit} className="interview-form">
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">Candidate *</label>
                    <select
                        name="candidateId"
                        className="form-select"
                        value={formData.candidateId}
                        onChange={handleChange}
                        required
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
                    <label className="form-label">Panel Type *</label>
                    <select
                        name="panelType"
                        className="form-select"
                        value={formData.panelType}
                        onChange={handleChange}
                        required
                    >
                        {PANEL_TYPES.map(panel => (
                            <option key={panel.id} value={panel.id}>{panel.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Date & Time *</label>
                    <input
                        type="datetime-local"
                        name="scheduledAt"
                        className="form-input"
                        value={formData.scheduledAt}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Duration (minutes)</label>
                    <select
                        name="duration"
                        className="form-select"
                        value={formData.duration}
                        onChange={handleChange}
                    >
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                        <option value={60}>60 mins</option>
                        <option value={90}>90 mins</option>
                        <option value={120}>120 mins</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Mode *</label>
                    <select
                        name="mode"
                        className="form-select"
                        value={formData.mode}
                        onChange={handleChange}
                        required
                    >
                        {INTERVIEW_MODES.map(mode => (
                            <option key={mode.id} value={mode.id}>{mode.name}</option>
                        ))}
                    </select>
                </div>

                {formData.mode === 'online' && (
                    <div className="form-group">
                        <label className="form-label">Meeting Link</label>
                        <input
                            type="url"
                            name="meetingLink"
                            className="form-input"
                            placeholder="https://meet.google.com/..."
                            value={formData.meetingLink}
                            onChange={handleChange}
                        />
                    </div>
                )}

                {formData.mode === 'offline' && (
                    <div className="form-group">
                        <label className="form-label">Location</label>
                        <input
                            type="text"
                            name="location"
                            className="form-input"
                            placeholder="Conference Room A"
                            value={formData.location}
                            onChange={handleChange}
                        />
                    </div>
                )}
            </div>

            <div className="form-group">
                <label className="form-label">Interviewers</label>
                <div className="interviewers-grid">
                    {users.filter(u => u.role === 'admin').map(u => (
                        <label
                            key={u.id}
                            className={`interviewer-option ${formData.interviewers.includes(u.id) ? 'selected' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={formData.interviewers.includes(u.id)}
                                onChange={() => handleInterviewerChange(u.id)}
                            />
                            <div className="avatar avatar-sm">
                                {getInitials(u.name)}
                            </div>
                            <div className="interviewer-info">
                                <span className="name">{u.name}</span>
                                <span className="role">{u.role}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                    name="notes"
                    className="form-textarea"
                    placeholder="Any additional notes for the interview..."
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
                    {interview ? 'Update Interview' : 'Schedule Interview'}
                </button>
            </div>

            <style>{`
        .interview-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg);
        }

        .interviewers-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-sm);
        }

        .interviewer-option {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-glass);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .interviewer-option:hover {
          border-color: var(--border-accent);
        }

        .interviewer-option.selected {
          border-color: var(--accent-primary);
          background: var(--accent-glow);
        }

        .interviewer-option input {
          display: none;
        }

        .interviewer-info {
          display: flex;
          flex-direction: column;
        }

        .interviewer-info .name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .interviewer-info .role {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--border-secondary);
        }

        @media (max-width: 768px) {
          .form-grid,
          .interviewers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </form>
    );
};

export default Interviews;
