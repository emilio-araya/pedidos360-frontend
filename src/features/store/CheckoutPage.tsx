import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import { createGuestOrder } from "../../api/guestOrders";
import { useCart } from "./cart";
import { validateEmail } from "./guestEmail";
import { OrderLedger } from "./OrderLedger";
import { formatProductCount } from "./productDisplay";
import { ProductPlate } from "./ProductPlate";
import { StoreLayout } from "./StoreLayout";
import "./CheckoutPage.css";

const NOTES_MAX = 1000;
const RETRY_MESSAGE =
  "No pudimos registrar tu pedido. Revisa tu conexión e intenta de nuevo.";

interface FieldMessages {
  email?: string;
  notes?: string;
}

/**
 * Resumen previo a confirmar. Se compra como invitado: no se pide sesión,
 * sólo un correo para enviar el comprobante con el enlace de seguimiento.
 */
export function CheckoutPage() {
  const { lines, count, total, clear } = useCart();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [fields, setFields] = useState<FieldMessages>({});
  const [error, setError] = useState<string | null>(null);

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const emailError = validateEmail(email);
    setError(null);
    if (emailError) {
      setFields({ email: emailError });
      emailRef.current?.focus();
      return;
    }
    setFields({});
    setSending(true);
    try {
      const order = await createGuestOrder({
        email: email.trim(),
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
        notes: notes.trim() || undefined,
      });
      clear();
      navigate(`/seguimiento/${order.trackingToken}`, {
        state: { order, justCreated: true },
      });
    } catch (cause) {
      const failure = describeFailure(cause);
      setFields(failure.fields);
      setError(failure.message);
      if (failure.fields.email) emailRef.current?.focus();
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
          <form
            className="store-checkout__layout"
            noValidate
            onSubmit={(event) => void confirm(event)}
          >
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

              <label className="store-checkout__notes" htmlFor="order-email">
                Correo electrónico
              </label>
              <input
                ref={emailRef}
                id="order-email"
                className="store-checkout__notes-input"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                maxLength={254}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nombre@dominio.cl"
                aria-invalid={fields.email ? true : undefined}
                aria-describedby={fields.email ? "order-email-error" : "order-email-hint"}
              />
              {fields.email ? (
                <span id="order-email-error" className="store-checkout__field-error">
                  {fields.email}
                </span>
              ) : (
                <span id="order-email-hint" className="store-checkout__note">
                  Sólo lo usamos para enviarte el comprobante y el enlace para
                  seguir o cancelar tu pedido.
                </span>
              )}

              <label className="store-checkout__notes" htmlFor="order-notes">
                Notas para el pedido (opcional)
              </label>
              <textarea
                id="order-notes"
                className="store-checkout__notes-input"
                maxLength={NOTES_MAX}
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Horario de entrega, referencias, indicaciones…"
                aria-invalid={fields.notes ? true : undefined}
                aria-describedby={fields.notes ? "order-notes-error" : undefined}
              />
              {fields.notes ? (
                <span id="order-notes-error" className="store-checkout__field-error">
                  {fields.notes}
                </span>
              ) : (
                <span className="store-checkout__note store-checkout__counter">
                  {notes.length} de {NOTES_MAX}
                </span>
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

              <button
                type="submit"
                className="button store-summary__cta"
                disabled={sending}
              >
                {sending ? "Registrando pedido…" : "Confirmar pedido"}
              </button>

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
          </form>
        )}
      </main>
    </StoreLayout>
  );
}

interface Failure {
  message: string | null;
  fields: FieldMessages;
}

/**
 * Un `400` se reparte por campo; un `409` explica el problema del pedido
 * (por ejemplo, falta de stock). El resto se trata como falla transitoria.
 */
function describeFailure(cause: unknown): Failure {
  if (!(cause instanceof ApiError)) return { message: RETRY_MESSAGE, fields: {} };
  if (cause.status === 400) {
    const fields: FieldMessages = {};
    const others: string[] = [];
    for (const { field, message } of cause.fieldErrors) {
      if (field === "email" || field === "notes") fields[field] ??= message;
      else others.push(message);
    }
    const hasFields = Object.keys(fields).length > 0;
    return {
      message: others.length > 0 ? others.join(" ") : hasFields ? null : cause.message,
      fields,
    };
  }
  if (cause.status === 409) return { message: cause.message, fields: {} };
  return { message: RETRY_MESSAGE, fields: {} };
}

/** Importes del resumen; el total lo dibuja `OrderLedger`. */
function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}
