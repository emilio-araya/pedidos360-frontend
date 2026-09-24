import { environment } from "../config/environment";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiUrl(path: string): string {
  return `${environment.apiBaseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function errorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const value = record.detail ?? record.message ?? record.title;
    if (typeof value === "string" && value.length > 0) return value;
    if (value !== undefined) return JSON.stringify(value);
  }
  if (typeof payload === "string" && payload.trim().length > 0) return payload;
  return `La operación falló (${status}).`;
}

function parsePayload(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  if (!token) throw new ApiError("No hay una sesión activa.", 401);

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  if (typeof init.body === "string" && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(apiUrl(path), { ...init, headers });
  } catch {
    throw new ApiError("No fue posible conectar con la API.", 0);
  }

  const payload = parsePayload(await response.text());
  if (!response.ok)
    throw new ApiError(errorMessage(payload, response.status), response.status);
  return payload as T;
}
