import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./auth/msal";
import { AuthProvider } from "./auth/AuthContext";
import { CognitoAuthProvider } from "./auth/CognitoAuthContext";
import { RedirectHandler } from "./auth/RedirectHandler";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <CognitoAuthProvider>
          <BrowserRouter>
            <RedirectHandler />
            <App />
          </BrowserRouter>
        </CognitoAuthProvider>
      </AuthProvider>
    </MsalProvider>
  </StrictMode>,
);
