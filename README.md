# Pedidos360 frontend

[![CI](https://github.com/emilio-araya/pedidos360-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/emilio-araya/pedidos360-frontend/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.3.1-646FFC?logo=vite&logoColor=white)](https://vite.dev)

SPA React + Vite + TypeScript para la gestión de pedidos y catálogo de Pedidos360.

## Requisitos

- Node.js 26 y npm.
- Microsoft Entra ID configurado para la SPA y la API en `/api/**`.
- Amazon Cognito configurado con Authorization Code + PKCE S256 para `/aws/api/**`.
- Docker opcional para servir el build mediante Nginx.

## Desarrollo

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:4200`. La configuración local de `src/config/environment.ts` contiene identificadores de tenant, cliente, scope y URLs; no contiene secretos.

Para generar la configuración con los valores de un ambiente:

```bash
ENTRA_TENANT_ID=... \
ENTRA_CLIENT_ID=... \
API_SCOPE=... \
API_BASE_URL=https://api.example.com \
REDIRECT_URI=https://app.example.com/login \
POST_LOGOUT_REDIRECT_URI=https://app.example.com/login \
COGNITO_USER_POOL_ID=us-east-1_example \
COGNITO_USER_POOL_CLIENT_ID=example-client-id \
COGNITO_DOMAIN=example.auth.us-east-1.amazoncognito.com \
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example \
COGNITO_REDIRECT_URI=https://app.example.com/auth/cognito/callback \
COGNITO_LOGOUT_URI=https://app.example.com/login \
COGNITO_API_SCOPE='openid email profile' \
npm run generate:environment
```

El frontend es una SPA pública: utiliza Authorization Code + PKCE y no distribuye client secrets. MSAL obtiene el token delegado de Entra para `/api/**`; Amplify obtiene de forma independiente el access token de Cognito para `/aws/api/**` y lo guarda en `sessionStorage` (con fallback de memoria), no en `localStorage`. Los callbacks de Cognito (`/auth/cognito/callback`) y Entra (`/login`) están separados para que un proveedor no procese el código del otro.

## Verificación

```bash
npm test
npm run build
```

Las pruebas cubren claims, roles, transiciones, cliente HTTP, servicios, login, callback y sesión Cognito. El build de Vite genera `dist/`.

## Rutas y autorización

- `/login`: inicio de sesión con Microsoft o Amazon Cognito.
- `/auth/cognito/callback`: callback OAuth/PKCE de Cognito.
- `/aws`: portal protegido por sesión Cognito y limitado a `/aws/api/**`.
- `/dashboard`: resumen y pedidos recientes.
- `/orders`: consulta, creación y seguimiento de pedidos.
- `/catalog`: productos y stock; requiere rol `Admin` u `Operador`.

Las rutas privadas usan `RequireAuth`. El catálogo usa `RequireCatalogRole`, que espera a que MSAL finalice la inicialización y la adquisición silenciosa antes de evaluar los claims. Ocultar controles en la interfaz no sustituye la autorización del BFF y los microservicios.

## Docker

El `Dockerfile` recibe build args, genera `src/config/environment.ts`, compila Vite y copia `dist/` a Nginx. El contenedor sirve el fallback SPA y `/healthz`.

```bash
docker build -t pedidos360-frontend .
docker run --rm -p 8080:80 pedidos360-frontend
```

Para el stack integrado, `docker-compose.yml` configura los build args y publica únicamente el frontend en loopback. En AWS, `API_BASE_URL` debe ser el endpoint HTTPS de API Gateway; nunca una URL privada de BFF, orders, catalog u Oracle.
