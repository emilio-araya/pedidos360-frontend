import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth/AuthContext";
import { useCognitoAuth } from "../auth/CognitoAuthContext";
import { LoginPage } from "./LoginPage";

vi.mock("../auth/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../auth/CognitoAuthContext", () => ({ useCognitoAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseCognitoAuth = vi.mocked(useCognitoAuth);
const login = vi.fn(async () => undefined);
const cognitoLogin = vi.fn(async () => undefined);

beforeEach(() => {
  login.mockClear();
  cognitoLogin.mockClear();
  mockedUseCognitoAuth.mockReturnValue({
    isConfigured: true,
    login: cognitoLogin,
  } as never);
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

  it("inicia el redirect de Cognito al pulsar el botón", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", { name: /acceder con amazon cognito/i }),
    );
    expect(cognitoLogin).toHaveBeenCalledTimes(1);
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
});
