import type { AccountInfo } from "@azure/msal-browser";
import type { AppRole } from "../types";

export function normalizeRole(value: unknown): AppRole | null {
  if (typeof value !== "string") return null;
  const role = value.trim().toLowerCase();
  return (
    (
      {
        admin: "Admin",
        administrador: "Admin",
        operador: "Operador",
        operator: "Operador",
        cliente: "Cliente",
        customer: "Cliente",
      } as const
    )[role] ?? null
  );
}

export function normalizeCognitoRole(value: unknown): AppRole | null {
  return value === "Admin" || value === "Operador" || value === "Cliente"
    ? value
    : null;
}

export function cognitoRolesFromClaims(claims: unknown): AppRole[] {
  if (!claims || typeof claims !== "object") return [];
  const rawGroups = (claims as Record<string, unknown>)["cognito:groups"];
  const values = Array.isArray(rawGroups)
    ? rawGroups
    : typeof rawGroups === "string"
      ? [rawGroups]
      : [];
  return [
    ...new Set(
      values
        .map(normalizeCognitoRole)
        .filter((role): role is AppRole => role !== null),
    ),
  ];
}

export function rolesFromClaims(claims: unknown): AppRole[] {
  if (!claims || typeof claims !== "object") return [];
  const rawRoles = (claims as Record<string, unknown>).roles;
  const values = Array.isArray(rawRoles)
    ? rawRoles
    : typeof rawRoles === "string"
      ? [rawRoles]
      : [];
  return [
    ...new Set(
      values
        .map(normalizeRole)
        .filter((role): role is AppRole => role !== null),
    ),
  ];
}

export function oidFromClaims(claims: unknown): string | null {
  if (!claims || typeof claims !== "object") return null;
  const record = claims as Record<string, unknown>;
  const oid =
    typeof record.oid === "string" && record.oid.length > 0
      ? record.oid
      : record.sub;
  return typeof oid === "string" && oid.length > 0 ? oid : null;
}

export function shouldSetActiveAccount(
  current: AccountInfo | null,
  candidate: AccountInfo | null,
): boolean {
  return (
    candidate !== null && current?.homeAccountId !== candidate.homeAccountId
  );
}

export function claimsFromAccessToken(
  accessToken: string,
): Record<string, unknown> {
  const payload = accessToken.split(".")[1];
  if (!payload) return {};
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(
      normalized + "=".repeat((4 - (normalized.length % 4)) % 4),
    );
    const claims: unknown = JSON.parse(decoded);
    return typeof claims === "object" && claims !== null
      ? (claims as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function effectiveClaims(
  account: AccountInfo | null,
  accessClaims: Record<string, unknown>,
): Record<string, unknown> {
  const { roles: _idTokenRoles, ...identityClaims } =
    (account?.idTokenClaims ?? {}) as Record<string, unknown>;
  return { ...identityClaims, ...accessClaims };
}
