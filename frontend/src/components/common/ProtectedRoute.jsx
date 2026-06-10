import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';  // Fixed path

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

export const PrivateRoute = ({
  children,
  requiredPermissions = null,
  requireAll = false,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions) {
    const allowed = hasPermission(requiredPermissions, requireAll);

    if (!allowed) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
};