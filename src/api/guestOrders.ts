import type {
  CreateGuestOrderRequest,
  GuestLinkRequest,
  GuestOrder,
} from "../types";
import { ApiError, apiRequest } from "./client";

/**
 * Pedidos de invitado. Todas las llamadas son públicas a propósito: van con
 * `token` en `null`, así que nunca llevan `Authorization`. El secreto del
 * invitado es su token de seguimiento, que viaja en la ruta.
 */

const TRACKING_TOKEN = /^[0-9a-f]{64}$/;

/** 256 bits en 64 caracteres hexadecimales en minúscula. */
export function isTrackingToken(value: string): boolean {
  return TRACKING_TOKEN.test(value);
}

/** Mismo trato que un token desconocido: el servidor tampoco los distingue. */
function requireTrackingToken(token: string): string {
  if (!isTrackingToken(token))
    throw new ApiError("No encontramos un pedido para este enlace.", 404);
  return token;
}

export function normalizeGuestOrder(order: GuestOrder): GuestOrder {
  return {
    ...order,
    items: Array.isArray(order.items) ? order.items : [],
    total: Number(order.total ?? 0),
    notes: order.notes ?? "",
    cancellationReason: order.cancellationReason ?? null,
    maskedEmail: order.maskedEmail ?? "",
    createdAt: order.createdAt ?? "",
    updatedAt: order.updatedAt ?? order.createdAt ?? "",
    trackingToken: order.trackingToken ?? null,
  };
}

/** Registra el pedido; sólo esta respuesta trae `trackingToken`. */
export async function createGuestOrder(
  request: CreateGuestOrderRequest,
): Promise<GuestOrder> {
  return normalizeGuestOrder(
    await apiRequest<GuestOrder>("/api/guest-orders", null, {
      method: "POST",
      body: JSON.stringify(request),
    }),
  );
}

export async function getGuestOrder(token: string): Promise<GuestOrder> {
  return normalizeGuestOrder(
    await apiRequest<GuestOrder>(
      `/api/guest-orders/${requireTrackingToken(token)}`,
      null,
    ),
  );
}

/** Sólo desde `CREADO`; en otro estado el servidor responde `409`. */
export async function cancelGuestOrder(token: string): Promise<GuestOrder> {
  return normalizeGuestOrder(
    await apiRequest<GuestOrder>(
      `/api/guest-orders/${requireTrackingToken(token)}/cancel`,
      null,
      { method: "POST" },
    ),
  );
}

/**
 * Pide un enlace nuevo. El servidor responde `202` exista o no el pedido, así
 * que el resultado nunca dice si el correo compró.
 */
export async function requestGuestLink(request: GuestLinkRequest): Promise<void> {
  await apiRequest<unknown>("/api/guest-orders/link-requests", null, {
    method: "POST",
    body: JSON.stringify(request),
  });
}
