import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation, useParams } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import type { GuestOrder } from "../../types";
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

const TOKEN = "0123456789abcdef".repeat(4);

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

const created: GuestOrder = {
  orderNumber: "PED-7",
  status: "CREADO",
  items: [],
  total: 39980,
  notes: "",
  cancellationReason: null,
  maskedEmail: "l***@duocuc.cl",
  createdAt: "2026-10-28T12:00:00Z",
  updatedAt: "2026-10-28T12:00:00Z",
  trackingToken: TOKEN,
};

function renderCheckout(lines: CartLine[] = [line()]) {
  sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  return render(
    <CartProvider>
      <MemoryRouter initialEntries={["/checkout"]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/seguimiento/:token" element={<TrackingStub />} />
          <Route path="/carrito" element={<div>Carrito</div>} />
        </Routes>
      </MemoryRouter>
    </CartProvider>,
  );
}

function TrackingStub() {
  const { token } = useParams();
  const state = useLocation().state as
    | { order?: GuestOrder; justCreated?: boolean }
    | null;
  return (
    <div>
      Seguimiento {token} · {state?.order?.orderNumber} ·{" "}
      {state?.justCreated ? "recién creado" : "sin aviso"}
    </div>
  );
}

function session(overrides: Record<string, unknown> = {}) {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    getAccessToken: vi.fn(async () => "token"),
    oid: null,
    isClient: false,
    canManageOrders: false,
    login: vi.fn(),
    ...overrides,
  } as never);
}

const emailField = () => screen.getByLabelText("Correo electrónico");
const notesField = () => screen.getByLabelText("Notas para el pedido (opcional)");
const confirmButton = () => screen.getByRole("button", { name: "Confirmar pedido" });
const storedCart = () => JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY) ?? "null");

beforeEach(() => {
  sessionStorage.clear();
  mockedApiRequest.mockReset();
  session();
});

describe("CheckoutPage", () => {
  it("deja confirmar sin iniciar sesión, con correo y notas", () => {
    renderCheckout();

    expect(screen.queryByText(/inicia sesión/i)).toBeNull();
    expect(confirmButton()).toBeTruthy();
    expect(emailField()).toHaveAttribute("type", "email");
    expect(emailField()).toHaveAttribute("autocomplete", "email");
    expect(emailField()).toHaveAttribute("maxlength", "254");
    expect(emailField()).toBeRequired();
    expect(notesField()).toBeTruthy();
  });

  it("resume los productos y el total antes de confirmar", () => {
    renderCheckout();

    expect(screen.getByText("Mouse inalámbrico × 2")).toBeTruthy();
    expect(screen.getByTestId("order-total").textContent).toContain("39.980");
  });

  it("crea el pedido de invitado sin token, vacía el carrito y abre el seguimiento", async () => {
    mockedApiRequest.mockResolvedValue(created);

    renderCheckout();
    await userEvent.type(emailField(), "  Lucia@duocuc.cl ");
    await userEvent.type(notesField(), "Entregar en la tarde");
    await userEvent.click(confirmButton());

    expect(
      await screen.findByText(`Seguimiento ${TOKEN} · PED-7 · recién creado`),
    ).toBeTruthy();
    expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    const call = mockedApiRequest.mock.calls[0] as [string, string | null, RequestInit];
    expect(call[0]).toBe("/api/guest-orders");
    expect(call[1]).toBeNull();
    expect(call[2].method).toBe("POST");
    expect(JSON.parse(String(call[2].body))).toEqual({
      email: "Lucia@duocuc.cl",
      items: [{ productId: "p1", quantity: 2 }],
      notes: "Entregar en la tarde",
    });
    expect(storedCart()).toEqual([]);
  });

  it("también confirma como invitado cuando hay una sesión abierta", async () => {
    session({ isAuthenticated: true, oid: "oid-1", isClient: true });
    mockedApiRequest.mockResolvedValue(created);

    renderCheckout();
    await userEvent.type(emailField(), "lucia@duocuc.cl");
    await userEvent.click(confirmButton());

    expect(await screen.findByText(/Seguimiento/)).toBeTruthy();
    expect(mockedApiRequest.mock.calls[0][1]).toBeNull();
  });

  it("pide el correo antes de enviar", async () => {
    renderCheckout();
    await userEvent.click(confirmButton());

    expect(
      screen.getByText("Ingresa tu correo para recibir el comprobante."),
    ).toBeTruthy();
    expect(emailField()).toHaveAttribute("aria-invalid", "true");
    expect(mockedApiRequest).not.toHaveBeenCalled();
    expect(storedCart()).toHaveLength(1);
  });

  it("rechaza un correo sin formato válido", async () => {
    renderCheckout();
    await userEvent.type(emailField(), "lucia@duocuc");
    await userEvent.click(confirmButton());

    expect(
      screen.getByText("Ingresa un correo válido, por ejemplo nombre@dominio.cl."),
    ).toBeTruthy();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it("rechaza un correo de más de 254 caracteres", async () => {
    renderCheckout();
    fireEvent.change(emailField(), {
      target: { value: `${"a".repeat(247)}@duoc.cl` },
    });
    expect((emailField() as HTMLInputElement).value).toHaveLength(255);
    await userEvent.click(confirmButton());

    expect(
      screen.getByText("El correo no puede superar 254 caracteres."),
    ).toBeTruthy();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it("muestra junto a cada campo los errores de validación del servidor", async () => {
    mockedApiRequest.mockRejectedValue(
      new ApiError("La solicitud tiene errores de validación.", 400, [
        { field: "email", message: "debe ser una dirección de correo válida" },
        { field: "notes", message: "no puede superar 1000 caracteres" },
      ]),
    );

    renderCheckout();
    await userEvent.type(emailField(), "lucia@duocuc.cl");
    await userEvent.click(confirmButton());

    expect(
      await screen.findByText("debe ser una dirección de correo válida"),
    ).toBeTruthy();
    expect(screen.getByText("no puede superar 1000 caracteres")).toBeTruthy();
    expect(emailField()).toHaveAttribute("aria-invalid", "true");
    expect(notesField()).toHaveAttribute("aria-invalid", "true");
    expect(storedCart()).toHaveLength(1);
  });

  it("muestra el mensaje del servidor si falta stock", async () => {
    mockedApiRequest.mockRejectedValue(
      new ApiError("Stock insuficiente para Mouse inalámbrico.", 409),
    );

    renderCheckout();
    await userEvent.type(emailField(), "lucia@duocuc.cl");
    await userEvent.click(confirmButton());

    expect(
      await screen.findByText("Stock insuficiente para Mouse inalámbrico."),
    ).toBeTruthy();
  });

  it("pide reintentar ante una falla del servidor y conserva el carrito", async () => {
    mockedApiRequest.mockRejectedValue(new ApiError("Bad Gateway", 502));

    renderCheckout();
    await userEvent.type(emailField(), "lucia@duocuc.cl");
    await userEvent.click(confirmButton());

    expect(
      await screen.findByText(
        "No pudimos registrar tu pedido. Revisa tu conexión e intenta de nuevo.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/rol Cliente/)).toBeNull();
    expect(confirmButton()).toBeEnabled();
    expect(storedCart()).toHaveLength(1);
  });

  it("no deja confirmar con el carrito vacío", () => {
    renderCheckout([]);

    expect(screen.getByText("Tu carrito está vacío")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirmar pedido" })).toBeNull();
  });
});
