import { useAuth } from '../../context/AuthContext';

export const PermissionGate = ({ permission, fallback = null, children }) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children : fallback;
};
