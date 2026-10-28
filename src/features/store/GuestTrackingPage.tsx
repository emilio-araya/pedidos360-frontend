import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import {
  cancelGuestOrder,
  getGuestOrder,
  isTrackingToken,
} from "../../api/guestOrders";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { statusLabel } from "../../types";
import type { GuestOrder } from "../../types";
import { OrderLedger } from "./OrderLedger";
import { formatPrice } from "./productDisplay";
import { StoreLayout } from "./StoreLayout";
import "./CheckoutPage.css";
import "./GuestTrackingPage.css";

interface TrackingState {
  order?: GuestOrder;
  justCreated?: boolean;
}

type View =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "failed" }
  | { kind: "ready"; order: GuestOrder };

/**
 * Seguimiento público del invitado. El token del enlace es la única
 * credencial: no se pide sesión y la ruta no comparte nada con `/pedido/:id`.
 */
export function GuestTrackingPage() {
  useDocumentTitle("Seguimiento del pedido");
  const { token = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const validToken = isTrackingToken(token);
  // El aviso de "recién creado" se lee una sola vez; luego se limpia el
  // historial para que recargar la página no lo repita.
  const [arrival] = useState<TrackingState>(
    () => (location.state as TrackingState | null) ?? {},
  );
  const [view, setView] = useState<View>(() =>
    !validToken
      ? { kind: "invalid" }
      : arrival.order
        ? { kind: "ready", order: arrival.order }
        : { kind: "loading" },
  );

  const load = useCallback(async () => {
    setView({ kind: "loading" });
    try {
      setView({ kind: "ready", order: await getGuestOrder(token) });
    } catch (cause) {
      setView(isNotFound(cause) ? { kind: "invalid" } : { kind: "failed" });
    }
  }, [token]);

  useEffect(() => {
    if (!validToken || arrival.order) return;
    void load();
  }, [arrival.order, load, validToken]);

  useEffect(() => {
    if (arrival.justCreated)
      navigate(location.pathname, { replace: true, state: null });
    // Sólo al llegar: el estado del historial ya se copió en `arrival`.
  }, []);

  return (
    <StoreLayout>
      <main className="store-checkout store-confirm store-tracking">
        {view.kind === "invalid" ? (
          <InvalidLink />
        ) : view.kind === "failed" ? (
          <div className="alert" role="alert">
            <span>
              No pudimos cargar tu pedido. Revisa tu conexión e intenta de nuevo.
            </span>
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={() => void load()}
            >
              Reintentar
            </button>
          </div>
        ) : view.kind === "loading" ? (
          <p className="store-checkout__note" role="status">
            Cargando el pedido…
          </p>
        ) : (
          <TrackedOrder
            order={view.order}
            token={token}
            justCreated={Boolean(arrival.justCreated)}
            onChange={(order) => setView({ kind: "ready", order })}
            onInvalid={() => setView({ kind: "invalid" })}
          />
        )}
      </main>
    </StoreLayout>
  );
}

function TrackedOrder({
  order,
  token,
  justCreated,
  onChange,
  onInvalid,
}: {
  order: GuestOrder;
  token: string;
  justCreated: boolean;
  onChange: (order: GuestOrder) => void;
  onInvalid: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const canCancel = order.status === "CREADO";

  async function cancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await cancelGuestOrder(token);
      dialogRef.current?.close();
      onChange(updated);
    } catch (cause) {
      dialogRef.current?.close();
      if (isNotFound(cause)) return onInvalid();
      setCancelError(
        cause instanceof ApiError && cause.status === 409
          ? "Este pedido ya avanzó y no se puede cancelar. Recarga la página para ver su estado actual."
          : "No pudimos cancelar el pedido. Revisa tu conexión e intenta de nuevo.",
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <header className="store-confirm__head">
        <h1>{justCreated ? "Pedido registrado" : "Tu pedido"}</h1>
        <p>
          {justCreated
            ? "Quedó pendiente de aceptación: un operador lo revisará y te escribirá al correo."
            : "Este es el estado actual de tu pedido. Cada vez que abras el enlace verás la información más reciente."}
        </p>
      </header>

      {justCreated ? <SaveLinkBanner token={token} maskedEmail={order.maskedEmail} /> : null}

      <div className="store-confirm__layout">
        <section className="store-confirm__ticket" aria-labelledby="ticket-title">
          <div className="store-confirm__ticket-head">
            <h2 id="ticket-title">Pedido</h2>
            <span className="store-confirm__number">{order.orderNumber}</span>
          </div>
          <span className={`badge badge--${order.status.toLowerCase()}`}>
            {statusLabel(order.status)}
          </span>
          {order.cancellationReason ? (
            <p className="store-tracking__reason">
              <span>Motivo de la cancelación</span>
              {order.cancellationReason}
            </p>
          ) : null}
          <ul className="store-confirm__lines">
            {order.items.map((item) => (
              <li key={item.productId}>
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>{formatPrice(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <OrderLedger items={[]} total={order.total} />
          <dl className="store-tracking__facts">
            <div>
              <dt>Registrado</dt>
              <dd>
                <FormattedDate value={order.createdAt} />
              </dd>
            </div>
            <div>
              <dt>Última actualización</dt>
              <dd>
                <FormattedDate value={order.updatedAt} />
              </dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{order.maskedEmail}</dd>
            </div>
            {order.notes ? (
              <div>
                <dt>Notas</dt>
                <dd>{order.notes}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <aside className="store-confirm__aside">
          <h2>Qué sigue</h2>
          <p>
            {canCancel
              ? "Mientras esté en estado Creado puedes cancelarlo desde acá. Después, el equipo de operación lo prepara y despacha."
              : "Vuelve a este enlace cuando quieras para ver el estado actualizado."}
          </p>
          {canCancel ? (
            <button
              type="button"
              className="button button--danger store-summary__cta"
              onClick={() => {
                setCancelError(null);
                dialogRef.current?.showModal();
              }}
            >
              Cancelar pedido
            </button>
          ) : null}
          {cancelError ? (
            <p className="store-checkout__error" role="alert">
              {cancelError}
            </p>
          ) : null}
          <Link className="store-confirm__back" to="/">
            Volver al catálogo
          </Link>
        </aside>
      </div>

      {canCancel ? (
        <dialog
          ref={dialogRef}
          className="store-tracking__dialog"
          aria-labelledby="cancel-title"
          aria-describedby="cancel-description"
        >
          <h2 id="cancel-title">¿Cancelar el pedido {order.orderNumber}?</h2>
          <p id="cancel-description">
            El pedido pasa a Cancelado y no se puede deshacer.
          </p>
          <div className="store-tracking__dialog-actions">
            <button
              type="button"
              className="button button--ghost"
              disabled={cancelling}
              onClick={() => dialogRef.current?.close()}
            >
              No, mantener
            </button>
            <button
              type="button"
              className="button button--danger"
              disabled={cancelling}
              onClick={() => void cancel()}
            >
              {cancelling ? "Cancelando…" : "Sí, cancelar"}
            </button>
          </div>
        </dialog>
      ) : null}
    </>
  );
}

function SaveLinkBanner({ token, maskedEmail }: { token: string; maskedEmail: string }) {
  const link = `${window.location.origin}/seguimiento/${token}`;
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  }

  return (
    <section className="store-tracking__save" aria-labelledby="save-link-title">
      <h2 id="save-link-title">Guarda este enlace</h2>
      <p>
        Es la única forma de ver o cancelar tu pedido sin cuenta. También te lo
        enviamos a {maskedEmail}.
      </p>
      <label className="store-checkout__notes" htmlFor="tracking-link">
        Enlace de seguimiento
      </label>
      <div className="store-tracking__link">
        <input
          id="tracking-link"
          className="store-checkout__notes-input"
          readOnly
          value={link}
          onFocus={(event) => event.currentTarget.select()}
        />
        <button
          type="button"
          className="button button--secondary"
          onClick={() => void copyLink()}
        >
          Copiar enlace
        </button>
      </div>
      <p className="store-checkout__note" role="status">
        {copy === "copied"
          ? "Enlace copiado"
          : copy === "failed"
            ? "No se pudo copiar. Selecciona el enlace y cópialo a mano."
            : ""}
      </p>
    </section>
  );
}

function InvalidLink() {
  return (
    <div className="store-checkout__empty">
      <h1 className="store-checkout__empty-title">Este enlace no es válido</h1>
      <p>
        El enlace es inválido o fue reemplazado por uno más nuevo. Si pediste
        otro enlace, usa el último que te enviamos al correo.
      </p>
      <Link className="button" to="/seguimiento">
        Pedir un enlace nuevo
      </Link>
    </div>
  );
}

function FormattedDate({ value }: { value: string }) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return <>—</>;
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("es-CL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)}
    </time>
  );
}

function isNotFound(cause: unknown): boolean {
  return cause instanceof ApiError && cause.status === 404;
}
