import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { hasPermission } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/users', label: 'Users', permission: 'user:read' },
    { to: '/roles', label: 'Roles', permission: 'role:read' },
    { to: '/permissions', label: 'Permissions', permission: 'permission:read' },
    { to: '/hierarchy', label: 'Hierarchy', permission: 'hierarchy:read' },
  ].filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <aside className="sidebar">
      <nav>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
