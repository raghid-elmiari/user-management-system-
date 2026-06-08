import { useEffect, useState } from 'react';

const MOCK_PERMISSIONS = [
  { id: 1, name: 'user:read',       resource: 'user',       action: 'read',   description: 'Read user details' },
  { id: 2, name: 'user:write',      resource: 'user',       action: 'write',  description: 'Create/Update user details' },
  { id: 3, name: 'user:delete',     resource: 'user',       action: 'delete', description: 'Delete users' },
  { id: 4, name: 'role:read',       resource: 'role',       action: 'read',   description: 'Read roles' },
  { id: 5, name: 'role:write',      resource: 'role',       action: 'write',  description: 'Create/Update roles' },
  { id: 6, name: 'permission:read', resource: 'permission', action: 'read',   description: 'Read permissions' },
  { id: 7, name: 'permission:write',resource: 'permission', action: 'write',  description: 'Create permissions' },
];

const ACTION_COLORS = {
  read:   'badge-blue',
  write:  'badge-orange',
  delete: 'badge-red',
};

export const PermissionsPage = () => {
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState('');
  const [filterResource, setFilterResource] = useState('');

  useEffect(() => {
    setPermissions(MOCK_PERMISSIONS);
  }, []);

  const resources = [...new Set(MOCK_PERMISSIONS.map((p) => p.resource))];

  const filtered = permissions.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchResource = !filterResource || p.resource === filterResource;
    return matchSearch && matchResource;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            Permission <span className="page-title-accent">Registry</span>
          </h1>
          <p className="page-subtitle">Manage permission actions and resource scopes</p>
        </div>
        <button id="add-permission-btn" className="btn btn-primary">
          + Add Permission
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: 340 }}>
          <span className="search-bar-icon">🔍</span>
          <input
            id="permissions-search"
            type="search"
            className="form-control"
            placeholder="Search permissions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          style={{ maxWidth: 180 }}
          value={filterResource}
          onChange={(e) => setFilterResource(e.target.value)}
          id="permissions-filter"
        >
          <option value="">All resources</option>
          {resources.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Permission</th>
              <th>Resource</th>
              <th>Action</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-icon">🔑</div>
                    <div className="empty-title">No permissions found</div>
                    <div className="empty-text">Try adjusting your search or filters.</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--color-text-faint)' }}>{p.id}</td>
                  <td>
                    <code
                      style={{
                        background: 'var(--color-surface2)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 13,
                        color: 'var(--color-primary)',
                      }}
                    >
                      {p.name}
                    </code>
                  </td>
                  <td>
                    <span className="badge badge-gray">{p.resource}</span>
                  </td>
                  <td>
                    <span className={`badge ${ACTION_COLORS[p.action] || 'badge-gray'}`}>
                      {p.action}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{p.description}</td>
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
