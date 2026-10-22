import type {
  CreateOrderRequest,
  Order,
  OrderStatus,
  Product,
  ProductInput,
} from "../types";
import { ApiError, apiRequest } from "./client";

export interface OrdersAccess {
  canManageOrders: boolean;
  isClient: boolean;
  oid: string | null;
}

export interface CatalogAccess {
  canManageCatalog: boolean;
}

export function normalizeOrder(order: Order): Order {
  return {
    ...order,
    notes: order.notes ?? "",
    items: Array.isArray(order.items) ? order.items : [],
    total: Number(order.total ?? 0),
    stockReserved: Boolean(order.stockReserved),
    createdAt: order.createdAt ?? "",
    updatedAt: order.updatedAt ?? order.createdAt ?? "",
  };
}

export function normalizeProduct(product: Product): Product {
  return {
    ...product,
    description: product.description ?? "",
    price: Number(product.price ?? 0),
    stock: Number(product.stock ?? 0),
    active: product.active !== false,
  };
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CatalogAggregate {
  products: Product[];
  /** true cuando el volumen supera el tope y la lista es parcial. */
  truncated: boolean;
}

export interface OrderAggregate {
  orders: Order[];
  /** true cuando el volumen supera el tope y los totales son parciales. */
  truncated: boolean;
}

export interface PageQuery {
  page?: number;
  size?: number;
}

/** Tope del backend: `size` fuera de este rango responde 400. */
export const MAX_PAGE_SIZE = 100;
/** Límite del dashboard para no encadenar requests sin control. */
const MAX_PAGES_FOR_AGGREGATES = 10;

function normalizeOrders(value: unknown): Order[] {
  return Array.isArray(value)
    ? value.map((order) => normalizeOrder(order as Order))
    : [];
}

function normalizePage<T>(
  value: unknown,
  normalize: (item: unknown) => T,
): Page<T> {
  const raw = (value ?? {}) as Record<string, unknown>;
  const content = Array.isArray(raw.content) ? raw.content.map(normalize) : [];
  return {
    content,
    page: typeof raw.page === "number" ? raw.page : 0,
    size: typeof raw.size === "number" ? raw.size : content.length,
    totalElements:
      typeof raw.totalElements === "number"
        ? raw.totalElements
        : content.length,
    totalPages:
      typeof raw.totalPages === "number"
        ? raw.totalPages
        : content.length > 0
          ? 1
          : 0,
  };
}

function buildPageQuery(query: PageQuery): string {
  const search = new URLSearchParams();
  if (query.page !== undefined) search.set("page", String(query.page));
  if (query.size !== undefined) search.set("size", String(query.size));
  return search.size > 0 ? `?${search.toString()}` : "";
}

function normalizeProducts(value: unknown): Product[] {
  return Array.isArray(value)
    ? value.map((product) => normalizeProduct(product as Product))
    : [];
}

export function createOrdersService(
  getToken: () => Promise<string>,
  access: OrdersAccess,
) {
  const canView = (order: Order) =>
    access.canManageOrders ||
    (access.isClient && order.customerId === access.oid);

  async function list(query: PageQuery = {}): Promise<Page<Order>> {
    const page = normalizePage(
      await apiRequest<unknown>(
        `/api/orders${buildPageQuery(query)}`,
        await getToken(),
      ),
      (item) => normalizeOrder(item as Order),
    );
    if (access.canManageOrders) return page;
    const content = access.oid
      ? page.content.filter((order) => canView(order))
      : [];
    return { ...page, content };
  }

  /**
   * Recorre las páginas para los agregados del dashboard.
   *
   * El dashboard suma sobre todos los pedidos: con una sola página los
   * totales serían falsos. Se corta en MAX_PAGES_FOR_AGGREGATES para que un
   * volumen grande no dispare requests sin límite.
   */
  async function listAll(): Promise<OrderAggregate> {
    const collected: Order[] = [];
    let page = 0;
    let totalPages = 1;
    while (page < totalPages && page < MAX_PAGES_FOR_AGGREGATES) {
      const result = await list({ page, size: MAX_PAGE_SIZE });
      collected.push(...result.content);
      totalPages = result.totalPages;
      page += 1;
    }
    return { orders: collected, truncated: page < totalPages };
  }

  return {
    list,
    listAll,
    async get(id: string): Promise<Order> {
      const order = normalizeOrder(
        await apiRequest<Order>(
          `/api/orders/${encodeURIComponent(id)}`,
          await getToken(),
        ),
      );
      if (!canView(order))
        throw new ApiError(
          "No tienes permisos para consultar este pedido.",
          403,
        );
      return order;
    },
    async create(request: CreateOrderRequest): Promise<Order> {
      return normalizeOrder(
        await apiRequest<Order>("/api/orders", await getToken(), {
          method: "POST",
          body: JSON.stringify(request),
        }),
      );
    },
    async update(id: string, request: { notes?: string }): Promise<Order> {
      return normalizeOrder(
        await apiRequest<Order>(
          `/api/orders/${encodeURIComponent(id)}`,
          await getToken(),
          {
            method: "PUT",
            body: JSON.stringify(request),
          },
        ),
      );
    },
    async changeStatus(id: string, status: OrderStatus): Promise<Order> {
      if (!access.canManageOrders)
        throw new ApiError(
          "No tienes permisos para cambiar el estado del pedido.",
          403,
        );
      return normalizeOrder(
        await apiRequest<Order>(
          `/api/orders/${encodeURIComponent(id)}/status`,
          await getToken(),
          {
            method: "PATCH",
            body: JSON.stringify({ status }),
          },
        ),
      );
    },
    async cancel(order: Order): Promise<void> {
      const canCancel =
        order.status === "CREADO" &&
        (access.canManageOrders ||
          (access.isClient && order.customerId === access.oid));
      if (!canCancel)
        throw new ApiError(
          "No tienes permisos para cancelar este pedido.",
          403,
        );
      await apiRequest<unknown>(
        `/api/orders/${encodeURIComponent(order.id)}`,
        await getToken(),
        { method: "DELETE" },
      );
    },
  };
}

export function createCatalogService(
  getToken: () => Promise<string>,
  access: CatalogAccess,
) {
  const requireManagement = () => {
    if (!access.canManageCatalog)
      throw new ApiError(
        "No tienes permisos para administrar el catálogo.",
        403,
      );
  };

  async function list(query: PageQuery = {}): Promise<Page<Product>> {
    return normalizePage(
      await apiRequest<unknown>(
        `/api/catalog/products${buildPageQuery(query)}`,
        await getToken(),
      ),
      (item) => normalizeProduct(item as Product),
    );
  }

  /**
   * Recorre las páginas para el selector de productos del formulario de
   * pedidos, que necesita el catálogo completo y no una página.
   */
  async function listAll(): Promise<CatalogAggregate> {
    const collected: Product[] = [];
    let page = 0;
    let totalPages = 1;
    while (page < totalPages && page < MAX_PAGES_FOR_AGGREGATES) {
      const result = await list({ page, size: MAX_PAGE_SIZE });
      collected.push(...result.content);
      totalPages = result.totalPages;
      page += 1;
    }
    return { products: collected, truncated: page < totalPages };
  }

  return {
    list,
    listAll,
    async get(id: string): Promise<Product> {
      return normalizeProduct(
        await apiRequest<Product>(
          `/api/catalog/products/${encodeURIComponent(id)}`,
          await getToken(),
        ),
      );
    },
    async create(input: ProductInput): Promise<Product> {
      requireManagement();
      return normalizeProduct(
        await apiRequest<Product>("/api/catalog/products", await getToken(), {
          method: "POST",
          body: JSON.stringify(input),
        }),
      );
    },
    async update(id: string, input: ProductInput): Promise<Product> {
      requireManagement();
      return normalizeProduct(
        await apiRequest<Product>(
          `/api/catalog/products/${encodeURIComponent(id)}`,
          await getToken(),
          {
            method: "PUT",
            body: JSON.stringify(input),
          },
        ),
      );
    },
    async remove(id: string): Promise<void> {
      requireManagement();
      await apiRequest<unknown>(
        `/api/catalog/products/${encodeURIComponent(id)}`,
        await getToken(),
        { method: "DELETE" },
      );
    },
    async updateStock(id: string, stock: number): Promise<Product> {
      requireManagement();
      if (!Number.isInteger(stock) || stock < 0)
        throw new ApiError("El stock debe ser un entero no negativo.", 400);
      return normalizeProduct(
        await apiRequest<Product>(
          `/api/catalog/products/${encodeURIComponent(id)}/stock`,
          await getToken(),
          {
            method: "PATCH",
            body: JSON.stringify({ stock }),
          },
        ),
      );
    },
  };
}

/**
 * Vitrina pública: lee el catálogo sin sesión. Expone solo lectura, que es
 * lo único que el backend permite de forma anónima; cualquier mutación
 * sigue exigiendo un token con rol operativo.
 */
export function createPublicCatalogService() {
  return {
    async list(query: PageQuery = {}): Promise<Page<Product>> {
      return normalizePage(
        await apiRequest<unknown>(
          `/api/catalog/products${buildPageQuery(query)}`,
        ),
        (item) => normalizeProduct(item as Product),
      );
    },
  };
}
