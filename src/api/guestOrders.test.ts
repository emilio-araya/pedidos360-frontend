import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelGuestOrder,
  createGuestOrder,
  getGuestOrder,
  isTrackingToken,
  requestGuestLink,
} from "./guestOrders";

const fetchMock = vi.fn();
const TOKEN = "a".repeat(64);

const guestOrder = {
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
  total: "39980",
  notes: null,
  cancellationReason: null,
  maskedEmail: "l***@duocuc.cl",
  createdAt: "2026-10-28T12:00:00Z",
  updatedAt: "2026-10-28T12:00:00Z",
};

function respond(body: unknown, status = 200) {
  fetchMock.mockResolvedValue(
    new Response(body === null ? "" : JSON.stringify(body), { status }),
  );
}

function lastRequest(): { url: string; init: RequestInit; headers: Headers } {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init, headers: init.headers as Headers };
}

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("pedidos de invitado", () => {
  it("crea el pedido sin Authorization y devuelve el token de seguimiento", async () => {
    vi.stubGlobal("fetch", fetchMock);
    respond({ ...guestOrder, trackingToken: TOKEN }, 201);

    const created = await createGuestOrder({
      email: "lucia@duocuc.cl",
      items: [{ productId: "p1", quantity: 2 }],
      notes: "Entregar en la tarde",
    });

    const { url, init, headers } = lastRequest();
    expect(url).toBe("http://localhost:8080/api/guest-orders");
    expect(init.method).toBe("POST");
    expect(headers.has("Authorization")).toBe(false);
    expect(JSON.parse(String(init.body))).toEqual({
      email: "lucia@duocuc.cl",
      items: [{ productId: "p1", quantity: 2 }],
      notes: "Entregar en la tarde",
    });
    expect(created.trackingToken).toBe(TOKEN);
    expect(created.total).toBe(39980);
    expect(created.notes).toBe("");
    expect(created.cancellationReason).toBeNull();
    expect(created.maskedEmail).toBe("l***@duocuc.cl");
  });

  it("consulta el pedido por token sin Authorization", async () => {
    vi.stubGlobal("fetch", fetchMock);
    respond(guestOrder);

    const order = await getGuestOrder(TOKEN);

    const { url, init, headers } = lastRequest();
    expect(url).toBe(`http://localhost:8080/api/guest-orders/${TOKEN}`);
    expect(init.method ?? "GET").toBe("GET");
    expect(headers.has("Authorization")).toBe(false);
    expect(order.orderNumber).toBe("PED-7");
    expect(order.trackingToken).toBeNull();
  });

  it("cancela por token sin Authorization y devuelve el pedido actualizado", async () => {
    vi.stubGlobal("fetch", fetchMock);
    respond({
      ...guestOrder,
      status: "CANCELADO",
      cancellationReason: "Cancelado por el cliente",
    });

    const order = await cancelGuestOrder(TOKEN);

    const { url, init, headers } = lastRequest();
    expect(url).toBe(`http://localhost:8080/api/guest-orders/${TOKEN}/cancel`);
    expect(init.method).toBe("POST");
    expect(headers.has("Authorization")).toBe(false);
    expect(order.status).toBe("CANCELADO");
    expect(order.cancellationReason).toBe("Cancelado por el cliente");
  });

  it("pide un enlace nuevo sin Authorization y acepta el 202 sin cuerpo", async () => {
    vi.stubGlobal("fetch", fetchMock);
    respond(null, 202);

    await expect(
      requestGuestLink({ email: "lucia@duocuc.cl", orderNumber: "PED-7" }),
    ).resolves.toBeUndefined();

    const { url, init, headers } = lastRequest();
    expect(url).toBe("http://localhost:8080/api/guest-orders/link-requests");
    expect(init.method).toBe("POST");
    expect(headers.has("Authorization")).toBe(false);
    expect(JSON.parse(String(init.body))).toEqual({
      email: "lucia@duocuc.cl",
      orderNumber: "PED-7",
    });
  });

  it("no sale a la red con un token mal formado", async () => {
    vi.stubGlobal("fetch", fetchMock);

    await expect(getGuestOrder("../api/orders")).rejects.toMatchObject({
      status: 404,
    });
    await expect(cancelGuestOrder("ABC")).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reconoce sólo 64 caracteres hexadecimales en minúscula", () => {
    expect(isTrackingToken(TOKEN)).toBe(true);
    expect(isTrackingToken("0123456789abcdef".repeat(4))).toBe(true);
    expect(isTrackingToken("A".repeat(64))).toBe(false);
    expect(isTrackingToken("a".repeat(63))).toBe(false);
    expect(isTrackingToken("a".repeat(65))).toBe(false);
    expect(isTrackingToken("g".repeat(64))).toBe(false);
    expect(isTrackingToken("")).toBe(false);
  });
});
