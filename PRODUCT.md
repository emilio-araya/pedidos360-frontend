# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Visitantes**: compañeros y evaluadores que recorren el catálogo público sin cuenta.
- **Clientes**: personas con cuenta de la organización en Microsoft Entra ID que arman y registran un pedido.
- **Operadores y administradores**: gestionan el catálogo, el stock y el ciclo de los pedidos desde el panel.

## Product Purpose

Pedidos360 es un proyecto de portafolio universitario: una plataforma de gestión de pedidos sobre microservicios (catálogo, pedidos y BFF) con una vitrina pública. El éxito es que un visitante encuentre un producto, arme su pedido y lo registre con su cuenta, y que el panel lo procese de punta a punta.

## Positioning

El catálogo es abierto: se mira sin cuenta y la identidad se pide recién al registrar el pedido. La seguridad es real (Entra ID, roles y autorización en cada servicio), no decorativa.

## Operating Context

- Demo desplegada en una instancia EC2, detrás de Caddy con HTTPS y dominio DuckDNS.
- Inicio de sesión con Microsoft Entra ID; el tenant acepta solo cuentas de la organización.
- Roles: Admin, Operador y Cliente. Un usuario sin rol recibe 403 en los servicios.
- Un pedido nace en estado "Creado" y un operador lo acepta; luego pasa por preparación, despacho y entrega, o se cancela.

## Capabilities and Constraints

- Catálogo público paginado (`page`, `size`). No hay búsqueda, orden ni categorías en el backend.
- Detalle público de producto por id.
- Un pedido admite varios ítems (producto y cantidad) y notas opcionales.
- No hay pago en línea: es una demo. La confirmación dice que el pedido quedó registrado y pendiente de aceptación, sin mencionar pago.
- Moneda: pesos chilenos (CLP). Textos en español neutro, tratando de "tú".
- Alcance decidido para la vitrina tipo marketplace: página de producto con URL propia, carrito con cantidades limitadas por stock, checkout que pide inicio de sesión y crea el pedido, y pantalla de confirmación. Solo frontend.

## Brand Commitments

- Nombre: Pedidos360, con la marca "P" y el sufijo "360".
- Frase de la vitrina: "Mira primero. Después decides."

## Evidence on Hand

- Nueve productos de ejemplo con fotos de Wikimedia Commons en dominio público o CC0 (`public/img/`, créditos en `public/img/CREDITS.md`).
- No existen y no deben inventarse: reseñas, calificaciones, vendedores, envíos, plazos de entrega, pagos, cuotas, descuentos, testimonios ni cifras de ventas.

## Product Principles

1. Verdad antes que imitación: se toma de los marketplaces la forma de comprar, nunca promesas que el sistema no cumple.
2. Mirar no exige cuenta; la sesión se pide solo cuando hace falta.
3. Lo que la interfaz muestra lo respalda el backend: stock, estados y permisos.
4. Una demo honesta: los datos de ejemplo se presentan como lo que son.
