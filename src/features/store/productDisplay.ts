import type { Product } from "../../types";

const LOW_STOCK = 5;

const priceFormat = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export type StockTone = "in" | "low" | "out";

/** Producto con foto para mostrar. */
export type ProductWithPhoto = Product & { imageUrl: string };

export function formatPrice(price: number): string {
  return priceFormat.format(price);
}

export function formatProductCount(count: number): string {
  return `${count} ${count === 1 ? "producto" : "productos"}`;
}

export function stockStatus(stock: number): { label: string; tone: StockTone } {
  if (stock <= 0) return { label: "Sin stock", tone: "out" };
  if (stock < LOW_STOCK) return { label: `Últimas ${stock}`, tone: "low" };
  return { label: `${stock} disponibles`, tone: "in" };
}

export function hasPhoto(product: Product): product is ProductWithPhoto {
  return Boolean(product.imageUrl);
}
