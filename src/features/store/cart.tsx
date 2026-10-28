import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Product } from "../../types";

export const CART_STORAGE_KEY = "pedidos360.cart";

/**
 * Línea del carrito: copia de lo que el visitante vio al agregar el producto.
 * El stock guardado sólo limita las cantidades; el backend decide al crear
 * el pedido.
 */
export interface CartLine {
  productId: string;
  sku: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
}

function clamp(quantity: number, stock: number): number {
  return Math.min(Math.max(1, Math.floor(quantity)), stock);
}

export function addToCart(
  lines: CartLine[],
  product: Product,
  quantity: number,
): CartLine[] {
  if (product.stock <= 0) return lines;
  const existing = lines.find((line) => line.productId === product.id);
  if (existing) {
    return lines.map((line) =>
      line.productId === product.id
        ? { ...line, quantity: clamp(line.quantity + quantity, product.stock), stock: product.stock }
        : line,
    );
  }
  return [
    ...lines,
    {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
      quantity: clamp(quantity, product.stock),
    },
  ];
}

export function setLineQuantity(
  lines: CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  return lines.map((line) =>
    line.productId === productId
      ? { ...line, quantity: clamp(quantity, line.stock) }
      : line,
  );
}

export function removeFromCart(lines: CartLine[], productId: string): CartLine[] {
  return lines.filter((line) => line.productId !== productId);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

/** Lo guardado puede estar dañado o ser de otra versión: ante la duda, vacío. */
function readStoredCart(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(
      sessionStorage.getItem(CART_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  add: (product: Product, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Carrito de la pestaña: sobrevive a la ida y vuelta del inicio de sesión,
 * pero no a cerrar el navegador.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readStoredCart);

  useEffect(() => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const add = useCallback((product: Product, quantity: number) => {
    setLines((current) => addToCart(current, product, quantity));
  }, []);
  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) => setLineQuantity(current, productId, quantity));
  }, []);
  const remove = useCallback((productId: string) => {
    setLines((current) => removeFromCart(current, productId));
  }, []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({
      lines,
      count: cartCount(lines),
      total: cartTotal(lines),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart debe usarse dentro de CartProvider.");
  return value;
}
