import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCognitoAuth } from "./CognitoAuthContext";

export function RequireCognitoAuth() {
  const { isAuthenticated, isLoading, isConfigured } = useCognitoAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="loading-screen">Validando sesión AWS…</div>;
  }
  if (!isConfigured) {
    return (
      <div className="page-content">
        <div className="alert" role="alert">
          Cognito no está configurado en este ambiente.
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, provider: "cognito" }}
      />
    );
  }
  return <Outlet />;
}
