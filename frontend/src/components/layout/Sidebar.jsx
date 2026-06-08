import { NavLink } from 'react-router-dom';

export const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/users">Users</NavLink>
        <NavLink to="/roles">Roles</NavLink>
        <NavLink to="/permissions">Permissions</NavLink>
        <NavLink to="/hierarchy">Hierarchy</NavLink>
      </nav>
    </aside>
  );
};
