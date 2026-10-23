import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth/AuthContext";
import { ApiError, apiRequest } from "../api/client";
import { StorePage } from "./StorePage";

const catalog = (
  content: unknown[],
  overrides: Record<string, number> = {},
) => ({
  content,
  page: 0,
  size: 12,
  totalElements: content.length,
  totalPages: 1,
  ...overrides,
});

/** La vitrina en su router real: así se puede comprobar a dónde navega. */
function renderStore() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/orders" element={<div>Pedidos</div>} />
        <Route path="/dashboard" element={<div>Panel</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

vi.mock("../auth/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../api/client")>("../api/client");
  return { ...actual, apiRequest: vi.fn() };
});

const mockedUseAuth = vi.mocked(useAuth);
const mockedApiRequest = vi.mocked(apiRequest);
const login = vi.fn(async () => undefined);

beforeEach(() => {
  login.mockClear();
  mockedApiRequest.mockReset();
  mockedUseAuth.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    login,
  } as never);
});

describe("StorePage", () => {
  it("muestra el catálogo sin sesión y pide login al crear un pedido", async () => {
    mockedApiRequest.mockResolvedValue({
      content: [
        {
          id: "1",
          sku: "SKU-1",
          name: "Teclado",
          description: "Mecánico",
          price: 25000,
          stock: 3,
          active: true,
        },
      ],
      page: 0,
      size: 12,
      totalElements: 1,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <StorePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Teclado")).toBeTruthy();
    expect(mockedApiRequest.mock.calls[0][0]).toBe(
      "/api/catalog/products?page=0&size=12",
    );
    expect(mockedApiRequest.mock.calls[0][1]).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Crear pedido" }));

    expect(login).toHaveBeenCalledTimes(1);
  });

  it("muestra la foto del producto cuando el catálogo la informa", async () => {
    mockedApiRequest.mockResolvedValue({
      content: [
        {
          id: "2",
          sku: "P-001",
          name: "Mouse inalámbrico",
          description: null,
          price: 19990,
          stock: 25,
          active: true,
          imageUrl: "/img/mouse.jpg",
        },
        {
          id: "3",
          sku: "P-009",
          name: "Producto sin foto",
          description: null,
          price: 1000,
          stock: 1,
          active: true,
        },
      ],
      page: 0,
      size: 12,
      totalElements: 2,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <StorePage />
      </MemoryRouter>,
    );

    const photo = await screen.findByRole("img", { name: "Mouse inalámbrico" });
    expect(photo.getAttribute("src")).toBe("/img/mouse.jpg");
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("navega a los pedidos cuando la sesión ya está iniciada", async () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login,
    } as never);
    mockedApiRequest.mockResolvedValue(catalog([]));

    renderStore();
    await userEvent.click(
      screen.getByRole("button", { name: "Crear pedido" }),
    );

    expect(await screen.findByText("Pedidos")).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  });

  it("ofrece los accesos de la sesión iniciada", async () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login,
    } as never);
    mockedApiRequest.mockResolvedValue(catalog([]));

    renderStore();
    expect(screen.queryByRole("button", { name: "Iniciar sesión" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Mi cuenta" }));
    expect(await screen.findByText("Panel")).toBeTruthy();
  });

  it("pide login desde la barra sin tocar el catálogo", async () => {
    mockedApiRequest.mockResolvedValue(catalog([]));

    renderStore();
    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    );

    expect(login).toHaveBeenCalledTimes(1);
  });

  it("oculta los accesos mientras se resuelve la sesión", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      login,
    } as never);
    mockedApiRequest.mockResolvedValue(catalog([]));

    renderStore();
    expect(screen.queryByRole("button", { name: "Iniciar sesión" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mi cuenta" })).toBeNull();
  });

  it("avanza y retrocede de página pidiendo cada una al servidor", async () => {
    mockedApiRequest.mockResolvedValue(
      catalog([], { totalElements: 30, totalPages: 3 }),
    );

    renderStore();
    expect(
      (
        await screen.findByRole("button", { name: "Anterior" })
      ).hasAttribute("disabled"),
    ).toBe(true);

    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText("2")).toBeTruthy();
    const lastCall = mockedApiRequest.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe("/api/catalog/products?page=1&size=12");

    await userEvent.click(screen.getByRole("button", { name: "Anterior" }));
    await waitFor(() =>
      expect(mockedApiRequest.mock.calls.at(-1)?.[0]).toBe(
        "/api/catalog/products?page=0&size=12",
      ),
    );
  });

  it("explica el fallo y reintenta la carga", async () => {
    mockedApiRequest
      .mockRejectedValueOnce(new ApiError("Catálogo no disponible.", 503))
      .mockResolvedValueOnce(
        catalog([
          {
            id: "9",
            sku: "P-009",
            name: "Monitor",
            description: null,
            price: 99000,
            stock: 0,
            active: true,
            imageUrl: null,
          },
        ]),
      );

    renderStore();
    expect(await screen.findByText("Catálogo no disponible.")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Monitor")).toBeTruthy();
    expect(screen.getByText("Sin stock")).toBeTruthy();
  });

  it("avisa cuando todavía no hay productos publicados", async () => {
    mockedApiRequest.mockResolvedValue(catalog([]));

    renderStore();
    expect(
      await screen.findByText("Todavía no hay productos publicados"),
    ).toBeTruthy();
  });

  it("cae a la placa con inicial cuando la foto no carga", async () => {
    mockedApiRequest.mockResolvedValue(
      catalog([
        {
          id: "4",
          sku: "P-002",
          name: "Teclado mecánico",
          description: null,
          price: 45990,
          stock: 7,
          active: true,
          imageUrl: "/img/roto.jpg",
        },
      ]),
    );

    renderStore();
    const photo = await screen.findByRole("img", { name: "Teclado mecánico" });
    fireEvent.error(photo);

    expect(screen.queryByRole("img", { name: "Teclado mecánico" })).toBeNull();
    expect(screen.getByText("P-002")).toBeTruthy();
  });
});
