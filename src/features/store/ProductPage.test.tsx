import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { CartProvider } from "./cart";
import { ProductPage } from "./ProductPage";

vi.mock("../../auth/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../../api/client")>("../../api/client");
  return { ...actual, apiRequest: vi.fn() };
});

const mockedApiRequest = vi.mocked(apiRequest);
const mockedUseAuth = vi.mocked(useAuth);

const mouse = {
  id: "p1",
  sku: "P-001",
  name: "Mouse inalámbrico",
  description: "Mouse óptico con receptor USB",
  price: 19990,
  stock: 3,
  active: true,
  imageUrl: "/img/mouse.jpg",
};

/** Responde el detalle pedido y deja vacío el bloque "Más del catálogo". */
function serve(product: unknown) {
  mockedApiRequest.mockImplementation(async (path: string) => {
    if (path.startsWith("/api/catalog/products/")) {
      if (product instanceof Error) throw product;
      return product;
    }
    return { content: [], page: 0, size: 5, totalElements: 0, totalPages: 0 };
  });
}

function renderProduct(id = "p1") {
  return render(
    <CartProvider>
      <MemoryRouter initialEntries={[`/producto/${id}`]}>
        <Routes>
          <Route path="/producto/:id" element={<ProductPage />} />
          <Route path="/checkout" element={<div>Resumen del pedido</div>} />
        </Routes>
      </MemoryRouter>
    </CartProvider>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  mockedApiRequest.mockReset();
  mockedUseAuth.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
  } as never);
});

describe("ProductPage", () => {
  it("muestra el producto pedido sin sesión", async () => {
    serve(mouse);

    renderProduct();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mouse inalámbrico" }),
    ).toBeTruthy();
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/catalog/products/p1", null);
    expect(screen.getByText("Últimas 3")).toBeTruthy();
  });

  it("limita la cantidad entre 1 y el stock", async () => {
    serve(mouse);
    renderProduct();
    await screen.findByRole("heading", { level: 1 });

    const less = screen.getByRole("button", { name: "Quitar una unidad" });
    const more = screen.getByRole("button", { name: "Agregar una unidad" });
    expect(less).toBeDisabled();

    await userEvent.click(more);
    await userEvent.click(more);

    expect(screen.getByLabelText("Cantidad")).toHaveValue(3);
    expect(more).toBeDisabled();
  });

  it("agrega al carrito la cantidad elegida", async () => {
    serve(mouse);
    renderProduct();
    await screen.findByRole("heading", { level: 1 });

    await userEvent.click(screen.getByRole("button", { name: "Agregar una unidad" }));
    await userEvent.click(screen.getByRole("button", { name: "Agregar al carrito" }));

    expect(screen.getByRole("link", { name: "Carrito, 2 productos" })).toBeTruthy();
    expect(screen.getByRole("status")).toHaveTextContent("Agregaste 2 al carrito");
  });

  it("compra ahora: agrega al carrito y lleva al resumen", async () => {
    serve(mouse);
    renderProduct();
    await screen.findByRole("heading", { level: 1 });

    await userEvent.click(screen.getByRole("button", { name: "Comprar ahora" }));

    expect(await screen.findByText("Resumen del pedido")).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem("pedidos360.cart") ?? "[]")).toMatchObject([
      { productId: "p1", quantity: 1 },
    ]);
  });

  it("no deja comprar un producto sin stock", async () => {
    serve({ ...mouse, stock: 0 });
    renderProduct();
    await screen.findByRole("heading", { level: 1 });

    expect(screen.getByRole("button", { name: "Comprar ahora" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Agregar al carrito" })).toBeDisabled();
    expect(screen.getByText("Sin stock")).toBeTruthy();
  });

  it("avisa cuando el producto no existe", async () => {
    serve(new ApiError("Producto no encontrado", 404));

    renderProduct("no-existe");

    expect(await screen.findByText("Este producto no está en el catálogo")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Volver al catálogo" })).toBeTruthy();
  });

  it("explica el fallo y reintenta", async () => {
    serve(new ApiError("Catálogo no disponible.", 503));
    renderProduct();
    expect(await screen.findByText("Catálogo no disponible.")).toBeTruthy();

    serve(mouse);
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mouse inalámbrico" }),
    ).toBeTruthy();
  });
});
