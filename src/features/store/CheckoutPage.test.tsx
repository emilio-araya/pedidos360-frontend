import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { CART_STORAGE_KEY, CartProvider } from "./cart";
import type { CartLine } from "./cart";
import { CheckoutPage } from "./CheckoutPage";

vi.mock("../../auth/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../../api/client")>("../../api/client");
  return { ...actual, apiRequest: vi.fn() };
});

const mockedApiRequest = vi.mocked(apiRequest);
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

const order = {
  id: "o-1",
  orderNumber: "PED-1",
  customerId: "oid-1",
  status: "CREADO",
  items: [],
  total: 39980,
  stockReserved: true,
  createdAt: "2026-10-23T12:00:00Z",
};

function renderCheckout(lines: CartLine[] = [line()]) {
  sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  return render(
    <CartProvider>
      <MemoryRouter initialEntries={["/checkout"]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/pedido/:id" element={<OrderStub />} />
          <Route path="/carrito" element={<div>Carrito</div>} />
        </Routes>
      </MemoryRouter>
    </CartProvider>,
  );
}

function OrderStub() {
  return <div>Pedido confirmado</div>;
}

function session(overrides: Record<string, unknown> = {}) {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    getAccessToken: vi.fn(async () => "token"),
    oid: "oid-1",
    isClient: true,
    canManageOrders: false,
    login: vi.fn(),
    ...overrides,
  } as never);
}

beforeEach(() => {
  sessionStorage.clear();
  mockedApiRequest.mockReset();
  session();
});

describe("CheckoutPage", () => {
  it("pide iniciar sesión antes de confirmar y vuelve al resumen", async () => {
    const login = vi.fn();
    session({ isAuthenticated: false, login });

    renderCheckout();

    expect(screen.getByText("Inicia sesión para confirmar")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirmar pedido" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Iniciar sesión para confirmar" }));

    expect(login).toHaveBeenCalledWith("/checkout");
  });

  it("resume los productos y el total antes de confirmar", () => {
    renderCheckout();

    expect(screen.getByText("Mouse inalámbrico × 2")).toBeTruthy();
    expect(screen.getByTestId("order-total").textContent).toContain("39.980");
    expect(screen.getByLabelText("Notas para el pedido (opcional)")).toBeTruthy();
  });

  it("crea el pedido con los ítems y las notas, y vacía el carrito", async () => {
    mockedApiRequest.mockResolvedValue(order);

    renderCheckout();
    await userEvent.type(
      screen.getByLabelText("Notas para el pedido (opcional)"),
      "Entregar en la tarde",
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    expect(await screen.findByText("Pedido confirmado")).toBeTruthy();
    const call = mockedApiRequest.mock.calls[0] as [string, string, RequestInit];
    expect(call[0]).toBe("/api/orders");
    expect(call[1]).toBe("token");
    expect(JSON.parse(String(call[2].body))).toEqual({
      items: [{ productId: "p1", quantity: 2 }],
      notes: "Entregar en la tarde",
    });
    expect(JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY) ?? "null")).toEqual([]);
  });

  it("explica que la cuenta no tiene rol y conserva el carrito", async () => {
    mockedApiRequest.mockRejectedValue(
      new ApiError("No autorizado para crear pedidos.", 403),
    );

    renderCheckout();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    expect(
      await screen.findByText(/no tiene un rol habilitado para registrar pedidos/i),
    ).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY) ?? "[]")).toHaveLength(1);
  });

  it("muestra el mensaje del servidor si falta stock", async () => {
    mockedApiRequest.mockRejectedValue(
      new ApiError("Stock insuficiente para Mouse inalámbrico.", 409),
    );

    renderCheckout();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    expect(
      await screen.findByText("Stock insuficiente para Mouse inalámbrico."),
    ).toBeTruthy();
  });

  it("no deja confirmar con el carrito vacío", () => {
    renderCheckout([]);

    expect(screen.getByText("Tu carrito está vacío")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirmar pedido" })).toBeNull();
  });
});
