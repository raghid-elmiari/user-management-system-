import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MOCK_USERS = [
  { id: 1, name: 'Super Administrator', username: 'admin',   email: 'admin@example.com',   role: 'ROLE_ADMIN',   status: 'Active' },
  { id: 2, name: 'General Manager',     username: 'manager', email: 'manager@example.com', role: 'ROLE_MANAGER', status: 'Active' },
  { id: 3, name: 'Standard User',       username: 'user',    email: 'user@example.com',    role: 'ROLE_USER',    status: 'Active' },
];

const roleColor = (role) => {
  if (role === 'ROLE_ADMIN')   return 'badge-orange';
  if (role === 'ROLE_MANAGER') return 'badge-blue';
  return 'badge-gray';
};

export const UsersPage = () => {
  const { loading, hasPermission } = useAuth();
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');

  // All hooks first, THEN conditional return
  useEffect(() => {
    setUsers(MOCK_USERS);
  }, []);

  if (loading) return null;
  if (!hasPermission('user:read')) return <Navigate to="/dashboard" replace />;

  const canEdit = hasPermission('user:write');
  const canDelete = hasPermission('user:delete');

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            User <span className="page-title-accent">Management</span>
          </h1>
          <p className="page-subtitle">
            {canEdit
              ? 'Manage users, assign roles, and review account status'
              : 'View team members and their assigned roles'}
          </p>
        </div>
        {canEdit && (
          <button id="add-user-btn" className="btn btn-primary">+ Add User</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: 340 }}>
          <span className="search-bar-icon">🔍</span>
          <input
            id="users-search"
            type="search"
            className="form-control"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              {(canEdit || canDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6}>
                  <div className="empty-state">
                    <div className="empty-icon">👤</div>
                    <div className="empty-title">No users found</div>
                    <div className="empty-text">
                      {search ? 'Try a different search term.' : 'No users available.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--color-text-faint)' }}>{u.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--color-primary-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0,
                      }}>
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td><code style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>@{u.username}</code></td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                  <td><span className={`badge ${roleColor(u.role)}`}>{u.role.replace('ROLE_', '')}</span></td>
                  <td><span className="badge badge-green">● {u.status}</span></td>
                  {(canEdit || canDelete) && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {canEdit && <button className="btn btn-secondary btn-sm" title="Edit">✏️</button>}
                        {canDelete && <button className="btn btn-danger btn-sm" title="Delete">🗑️</button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!canEdit && !canDelete && (
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'var(--color-info-subtle)',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13, color: 'var(--color-text-muted)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span>ℹ️</span> You have read-only access. Contact an admin to make changes.
        </div>
      )}
    </div>
  );
};