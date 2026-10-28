import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { formatProductCount } from "./productDisplay";
import { lastKnownPage } from "./useCatalogPage";
import type { CatalogState } from "./useCatalogPage";
import "./CatalogShelf.css";

const SKELETON_CARDS = 6;

/** Sección del catálogo: encabezado, contenido según el estado y paginador. */
export function CatalogShelf({
  state,
  page,
  onPageChange,
  onRetry,
}: {
  state: CatalogState;
  page: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}) {
  const known = lastKnownPage(state);
  const totalPages = known?.totalPages ?? 0;

  return (
    <main className="store-main" id="catalogo">
      <header className="store-shelf__head">
        <h2>Catálogo</h2>
        {known ? (
          <span className="store-count">
            {formatProductCount(known.totalElements)}
          </span>
        ) : null}
      </header>

      <ShelfContent state={state} onRetry={onRetry} />

      {totalPages > 1 ? (
        <nav className="store-pager" aria-label="Paginación del catálogo">
          <button
            type="button"
            className="button button--ghost button--small"
            disabled={page === 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
          >
            Anterior
          </button>
          <span className="store-pager__pos">
            Página <strong>{page + 1}</strong> de {totalPages}
          </span>
          <button
            type="button"
            className="button button--ghost button--small"
            disabled={page + 1 >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
          </button>
        </nav>
      ) : null}
    </main>
  );
}

function ShelfContent({
  state,
  onRetry,
}: {
  state: CatalogState;
  onRetry: () => void;
}) {
  switch (state.status) {
    case "error":
      return (
        <div className="alert" role="alert">
          <span>{state.message}</span>
          <button type="button" className="nav-button" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      );
    case "loading":
      return (
        <div className="store-grid" aria-busy="true" aria-live="polite">
          {Array.from({ length: SKELETON_CARDS }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      );
    case "ready":
      if (state.page.content.length === 0) {
        return (
          <div className="empty-state store-empty">
            <strong>Todavía no hay productos publicados</strong>
            <p>Vuelve en unos minutos o consulta con el equipo de la tienda.</p>
          </div>
        );
      }
      return (
        <div className="store-grid">
          {state.page.content.map((product, index) => (
            <ProductCard product={product} index={index} key={product.id} />
          ))}
        </div>
      );
  }
}
