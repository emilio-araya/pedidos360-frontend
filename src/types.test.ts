import { describe, expect, it } from "vitest";
import { STATUS_TRANSITIONS, canTransition } from "./types";

describe("máquina de estados de pedidos", () => {
  it("conserva las transiciones operativas permitidas", () => {
    expect(canTransition("CREADO", "ACEPTADO")).toBe(true);
    expect(canTransition("ACEPTADO", "EN_PREPARACION")).toBe(true);
    expect(canTransition("EN_PREPARACION", "DESPACHADO")).toBe(true);
    expect(canTransition("DESPACHADO", "ENTREGADO")).toBe(true);
  });

  it("rechaza saltos, retrocesos y estados finales", () => {
    expect(canTransition("CREADO", "DESPACHADO")).toBe(false);
    expect(canTransition("DESPACHADO", "CANCELADO")).toBe(false);
    expect(canTransition("ENTREGADO", "ACEPTADO")).toBe(false);
    expect(canTransition("CANCELADO", "CREADO")).toBe(false);
    expect(STATUS_TRANSITIONS.ENTREGADO).toEqual([]);
  });
});
