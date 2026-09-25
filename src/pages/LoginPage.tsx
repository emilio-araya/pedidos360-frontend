import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCognitoAuth } from "../auth/CognitoAuthContext";
import { environment } from "../config/environment";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function LoginPage() {
  useDocumentTitle("Iniciar sesión");
  const { isAuthenticated, isLoading, login } = useAuth();
  const { isConfigured: cognitoConfigured, login: loginCognito } =
    useCognitoAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cognitoRequested =
    (location.state as { provider?: string } | null)?.provider === "cognito";
  const [signingIn, setSigningIn] = useState(false);
  const [cognitoSigningIn, setCognitoSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !cognitoRequested)
      navigate("/dashboard", { replace: true });
  }, [cognitoRequested, isAuthenticated, navigate]);

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

  async function signInCognito() {
    if (cognitoSigningIn) return;
    setCognitoSigningIn(true);
    setError(null);
    try {
      await loginCognito();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible iniciar sesión en AWS.",
      );
      setCognitoSigningIn(false);
    }
  }

  if (isLoading || (isAuthenticated && !cognitoRequested))
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
          {cognitoConfigured && (
            <button
              className="button button--secondary login-button"
              type="button"
              onClick={signInCognito}
              disabled={cognitoSigningIn}
            >
              {cognitoSigningIn ? "Redirigiendo a AWS…" : "Acceder con Amazon Cognito"}
            </button>
          )}
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
