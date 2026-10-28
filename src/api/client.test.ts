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

  it("no sale a la red cuando la sesión se perdió", async () => {
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiRequest("/api/orders", "")).rejects.toEqual(
      new ApiError("No hay una sesión activa.", 401),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reporta el detalle estructurado que devuelve el backend", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: { campo: "precio" } }), {
        status: 400,
      }),
    );
    await expect(apiRequest("/api/catalog/products", "token-test")).rejects.toEqual(
      new ApiError('{"campo":"precio"}', 400),
    );
  });

  it("expone los errores por campo de un ProblemDetail 400", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          title: "Bad Request",
          detail: "La solicitud tiene errores de validación.",
          errors: [
            { field: "email", message: "debe ser un correo válido" },
            { field: 7, message: "ignorado" },
          ],
        }),
        { status: 400 },
      ),
    );

    await expect(apiRequest("/api/guest-orders", null)).rejects.toMatchObject({
      status: 400,
      message: "La solicitud tiene errores de validación.",
      fieldErrors: [{ field: "email", message: "debe ser un correo válido" }],
    });
  });

  it("deja la lista de errores por campo vacía cuando no viene", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: "Conflicto" }), { status: 409 }),
    );

    await expect(apiRequest("/api/orders", "token-test")).rejects.toMatchObject({
      fieldErrors: [],
    });
  });

  it("usa el cuerpo tal cual cuando no es JSON", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(new Response("Bad Gateway", { status: 502 }));
    await expect(apiRequest("/api/orders", "token-test")).rejects.toEqual(
      new ApiError("Bad Gateway", 502),
    );
  });

  it("describe el fallo cuando el cuerpo viene vacío", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(new Response("", { status: 500 }));
    await expect(apiRequest("/api/orders", "token-test")).rejects.toEqual(
      new ApiError("La operación falló (500).", 500),
    );
  });
});
