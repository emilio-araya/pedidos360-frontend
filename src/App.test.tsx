import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api/client";
import { useAuth } from "./auth/AuthContext";
import { App } from "./App";

vi.mock("./auth/AuthContext", () => ({ useAuth: vi.fn() }));
// Las páginas privadas tienen sus propias pruebas; acá sólo importa que las
// rutas del invitado no pasen por ningún guardián de sesión.
vi.mock("./components/AppShell", () => ({ AppShell: () => null }));
vi.mock("./auth/RequireAuth", () => ({ RequireAuth: () => null }));
vi.mock("./auth/RequireCatalogRole", () => ({ RequireCatalogRole: () => null }));
vi.mock("./auth/RequireCognitoAuth", () => ({ RequireCognitoAuth: () => null }));
vi.mock("./pages/AwsPortalPage", () => ({ AwsPortalPage: () => null }));
vi.mock("./pages/CognitoCallbackPage", () => ({ CognitoCallbackPage: () => null }));
vi.mock("./pages/PostLogoutPage", () => ({ PostLogoutPage: () => null }));
vi.mock("./pages/LoginPage", () => ({ LoginPage: () => null }));
vi.mock("./pages/DashboardPage", () => ({ DashboardPage: () => null }));
vi.mock("./pages/OrdersPage", () => ({ OrdersPage: () => null }));
vi.mock("./pages/CatalogPage", () => ({ CatalogPage: () => null }));
vi.mock("./api/client", async () => {
  const actual = await vi.importActual<typeof import("./api/client")>("./api/client");
  return { ...actual, apiRequest: vi.fn() };
});

const mockedApiRequest = vi.mocked(apiRequest);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  mockedApiRequest.mockReset();
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
  } as never);
});

describe("rutas públicas del invitado", () => {
  it("abre el seguimiento sin sesión", () => {
    renderAt("/seguimiento/no-es-un-token");

    expect(
      screen.getByRole("heading", { name: "Este enlace no es válido" }),
    ).toBeTruthy();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it("abre el reenvío del enlace sin sesión y lo enlaza desde el pie", () => {
    renderAt("/seguimiento");

    expect(
      screen.getByRole("heading", { name: "Recupera el enlace de tu pedido" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Recuperar el enlace de un pedido" }),
    ).toHaveAttribute("href", "/seguimiento");
  });
});
