import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Search, SlidersHorizontal, UserX, Pencil, Trash2, Info, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/usersApi';
import { rolesApi } from '../api/rolesApi';

const roleColor = (role) => {
  if (role === 'ROLE_ADMIN')   return 'badge-orange';
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

  // Data & Pagination State
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState('createdAt');
  const [direction, setDirection] = useState('DESC');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter States
  const [search, setSearch] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterUsername, setFilterUsername] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterActive, setFilterActive] = useState(''); // '', 'true', 'false'
  const [filterRole, setFilterRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Common UI State
  const [roles, setRoles] = useState([]);
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
      const params = {
        page,
        size,
        sort,
        direction,
      };

      if (search) params.search = search;
      if (filterName) params.name = filterName;
      if (filterUsername) params.username = filterUsername;
      if (filterEmail) params.email = filterEmail;
      if (filterActive !== '') params.active = filterActive === 'true';
      if (filterRole && filterRole !== 'ALL') params.role = filterRole;
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();

      const res = await usersApi.getAll(params);
      const data = res.data;
      if (data) {
        const list = Array.isArray(data.content) ? data.content : [];
        setUsers(list.map(u => ({ ...u, role: extractRole(u) })));
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.totalElements ?? 0);
      }
    } catch (err) {
      showToast('Could not load users from server', 'error');
    } finally {
      setFetching(false);
    }
  }, [page, size, sort, direction, search, filterName, filterUsername, filterEmail, filterActive, filterRole, startDate, endDate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset page to 0 when filters change to avoid getting stuck on an empty page
  useEffect(() => {
    setPage(0);
  }, [search, filterName, filterUsername, filterEmail, filterActive, filterRole, startDate, endDate]);

  useEffect(() => {
    rolesApi.getAll()
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setRoles(list);
      })
      .catch(() => {
        setRoles([
          { name: 'ROLE_USER' },
          { name: 'ROLE_MANAGER' },
          { name: 'ROLE_ADMIN' },
        ]);
      });
  }, []);

  if (loading) return null;
  if (!hasPermission('user:read')) return <Navigate to="/dashboard" replace />;

  const handleSort = (field) => {
    if (sort === field) {
      setDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSort(field);
      setDirection('ASC');
    }
    setPage(0);
  };

  const resetFilters = () => {
    setSearch('');
    setFilterName('');
    setFilterUsername('');
    setFilterEmail('');
    setFilterActive('');
    setFilterRole('');
    setStartDate('');
    setEndDate('');
    setPage(0);
    showToast('Filters cleared');
  };

  // ── CREATE ───────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      await usersApi.create({
        name:     newUser.name || newUser.username,
        username: newUser.username,
        email:    newUser.email,
        password: newUser.password,
        roleName: newUser.roleName,
      });
      setShowAdd(false);
      setNewUser({ name: '', username: '', email: '', password: '', roleName: 'ROLE_USER' });
      showToast('User created successfully');
      loadUsers();
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
        name:     editUser.name,
        username: editUser.username,
        email:    editUser.email,
        roleName: editUser.roleName,
      };
      if (editUser.password) payload.password = editUser.password;

      await usersApi.update(editUser.id, payload);
      setShowEdit(false);
      setEditUser(null);
      showToast('User updated successfully.');
      loadUsers();
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
      setShowDelete(false);
      setDeleteTarget(null);
      showToast('User deleted');
      loadUsers();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Pagination helper calculations
  const startNum = totalElements === 0 ? 0 : page * size + 1;
  const endNum = Math.min((page + 1) * size, totalElements);

  const renderSortIndicator = (field) => {
    if (sort !== field) return <span style={{ color: 'var(--color-text-faint)', marginLeft: 4 }}>↕</span>;
    return direction === 'ASC' ? <span style={{ color: 'var(--color-primary)', marginLeft: 4 }}>▲</span> : <span style={{ color: 'var(--color-primary)', marginLeft: 4 }}>▼</span>;
  };

  return (
    <div className="animate-fade-in">

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type === 'error' ? 'error' : 'success'}`} style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.msg}</span>
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

      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, padding: 16, background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 280, maxWidth: 380 }}>
            <span className="search-bar-icon"><Search size={15} /></span>
            <input
              type="search"
              className="form-control"
              placeholder="Search by name, username or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={14} /> {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>
          {(search || filterName || filterUsername || filterEmail || filterActive || filterRole || startDate || endDate) && (
            <button className="btn btn-outline btn-sm" onClick={resetFilters}>Clear All</button>
          )}
        </div>

        {/* Collapsible Advanced Filters */}
        {showFilters && (
          <div className="animate-slide-down" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginTop: 12, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filter by Name</label>
              <input
                className="form-control"
                placeholder="Name matches..."
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filter by Username</label>
              <input
                className="form-control"
                placeholder="Username matches..."
                value={filterUsername}
                onChange={e => setFilterUsername(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filter by Email</label>
              <input
                className="form-control"
                placeholder="Email matches..."
                value={filterEmail}
                onChange={e => setFilterEmail(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-control" value={filterActive} onChange={e => setFilterActive(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role</label>
              <select className="form-control" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="">All Roles</option>
                {roles.map(r => (
                  <option key={r.name} value={r.name}>{r.name.replace('ROLE_', '')}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Created From</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Created To</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap" style={{ position: 'relative' }}>
        {fetching && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
          }}>
            <div style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Loading...</div>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Name {renderSortIndicator('name')}
              </th>
              <th onClick={() => handleSort('username')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Username {renderSortIndicator('username')}
              </th>
              <th onClick={() => handleSort('email')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Email {renderSortIndicator('email')}
              </th>
              <th>Role</th>
              <th onClick={() => handleSort('active')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Status {renderSortIndicator('active')}
              </th>
              <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Created At {renderSortIndicator('createdAt')}
              </th>
              {(canEdit || canDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={canEdit || canDelete ? 8 : 7}>
                  <div className="empty-state" style={{ padding: '48px 0' }}>
                    <UserX size={28} style={{ opacity: 0.5 }} />
                    <div className="empty-title" style={{ fontWeight: 700, margin: '8px 0' }}>No users found</div>
                    <div className="empty-text" style={{ color: 'var(--color-text-muted)' }}>
                      Try adjusting your search criteria or filters.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--color-text-faint)' }}>{page * size + i + 1}</td>
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
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  {(canEdit || canDelete) && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {canEdit   && <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}   title="Edit"><Pencil size={14} /></button>}
                        {canDelete && <button className="btn btn-danger btn-sm"    onClick={() => openDelete(u)} title="Delete"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          Showing <strong>{startNum}</strong> to <strong>{endNum}</strong> of <strong>{totalElements}</strong> entries
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Rows per page:</span>
            <select
              className="form-control"
              style={{ width: 70, padding: '4px 8px' }}
              value={size}
              onChange={e => { setSize(Number(e.target.value)); setPage(0); }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page === 0}
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            
            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx}
                className={`btn btn-sm ${page === idx ? 'btn-primary' : 'btn-ghost'}`}
                style={{ minWidth: 32, padding: '4px 8px' }}
                onClick={() => setPage(idx)}
              >
                {idx + 1}
              </button>
            ))}

            <button
              className="btn btn-outline btn-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
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
          <Info size={16} /> You have read-only access. Contact an admin to make changes.
        </div>
      )}

      {/* ── ADD MODAL ── */}
      {showAdd && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-body">
            <h2 style={{ marginBottom:20 }}>Create New User</h2>

            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Full Name</label>
              <input className="form-control" placeholder="e.g. Jane Smith"
                value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Username *</label>
              <input className="form-control" placeholder="e.g. jsmith"
                value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" placeholder="e.g. jane@company.com"
                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Password *</label>
              <input className="form-control" type="password"
                value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom:20 }}>
              <label className="form-label">Role</label>
              <select className="form-control" value={newUser.roleName} onChange={e => setNewUser({...newUser, roleName: e.target.value})}>
                {roles
                  .filter(r => isAdmin || r.name !== 'ROLE_ADMIN')
                  .map(r => (
                    <option key={r.name} value={r.name}>
                      {r.name.replace('ROLE_', '')}
                    </option>
                  ))
                }
              </select>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Saving…' : 'Create User'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {showEdit && editUser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-body">
            <h2 style={{ marginBottom:20 }}>Edit User — {editUser.name || editUser.username}</h2>

            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Full Name</label>
              <input className="form-control"
                value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Username</label>
              <input className="form-control"
                value={editUser.username} onChange={e => setEditUser({...editUser, username: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Email</label>
              <input className="form-control" type="email"
                value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">New Password <span style={{ fontSize:12, color:'var(--color-text-faint)' }}>(leave blank to keep current)</span></label>
              <input className="form-control" type="password" placeholder="Leave blank to keep unchanged"
                value={editUser.password} onChange={e => setEditUser({...editUser, password: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom:20 }}>
              <label className="form-label">Role</label>
              <select className="form-control" value={editUser.roleName} onChange={e => setEditUser({...editUser, roleName: e.target.value})}>
                {roles
                  .filter(r => isAdmin || r.name !== 'ROLE_ADMIN')
                  .map(r => (
                    <option key={r.name} value={r.name}>
                      {r.name.replace('ROLE_', '')}
                    </option>
                  ))
                }
              </select>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowEdit(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {showDelete && deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 380 }}>
            <div className="modal-body">
            <h2 style={{ marginBottom:12 }}>Delete User</h2>
            <p style={{ color:'var(--color-text-muted)', marginBottom:24 }}>
              Are you sure you want to delete <strong>{deleteTarget.name || deleteTarget.username}</strong>? This cannot be undone.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowDelete(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};