export const environment = {
  production: true,
  appName: "Pedidos360",
  entraTenantId: "1feca74f-8331-414a-bd8d-2d687b22a7b3",
  entraClientId: "19c346ad-cb86-4cc7-8ccf-23d36bb60ebf",
  apiBaseUrl: "http://localhost:8080",
  apiScope: "api://150f51db-4084-4979-b1a1-e6a6e7893a01/access_as_user",
  redirectUri: "http://localhost:4200/login",
  postLogoutRedirectUri: "http://localhost:4200/login",
} as const;
