import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, apiUrl } from "./client";

const fetchMock = vi.fn();

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("cliente HTTP", () => {
  it("construye la URL y agrega Bearer y Content-Type", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const result = await apiRequest<{ ok: boolean }>(
      "/api/orders",
      "token-test",
      {
        method: "POST",
        body: JSON.stringify({ notes: "pedido" }),
      },
    );

    expect(result).toEqual({ ok: true });
    expect(apiUrl("/api/orders")).toBe("http://localhost:8080/api/orders");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/orders",
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Headers),
      }),
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect((request.headers as Headers).get("Authorization")).toBe(
      "Bearer token-test",
    );
    expect((request.headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("convierte errores HTTP en ApiError sin filtrar el token", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: "Stock insuficiente" }), {
        status: 409,
      }),
    );
    await expect(
      apiRequest("/api/orders", "secret-token"),
    ).rejects.toMatchObject({
      name: "ApiError",
      message: "Stock insuficiente",
      status: 409,
    });
    await expect(apiRequest("/api/orders", "secret-token")).rejects.not.toThrow(
      "secret-token",
    );
  });

  it("normaliza un fallo de red", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockRejectedValue(new TypeError("network down"));
    await expect(apiRequest("/api/orders", "token-test")).rejects.toEqual(
      new ApiError("No fue posible conectar con la API.", 0),
    );
  });
});
