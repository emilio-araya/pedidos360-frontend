import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getProduct, listProducts } from "../../api/services";
import type { Product } from "../../types";

export type ProductState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; product: Product };

/**
 * Carga un producto público. Un producto inexistente o despublicado se
 * informa como "no encontrado"; una respuesta vieja se descarta.
 */
export function useProduct(id: string) {
  const [state, setState] = useState<ProductState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setState({ status: "loading" });

    getProduct(id, null).then(
      (product) => {
        if (!current) return;
        setState(
          product.active ? { status: "ready", product } : { status: "not-found" },
        );
      },
      (cause: unknown) => {
        if (!current) return;
        if (cause instanceof ApiError && cause.status === 404) {
          setState({ status: "not-found" });
          return;
        }
        setState({
          status: "error",
          message:
            cause instanceof ApiError
              ? cause.message
              : "No fue posible cargar el producto.",
        });
      },
    );

    return () => {
      current = false;
    };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  return { state, retry };
}

/**
 * Otros productos del catálogo para seguir mirando. Es contenido secundario:
 * si falla, la sección simplemente no aparece.
 */
export function useRelatedProducts(excludeId: string, limit: number): Product[] {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let current = true;
    listProducts({ page: 0, size: limit + 1 }, null).then(
      (page) => {
        if (!current) return;
        setProducts(
          page.content
            .filter((product) => product.id !== excludeId && product.active)
            .slice(0, limit),
        );
      },
      () => {
        if (current) setProducts([]);
      },
    );
    return () => {
      current = false;
    };
  }, [excludeId, limit]);

  return products;
}
