import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import { createOrdersService } from "../../api/services";
import { useAuth } from "../../auth/AuthContext";
import { statusLabel } from "../../types";
import type { Order } from "../../types";
import { OrderLedger } from "./OrderLedger";
import { StoreLayout } from "./StoreLayout";
import "./CheckoutPage.css";

/**
 * Pantalla de cierre: el pedido quedó registrado y pendiente de aceptación.
 * Si se abre el enlace directo, se recupera el pedido desde el servidor.
 */
export function OrderConfirmationPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const fromState = (location.state as { order?: Order } | null)?.order;
  const { getAccessToken, oid, isClient, canManageOrders } = useAuth();
  const [order, setOrder] = useState<Order | null>(fromState ?? null);
  const [error, setError] = useState<string | null>(null);

  const ordersService = useMemo(
    () => createOrdersService(getAccessToken, { canManageOrders, isClient, oid }),
    [canManageOrders, getAccessToken, isClient, oid],
  );

  useEffect(() => {
    if (fromState) return;
    let current = true;
    ordersService.get(id).then(
      (found) => {
        if (current) setOrder(found);
      },
      (cause: unknown) => {
        if (!current) return;
        setError(
          cause instanceof ApiError
            ? cause.message
            : "No fue posible cargar el pedido.",
        );
      },
    );
    return () => {
      current = false;
    };
  }, [fromState, id, ordersService]);

  return (
    <StoreLayout>
      <main className="store-checkout store-confirm">
        {error ? (
          <div className="alert" role="alert">
            <span>{error}</span>
            <Link className="nav-button" to="/">
              Volver al catálogo
            </Link>
          </div>
        ) : !order ? (
          <p className="store-checkout__note">Cargando el pedido…</p>
        ) : (
          <>
            <header className="store-confirm__head">
              <h1>Pedido registrado</h1>
              <p>
                Quedó pendiente de aceptación: un operador lo revisará y se
                pondrá en contacto contigo.
              </p>
            </header>

            <div className="store-confirm__layout">
              <section
                className="store-confirm__ticket"
                aria-labelledby="ticket-title"
              >
                <div className="store-confirm__ticket-head">
                  <h2 id="ticket-title">Pedido</h2>
                  <span className="store-confirm__number">{order.orderNumber}</span>
                </div>
                <span className="store-stock store-stock--in">
                  {statusLabel(order.status)}
                </span>
                <ul className="store-confirm__lines">
                  {order.items.map((item) => (
                    <li key={item.productId}>
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <span>{formatMoney(item.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <OrderLedger items={[]} total={order.total} />
              </section>

              <aside className="store-confirm__aside">
                <h2>Qué sigue</h2>
                <p>
                  Puedes seguir el estado en Mis pedidos. El pedido se registró
                  sin cobro en línea.
                </p>
                <Link className="button store-summary__cta" to="/orders">
                  Ver mis pedidos
                </Link>
                <Link className="store-confirm__back" to="/">
                  Volver al catálogo
                </Link>
              </aside>
            </div>
          </>
        )}
      </main>
    </StoreLayout>
  );
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}
