import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCognitoAuth } from "../auth/CognitoAuthContext";
import { apiRequest } from "../api/client";
import { normalizeOrder, normalizeProduct } from "../api/services";
import { ErrorState, LoadingState } from "../components/States";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import type { Order, Product } from "../types";

export function AwsPortalPage() {
  useDocumentTitle("Módulos AWS");
  const { username, groups, getAccessToken, logout } = useCognitoAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prefix = "/aws/api";

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAccessToken();
        const [orderPayload, productPayload] = await Promise.all([
          apiRequest<unknown>(`${prefix}/orders`, token),
          apiRequest<unknown>(`${prefix}/catalog/products`, token),
        ]);
        setOrders(Array.isArray(orderPayload) ? orderPayload.map((item) => normalizeOrder(item as Order)) : []);
        setProducts(
          Array.isArray(productPayload)
            ? productPayload.map((item) => normalizeProduct(item as Product))
            : [],
        );
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "No fue posible consultar los módulos AWS.",
        );
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page-content aws-portal-page">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Amazon Cognito</p>
          <h1>Módulos AWS</h1>
          <p className="hero-copy">
            Sesión independiente: {username || "usuario Cognito"} · {groups.join(", ") || "Sin roles"}
          </p>
        </div>
        <div className="button-row">
          <Link className="button button--secondary" to="/dashboard">
            Volver a Pedidos360
          </Link>
          <button className="button button--ghost" type="button" onClick={() => void logout()}>
            Salir de Cognito
          </button>
        </div>
      </header>
      {error && <ErrorState message={error} onRetry={() => void load()} />}
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <section className="stats-grid" aria-label="Resumen AWS">
            <article className="stat-card">
              <span className="stat-card__label">Pedidos</span>
              <strong>{orders.length}</strong>
            </article>
            <article className="stat-card stat-card--accent">
              <span className="stat-card__label">Productos</span>
              <strong>{products.length}</strong>
            </article>
          </section>
          <div className="dashboard-grid">
            <section className="card">
              <div className="card__header">
                <div>
                  <p className="eyebrow">Catálogo</p>
                  <h2>Productos</h2>
                </div>
              </div>
              <div className="card__body">
                {products.map((product) => (
                  <div className="recent-row" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.sku}</span>
                    </div>
                    <strong>${Number(product.price).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="card">
              <div className="card__header">
                <div>
                  <p className="eyebrow">Operación</p>
                  <h2>Pedidos</h2>
                </div>
              </div>
              <div className="card__body">
                {orders.map((order) => (
                  <div className="recent-row" key={order.id}>
                    <div>
                      <strong>{order.orderNumber || order.id}</strong>
                      <span>{order.status}</span>
                    </div>
                    <strong>${Number(order.total).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
