import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, userRole, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_ITEMS = [
    { to: '/dashboard',   label: 'Dashboard',   icon: '⊞' },
    { to: '/users',       label: 'Users',       icon: '👥', permission: 'user:read' },
    { to: '/roles',       label: 'Roles',       icon: '🛡️', permission: 'role:read' },
    { to: '/permissions', label: 'Permissions', icon: '🔑', permission: 'permission:read' },
    { to: '/hierarchy',   label: 'Hierarchy',   icon: '🌳', permission: 'hierarchy:read' },
  ].filter((item) => !item.permission || hasPermission(item.permission));

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'GU';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="navbar animate-slide-down">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="navbar-brand-icon">🔐</div>
          <div className="navbar-brand-text">Nexus<span>RBAC</span></div>
        </div>

        {/* Desktop nav */}
        <ul className="navbar-links" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon" aria-hidden="true">{icon}</span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right section */}
        <div className="navbar-right">
          {user && (
            <div className="navbar-badge">
              <div className="navbar-avatar" title={user.username}>{initials}</div>
              <span className="navbar-username">{user.username}</span>
              {userRole && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  border: '1px solid rgba(249,115,22,0.3)',
                }}>
                  {userRole.replace('ROLE_', '')}
                </span>
              )}
            </div>
          )}
          <button type="button" className="navbar-logout-btn" onClick={handleLogout} id="logout-button">
            <span>↩</span> Logout
          </button>

          {/* Hamburger */}
          <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <span /><span /><span />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="mobile-nav-overlay open" onClick={() => setMobileOpen(false)} />
      )}

      <nav className={`mobile-nav-drawer${mobileOpen ? ' open' : ''}`}>
        <div className="navbar-brand" style={{ marginBottom: 24 }}>
          <div className="navbar-brand-icon">🔐</div>
          <div className="navbar-brand-text">Nexus<span>RBAC</span></div>
        </div>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          {user && (
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <div className="navbar-avatar">{initials}</div>
              <span className="navbar-username">{user.username}</span>
            </div>
          )}
          <button type="button" className="btn btn-secondary w-full" onClick={handleLogout}>
            ↩ Logout
          </button>
        </div>
      </nav>
    </>
  );
};