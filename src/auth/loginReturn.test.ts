import { beforeEach, describe, expect, it } from "vitest";
import { consumeLoginReturn, rememberLoginReturn } from "./loginReturn";

beforeEach(() => sessionStorage.clear());

describe("retorno tras el inicio de sesión", () => {
  it("devuelve el destino guardado una sola vez", () => {
    rememberLoginReturn("/checkout");

    expect(consumeLoginReturn()).toBe("/checkout");
    expect(consumeLoginReturn()).toBeNull();
  });

  it("ignora destinos que no son rutas internas", () => {
    rememberLoginReturn("https://otro-sitio.example/falso");
    expect(consumeLoginReturn()).toBeNull();

    rememberLoginReturn("//otro-sitio.example");
    expect(consumeLoginReturn()).toBeNull();
  });

  it("no falla cuando no hay destino guardado", () => {
    expect(consumeLoginReturn()).toBeNull();
  });
});
