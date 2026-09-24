import { describe, expect, it } from "vitest";
import {
  claimsFromAccessToken,
  effectiveClaims,
  normalizeRole,
  oidFromClaims,
  rolesFromClaims,
  shouldSetActiveAccount,
} from "./claims";

describe("claims de autenticación", () => {
  it("normaliza roles y elimina duplicados", () => {
    expect(normalizeRole("administrador")).toBe("Admin");
    expect(
      rolesFromClaims({ roles: ["Admin", "Operador", "admin", "desconocido"] }),
    ).toEqual(["Admin", "Operador"]);
    expect(rolesFromClaims({ roles: "Cliente" })).toEqual(["Cliente"]);
  });

  it("usa oid y falling back a sub", () => {
    expect(oidFromClaims({ oid: "oid-123", sub: "sub-123" })).toBe("oid-123");
    expect(oidFromClaims({ sub: "sub-123" })).toBe("sub-123");
    expect(oidFromClaims({ oid: "", sub: "sub-123" })).toBe("sub-123");
    expect(oidFromClaims({})).toBeNull();
    expect(oidFromClaims(null)).toBeNull();
  });

  it("decodifica claims de un access token sin verificar su firma", () => {
    const payload = btoa(
      JSON.stringify({ aud: "api-audience", roles: ["Admin"] }),
    );
    expect(claimsFromAccessToken(`header.${payload}.signature`)).toEqual({
      aud: "api-audience",
      roles: ["Admin"],
    });
    expect(claimsFromAccessToken("not-a-token")).toEqual({});
  });

  it("combina claims sin perder la identidad de la cuenta", () => {
    const account = {
      idTokenClaims: { oid: "oid-1", roles: ["Cliente"] },
    } as never;
    expect(
      effectiveClaims(account, { roles: ["Admin"], sub: "sub-1" }),
    ).toEqual({ oid: "oid-1", roles: ["Admin"], sub: "sub-1" });
  });

  it("solo cambia la cuenta activa cuando corresponde", () => {
    const account = { homeAccountId: "home-1" } as never;
    expect(shouldSetActiveAccount(null, account)).toBe(true);
    expect(shouldSetActiveAccount(account, account)).toBe(false);
    expect(
      shouldSetActiveAccount(account, { homeAccountId: "home-2" } as never),
    ).toBe(true);
  });
});
