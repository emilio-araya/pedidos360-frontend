import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { createCatalogService, createOrdersService } from "../api/services";
import { ErrorState, LoadingState } from "../components/States";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import type { Order, OrderStatus, Product } from "../types";
import { STATUS_TRANSITIONS, canTransition, statusLabel } from "../types";

interface DraftItem {
  productId: string;
  quantity: number;
}

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function OrdersPage() {
  useDocumentTitle("Pedidos");
  const { canManageOrders, isClient, oid, getAccessToken } = useAuth();
  const ordersService = useMemo(
    () =>
      createOrdersService(getAccessToken, { canManageOrders, isClient, oid }),
    [canManageOrders, getAccessToken, isClient, oid],
  );
  const catalogService = useMemo(
    () => createCatalogService(getAccessToken, { canManageCatalog: false }),
    [getAccessToken],
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<DraftItem[]>([
    { productId: "", quantity: 1 },
  ]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setProductsLoading(true);
    setError(null);
    setProductsError(null);
    const [ordersResult, productsResult] = await Promise.allSettled([
      ordersService.list(),
      catalogService.list(),
    ]);
    if (ordersResult.status === "fulfilled") setOrders(ordersResult.value);
    else
      setError(
        ordersResult.reason instanceof Error
          ? ordersResult.reason.message
          : "No fue posible cargar los pedidos.",
      );
    if (productsResult.status === "fulfilled")
      setProducts(productsResult.value.filter((product) => product.active));
    else
      setProductsError(
        productsResult.reason instanceof Error
          ? productsResult.reason.message
          : "No fue posible cargar los productos.",
      );
    setLoading(false);
    setProductsLoading(false);
  }

  useEffect(() => {
    void load();
  }, [ordersService, catalogService]);

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [...current, { productId: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function createOrder() {
    if (creating || productsLoading) return;
    if (
      items.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 999,
      )
    ) {
      setError("Completa el producto y una cantidad entera entre 1 y 999.");
      return;
    }
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const created = await ordersService.create({
        items,
        notes: notes.trim() || undefined,
      });
      setOrders((current) => [created, ...current]);
      setItems([{ productId: "", quantity: 1 }]);
      setNotes("");
      setMessage(
        `Pedido ${created.orderNumber || created.id} creado correctamente.`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible crear el pedido.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    if (updatingId || !canManageOrders || !canTransition(order.status, status))
      return;
    setUpdatingId(order.id);
    setError(null);
    setMessage(null);
    try {
      const updated = await ordersService.changeStatus(order.id, status);
      setOrders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(`Pedido ${updated.orderNumber || updated.id} actualizado.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible actualizar el estado.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function cancel(order: Order) {
    if (updatingId) return;
    setUpdatingId(order.id);
    setError(null);
    setMessage(null);
    try {
      await ordersService.cancel(order);
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status: "CANCELADO" } : item,
        ),
      );
      setMessage(`Pedido ${order.orderNumber || order.id} cancelado.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible cancelar el pedido.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const canCancel = (order: Order) =>
    order.status === "CREADO" &&
    (canManageOrders || (isClient && order.customerId === oid));

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Operación</p>
          <h1>Pedidos</h1>
          <p>
            {canManageOrders
              ? "Gestiona el ciclo completo de las solicitudes."
              : "Consulta y administra únicamente tus pedidos."}
          </p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => void load()}
          disabled={loading || productsLoading}
        >
          Actualizar
        </button>
      </div>
      {error && <ErrorState message={error} onRetry={() => void load()} />}
      {message && (
        <div className="alert alert--success" role="status">
          {message}
        </div>
      )}

      <div className="orders-layout">
        <section className="card create-card">
          <div className="card__header">
            <div>
              <p className="eyebrow">Nueva solicitud</p>
              <h2>Crear pedido</h2>
            </div>
            <span className="card-hint">
              Los pedidos comienzan en estado <strong>Creado</strong>.
            </span>
          </div>
          <div className="card__body">
            {productsError && (
              <ErrorState message={productsError} onRetry={() => void load()} />
            )}
            {productsLoading ? (
              <LoadingState label="Cargando productos…" />
            ) : products.length === 0 ? (
              <div className="alert alert--info">
                No hay productos activos disponibles para crear un pedido.
              </div>
            ) : (
              <>
                <div className="items-editor">
                  {items.map((item, index) => (
                    <div className="item-row" key={index}>
                      <div className="form-field item-product">
                        <label htmlFor={`product-${index}`}>Producto</label>
                        <select
                          id={`product-${index}`}
                          value={item.productId}
                          onChange={(event) =>
                            updateItem(index, { productId: event.target.value })
                          }
                        >
                          <option value="">Selecciona un producto</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} · {product.sku} ({product.stock}{" "}
                              disponibles)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field item-quantity">
                        <label htmlFor={`quantity-${index}`}>Cantidad</label>
                        <input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          max="999"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(index, {
                              quantity: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                      <button
                        className="button button--ghost button--small remove-button"
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1 || creating}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="button button--ghost button--small"
                  type="button"
                  onClick={addItem}
                  disabled={creating}
                >
                  + Agregar ítem
                </button>
                <div className="form-field form-field--full notes-field">
                  <label htmlFor="order-notes">Notas (opcional)</label>
                  <textarea
                    id="order-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Ej. Entregar después de las 18:00"
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => void createOrder()}
                    disabled={creating || productsLoading}
                  >
                    {creating ? "Creando…" : "Crear pedido"}
                  </button>
                  <span className="muted form-hint">
                    Al crear, el pedido quedará pendiente de aceptación.
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="card orders-card">
          <div className="card__header">
            <div>
              <p className="eyebrow">Seguimiento</p>
              <h2>{canManageOrders ? "Todos los pedidos" : "Mis pedidos"}</h2>
            </div>
            <span className="muted">{orders.length} visibles</span>
          </div>
          <div className="card__body">
            {loading ? (
              <LoadingState label="Cargando pedidos…" />
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <strong>No hay pedidos para mostrar</strong>
                <span>Crea el primer pedido usando el formulario.</span>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <article className="order-item" key={order.id}>
                    <div className="order-item__header">
                      <div>
                        <div className="order-number">
                          {order.orderNumber || order.id}
                        </div>
                        <span className="muted">
                          Creado{" "}
                          {new Date(order.createdAt).toLocaleString("es-CO")} ·{" "}
                          {order.items.length} ítem(s)
                        </span>
                      </div>
                      <div className="order-item__summary">
                        <span
                          className={`badge badge--${order.status.toLowerCase()}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                        <strong>{currency.format(Number(order.total))}</strong>
                      </div>
                    </div>
                    <div className="order-items">
                      {order.items.map((item) => (
                        <span key={item.productId}>
                          {item.quantity} × {item.productName || item.productId}
                        </span>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="order-notes">
                        <strong>Notas:</strong> {order.notes}
                      </p>
                    )}
                    <div className="order-item__actions">
                      {canManageOrders &&
                        STATUS_TRANSITIONS[order.status].length > 0 && (
                          <label className="status-control">
                            <span>Cambiar estado</span>
                            <select
                              value={order.status}
                              disabled={updatingId === order.id}
                              onChange={(event) =>
                                void changeStatus(
                                  order,
                                  event.target.value as OrderStatus,
                                )
                              }
                            >
                              <option value={order.status}>
                                {statusLabel(order.status)} (actual)
                              </option>
                              {STATUS_TRANSITIONS[order.status].map(
                                (status) => (
                                  <option key={status} value={status}>
                                    {statusLabel(status)}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        )}
                      {!canManageOrders && canCancel(order) && (
                        <button
                          className="button button--danger button--small"
                          type="button"
                          onClick={() => void cancel(order)}
                          disabled={updatingId === order.id}
                        >
                          {updatingId === order.id
                            ? "Procesando…"
                            : "Cancelar pedido"}
                        </button>
                      )}
                      {!canManageOrders &&
                        !canCancel(order) &&
                        order.status === "CREADO" && (
                          <span className="muted">
                            Solicita cambios al equipo de operación.
                          </span>
                        )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
