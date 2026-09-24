import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./AuthContext";
import { RequireAuth, RequireCatalogRole } from "./RequireAuth";

vi.mock("./AuthContext", () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

beforeEach(() => {
  mockedUseAuth.mockReset();
});

describe("guards de React Router", () => {
  it("redirige a login cuando no existe sesión", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as never);
    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/orders" element={<div>Pedidos privados</div>} />
          </Route>
          <Route path="/login" element={<div>Pantalla de login</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
  });

  it("espera la inicialización antes de proteger la ruta", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    } as never);
    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/orders" element={<div>Pedidos privados</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Validando sesión…")).toBeInTheDocument();
  });

  it("exige rol de catálogo para el outlet administrativo", () => {
    mockedUseAuth.mockReturnValue({
      canManageCatalog: false,
      isLoading: false,
    } as never);
    render(
      <MemoryRouter initialEntries={["/catalog"]}>
        <Routes>
          <Route element={<RequireCatalogRole />}>
            <Route path="/catalog" element={<div>Catálogo privado</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
