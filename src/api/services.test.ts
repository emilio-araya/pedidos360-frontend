import { afterEach, describe, expect, it, vi } from "vitest";
import { createCatalogService, createOrdersService } from "./services";

const fetchMock = vi.fn();
const getToken = vi.fn(async () => "test-token");

afterEach(() => {
  fetchMock.mockReset();
  getToken.mockClear();
  vi.unstubAllGlobals();
});

describe("servicios de API", () => {
  it("filtra pedidos de cliente por oid y normaliza la respuesta", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: "1",
            orderNumber: "PED-1",
            customerId: "oid-1",
            status: "CREADO",
            items: [],
            total: "10",
            stockReserved: false,
            createdAt: "2026-01-01",
          },
          {
            id: "2",
            orderNumber: "PED-2",
            customerId: "oid-2",
            status: "CREADO",
            items: [],
            total: 20,
            stockReserved: false,
            createdAt: "2026-01-01",
          },
        ]),
        { status: 200 },
      ),
    );
    const service = createOrdersService(getToken, {
      canManageOrders: false,
      isClient: true,
      oid: "oid-1",
    });

    const orders = await service.list();

    expect(orders).toHaveLength(1);
    expect(orders[0].total).toBe(10);
    expect(orders[0].notes).toBe("");
  });

  it("permite a operadores consultar todos y bloquea transiciones a clientes", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "1",
          orderNumber: "PED-1",
          customerId: "oid-1",
          status: "CREADO",
          items: [],
          total: 10,
          stockReserved: false,
          createdAt: "2026-01-01",
        }),
        { status: 200 },
      ),
    );
    const clientService = createOrdersService(getToken, {
      canManageOrders: false,
      isClient: true,
      oid: "oid-1",
    });
    await expect(
      clientService.changeStatus("1", "ACEPTADO"),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("exige rol de catálogo para mutaciones", async () => {
    vi.stubGlobal("fetch", fetchMock);
    const service = createCatalogService(getToken, { canManageCatalog: false });
    await expect(
      service.create({
        sku: "P-1",
        name: "Producto",
        description: "",
        price: 1,
        stock: 1,
        active: true,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
