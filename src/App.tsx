import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./auth/RequireAuth";
import { RequireCatalogRole } from "./auth/RequireCatalogRole";
import { RequireCognitoAuth } from "./auth/RequireCognitoAuth";
import { AwsPortalPage } from "./pages/AwsPortalPage";
import { CognitoCallbackPage } from "./pages/CognitoCallbackPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OrdersPage } from "./pages/OrdersPage";
import { CatalogPage } from "./pages/CatalogPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/cognito/callback" element={<CognitoCallbackPage />} />
      <Route element={<RequireCognitoAuth />}>
        <Route path="/aws" element={<AwsPortalPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route element={<RequireCatalogRole />}>
            <Route path="/catalog" element={<CatalogPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
