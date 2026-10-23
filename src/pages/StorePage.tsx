import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { listProducts } from "../api/services";
import type { Page } from "../api/services";
import { useAuth } from "../auth/AuthContext";
import { Brand } from "../components/Brand";
import type { Product } from "../types";
import "./StorePage.css";

const PAGE_SIZE = 12;
const SKELETON_CARDS = 6;
const SHOWCASE_SIZE = 3;
const LOW_STOCK = 5;

const priceFormat = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

type StockTone = "in" | "low" | "out";

function stockStatus(stock: number): { label: string; tone: StockTone } {
  if (stock <= 0) return { label: "Sin stock", tone: "out" };
  if (stock < LOW_STOCK) return { label: `Últimas ${stock}`, tone: "low" };
  return { label: `${stock} disponibles`, tone: "in" };
}

/**
 * Vitrina pública: se entra sin iniciar sesión y se recorre el catálogo.
 * La autenticación se pide recién al crear un pedido.
 */
export function StorePage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<Product> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (target: number) => {
    setLoading(true);
    setError("");
    try {
      setData(await listProducts({ page: target, size: PAGE_SIZE }, null));
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "No fue posible cargar el catálogo.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  async function startOrder() {
    if (!isAuthenticated) {
      await login();
      return;
    }
    navigate("/orders");
  }

  const products = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const featured = products
    .filter((product) => product.imageUrl)
    .slice(0, SHOWCASE_SIZE);
  const showShowcase = loading || featured.length > 0;

  return (
    <div className="app-frame store">
      <header className="topbar">
        <div className="topbar__inner">
          <Brand to="/" />
          <nav className="store-nav" aria-label="Sesión">
            {isLoading ? null : isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="nav-button"
                  onClick={() => navigate("/orders")}
                >
                  Mis pedidos
                </button>
                <button
                  type="button"
                  className="button button--secondary button--small"
                  onClick={() => navigate("/dashboard")}
                >
                  Mi cuenta
                </button>
              </>
            ) : (
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => void login()}
              >
                Iniciar sesión
              </button>
            )}
          </nav>
        </div>
      </header>

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
              El catálogo es abierto: puedes recorrer los productos sin crear
              una cuenta. Solo al crear un pedido te pedimos iniciar sesión.
            </p>
            <div className="store-hero__actions">
              <button
                type="button"
                className="button store-hero__cta"
                onClick={() => void startOrder()}
              >
                Crear pedido
              </button>
              <a className="store-hero__link" href="#catalogo">
                Ver catálogo
              </a>
            </div>
          </div>
          {showShowcase ? (
            <Showcase products={featured} loading={loading} />
          ) : null}
        </div>
      </section>

      <main className="store-main" id="catalogo">
        <header className="store-shelf__head">
          <h2>Catálogo</h2>
          {data ? (
            <span className="store-count">
              {totalElements} {totalElements === 1 ? "producto" : "productos"}
            </span>
          ) : null}
        </header>

        {error ? (
          <div className="alert" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="nav-button"
              onClick={() => void load(page)}
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="store-grid" aria-busy="true" aria-live="polite">
            {Array.from({ length: SKELETON_CARDS }).map((_, index) => (
              <div className="store-card store-card--ghost" key={index}>
                <div className="store-skeleton store-skeleton--banner" />
                <div className="store-skeleton store-skeleton--line" />
                <div className="store-skeleton store-skeleton--line store-skeleton--short" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state store-empty">
            <strong>Todavía no hay productos publicados</strong>
            <p>Vuelve en unos minutos o consulta con el equipo de la tienda.</p>
          </div>
        ) : (
          <div className="store-grid">
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav className="store-pager" aria-label="Paginación del catálogo">
            <button
              type="button"
              className="button button--ghost button--small"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
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
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </button>
          </nav>
        ) : null}
      </main>

      <footer className="store-footer">
        <div className="store-footer__inner">
          <span>Pedidos360 · Catálogo público</span>
          <span>
            Fotografías:{" "}
            <a
              href="https://commons.wikimedia.org"
              target="_blank"
              rel="noreferrer"
            >
              Wikimedia Commons
            </a>
            , dominio público y CC0.
          </span>
        </div>
      </footer>
    </div>
  );
}

/**
 * Abanico de fotos reales en el héroe. Es decorativo: la misma información
 * está en la grilla, por eso las imágenes no se anuncian (alt vacío).
 */
function Showcase({
  products,
  loading,
}: {
  products: Product[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="store-showcase" data-count={SHOWCASE_SIZE} aria-hidden="true">
        {Array.from({ length: SHOWCASE_SIZE }).map((_, index) => (
          <div className="store-showcase__tile store-showcase__tile--ghost" key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="store-showcase" data-count={products.length} aria-hidden="true">
      {products.map((product) => (
        <figure className="store-showcase__tile" key={product.id}>
          <div className="store-showcase__photo">
            <img src={product.imageUrl ?? undefined} alt="" decoding="async" />
          </div>
          <figcaption className="store-showcase__caption">
            <strong>{product.name}</strong>
            <span>{priceFormat.format(product.price)}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const stock = stockStatus(product.stock);
  return (
    <article className="store-card" data-stock={stock.tone}>
      <ProductPlate product={product} />
      <div className="store-card__body">
        <h3>{product.name}</h3>
        {product.description ? (
          <p className="store-card__desc">{product.description}</p>
        ) : null}
      </div>
      <div className="store-card__foot">
        <span className="store-price">{priceFormat.format(product.price)}</span>
        <span className={`store-stock store-stock--${stock.tone}`}>
          {stock.label}
        </span>
      </div>
    </article>
  );
}

/**
 * Foto del producto o, si no tiene o no carga, una placa con su inicial.
 */
function ProductPlate({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);

  if (product.imageUrl && !failed) {
    return (
      <div className="store-card__plate store-card__plate--photo">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="store-card__plate" aria-hidden="true">
      <span className="store-monogram">
        {product.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="store-sku">{product.sku}</span>
    </div>
  );
}
