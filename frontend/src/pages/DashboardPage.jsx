import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// What each role can see
const ROLE_CONFIG = {
  ROLE_ADMIN: {
    greeting: "Admin",
    subtitle: "Full system access — manage users, roles, permissions and hierarchy.",
    stats: [
      { icon: '👥', label: 'Total Users',      value: '—', iconClass: 'stat-icon-orange' },
      { icon: '🛡️', label: 'Active Roles',     value: '—', iconClass: 'stat-icon-blue'   },
      { icon: '🔑', label: 'Permissions',       value: '—', iconClass: 'stat-icon-green'  },
      { icon: '✅', label: 'Active Sessions',   value: '—', iconClass: 'stat-icon-yellow' },
    ],
    actions: [
      { icon: '👤', title: 'Add New User',        desc: 'Create and invite a new team member',    to: '/users',       color: 'var(--orange-500)',    permission: 'user:write' },
      { icon: '🛡️', title: 'Create Role',         desc: 'Define a new role with permissions',     to: '/roles',       color: 'var(--color-info)',    permission: 'role:write' },
      { icon: '🔑', title: 'Manage Permissions',  desc: 'Configure permission scopes',            to: '/permissions', color: 'var(--color-success)', permission: 'permission:write' },
      { icon: '🌳', title: 'View Hierarchy',      desc: 'See role parent-child relationships',    to: '/hierarchy',   color: 'var(--color-warning)', permission: 'hierarchy:read' },
    ],
  },
  ROLE_MANAGER: {
    greeting: "Manager",
    subtitle: "Manage your team — view users and roles assigned to your group.",
    stats: [
      { icon: '👥', label: 'Team Members',     value: '—', iconClass: 'stat-icon-orange' },
      { icon: '🛡️', label: 'Assigned Roles',  value: '—', iconClass: 'stat-icon-blue'   },
      { icon: '✅', label: 'Active Sessions',  value: '—', iconClass: 'stat-icon-yellow' },
    ],
    actions: [
      { icon: '👤', title: 'View Users',   desc: 'Browse and manage team members', to: '/users',     color: 'var(--orange-500)', permission: 'user:read' },
      { icon: '🛡️', title: 'View Roles',   desc: 'See roles available in the system', to: '/roles',  color: 'var(--color-info)', permission: 'role:read' },
    ],
  },
  ROLE_USER: {
    greeting: "User",
    subtitle: "Welcome! Here's a summary of your access.",
    stats: [
      { icon: '🛡️', label: 'Your Role',       value: '—', iconClass: 'stat-icon-blue'   },
      { icon: '🔑', label: 'Your Permissions', value: '—', iconClass: 'stat-icon-green'  },
    ],
    actions: [
      { icon: '🌳', title: 'View Hierarchy', desc: 'See where your role fits', to: '/hierarchy', color: 'var(--color-warning)', permission: 'hierarchy:read' },
    ],
  },
};

const DEFAULT_CONFIG = ROLE_CONFIG.ROLE_USER;

export const DashboardPage = () => {
  const { user, userRole, hasPermission } = useAuth();

  const config = ROLE_CONFIG[userRole] ?? DEFAULT_CONFIG;
  const displayName = user?.username ?? user?.name ?? "there";
  const quickActions = config.actions.filter((action) => !action.permission || hasPermission(action.permission));

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            Welcome back, <span className="page-title-accent">{displayName}</span>
          </h1>
          <p className="page-subtitle">{config.subtitle}</p>
        </div>
        {userRole && (
          <div style={{
            padding: '6px 14px',
            background: 'var(--color-primary-subtle)',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 'var(--radius-full)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--orange-500)',
          }}>
            {userRole.replace('ROLE_', '')}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {config.stats.map((s, i) => (
          <div className="stat-card" key={s.label} style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`stat-icon ${s.iconClass}`}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Quick Actions</div>
        </div>
        <div className="card-body" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
        }}>
          {quickActions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="stat-card"
              style={{ textDecoration: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}
            >
              <div style={{
                width: 40, height: 40,
                borderRadius: 'var(--radius-md)',
                background: `${a.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {a.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 3 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* System info */}
      <div style={{
        padding: '18px 24px',
        background: 'var(--color-primary-subtle)',
        border: '1px solid rgba(249,115,22,0.25)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ fontSize: 28 }}>🚀</span>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>System is running</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            NexusRBAC — Role-Based Access Control System &nbsp;·&nbsp; v1.0
          </div>
        </div>
      </div>
    </div>
  );
};