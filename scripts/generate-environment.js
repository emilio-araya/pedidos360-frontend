import fs from "node:fs";

const required = {
  ENTRA_TENANT_ID: process.env.ENTRA_TENANT_ID,
  ENTRA_CLIENT_ID: process.env.ENTRA_CLIENT_ID,
  API_SCOPE: process.env.API_SCOPE,
  API_BASE_URL: process.env.API_BASE_URL,
  REDIRECT_URI: process.env.REDIRECT_URI,
  POST_LOGOUT_REDIRECT_URI: process.env.POST_LOGOUT_REDIRECT_URI,
};

for (const [name, value] of Object.entries(required)) {
  if (!value) throw new Error(`Falta el build arg ${name}`);
}

for (const name of [
  "API_BASE_URL",
  "REDIRECT_URI",
  "POST_LOGOUT_REDIRECT_URI",
]) {
  new URL(required[name]);
}

const environment = {
  production: true,
  appName: "Pedidos360",
  entraTenantId: required.ENTRA_TENANT_ID,
  entraClientId: required.ENTRA_CLIENT_ID,
  apiBaseUrl: required.API_BASE_URL.replace(/\/+$/, ""),
  apiScope: required.API_SCOPE,
  redirectUri: required.REDIRECT_URI,
  postLogoutRedirectUri: required.POST_LOGOUT_REDIRECT_URI,
};

fs.writeFileSync(
  "src/config/environment.ts",
  `export const environment = ${JSON.stringify(environment, null, 2)} as const;\n`,
);
