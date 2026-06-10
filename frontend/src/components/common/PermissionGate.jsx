import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  }}>
    <div className="spinner" />
  </div>
);

export const PermissionGate = ({
  permission = null,
  permissions = null,
  requireAll = false,
  fallback = null,
  redirectTo = null,
  children,
}) => {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const requiredPermissions = permissions ?? permission;
  const allowed = !requiredPermissions
    ? true
    : hasPermission(requiredPermissions, requireAll);

  if (allowed) {
    return children;
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return fallback;
};
