import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import { createOrdersService } from "../../api/services";
import { useAuth } from "../../auth/AuthContext";
import { useCart } from "./cart";
import { OrderLedger } from "./OrderLedger";
import { formatProductCount } from "./productDisplay";
import { ProductPlate } from "./ProductPlate";
import { StoreLayout } from "./StoreLayout";
import "./CheckoutPage.css";

/**
 * Resumen previo a confirmar. La sesión se pide acá, no antes: el visitante
 * arma el carrito sin cuenta y sólo se identifica para registrar el pedido.
 */
export function CheckoutPage() {
  const { lines, count, total, clear } = useCart();
  const { isAuthenticated, isLoading, login, getAccessToken, oid, isClient, canManageOrders } =
    useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ordersService = useMemo(
    () => createOrdersService(getAccessToken, { canManageOrders, isClient, oid }),
    [canManageOrders, getAccessToken, isClient, oid],
  );

  async function confirm() {
    setSending(true);
    setError(null);
    try {
      const order = await ordersService.create({
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
        notes: notes.trim() || undefined,
      });
      clear();
      navigate(`/pedido/${order.id}`, { state: { order } });
    } catch (cause) {
      setError(describeFailure(cause));
      setSending(false);
    }
  }

  return (
    <StoreLayout>
      <main className="store-checkout">
        <header className="store-page-head">
          <h1>Revisa tu pedido</h1>
          {count > 0 ? (
            <span className="store-count">{formatProductCount(count)}</span>
          ) : null}
        </header>

        {lines.length === 0 ? (
          <div className="store-checkout__empty">
            <p className="store-checkout__empty-title">Tu carrito está vacío</p>
            <p>Agrega un producto para poder registrar un pedido.</p>
            <Link className="button" to="/">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="store-checkout__layout">
            <section className="store-checkout__items" aria-label="Productos del pedido">
              <ul className="store-checkout__lines">
                {lines.map((line) => (
                  <li className="store-checkout__line" key={line.productId}>
                    <ProductPlate product={line} variant="thumb" />
                    <div className="store-checkout__line-info">
                      <span className="store-checkout__line-name">{line.name}</span>
                      <span className="store-checkout__line-unit">
                        {line.quantity} × {formatMoney(line.price)}
                      </span>
                    </div>
                    <span className="store-checkout__line-subtotal">
                      {formatMoney(line.price * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {isAuthenticated ? (
                <>
                  <label className="store-checkout__notes" htmlFor="order-notes">
                    Notas para el pedido (opcional)
                  </label>
                  <textarea
                    id="order-notes"
                    className="store-checkout__notes-input"
                    maxLength={1000}
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Horario de entrega, referencias, indicaciones…"
                  />
                  <span className="store-checkout__note">{notes.length} de 1000</span>
                </>
              ) : (
                <p className="store-checkout__note">
                  Podrás dejar notas para el pedido cuando inicies sesión.
                </p>
              )}
            </section>

            <aside className="store-summary" aria-labelledby="checkout-summary">
              <h2 id="checkout-summary">Resumen</h2>
              <OrderLedger
                items={lines.map((line) => ({
                  key: line.productId,
                  label: `${line.name} × ${line.quantity}`,
                  amount: line.price * line.quantity,
                }))}
                total={total}
              />

              {isLoading ? (
                <p className="store-checkout__note">Validando sesión…</p>
              ) : isAuthenticated ? (
                <button
                  type="button"
                  className="button store-summary__cta"
                  disabled={sending}
                  onClick={() => void confirm()}
                >
                  {sending ? "Registrando pedido…" : "Confirmar pedido"}
                </button>
              ) : (
                <>
                  <h3 className="store-summary__signin-title">
                    Inicia sesión para confirmar
                  </h3>
                  <p className="store-summary__note">
                    Tu carrito queda guardado en esta pestaña y vuelves justo
                    acá. Necesitas una cuenta de la organización con el rol
                    Cliente.
                  </p>
                  <button
                    type="button"
                    className="button store-summary__cta"
                    onClick={() => void login("/checkout")}
                  >
                    Iniciar sesión para confirmar
                  </button>
                </>
              )}

              {error ? (
                <p className="store-checkout__error" role="alert">
                  {error}
                </p>
              ) : null}
              <p className="store-summary__note">
                El pedido se registra sin cobro en línea y queda pendiente de
                aceptación. <Link to="/carrito">Volver al carrito</Link>
              </p>
            </aside>
          </div>
        )}
      </main>
    </StoreLayout>
  );
}

function describeFailure(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.status === 403) {
      return "Tu cuenta no tiene un rol habilitado para registrar pedidos. Pide a un administrador que te asigne el rol Cliente.";
    }
    return cause.message;
  }
  return "No fue posible registrar el pedido. Intenta de nuevo.";
}

/** Importes del resumen; el total lo dibuja `OrderLedger`. */
function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}
