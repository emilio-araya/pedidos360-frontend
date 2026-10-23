import type { ProductInput } from "../types";

/** Estado editable del formulario: los números viajan como texto del input. */
export interface ProductForm {
  sku: string;
  name: string;
  description: string;
  price: string;
  stock: string;
  active: boolean;
  imageUrl: string;
}

export const emptyProductForm: ProductForm = {
  sku: "",
  name: "",
  description: "",
  price: "0",
  stock: "0",
  active: true,
  imageUrl: "",
};

export type ProductPayloadResult =
  | { ok: true; payload: ProductInput }
  | { ok: false; error: string };

/** Misma regla que el backend: https o ruta propia del sitio, nunca "//host". */
const IMAGE_URL_PATTERN = /^(https:\/\/\S+|\/[^/\s]\S*)$/;

const INVALID_FIELDS =
  "Completa SKU, nombre, descripción, precio y stock válidos.";
const INVALID_IMAGE =
  "La imagen debe ser una URL https:// o una ruta del sitio como /img/foto.jpg.";

/**
 * Convierte el formulario en el payload de la API o explica por qué no se
 * puede: la página solo decide si guarda o muestra el error.
 */
export function toProductPayload(form: ProductForm): ProductPayloadResult {
  const payload: ProductInput = {
    sku: form.sku.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    stock: Number(form.stock),
    active: form.active,
    imageUrl: form.imageUrl.trim() || null,
  };

  const fieldsAreValid =
    form.price.trim() !== "" &&
    form.stock.trim() !== "" &&
    payload.sku !== "" &&
    payload.name !== "" &&
    payload.sku.length <= 40 &&
    payload.name.length <= 120 &&
    (payload.description ?? "").length <= 500 &&
    Number.isFinite(payload.price) &&
    payload.price >= 0 &&
    Number.isInteger(payload.stock) &&
    payload.stock >= 0;
  if (!fieldsAreValid) return { ok: false, error: INVALID_FIELDS };

  const imageIsValid =
    payload.imageUrl === null ||
    (payload.imageUrl.length <= 512 && IMAGE_URL_PATTERN.test(payload.imageUrl));
  if (!imageIsValid) return { ok: false, error: INVALID_IMAGE };

  return { ok: true, payload };
}
