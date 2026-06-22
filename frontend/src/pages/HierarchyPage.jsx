import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Crown,
  Briefcase,
  User,
  Shield,
  GripVertical,
  Info,
  Workflow,
} from 'lucide-react';
import { rolesApi } from '../api/rolesApi';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/common/Toast';

const ROLE_VISUALS = {
  ROLE_ADMIN: { tone: 'orange', Icon: Crown },
  ROLE_MANAGER: { tone: 'blue', Icon: Briefcase },
  ROLE_USER: { tone: 'green', Icon: User },
};

const formatLabel = (node) => node.description || node.name.replace('ROLE_', '').replace(/_/g, ' ');

/** Collects this node's own id plus every descendant id — used to block drops that would create a cycle. */
const collectIds = (node, into = new Set()) => {
  into.add(node.id);
  node.children?.forEach((child) => collectIds(child, into));
  return into;
};

const findNode = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children || [], id);
    if (found) return found;
  }
  return null;
};

const TreeNode = ({ node, depth = 0, canEdit, dragState, setDragState, onDrop }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const visuals = ROLE_VISUALS[node.name] || { tone: 'gray', Icon: Shield };
  const { Icon } = visuals;

  const isDragging = dragState.draggedId === node.id;
  const isBlocked = dragState.draggedId && dragState.blockedIds.has(node.id);
  const isDropTarget = dragState.overId === node.id && !isBlocked;

  return (
    <div>
      <div
        className={`tree-item${isDragging ? ' tree-item-dragging' : ''}${isDropTarget ? ' tree-item-drop-target' : ''}`}
        style={{ paddingLeft: `${16 + depth * 20}px` }}
        draggable={canEdit}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          setDragState({ draggedId: node.id, blockedIds: collectIds(node), overId: null });
        }}
        onDragEnd={() => setDragState({ draggedId: null, blockedIds: new Set(), overId: null })}
        onDragOver={(e) => {
          if (!dragState.draggedId || isBlocked) return;
          e.preventDefault();
          if (dragState.overId !== node.id) setDragState((s) => ({ ...s, overId: node.id }));
        }}
        onDragLeave={() => setDragState((s) => (s.overId === node.id ? { ...s, overId: null } : s))}
        onDrop={(e) => {
          e.preventDefault();
          if (!dragState.draggedId || isBlocked) return;
          onDrop(dragState.draggedId, node.id);
        }}
      >
        {canEdit && (
          <span className="tree-drag-handle" aria-hidden="true">
            <GripVertical size={14} />
          </span>
        )}

        {hasChildren ? (
          <button
            className="tree-toggle"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="tree-toggle-spacer" />
        )}

        <div className={`tree-icon tree-icon-${visuals.tone}`}>
          <Icon size={16} />
        </div>

        <div style={{ flex: 1 }}>
          <div className="tree-label">{formatLabel(node)}</div>
          <div className="tree-sublabel">{node.name}</div>
        </div>

        <span className={`badge badge-${visuals.tone}`}>{node.name.replace('ROLE_', '')}</span>
      </div>

      {hasChildren && expanded && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              canEdit={canEdit}
              dragState={dragState}
              setDragState={setDragState}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const HierarchyPage = () => {
  const { refreshCurrentUser, hasPermission } = useAuth();
  const [tree, setTree] = useState([]);
  const [accessChecked, setAccessChecked] = useState(null);
  const [toast, setToast] = useState(null);
  const [dragState, setDragState] = useState({ draggedId: null, blockedIds: new Set(), overId: null });
  const [rootDropActive, setRootDropActive] = useState(false);

  const canEdit = hasPermission('role:write');

  const loadTree = useCallback(async () => {
    const res = await rolesApi.getTree();
    setTree(Array.isArray(res.data) ? res.data : []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const freshUser = await refreshCurrentUser();
        const allowed = Array.isArray(freshUser?.permissions)
          ? freshUser.permissions.includes('hierarchy:read')
          : false;

        if (cancelled) return;
        if (!allowed) {
          setAccessChecked(false);
          return;
        }

        await loadTree();
        if (!cancelled) setAccessChecked(true);
      } catch (error) {
        if (cancelled) return;
        if (error?.response?.status === 403) {
          setAccessChecked(false);
        } else {
          setTree([]);
          setAccessChecked(true);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [refreshCurrentUser, loadTree]);

  const handleMove = async (roleId, newParentRoleId) => {
    setDragState({ draggedId: null, blockedIds: new Set(), overId: null });
    setRootDropActive(false);
    if (roleId === newParentRoleId) return;

    const node = findNode(tree, roleId);
    if (newParentRoleId && node?.parentRoleId === newParentRoleId) return;
    if (!newParentRoleId && !node?.parentRoleId) return;

    try {
      await rolesApi.move(roleId, newParentRoleId);
      await loadTree();
      setToast({ type: 'success', message: 'Role hierarchy updated.' });
    } catch (err) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? 'Could not move this role.';
      setToast({ type: 'error', message: msg });
    }
  };

  const totalRoles = useMemo(() => {
    let count = 0;
    const walk = (nodes) => nodes.forEach((n) => { count += 1; walk(n.children || []); });
    walk(tree);
    return count;
  }, [tree]);

  if (accessChecked === null) return null;
  if (!accessChecked) return <Navigate to="/dashboard" replace />;

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="toast-container">
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Role Hierarchy</h1>
          <p className="page-subtitle">
            {canEdit
              ? 'Drag a role onto another to change its parent, or onto the drop zone below to make it a root role.'
              : 'Visual tree of parent-child role relationships.'}
          </p>
        </div>
      </div>

      <div className="legend-row">
        {[
          { label: 'Admin', tone: 'orange' },
          { label: 'Manager', tone: 'blue' },
          { label: 'User', tone: 'green' },
        ].map((l) => (
          <div key={l.label} className="legend-item">
            <span className={`legend-dot legend-dot-${l.tone}`} />
            <span className="legend-label">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Workflow size={16} />
            <span>Role Tree</span>
          </div>
          <span className="badge badge-gray">{totalRoles} roles</span>
        </div>
        <div className="card-body" style={{ padding: '12px 0' }}>
          {tree.length > 0 ? (
            <div className="tree">
              {tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  canEdit={canEdit}
                  dragState={dragState}
                  setDragState={setDragState}
                  onDrop={handleMove}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-title">No hierarchy defined</div>
              <div className="empty-text">Create roles and assign a parent to build the tree.</div>
            </div>
          )}
        </div>

        {canEdit && dragState.draggedId && (
          <div
            className={`tree-root-dropzone${rootDropActive ? ' tree-root-dropzone-active' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setRootDropActive(true);
            }}
            onDragLeave={() => setRootDropActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              handleMove(dragState.draggedId, null);
            }}
          >
            Drop here to make this a root role
          </div>
        )}
      </div>

      <div className="info-box">
        <Info size={16} />
        <span>
          Child roles inherit all permissions of their parent. ADMIN over MANAGER over USER means
          admin users hold every permission defined across all three roles.
        </span>
      </div>
    </div>
  );
};
