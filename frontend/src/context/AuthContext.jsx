import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { configureAxiosAuth } from "../api/api";
import { authApi } from "../api/authApi";

const AuthContext = createContext();

const ROLE_PERMISSION_OVERRIDES_KEY = "rbac.rolePermissionOverrides";

/* ---------------- STORAGE HELPERS ---------------- */

const loadRolePermissionOverrides = () => {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(ROLE_PERMISSION_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveRolePermissionOverrides = (overrides) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    ROLE_PERMISSION_OVERRIDES_KEY,
    JSON.stringify(overrides)
  );
};

/* ---------------- NORMALIZATION ---------------- */

const normalizeList = (value, preferredKeys = ["name", "code", "id"]) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return null;

      for (const key of preferredKeys) {
        if (item[key]) return item[key];
      }

      if (item.permission) {
        return item.permission.name || item.permission.code || item.permission.id;
      }

      if (item.role) {
        return item.role.name || item.role.code || item.role.id;
      }

      return null;
    })
    .filter(Boolean);
};

/* ---------------- RBAC HELPERS ---------------- */

// Canonical role priority — highest authority wins as the "primary" role
const ROLE_PRIORITY = ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_USER"];

const getGrantedRoles = (user) => {
  if (!user) return [];

  const directRoles = normalizeList(user.roles);
  const nestedRoles = normalizeList(
    user.userRoles?.map((r) => r?.role)
  );

  const all = [...new Set([...directRoles, ...nestedRoles])];

  // Sort so the highest-priority role is always first — prevents
  // dashboard flickering when the backend returns roles in a different order
  return all.sort((a, b) => {
    const ia = ROLE_PRIORITY.indexOf(a);
    const ib = ROLE_PRIORITY.indexOf(b);
    const pa = ia === -1 ? 999 : ia;
    const pb = ib === -1 ? 999 : ib;
    return pa - pb;
  });
};

const getGrantedPermissions = (user, overrides = {}) => {
  if (!user) return [];

  const roles = getGrantedRoles(user);

  const direct = normalizeList(user.permissions);

  const rolePerms = normalizeList(
    user.roles?.flatMap((r) => r?.permissions || r?.rolePermissions || [])
  );

  const nestedPerms = normalizeList(
    user.userRoles?.flatMap(
      (r) => r?.role?.permissions || r?.role?.rolePermissions || []
    )
  );

  const overridePerms = roles.flatMap((r) => overrides[r] || []);

  return [...new Set([...direct, ...rolePerms, ...nestedPerms, ...overridePerms])];
};

/* ---------------- CONTEXT ---------------- */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

/* ---------------- PROVIDER ---------------- */

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [auth, setAuthState] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [rolePermissionOverrides, setRolePermissionOverrides] = useState(() =>
    loadRolePermissionOverrides()
  );

  const getAccessToken = () => localStorage.getItem("accessToken");
  const getRefreshToken = () => localStorage.getItem("refreshToken");

  /* ---------------- AXIOS CONFIG ---------------- */

  useEffect(() => {
    configureAxiosAuth({
      getToken: getAccessToken,
      getRefreshToken,
      onFailure: () => logout(),
    });
  }, []);

  /* ---------------- INIT AUTH (FIXED) ---------------- */

  useEffect(() => {
    const init = async () => {
      const token = getAccessToken();
      const refresh = getRefreshToken();

      if (!token || !refresh) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.refreshToken(refresh);

        const authData = {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken ?? refresh,
        };

        const userData = {
          email: res.data.email,
          username: res.data.username,
          roles: res.data.roles,
          permissions: res.data.permissions,
          userRoles: res.data.userRoles,
        };

        setAuthState(authData);
        setUser(userData);

        localStorage.setItem("accessToken", authData.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }
      } catch (err) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setAuthState(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  /* ---------------- AUTH ACTIONS ---------------- */

  const setAuth = (authData, userData = null) => {
    setAuthState(authData);
    if (userData) setUser(userData);

    if (authData?.accessToken)
      localStorage.setItem("accessToken", authData.accessToken);

    if (authData?.refreshToken)
      localStorage.setItem("refreshToken", authData.refreshToken);
  };

  const refreshCurrentUser = async () => {
    const refresh = getRefreshToken();
    if (!refresh) throw new Error("Missing refresh token");

    const res = await authApi.refreshToken(refresh);

    const authData = {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken ?? refresh,
    };

    const userData = {
      email: res.data.email,
      username: res.data.username,
      roles: res.data.roles,
      permissions: res.data.permissions,
    };

    setAuthState(authData);
    setUser(userData);

    localStorage.setItem("accessToken", authData.accessToken);
    if (res.data.refreshToken) {
      localStorage.setItem("refreshToken", res.data.refreshToken);
    }

    return userData;
  };

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem(ROLE_PERMISSION_OVERRIDES_KEY);
    setAuthState(null);
    setUser(null);
    setRolePermissionOverrides({});
    navigate("/login");
  }, [navigate]);

  /* ---------------- RBAC DERIVED STATE (STABLE) ---------------- */

  const userRoles = useMemo(() => getGrantedRoles(user), [user]);

  const userPermissions = useMemo(
    () => getGrantedPermissions(user, rolePermissionOverrides),
    [user, rolePermissionOverrides]
  );

  const userRole = userRoles[0] || null;

  const hasPermission = (perm, requireAll = false) => {
    if (!perm) return true;

    const required = Array.isArray(perm) ? perm : [perm];
    const granted = new Set(userPermissions);

    return requireAll
      ? required.every((p) => granted.has(p))
      : required.some((p) => granted.has(p));
  };

  const hasRole = (role) => {
    if (!role) return false;

    const required = Array.isArray(role) ? role : [role];
    const granted = new Set(userRoles);

    return required.some((r) => granted.has(r));
  };

  const applyRolePermissions = (roleName, permissions) => {
    const updated = {
      ...rolePermissionOverrides,
      [roleName]: permissions,
    };

    setRolePermissionOverrides(updated);
    saveRolePermissionOverrides(updated);
  };

  /* ---------------- VALUE ---------------- */

  const value = {
    auth,
    user,
    userRole,
    userRoles,
    userPermissions,

    setAuth,
    refreshCurrentUser,

    hasRole,
    hasPermission,

    applyRolePermissions,

    logout,

    isAuthenticated: !!auth?.accessToken,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};