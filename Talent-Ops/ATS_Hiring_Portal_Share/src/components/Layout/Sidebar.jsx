import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  GitBranch,
  Calendar,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';


const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      permission: null
    },
    {
      path: '/jobs',
      icon: Briefcase,
      label: 'Job Postings',
      permission: 'canManageJobs'
    },
    {
      path: '/pipeline',
      icon: GitBranch,
      label: 'Pipeline',
      permission: 'canManageCandidates'
    },
    {
      path: '/candidates',
      icon: Users,
      label: 'Candidates',
      permission: 'canManageCandidates'
    },
    {
      path: '/interviews',
      icon: Calendar,
      label: 'Interviews',
      permission: null
    },
    {
      path: '/feedback',
      icon: MessageSquare,
      label: 'Feedback',
      permission: 'canSubmitFeedback'
    },
    {
      path: '/offers',
      icon: FileText,
      label: 'Offers',
      permission: 'canManageOffers'
    },
    {
      path: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
      permission: 'canViewAnalytics'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      permission: null
    }
  ];

  const filteredItems = menuItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {!collapsed && (
            <>
              <div className="logo-icon">
                <Briefcase size={24} />
              </div>
              <div className="logo-text">
                <span className="logo-title">Talent Ops</span>
              </div>
            </>
          )}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={20} className="nav-icon" />
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {isActive && <div className="nav-indicator" />}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button
          className="nav-link return-btn"
          onClick={() => navigate('/')}
          title="Return to Home"
        >
          <LogOut size={20} className="nav-icon" />
          {!collapsed && <span className="nav-label">Return</span>}
        </button>
      </div>

      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: var(--sidebar-width);
          background: #0f172a;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width var(--transition-normal);
        }

        .sidebar.collapsed {
          width: var(--sidebar-collapsed);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-lg);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .logo-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: white;
          line-height: 1.2;
        }

        .logo-subtitle {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .sidebar-toggle {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-sm);
          color: #94a3b8;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .sidebar.collapsed .sidebar-toggle {
          margin: 0 auto;
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--spacing-md);
          overflow-y: auto;
        }

        .nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          color: #94a3b8;
          text-decoration: none;
          transition: all var(--transition-fast);
          position: relative;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .nav-link.active {
          background: #8b5cf6;
          color: white;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .nav-icon {
          flex-shrink: 0;
        }

        .nav-label {
          font-size: 0.9375rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .nav-indicator {
          display: none;
        }

        .sidebar.collapsed .nav-link {
          justify-content: center;
          padding: var(--spacing-md);
        }

        .sidebar.collapsed .nav-indicator {
          display: none;
        }

        .sidebar-footer {
          padding: var(--spacing-lg);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        .sidebar.collapsed .sidebar-footer {
          display: flex;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar.open {
            transform: translateX(0);
          }
        }

        .return-btn {
          width: 100%;
          border: none;
          cursor: pointer;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          margin-top: auto;
          justify-content: flex-start;
          transition: all var(--transition-fast);
        }
        
        .return-btn:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #fca5a5;
            box-shadow: none;
        }

        .return-btn .nav-icon {
            color: currentColor;
        }

        .sidebar.collapsed .return-btn {
            justify-content: center;
            padding: var(--spacing-md);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
