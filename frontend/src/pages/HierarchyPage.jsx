import { useEffect, useState } from 'react';

const MOCK_HIERARCHY = {
  id: 1,
  name: 'ADMIN',
  label: 'Super Administrator',
  color: 'var(--color-primary)',
  bg: 'var(--color-primary-subtle)',
  children: [
    {
      id: 2,
      name: 'MANAGER',
      label: 'General Manager',
      color: 'var(--color-info)',
      bg: 'var(--color-info-subtle)',
      children: [
        {
          id: 3,
          name: 'USER',
          label: 'Standard User',
          color: 'var(--color-success)',
          bg: 'var(--color-success-subtle)',
          children: [],
        },
      ],
    },
  ],
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
          🛡️
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
  const [hierarchy, setHierarchy] = useState(null);

  useEffect(() => {
    // TODO: fetch from API
    setHierarchy(MOCK_HIERARCHY);
  }, []);

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
          <span className="badge badge-gray">3 roles</span>
        </div>
        <div className="card-body" style={{ padding: '12px 0' }}>
          {hierarchy ? (
            <div className="tree">
              <TreeNode node={hierarchy} />
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🌳</div>
              <div className="empty-title">No hierarchy defined</div>
              <div className="empty-text">Create roles first, then link them here.</div>
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
