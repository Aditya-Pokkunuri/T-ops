import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Common/Toast';
import Modal from '../components/Common/Modal';
import JobCard from '../components/Jobs/JobCard';
import JobForm from '../components/Jobs/JobForm';
import {
    Plus,
    Search,
    Filter,
    Briefcase
} from 'lucide-react';
import { JOB_STATUS, DEPARTMENTS } from '../utils/constants';

const Jobs = () => {
    const { jobs, createJob, updateJob, deleteJob } = useData();
    const { hasPermission } = useAuth();
    const { success, error } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingJob, setEditingJob] = useState(null);

    const canManageJobs = hasPermission('canManageJobs');

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = !searchQuery ||
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
        const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;

        return matchesSearch && matchesStatus && matchesDepartment;
    });

    const handleCreateJob = async (jobData) => {
        try {
            await createJob(jobData);
            setShowModal(false);
            success('Job posting created successfully!');
        } catch (err) {
            error('Failed to create job posting');
        }
    };

    const handleUpdateJob = async (jobData) => {
        try {
            await updateJob(editingJob.id, jobData);
            setShowModal(false);
            setEditingJob(null);
            success('Job posting updated successfully!');
        } catch (err) {
            error('Failed to update job posting');
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (window.confirm('Are you sure you want to delete this job posting?')) {
            try {
                await deleteJob(jobId);
                success('Job posting deleted successfully!');
            } catch (err) {
                error('Failed to delete job posting');
            }
        }
    };

    const handleStatusChange = async (jobId, newStatus) => {
        try {
            await updateJob(jobId, { status: newStatus });
            success(`Job ${newStatus === 'published' ? 'published' : newStatus === 'archived' ? 'archived' : 'saved as draft'}!`);
        } catch (err) {
            error('Failed to update job status');
        }
    };

    const handleEdit = (job) => {
        setEditingJob(job);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingJob(null);
    };

    const jobCounts = {
        all: jobs.length,
        published: jobs.filter(j => j.status === 'published').length,
        draft: jobs.filter(j => j.status === 'draft').length,
        archived: jobs.filter(j => j.status === 'archived').length
    };

    return (
        <div className="jobs-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Job Postings</h1>
                    <p className="page-subtitle">Manage your open positions and job listings</p>
                </div>
                {canManageJobs && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Create Job
                    </button>
                )}
            </div>

            {/* Status Tabs */}
            <div className="tabs mb-lg">
                {[
                    { key: 'all', label: 'All Jobs' },
                    { key: 'published', label: 'Published' },
                    { key: 'draft', label: 'Drafts' },
                    { key: 'archived', label: 'Archived' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`tab ${statusFilter === tab.key ? 'active' : ''}`}
                        onClick={() => setStatusFilter(tab.key)}
                    >
                        {tab.label}
                        <span className="tab-count">{jobCounts[tab.key]}</span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <Filter size={18} />
                    <select
                        className="form-select"
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                    >
                        <option value="all">All Departments</option>
                        {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Jobs Grid */}
            {filteredJobs.length > 0 ? (
                <div className="jobs-grid">
                    {filteredJobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onEdit={handleEdit}
                            onDelete={handleDeleteJob}
                            onStatusChange={handleStatusChange}
                            canManage={canManageJobs}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state glass-card">
                    <div className="icon">
                        <Briefcase size={48} />
                    </div>
                    <h3>No jobs found</h3>
                    <p>
                        {searchQuery || statusFilter !== 'all' || departmentFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create your first job posting to get started'}
                    </p>
                    {canManageJobs && !searchQuery && statusFilter === 'all' && (
                        <button className="btn btn-primary mt-lg" onClick={() => setShowModal(true)}>
                            <Plus size={20} />
                            Create Job
                        </button>
                    )}
                </div>
            )}

            {/* Job Modal */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
                size="lg"
            >
                <JobForm
                    job={editingJob}
                    onSubmit={editingJob ? handleUpdateJob : handleCreateJob}
                    onCancel={closeModal}
                />
            </Modal>

            <style>{`
        .jobs-page {
          animation: fadeIn var(--transition-normal);
        }

        .tabs {
          display: inline-flex;
        }

        .tab {
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

        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--spacing-lg);
        }

        .empty-state {
          padding: var(--spacing-2xl);
        }
      `}</style>
        </div>
    );
};

export default Jobs;
