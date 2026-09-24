import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AppShell() {
  const { displayName, roles, canManageCatalog, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setError(null);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible cerrar la sesión.",
      );
      setLoggingOut(false);
    }
  }

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink className="brand" to="/dashboard">
            <span className="brand__mark">P</span>
            <span>
              <strong>Pedidos</strong>
              <b>360</b>
            </span>
            <small>Operación simple, en un solo lugar</small>
          </NavLink>
          <nav className="main-nav" aria-label="Navegación principal">
            <NavLink to="/dashboard" end>
              Dashboard
            </NavLink>
            <NavLink to="/orders">Pedidos</NavLink>
            {canManageCatalog && <NavLink to="/catalog">Catálogo</NavLink>}
          </nav>
          <div className="account">
            <div className="account__identity">
              <strong>{displayName}</strong>
              <span>{roles.join(" · ") || "Sin roles asignados"}</span>
            </div>
            <button
              className="button button--ghost button--small"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Cerrando…" : "Salir"}
            </button>
          </div>
        </div>
      </header>
      {error && (
        <div className="shell-alert" role="alert">
          {error}
        </div>
      )}
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
