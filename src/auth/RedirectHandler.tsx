import { useEffect, useRef } from "react";
import { InteractionStatus } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { environment } from "../config/environment";

export function RedirectHandler() {
  const { instance, inProgress } = useMsal();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const entraCallbackPath = new URL(
        environment.redirectUri,
        window.location.origin,
      ).pathname;
      if (window.location.pathname !== entraCallbackPath) return;
    }
    if (inProgress === InteractionStatus.Startup || started.current) return;
    started.current = true;
    void instance
      .handleRedirectPromise({ navigateToLoginRequestUrl: false })
      .then((result) => {
        if (result?.account) {
          instance.setActiveAccount(result.account);
          navigate("/dashboard", { replace: true });
        }
      })
      .catch(() => undefined);
  }, [inProgress, instance, navigate]);

  return null;
}
