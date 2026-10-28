import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../auth/AuthContext";
import { ApiError, apiRequest } from "../../api/client";
import { CartProvider } from "./cart";
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
    <CartProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<StorePage />} />
          <Route path="/orders" element={<div>Pedidos</div>} />
          <Route path="/dashboard" element={<div>Panel</div>} />
          <Route path="/producto/:id" element={<ProductStub />} />
        </Routes>
      </MemoryRouter>
    </CartProvider>,
  );
}

function ProductStub() {
  const { id } = useParams();
  return <div>Página del producto {id}</div>;
}

vi.mock("../../auth/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../../api/client")>("../../api/client");
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
  it("muestra el catálogo sin sesión y sin pedir login", async () => {
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
      <CartProvider>
        <MemoryRouter>
          <StorePage />
        </MemoryRouter>
      </CartProvider>,
    );

    expect(await screen.findByText("Teclado")).toBeTruthy();
    expect(mockedApiRequest.mock.calls[0][0]).toBe(
      "/api/catalog/products?page=0&size=12",
    );
    expect(mockedApiRequest.mock.calls[0][1]).toBeNull();

    expect(login).not.toHaveBeenCalled();
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
      <CartProvider>
        <MemoryRouter>
          <StorePage />
        </MemoryRouter>
      </CartProvider>,
    );

    const photo = await screen.findByRole("img", { name: "Mouse inalámbrico" });
    expect(photo.getAttribute("src")).toBe("/img/mouse.jpg");
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("navega a los pedidos desde la barra con la sesión iniciada", async () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login,
    } as never);
    mockedApiRequest.mockResolvedValue(catalog([]));

    renderStore();
    await userEvent.click(
      screen.getByRole("button", { name: "Mis pedidos" }),
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

  it("lleva a la página del producto al tocar la tarjeta", async () => {
    mockedApiRequest.mockResolvedValue(
      catalog([
        {
          id: "p 5",
          sku: "P-010",
          name: "Teclado",
          description: "Mecánico",
          price: 25000,
          stock: 3,
          active: true,
          imageUrl: "/img/teclado.jpg",
        },
      ]),
    );

    renderStore();
    await userEvent.click(await screen.findByRole("link", { name: "Ver Teclado" }));

    expect(await screen.findByText("Página del producto p 5")).toBeTruthy();
  });

  it("no muestra el estado vacío cuando falla la carga", async () => {
    mockedApiRequest.mockRejectedValueOnce(
      new ApiError("Catálogo no disponible.", 503),
    );

    renderStore();

    expect(await screen.findByText("Catálogo no disponible.")).toBeTruthy();
    expect(screen.queryByText("Todavía no hay productos publicados")).toBeNull();
  });

  it("ignora la respuesta de una página que llega tarde", async () => {
    const item = (id: string, name: string) => ({
      id,
      sku: `SKU-${id}`,
      name,
      description: null,
      price: 1000,
      stock: 10,
      active: true,
      imageUrl: null,
    });
    const twoPages = { totalElements: 24, totalPages: 2 };
    let resolveLate: (value: unknown) => void = () => undefined;
    mockedApiRequest
      .mockResolvedValueOnce(catalog([item("a", "Primera página")], twoPages))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveLate = resolve;
          }),
      )
      .mockResolvedValueOnce(
        catalog([item("b", "Primera página otra vez")], twoPages),
      );

    renderStore();
    await screen.findByText("Primera página");
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await userEvent.click(screen.getByRole("button", { name: "Anterior" }));
    await screen.findByText("Primera página otra vez");

    await act(async () => {
      resolveLate(catalog([item("c", "Segunda página tardía")], twoPages));
    });

    expect(screen.queryByText("Segunda página tardía")).toBeNull();
    expect(screen.getByText("Primera página otra vez")).toBeTruthy();
  });
});
