import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/usersApi';

const roleColor = (role) => {
  if (role === 'ROLE_ADMIN') return 'badge-orange';
  if (role === 'ROLE_MANAGER') return 'badge-blue';
  return 'badge-gray';
};

const extractRole = (u) => {
  if (u.role) return u.role;
  if (Array.isArray(u.roles) && u.roles.length > 0) return u.roles[0];
  return 'ROLE_USER';
};

export const UsersPage = () => {
  const { loading, hasPermission, hasRole } = useAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: '', roleName: 'ROLE_USER' });

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Delete confirm
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canEdit = hasPermission('user:write');
  const canDelete = hasPermission('user:delete');
  const isAdmin = hasRole('ROLE_ADMIN');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = useCallback(async () => {
    setFetching(true);
    try {
      const res = await usersApi.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setUsers(list.map(u => ({ ...u, role: extractRole(u) })));
    } catch {
      showToast('Could not load users from server', 'error');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  if (loading) return null;
  if (!hasPermission('user:read')) return <Navigate to="/dashboard" replace />;

  const filtered = users.filter(u =>
    [u.name, u.email, u.username].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  // ── CREATE ───────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await usersApi.create({
        name: newUser.name || newUser.username,
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        roleName: newUser.roleName,
      });
      const created = { ...res.data, role: newUser.roleName || extractRole(res.data) };
      setUsers(prev => [...prev, created]);
      setShowAdd(false);
      setNewUser({ name: '', username: '', email: '', password: '', roleName: 'ROLE_USER' });
      showToast('User created successfully');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── EDIT ─────────────────────────────────────────────────────────
  const openEdit = (u) => {
    setEditUser({ ...u, password: '', roleName: u.role });
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    if (!editUser.name || !editUser.email || !editUser.username) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editUser.name,
        username: editUser.username,
        email: editUser.email,
        roleName: editUser.roleName,
      };
      if (editUser.password) payload.password = editUser.password;

      const res = await usersApi.update(editUser.id, payload);
      const updated = { ...res.data, role: editUser.roleName || extractRole(res.data) };
      setUsers(prev => prev.map(u => u.id === editUser.id ? updated : u));
      setShowEdit(false);
      setEditUser(null);
      showToast('User updated successfully');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ───────────────────────────────────────────────────────
  const openDelete = (u) => {
    setDeleteTarget(u);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await usersApi.remove(deleteTarget.id);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setShowDelete(false);
      setDeleteTarget(null);
      showToast('User deleted');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14,
          background: toast.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: toast.type === 'error' ? '#991b1b' : '#065f46',
          border: `1px solid ${toast.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,.12)',
        }}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            User <span className="page-title-accent">Management</span>
          </h1>
          <p className="page-subtitle">
            {canEdit ? 'Manage users, assign roles, and review account status' : 'View team members and their assigned roles'}
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add User</button>
        )}
      </div>

      {/* Search */}
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
        {fetching ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading users…
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                {(canEdit || canDelete) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit || canDelete ? 7 : 6}>
                    <div className="empty-state">
                      <div className="empty-icon">👤</div>
                      <div className="empty-title">No users found</div>
                      <div className="empty-text">
                        {search ? 'Try a different search term.' : 'No users available.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--color-text-faint)' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--color-primary-subtle)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0,
                        }}>
                          {(u.name || u.username || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.name || u.username}</span>
                      </div>
                    </td>
                    <td><code style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>@{u.username}</code></td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                    <td><span className={`badge ${roleColor(u.role)}`}>{u.role?.replace('ROLE_', '')}</span></td>
                    <td><span className={`badge ${u.active !== false ? 'badge-green' : 'badge-gray'}`}>● {u.active !== false ? 'Active' : 'Inactive'}</span></td>
                    {(canEdit || canDelete) && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {canEdit && <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)} title="Edit">✏️</button>}
                          {canDelete && <button className="btn btn-danger btn-sm" onClick={() => openDelete(u)} title="Delete">🗑️</button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
          <span>ℹ️</span> You have read-only access. Contact an admin to make changes.
        </div>
      )}

      {/* --- ADD MODAL --- */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: 20 }}>Create New User</h2>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Full Name</label>
              <input className="form-control" placeholder="e.g. Jane Smith" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Username *</label>
              <input className="form-control" placeholder="e.g. jsmith" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" placeholder="e.g. jane@company.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Password *</label>
              <input className="form-control" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Role</label>
              <select className="form-control" value={newUser.roleName} onChange={e => setNewUser({ ...newUser, roleName: e.target.value })}>
                <option value="ROLE_USER">User</option>
                <option value="ROLE_MANAGER">Manager</option>
                {isAdmin && <option value="ROLE_ADMIN">Admin</option>}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEdit && editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: 20 }}>Edit User — {editUser.name || editUser.username}</h2>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Full Name</label>
              <input className="form-control" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Username</label>
              <input className="form-control" value={editUser.username} onChange={e => setEditUser({ ...editUser, username: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">New Password <span style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>(leave blank to keep current)</span></label>
              <input className="form-control" type="password" placeholder="Leave blank to keep unchanged" value={editUser.password} onChange={e => setEditUser({ ...editUser, password: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Role</label>
              <select className="form-control" value={editUser.roleName} onChange={e => setEditUser({ ...editUser, roleName: e.target.value })}>
                <option value="ROLE_USER">User</option>
                <option value="ROLE_MANAGER">Manager</option>
                {isAdmin && <option value="ROLE_ADMIN">Admin</option>}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowEdit(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRM --- */}
      {showDelete && deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: 12 }}>Delete User</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
              Are you sure you want to delete <strong>{deleteTarget.name || deleteTarget.username}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowDelete(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};