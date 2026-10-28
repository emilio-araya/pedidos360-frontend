import { formatProductCount } from "./productDisplay";
import type { ProductWithPhoto } from "./productDisplay";
import "./Showcase.css";

export const SHOWCASE_SIZE = 3;

/**
 * Hoja de contactos del catálogo: las fotos reales presentadas como una
 * página impresa. Es decorativa; el contador real vive en la grilla.
 */
export function Showcase({
  products,
  loading,
  total,
}: {
  products: ProductWithPhoto[];
  loading: boolean;
  total: number;
}) {
  return (
    <div className="store-showcase" aria-hidden="true">
      <div className="store-showcase__stack">
        <span className="store-showcase__sheet" />
        <div className="store-showcase__card">
          <div className="store-showcase__grid">
            {loading
              ? Array.from({ length: SHOWCASE_SIZE }, (_, index) => (
                  <div className="store-showcase__ghost store-shimmer" key={index} />
                ))
              : products.map((product) => (
                  <div className="store-showcase__cell" key={product.id}>
                    <img src={product.imageUrl} alt="" decoding="async" />
                  </div>
                ))}
          </div>
          <div className="store-showcase__meta">
            {loading ? (
              <span className="store-showcase__meta-line store-shimmer" />
            ) : (
              <span>Catálogo · {formatProductCount(total)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
