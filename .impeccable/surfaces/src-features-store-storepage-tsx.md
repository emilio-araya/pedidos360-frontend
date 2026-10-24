---
version: 1
slug: "src-features-store-storepage-tsx"
primary_target: "src/features/store/StorePage.tsx"
related_targets: ["src/features/store/ProductPage.tsx","src/features/store/CartPage.tsx","src/features/store/CheckoutPage.tsx","src/features/store/OrderConfirmationPage.tsx"]
---

# Storefront purchase flow

Scope: public storefront purchase flow — product page `/producto/:id`, cart `/carrito`, checkout `/checkout`, confirmation `/pedido/:id`. Visitor mode: Operate (the visitor came to complete a purchase). Audience and job per PRODUCT.md: visitors browse without an account; organization accounts sign in only to register the order.

Constraints: frontend only; no invented reviews, sellers, shipping, payment, installments or discounts; the order is registered and pending acceptance, never "paid".

## Direction contract

THESIS: Mercado Libre's purchase path, played straight and truthful: product, cart, identity, confirmation. It refuses the category's trust theatre (stars, badges, shipping promises, countdowns) because the system cannot back them.

OWN-WORLD: the incumbent paper-and-ink storefront: paper ground, ink text, one terracotta accent reserved for the primary action, gold only as a hairline, Instrument Serif for titles and prices, DM Sans for every control, white surfaces at 12–16px radii, green/amber/red stock chips, standard web controls.

STORY: the visitor sees the real price and stock, chooses a quantity, adds to the cart or buys now, reviews the cart, signs in only to confirm, and leaves with an order number and its real state.

FIRST VIEWPORT: product page — store header with a cart button and count; a breadcrumb back to the catalog; left, the photo plate at about 58% width; right, the name, the serif price, the stock chip, a quantity stepper, "Comprar ahora" (terracotta, full width) above "Agregar al carrito"; one quiet line stating the order is registered without online payment.

FORM: category canon, user-pinned ("como Mercado Libre"); position 1 of 1; seed key: none (pinned direction, concept-seed not run). Signature move: totals set as a printed catalog price list — item, dot leader, tabular price — in the cart, checkout and confirmation.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
