import type { Product } from "../../types";
import { formatPrice, stockStatus } from "./productDisplay";
import "./PriceStock.css";

/** Precio y etiqueta de stock; el padre decide cómo se ubican. */
export function PriceStock({
  product,
  size = "regular",
}: {
  product: Product;
  size?: "regular" | "large";
}) {
  const stock = stockStatus(product.stock);
  return (
    <>
      <span className={`store-price store-price--${size}`}>
        {formatPrice(product.price)}
      </span>
      <span className={`store-stock store-stock--${stock.tone}`}>
        {stock.label}
      </span>
    </>
  );
}
