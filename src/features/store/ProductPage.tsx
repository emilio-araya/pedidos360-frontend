import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Product } from "../../types";
import { useCart } from "./cart";
import { ChevronIcon } from "./icons";
import { PriceStock } from "./PriceStock";
import { ProductCard } from "./ProductCard";
import { ProductPlate } from "./ProductPlate";
import { QuantityStepper } from "./QuantityStepper";
import { StoreLayout } from "./StoreLayout";
import { useProduct, useRelatedProducts } from "./useProduct";
import type { ProductState } from "./useProduct";
import "./ProductPage.css";

const RELATED_PRODUCTS = 4;

/** Página pública de un producto, con URL propia para compartirla. */
export function ProductPage() {
  const { id = "" } = useParams();
  const { state, retry } = useProduct(id);

  return (
    <StoreLayout>
      <main className="store-product">
        <nav className="store-crumbs" aria-label="Ruta">
          <Link to="/">Catálogo</Link>
          <ChevronIcon />
          <span aria-current="page">
            {state.status === "ready" ? state.product.name : "Producto"}
          </span>
        </nav>

        <ProductContent state={state} onRetry={retry} />

        {state.status === "ready" ? (
          <RelatedProducts currentId={state.product.id} />
        ) : null}
      </main>
    </StoreLayout>
  );
}

function ProductContent({
  state,
  onRetry,
}: {
  state: ProductState;
  onRetry: () => void;
}) {
  switch (state.status) {
    case "loading":
      return (
        <div className="store-product__layout" aria-busy="true">
          <div className="store-product__ghost-plate store-shimmer" />
          <div className="store-buybox">
            <div className="store-product__ghost-line store-shimmer" />
            <div className="store-product__ghost-line store-product__ghost-line--short store-shimmer" />
          </div>
        </div>
      );
    case "not-found":
      return (
        <div className="store-product__missing">
          <h1>Este producto no está en el catálogo</h1>
          <p>Puede que lo hayan retirado o que el enlace esté incompleto.</p>
          <Link className="button" to="/">
            Volver al catálogo
          </Link>
        </div>
      );
    case "error":
      return (
        <div className="alert" role="alert">
          <span>{state.message}</span>
          <button type="button" className="nav-button" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      );
    case "ready":
      return <ProductDetail product={state.product} />;
  }
}

function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(0);
  const available = product.stock > 0;

  return (
    <div className="store-product__layout">
      <ProductPlate product={product} variant="page" />

      <section className="store-buybox" aria-labelledby="product-title">
        <h1 id="product-title">{product.name}</h1>
        <p className="store-buybox__sku">Código {product.sku}</p>
        {product.description ? (
          <p className="store-buybox__desc">{product.description}</p>
        ) : null}

        <div className="store-buybox__price">
          <PriceStock product={product} size="large" />
        </div>

        {available ? (
          <QuantityStepper
            value={quantity}
            max={product.stock}
            onChange={setQuantity}
          />
        ) : null}

        <div className="store-buybox__actions">
          <button
            type="button"
            className="button store-buybox__action"
            disabled={!available}
            onClick={() => {
              add(product, quantity);
              navigate("/checkout");
            }}
          >
            Comprar ahora
          </button>
          <button
            type="button"
            className="button button--secondary store-buybox__action"
            disabled={!available}
            onClick={() => {
              add(product, quantity);
              setAdded(quantity);
            }}
          >
            Agregar al carrito
          </button>
        </div>

        <p className="store-buybox__status" role="status">
          {added > 0 ? (
            <>
              Agregaste {added} al carrito. <Link to="/carrito">Ver carrito</Link>
            </>
          ) : null}
        </p>

        <p className="store-buybox__note">
          El pedido se registra sin pago en línea y queda pendiente de
          aceptación.
        </p>
      </section>
    </div>
  );
}

function RelatedProducts({ currentId }: { currentId: string }) {
  const products = useRelatedProducts(currentId, RELATED_PRODUCTS);
  if (products.length === 0) return null;

  return (
    <section className="store-related" aria-labelledby="related-title">
      <h2 id="related-title">Más del catálogo</h2>
      <div className="store-grid">
        {products.map((product, index) => (
          <ProductCard product={product} index={index} key={product.id} />
        ))}
      </div>
    </section>
  );
}
