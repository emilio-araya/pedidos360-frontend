import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

/**
 * Punto de retorno del cierre de sesion de Cognito.
 *
 * Cognito redirige aca despues de cerrar su sesion federada. Desde este
 * lugar se cierra tambien la de Entra, que es una sesion SSO independiente,
 * y recien entonces se vuelve al login. Sin este paso, cerrar sesion en la
 * pestana de AWS dejaba la de Microsoft activa y al reingresar entraba
 * directo, sin pedir credenciales.
 */
export function PostLogoutPage() {
  useDocumentTitle("Cerrando sesión");
  const { isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    let active = true;
    logout().catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated, isLoading, logout, navigate]);

  if (failed) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <div className="login-card">
            <p className="eyebrow">Sesión de AWS cerrada</p>
            <h2>No pudimos cerrar Microsoft</h2>
            <p className="login-card__intro">
              La sesión de AWS ya se cerró. La de Microsoft sigue abierta en
              este navegador.
            </p>
            <button
              className="button login-button"
              type="button"
              onClick={() => navigate("/login", { replace: true })}
            >
              Ir al inicio de sesión
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">Cerrando sesión</p>
          <h2>Un momento</h2>
          <div className="loading-screen">Cerrando ambas sesiones…</div>
        </div>
      </section>
    </main>
  );
}
