export const DashboardPage = () => {
  const stats = [
    { icon: '👥', label: 'Total Users',       value: '—', iconClass: 'stat-icon-orange', delay: '0ms' },
    { icon: '🛡️', label: 'Active Roles',      value: '—', iconClass: 'stat-icon-blue',   delay: '60ms' },
    { icon: '🔑', label: 'Permissions',        value: '—', iconClass: 'stat-icon-green',  delay: '120ms' },
    { icon: '✅', label: 'Active Sessions',    value: '—', iconClass: 'stat-icon-yellow', delay: '180ms' },
  ];

  const quickActions = [
    { icon: '👤', title: 'Add New User',      desc: 'Create and invite a new team member',   to: '/users',       color: 'var(--orange-500)' },
    { icon: '🛡️', title: 'Create Role',       desc: 'Define a new role with permissions',     to: '/roles',       color: 'var(--color-info)' },
    { icon: '🔑', title: 'Manage Permissions', desc: 'Configure permission scopes',            to: '/permissions', color: 'var(--color-success)' },
    { icon: '🌳', title: 'View Hierarchy',     desc: 'See role parent-child relationships',    to: '/hierarchy',   color: 'var(--color-warning)' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            Dashboard <span className="page-title-accent">Overview</span>
          </h1>
          <p className="page-subtitle">
            Monitor users, roles, and permissions from one place
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div
            className="stat-card"
            key={s.label}
            style={{ animationDelay: s.delay }}
          >
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
        <div
          className="card-body"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {quickActions.map((a) => (
            <a
              key={a.title}
              href={a.to}
              className="stat-card"
              style={{ textDecoration: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: `${a.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                {a.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 3 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{a.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* System info card */}
      <div
        style={{
          padding: '18px 24px',
          background: 'var(--color-primary-subtle)',
          border: '1px solid rgba(249,115,22,0.25)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span style={{ fontSize: 28 }}>🚀</span>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>
            System is running
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            NexusRBAC — Role-Based Access Control System &nbsp;·&nbsp; v1.0
          </div>
        </div>
      </div>
    </div>
  );
};
