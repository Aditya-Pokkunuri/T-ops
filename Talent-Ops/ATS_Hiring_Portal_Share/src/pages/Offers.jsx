import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Common/Toast';
import Modal from '../components/Common/Modal';
import OfferForm from '../components/Offers/OfferForm';
import OfferPreview from '../components/Offers/OfferPreview';
import {
    Search,
    Filter,
    Plus,
    FileText,
    Download,
    Send,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import { OFFER_STATUS } from '../utils/constants';
import { formatDate, formatCurrency, getInitials } from '../utils/helpers';
import { downloadOfferPDF } from '../services/pdfGenerator';

const Offers = () => {
    const {
        offers,
        candidates,
        jobs,
        createOffer,
        updateOffer,
        deleteOffer,
        getCandidateById,
        getJobById
    } = useData();
    const { hasPermission } = useAuth();
    const { success, error } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [previewOffer, setPreviewOffer] = useState(null);

    const canManage = hasPermission('canManageOffers');

    // Get candidates eligible for offers (in offer stage)
    const eligibleCandidates = candidates.filter(c =>
        c.stage === 'offer' && !offers.some(o => o.candidateId === c.id)
    );

    // Filter offers
    const filteredOffers = offers.filter(o => {
        const matchesSearch = !searchQuery ||
            o.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreate = async (data) => {
        try {
            await createOffer(data);
            setShowModal(false);
            success('Offer letter created successfully!');
        } catch (err) {
            error('Failed to create offer');
        }
    };

    const handleUpdate = async (data) => {
        try {
            await updateOffer(editingOffer.id, data);
            setShowModal(false);
            setEditingOffer(null);
            success('Offer updated successfully!');
        } catch (err) {
            error('Failed to update offer');
        }
    };

    const handleDelete = async (offerId) => {
        if (window.confirm('Are you sure you want to delete this offer?')) {
            try {
                await deleteOffer(offerId);
                success('Offer deleted!');
            } catch (err) {
                error('Failed to delete offer');
            }
        }
    };

    const handleStatusChange = async (offerId, newStatus) => {
        try {
            await updateOffer(offerId, { status: newStatus });
            success(`Offer marked as ${newStatus}`);
        } catch (err) {
            error('Failed to update offer status');
        }
    };

    const handleDownloadPDF = (offer) => {
        const candidate = getCandidateById(offer.candidateId);
        const job = getJobById(offer.jobId);

        if (candidate && job) {
            downloadOfferPDF(offer, candidate, job);
            success('PDF downloaded successfully!');
        } else {
            error('Failed to generate PDF - missing data');
        }
    };

    const handlePreview = (offer) => {
        setPreviewOffer(offer);
        setShowPreview(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: { label: 'Draft', class: 'badge-info', icon: FileText },
            sent: { label: 'Sent', class: 'badge-warning', icon: Send },
            accepted: { label: 'Accepted', class: 'badge-success', icon: CheckCircle },
            rejected: { label: 'Rejected', class: 'badge-error', icon: XCircle },
            expired: { label: 'Expired', class: 'badge-warning', icon: Clock }
        };
        return badges[status] || badges.draft;
    };

    const offerCounts = {
        all: offers.length,
        draft: offers.filter(o => o.status === 'draft').length,
        sent: offers.filter(o => o.status === 'sent').length,
        accepted: offers.filter(o => o.status === 'accepted').length,
        rejected: offers.filter(o => o.status === 'rejected').length
    };

    return (
        <div className="offers-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Offer Letters</h1>
                    <p className="page-subtitle">Generate and manage offer letters for candidates</p>
                </div>
                {canManage && eligibleCandidates.length > 0 && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Create Offer
                    </button>
                )}
            </div>

            {/* Status Tabs */}
            <div className="tabs mb-lg">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'draft', label: 'Drafts' },
                    { key: 'sent', label: 'Sent' },
                    { key: 'accepted', label: 'Accepted' },
                    { key: 'rejected', label: 'Rejected' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`tab ${statusFilter === tab.key ? 'active' : ''}`}
                        onClick={() => setStatusFilter(tab.key)}
                    >
                        {tab.label}
                        <span className="tab-count">{offerCounts[tab.key]}</span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search offers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Offers List */}
            {filteredOffers.length > 0 ? (
                <div className="offers-grid">
                    {filteredOffers.map(offer => {
                        const statusBadge = getStatusBadge(offer.status);
                        const StatusIcon = statusBadge.icon;

                        return (
                            <div key={offer.id} className="offer-card glass-card">
                                <div className="card-header">
                                    <div className="candidate-info">
                                        <div className="avatar">
                                            {getInitials(offer.candidateName)}
                                        </div>
                                        <div>
                                            <h3>{offer.candidateName}</h3>
                                            <p>{offer.jobTitle}</p>
                                        </div>
                                    </div>
                                    <span className={`badge ${statusBadge.class}`}>
                                        <StatusIcon size={14} />
                                        {statusBadge.label}
                                    </span>
                                </div>

                                <div className="card-body">
                                    <div className="offer-details">
                                        <div className="detail-row">
                                            <span className="label">Base Salary</span>
                                            <span className="value">{formatCurrency(offer.baseSalary)}</span>
                                        </div>
                                        {offer.bonus && (
                                            <div className="detail-row">
                                                <span className="label">Bonus</span>
                                                <span className="value">{formatCurrency(offer.bonus)}</span>
                                            </div>
                                        )}
                                        <div className="detail-row">
                                            <span className="label">Joining Date</span>
                                            <span className="value">{formatDate(offer.joiningDate)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Created</span>
                                            <span className="value">{formatDate(offer.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <div className="action-group">
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handlePreview(offer)}
                                            title="Preview"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleDownloadPDF(offer)}
                                            title="Download PDF"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </div>

                                    {canManage && (
                                        <div className="action-group">
                                            {offer.status === 'draft' && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleStatusChange(offer.id, 'sent')}
                                                >
                                                    <Send size={14} />
                                                    Send
                                                </button>
                                            )}
                                            {offer.status === 'sent' && (
                                                <>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleStatusChange(offer.id, 'accepted')}
                                                    >
                                                        <CheckCircle size={14} />
                                                        Accept
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleStatusChange(offer.id, 'rejected')}
                                                    >
                                                        <XCircle size={14} />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => {
                                                    setEditingOffer(offer);
                                                    setShowModal(true);
                                                }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleDelete(offer.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state glass-card">
                    <div className="icon">
                        <FileText size={48} />
                    </div>
                    <h3>No offers found</h3>
                    <p>
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : eligibleCandidates.length > 0
                                ? 'Create your first offer letter'
                                : 'Move candidates to the offer stage first'}
                    </p>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingOffer(null);
                }}
                title={editingOffer ? 'Edit Offer Letter' : 'Create Offer Letter'}
                size="lg"
            >
                <OfferForm
                    offer={editingOffer}
                    candidates={editingOffer ? candidates : eligibleCandidates}
                    jobs={jobs}
                    onSubmit={editingOffer ? handleUpdate : handleCreate}
                    onCancel={() => {
                        setShowModal(false);
                        setEditingOffer(null);
                    }}
                />
            </Modal>

            {/* Preview Modal */}
            <Modal
                isOpen={showPreview}
                onClose={() => {
                    setShowPreview(false);
                    setPreviewOffer(null);
                }}
                title="Offer Letter Preview"
                size="lg"
            >
                {previewOffer && (
                    <OfferPreview
                        offer={previewOffer}
                        candidate={getCandidateById(previewOffer.candidateId)}
                        job={getJobById(previewOffer.jobId)}
                        onDownload={() => handleDownloadPDF(previewOffer)}
                        onClose={() => {
                            setShowPreview(false);
                            setPreviewOffer(null);
                        }}
                    />
                )}
            </Modal>

            <style>{`
        .offers-page {
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

        .offers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: var(--spacing-lg);
        }

        .offer-card .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--spacing-md);
        }

        .offer-card .candidate-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .offer-card .candidate-info h3 {
          font-size: 1.0625rem;
          font-weight: 600;
        }

        .offer-card .candidate-info p {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .offer-card .badge {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .offer-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-xs) 0;
        }

        .detail-row .label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .detail-row .value {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .offer-card .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border-secondary);
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }

        .action-group {
          display: flex;
          gap: var(--spacing-xs);
        }
      `}</style>
        </div>
    );
};

export default Offers;
