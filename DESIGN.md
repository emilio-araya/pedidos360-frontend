# Design

<!-- impeccable:design-schema 1 -->

## Visual World

Papel y tinta: la tienda se lee como un catálogo impreso de computación. Fondo papel cálido, texto tinta casi negra, un único acento terracota reservado a la acción principal y filetes dorados como separadores. Sin degradados decorativos, sin tarjetas flotantes con sombra difusa, sin insignias de confianza.

## Tokens

- Papel: `--paper` (#f6f1e7), `--paper-light`, `--paper-mid`, `--paper-deep`.
- Superficie: `--surface` (#fffdf9) para tarjetas y recuadros; `--border` (#e2d8c8) para filetes.
- Tinta: `--ink` (#17130e) y `--muted` (#6a6257).
- Acento: `--brand` terracota, `--brand-dark` para texto sobre papel, `--brand-soft` para hover y fondos suaves, `--on-brand` para texto sobre el acento.
- Estado: `--success*` verde, `--danger*` rojo, ámbar para stock bajo (definido en `PriceStock.css`).
- Todos viven en `:root` de `src/styles.css`; ninguna página los redefine.

## Typography

- Titulares, precios, números de pedido y títulos de página: Instrument Serif (`--font-display`), peso 400, tracking entre -0.02em y -0.01em, `text-wrap: balance` en titulares.
- Interfaz, cuerpo y controles: DM Sans. El cuerpo se mantiene entre 65 y 75 caracteres por línea.
- Cifras monetarias siempre tabulares.

## Layout

- Ancho de página: `--store-width` (`min(1240px, 100% - 3rem)`).
- Página de producto: dos columnas (foto ~58%, recuadro de compra pegajoso a 96px del borde).
- Carrito y checkout: contenido + resumen pegajoso de 18–22rem.
- Confirmación: comprobante + bloque "Qué sigue".
- Por debajo de 860–900px todo pasa a una columna y lo pegajoso deja de serlo.

## Signature Move

Los totales se componen como lista de precios de catálogo impreso: concepto, línea de puntos y importe alineado a la derecha con cifras tabulares (`.store-ledger`). Aparece en carrito, checkout y confirmación; es lo que hace que el flujo de compra se sienta parte del mismo mundo y no un formulario pegado.

## Components

- `StoreLayout`: barra con marca, sesión y carrito con contador; pie con créditos de las fotos.
- `ProductPlate`: foto del producto sobre placa; variantes `card`, `page` y `thumb`.
- `PriceStock`: precio en serif y etiqueta de stock (verde, ámbar, rojo).
- `QuantityStepper`: cantidad entre 1 y el stock, con botones e ingreso numérico; variante `compact` para líneas del carrito.
- `OrderLedger`: la lista de precios descrita arriba.
- `icons.tsx`: íconos dibujados en SVG, trazo 1.75, caja de 24px.

## Motion

- Entrada escalonada de tarjetas y celdas de la hoja de contactos de la vitrina, con `--store-ease` (`cubic-bezier(0.16, 1, 0.3, 1)`).
- Transiciones de 140–160ms en hover de controles.
- Todo se apaga con `prefers-reduced-motion: reduce`.

## Truth Rules

- No se inventan reseñas, calificaciones, vendedores, envíos, plazos, cuotas ni descuentos: el sistema no los respalda.
- El pedido queda registrado y pendiente de aceptación; nunca "pagado".
- Las fotos son de Wikimedia Commons en dominio público o CC0 y están acreditadas en el pie y en `public/img/CREDITS.md`.
