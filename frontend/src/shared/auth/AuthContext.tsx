import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAuth,
  fetchMe,
  getStoredUser,
  getToken,
  type AuthUser,
} from "@/shared/api/auth";
import { can, canAccessNav, canAccessPath, isRole, type Role } from "@/shared/rbac";

type AuthContextValue = {
  user: AuthUser | null;
  role: Role | null;
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
  can: (...roles: Role[]) => boolean;
  canPath: (path: string) => boolean;
  canNav: (key: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(!!getToken());

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const role = isRole(user?.role) ? user.role : null;

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role,
    loading,
    isAuthenticated: !!user && !!getToken(),
    refresh,
    logout,
    can: (...roles: Role[]) => can(role, ...roles),
    canPath: (path: string) => canAccessPath(role, path),
    canNav: (key: string) => canAccessNav(role, key),
  }), [user, role, loading, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
