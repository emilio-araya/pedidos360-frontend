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
        JSON.stringify(
          pageOf([
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
        ),
        { status: 200 },
      ),
    );
    const service = createOrdersService(getToken, {
      canManageOrders: false,
      isClient: true,
      oid: "oid-1",
    });

    const page = await service.list();

    expect(page.content).toHaveLength(1);
    expect(page.content[0].total).toBe(10);
    expect(page.content[0].notes).toBe("");
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
        imageUrl: null,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normaliza pedidos con valores nulos o faltantes", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "1",
          orderNumber: "PED-1",
          customerId: "oid-1",
          status: "CREADO",
        }),
        { status: 200 },
      ),
    );
    const service = createOrdersService(getToken, {
      canManageOrders: true,
      isClient: false,
      oid: null,
    });

    const order = await service.get("1");

    expect(order.notes).toBe("");
    expect(order.items).toEqual([]);
    expect(order.total).toBe(0);
    expect(order.stockReserved).toBe(false);
    expect(order.createdAt).toBe("");
    expect(order.updatedAt).toBe("");
  });

  it("normaliza productos con valores nulos o faltantes", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "p1",
          sku: "SKU-1",
          name: "Producto",
        }),
        { status: 200 },
      ),
    );
    const service = createCatalogService(getToken, { canManageCatalog: true });

    const product = await service.get("p1");

    expect(product.description).toBe("");
    expect(product.price).toBe(0);
    expect(product.stock).toBe(0);
    expect(product.active).toBe(true);
  });

  it("retorna lista vacía cuando el cliente no tiene oid", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(pageOf([{ id: "1" }])), { status: 200 }),
    );
    const service = createOrdersService(getToken, {
      canManageOrders: false,
      isClient: true,
      oid: null,
    });

    const page = await service.list();

    expect(page.content).toEqual([]);
  });

  it("bloquea changeStatus para clientes", async () => {
    vi.stubGlobal("fetch", fetchMock);
    const service = createOrdersService(getToken, {
      canManageOrders: false,
      isClient: true,
      oid: "oid-1",
    });

    await expect(
      service.changeStatus("1", "ACEPTADO"),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("permite changeStatus para personal", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "1",
          orderNumber: "PED-1",
          customerId: "oid-1",
          status: "ACEPTADO",
          items: [],
          total: 10,
          stockReserved: false,
          createdAt: "2026-01-01",
        }),
        { status: 200 },
      ),
    );
    const service = createOrdersService(getToken, {
      canManageOrders: true,
      isClient: false,
      oid: null,
    });

    const order = await service.changeStatus("1", "ACEPTADO");

    expect(order.status).toBe("ACEPTADO");
    expect(fetchMock).toHaveBeenCalled();
  });

  it("bloquea cancelar pedidos que no están en estado CREADO", async () => {
    vi.stubGlobal("fetch", fetchMock);
    const service = createOrdersService(getToken, {
      canManageOrders: false,
      isClient: true,
      oid: "oid-1",
    });

    await expect(
      service.cancel({
        id: "1",
        orderNumber: "PED-1",
        customerId: "oid-1",
        status: "ACEPTADO",
        items: [],
        total: 10,
        stockReserved: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("permite cancelar pedidos en estado CREADO para el cliente propietario", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const service = createOrdersService(getToken, {
      canManageOrders: false,
      isClient: true,
      oid: "oid-1",
    });

    await service.cancel({
      id: "1",
      orderNumber: "PED-1",
      customerId: "oid-1",
      status: "CREADO",
      items: [],
      total: 10,
      stockReserved: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/orders/1",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.any(Headers),
      }),
    );
  });

  it("valida stock negativo en updateStock", async () => {
    vi.stubGlobal("fetch", fetchMock);
    const service = createCatalogService(getToken, { canManageCatalog: true });

    await expect(service.updateStock("p1", -1)).rejects.toMatchObject({
      status: 400,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("valida stock no entero en updateStock", async () => {
    vi.stubGlobal("fetch", fetchMock);
    const service = createCatalogService(getToken, { canManageCatalog: true });

    await expect(service.updateStock("p1", 1.5)).rejects.toMatchObject({
      status: 400,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("permite updateStock válido", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "p1",
          sku: "SKU-1",
          name: "Producto",
          description: "",
          price: 10,
          stock: 25,
          active: true,
        }),
        { status: 200 },
      ),
    );
    const service = createCatalogService(getToken, { canManageCatalog: true });

    const product = await service.updateStock("p1", 25);

    expect(product.stock).toBe(25);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("bloquea update sin permiso de catálogo", async () => {
    vi.stubGlobal("fetch", fetchMock);
    const service = createCatalogService(getToken, { canManageCatalog: false });

    await expect(
      service.update("p1", {
        sku: "SKU-1",
        name: "Producto",
        description: "",
        price: 10,
        stock: 5,
        active: true,
        imageUrl: null,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bloquea remove sin permiso de catálogo", async () => {
    vi.stubGlobal("fetch", fetchMock);
    const service = createCatalogService(getToken, { canManageCatalog: false });

    await expect(service.remove("p1")).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("permite create con permiso de catálogo", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "p1",
          sku: "SKU-1",
          name: "Producto",
          description: "",
          price: 10,
          stock: 5,
          active: true,
        }),
        { status: 201 },
      ),
    );
    const service = createCatalogService(getToken, { canManageCatalog: true });

    const product = await service.create({
      sku: "SKU-1",
      name: "Producto",
      description: "",
      price: 10,
      stock: 5,
      active: true,
      imageUrl: null,
    });

    expect(product.id).toBe("p1");
    expect(fetchMock).toHaveBeenCalled();
  });

  it("normaliza respuestas que no son arrays", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ not: "an array" }), { status: 200 }),
    );
    const service = createOrdersService(getToken, {
      canManageOrders: true,
      isClient: false,
      oid: null,
    });

    const page = await service.list();

    expect(page.content).toEqual([]);
    expect(page.totalElements).toBe(0);
  });

  it("pide la página y el tamaño indicados", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(pageOf([])), { status: 200 }),
    );
    const service = createOrdersService(getToken, {
      canManageOrders: true,
      isClient: false,
      oid: null,
    });

    await service.list({ page: 2, size: 50 });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:8080/api/orders?page=2&size=50",
    );
  });

  it("pide el listado de productos paginado", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(pageOf([{ id: "p1" }])), { status: 200 }),
    );
    const service = createCatalogService(getToken, { canManageCatalog: false });

    await service.list({ page: 1, size: 10 });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:8080/api/catalog/products?page=1&size=10",
    );
  });

  it("listAll del catálogo recorre todas las páginas para el selector de productos", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(pageOf([{ id: "p1" }], { page: 0, totalPages: 2 })),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(pageOf([{ id: "p2" }], { page: 1, totalPages: 2 })),
          { status: 200 },
        ),
      );
    const service = createCatalogService(getToken, { canManageCatalog: false });

    const { products, truncated } = await service.listAll();

    expect(products.map((product) => product.id)).toEqual(["p1", "p2"]);
    expect(truncated).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("listAll recorre todas las páginas para los totales del dashboard", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(pageOf([{ id: "1" }], { page: 0, totalPages: 2 })),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(pageOf([{ id: "2" }], { page: 1, totalPages: 2 })),
          { status: 200 },
        ),
      );
    const service = createOrdersService(getToken, {
      canManageOrders: true,
      isClient: false,
      oid: null,
    });

    const { orders, truncated } = await service.listAll();

    expect(orders.map((order) => order.id)).toEqual(["1", "2"]);
    expect(truncated).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

function pageOf(
  content: unknown[],
  overrides: Partial<{
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }> = {},
) {
  return {
    content,
    page: overrides.page ?? 0,
    size: overrides.size ?? 20,
    totalElements: overrides.totalElements ?? content.length,
    totalPages: overrides.totalPages ?? 1,
  };
}
