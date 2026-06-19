import { useEffect, useRef, useState } from 'react';
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
  const [loadError, setLoadError] = useState('');
  const loadPermissionsRef = useRef(null);

  useEffect(() => {
    const loadPermissions = async ({ silent = false } = {}) => {
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
        setLoadError('');

        // Select first role by default (initial load only)
        if (!silent && rolesData.length > 0) {
          setSelectedRole(rolesData[0].name);
        }
      } catch (error) {
        console.error('Failed to load permissions', error);
        const status = error?.response?.status;
        if (!silent) {
          if (status === 403) {
            // Don't pretend everything is fine with hardcoded fallback data —
            // that hid the real problem (missing role:read) behind what
            // looked like a working, just-stale page.
            setLoadError('You do not have access to view role permissions. Ask an admin to grant role:read or permission:read.');
            setRoles([]);
            setRolePermissions({});
            setSelectedRole(null);
          } else {
            // Non-auth failure (e.g. backend down) — keep the old fallback
            // behavior so the page is still usable for a demo/offline state.
            const fallbackRoles = Object.keys(DEFAULT_ROLE_PERMISSIONS).map((name, i) => ({ id: i + 1, name }));
            setRoles(fallbackRoles);
            setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
            setSelectedRole(fallbackRoles[0]?.name ?? null);
          }
        } else if (status === 403) {
          // A background poll started failing with 403 (e.g. permission was
          // revoked while the page was open) — surface it instead of
          // continuing to silently show the now-incorrect last-good grid.
          setLoadError('Your access to view role permissions was removed.');
        }
      } finally {
        setPageLoading(false);
      }
    };

    loadPermissions();
    loadPermissionsRef.current = loadPermissions;
  }, []);

  // The grid above is loaded once on mount and otherwise has no way to learn
  // that another session (e.g. an Admin editing this same role's
  // permissions) changed the data. Without this, a Manager who has the
  // Permissions page open keeps seeing a stale checkbox grid indefinitely,
  // even though their actual access (governed by the JWT) does update on
  // the existing token-refresh cycle. Poll on the same cadence so the
  // displayed grid stays in sync with the database.
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Don't clobber in-progress unsaved edits.
      if (dirty) return;
      loadPermissionsRef.current?.({ silent: true });
    }, 2 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [dirty]);

  if (loading || pageLoading) return null;
  if (!hasPermission('permission:read')) return <Navigate to="/dashboard" replace />;

  // The save action calls PUT /api/roles/{roleName}/permissions, which the
  // backend gates on permission:write — assigning permissions to a role is
  // treated as a permission-management action in this system.
  const canEdit = hasPermission('permission:write');
  const CanDelete =hasPermission('permission:delete')

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

      {loadError && (
        <div style={{
          marginBottom: 16, padding: '12px 16px',
          background: 'var(--color-error-subtle)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13, color: 'var(--color-error)',
          display: 'flex', gap: 8,
        }}>
          <span>⚠️</span>
          <span>{loadError}</span>
        </div>
      )}

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
              onClick={() => { setSelectedRole(role.name); setDirty(false); setSaved(false); setSaveError(''); }}
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