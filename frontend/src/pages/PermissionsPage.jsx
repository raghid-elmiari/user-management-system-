import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rolesApi } from '../api/rolesApi';

// All available permissions in the system
const ALL_PERMISSIONS = [
  { id: 'user:read', resource: 'user', action: 'read', description: 'View user profiles and list' },
  { id: 'user:write', resource: 'user', action: 'write', description: 'Create and update users' },
  { id: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users from the system' },
  { id: 'role:read', resource: 'role', action: 'read', description: 'View roles and their details' },
  { id: 'role:write', resource: 'role', action: 'write', description: 'Create and update roles' },
  { id: 'role:delete', resource: 'role', action: 'delete', description: 'Delete roles from the system' },
  { id: 'permission:read', resource: 'permission', action: 'read', description: 'View permission definitions' },
  { id: 'permission:write', resource: 'permission', action: 'write', description: 'Create and update permissions' },
  { id: 'hierarchy:read', resource: 'hierarchy', action: 'read', description: 'View role hierarchy tree' },
];

// Default permission assignments per role (fallback only)
const DEFAULT_ROLE_PERMISSIONS = {
  ROLE_ADMIN: [
    'user:read', 'user:write', 'user:delete',
    'role:read', 'role:write', 'role:delete',
    'permission:read', 'permission:write',
  ],
  ROLE_MANAGER: [
    'user:read', 'user:write',
    'role:read',
    'hierarchy:read',
  ],
  ROLE_USER: [
    'hierarchy:read',
  ],
};

const ACTION_COLORS = { read: 'badge-blue', write: 'badge-orange', delete: 'badge-red' };

// Generate a consistent color/icon for dynamic roles
const ROLE_COLOR_PALETTE = [
  { color: 'var(--orange-500)', bg: 'var(--color-primary-subtle)', icon: '👑' },
  { color: 'var(--color-info)', bg: 'var(--color-info-subtle)', icon: '🧑‍💼' },
  { color: 'var(--color-success)', bg: 'var(--color-success-subtle)', icon: '👤' },
  { color: 'var(--color-warning)', bg: 'var(--color-warning-subtle)', icon: '🔧' },
  { color: 'var(--color-error)', bg: 'var(--color-error-subtle)', icon: '🛡️' },
];

const STATIC_ROLE_META = {
  ROLE_ADMIN: { label: 'Admin', color: 'var(--orange-500)', bg: 'var(--color-primary-subtle)', icon: '👑' },
  ROLE_MANAGER: { label: 'Manager', color: 'var(--color-info)', bg: 'var(--color-info-subtle)', icon: '🧑‍💼' },
  ROLE_USER: { label: 'User', color: 'var(--color-success)', bg: 'var(--color-success-subtle)', icon: '👤' },
};

const getRoleMeta = (roleName, index) => {
  if (STATIC_ROLE_META[roleName]) return STATIC_ROLE_META[roleName];
  const palette = ROLE_COLOR_PALETTE[index % ROLE_COLOR_PALETTE.length];
  const label = roleName.replace(/^ROLE_/, '');
  return { label, ...palette };
};

export const PermissionsPage = () => {
  const { loading, hasPermission, refreshCurrentUser, applyRolePermissions } = useAuth();

  const [roles, setRoles] = useState([]); // dynamic list from backend
  const [rolePermissions, setRolePermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const response = await rolesApi.getAll();
        const rolesData = response.data ?? [];

        // Build permissions map — backend returns permissions as List<String> already
        const permissionsMap = {};
        rolesData.forEach(role => {
          permissionsMap[role.name] = Array.isArray(role.permissions)
            ? role.permissions.map(p => (typeof p === 'string' ? p : p.name ?? p.id ?? ''))
            : [];
        });

        setRoles(rolesData);
        setRolePermissions(permissionsMap);

        // Select first role by default
        if (rolesData.length > 0) {
          setSelectedRole(rolesData[0].name);
        }
      } catch (error) {
        console.error('Failed to load permissions', error);
        // Fallback to defaults
        const fallbackRoles = Object.keys(DEFAULT_ROLE_PERMISSIONS).map((name, i) => ({ id: i + 1, name }));
        setRoles(fallbackRoles);
        setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
        setSelectedRole(fallbackRoles[0]?.name ?? null);
      } finally {
        setPageLoading(false);
      }
    };

    loadPermissions();
  }, []);

  if (loading || pageLoading) return null;
  if (!hasPermission('permission:read')) return <Navigate to="/dashboard" replace />;

  const canEdit = hasPermission('permission:write');

  const resources = [...new Set(ALL_PERMISSIONS.map(p => p.resource))];

  const currentPerms = selectedRole ? (rolePermissions[selectedRole] ?? []) : [];

  const filtered = filterResource
    ? ALL_PERMISSIONS.filter(p => p.resource === filterResource)
    : ALL_PERMISSIONS;

  const toggle = (permId) => {
    if (!canEdit || !selectedRole) return;

    setRolePermissions(prev => {
      const existing = prev[selectedRole] ?? [];
      const updated = existing.includes(permId)
        ? existing.filter(p => p !== permId)
        : [...existing, permId];
      return { ...prev, [selectedRole]: updated };
    });
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!canEdit || !selectedRole) return;

    try {
      await rolesApi.updatePermissions(selectedRole, rolePermissions[selectedRole]);
      setSaveError('');
      await refreshCurrentUser();
      applyRolePermissions(selectedRole, rolePermissions[selectedRole]);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save permissions', error);
      setSaveError('Could not save to the server. Check that the backend is running and the PUT /api/roles/{roleName}/permissions endpoint is available.');
    }
  };

  const handleReset = async () => {
    if (!canEdit || !selectedRole) return;

    // Re-fetch from backend to restore true saved state
    try {
      const response = await rolesApi.getAll();
      const rolesData = response.data ?? [];
      const permissionsMap = {};
      rolesData.forEach(role => {
        permissionsMap[role.name] = Array.isArray(role.permissions)
          ? role.permissions.map(p => (typeof p === 'string' ? p : p.name ?? p.id ?? ''))
          : [];
      });
      setRolePermissions(permissionsMap);
    } catch {
      setRolePermissions(prev => ({ ...prev, [selectedRole]: DEFAULT_ROLE_PERMISSIONS[selectedRole] ?? [] }));
    }

    setDirty(false);
    setSaved(false);
  };

  const allChecked = filtered.every(p => currentPerms.includes(p.id));
  const toggleAll = () => {
    if (!canEdit || !selectedRole) return;

    const filteredIds = filtered.map(p => p.id);
    setRolePermissions(prev => {
      const existing = prev[selectedRole] ?? [];
      const updated = allChecked
        ? existing.filter(id => !filteredIds.includes(id))
        : [...new Set([...existing, ...filteredIds])];
      return { ...prev, [selectedRole]: updated };
    });
    setDirty(true);
    setSaved(false);
  };

  const selectedRoleIndex = roles.findIndex(r => r.name === selectedRole);
  const meta = selectedRole ? getRoleMeta(selectedRole, selectedRoleIndex) : null;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            Permission <span className="page-title-accent">Manager</span>
          </h1>
          <p className="page-subtitle">
            Control what each role can do — assign or revoke permissions per role
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {dirty && canEdit && (
            <button className="btn btn-secondary" onClick={handleReset}>
              ↺ Reset
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!dirty || !canEdit}
          >
            💾 Save Changes
          </button>
        </div>
      </div>

      {/* Saved notice */}
      {saved && (
        <div style={{
          marginBottom: 16, padding: '10px 16px',
          background: 'var(--color-success-subtle)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13, color: 'var(--color-success)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          ✅ Permissions saved for {meta?.label}
        </div>
      )}

      {saveError && (
        <div style={{
          marginBottom: 16, padding: '10px 16px',
          background: 'var(--color-warning-subtle)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13, color: 'var(--color-warning)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span>⚠️</span>
          <span>{saveError}</span>
        </div>
      )}

      {/* Role selector tabs — dynamically built from backend roles */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {roles.map((role, index) => {
          const m = getRoleMeta(role.name, index);
          const active = selectedRole === role.name;
          const count = (rolePermissions[role.name] ?? []).length;
          return (
            <button
              key={role.name}
              onClick={() => { setSelectedRole(role.name); setDirty(false); setSaved(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                border: active ? `2px solid ${m.color}` : '2px solid var(--color-border)',
                background: active ? m.bg : 'var(--color-surface)',
                cursor: 'pointer',
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                color: active ? m.color : 'var(--color-text-muted)',
                transition: 'all 0.15s',
                opacity: canEdit ? 1 : 0.85,
              }}
            >
              <span>{m.icon}</span>
              {m.label}
              <span style={{
                padding: '1px 7px',
                borderRadius: 'var(--radius-full)',
                background: active ? m.color : 'var(--color-surface2)',
                color: active ? '#fff' : 'var(--color-text-muted)',
                fontSize: 11, fontWeight: 700,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active role summary */}
      {meta && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: meta.bg,
          border: `1px solid ${meta.color}33`,
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{meta.icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: meta.color }}>{meta.label}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {currentPerms.length} of {ALL_PERMISSIONS.length} permissions granted
              </div>
            </div>
          </div>
          {/* Resource filter */}
          <select
            className="form-control"
            style={{ maxWidth: 180 }}
            value={filterResource}
            onChange={e => setFilterResource(e.target.value)}
          >
            <option value="">All resources</option>
            {resources.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      {/* Permissions table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 48 }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  disabled={!canEdit}
                  title={allChecked ? 'Revoke all' : 'Grant all'}
                  style={{ cursor: 'pointer', width: 16, height: 16 }}
                />
              </th>
              <th>Permission</th>
              <th>Resource</th>
              <th>Action</th>
              <th>Description</th>
              <th style={{ textAlign: 'center' }}>Granted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const granted = currentPerms.includes(p.id);
              return (
                <tr
                  key={p.id}
                  style={{
                    background: granted ? `${meta?.color ?? '#000'}08` : 'transparent',
                    cursor: canEdit ? 'pointer' : 'default',
                    opacity: granted ? 1 : 0.6,
                  }}
                  onClick={() => toggle(p.id)}
                >
                  <td onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={granted}
                      onChange={() => toggle(p.id)}
                      disabled={!canEdit}
                      style={{ cursor: 'pointer', width: 16, height: 16 }}
                    />
                  </td>
                  <td>
                    <code style={{
                      background: 'var(--color-surface2)', padding: '2px 8px',
                      borderRadius: 4, fontSize: 13,
                      color: granted ? (meta?.color ?? 'inherit') : 'var(--color-text-muted)',
                    }}>
                      {p.id}
                    </code>
                  </td>
                  <td><span className="badge badge-gray">{p.resource}</span></td>
                  <td>
                    <span className={`badge ${ACTION_COLORS[p.action] || 'badge-gray'}`}>
                      {p.action}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{p.description}</td>
                  <td style={{ textAlign: 'center' }}>
                    {granted
                      ? <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓</span>
                      : <span style={{ color: 'var(--color-text-faint)' }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div style={{
        marginTop: 20, padding: '12px 16px',
        background: 'var(--color-info-subtle)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 'var(--radius-md)',
        fontSize: 13, color: 'var(--color-text-muted)',
        display: 'flex', gap: 8,
      }}>
        <span>ℹ️</span>
        <span>
          {canEdit
            ? 'Changes only take effect after saving. Click a row or the checkbox to toggle a permission.'
            : 'You have read access only. Request permission:write to update role permissions.'}
        </span>
      </div>
    </div>
  );
};