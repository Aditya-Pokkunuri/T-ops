import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Common/Toast';
import { PIPELINE_STAGES } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import { Link } from 'react-router-dom';
import {
    Filter,
    Users,
    ChevronRight,
    Mail,
    Phone,
    Briefcase
} from 'lucide-react';

const Pipeline = () => {
    const { candidates, jobs, moveCandidateToStage } = useData();
    const { hasPermission } = useAuth();
    const { success, error } = useToast();
    const [jobFilter, setJobFilter] = useState('all');

    const canManageCandidates = hasPermission('canManageCandidates');

    const filteredCandidates = candidates.filter(c =>
        jobFilter === 'all' || c.jobId === jobFilter
    );

    // Group candidates by stage
    const candidatesByStage = PIPELINE_STAGES.reduce((acc, stage) => {
        acc[stage.id] = filteredCandidates.filter(c => c.stage === stage.id);
        return acc;
    }, {});

    const handleDragEnd = (result) => {
        if (!result.destination || !canManageCandidates) return;

        const { draggableId, destination } = result;
        const newStage = destination.droppableId;

        try {
            moveCandidateToStage(draggableId, newStage);
            const stageName = PIPELINE_STAGES.find(s => s.id === newStage)?.name;
            success(`Candidate moved to ${stageName}`);
        } catch (err) {
            error('Failed to move candidate');
        }
    };

    return (
        <div className="pipeline-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Candidate Pipeline</h1>
                    <p className="page-subtitle">Track candidates across recruitment stages</p>
                </div>
                <div className="header-actions">
                    <div className="filter-group">
                        <Filter size={18} />
                        <select
                            className="form-select"
                            value={jobFilter}
                            onChange={(e) => setJobFilter(e.target.value)}
                        >
                            <option value="all">All Jobs</option>
                            {jobs.filter(j => j.status === 'published').map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="kanban-board">
                    {PIPELINE_STAGES.map(stage => (
                        <div key={stage.id} className="kanban-column">
                            <div className="kanban-column-header" style={{ borderLeftColor: stage.color }}>
                                <div className="column-title-wrapper">
                                    <span
                                        className="stage-dot"
                                        style={{ backgroundColor: stage.color }}
                                    />
                                    <span className="kanban-column-title">{stage.name}</span>
                                </div>
                                <span className="kanban-column-count">
                                    {candidatesByStage[stage.id]?.length || 0}
                                </span>
                            </div>

                            <Droppable droppableId={stage.id} isDropDisabled={!canManageCandidates}>
                                {(provided, snapshot) => (
                                    <div
                                        className={`kanban-column-body ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        {candidatesByStage[stage.id]?.map((candidate, index) => (
                                            <Draggable
                                                key={candidate.id}
                                                draggableId={candidate.id}
                                                index={index}
                                                isDragDisabled={!canManageCandidates}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        className={`kanban-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <div className="card-header">
                                                            <div className="avatar" style={{ background: `linear-gradient(135deg, ${stage.color}, ${stage.color}88)` }}>
                                                                {getInitials(candidate.name)}
                                                            </div>
                                                            <div className="candidate-info">
                                                                <h4>{candidate.name}</h4>
                                                                <p>{candidate.jobTitle}</p>
                                                            </div>
                                                        </div>

                                                        <div className="card-body">
                                                            {candidate.skills && candidate.skills.length > 0 && (
                                                                <div className="skill-tags">
                                                                    {candidate.skills.slice(0, 3).map((skill, i) => (
                                                                        <span key={i} className="skill-tag">{skill}</span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <div className="candidate-meta">
                                                                {candidate.experience && (
                                                                    <span className="meta-item">
                                                                        <Briefcase size={12} />
                                                                        {candidate.experience}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="card-footer">
                                                            <div className="contact-icons">
                                                                <a href={`mailto:${candidate.email}`} className="contact-btn" title={candidate.email}>
                                                                    <Mail size={14} />
                                                                </a>
                                                                {candidate.phone && (
                                                                    <a href={`tel:${candidate.phone}`} className="contact-btn" title={candidate.phone}>
                                                                        <Phone size={14} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <Link to={`/candidates/${candidate.id}`} className="view-btn">
                                                                View <ChevronRight size={14} />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {(!candidatesByStage[stage.id] || candidatesByStage[stage.id].length === 0) && (
                                            <div className="empty-column">
                                                <Users size={24} />
                                                <span>No candidates</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            <style>{`
        .pipeline-page {
          animation: fadeIn var(--transition-normal);
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-md);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--text-secondary);
        }

        .filter-group .form-select {
          min-width: 200px;
        }

        .kanban-column-header {
          border-left: 3px solid;
          padding-left: calc(var(--spacing-lg) - 3px);
        }

        .column-title-wrapper {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .stage-dot {
          width: 10px;
          height: 10px;
          border-radius: var(--radius-full);
        }

        .kanban-column-body.drag-over {
          background: var(--bg-glass-hover);
        }

        .kanban-card {
          user-select: none;
        }

        .kanban-card .card-header {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .kanban-card .candidate-info h4 {
          font-size: 0.9375rem;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .kanban-card .candidate-info p {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .kanban-card .card-body {
          margin-bottom: var(--spacing-md);
        }

        .skill-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-sm);
        }

        .skill-tag {
          padding: 2px 8px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          font-size: 0.6875rem;
          color: var(--text-secondary);
        }

        .candidate-meta {
          display: flex;
          gap: var(--spacing-md);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .kanban-card .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: var(--spacing-sm);
          border-top: 1px solid var(--border-secondary);
        }

        .contact-icons {
          display: flex;
          gap: var(--spacing-xs);
        }

        .contact-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .contact-btn:hover {
          background: var(--accent-glow);
          color: var(--accent-primary);
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 0.8125rem;
          color: var(--accent-secondary);
          text-decoration: none;
        }

        .view-btn:hover {
          color: var(--accent-primary);
        }

        .empty-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          color: var(--text-muted);
          gap: var(--spacing-sm);
        }

        .empty-column span {
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    );
};

export default Pipeline;
