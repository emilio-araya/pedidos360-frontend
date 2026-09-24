import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createOrdersService } from "../api/services";
import { ErrorState, LoadingState } from "../components/States";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import type { Order } from "../types";
import { statusLabel } from "../types";

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const date = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function DashboardPage() {
  useDocumentTitle("Dashboard");
  const {
    displayName,
    roles,
    oid,
    canManageCatalog,
    canManageOrders,
    isClient,
    getAccessToken,
  } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const service = useMemo(
    () =>
      createOrdersService(getAccessToken, { canManageOrders, isClient, oid }),
    [canManageOrders, getAccessToken, isClient, oid],
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setOrders(await service.list());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible cargar los pedidos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [service]);

  const active = orders.filter(
    (order) => !["ENTREGADO", "CANCELADO"].includes(order.status),
  ).length;
  const pending = orders.filter((order) => order.status === "CREADO").length;
  const delivered = orders.filter(
    (order) => order.status === "ENTREGADO",
  ).length;
  const total = orders.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Centro de operaciones</p>
          <h1>Hola, {displayName}</h1>
          <p className="hero-copy">
            Consulta el estado de tus pedidos y mantén la operación al día.
          </p>
        </div>
        <Link className="button" to="/orders">
          Ver pedidos →
        </Link>
      </div>
      {error && <ErrorState message={error} onRetry={() => void load()} />}
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="stats-grid" aria-label="Resumen de pedidos">
            <article className="stat-card">
              <span className="stat-card__label">Pedidos visibles</span>
              <strong>{orders.length}</strong>
              <span className="stat-card__hint">
                {canManageOrders
                  ? " Toda la operación"
                  : " Dentro de tu cuenta"}
              </span>
            </article>
            <article className="stat-card stat-card--accent">
              <span className="stat-card__label">En curso</span>
              <strong>{active}</strong>
              <span className="stat-card__hint">Requieren seguimiento</span>
            </article>
            <article className="stat-card">
              <span className="stat-card__label">Por crear</span>
              <strong>{pending}</strong>
              <span className="stat-card__hint">Esperando aceptación</span>
            </article>
            <article className="stat-card">
              <span className="stat-card__label">Valor visible</span>
              <strong className="stat-card__money">
                {money.format(total)}
              </strong>
              <span className="stat-card__hint">{delivered} entregados</span>
            </article>
          </div>
          <div className="dashboard-grid">
            <section className="card recent-card">
              <div className="card__header">
                <div>
                  <p className="eyebrow">Actividad</p>
                  <h2>Pedidos recientes</h2>
                </div>
                <Link className="text-link" to="/orders">
                  Ver todos →
                </Link>
              </div>
              <div className="card__body">
                {orders.length === 0 ? (
                  <div className="empty-state">
                    <strong>Todavía no hay pedidos</strong>
                    <span>Cuando se cree un pedido aparecerá aquí.</span>
                  </div>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <div className="recent-row" key={order.id}>
                      <div>
                        <strong>{order.orderNumber || order.id}</strong>
                        <span>
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "ítem" : "ítems"} ·{" "}
                          {date.format(new Date(order.createdAt))}
                        </span>
                      </div>
                      <div className="recent-row__right">
                        <span
                          className={`badge badge--${order.status.toLowerCase()}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                        <strong>{money.format(Number(order.total))}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
            <aside className="card profile-card">
              <div className="card__body">
                <p className="eyebrow">Sesión segura</p>
                <h2>Identidad y permisos</h2>
                <p className="muted">
                  La información proviene de los claims de Microsoft Entra ID.
                </p>
                <dl className="identity-list">
                  <div>
                    <dt>Usuario</dt>
                    <dd>{displayName}</dd>
                  </div>
                  <div>
                    <dt>Roles</dt>
                    <dd>{roles.join(", ") || "Sin roles"}</dd>
                  </div>
                  <div>
                    <dt>Claim oid</dt>
                    <dd className="mono">{oid || "No disponible"}</dd>
                  </div>
                </dl>
                {canManageCatalog ? (
                  <Link
                    className="button button--secondary profile-card__action"
                    to="/catalog"
                  >
                    Administrar catálogo
                  </Link>
                ) : (
                  <p className="small-note">
                    Tu rol tiene acceso a pedidos propios y creación de nuevas
                    solicitudes.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
