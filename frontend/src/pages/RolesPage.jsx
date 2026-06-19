import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rolesApi } from '../api/rolesApi';
import { Modal } from '../components/common/Modal';
import { RoleForm } from '../components/forms/RoleForm';
import Toast from '../components/common/Toast';

const MOCK_ROLES = [
  { id: 1, name: 'ROLE_ADMIN', description: 'Administrator with full access', permissions: 7 },
  { id: 2, name: 'ROLE_MANAGER', description: 'Manager with user management capabilities', permissions: 3 },
  { id: 3, name: 'ROLE_USER', description: 'Regular user with basic access', permissions: 1 },
];

export const RolesPage = () => {
  const { loading, hasPermission } = useAuth();

  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // ✅ NEW: permissions modal state
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await rolesApi.getAll();
      setRoles(res.data ?? MOCK_ROLES);
    } catch {
      setRoles(MOCK_ROLES);
    }
  }, []);

  useEffect(() => {
    if (!loading) fetchRoles();
  }, [loading, fetchRoles]);

  if (loading) return null;
  if (!hasPermission('role:read')) return <Navigate to="/403" />;

  // canEdit must depend only on the actual permission this action requires.
  // The previous hasRole([...]) fallback granted edit/create access to any
  // Manager (and even plain Users) regardless of whether role:write was
  // actually assigned to their role, which is what let the buttons show
  // even after role:write was unchecked for Manager.
  const canEdit = hasPermission('role:write');

  const canDelete = hasPermission('role:delete');
  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const openAddModal = () => {
    setEditingRole(null);
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (formLoading) return;
    setModalOpen(false);
    setEditingRole(null);
  };

  // ✅ NEW: open permissions modal
  const openPermissions = (role) => {
    setSelectedRole(role);
    setPermissionsOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, formData);

        setRoles((prev) =>
          prev.map((r) =>
            r.id === editingRole.id ? { ...r, ...formData } : r
          )
        );

        showToast('success', `Role "${formData.name}" updated successfully.`);
      } else {
        const res = await rolesApi.create(formData);

        const newRole =
          res.data ?? { id: Date.now(), ...formData, permissions: 0 };

        setRoles((prev) => [...prev, newRole]);

        showToast('success', `Role "${formData.name}" created successfully.`);
      }

      closeModal();
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        'An error occurred. Please try again.';
      showToast('error', msg);
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Role <span className="page-title-accent">Management</span>
          </h1>
        </div>

        {canEdit && (
          <button className="btn btn-primary" onClick={openAddModal}>
            + Create Role
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search roles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="form-control"
        style={{ maxWidth: 300, marginBottom: 20 }}
      />

      {/* Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {filtered.map((role) => (
          <div key={role.id} className="card">

            <div className="card-header">
              <strong>{role.name.replace('ROLE_', '')}</strong>

              {(canEdit || canDelete) && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {canEdit && (
                    <button onClick={() => openEditModal(role)}>✏️</button>
                  )}

                  {canDelete && (
                    <button
                      onClick={async () => {
                        await rolesApi.delete(role.id);
                        setRoles((prev) =>
                          prev.filter((r) => r.id !== role.id)
                        );
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )}
            </div>

            <p>{role.description}</p>

            <span>🔑 {role.permissions} permissions</span>

            {/* ✅ FIXED BUTTON */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => openPermissions(role)}
            >
              View permissions →
            </button>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingRole ? 'Edit Role' : 'Create Role'}
        open={modalOpen}
        onClose={closeModal}
      >
        <RoleForm
          initialValues={editingRole ?? {}}
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
          loading={formLoading}
        />
      </Modal>

      {/* ✅ Permissions Modal */}
      <Modal
        title={`Permissions: ${selectedRole?.name ?? ''}`}
        open={permissionsOpen}
        onClose={() => setPermissionsOpen(false)}
      >
        {selectedRole ? (
          <div>
            <p><strong>Role:</strong> {selectedRole.name}</p>
            <p><strong>Total permissions:</strong> {selectedRole.permissions}</p>

            <div style={{ marginTop: 10 }}>
              {/* Replace this with real permissions list later */}
              <ul>
                <li>Example permission 1</li>
                <li>Example permission 2</li>
                <li>Example permission 3</li>
              </ul>
            </div>
          </div>
        ) : (
          <p>No role selected</p>
        )}
      </Modal>

    </div>
  );
};