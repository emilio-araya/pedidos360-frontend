import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth/AuthContext";
import { LoginPage } from "./LoginPage";

vi.mock("../auth/AuthContext", () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);
const login = vi.fn(async () => undefined);

beforeEach(() => {
  login.mockClear();
  mockedUseAuth.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    login,
  } as never);
});

describe("LoginPage", () => {
  it("muestra el acceso Microsoft y el scope solicitado", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("button", { name: /continuar con microsoft/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/access_as_user/i)).toBeInTheDocument();
    expect(
      screen.getByText(/nunca se almacena tu contraseña/i),
    ).toBeInTheDocument();
  });

  it("inicia el redirect de MSAL al pulsar el botón", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", { name: /continuar con microsoft/i }),
    );
    expect(login).toHaveBeenCalledTimes(1);
  });

  it("muestra error cuando login de MSAL falla", async () => {
    login.mockRejectedValueOnce(new Error("Error de autenticación"));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", { name: /continuar con microsoft/i }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Error de autenticación");
  });

  it("muestra pantalla de carga cuando isLoading es true", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      login,
    } as never);
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Validando sesión…")).toBeInTheDocument();
  });

  it("no ofrece otros proveedores de identidad", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("button", { name: /cognito/i }),
    ).not.toBeInTheDocument();
  });
});
