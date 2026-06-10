import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MOCK_ROLES = [
  { id: 1, name: 'ROLE_ADMIN',   description: 'Administrator with full access',            permissions: 7 },
  { id: 2, name: 'ROLE_MANAGER', description: 'Manager with user management capabilities', permissions: 3 },
  { id: 3, name: 'ROLE_USER',    description: 'Regular user with basic access',            permissions: 1 },
];

export const RolesPage = () => {
  const { loading, hasPermission } = useAuth();
  const [roles, setRoles]   = useState([]);
  const [search, setSearch] = useState('');

  // All hooks first, THEN conditional return
  useEffect(() => {
    setRoles(MOCK_ROLES);
  }, []);

  if (loading) return null;
  if (!hasPermission('role:read')) return <Navigate to="/dashboard" replace />;

  const canEdit = hasPermission('role:write');
  const canDelete = hasPermission('role:delete');

  const filtered = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            Role <span className="page-title-accent">Management</span>
          </h1>
          <p className="page-subtitle">
            {canEdit
              ? 'Define roles and configure their permission assignments'
              : 'View available roles and their permission counts'}
          </p>
        </div>
        {canEdit && (
          <button id="add-role-btn" className="btn btn-primary">+ Create Role</button>
        )}
      </div>

      <div style={{ marginBottom: 20, maxWidth: 340 }}>
        <div className="search-bar">
          <span className="search-bar-icon">🔍</span>
          <input
            id="roles-search"
            type="search"
            className="form-control"
            placeholder="Search roles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state">
              <div className="empty-icon">🛡️</div>
              <div className="empty-title">No roles found</div>
              <div className="empty-text">Try a different search term.</div>
            </div>
          </div>
        ) : (
          filtered.map((role, i) => (
            <div key={role.id} className="card" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>
                    🛡️
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{role.name.replace('ROLE_', '')}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{role.name}</div>
                  </div>
                </div>
                {(canEdit || canDelete) && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {canEdit && <button className="btn btn-secondary btn-sm" title="Edit">✏️</button>}
                    {canDelete && <button className="btn btn-danger btn-sm" title="Delete">🗑️</button>}
                  </div>
                )}
              </div>
              <div className="card-body" style={{ paddingTop: 16, paddingBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 14 }}>
                  {role.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="badge badge-orange">🔑 {role.permissions} permissions</span>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
                    View permissions →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
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
          <span>ℹ️</span> You have read-only access. Contact an admin to create or modify roles.
        </div>
      )}
    </div>
  );
};