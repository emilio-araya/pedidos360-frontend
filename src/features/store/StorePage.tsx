import { useState } from "react";
import { CatalogShelf } from "./CatalogShelf";
import { hasPhoto } from "./productDisplay";
import { SHOWCASE_SIZE, Showcase } from "./Showcase";
import { StoreLayout } from "./StoreLayout";
import { lastKnownPage, useCatalogPage } from "./useCatalogPage";
import "./StorePage.css";

/** Hechos del catálogo que la etiqueta declara sin adornos. */
const TAG_FACTS = [
  { label: "Catálogo", value: "abierto" },
  { label: "Cuenta", value: "al registrar" },
  { label: "Envío", value: "no" },
  { label: "Reseñas", value: "no" },
] as const;

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
        <div className="store-hero__inner">
          <div className="store-hero__copy">
            <p className="eyebrow">Catálogo abierto</p>
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

          <aside className="store-tag" aria-label="Etiqueta del catálogo">
            <div className="store-tag__bar">
              <span>P360</span>
              <span>Etiqueta 01</span>
            </div>
            {showShowcase ? (
              <Showcase
                products={featured}
                loading={loading}
                total={lastKnownPage(state)?.totalElements ?? 0}
              />
            ) : null}
            <dl className="store-tag__facts">
              {TAG_FACTS.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
            <div className="store-tag__code" aria-hidden="true" />
          </aside>
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
