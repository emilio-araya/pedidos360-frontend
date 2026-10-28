import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { OrdersPage } from "./OrdersPage";

vi.mock("../auth/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return { ...actual, apiRequest: vi.fn() };
});

const mockedApiRequest = vi.mocked(apiRequest);

const order = (overrides: Record<string, unknown> = {}) => ({
  id: "o-1",
  orderNumber: "PED-1A2B3C4D",
  customerId: "guest",
  customerEmail: "lucia@duocuc.cl",
  status: "CREADO",
  items: [],
  total: 1000,
  stockReserved: true,
  createdAt: "2026-10-28T12:00:00Z",
  updatedAt: "2026-10-28T12:00:00Z",
  ...overrides,
});

function respondWith(orders: unknown[]) {
  mockedApiRequest.mockImplementation(async (path: string) => {
    const content = path.startsWith("/api/orders") ? orders : [];
    return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1 } as never;
  });
}

beforeEach(() => {
  mockedApiRequest.mockReset();
  vi.mocked(useAuth).mockReturnValue({
    canManageOrders: true,
    isClient: false,
    oid: "staff-1",
    getAccessToken: vi.fn(async () => "token"),
  } as never);
});

describe("OrdersPage", () => {
  it("muestra al personal el correo del cliente invitado", async () => {
    respondWith([order()]);

    render(<OrdersPage />);

    expect(await screen.findByText("PED-1A2B3C4D")).toBeTruthy();
    expect(screen.getByText("lucia@duocuc.cl")).toBeTruthy();
  });

  it("no muestra correo en los pedidos hechos con sesión", async () => {
    respondWith([order({ customerEmail: null, customerId: "oid-9" })]);

    render(<OrdersPage />);

    expect(await screen.findByText("PED-1A2B3C4D")).toBeTruthy();
    expect(screen.queryByText(/@/)).toBeNull();
  });
});
