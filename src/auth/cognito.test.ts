import { describe, expect, it } from "vitest";
import { buildCognitoSignupUrl } from "./cognito";

const completa = {
  cognitoDomain: "example.auth.us-east-1.amazoncognito.com",
  cognitoUserPoolClientId: "example-client-id",
  cognitoApiScope: "openid email profile",
  cognitoRedirectUri: "http://localhost:4200/auth/cognito/callback",
};

describe("URL de registro en el tenant", () => {
  it("apunta al signup del hosted UI del dominio configurado", () => {
    const url = buildCognitoSignupUrl(completa);
    expect(url).not.toBeNull();
    expect(url?.startsWith("https://example.auth.us-east-1.amazoncognito.com/signup?")).toBe(true);
  });

  it("usa Authorization Code y no el flujo implicito", () => {
    const url = new URL(buildCognitoSignupUrl(completa) as string);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("response_type")).not.toBe("token");
    expect(url.searchParams.get("client_id")).toBe("example-client-id");
  });

  it("devuelve al callback de Cognito, no al de Entra", () => {
    const url = new URL(buildCognitoSignupUrl(completa) as string);
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:4200/auth/cognito/callback",
    );
  });

  it("pide los scopes que el token necesita para los claims", () => {
    const url = new URL(buildCognitoSignupUrl(completa) as string);
    expect(url.searchParams.get("scope")?.split(" ").sort()).toEqual([
      "email",
      "openid",
      "profile",
    ]);
  });

  it("normaliza el dominio con protocolo o barra final", () => {
    const conRuido = {
      ...completa,
      cognitoDomain: "https://example.auth.us-east-1.amazoncognito.com/",
    };
    expect(buildCognitoSignupUrl(conRuido)).toBe(
      buildCognitoSignupUrl(completa),
    );
  });

  it("no construye la URL si falta el dominio, el cliente o el retorno", () => {
    expect(buildCognitoSignupUrl({ ...completa, cognitoDomain: "" })).toBeNull();
    expect(
      buildCognitoSignupUrl({ ...completa, cognitoUserPoolClientId: "" }),
    ).toBeNull();
    expect(buildCognitoSignupUrl({ ...completa, cognitoRedirectUri: "" })).toBeNull();
  });

  it("no filtra el secret, porque el flujo publico no lo usa", () => {
    const url = buildCognitoSignupUrl(completa) as string;
    expect(url).not.toContain("secret");
    expect(url).not.toContain("client_secret");
  });
});
