import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { listProducts } from "../../api/services";
import type { Page } from "../../api/services";
import type { Product } from "../../types";

const PAGE_SIZE = 12;

/**
 * Un solo estado a la vez: el catálogo está cargando, falló o está listo.
 * Mientras carga otra página, `last` conserva la anterior para que el
 * paginador y el contador no salten; la grilla muestra tarjetas de carga.
 */
export type CatalogState =
  | { status: "loading"; last: Page<Product> | null }
  | { status: "error"; message: string }
  | { status: "ready"; page: Page<Product> };

export function lastKnownPage(state: CatalogState): Page<Product> | null {
  if (state.status === "ready") return state.page;
  if (state.status === "loading") return state.last;
  return null;
}

/**
 * Carga una página del catálogo público. Si la respuesta llega después de que
 * el visitante cambió de página (o reintentó) se descarta: gana el último pedido.
 */
export function useCatalogPage(pageIndex: number) {
  const [state, setState] = useState<CatalogState>({
    status: "loading",
    last: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setState((previous) => ({ status: "loading", last: lastKnownPage(previous) }));

    listProducts({ page: pageIndex, size: PAGE_SIZE }, null).then(
      (page) => {
        if (current) setState({ status: "ready", page });
      },
      (cause: unknown) => {
        if (!current) return;
        setState({
          status: "error",
          message:
            cause instanceof ApiError
              ? cause.message
              : "No fue posible cargar el catálogo.",
        });
      },
    );

    return () => {
      current = false;
    };
  }, [pageIndex, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { state, retry };
}
