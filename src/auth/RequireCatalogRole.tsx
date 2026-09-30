import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireCatalogRole() {
  const { canManageCatalog, isLoading } = useAuth();
  if (isLoading)
    return <div className="loading-screen">Validando permisos…</div>;
  return canManageCatalog ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
