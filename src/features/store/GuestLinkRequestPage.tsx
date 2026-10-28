import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../api/client";
import { requestGuestLink } from "../../api/guestOrders";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { EMAIL_MAX, validateEmail } from "./guestEmail";
import { StoreLayout } from "./StoreLayout";
import "./CheckoutPage.css";
import "./GuestTrackingPage.css";

const NEUTRAL_MESSAGE =
  "Si los datos coinciden, te enviaremos un enlace nuevo al correo.";

interface FieldMessages {
  email?: string;
  orderNumber?: string;
}

/**
 * Reenvío del enlace de seguimiento. La respuesta es siempre la misma para no
 * revelar qué correos compraron; el enlace anterior deja de funcionar.
 */
export function GuestLinkRequestPage() {
  useDocumentTitle("Recuperar el enlace de tu pedido");
  const emailRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [fields, setFields] = useState<FieldMessages>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const next: FieldMessages = {
      email:
        validateEmail(email, "Ingresa el correo con el que hiciste el pedido.") ??
        undefined,
      orderNumber: orderNumber.trim() ? undefined : "Ingresa el número de pedido.",
    };
    setError(null);
    setFields(next);
    if (next.email || next.orderNumber) {
      (next.email ? emailRef : numberRef).current?.focus();
      return;
    }
    setSending(true);
    try {
      await requestGuestLink({ email: email.trim(), orderNumber: orderNumber.trim() });
      setSent(true);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 400) {
        const fromServer: FieldMessages = {};
        for (const { field, message } of cause.fieldErrors)
          if (field === "email" || field === "orderNumber") fromServer[field] ??= message;
        setFields(fromServer);
        if (Object.keys(fromServer).length === 0) setError(cause.message);
      } else {
        setError("No pudimos enviar la solicitud. Intenta de nuevo en unos minutos.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <StoreLayout>
      <main className="store-checkout store-tracking">
        <header className="store-page-head">
          <h1>Recupera el enlace de tu pedido</h1>
        </header>
        <p className="store-link-request__intro">
          Escribe el correo que usaste al comprar y el número de pedido del
          comprobante. Te enviaremos un enlace nuevo; el anterior dejará de
          funcionar.
        </p>

        {sent ? (
          <div className="store-link-request">
            <p className="store-link-request__done" role="status">
              {NEUTRAL_MESSAGE}
            </p>
            <Link className="store-confirm__back" to="/">
              Volver al catálogo
            </Link>
          </div>
        ) : (
          <form className="store-link-request" noValidate onSubmit={(event) => void submit(event)}>
            <label className="store-checkout__notes" htmlFor="link-email">
              Correo electrónico
            </label>
            <input
              ref={emailRef}
              id="link-email"
              className="store-checkout__notes-input"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              maxLength={EMAIL_MAX}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@dominio.cl"
              aria-invalid={fields.email ? true : undefined}
              aria-describedby={fields.email ? "link-email-error" : undefined}
            />
            {fields.email ? (
              <span id="link-email-error" className="store-checkout__field-error">
                {fields.email}
              </span>
            ) : null}

            <label className="store-checkout__notes" htmlFor="link-order-number">
              Número de pedido
            </label>
            <input
              ref={numberRef}
              id="link-order-number"
              className="store-checkout__notes-input"
              name="orderNumber"
              autoComplete="off"
              spellCheck={false}
              required
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="Por ejemplo, PED-1A2B3C4D"
              aria-invalid={fields.orderNumber ? true : undefined}
              aria-describedby={fields.orderNumber ? "link-order-number-error" : undefined}
            />
            {fields.orderNumber ? (
              <span id="link-order-number-error" className="store-checkout__field-error">
                {fields.orderNumber}
              </span>
            ) : null}

            <button type="submit" className="button" disabled={sending}>
              {sending ? "Enviando…" : "Enviar enlace nuevo"}
            </button>
            {error ? (
              <p className="store-checkout__error" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        )}
      </main>
    </StoreLayout>
  );
}
