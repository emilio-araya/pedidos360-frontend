import { describe, expect, it } from "vitest";
import { emptyProductForm, toProductPayload } from "./productForm";

const valid = {
  ...emptyProductForm,
  sku: " P-010 ",
  name: " Producto ",
  price: "1990",
  stock: "3",
};

describe("toProductPayload", () => {
  it("normaliza un formulario válido", () => {
    expect(toProductPayload({ ...valid, imageUrl: " /img/foto.jpg " })).toEqual({
      ok: true,
      payload: {
        sku: "P-010",
        name: "Producto",
        description: "",
        price: 1990,
        stock: 3,
        active: true,
        imageUrl: "/img/foto.jpg",
      },
    });
  });

  it("envía null cuando la imagen está vacía", () => {
    const result = toProductPayload(valid);
    expect(result.ok && result.payload.imageUrl).toBeNull();
  });

  it.each(["javascript:alert(1)", "//otro-sitio.com/a.jpg", "http://inseguro.com/a.jpg"])(
    "rechaza la imagen %s",
    (imageUrl) => {
      expect(toProductPayload({ ...valid, imageUrl })).toEqual({
        ok: false,
        error:
          "La imagen debe ser una URL https:// o una ruta del sitio como /img/foto.jpg.",
      });
    },
  );

  it("rechaza stock decimal", () => {
    expect(toProductPayload({ ...valid, stock: "1.5" })).toEqual({
      ok: false,
      error: "Completa SKU, nombre, descripción, precio y stock válidos.",
    });
  });
});
