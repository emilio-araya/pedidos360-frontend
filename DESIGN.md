# Design

<!-- impeccable:design-schema 1 -->

## Visual World

**Etiqueta industrial:** la tienda se lee como una bodega de precinto y tela. Fondo algodón (`#f2f2ee`), texto nailon (`#0d0d0d`), un solo acento naranja de seguridad (`#ff5c00`) reservado a lo crítico y a la acción principal, esquinas rectas, reglas de 1px, franjas de peligro para lo que no puede fallar y etiquetas de precinto con muesca como objeto firma. Sin degradados decorativos, sin tarjetas flotantes con sombra difusa, sin insignias de confianza, sin glifos sueltos como iconos.

## Tokens

- Algodón: `--cotton` (`#f2f2ee`) fondo de tarjetas y superficies; `--cotton-line` para filetes de 1px.
- Nailon: `--nylon` (`#0d0d0d`) texto principal y reglas; `--nylon-line` para bordes oscuros.
- Acero suave: `--ink-faint` (`#6b6b63`) texto secundario, alcanza contraste AA.
- Acento: `--hazard` (`#ff5c00`) naranja de seguridad para lo crítico y la acción principal; `--hazard-soft` fondo suave sobre naranja; `--on-hazard` texto sobre el acento.
- Estado: `--danger*` rojo, `--info*` azul, `--success*` verde; cada uno con línea, oscuro, suave y texto.
- Todos viven en `:root` de `src/styles.css`; ninguna página los redefine.

## Typography

- Nombres de zona, etiquetas de precinto y precios: **Barlow Condensed** (500/600/700), mayúsculas rectas, tracking amplio, `text-wrap: balance` en titulares.
- Cuerpo, interfaz y controles: **Barlow** (400/500/600). El cuerpo se mantiene entre 65 y 75 caracteres por línea.
- Cifras monetarias siempre tabulares.
- Ambas familias auto-hospedadas en `public/fonts/` (woff2, subconjunto latin, SIL OFL 1.1); ninguna fuente externa.

## Layout

- Ancho de página: `--store-width` (`min(1240px, 100% - 3rem)`).
- Vitrina de inicio: hero con la promesa de marca y la etiqueta colgante giratoria con los hechos del catálogo.
- Página de producto: placa de foto a la izquierda, recuadro de compra a la derecha.
- Carrito y checkout: contenido + resumen pegajoso de tipo lista de precios (`.store-ledger`).
- Confirmación: comprobante + bloque "Qué sigue".
- Seguimiento de invitado: solicitud de enlace y motivo de cancelación con sus propias marcas de estado.
- Por debajo de 860–900px todo pasa a una columna y lo pegajoso deja de serlo.

## Signature Move

Los totales se componen como lista de precios de catálogo impreso: concepto, línea de puntos y importe alineado a la derecha con cifras tabulares (`.store-ledger`). Aparece en carrito, checkout y confirmación; es lo que hace que el flujo de compra se sienta parte del mismo mundo y no un formulario pegado. La etiqueta colgante del hero se balancea una sola vez al cargar y mantiene su inclinación dentro del viewport en cada ancho.

## Components

- `StoreLayout`: barra con marca, sesión y carrito con contador; pie con créditos de las fotos.
- `StorePage`: hero, etiqueta colgante (`store-tag`) con `TAG_FACTS`, hoja de contacto de placas (`store-shelf`).
- `ProductPlate`: foto del producto sobre placa; variantes `card`, `page` y `thumb`.
- `PriceStock`: precio en condensed y etiqueta de stock (verde, ámbar, rojo).
- `QuantityStepper`: cantidad entre 1 y el stock, con botones e ingreso numérico; variante `compact` para líneas del carrito.
- `OrderLedger`: la lista de precios descrita arriba.
- `icons.tsx`: íconos dibujados en SVG, trazo 1.75, caja de 24px; el aviso de seguridad usa un cuadrado de peligro dibujado (`.security-icon`), nunca un glifo suelto.

## Motion

- Entrada escalonada de tarjetas y celdas de la hoja de contacto de la vitrina, con `--store-ease` (`cubic-bezier(0.16, 1, 0.3, 1)`).
- Transiciones de 140–160ms en hover de controles.
- Todo se apaga con `prefers-reduced-motion: reduce`.

## Truth Rules

- No se inventan reseñas, calificaciones, vendedores, envíos, plazos, cuotas ni descuentos: el sistema no los respalda.
- El pedido queda registrado y pendiente de aceptación; nunca "pagado".
- Las fotos son de Wikimedia Commons en dominio público o CC0 y están acreditadas en el pie y en `public/img/CREDITS.md`.

## Craft Floor (aplicado a todo el rediseño)

- Sin kickers ni eyebrows encima de los titulares: el titular habla por sí solo.
- Sin `border-left`/`border-right` coloreado por encima de 1px: las marcas de estado son cuadrados llenos (`::before`) o bordes de 1px.
- Sin sombras de desplazamiento duro fuera de un mundo neobrutalista: el hover de la tarjeta sube sutil y refuerza el borde, sin bloque de sombra cero-difuminado.
- Texto de placeholder con contraste suficiente (`--ink-faint`), nunca gris vacío.
- Cuerpo y placeholder ≥ 4.5:1; titulares grandes ≥ 3:1.
