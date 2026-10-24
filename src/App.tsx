import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./auth/RequireAuth";
import { RequireCatalogRole } from "./auth/RequireCatalogRole";
import { RequireCognitoAuth } from "./auth/RequireCognitoAuth";
import { AwsPortalPage } from "./pages/AwsPortalPage";
import { CognitoCallbackPage } from "./pages/CognitoCallbackPage";
import { PostLogoutPage } from "./pages/PostLogoutPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OrdersPage } from "./pages/OrdersPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CartPage } from "./features/store/CartPage";
import { CartProvider } from "./features/store/cart";
import { ProductPage } from "./features/store/ProductPage";
import { StorePage } from "./features/store/StorePage";

export function App() {
  return (
    <CartProvider>
      <AppRoutes />
    </CartProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout/continuar" element={<PostLogoutPage />} />
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
      <Route path="/" element={<StorePage />} />
      <Route path="/producto/:id" element={<ProductPage />} />
      <Route path="/carrito" element={<CartPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
