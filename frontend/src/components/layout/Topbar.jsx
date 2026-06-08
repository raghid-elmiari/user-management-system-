import { useAuth } from '../../context/AuthContext';

export const Topbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div>RBAC Admin</div>
      <div className="topbar-right">
        <span>{user?.username || 'Guest'}</span>
        <button type="button" onClick={logout}>Logout</button>
      </div>
    </header>
  );
};
