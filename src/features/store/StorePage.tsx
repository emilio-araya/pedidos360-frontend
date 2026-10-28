import { useState } from "react";
import { CatalogShelf } from "./CatalogShelf";
import { hasPhoto } from "./productDisplay";
import { SHOWCASE_SIZE, Showcase } from "./Showcase";
import { StoreLayout } from "./StoreLayout";
import { lastKnownPage, useCatalogPage } from "./useCatalogPage";
import "./StorePage.css";

/**
 * Vitrina pública: se entra sin iniciar sesión y se recorre el catálogo.
 * La autenticación se pide recién al confirmar un pedido.
 */
export function StorePage() {
  const [page, setPage] = useState(0);
  const { state, retry } = useCatalogPage(page);

  const loading = state.status === "loading";
  const featured =
    state.status === "ready"
      ? state.page.content.filter(hasPhoto).slice(0, SHOWCASE_SIZE)
      : [];
  const showShowcase = loading || featured.length > 0;

  return (
    <StoreLayout>
      <section className="store-hero">
        <div
          className={`store-hero__inner${showShowcase ? "" : " store-hero__inner--solo"}`}
        >
          <div>
            <h1>
              Mira primero.
              <br />
              <span>Después decides.</span>
            </h1>
            <p className="store-hero__lead">
              El catálogo es abierto: puedes recorrer los productos y armar tu
              carrito sin crear una cuenta. Solo al confirmar el pedido te
              pedimos iniciar sesión.
            </p>
            <div className="store-hero__actions">
              <a className="button store-hero__cta" href="#catalogo">
                Ver catálogo
              </a>
            </div>
          </div>
          {showShowcase ? (
            <Showcase
              products={featured}
              loading={loading}
              total={lastKnownPage(state)?.totalElements ?? 0}
            />
          ) : null}
        </div>
      </section>

      <CatalogShelf
        state={state}
        page={page}
        onPageChange={setPage}
        onRetry={retry}
      />
    </StoreLayout>
  );
}
