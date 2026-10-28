export const APP_ROLES = ["Admin", "Operador", "Cliente"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ORDER_STATUSES = [
  "CREADO",
  "ACEPTADO",
  "EN_PREPARACION",
  "DESPACHADO",
  "ENTREGADO",
  "CANCELADO",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  active: boolean;
  /** Foto del producto (https o ruta del sitio); null si no tiene. */
  imageUrl: string | null;
}

export interface ProductInput {
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  active: boolean;
  imageUrl: string | null;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  notes?: string | null;
  stockReserved: boolean;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string | null;
  /** Correo del invitado; nulo en pedidos hechos con sesión. Sólo personal. */
  customerEmail?: string | null;
}

/**
 * Pedido visto por el invitado a través de su enlace secreto. No trae `id`
 * interno, `customerId`, `stockReserved` ni el correo completo.
 */
export interface GuestOrder {
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  notes: string;
  cancellationReason: string | null;
  /** Por ejemplo `l***@duocuc.cl`. */
  maskedEmail: string;
  createdAt: string;
  updatedAt: string;
  /** Sólo viene en la respuesta de creación; nulo en el resto. */
  trackingToken: string | null;
}

export interface CreateGuestOrderRequest {
  email: string;
  items: CreateOrderItem[];
  notes?: string;
}

export interface GuestLinkRequest {
  email: string;
  orderNumber: string;
}

export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItem[];
  notes?: string;
}

export interface UpdateOrderRequest {
  notes?: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  CREADO: "Creado",
  ACEPTADO: "Aceptado",
  EN_PREPARACION: "En preparación",
  DESPACHADO: "Despachado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  CREADO: ["ACEPTADO", "CANCELADO"],
  ACEPTADO: ["EN_PREPARACION", "CANCELADO"],
  EN_PREPARACION: ["DESPACHADO", "CANCELADO"],
  DESPACHADO: ["ENTREGADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

export function statusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
