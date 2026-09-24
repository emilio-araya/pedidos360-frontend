import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="loading-screen">Validando sesión…</div>;
  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireCatalogRole() {
  const { canManageCatalog, isLoading } = useAuth();
  if (isLoading)
    return <div className="loading-screen">Validando permisos…</div>;
  return canManageCatalog ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
