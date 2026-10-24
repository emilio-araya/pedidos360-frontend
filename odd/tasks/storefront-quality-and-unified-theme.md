# Storefront quality and unified theme

Objective: one warm "paper and ink" theme for the public storefront and the signed-in panel, plus the quality fixes from the thermo-nuclear review, applied in the agreed order.
Branch: `feat/public-storefront` (frontend). Delivery: no commits until the user asks explicitly (standing user rule). Test runner: `npx vitest run`, `npx tsc --noEmit`, `npm run build`.

## Specs

- **S1 — Unified theme.** User: "quiero k las 2 secciones de paguina tengan la misma tema". Review step 1: "Pasar el tema a variables globales y borrar las sobrescrituras." Scope: move the paper-and-ink palette to `:root` in `src/styles.css`, replace hardcoded colors with tokens, delete the `.store` token override block and the `.store .topbar` / `.store .brand b` / `.store .button--ghost` overrides. Acceptance: the panel inherits the theme without per-page overrides; the storefront looks the same as before; Microsoft logo colors stay literal (third-party brand mark). Checks: `tsc`, `vitest`, `build`, desktop screenshots of the storefront and the login page.
- **S2 — Load-failure bug.** Review P1: "si falla la carga, la página dice dos cosas que se contradicen" and "`load` no cancela pedidos anteriores". Scope: single exclusive state (`loading | error | ready`) inside a `useCatalogPage(page)` hook that ignores stale responses. Acceptance: on load failure the empty-state text "Todavía no hay productos publicados" is absent; an older page response arriving last does not replace the newer page. Checks: RED test first, then GREEN.
- **S3 — Decompose and native dialog.** Review step 3: "Dividir el archivo y pasar la ficha a `<dialog>` en el mismo movimiento." Scope: `src/features/store/` with `StorePage.tsx`, `useCatalogPage.ts`, `ProductCard.tsx`, `ProductSheet.tsx`, `ProductPlate.tsx`, `Showcase.tsx`, `productDisplay.ts`; native `<dialog>` with `showModal()`; remove dead `closeRef`; review P3 items that the split touches (shared price/stock block, `formatProductCount`, plate-owned CSS block, typed CSS custom property, type-guard filter). Acceptance: behavior unchanged, all storefront tests green (jsdom shim for `showModal`).
- **S4 — Security (pending scope).** User: "que todo funcione como un paguina real con ceguridad y todo". Not scoped yet; needs an audit and a user decision before tasks are created.

## Tasks

| ID | Specs | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | S1 | inline | done | Tokens moved to `:root`; `.store` override block and 4 global overrides deleted; only neutral black shadows, one mask and the Microsoft logo colors stay literal; `theme-color` → `#f6f1e7`; serif titles in panel headings. `tsc` OK, 93/93 tests, build OK; screenshots of storefront (unchanged), login, dashboard, catalog, orders. |
| T2 | S2 | inline | done | RED: 2 new tests failed for the right reason (empty-state `<strong>` present on failure; late page `<h3>` rendered). GREEN: `src/features/store/useCatalogPage.ts` (exclusive `loading | error | ready` state, stale responses ignored, `retry`); storefront 15/15, full suite 95/95. |
| T3 | S3 | inline | done | `src/features/store/` (StorePage 516→146 lines; largest component 146); native `<dialog>` + `showModal()`; jsdom shim in `src/test/setup.ts`; Escape/focus test replaced by tests of our `close` wiring and backdrop click; `PriceStock`, `formatProductCount`, `store-plate` block, typed `--i`, `hasPhoto` guard, `.store-shimmer` utility, footer reuses `<Brand>`. `tsc` OK, 96/96, build OK. Real Chrome (CDP): Enter opens, focus inside, scroll locked, background inert, Escape closes, focus returns to card, backdrop click closes. |
| T4 | S1-S3 | inline | done | Server files matched the last deploy byte for byte (no server-only edits); backup `/tmp/frontend-backup-202610232300.tgz` on the server; old `src/pages/StorePage.*` removed there; Docker build ran `tsc --noEmit && vite build`. Production: HTTPS 200, `theme-color` `#f6f1e7`, CSS has `--paper`, JS has `showModal`; real Chrome against the domain: Enter opens, focus inside, scroll locked, background inert, Escape closes, focus returns, backdrop click closes; screenshots of storefront and login. |

## Log

- **L1 (2026-10-23, user):** "ya listo ahora quiero k las 2 secciones de paguina tengan la misma tema y que todo funcione como un paguina real con ceguridad y todo"
- **L2 (2026-10-23, user):** "si aplica en este orden" — after the review proposed: 1) global tokens and delete overrides, 2) P1 bug with hook and single state, test first, 3) split the file and move the sheet to `<dialog>`.
- **L3:** Review evidence: `styles.css` has ~70 hex/rgba literals (1167 lines); `StorePage.css` has 35 hex + 17 rgba and overrides 6 global tokens plus 4 global component rules; `StorePage.tsx` is 516 lines with 6 components.
- **L4 (T1):** Engram mirror pending: `mem_save` returned `ambiguous_project` (Engram resolves from `/home/emilio`). Temporary visual harness added (`vite.preview.config.ts`, `src/__preview__/fakeAuth.tsx`, mock on :8080) — must be deleted before closing.
- **L5 (T3):** Deliberate small visual changes: out-of-stock photos are also muted inside the sheet (the plate owns that rule now); the footer shows the shared brand lockup with the tagline "Catálogo público". Temporary harness deleted; local servers stopped.
- **L6:** `gentle-ai review assess` (untracked files declared): risk medium, `review_due: false` (`under_budget`), 33 paths / 3043 lines. Native tier wins → self-verification only; no native review started.
- **L7 (T4):** Deployed to EC2 `54.157.254.255` after the user updated the SSH rule to `191.126.17.28/32`. S4 (security) remains unscoped.
