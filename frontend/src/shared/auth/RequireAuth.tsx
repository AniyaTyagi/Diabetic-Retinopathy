import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/shared/auth/AuthContext";
import { canAccessPath, type Role } from "@/shared/rbac";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#637385", fontSize: 14 }}>
        Checking session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function RequireRole({
  roles,
  children,
  fallback = "/dashboard",
}: {
  roles?: Role[];
  children: ReactNode;
  fallback?: string;
}) {
  const { role, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#637385", fontSize: 14 }}>
        Checking permissions…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const pathOk = canAccessPath(role, location.pathname);
  const roleOk = !roles || (role != null && roles.includes(role));

  if (!pathOk || !roleOk) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}

/** Wrap a page element with auth + path-based RBAC. */
export function guard(element: ReactNode) {
  return <RequireRole>{element}</RequireRole>;
}
