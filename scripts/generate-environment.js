import fs from "node:fs";

const required = {
  ENTRA_TENANT_ID: process.env.ENTRA_TENANT_ID,
  ENTRA_CLIENT_ID: process.env.ENTRA_CLIENT_ID,
  API_SCOPE: process.env.API_SCOPE,
  API_BASE_URL: process.env.API_BASE_URL,
  REDIRECT_URI: process.env.REDIRECT_URI,
  POST_LOGOUT_REDIRECT_URI: process.env.POST_LOGOUT_REDIRECT_URI,
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  COGNITO_USER_POOL_CLIENT_ID: process.env.COGNITO_USER_POOL_CLIENT_ID,
  COGNITO_DOMAIN: process.env.COGNITO_DOMAIN,
  COGNITO_ISSUER: process.env.COGNITO_ISSUER,
  COGNITO_REDIRECT_URI:
    process.env.COGNITO_REDIRECT_URI || process.env.REDIRECT_URI,
  COGNITO_LOGOUT_URI:
    process.env.COGNITO_LOGOUT_URI || process.env.POST_LOGOUT_REDIRECT_URI || process.env.REDIRECT_URI,
  COGNITO_API_SCOPE: process.env.COGNITO_API_SCOPE || "openid email profile",
};

for (const [name, value] of Object.entries(required)) {
  if (!value) throw new Error(`Falta el build arg ${name}`);
}

for (const name of [
  "API_BASE_URL",
  "REDIRECT_URI",
  "POST_LOGOUT_REDIRECT_URI",
  "COGNITO_ISSUER",
  "COGNITO_REDIRECT_URI",
  "COGNITO_LOGOUT_URI",
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
  cognitoUserPoolId: required.COGNITO_USER_POOL_ID,
  cognitoUserPoolClientId: required.COGNITO_USER_POOL_CLIENT_ID,
  cognitoDomain: required.COGNITO_DOMAIN,
  cognitoIssuer: required.COGNITO_ISSUER,
  cognitoRedirectUri: required.COGNITO_REDIRECT_URI,
  cognitoLogoutUri: required.COGNITO_LOGOUT_URI,
  cognitoApiScope: required.COGNITO_API_SCOPE,
  awsApiPrefix: "/aws/api",
};

fs.writeFileSync(
  "src/config/environment.ts",
  `export const environment = ${JSON.stringify(environment, null, 2)} as const;\n`,
);
