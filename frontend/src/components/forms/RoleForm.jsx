import { useState } from 'react';

export const RoleForm = ({ onSubmit, onCancel, initialValues = {}, loading = false }) => {
  const [name, setName] = useState(initialValues.name || '');
  const [description, setDescription] = useState(initialValues.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, description });
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