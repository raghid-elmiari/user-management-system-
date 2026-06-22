import { useState } from 'react';

const flattenRoles = (roles) => roles.map((r) => ({ id: r.id, name: r.name }));

/** Collects a role's id plus every descendant id, so it can't be offered as its own parent. */
const collectDescendantIds = (roles, rootId) => {
  const byParent = new Map();
  roles.forEach((r) => {
    const key = r.parentRoleId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(r.id);
  });
  const result = new Set([rootId]);
  const queue = [rootId];
  while (queue.length) {
    const current = queue.pop();
    (byParent.get(current) || []).forEach((childId) => {
      if (!result.has(childId)) {
        result.add(childId);
        queue.push(childId);
      }
    });
  }
  return result;
};

export const RoleForm = ({ onSubmit, onCancel, initialValues = {}, allRoles = [], loading = false }) => {
  const [name, setName] = useState(initialValues.name || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [parentRoleId, setParentRoleId] = useState(initialValues.parentRoleId || '');

  const blockedIds = initialValues.id ? collectDescendantIds(allRoles, initialValues.id) : new Set();
  const parentOptions = flattenRoles(allRoles).filter((r) => !blockedIds.has(r.id));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, description, parentRoleId: parentRoleId || null });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-group">
        <label className="form-label" htmlFor="role-name">Role Name</label>
        <input
          id="role-name"
          className="form-control"
          placeholder="e.g. ROLE_MODERATOR"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="role-desc">Description</label>
        <textarea
          id="role-desc"
          className="form-control"
          placeholder="Describe what this role can do…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={loading}
          style={{ resize: 'vertical' }}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="role-parent">Parent Role</label>
        <select
          id="role-parent"
          className="form-control"
          value={parentRoleId}
          onChange={(e) => setParentRoleId(e.target.value)}
          disabled={loading}
        >
          <option value="">No parent — root role</option>
          {parentOptions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <span className="form-hint">
          Permissions assigned to this role are also granted to its parent and every role above it.
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
        >
          {loading ? 'Saving…' : 'Save Role'}
        </button>
      </div>
    </div>
  );
};
