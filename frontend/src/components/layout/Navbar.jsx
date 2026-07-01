import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  ShieldCheck,
  KeyRound,
  Workflow,
  LogOut,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, userRole, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
    { to: '/users', label: 'Users', Icon: Users, permission: 'user:read' },
    { to: '/roles', label: 'Roles', Icon: ShieldCheck, permission: 'role:read' },
    { to: '/permissions', label: 'Permissions', Icon: KeyRound, permission: 'permission:read' },
    { to: '/hierarchy', label: 'Hierarchy', Icon: Workflow, permission: 'hierarchy:read' },
    { to: '/request-logs', label: 'Request Logs', Icon: FileText, permission: 'request-log:read' },
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
        <div className="navbar-brand">
          <div className="navbar-brand-icon">OG</div>
          <div className="navbar-brand-text">Ogero<span>RBAC</span></div>
        </div>

        <ul className="navbar-links" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon size={15} />
                </span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="navbar-right">
          {user && (
            <div className="navbar-badge">
              <div className="navbar-avatar" title={user.username}>{initials}</div>
              <span className="navbar-username">{user.username}</span>
              {userRole && (
                <span className="navbar-role-tag">{userRole.replace('ROLE_', '')}</span>
              )}
            </div>
          )}

          <button
            type="button"
            className="navbar-logout-btn"
            onClick={handleLogout}
            id="logout-button"
          >
            <LogOut size={14} /> Logout
          </button>

          <button
            className="hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="mobile-nav-overlay open" onClick={() => setMobileOpen(false)} />
      )}

      <nav className={`mobile-nav-drawer${mobileOpen ? ' open' : ''}`}>
        <div className="navbar-brand" style={{ marginBottom: 24 }}>
          <div className="navbar-brand-icon">OG</div>
          <div className="navbar-brand-text">Ogero<span>RBAC</span></div>
        </div>

        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <span className="nav-icon"><Icon size={15} /></span>
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
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>
    </>
  );
};