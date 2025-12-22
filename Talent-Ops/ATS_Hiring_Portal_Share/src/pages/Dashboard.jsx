import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
    Briefcase,
    Users,
    Calendar,
    FileText,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { formatDate, getRelativeTime, getInitials } from '../utils/helpers';

const Dashboard = () => {
    const { user } = useAuth();
    const { jobs, candidates, interviews, offers, getAnalytics, getUpcomingInterviews } = useData();
    const analytics = getAnalytics();
    const upcomingInterviews = getUpcomingInterviews().slice(0, 5);

    const stats = [
        {
            label: 'Active Jobs',
            value: analytics.activeJobs,
            total: analytics.totalJobs,
            icon: Briefcase,
            color: '#8b5cf6',
            trend: '+2 this week',
            positive: true
        },
        {
            label: 'Total Candidates',
            value: analytics.totalCandidates,
            icon: Users,
            color: '#3b82f6',
            trend: `+${analytics.recentCandidates} last 30 days`,
            positive: true
        },
        {
            label: 'Scheduled Interviews',
            value: analytics.upcomingInterviews,
            icon: Calendar,
            color: '#f59e0b',
            trend: `${analytics.completedInterviews} completed`,
            positive: true
        },
        {
            label: 'Pending Offers',
            value: analytics.pendingOffers,
            icon: FileText,
            color: '#10b981',
            trend: `${analytics.acceptedOffers} accepted`,
            positive: true
        }
    ];

    const pipelineData = [
        { stage: 'Applied', count: analytics.candidatesByStage.applied, color: '#3b82f6' },
        { stage: 'Shortlisted', count: analytics.candidatesByStage.shortlisted, color: '#8b5cf6' },
        { stage: 'Interview', count: analytics.candidatesByStage.interview, color: '#f59e0b' },
        { stage: 'Offer', count: analytics.candidatesByStage.offer, color: '#10b981' },
        { stage: 'Hired', count: analytics.candidatesByStage.hired, color: '#059669' }
    ];

    const recentCandidates = candidates
        .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
        .slice(0, 5);

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
                    <p className="page-subtitle">Here's what's happening with your recruitment today.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-4 mb-xl">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="stat-card animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="icon-wrapper" style={{ background: `${stat.color}20` }}>
                                <Icon size={24} style={{ color: stat.color }} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {stat.value}
                                    {stat.total && <span className="stat-total">/{stat.total}</span>}
                                </div>
                                <div className="stat-label">{stat.label}</div>
                                <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                    {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {stat.trend}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="dashboard-grid">
                {/* Pipeline Overview */}
                <div className="dashboard-card pipeline-overview">
                    <div className="card-header">
                        <h3>Pipeline Overview</h3>
                        <Link to="/pipeline" className="btn btn-ghost btn-sm">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="pipeline-bars">
                        {pipelineData.map((item, index) => (
                            <div key={index} className="pipeline-bar-item">
                                <div className="pipeline-bar-header">
                                    <span className="pipeline-stage">{item.stage}</span>
                                    <span className="pipeline-count">{item.count}</span>
                                </div>
                                <div className="pipeline-bar-track">
                                    <div
                                        className="pipeline-bar-fill"
                                        style={{
                                            width: `${Math.max((item.count / Math.max(...pipelineData.map(d => d.count), 1)) * 100, 5)}%`,
                                            background: item.color
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Interviews */}
                <div className="dashboard-card upcoming-interviews">
                    <div className="card-header">
                        <h3>Upcoming Interviews</h3>
                        <Link to="/interviews" className="btn btn-ghost btn-sm">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    {upcomingInterviews.length > 0 ? (
                        <div className="interview-list">
                            {upcomingInterviews.map(interview => (
                                <div key={interview.id} className="interview-item">
                                    <div className="interview-avatar">
                                        <div className="avatar">
                                            {getInitials(interview.candidateName)}
                                        </div>
                                    </div>
                                    <div className="interview-info">
                                        <h4>{interview.candidateName}</h4>
                                        <p>{interview.jobTitle}</p>
                                    </div>
                                    <div className="interview-meta">
                                        <div className="interview-time">
                                            <Clock size={14} />
                                            {formatDate(interview.scheduledAt)}
                                        </div>
                                        <span className={`badge badge-${interview.mode === 'online' ? 'info' : 'primary'}`}>
                                            {interview.mode}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Calendar size={48} className="text-muted" />
                            <p>No upcoming interviews</p>
                        </div>
                    )}
                </div>

                {/* Recent Candidates */}
                <div className="dashboard-card recent-candidates">
                    <div className="card-header">
                        <h3>Recent Candidates</h3>
                        <Link to="/candidates" className="btn btn-ghost btn-sm">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    {recentCandidates.length > 0 ? (
                        <div className="candidate-list">
                            {recentCandidates.map(candidate => (
                                <div key={candidate.id} className="candidate-item">
                                    <div className="avatar">
                                        {getInitials(candidate.name)}
                                    </div>
                                    <div className="candidate-info">
                                        <h4>{candidate.name}</h4>
                                        <p>{candidate.jobTitle}</p>
                                    </div>
                                    <div className="candidate-meta">
                                        <span className={`badge badge-${candidate.stage === 'hired' ? 'success' : candidate.stage === 'rejected' ? 'error' : 'primary'}`}>
                                            {candidate.stage}
                                        </span>
                                        <span className="applied-time">{getRelativeTime(candidate.appliedAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Users size={48} className="text-muted" />
                            <p>No candidates yet</p>
                        </div>
                    )}
                </div>

                {/* Active Jobs */}
                <div className="dashboard-card active-jobs">
                    <div className="card-header">
                        <h3>Active Job Postings</h3>
                        <Link to="/jobs" className="btn btn-ghost btn-sm">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    {jobs.filter(j => j.status === 'published').slice(0, 4).length > 0 ? (
                        <div className="job-list">
                            {jobs.filter(j => j.status === 'published').slice(0, 4).map(job => (
                                <div key={job.id} className="job-item">
                                    <div className="job-icon">
                                        <Briefcase size={20} />
                                    </div>
                                    <div className="job-info">
                                        <h4>{job.title}</h4>
                                        <p>{job.department} • {job.location}</p>
                                    </div>
                                    <div className="job-meta">
                                        <span className="applicant-count">
                                            <Users size={14} />
                                            {job.applicants || 0}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Briefcase size={48} className="text-muted" />
                            <p>No active jobs</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .dashboard {
          animation: fadeIn var(--transition-normal);
        }

        .stat-card .stat-total {
          font-size: 1rem;
          color: var(--text-secondary);
          font-weight: 400;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg);
        }

        .dashboard-card {
          background: var(--bg-glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-lg);
        }

        .card-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .pipeline-bars {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .pipeline-bar-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .pipeline-bar-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .pipeline-stage {
          color: var(--text-secondary);
        }

        .pipeline-count {
          font-weight: 600;
          color: var(--text-primary);
        }

        .pipeline-bar-track {
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .pipeline-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width var(--transition-slow);
        }

        .interview-list,
        .candidate-list,
        .job-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .interview-item,
        .candidate-item,
        .job-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .interview-item:hover,
        .candidate-item:hover,
        .job-item:hover {
          background: var(--bg-tertiary);
        }

        .interview-info,
        .candidate-info,
        .job-info {
          flex: 1;
          min-width: 0;
        }

        .interview-info h4,
        .candidate-info h4,
        .job-info h4 {
          font-size: 0.9375rem;
          font-weight: 500;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .interview-info p,
        .candidate-info p,
        .job-info p {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .interview-meta,
        .candidate-meta,
        .job-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--spacing-xs);
        }

        .interview-time {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .applied-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .job-icon {
          width: 40px;
          height: 40px;
          background: var(--accent-glow);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-primary);
        }

        .applicant-count {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          color: var(--text-muted);
        }

        .empty-state p {
          margin-top: var(--spacing-sm);
          font-size: 0.875rem;
        }

        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

export default Dashboard;
