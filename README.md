# Pedidos360 frontend

SPA React + Vite + TypeScript para la gestión de pedidos y catálogo de Pedidos360.

## Requisitos

- Node.js 26 y npm.
- Microsoft Entra ID configurado para la SPA y la API.
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
npm run generate:environment
```

El frontend es una SPA pública: utiliza Authorization Code + PKCE y no distribuye client secrets. MSAL obtiene el token delegado `access_as_user` y el cliente HTTP lo envía únicamente a la URL de la API.

## Verificación

```bash
npm test
npm run build
```

Las pruebas cubren claims, roles, transiciones, cliente HTTP, servicios y la vista de login. El build de Vite genera `dist/`.

## Rutas y autorización

- `/login`: inicio de sesión con Microsoft.
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
