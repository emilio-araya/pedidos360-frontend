import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { createCatalogService } from "../api/services";
import { ErrorState, LoadingState } from "../components/States";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import type { Product, ProductInput } from "../types";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

interface ProductForm {
  sku: string;
  name: string;
  description: string;
  price: string;
  stock: string;
  active: boolean;
}

const emptyProduct: ProductForm = {
  sku: "",
  name: "",
  description: "",
  price: "0",
  stock: "0",
  active: true,
};

export function CatalogPage() {
  useDocumentTitle("Catálogo");
  const { canManageCatalog, getAccessToken } = useAuth();
  const service = useMemo(
    () => createCatalogService(getAccessToken, { canManageCatalog }),
    [canManageCatalog, getAccessToken],
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingStock, setSavingStock] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockValue, setStockValue] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setProducts(await service.list());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible cargar el catálogo.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [service]);

  function updateForm(patch: Partial<ProductForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyProduct });
    setError(null);
    setMessage(null);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      stock: String(product.stock),
      active: product.active,
    });
    setError(null);
    setMessage(null);
  }

  function selectStock(product: Product) {
    setStockProduct(product);
    setStockValue(String(product.stock));
    setError(null);
    setMessage(null);
  }

  function clearStock() {
    setStockProduct(null);
    setStockValue("0");
  }

  async function saveProduct() {
    if (saving) return;
    const payload: ProductInput = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description?.trim() ?? "",
      price: Number(form.price),
      stock: Number(form.stock),
      active: form.active,
    };
    const description = payload.description ?? "";
    if (
      !form.price.trim() ||
      !form.stock.trim() ||
      !payload.sku ||
      !payload.name ||
      payload.sku.length > 40 ||
      payload.name.length > 120 ||
      description.length > 500 ||
      !Number.isFinite(payload.price) ||
      payload.price < 0 ||
      !Number.isInteger(payload.stock) ||
      payload.stock < 0
    ) {
      setError("Completa SKU, nombre, descripción, precio y stock válidos.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = editingId
        ? await service.update(editingId, payload)
        : await service.create(payload);
      setProducts((current) =>
        editingId
          ? current.map((product) =>
              product.id === saved.id ? saved : product,
            )
          : [saved, ...current],
      );
      setMessage(
        `${saved.name} ${editingId ? "actualizado" : "creado"} correctamente.`,
      );
      setEditingId(null);
      setForm({ ...emptyProduct });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible guardar el producto.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(product: Product) {
    if (deletingId || !window.confirm(`Eliminar ${product.name}?`)) return;
    setDeletingId(product.id);
    setError(null);
    setMessage(null);
    try {
      await service.remove(product.id);
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
      if (editingId === product.id) {
        setEditingId(null);
        setForm({ ...emptyProduct });
      }
      if (stockProduct?.id === product.id) {
        setStockProduct(null);
        setStockValue("0");
      }
      setMessage(`${product.name} eliminado.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible eliminar el producto.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function saveStock() {
    if (!stockProduct || savingStock) return;
    const stock = Number(stockValue);
    if (!stockValue.trim() || !Number.isInteger(stock) || stock < 0) {
      setError("El stock debe ser un entero no negativo.");
      return;
    }
    setSavingStock(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await service.updateStock(stockProduct.id, stock);
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setStockProduct(updated);
      setStockValue(String(updated.stock));
      setMessage(`Stock de ${updated.name} actualizado.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible actualizar el stock.",
      );
    } finally {
      setSavingStock(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Catálogo</h1>
          <p>Gestiona productos, precios y existencias disponibles.</p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={startCreate}
        >
          + Nuevo producto
        </button>
      </div>
      {error && <ErrorState message={error} onRetry={() => void load()} />}
      {message && (
        <div className="alert alert--success" role="status">
          {message}
        </div>
      )}

      <div className="catalog-layout">
        <article className="card product-editor">
          <div className="card__header">
            <div>
              <p className="eyebrow">
                {editingId ? "Edición" : "Nuevo registro"}
              </p>
              <h2>{editingId ? "Editar producto" : "Crear producto"}</h2>
            </div>
            {editingId && (
              <button
                className="button button--ghost button--small"
                type="button"
                onClick={startCreate}
              >
                Cancelar
              </button>
            )}
          </div>
          <div className="card__body">
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="product-sku">SKU</label>
                <input
                  id="product-sku"
                  value={form.sku}
                  maxLength={40}
                  onChange={(event) => updateForm({ sku: event.target.value })}
                  placeholder="P-001"
                />
              </div>
              <div className="form-field">
                <label htmlFor="product-name">Nombre</label>
                <input
                  id="product-name"
                  value={form.name}
                  maxLength={120}
                  onChange={(event) => updateForm({ name: event.target.value })}
                  placeholder="Mouse inalámbrico"
                />
              </div>
              <div className="form-field form-field--full">
                <label htmlFor="product-description">Descripción</label>
                <textarea
                  id="product-description"
                  value={form.description ?? ""}
                  maxLength={500}
                  onChange={(event) =>
                    updateForm({ description: event.target.value })
                  }
                  placeholder="Descripción comercial"
                />
              </div>
              <div className="form-field">
                <label htmlFor="product-price">Precio</label>
                <input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    updateForm({ price: event.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label htmlFor="product-stock">Stock inicial</label>
                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) =>
                    updateForm({ stock: event.target.value })
                  }
                />
              </div>
              <label className="checkbox-field form-field--full">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    updateForm({ active: event.target.checked })
                  }
                />
                <span>Producto activo y visible para crear pedidos</span>
              </label>
            </div>
            <div className="form-actions">
              <button
                className="button"
                type="button"
                onClick={() => void saveProduct()}
                disabled={saving}
              >
                {saving
                  ? "Guardando…"
                  : editingId
                    ? "Guardar cambios"
                    : "Crear producto"}
              </button>
            </div>
          </div>
        </article>

        <article className="card stock-editor">
          <div className="card__header">
            <div>
              <p className="eyebrow">Inventario</p>
              <h2>Administrar stock</h2>
            </div>
          </div>
          <div className="card__body">
            {stockProduct ? (
              <>
                <div className="selected-product">
                  <div>
                    <strong>{stockProduct.name}</strong>
                    <span>
                      {stockProduct.sku} · {stockProduct.stock} unidades
                      actuales
                    </span>
                  </div>
                  <button
                    className="button button--ghost button--small"
                    type="button"
                    onClick={clearStock}
                  >
                    Cambiar
                  </button>
                </div>
                <div className="form-field">
                  <label htmlFor="stock-value">Nueva cantidad</label>
                  <input
                    id="stock-value"
                    type="number"
                    min="0"
                    step="1"
                    value={stockValue}
                    onChange={(event) => setStockValue(event.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => void saveStock()}
                    disabled={savingStock}
                  >
                    {savingStock ? "Actualizando…" : "Actualizar stock"}
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state stock-empty">
                <strong>Selecciona un producto</strong>
                <span>
                  Elige “Stock” en la lista para actualizar sus existencias.
                </span>
              </div>
            )}
          </div>
        </article>
      </div>

      <section className="card products-card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Inventario</p>
            <h2>Productos del catálogo</h2>
          </div>
          <button
            className="button button--ghost button--small"
            type="button"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
        {loading ? (
          <div className="card__body">
            <LoadingState label="Cargando catálogo…" />
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <strong>No hay productos</strong>
            <span>Crea el primer producto usando el formulario.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={editingId === product.id ? "is-editing" : ""}
                  >
                    <td>
                      <strong>{product.name}</strong>
                      <small>
                        {product.sku}
                        <br />
                        {product.description}
                      </small>
                    </td>
                    <td>{currency.format(Number(product.price))}</td>
                    <td>
                      <strong
                        className={product.stock === 0 ? "low-stock" : ""}
                      >
                        {product.stock}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`badge ${product.active ? "badge--delivered" : ""}`}
                      >
                        {product.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="button button--secondary button--small"
                          type="button"
                          onClick={() => startEdit(product)}
                          disabled={saving || deletingId !== null}
                        >
                          Editar
                        </button>
                        <button
                          className="button button--ghost button--small"
                          type="button"
                          onClick={() => selectStock(product)}
                          disabled={savingStock}
                        >
                          Stock
                        </button>
                        <button
                          className="button button--danger button--small"
                          type="button"
                          onClick={() => void remove(product)}
                          disabled={deletingId !== null}
                        >
                          {deletingId === product.id ? "…" : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
