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

function normalizeOrders(value: unknown): Order[] {
  return Array.isArray(value)
    ? value.map((order) => normalizeOrder(order as Order))
    : [];
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

  return {
    async list(): Promise<Order[]> {
      const orders = normalizeOrders(
        await apiRequest<unknown>("/api/orders", await getToken()),
      );
      if (access.canManageOrders) return orders;
      return access.oid ? orders.filter((order) => canView(order)) : [];
    },
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

  return {
    async list(): Promise<Product[]> {
      return normalizeProducts(
        await apiRequest<unknown>("/api/catalog/products", await getToken()),
      );
    },
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
