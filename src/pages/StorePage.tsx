import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { createPublicCatalogService } from "../api/services";
import type { Page } from "../api/services";
import type { Product } from "../types";
import { useAuth } from "../auth/AuthContext";

const PAGE_SIZE = 12;
const SKELETON_CARDS = 6;
const catalog = createPublicCatalogService();

const priceFormat = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function stockLabel(stock: number): string {
  if (stock <= 0) return "Sin stock";
  if (stock < 5) return `Últimas ${stock}`;
  return `${stock} disponibles`;
}

function stockTone(stock: number): string {
  if (stock <= 0) return "store-stock--out";
  if (stock < 5) return "store-stock--low";
  return "store-stock--in";
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
      setData(await catalog.list({ page: target, size: PAGE_SIZE }));
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

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="topbar__inner">
          <span className="brand">
            <span className="brand__mark" aria-hidden="true">
              P
            </span>
            <span>
              Pedidos<b>360</b>
            </span>
          </span>
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
        <div className="store-hero__inner">
          <h1>
            Mira primero.
            <br />
            Después decides.
          </h1>
          <p className="store-hero__lead">
            El catálogo es abierto: puedes recorrer los productos sin crear una
            cuenta. Solo al crear un pedido te pedimos iniciar sesión.
          </p>
          <button
            type="button"
            className="button store-hero__cta"
            onClick={() => void startOrder()}
          >
            Crear pedido
          </button>
        </div>
      </section>

      <main className="store-main">
        <section className="store-shelf">
          <header className="store-shelf__head">
            <h2>Catálogo</h2>
            {data ? (
              <span className="store-count">
                {totalElements}{" "}
                {totalElements === 1 ? "producto" : "productos"}
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
                <div
                  className="store-card store-card--ghost"
                  key={`skeleton-${index}`}
                >
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
                <article className="store-card" key={product.id}>
                  <ProductPlate product={product} />
                  <div className="store-card__body">
                    <h3>{product.name}</h3>
                    {product.description ? (
                      <p className="store-card__desc">{product.description}</p>
                    ) : null}
                  </div>
                  <div className="store-card__foot">
                    <span className="store-price">
                      {priceFormat.format(product.price)}
                    </span>
                    <span className={`store-stock ${stockTone(product.stock)}`}>
                      {stockLabel(product.stock)}
                    </span>
                  </div>
                </article>
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
        </section>
      </main>
    </div>
  );
}
