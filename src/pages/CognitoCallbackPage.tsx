import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCognitoAuth } from "../auth/CognitoAuthContext";
import { ErrorState, LoadingState } from "../components/States";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { environment } from "../config/environment";

function cleanCallbackUrl() {
  if (typeof window === "undefined") return;
  window.history.replaceState(
    {},
    document.title,
    new URL(environment.cognitoRedirectUri, window.location.origin).pathname,
  );
}

export function CognitoCallbackPage() {
  useDocumentTitle("Completando acceso AWS");
  const { refresh } = useCognitoAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void refresh()
      .then((authenticated) => {
        if (!active) return;
        cleanCallbackUrl();
        if (authenticated) {
          navigate("/aws", { replace: true });
        } else {
          navigate("/login", {
            replace: true,
            state: { provider: "cognito" },
          });
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          cleanCallbackUrl();
          setError(
            reason instanceof Error
              ? reason.message
              : "No fue posible completar el acceso de Cognito.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [navigate, refresh]);

  if (error) {
    return (
      <div className="page-content">
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null);
            void refresh()
              .then((authenticated) => {
                cleanCallbackUrl();
                if (authenticated) navigate("/aws", { replace: true });
              })
              .catch((reason: unknown) => {
                setError(
                  reason instanceof Error
                    ? reason.message
                    : "No fue posible completar el acceso de Cognito.",
                );
              });
          }}
        />
      </div>
    );
  }
  return <LoadingState label="Completando el acceso de Amazon Cognito…" />;
}
