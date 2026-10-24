import { useId } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useCart } from "./cart";
import type { CartLine } from "./cart";
import { TrashIcon } from "./icons";
import { OrderLedger } from "./OrderLedger";
import { formatPrice, formatProductCount } from "./productDisplay";
import { ProductPlate } from "./ProductPlate";
import { QuantityStepper } from "./QuantityStepper";
import { StoreLayout } from "./StoreLayout";
import "./CartPage.css";

export function CartPage() {
  const { lines, count, total, setQuantity, remove } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <StoreLayout>
      <main className="store-cart">
        <header className="store-page-head">
          <h1>Carrito</h1>
          {count > 0 ? (
            <span className="store-count">{formatProductCount(count)}</span>
          ) : null}
        </header>

        {lines.length === 0 ? (
          <div className="store-cart__empty">
            <p className="store-cart__empty-title">Tu carrito está vacío</p>
            <p>Recorre el catálogo y agrega lo que quieras pedir.</p>
            <Link className="button" to="/">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="store-cart__layout">
            <ul className="store-cart__lines">
              {lines.map((line) => (
                <CartLineItem
                  key={line.productId}
                  line={line}
                  onQuantity={setQuantity}
                  onRemove={remove}
                />
              ))}
            </ul>

            <aside className="store-summary" aria-labelledby="summary-title">
              <h2 id="summary-title">Resumen</h2>
              <OrderLedger
                items={lines.map((line) => ({
                  key: line.productId,
                  label: `${line.name} × ${line.quantity}`,
                  amount: line.price * line.quantity,
                }))}
                total={total}
              />
              <Link className="button store-summary__cta" to="/checkout">
                Continuar con el pedido
              </Link>
              <p className="store-summary__note">
                {isAuthenticated
                  ? "Vas a revisar el pedido antes de confirmarlo."
                  : "Para confirmar te pediremos iniciar sesión con tu cuenta de la organización."}
              </p>
            </aside>
          </div>
        )}
      </main>
    </StoreLayout>
  );
}

function CartLineItem({
  line,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  onQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  const nameId = useId();

  return (
    <li className="store-line" aria-labelledby={nameId}>
      <ProductPlate product={line} variant="thumb" />
      <div className="store-line__info">
        <Link id={nameId} to={`/producto/${encodeURIComponent(line.productId)}`}>
          {line.name}
        </Link>
        <span className="store-line__unit">{formatPrice(line.price)} c/u</span>
      </div>
      <QuantityStepper
        compact
        value={line.quantity}
        max={line.stock}
        onChange={(quantity) => onQuantity(line.productId, quantity)}
      />
      <span className="store-line__subtotal" data-testid="subtotal">
        {formatPrice(line.price * line.quantity)}
      </span>
      <button
        type="button"
        className="store-line__remove"
        aria-label={`Quitar ${line.name} del carrito`}
        onClick={() => onRemove(line.productId)}
      >
        <TrashIcon />
      </button>
    </li>
  );
}
