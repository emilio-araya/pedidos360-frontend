import { Link } from "react-router-dom";
import type { Product } from "../../types";
import { PriceStock } from "./PriceStock";
import { ProductPlate } from "./ProductPlate";
import "./ProductCard.css";

export function ProductCard({
  product,
  index,
}: {
  product: Product;
  /** Posición en la grilla: escalona la animación de entrada. */
  index: number;
}) {
  return (
    <article className="store-card" style={{ "--i": index }}>
      <Link
        className="store-card__open"
        to={`/producto/${encodeURIComponent(product.id)}`}
        aria-label={`Ver ${product.name}`}
      />
      <ProductPlate product={product} variant="card" />
      <div className="store-card__body">
        <h3>{product.name}</h3>
        {product.description ? (
          <p className="store-card__desc">{product.description}</p>
        ) : null}
      </div>
      <div className="store-card__foot">
        <PriceStock product={product} />
      </div>
    </article>
  );
}

/** Tarjeta de carga con la misma silueta que la tarjeta real. */
export function ProductCardSkeleton() {
  return (
    <div className="store-card store-card--ghost">
      <div className="store-skeleton store-skeleton--banner store-shimmer" />
      <div className="store-skeleton store-skeleton--line store-shimmer" />
      <div className="store-skeleton store-skeleton--line store-skeleton--short store-shimmer" />
    </div>
  );
}
