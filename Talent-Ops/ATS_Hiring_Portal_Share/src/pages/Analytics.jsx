import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
    TrendingUp,
    TrendingDown,
    Briefcase,
    Users,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Target
} from 'lucide-react';
import { PIPELINE_STAGES } from '../utils/constants';

const Analytics = () => {
    const { jobs, candidates, interviews, offers, feedback, getAnalytics } = useData();
    const { hasPermission } = useAuth();
    const analytics = getAnalytics();

    if (!hasPermission('canViewAnalytics')) {
        return (
            <div className="access-denied glass-card">
                <h2>Access Denied</h2>
                <p>You don't have permission to view analytics.</p>
            </div>
        );
    }

    // Calculate additional metrics
    const totalApplicants = candidates.length;
    const hiredCount = candidates.filter(c => c.stage === 'hired').length;
    const rejectedCount = candidates.filter(c => c.stage === 'rejected').length;
    const activeInPipeline = totalApplicants - hiredCount - rejectedCount;

    const conversionRate = totalApplicants > 0
        ? ((hiredCount / totalApplicants) * 100).toFixed(1)
        : 0;

    const offerAcceptanceRate = offers.length > 0
        ? ((offers.filter(o => o.status === 'accepted').length / offers.filter(o => o.status !== 'draft').length) * 100).toFixed(1)
        : 0;

    const avgFeedbackScore = feedback.length > 0
        ? (feedback.reduce((acc, f) => {
            const ratings = Object.values(f.ratings || {});
            return acc + (ratings.reduce((a, b) => a + b, 0) / ratings.length);
        }, 0) / feedback.length).toFixed(1)
        : 0;

    // Pipeline funnel data
    const funnelData = PIPELINE_STAGES.slice(0, 5).map(stage => ({
        stage: stage.name,
        count: candidates.filter(c => c.stage === stage.id).length,
        color: stage.color
    }));

    // Jobs by department
    const jobsByDepartment = jobs.reduce((acc, job) => {
        acc[job.department] = (acc[job.department] || 0) + 1;
        return acc;
    }, {});

    // Candidates by source (mock data since we don't track source)
    const candidatesByJob = jobs.slice(0, 5).map(job => ({
        job: job.title,
        count: candidates.filter(c => c.jobId === job.id).length
    }));

    return (
        <div className="analytics-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Recruitment metrics and insights</p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-4 mb-xl">
                <MetricCard
                    icon={Target}
                    label="Conversion Rate"
                    value={`${conversionRate}%`}
                    subtitle="Applied to Hired"
                    color="#10b981"
                />
                <MetricCard
                    icon={CheckCircle}
                    label="Offer Acceptance"
                    value={`${offerAcceptanceRate}%`}
                    subtitle="Offers accepted"
                    color="#8b5cf6"
                />
                <MetricCard
                    icon={Users}
                    label="Active Pipeline"
                    value={activeInPipeline}
                    subtitle="Candidates in process"
                    color="#3b82f6"
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Avg. Feedback Score"
                    value={`${avgFeedbackScore}/5`}
                    subtitle="Interview ratings"
                    color="#f59e0b"
                />
            </div>

            <div className="analytics-grid">
                {/* Pipeline Funnel */}
                <div className="analytics-card glass-card">
                    <h3>Pipeline Funnel</h3>
                    <div className="funnel-chart">
                        {funnelData.map((item, index) => {
                            const maxCount = Math.max(...funnelData.map(d => d.count), 1);
                            const width = Math.max((item.count / maxCount) * 100, 10);

                            return (
                                <div key={index} className="funnel-item">
                                    <div className="funnel-label">
                                        <span className="stage-name">{item.stage}</span>
                                        <span className="stage-count">{item.count}</span>
                                    </div>
                                    <div className="funnel-bar-wrapper">
                                        <div
                                            className="funnel-bar"
                                            style={{
                                                width: `${width}%`,
                                                background: item.color
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="analytics-card glass-card">
                    <h3>Recruitment Summary</h3>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <Briefcase size={24} />
                            <div className="summary-content">
                                <span className="summary-value">{analytics.activeJobs}</span>
                                <span className="summary-label">Active Jobs</span>
                            </div>
                        </div>
                        <div className="summary-item">
                            <Users size={24} />
                            <div className="summary-content">
                                <span className="summary-value">{analytics.totalCandidates}</span>
                                <span className="summary-label">Total Candidates</span>
                            </div>
                        </div>
                        <div className="summary-item">
                            <Calendar size={24} />
                            <div className="summary-content">
                                <span className="summary-value">{analytics.completedInterviews}</span>
                                <span className="summary-label">Interviews Done</span>
                            </div>
                        </div>
                        <div className="summary-item">
                            <FileText size={24} />
                            <div className="summary-content">
                                <span className="summary-value">{analytics.acceptedOffers}</span>
                                <span className="summary-label">Offers Accepted</span>
                            </div>
                        </div>
                        <div className="summary-item success">
                            <CheckCircle size={24} />
                            <div className="summary-content">
                                <span className="summary-value">{hiredCount}</span>
                                <span className="summary-label">Hired</span>
                            </div>
                        </div>
                        <div className="summary-item error">
                            <XCircle size={24} />
                            <div className="summary-content">
                                <span className="summary-value">{rejectedCount}</span>
                                <span className="summary-label">Rejected</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Candidates by Job */}
                <div className="analytics-card glass-card">
                    <h3>Candidates by Position</h3>
                    <div className="bar-chart">
                        {candidatesByJob.map((item, index) => {
                            const maxCount = Math.max(...candidatesByJob.map(d => d.count), 1);
                            const width = Math.max((item.count / maxCount) * 100, 5);

                            return (
                                <div key={index} className="bar-item">
                                    <div className="bar-label">{item.job}</div>
                                    <div className="bar-wrapper">
                                        <div
                                            className="bar-fill"
                                            style={{ width: `${width}%` }}
                                        />
                                        <span className="bar-value">{item.count}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {candidatesByJob.length === 0 && (
                        <p className="no-data">No data available</p>
                    )}
                </div>

                {/* Jobs by Department */}
                <div className="analytics-card glass-card">
                    <h3>Jobs by Department</h3>
                    <div className="department-list">
                        {Object.entries(jobsByDepartment).map(([dept, count], index) => (
                            <div key={index} className="department-item">
                                <span className="dept-name">{dept}</span>
                                <span className="dept-count">{count}</span>
                            </div>
                        ))}
                    </div>
                    {Object.keys(jobsByDepartment).length === 0 && (
                        <p className="no-data">No jobs created yet</p>
                    )}
                </div>
            </div>

            <style>{`
        .analytics-page {
          animation: fadeIn var(--transition-normal);
        }

        .access-denied {
          text-align: center;
          padding: var(--spacing-2xl);
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg);
        }

        .analytics-card {
          padding: var(--spacing-xl);
        }

        .analytics-card h3 {
          font-size: 1.125rem;
          margin-bottom: var(--spacing-lg);
        }

        .funnel-chart {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .funnel-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .funnel-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .stage-name {
          color: var(--text-secondary);
        }

        .stage-count {
          font-weight: 600;
          color: var(--text-primary);
        }

        .funnel-bar-wrapper {
          height: 32px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .funnel-bar {
          height: 100%;
          border-radius: var(--radius-md);
          transition: width var(--transition-slow);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
        }

        .summary-item.success svg { color: var(--status-success); }
        .summary-item.error svg { color: var(--status-error); }

        .summary-content {
          display: flex;
          flex-direction: column;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .summary-label {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .bar-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .bar-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bar-wrapper {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          height: 24px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          border-radius: var(--radius-sm);
          transition: width var(--transition-slow);
        }

        .bar-value {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
          padding-right: var(--spacing-sm);
        }

        .department-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .department-item {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }

        .dept-name {
          font-size: 0.9375rem;
          color: var(--text-primary);
        }

        .dept-count {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--accent-secondary);
        }

        .no-data {
          text-align: center;
          color: var(--text-muted);
          padding: var(--spacing-lg);
        }

        @media (max-width: 1200px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

// Metric Card Component
const MetricCard = ({ icon: Icon, label, value, subtitle, color }) => (
    <div className="stat-card">
        <div className="icon-wrapper" style={{ background: `${color}20` }}>
            <Icon size={24} style={{ color }} />
        </div>
        <div className="stat-content">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-change" style={{ color }}>
                {subtitle}
            </div>
        </div>
    </div>
);

export default Analytics;
