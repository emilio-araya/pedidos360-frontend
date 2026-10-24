# Marketplace checkout

Objective: the public storefront works like a real marketplace purchase flow (Mercado Libre as the reference), frontend only, without invented commerce claims.
Branch: `feat/public-storefront` (frontend). Delivery: no commits until the user asks explicitly (standing user rule). Test runner: `npx vitest run`, `npx tsc --noEmit`, `npm run build`.

## Specs

- **S1 — Scope.** User: "as que todo funcione commo una paguina del mercado como mercado libre por ejemplo". Chosen scope: "Compra completa (Recomendado)" — "Página de producto con URL propia, carrito con cantidades y stock, checkout que pide login y crea el pedido, y pantalla de confirmación. Solo frontend: sin cambios en backend ni base de datos."
- **S2 — Product page.** User chose "Página de producto (Recomendado)": "La tarjeta lleva a /producto/:id, como Mercado Libre. Se retira la ficha rápida para no tener dos formas de ver lo mismo." Acceptance: shareable `/producto/:id` loaded from the public detail endpoint; quantity limited to stock; "Agregar al carrito" and "Comprar ahora"; unknown id and load failure have their own states; the quick sheet and its tests are removed.
- **S3 — Cart.** Flow confirmed ("Sí, así (Recomendado)"): "carrito (cantidades, quitar, total)". "El carrito vive en la pestaña (sobrevive al login, no a cerrar el navegador)". Acceptance: header cart button with item count on every storefront page; cart page with quantity steppers capped by stock, remove, line subtotals and total; empty state; stored in `sessionStorage`.
- **S4 — Checkout and confirmation.** Flow: "iniciar sesión recién ahí → resumen con notas opcionales → 'Confirmar pedido' → pantalla 'Pedido registrado, pendiente de aceptación' con el número." Acceptance: checkout requires sign-in and returns to checkout after the Entra redirect; creates one order with every cart item and the optional notes; empties the cart only after success; confirmation shows order number, items, total and the real state without mentioning payment (PRODUCT.md: "No hay pago (demo)"); a 403 (account without role) and other failures show clear messages and keep the cart.
- **S5 — Truth.** PRODUCT.md: no reviews, ratings, sellers, shipping, payment, installments or discounts may be invented.

## Tasks

| ID | Specs | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | S3 | inline | done | RED: módulo `./cart` inexistente. GREEN: 7/7 (`cart.test.tsx`) |
| T2 | S2, S5 | inline | done | RED: `./ProductPage` inexistente y `getProduct` no exportado. GREEN: 7/7 producto + 22/22 servicios |
| T3 | S3 | inline | done | RED: `./CartPage` inexistente. GREEN: 5/5 (`CartPage.test.tsx`) |
| T4 | S4, S5 | inline | done | RED: `./loginReturn`, `./CheckoutPage`, `./OrderConfirmationPage` inexistentes. GREEN: 13/13 |
| T5 | S1-S5 | inline | done | 129/129 tests, `tsc --noEmit` limpio, build OK, detector sin hallazgos, capturas de vitrina, producto, carrito, checkout y confirmación |
| T6 | S1-S5 | inline | done | Deploy a EC2 verificado: hashes idénticos (`12fee031…`, 92 archivos), contenedor healthy, HTTPS 200, bundle con las cadenas nuevas, flujo real producto → carrito → checkout con datos de Oracle |

## Log

- **L1 (2026-10-23, user):** "@impeccable as que todo funcione commo una paguina del mercado como mercado libre por ejemplo"
- **L2 (user answers):** scope "Compra completa (Recomendado)"; purpose "Portafolio / universidad"; payment "No hay pago (demo)"; "Página de producto (Recomendado)"; flow "Sí, así (Recomendado)".
- **L3:** Backend evidence: catalog list accepts only `page`/`size`; public `GET /api/catalog/products/{id}` exists through the BFF; orders accept several items and optional notes; MSAL uses `loginRedirect`, and `RedirectHandler` always lands on `/dashboard` today.
- **L4:** Engram mirror pending (Engram cannot resolve this project from `/home/emilio`).
- **L5:** T1–T4 implementados test-first. Piezas nuevas: `cart.tsx`, `StoreLayout`, `QuantityStepper`, `OrderLedger`, `icons.tsx`, `useProduct`, `ProductPage`, `CartPage`, `CheckoutPage`, `OrderConfirmationPage`, `auth/loginReturn`. La ficha rápida (`ProductSheet`) se retiró junto con sus cuatro pruebas.
- **L6:** El checkout se corrigió tras la primera captura: sin sesión esconde el resumen entero, así que ahora muestra productos y total con la invitación a iniciar sesión en el resumen. Las notas sólo aparecen con sesión, para no perderlas en el redirect.
- **L7:** Verificación visual con mock en `:8080` y `vite preview` en `:4200`, Chrome headless por CDP. `PRODUCT.md` y `DESIGN.md` escritos; `.store-summary` movido de `CartPage.css` a `StoreLayout.css` por ser compartido.
- **L8:** Riesgo: ítem 2 (permisos: el checkout depende del rol Cliente y de la autorización de cada servicio) e ítem 3 (contratos compartidos: `login(returnTo)` y `RedirectHandler` los usa también el panel). La verificación independiente no pudo lanzarse: el runtime rechazó la delegación por permisos. Se compensó con `RedirectHandler.test.tsx` (3 pruebas nuevas: vuelve al destino pedido, cae en `/dashboard` sin destino, no interfiere fuera de `/login`).
- **L9 (2026-10-23, deploy):** Respaldo del servidor en `/tmp/frontend-src-backup-202610232357.tgz`. Se reemplazaron `src` y `public` completos para no dejar archivos viejos (`ProductSheet`), se reconstruyó sólo el contenedor `frontend` con `--no-deps`. Verificación en navegador real contra el dominio: 9 tarjetas, ficha con precio y stock de Oracle, "Agregaste 1 al carrito", contador, carrito con total y checkout pidiendo sesión con el resumen visible.
- **L10 (2026-10-23, pulido):** Las fotos venían sobre fondo blanco y se veían como un recorte pegado sobre la placa de papel; se agregó `mix-blend-mode: multiply` a `.store-plate__img`. Ocho de las nueve fotos se funden con el papel; la del micrófono tiene fondo gris y conserva un recuadro tenue.
