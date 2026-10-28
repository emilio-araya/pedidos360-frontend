import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Product } from "../../types";
import {
  CART_STORAGE_KEY,
  CartProvider,
  addToCart,
  cartCount,
  cartTotal,
  removeFromCart,
  setLineQuantity,
  useCart,
} from "./cart";

const product = (overrides: Partial<Product> = {}): Product => ({
  id: "p1",
  sku: "P-001",
  name: "Mouse inalámbrico",
  description: null,
  price: 19990,
  stock: 5,
  active: true,
  imageUrl: "/img/mouse.jpg",
  ...overrides,
});

describe("carrito", () => {
  it("agrega un producto y suma las cantidades si se repite", () => {
    const once = addToCart([], product(), 2);
    const twice = addToCart(once, product(), 1);

    expect(twice).toHaveLength(1);
    expect(twice[0]).toMatchObject({ productId: "p1", quantity: 3 });
  });

  it("no deja superar el stock al agregar ni al cambiar la cantidad", () => {
    const lines = addToCart([], product({ stock: 3 }), 5);
    expect(lines[0].quantity).toBe(3);

    expect(setLineQuantity(lines, "p1", 9)[0].quantity).toBe(3);
    expect(setLineQuantity(lines, "p1", 0)[0].quantity).toBe(1);
  });

  it("no agrega productos sin stock", () => {
    expect(addToCart([], product({ stock: 0 }), 1)).toEqual([]);
  });

  it("quita líneas y calcula unidades y total", () => {
    let lines = addToCart([], product(), 2);
    lines = addToCart(lines, product({ id: "p2", price: 5000, stock: 10 }), 3);

    expect(cartCount(lines)).toBe(5);
    expect(cartTotal(lines)).toBe(2 * 19990 + 3 * 5000);

    lines = removeFromCart(lines, "p1");
    expect(lines.map((line) => line.productId)).toEqual(["p2"]);
  });
});

describe("CartProvider", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  beforeEach(() => sessionStorage.clear());

  it("guarda el carrito en la pestaña y lo recupera al volver", () => {
    const first = renderHook(() => useCart(), { wrapper });
    act(() => first.result.current.add(product(), 2));
    first.unmount();

    const second = renderHook(() => useCart(), { wrapper });
    expect(second.result.current.count).toBe(2);
    expect(second.result.current.lines[0].name).toBe("Mouse inalámbrico");
  });

  it("empieza vacío si lo guardado está dañado", () => {
    sessionStorage.setItem(CART_STORAGE_KEY, "{no es json");

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.lines).toEqual([]);
  });

  it("vacía el carrito", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.add(product(), 1));
    act(() => result.current.clear());

    expect(result.current.count).toBe(0);
    expect(sessionStorage.getItem(CART_STORAGE_KEY)).toBe("[]");
  });
});
