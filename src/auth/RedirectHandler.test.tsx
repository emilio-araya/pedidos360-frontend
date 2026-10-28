import { render, screen } from "@testing-library/react";
import { InteractionStatus } from "@azure/msal-browser";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMsal } from "@azure/msal-react";
import { RedirectHandler } from "./RedirectHandler";
import { rememberLoginReturn } from "./loginReturn";

vi.mock("@azure/msal-react", () => ({ useMsal: vi.fn() }));
const mockedUseMsal = vi.mocked(useMsal);

const account = { homeAccountId: "h-1", username: "persona@org.cl" };

function renderHandler() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <RedirectHandler />
      <Routes>
        <Route path="/login" element={<div>Pantalla de ingreso</div>} />
        <Route path="/checkout" element={<div>Resumen del pedido</div>} />
        <Route path="/dashboard" element={<div>Panel</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, "", "/login");
  mockedUseMsal.mockReturnValue({
    instance: {
      handleRedirectPromise: vi.fn(async () => ({ account })),
      setActiveAccount: vi.fn(),
    },
    inProgress: InteractionStatus.None,
  } as never);
});

describe("RedirectHandler", () => {
  it("vuelve al destino pedido después de iniciar sesión", async () => {
    rememberLoginReturn("/checkout");

    renderHandler();

    expect(await screen.findByText("Resumen del pedido")).toBeTruthy();
    expect(sessionStorage.getItem("pedidos360.login-return")).toBeNull();
  });

  it("va al panel cuando nadie pidió un destino", async () => {
    renderHandler();

    expect(await screen.findByText("Panel")).toBeTruthy();
  });

  it("no interfiere fuera de la ruta de retorno de Entra ID", async () => {
    window.history.replaceState({}, "", "/producto/p1");
    const instance = mockedUseMsal().instance as unknown as {
      handleRedirectPromise: ReturnType<typeof vi.fn>;
    };

    renderHandler();

    expect(instance.handleRedirectPromise).not.toHaveBeenCalled();
  });
});
