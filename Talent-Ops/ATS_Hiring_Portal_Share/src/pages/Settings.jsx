import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/Common/Toast';
import Modal from '../components/Common/Modal';
import {
    Users,
    Shield,
    Clock,
    Settings as SettingsIcon,
    Plus,
    Edit,
    Trash2,
    FileText,
    Download,
    RefreshCw
} from 'lucide-react';
import { USER_ROLES } from '../utils/constants';
import { formatDateTime, getInitials } from '../utils/helpers';

const Settings = () => {
    const { user, users, isAdmin, addUser, updateUser, deleteUser } = useAuth();
    const { fetchAuditLog, jobs, interviews, feedback } = useData();
    const { success, error } = useToast();

    const [activeTab, setActiveTab] = useState('users');
    const [showUserModal, setShowUserModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [auditLog, setAuditLog] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);

    // Load audit log
    const loadAuditLog = async () => {
        setAuditLoading(true);
        try {
            const log = await fetchAuditLog({});
            setAuditLog(log ? log.slice(0, 100) : []);
        } catch (e) {
            console.error(e);
            setAuditLog([]);
        } finally {
            setAuditLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'audit') {
            loadAuditLog();
        }
    }, [activeTab]);

    // Handle user operations
    const handleAddUser = async (userData) => {
        try {
            await addUser(userData);
            setShowUserModal(false);
            success('User added successfully!');
        } catch (err) {
            error('Failed to add user');
        }
    };

    const handleUpdateUser = async (userData) => {
        try {
            await updateUser(editingUser.id, userData);
            setShowUserModal(false);
            setEditingUser(null);
            success('User updated successfully!');
        } catch (err) {
            error('Failed to update user');
        }
    };

    const initiateDeleteUser = (userId) => {
        if (userId === user?.id) {
            error("You can't delete your own account");
            return;
        }

        const userObj = users.find(u => u.id === userId);

        // Safety Checks
        const userJobs = jobs.filter(j => j.createdBy === userId).length;
        const userInterviews = interviews.filter(i => i.interviewers?.includes(userId) && i.status !== 'completed' && i.status !== 'cancelled').length;

        if (userJobs > 0) {
            error(`Cannot delete user. They have created ${userJobs} active jobs.`);
            return;
        }

        if (userInterviews > 0) {
            error(`Cannot delete user. They are assigned to ${userInterviews} upcoming interviews.`);
            return;
        }

        setUserToDelete(userObj);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        try {
            const result = await deleteUser(userToDelete.id);
            if (result) {
                success('User deleted successfully!');
                setShowDeleteModal(false);
                setUserToDelete(null);
            } else {
                error('Failed to delete user');
            }
        } catch (err) {
            console.error(err);
            error(err.message || 'Failed to delete user');
        }
    };

    const getRoleBadge = (role) => {
        const badges = {
            admin: { label: 'Admin', class: 'badge-error' },
            hr: { label: 'HR', class: 'badge-primary' },
            interviewer: { label: 'Interviewer', class: 'badge-info' }
        };
        return badges[role] || badges.interviewer;
    };

    const getActionBadge = (action) => {
        const badges = {
            CREATE: 'badge-success',
            UPDATE: 'badge-info',
            DELETE: 'badge-error'
        };
        return badges[action] || 'badge-info';
    };

    return (
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage users, roles, and system configuration</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs mb-xl">
                <button
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={18} />
                    Users
                </button>
                <button
                    className={`tab ${activeTab === 'roles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('roles')}
                >
                    <Shield size={18} />
                    Roles
                </button>
                <button
                    className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audit')}
                >
                    <Clock size={18} />
                    Audit Log
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="settings-section">
                    <div className="section-header">
                        <h2>User Management</h2>
                        {isAdmin() && (
                            <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>
                                <Plus size={18} />
                                Add User
                            </button>
                        )}
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    {isAdmin() && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const roleBadge = getRoleBadge(u.role);

                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="avatar">
                                                        {getInitials(u.name)}
                                                    </div>
                                                    <span>{u.name}</span>
                                                    {u.id === user?.id && (
                                                        <span className="you-badge">You</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`badge ${roleBadge.class}`}>
                                                    {roleBadge.label}
                                                </span>
                                            </td>
                                            <td>{formatDateTime(u.createdAt)}</td>
                                            {isAdmin() && (
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => {
                                                                setEditingUser(u);
                                                                setShowUserModal(true);
                                                            }}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        {u.id !== user?.id && (
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                onClick={() => initiateDeleteUser(u.id)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
                <div className="settings-section">
                    <div className="section-header">
                        <h2>Role Permissions</h2>
                    </div>

                    <div className="roles-grid">
                        {Object.entries(USER_ROLES).map(([key, role]) => (
                            <div key={key} className="role-card glass-card">
                                <div className="role-header">
                                    <Shield size={24} />
                                    <h3>{role.charAt(0).toUpperCase() + role.slice(1)}</h3>
                                </div>
                                <div className="permissions-list">
                                    {role === 'admin' && (
                                        <>
                                            <PermissionItem label="Manage Jobs" enabled />
                                            <PermissionItem label="Manage Candidates" enabled />
                                            <PermissionItem label="Schedule Interviews" enabled />
                                            <PermissionItem label="Submit Feedback" enabled />
                                            <PermissionItem label="Manage Offers" enabled />
                                            <PermissionItem label="View Analytics" enabled />
                                            <PermissionItem label="Manage Users" enabled />
                                            <PermissionItem label="View Audit Log" enabled />
                                        </>
                                    )}
                                    {role === 'hr' && (
                                        <>
                                            <PermissionItem label="Manage Jobs" enabled />
                                            <PermissionItem label="Manage Candidates" enabled />
                                            <PermissionItem label="Schedule Interviews" enabled />
                                            <PermissionItem label="Submit Feedback" enabled />
                                            <PermissionItem label="Manage Offers" enabled />
                                            <PermissionItem label="View Analytics" enabled />
                                            <PermissionItem label="Manage Users" enabled={false} />
                                            <PermissionItem label="View Audit Log" enabled={false} />
                                        </>
                                    )}
                                    {role === 'interviewer' && (
                                        <>
                                            <PermissionItem label="Manage Jobs" enabled={false} />
                                            <PermissionItem label="Manage Candidates" enabled={false} />
                                            <PermissionItem label="Schedule Interviews" enabled={false} />
                                            <PermissionItem label="Submit Feedback" enabled />
                                            <PermissionItem label="Manage Offers" enabled={false} />
                                            <PermissionItem label="View Analytics" enabled={false} />
                                            <PermissionItem label="Manage Users" enabled={false} />
                                            <PermissionItem label="View Audit Log" enabled={false} />
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === 'audit' && (
                <div className="settings-section">
                    <div className="section-header">
                        <h2>Audit Log</h2>
                        <button
                            className="btn btn-secondary"
                            onClick={loadAuditLog}
                            disabled={auditLoading}
                        >
                            <RefreshCw size={18} className={auditLoading ? 'spinning' : ''} />
                            Refresh
                        </button>
                    </div>

                    {auditLog.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>Entity</th>
                                        <th>Details</th>
                                        <th>User</th>
                                        <th>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLog.map(entry => (
                                        <tr key={entry.id || Math.random()}>
                                            <td>
                                                <span className={`badge ${getActionBadge(entry.action)}`}>
                                                    {entry.action || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td className="entity-cell">
                                                {entry.entity ? entry.entity.replace('ats_', '') : 'Unknown'}
                                            </td>
                                            <td className="details-cell">{typeof entry.details === 'object' ? JSON.stringify(entry.details) : (entry.details || '-')}</td>
                                            <td>{(users || []).find(u => u.id === entry.userId)?.name || 'System'}</td>
                                            <td>{entry.timestamp ? formatDateTime(entry.timestamp) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state glass-card">
                            <Clock size={48} />
                            <h3>No audit entries</h3>
                            <p>Activity will be logged here</p>
                        </div>
                    )}
                </div>
            )}

            {/* User Modal */}
            <Modal
                isOpen={showUserModal}
                onClose={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                }}
                title={editingUser ? 'Edit User' : 'Add User'}
                size="md"
            >
                <UserForm
                    user={editingUser}
                    onSubmit={editingUser ? handleUpdateUser : handleAddUser}
                    onCancel={() => {
                        setShowUserModal(false);
                        setEditingUser(null);
                    }}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                }}
                title="Delete User"
                size="sm"
            >
                <div>
                    <p className="mb-lg">
                        Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
                        This action cannot be undone and will prevent them from accessing the system.
                    </p>
                    <div className="flex justify-end gap-md">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setUserToDelete(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-error"
                            onClick={handleConfirmDelete}
                        >
                            Delete User
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
                            background-color: #d32f2f; /* Darker red */
                        }
                    `}</style>
                </div>
            </Modal>

            <style>{`
        .settings-page {
          animation: fadeIn var(--transition-normal);
        }

        .tabs .tab {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .settings-section {
          animation: fadeIn var(--transition-normal);
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-xl);
        }

        .section-header h2 {
          font-size: 1.25rem;
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .you-badge {
          padding: 2px 8px;
          background: var(--accent-glow);
          border-radius: var(--radius-full);
          font-size: 0.6875rem;
          color: var(--accent-tertiary);
        }

        .action-buttons {
          display: flex;
          gap: var(--spacing-xs);
        }

        .roles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-lg);
        }

        .role-card {
          padding: var(--spacing-xl);
        }

        .role-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          color: var(--accent-primary);
        }

        .role-header h3 {
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .permissions-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .entity-cell {
          text-transform: capitalize;
        }

        .details-cell {
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 992px) {
          .roles-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

// Permission Item Component
const PermissionItem = ({ label, enabled }) => (
    <div className={`permission-item ${enabled ? 'enabled' : 'disabled'}`}>
        <span className="permission-dot" />
        <span>{label}</span>

        <style>{`
      .permission-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .permission-item.enabled {
        color: var(--text-primary);
      }

      .permission-item.disabled {
        opacity: 0.5;
      }

      .permission-dot {
        width: 8px;
        height: 8px;
        border-radius: var(--radius-full);
        background: var(--text-muted);
      }

      .permission-item.enabled .permission-dot {
        background: var(--status-success);
      }
    `}</style>
    </div>
);

// User Form Component
const UserForm = ({ user, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'interviewer'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="user-form">
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
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label className="form-label">Role *</label>
                <select
                    name="role"
                    className="form-select"
                    value={formData.role}
                    onChange={handleChange}
                    required
                >
                    <option value="interviewer">Interviewer</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                    {user ? 'Update User' : 'Add User'}
                </button>
            </div>

            <style>{`
        .user-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--border-secondary);
        }
      `}</style>
        </form>
    );
};

export default Settings;
