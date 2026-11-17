# Design

<!-- impeccable:design-schema 1 -->

## Visual World

**Tienda limpia:** un catálogo de escritorio moderno, no una bodega. Fondo gris de tienda
(`#f8fafc`), superficies blancas que se separan por sombra suave y no por reglas duras, texto
slate profundo (`#0f172a`) y un solo acento naranja (`#f97316`) reservado a la acción principal,
al precio y al dato que importa. Esquinas de 10 a 16px, nunca más; elevación declarada una sola
vez por superficie (borde *o* sombra); fotografías recortadas a 4:3 que llenan su marco. Sin
degradados decorativos, sin sombras de desplazamiento duro, sin franjas de peligro, sin
insignias de confianza.

## Tokens

- Superficie: `--cotton` (`#f8fafc`) canvas; `--cotton-deep` (`#f1f5f9`) relleno de placas;
  `--tag` (`#ffffff`) tarjetas; `--cotton-line` (`#e2e8f0`) filetes de 1px y
  `--cotton-line-strong` (`#cbd5e1`) para el filete del estado activo.
- Tinta: `--nylon` (`#0f172a`) texto principal y barra superior; `--ink-soft` (`#475569`)
  texto secundario; `--ink-faint` (`#64748b`) notas y placeholders (4.6:1 sobre el canvas).
- Acento: `--accent` (`#f97316`) acción principal y precio total; `--accent-deep`
  (`#ea580c`) para texto sobre superficie clara; `--accent-soft` (`#fff7ed`) relleno tenue.
  `--hazard` es un alias sólido del acento: no queda ningún degradado.
- Estado: `--success*` verde, `--warning*` ámbar, `--info*` azul, `--danger*` rojo,
  `--shipped*` índigo; cada uno con línea, suave y texto.
- Elevación: `--shadow-xs` a `--shadow-xl`, todas multicapa sobre `rgba(15, 23, 42, …)`
  con desplazamiento y difuminado; ninguna sombra de bloque.
- Curvatura: `--radius-xs` 4, `--radius-sm` 6, `--radius-md` 10, `--radius-lg` 16,
  `--radius-xl` 16 y `--radius-full`. El techo es 16px: una superficie anidada calcula el
  radio interior como 16 − padding, nunca repite el del contenedor.
- Todos viven en `:root` de `src/styles.css`; ninguna página los redefine.

## Typography

- Una sola familia: **Barlow** (400/500/600), auto-hospedada en `public/fonts/` (woff2,
  subconjunto latin, SIL OFL 1.1). Ninguna fuente externa; ninguna familia declarada sin uso.
- Titulares en `clamp()` con `letter-spacing` negativo (-0.02 a -0.03em) y
  `text-wrap: balance`. El cuerpo usa `text-wrap: pretty` y se mantiene entre 65 y 75
  caracteres por línea.
- Cifras monetarias y contadores siempre `font-variant-numeric: tabular-nums`.
- El resaltado del titular de portada y del login usa `box-decoration-break: clone` para que
  cada línea marcada conserve su propio padding y radio.
- `-webkit-font-smoothing: antialiased` en `:root`; sin `font-synthesis`.

## Layout

- Ancho de página: `--page-width` (`min(1240px, calc(100% - 2.5rem))`).
- Vitrina de inicio: portada a dos columnas con la promesa de marca y la etiqueta colgante
  con los hechos del catálogo; debajo, la grilla de productos.
- Grilla: `repeat(auto-fill, minmax(16.5rem, 1fr))`, 24px de separación; una columna en
  pantallas angostas.
- Página de producto: placa 4:3 a la izquierda, recuadro de compra pegajoso a la derecha.
- Carrito y checkout: contenido + resumen pegajoso con lista de precios (`.store-ledger`).
- Login: panel oscuro con la promesa a la izquierda y tarjeta de acceso a la derecha.
- Por debajo de 860–900px todo pasa a una columna y lo pegajoso deja de serlo.

## Signature Move

Los totales se componen como lista de precios de catálogo impreso: concepto, línea de puntos y
importe alineado a la derecha con cifras tabulares (`.store-ledger`). Aparece en carrito,
checkout y confirmación. La segunda firma es la etiqueta colgante de la portada: perforación,
inclinación de -1° y un solo balanceo al cargar.

## Components

- `StoreLayout`: barra superior sticky con marca, sesión y carrito con contador; pie con los
  créditos de las fotos.
- `StorePage`: portada, etiqueta colgante (`store-tag`) con `TAG_FACTS` y la banda de fotos
  destacadas (`Showcase`).
- `ProductPlate`: foto del producto o placa con la inicial; variantes `card` (4:3), `page`
  (4:3) y `thumb` (1:1). La foto usa `object-fit: cover` y no deja aire variable entre
  tarjetas.
- `ProductCard`: tarjeta con borde de 1px en reposo; la sombra entra sólo en hover, junto con
  un desplazamiento de -2px. El enlace que cubre la tarjeta dibuja su anillo de foco hacia
  adentro (`outline-offset: -4px`) porque la tarjeta recorta el overflow.
- `PriceStock`: precio tabular y etiqueta de stock (verde, ámbar, rojo).
- `QuantityStepper`: cantidad entre 1 y el stock, con botones de 40px e ingreso numérico;
  variante `compact` para las líneas del carrito.
- `OrderLedger`: la lista de precios descrita arriba.
- `icons.tsx`: íconos SVG en `currentColor`, trazo 1.75, caja de 24px.

## Motion

- Entrada escalonada de tarjetas (`store-rise`, 420ms, 45ms entre tarjetas) con
  `--store-ease` (`cubic-bezier(0.2, 0.9, 0.25, 1)`).
- Transiciones de 150–200ms y siempre por propiedad explícita: nunca `transition: all`.
- El hover no mueve más de 2px y el clic de un botón aplica `scale(0.96)`.
- Todo se apaga con `prefers-reduced-motion: reduce`.

## Assets

- `public/img/` contiene nueve fotos de Wikimedia Commons en dominio público o CC0,
  acreditadas en el pie y en `public/img/CREDITS.md`, normalizadas a 900×675 (4:3) para que
  todas las placas encuadren igual.

## Truth Rules

- No se inventan reseñas, calificaciones, vendedores, envíos, plazos, cuotas ni descuentos:
  el sistema no los respalda.
- El pedido queda registrado y pendiente de aceptación; nunca "pagado".

## Craft Floor (aplicado a todo el rediseño)

- Sin kickers ni eyebrows encima de los titulares de la tienda: el titular habla por sí solo.
- Sin `border-left`/`border-right` coloreado por encima de 1px: las marcas de estado son
  puntos llenos o bordes de 1px.
- Sin sombras de desplazamiento duro: el hover de la tarjeta sube 2px y usa una sombra
  difuminada real.
- Elevación declarada una sola vez por superficie: borde en reposo, sombra en el estado
  elevado.
- Cuerpo y placeholder ≥ 4.5:1; titulares grandes ≥ 3:1.
