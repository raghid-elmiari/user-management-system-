import { useEffect, useMemo, useState } from 'react';
import { hierarchyApi } from '../api/hierarchyApi';
import { rolesApi } from '../api/rolesApi';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_VISUALS = {
  ROLE_ADMIN: { color: 'var(--color-primary)', bg: 'var(--color-primary-subtle)', icon: '👑' },
  ROLE_MANAGER: { color: 'var(--color-info)', bg: 'var(--color-info-subtle)', icon: '🧑‍💼' },
  ROLE_USER: { color: 'var(--color-success)', bg: 'var(--color-success-subtle)', icon: '👤' },
};

const formatLabel = (role) => role.description || role.name.replace('ROLE_', '').replace(/_/g, ' ');

const buildHierarchyTree = (roles, links) => {
  const nodes = new Map();
  const childIds = new Set();

  roles.forEach((role) => {
    const visuals = ROLE_VISUALS[role.name] || { color: 'var(--color-text-muted)', bg: 'var(--color-surface2)', icon: '🛡️' };
    nodes.set(role.id, {
      id: role.id,
      name: role.name.replace('ROLE_', ''),
      label: formatLabel(role),
      color: visuals.color,
      bg: visuals.bg,
      icon: visuals.icon,
      children: [],
    });
  });

  links.forEach((link) => {
    const parent = nodes.get(link.parentRoleId);
    const child = nodes.get(link.childRoleId);
    if (parent && child) {
      parent.children.push(child);
      childIds.add(link.childRoleId);
    }
  });

  return roles
    .map((role) => nodes.get(role.id))
    .filter((node) => node && !childIds.has(node.id));
};

const TreeNode = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="tree-item"
        style={{ paddingLeft: `${16 + depth * 20}px` }}
      >
        {hasChildren ? (
          <button
            style={{
              background: 'none', border: 'none',
              color: 'var(--color-text-faint)', cursor: 'pointer',
              fontSize: 12, padding: 0, lineHeight: 1,
            }}
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span style={{ width: 16, display: 'inline-block' }} />
        )}

        <div
          style={{
            width: 34, height: 34,
            borderRadius: 'var(--radius-md)',
            background: node.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}
        >
          {node.icon}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{node.label}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
            ROLE_{node.name}
          </div>
        </div>

        <span
          className="badge"
          style={{
            background: node.bg,
            color: node.color,
            border: `1px solid ${node.color}33`,
          }}
        >
          {node.name}
        </span>
      </div>

      {hasChildren && expanded && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const HierarchyPage = () => {
  const { refreshCurrentUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [links, setLinks] = useState([]);
  // null = still checking, true = allowed, false = denied
  const [accessChecked, setAccessChecked] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadHierarchy = async () => {
      try {
        // Refresh the user's permissions from the backend first.
        // This ensures that if an admin removed hierarchy:read from this user's
        // role since their last login, they are redirected immediately.
        const freshUser = await refreshCurrentUser();
        const allowed = Array.isArray(freshUser?.permissions)
          ? freshUser.permissions.includes('hierarchy:read')
          : false;

        if (cancelled) return;

        if (!allowed) {
          setAccessChecked(false);
          return;
        }

        const [rolesResponse, linksResponse] = await Promise.all([
          rolesApi.getAll(),
          hierarchyApi.getAll(),
        ]);

        if (cancelled) return;

        setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);
        setLinks(Array.isArray(linksResponse.data) ? linksResponse.data : []);
        setAccessChecked(true);
      } catch (error) {
        console.error('Failed to load hierarchy', error);
        if (!cancelled) {
          // If the refresh call itself 403'd, deny access
          if (error?.response?.status === 403) {
            setAccessChecked(false);
          } else {
            setRoles([]);
            setLinks([]);
            setAccessChecked(true);
          }
        }
      }
    };

    loadHierarchy();

    return () => {
      cancelled = true;
    };
  }, []);

  // Still verifying access — render nothing to avoid flash
  if (accessChecked === null) return null;

  if (!accessChecked) return <Navigate to="/dashboard" replace />;

  const hierarchy = buildHierarchyTree(roles, links);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            Role <span className="page-title-accent">Hierarchy</span>
          </h1>
          <p className="page-subtitle">
            Visual tree of parent-child role relationships
          </p>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Admin',   color: 'var(--color-primary)', bg: 'var(--color-primary-subtle)' },
          { label: 'Manager', color: 'var(--color-info)',    bg: 'var(--color-info-subtle)' },
          { label: 'User',    color: 'var(--color-success)', bg: 'var(--color-success-subtle)' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 12, height: 12,
                borderRadius: 3,
                background: l.color,
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tree */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🌳 Role Tree</div>
          <span className="badge badge-gray">{roles.length} roles</span>
        </div>
        <div className="card-body" style={{ padding: '12px 0' }}>
          {hierarchy.length > 0 ? (
            <div className="tree">
              {hierarchy.map((node) => (
                <TreeNode key={node.id} node={node} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🌳</div>
              <div className="empty-title">No hierarchy defined</div>
              <div className="empty-text">Create roles and add parent-child links to build the tree.</div>
            </div>
          )}
        </div>
      </div>

      {/* Info box */}
      <div
        style={{
          marginTop: 20,
          padding: '14px 18px',
          background: 'var(--color-info-subtle)',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          color: 'var(--color-text-muted)',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 16 }}>ℹ️</span>
        <span>
          Child roles inherit all permissions of their parent roles.
          ADMIN → MANAGER → USER means admin users have all permissions
          defined across all three roles.
        </span>
      </div>
    </div>
  );
};