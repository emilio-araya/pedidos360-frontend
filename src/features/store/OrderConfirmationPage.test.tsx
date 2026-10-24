import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { CartProvider } from "./cart";
import { OrderConfirmationPage } from "./OrderConfirmationPage";
import type { Order } from "../../types";

vi.mock("../../auth/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../../api/client")>("../../api/client");
  return { ...actual, apiRequest: vi.fn() };
});

const mockedApiRequest = vi.mocked(apiRequest);
const mockedUseAuth = vi.mocked(useAuth);

const order: Order = {
  id: "o-1",
  orderNumber: "PED-1",
  customerId: "oid-1",
  status: "CREADO",
  items: [
    {
      productId: "p1",
      productName: "Mouse inalámbrico",
      quantity: 2,
      unitPrice: 19990,
      subtotal: 39980,
    },
  ],
  total: 39980,
  stockReserved: true,
  createdAt: "2026-10-23T12:00:00Z",
  updatedAt: "2026-10-23T12:00:00Z",
};

function renderConfirmation(state?: { order: Order }) {
  return render(
    <CartProvider>
      <MemoryRouter
        initialEntries={[{ pathname: "/pedido/o-1", state }]}
      >
        <Routes>
          <Route path="/pedido/:id" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    </CartProvider>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  mockedApiRequest.mockReset();
  mockedUseAuth.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    getAccessToken: vi.fn(async () => "token"),
    oid: "oid-1",
    isClient: true,
    canManageOrders: false,
    login: vi.fn(),
  } as never);
});

describe("OrderConfirmationPage", () => {
  it("muestra el número, el estado real y el total del pedido", () => {
    renderConfirmation({ order });

    expect(screen.getByRole("heading", { level: 1, name: "Pedido registrado" })).toBeTruthy();
    expect(screen.getByText("PED-1")).toBeTruthy();
    expect(screen.getByText("Creado")).toBeTruthy();
    expect(screen.getByText("Mouse inalámbrico × 2")).toBeTruthy();
    expect(screen.getByTestId("order-total").textContent).toContain("39.980");
    expect(screen.getByText(/pendiente de aceptación/i)).toBeTruthy();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it("no habla de pagos ni de envíos", () => {
    renderConfirmation({ order });

    expect(screen.queryByText(/pago en línea|pagado|envío|despacho en \d/i)).toBeNull();
  });

  it("recupera el pedido por su número si se abre el enlace directo", async () => {
    mockedApiRequest.mockResolvedValue(order);

    renderConfirmation();

    expect(await screen.findByText("PED-1")).toBeTruthy();
    expect(mockedApiRequest).toHaveBeenCalledWith("/api/orders/o-1", "token");
  });

  it("explica cuando el pedido no se puede consultar", async () => {
    mockedApiRequest.mockRejectedValue(new ApiError("No encontramos ese pedido.", 404));

    renderConfirmation();

    expect(await screen.findByText("No encontramos ese pedido.")).toBeTruthy();
  });
});
