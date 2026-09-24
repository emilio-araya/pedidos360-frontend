import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { environment } from "../config/environment";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function LoginPage() {
  useDocumentTitle("Iniciar sesión");
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  async function signIn() {
    if (signingIn) return;
    setSigningIn(true);
    setError(null);
    try {
      await login();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible iniciar sesión.",
      );
      setSigningIn(false);
    }
  }

  if (isLoading || isAuthenticated)
    return <div className="loading-screen">Validando sesión…</div>;

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-visual__content">
          <div className="login-logo">
            <span>P</span> Pedidos<b>360</b>
          </div>
          <p className="eyebrow">Una vista clara de tu operación</p>
          <h1>
            Pedidos que fluyen.
            <br />
            <em>Decisiones que avanzan.</em>
          </h1>
          <p>
            Centraliza solicitudes, estados y stock con la seguridad de
            Microsoft Entra ID.
          </p>
          <div className="feature-list">
            <span>✓ Pedidos en tiempo real</span>
            <span>✓ Roles y permisos claros</span>
            <span>✓ Catálogo actualizado</span>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <span>P</span> Pedidos<b>360</b>
          </div>
          <p className="eyebrow">Acceso seguro</p>
          <h2>Bienvenido de nuevo</h2>
          <p className="login-card__intro">
            Inicia sesión para continuar administrando tus pedidos.
          </p>
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}
          <button
            className="button login-button"
            onClick={signIn}
            disabled={signingIn}
          >
            <span className="microsoft-mark">
              <i />
              <i />
              <i />
              <i />
            </span>
            {signingIn ? "Redirigiendo…" : "Continuar con Microsoft"}
          </button>
          <div className="login-divider">
            <span>Acceso protegido</span>
          </div>
          <div className="security-note">
            <span>⌁</span>
            <p>
              Usaremos tu cuenta corporativa. Nunca se almacena tu contraseña en
              esta aplicación.
            </p>
          </div>
          <p className="scope-note">
            Scope solicitado: <code>{environment.apiScope}</code>
          </p>
        </div>
        <p className="login-footer">{environment.appName} · Pedidos360</p>
      </section>
    </main>
  );
}
