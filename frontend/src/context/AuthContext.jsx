import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { configureAxiosAuth } from '../api/api';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

const ROLE_PERMISSION_OVERRIDES_KEY = 'rbac.rolePermissionOverrides';

const loadRolePermissionOverrides = () => {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(ROLE_PERMISSION_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveRolePermissionOverrides = (overrides) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROLE_PERMISSION_OVERRIDES_KEY, JSON.stringify(overrides));
};

const normalizeList = (value, preferredKeys = ['name', 'permission', 'code', 'id']) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return null;

      for (const key of preferredKeys) {
        if (typeof item[key] === 'string' && item[key]) {
          return item[key];
        }
      }

      if (item.permission && typeof item.permission === 'object') {
        return item.permission.name ?? item.permission.code ?? item.permission.id ?? null;
      }

      if (item.role && typeof item.role === 'object') {
        return item.role.name ?? item.role.code ?? item.role.id ?? null;
      }

      return null;
    })
    .filter(Boolean);
};

const getGrantedRoles = (userData) => {
  const directRoles = normalizeList(userData?.roles, ['name', 'role', 'code', 'id']);
  const nestedRoles = normalizeList(userData?.userRoles?.map((entry) => entry?.role), ['name', 'role', 'code', 'id']);
  return [...new Set([...directRoles, ...nestedRoles])];
};

const getGrantedPermissions = (userData, rolePermissionOverrides = {}) => {
  const userRoles = getGrantedRoles(userData);
  const directPermissions = normalizeList(userData?.permissions);
  const nestedPermissions = normalizeList(
    userData?.roles?.flatMap((role) => role?.permissions ?? role?.rolePermissions ?? []),
  );
  const rolePermissions = normalizeList(
    userData?.userRoles?.flatMap((entry) => entry?.role?.permissions ?? entry?.role?.rolePermissions ?? []),
  );
  const overridePermissions = userRoles.flatMap((roleName) => rolePermissionOverrides[roleName] ?? []);

  return [...new Set([...directPermissions, ...nestedPermissions, ...rolePermissions, ...overridePermissions])];
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuthState] = useState(null);
  const [user, setUser] = useState(null);
  const [rolePermissionOverrides, setRolePermissionOverrides] = useState(() => loadRolePermissionOverrides());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getAccessToken = () => localStorage.getItem('accessToken');
  const getRefreshToken = () => localStorage.getItem('refreshToken');

  useEffect(() => {
    configureAxiosAuth({
      getToken: getAccessToken,
      getRefreshToken: getRefreshToken,
      onFailure: () => logout(),
    });
  }, []);

  // On mount, restore session and fetch the current user
  useEffect(() => {
    const token = getAccessToken();
    const refreshToken = getRefreshToken();

    if (token) {
      setAuthState({ accessToken: token, refreshToken });

      if (refreshToken) {
        authApi.refreshToken(refreshToken)
          .then((res) => {
            setAuthState({
              accessToken: res.data.accessToken,
              refreshToken: res.data.refreshToken ?? refreshToken,
            });
            setUser({
              email: res.data.email,
              username: res.data.username,
              roles: res.data.roles,
              permissions: res.data.permissions,
            });
            localStorage.setItem('accessToken', res.data.accessToken);
            if (res.data.refreshToken) {
              localStorage.setItem('refreshToken', res.data.refreshToken);
            }
          })
          .catch(() => {
            // Token invalid — clear session
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setAuthState(null);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const setAuth = (authData, userData = null) => {
    setAuthState(authData);
    if (userData) setUser(userData);
    if (authData?.accessToken) localStorage.setItem('accessToken', authData.accessToken);
    if (authData?.refreshToken) localStorage.setItem('refreshToken', authData.refreshToken);
  };

  const refreshCurrentUser = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('Refresh token is missing');
    }

    const response = await authApi.refreshToken(refreshToken);
    const nextAuth = {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken ?? refreshToken,
    };

    const nextUser = {
      email: response.data.email,
      username: response.data.username,
      roles: response.data.roles,
      permissions: response.data.permissions,
    };

    setAuthState(nextAuth);
    setUser(nextUser);
    localStorage.setItem('accessToken', response.data.accessToken);
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }

    return nextUser;
  };

  const applyRolePermissions = (roleName, permissions) => {
    const nextOverrides = {
      ...rolePermissionOverrides,
      [roleName]: permissions,
    };

    setRolePermissionOverrides(nextOverrides);
    saveRolePermissionOverrides(nextOverrides);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAuthState(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const userRole = getGrantedRoles(user)[0] ?? user?.role ?? null;
  const userPermissions = getGrantedPermissions(user, rolePermissionOverrides);

  const hasPermission = (permissionOrPermissions, requireAll = false) => {
    if (!permissionOrPermissions) return true;

    const granted = new Set(userPermissions);
    const required = Array.isArray(permissionOrPermissions)
      ? permissionOrPermissions
      : [permissionOrPermissions];

    return requireAll
      ? required.every((permission) => granted.has(permission))
      : required.some((permission) => granted.has(permission));
  };

  const hasRole = (role) => {
    if (!role) return false;

    const grantedRoles = new Set(getGrantedRoles(user));
    const required = Array.isArray(role) ? role : [role];

    return required.some((item) => grantedRoles.has(item));
  };

  const value = {
    auth,
    user,
    userRole,
    userPermissions,
    setAuth,
    refreshCurrentUser,
    applyRolePermissions,
    logout,
    hasRole,
    hasPermission,
    isAuthenticated: !!auth?.accessToken,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};