import { useState } from "react";
import type { Product } from "../../types";
import { stockStatus } from "./productDisplay";
import "./ProductPlate.css";

/**
 * Foto del producto o, si no tiene o no carga, una placa con su inicial.
 * Los productos sin stock se ven apagados en cualquier lugar donde aparezcan.
 */
export function ProductPlate({
  product,
  variant,
}: {
  product: Pick<Product, "name" | "sku" | "imageUrl" | "stock">;
  variant: "card" | "page" | "thumb";
}) {
  const [failed, setFailed] = useState(false);
  const muted = stockStatus(product.stock).tone === "out";
  const base = `store-plate store-plate--${variant}${muted ? " store-plate--muted" : ""}`;

  if (product.imageUrl && !failed) {
    return (
      <div className={`${base} store-plate--photo`}>
        <img
          className="store-plate__img"
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
    <div className={base} aria-hidden="true">
      <span className="store-plate__monogram">
        {product.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="store-plate__sku">{product.sku}</span>
    </div>
  );
}
