import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Check,
  Sun,
  Moon,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Header = ({ collapsed }) => {
  const { user, users, switchUser } = useAuth();
  const { getUpcomingInterviews, refreshData, loading, isConnected } = useData();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const upcomingInterviews = getUpcomingInterviews().slice(0, 5);

  const handleSearch = (e) => {
    e.preventDefault();
    // Global search implementation
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className={`header ${collapsed ? 'collapsed' : ''}`}>
      <div className="header-left">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search candidates, jobs, interviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      <div className="header-right">


        {/* Notifications */}
        <div className="header-dropdown">
          <button
            className="header-btn notification-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
          >
            <Bell size={20} />
            {upcomingInterviews.length > 0 && (
              <span className="notification-badge">{upcomingInterviews.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="dropdown-menu notifications-menu">
              <div className="dropdown-header">
                <h4>Notifications</h4>
              </div>
              {upcomingInterviews.length > 0 ? (
                <div className="notification-list">
                  {upcomingInterviews.map(interview => (
                    <div key={interview.id} className="notification-item">
                      <div className="notification-icon">
                        <Bell size={16} />
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">
                          Interview with <strong>{interview.candidateName}</strong>
                        </p>
                        <span className="notification-time">
                          {new Date(interview.scheduledAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-notifications">
                  <p>No upcoming interviews</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="header-dropdown">
          <button
            className="user-menu-btn"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
          >
            <div className="avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role || 'guest'}</span>
            </div>
            <ChevronDown size={16} className={`chevron ${showUserMenu ? 'open' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="dropdown-menu user-menu">
              <div className="dropdown-header">
                <h4>{user?.name || 'User'}</h4>
                <span className="text-sm text-muted">{user?.role || 'Guest'}</span>
              </div>
              <button className="dropdown-item danger">
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .header {
          position: fixed;
          top: 0;
          left: var(--sidebar-width);
          right: 0;
          height: var(--header-height);
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-primary);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--spacing-xl);
          z-index: 99;
          transition: left var(--transition-normal);
        }

        .header.collapsed {
          left: var(--sidebar-collapsed);
        }

        .header-left {
          flex: 1;
          max-width: 500px;
        }

        .search-form {
          width: 100%;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .header-btn {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-glass);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }

        .header-btn:hover {
          background: var(--bg-glass-hover);
          color: var(--text-primary);
          border-color: var(--accent-primary);
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: var(--status-error);
          border-radius: var(--radius-full);
          font-size: 0.6875rem;
          font-weight: 600;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-dropdown {
          position: relative;
        }

        .user-menu-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-glass);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .user-menu-btn:hover {
          background: var(--bg-glass-hover);
          border-color: var(--accent-primary);
        }

        .user-menu-btn .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .user-menu-btn .user-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .user-menu-btn .user-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        .user-menu-btn .chevron {
          color: var(--text-secondary);
          transition: transform var(--transition-fast);
        }

        .user-menu-btn .chevron.open {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 280px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          animation: fadeIn var(--transition-fast);
          z-index: 200;
        }

        .dropdown-header {
          padding: var(--spacing-md) var(--spacing-lg);
          border-bottom: 1px solid var(--border-secondary);
        }

        .dropdown-header h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-list {
          padding: var(--spacing-sm);
        }

        .user-option {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .user-option:hover {
          background: var(--bg-glass-hover);
        }

        .user-option.active {
          background: var(--accent-glow);
        }

        .user-option-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .user-option-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .user-option-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        .check-icon {
          color: var(--accent-primary);
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border-secondary);
          margin: var(--spacing-xs) 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-lg);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .dropdown-item:hover {
          background: var(--bg-glass-hover);
          color: var(--text-primary);
        }

        .dropdown-item.danger:hover {
          color: var(--status-error);
        }

        .notifications-menu {
          min-width: 320px;
        }

        .notification-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          gap: var(--spacing-md);
          padding: var(--spacing-md) var(--spacing-lg);
          border-bottom: 1px solid var(--border-secondary);
          transition: background var(--transition-fast);
        }

        .notification-item:hover {
          background: var(--bg-glass-hover);
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-icon {
          width: 32px;
          height: 32px;
          background: var(--accent-glow);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-primary);
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-text {
          font-size: 0.875rem;
          color: var(--text-primary);
          margin: 0;
        }

        .notification-time {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .empty-notifications {
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--text-secondary);
        }

        @media (max-width: 992px) {
          .header {
            left: var(--sidebar-collapsed);
          }
        }

        @media (max-width: 768px) {
          .header, .header.collapsed {
            left: 0;
            padding: 0 var(--spacing-md);
          }
          .header-left {
            display: none;
          }
          .user-menu-btn .user-info {
            display: none;
          }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .connection-status-wrapper {
          position: relative;
        }

        .status-dot {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid var(--bg-card);
          z-index: 10;
        }

        .status-dot.connected {
          background-color: var(--status-success);
          box-shadow: 0 0 0 2px var(--bg-card);
        }

        .status-dot.disconnected {
          background-color: var(--status-error);
          box-shadow: 0 0 0 2px var(--bg-card);
        }
      `}</style>
    </header>
  );
};

export default Header;
