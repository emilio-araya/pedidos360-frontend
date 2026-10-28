import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { CartProvider } from "./cart";
import { GuestLinkRequestPage } from "./GuestLinkRequestPage";

vi.mock("../../auth/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../../api/client")>("../../api/client");
  return { ...actual, apiRequest: vi.fn() };
});

const mockedApiRequest = vi.mocked(apiRequest);
const mockedUseAuth = vi.mocked(useAuth);

const NEUTRAL = "Si los datos coinciden, te enviaremos un enlace nuevo al correo.";

function renderPage() {
  return render(
    <CartProvider>
      <MemoryRouter initialEntries={["/seguimiento"]}>
        <Routes>
          <Route path="/seguimiento" element={<GuestLinkRequestPage />} />
        </Routes>
      </MemoryRouter>
    </CartProvider>,
  );
}

const emailField = () => screen.getByLabelText("Correo electrónico");
const numberField = () => screen.getByLabelText("Número de pedido");
const submit = () => screen.getByRole("button", { name: "Enviar enlace nuevo" });

async function fill(email = "lucia@duocuc.cl", orderNumber = "PED-7") {
  await userEvent.type(emailField(), email);
  await userEvent.type(numberField(), orderNumber);
  await userEvent.click(submit());
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

describe("GuestLinkRequestPage", () => {
  it("envía el correo y el número sin sesión y muestra el mensaje neutral", async () => {
    mockedApiRequest.mockResolvedValue(null);

    renderPage();
    await fill(" lucia@duocuc.cl ", " PED-7 ");

    expect(await screen.findByText(NEUTRAL)).toBeTruthy();
    const call = mockedApiRequest.mock.calls[0] as [string, string | null, RequestInit];
    expect(call[0]).toBe("/api/guest-orders/link-requests");
    expect(call[1]).toBeNull();
    expect(JSON.parse(String(call[2].body))).toEqual({
      email: "lucia@duocuc.cl",
      orderNumber: "PED-7",
    });
  });

  it("muestra el mismo mensaje exista o no el pedido", async () => {
    mockedApiRequest.mockResolvedValue(null);

    renderPage();
    await fill("nadie@ejemplo.cl", "PED-999");

    expect(await screen.findByText(NEUTRAL)).toBeTruthy();
    expect(screen.queryByText(/no existe|no encontramos/i)).toBeNull();
  });

  it("valida el correo y el número antes de enviar", async () => {
    renderPage();
    await userEvent.click(submit());

    expect(
      screen.getByText("Ingresa el correo con el que hiciste el pedido."),
    ).toBeTruthy();
    expect(screen.getByText("Ingresa el número de pedido.")).toBeTruthy();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it("rechaza un correo sin formato válido", async () => {
    renderPage();
    await fill("lucia", "PED-7");

    expect(
      screen.getByText("Ingresa un correo válido, por ejemplo nombre@dominio.cl."),
    ).toBeTruthy();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it("muestra los errores de formato del servidor por campo", async () => {
    mockedApiRequest.mockRejectedValue(
      new ApiError("Solicitud inválida", 400, [
        { field: "orderNumber", message: "no debe estar vacío" },
      ]),
    );

    renderPage();
    await fill();

    expect(await screen.findByText("no debe estar vacío")).toBeTruthy();
    expect(screen.queryByText(NEUTRAL)).toBeNull();
  });

  it("pide reintentar ante una falla del servidor", async () => {
    mockedApiRequest.mockRejectedValue(new ApiError("Bad Gateway", 502));

    renderPage();
    await fill();

    expect(
      await screen.findByText("No pudimos enviar la solicitud. Intenta de nuevo en unos minutos."),
    ).toBeTruthy();
    expect(screen.queryByText(NEUTRAL)).toBeNull();
  });
});
