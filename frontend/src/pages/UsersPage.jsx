import { useEffect, useState } from 'react';

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
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // TODO: fetch from API → for now load mock data
    setUsers(MOCK_USERS);
  }, []);

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
          <p className="page-subtitle">Manage users, assign roles, and review account status</p>
        </div>
        <button id="add-user-btn" className="btn btn-primary">
          + Add User
        </button>
      </div>

      {/* Toolbar */}
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

      {/* Table */}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-icon">👤</div>
                    <div className="empty-title">No users found</div>
                    <div className="empty-text">
                      {search ? 'Try a different search term.' : 'Add your first user to get started.'}
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
                      <div
                        style={{
                          width: 32, height: 32,
                          borderRadius: '50%',
                          background: 'var(--color-primary-subtle)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                          color: 'var(--color-primary)',
                          flexShrink: 0,
                        }}
                      >
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td>
                    <code style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>@{u.username}</code>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${roleColor(u.role)}`}>{u.role.replace('ROLE_', '')}</span>
                  </td>
                  <td>
                    <span className="badge badge-green">● {u.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" title="Edit">✏️</button>
                      <button className="btn btn-danger btn-sm" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
