import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { GuestOrder } from "../../types";
import { CartProvider } from "./cart";
import { GuestTrackingPage } from "./GuestTrackingPage";

vi.mock("../../auth/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../../api/client")>("../../api/client");
  return { ...actual, apiRequest: vi.fn() };
});

const mockedApiRequest = vi.mocked(apiRequest);
const mockedUseAuth = vi.mocked(useAuth);

const TOKEN = "0123456789abcdef".repeat(4);

const order = (overrides: Partial<GuestOrder> = {}): GuestOrder => ({
  orderNumber: "PED-7",
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
  notes: "Entregar en la tarde",
  cancellationReason: null,
  maskedEmail: "l***@duocuc.cl",
  createdAt: "2026-10-28T12:00:00Z",
  updatedAt: "2026-10-28T15:30:00Z",
  trackingToken: null,
  ...overrides,
});

function renderTracking(
  token = TOKEN,
  state?: { order: GuestOrder; justCreated: boolean },
) {
  return render(
    <CartProvider>
      <MemoryRouter initialEntries={[{ pathname: `/seguimiento/${token}`, state }]}>
        <Routes>
          <Route path="/seguimiento/:token" element={<GuestTrackingPage />} />
          <Route path="/seguimiento" element={<div>Recuperar enlace</div>} />
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

describe("GuestTrackingPage", () => {
  it("muestra el pedido del enlace sin enviar sesión", async () => {
    mockedApiRequest.mockResolvedValue(order());

    renderTracking();

    expect(await screen.findByText("PED-7")).toBeTruthy();
    expect(mockedApiRequest).toHaveBeenCalledWith(`/api/guest-orders/${TOKEN}`, null);
    expect(screen.getByText("Creado")).toBeTruthy();
    expect(screen.getByText("Mouse inalámbrico × 2")).toBeTruthy();
    expect(screen.getByTestId("order-total").textContent).toContain("39.980");
    expect(screen.getByText("Entregar en la tarde")).toBeTruthy();
    expect(screen.getByText(/l\*\*\*@duocuc\.cl/)).toBeTruthy();
    expect(document.querySelector('time[datetime="2026-10-28T12:00:00Z"]')).toBeTruthy();
    expect(document.querySelector('time[datetime="2026-10-28T15:30:00Z"]')).toBeTruthy();
    expect(screen.queryByText(/guarda este enlace/i)).toBeNull();
  });

  it("recién creado: avisa que guarde el enlace y permite copiarlo", async () => {
    const user = userEvent.setup();
    renderTracking(TOKEN, {
      order: order({ trackingToken: TOKEN }),
      justCreated: true,
    });

    expect(screen.getByText("PED-7")).toBeTruthy();
    expect(screen.getByText(/guarda este enlace/i)).toBeTruthy();
    expect(screen.getByText(/también te lo enviamos/i)).toBeTruthy();
    const link = `${window.location.origin}/seguimiento/${TOKEN}`;
    expect(screen.getByLabelText("Enlace de seguimiento")).toHaveValue(link);

    await user.click(screen.getByRole("button", { name: "Copiar enlace" }));

    expect(await navigator.clipboard.readText()).toBe(link);
    expect(screen.getByText("Enlace copiado")).toBeTruthy();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it("no ofrece cancelar cuando el pedido ya avanzó", async () => {
    mockedApiRequest.mockResolvedValue(order({ status: "ACEPTADO" }));

    renderTracking();

    expect(await screen.findByText("Aceptado")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).toBeNull();
  });

  it("cancela tras confirmar y muestra el pedido actualizado", async () => {
    mockedApiRequest
      .mockResolvedValueOnce(order())
      .mockResolvedValueOnce(
        order({ status: "CANCELADO", cancellationReason: "Cancelado por el cliente" }),
      );

    renderTracking();
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar pedido" }));

    const dialog = screen.getByRole("dialog", { name: "¿Cancelar el pedido PED-7?" });
    expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    await userEvent.click(within(dialog).getByRole("button", { name: "Sí, cancelar" }));

    expect(await screen.findByText("Cancelado")).toBeTruthy();
    expect(mockedApiRequest).toHaveBeenLastCalledWith(
      `/api/guest-orders/${TOKEN}/cancel`,
      null,
      { method: "POST" },
    );
    expect(screen.getByText("Cancelado por el cliente")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).toBeNull();
  });

  it("no cancela si se descarta la confirmación", async () => {
    mockedApiRequest.mockResolvedValue(order());

    renderTracking();
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar pedido" }));
    await userEvent.click(screen.getByRole("button", { name: "No, mantener" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Creado")).toBeTruthy();
  });

  it("explica cuando el pedido ya no se puede cancelar", async () => {
    mockedApiRequest
      .mockResolvedValueOnce(order())
      .mockRejectedValueOnce(new ApiError("El pedido no se puede cancelar.", 409));

    renderTracking();
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar pedido" }));
    await userEvent.click(screen.getByRole("button", { name: "Sí, cancelar" }));

    expect(
      await screen.findByText(/ya avanzó y no se puede cancelar/i),
    ).toBeTruthy();
  });

  it("muestra el motivo de cancelación cuando existe", async () => {
    mockedApiRequest.mockResolvedValue(
      order({ status: "CANCELADO", cancellationReason: "Sin stock" }),
    );

    renderTracking();

    expect(await screen.findByText("Sin stock")).toBeTruthy();
    expect(screen.getByText("Cancelado")).toBeTruthy();
  });

  it("trata un 404 como enlace inválido o reemplazado", async () => {
    mockedApiRequest.mockRejectedValue(new ApiError("Not Found", 404));

    renderTracking();

    expect(
      await screen.findByRole("heading", { name: "Este enlace no es válido" }),
    ).toBeTruthy();
    expect(screen.getByText(/inválido o fue reemplazado/i)).toBeTruthy();
    await userEvent.click(screen.getByRole("link", { name: "Pedir un enlace nuevo" }));
    expect(screen.getByText("Recuperar enlace")).toBeTruthy();
  });

  it("no consulta el servidor con un token mal formado", () => {
    renderTracking("ABC123");

    expect(
      screen.getByRole("heading", { name: "Este enlace no es válido" }),
    ).toBeTruthy();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it("ofrece reintentar ante una falla de red", async () => {
    mockedApiRequest
      .mockRejectedValueOnce(new ApiError("No fue posible conectar con la API.", 0))
      .mockResolvedValueOnce(order());

    renderTracking();
    await userEvent.click(await screen.findByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("PED-7")).toBeTruthy();
    expect(mockedApiRequest).toHaveBeenCalledTimes(2);
  });
});
