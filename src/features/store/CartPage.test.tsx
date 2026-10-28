import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../auth/AuthContext";
import { CART_STORAGE_KEY, CartProvider } from "./cart";
import type { CartLine } from "./cart";
import { CartPage } from "./CartPage";

vi.mock("../../auth/AuthContext", () => ({ useAuth: vi.fn() }));
const mockedUseAuth = vi.mocked(useAuth);

const line = (overrides: Partial<CartLine> = {}): CartLine => ({
  productId: "p1",
  sku: "P-001",
  name: "Mouse inalámbrico",
  price: 19990,
  imageUrl: null,
  stock: 3,
  quantity: 2,
  ...overrides,
});

function renderCart(lines: CartLine[]) {
  sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  return render(
    <CartProvider>
      <MemoryRouter initialEntries={["/carrito"]}>
        <Routes>
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={<div>Resumen del pedido</div>} />
        </Routes>
      </MemoryRouter>
    </CartProvider>,
  );
}

const money = (text: string) => text.replace(/\s/g, "");

beforeEach(() => {
  sessionStorage.clear();
  mockedUseAuth.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
  } as never);
});

describe("CartPage", () => {
  it("invita a ver el catálogo cuando el carrito está vacío", () => {
    renderCart([]);

    expect(screen.getByText("Tu carrito está vacío")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver catálogo" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Continuar con el pedido" })).toBeNull();
  });

  it("lista los productos con su subtotal y el total", () => {
    renderCart([line(), line({ productId: "p2", sku: "P-002", name: "Teclado", price: 5000, quantity: 1, stock: 10 })]);

    const mouse = screen.getByRole("listitem", { name: "Mouse inalámbrico" });
    expect(money(within(mouse).getByTestId("subtotal").textContent ?? "")).toBe("$39.980");
    expect(money(screen.getByTestId("order-total").textContent ?? "")).toBe("$44.980");
    expect(screen.getByRole("link", { name: "Carrito, 3 productos" })).toBeTruthy();
  });

  it("cambia la cantidad sin pasar el stock", async () => {
    renderCart([line()]);
    const mouse = screen.getByRole("listitem", { name: "Mouse inalámbrico" });
    const more = within(mouse).getByRole("button", { name: "Agregar una unidad" });

    await userEvent.click(more);

    expect(within(mouse).getByLabelText("Cantidad")).toHaveValue(3);
    expect(more).toBeDisabled();
    expect(money(screen.getByTestId("order-total").textContent ?? "")).toBe("$59.970");
  });

  it("quita un producto del carrito", async () => {
    renderCart([line(), line({ productId: "p2", sku: "P-002", name: "Teclado" })]);

    await userEvent.click(
      screen.getByRole("button", { name: "Quitar Mouse inalámbrico del carrito" }),
    );

    expect(screen.queryByRole("listitem", { name: "Mouse inalámbrico" })).toBeNull();
    expect(screen.getByRole("listitem", { name: "Teclado" })).toBeTruthy();
  });

  it("continúa al resumen del pedido", async () => {
    renderCart([line()]);

    await userEvent.click(screen.getByRole("link", { name: "Continuar con el pedido" }));

    expect(await screen.findByText("Resumen del pedido")).toBeTruthy();
  });
});
