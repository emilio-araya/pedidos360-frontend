# Análisis de Cobertura de Ramas — Frontend

## Resumen actual

| Métrica | Valor | Umbral | Estado |
|---|---|---|---|
| Statements | 68.14% | — | — |
| Branches | 53.36% | 45% | ✅ |
| Functions | 67.56% | 60% | ✅ |
| Lines | 71.2% | 65% | ✅ |

## Archivos con ramas sin cubrir

### 1. `src/api/services.ts` — 34.09% branch coverage

**Líneas problemáticas:**

| Línea | Rama sin cubrir | Prueba necesaria |
|---|---|---|
| 22-25 | `normalizeOrder` con valores nulos/undefined | Probar `normalizeOrder({})` — todos los campos con defaults |
| 33-37 | `normalizeProduct` con valores nulos/undefined | Probar `normalizeProduct({})` — todos los campos con defaults |
| 54-159 | `createOrdersService` — múltiples ramas de acceso | Ver tabla abajo |
| 176-200 | `createCatalogService` — `requireManagement` y validación de stock | Ver tabla abajo |

**Pruebas específicas para `createOrdersService`:**

```typescript
// canView: acceso de cliente a pedido propio
// canView: acceso de cliente a pedido ajeno (debe filtrar)
// canView: acceso de personal (ve todos)
// list: cliente sin oid (retorna [])
// get: cliente sin permiso (throw 403)
// changeStatus: sin permiso (throw 403)
// cancel: estado no CREADO (throw 403)
// cancel: cliente sin permiso (throw 403)
```

**Pruebas específicas para `createCatalogService`:**

```typescript
// requireManagement: sin permiso (throw 403)
// updateStock: stock negativo (throw 400)
// updateStock: stock no entero (throw 400)
```

### 2. `src/auth/AuthContext.tsx` — 40.62% branch coverage

**Líneas problemáticas:**

| Línea | Rama sin cubrir | Prueba necesaria |
|---|---|---|
| 20 | `shouldSetActiveAccount` retorna false | Mock de MSAL donde `getActiveAccount()` ya es el correcto |
| 138-144 | `login` con error | Mock de `instance.loginRedirect` que rechaza |
| 173 | `logout` con error | Mock de `instance.logoutRedirect` que rechaza |

**Pruebas específicas:**

```typescript
// login: éxito (llama loginRedirect con scopes correctos)
// login: error (muestra mensaje de error)
// logout: éxito (limpia estado y redirige)
// logout: error (muestra mensaje de error)
// getAccessToken: sin cuenta activa (throw "No hay una sesión activa.")
// getAccessToken: éxito (retorna token)
```

### 3. `src/components/States.tsx` — 33.33% branch coverage

**Líneas problemáticas:**

| Línea | Rama sin cubrir | Prueba necesaria |
|---|---|---|
| 20 | `ErrorState` sin `onRetry` | Renderizar `<ErrorState message="Error" />` sin botón |

**Pruebas específicas:**

```typescript
// ErrorState: con onRetry (muestra botón)
// ErrorState: sin onRetry (no muestra botón)
// LoadingState: label por defecto
// LoadingState: label personalizado
```

### 4. `src/pages/AwsPortalPage.tsx` — 43.75% branch coverage

**Líneas problemáticas:**

| Línea | Rama sin cubrir | Prueba necesaria |
|---|---|---|
| 32-36 | `catch` con `reason` no Error | Mock de `apiRequest` que rechaza con string |
| 66-115 | Renderizado con datos vacíos | Mock que retorna arrays vacíos |

**Pruebas específicas:**

```typescript
// load: éxito con datos
// load: error con Error (muestra message)
// load: error con no-Error (muestra mensaje genérico)
// render: con órdenes y productos
// render: con arrays vacíos
// render: con error (muestra ErrorState)
// render: loading (muestra LoadingState)
```

### 5. `src/pages/LoginPage.tsx` — 56% branch coverage

**Líneas problemáticas:**

| Línea | Rama sin cubrir | Prueba necesaria |
|---|---|---|
| 23 | `cognitoRequested` true | Navegar con `state: { provider: "cognito" }` |
| 33-38 | `signIn` con error | Mock de `login` que rechaza |
| 49-54 | `signInCognito` con error | Mock de `loginCognito` que rechaza |
| 59 | `isLoading` true | Renderizar con `isLoading: true` |

**Pruebas específicas:**

```typescript
// signIn: éxito
// signIn: error (muestra alerta)
// signInCognito: éxito
// signInCognito: error (muestra alerta)
// cognitoRequested: true (no redirige)
// cognitoRequested: false + autenticado (redirige a /dashboard)
// isLoading: true (muestra "Validando sesión…")
// error: muestra alerta con mensaje
// cognitoConfigured: false (no muestra botón de Cognito)
```

### 6. `src/types.ts` — 25% branch coverage

**Líneas problemáticas:**

| Línea | Rama sin cubrir | Prueba necesaria |
|---|---|---|
| 87 | Tipo condicional | Verificar tipos con diferentes combinaciones |

---

## Plan de acción sugerido

### Prioridad 1: `src/api/services.ts` (impacto alto)

Agregar pruebas unitarias para:
1. `normalizeOrder` y `normalizeProduct` con objetos vacíos
2. `createOrdersService` — matriz de acceso (cliente propio, cliente ajeno, personal)
3. `createCatalogService` — validaciones de stock y permisos

**Archivo sugerido:** `src/api/services.test.ts`

### Prioridad 2: `src/auth/AuthContext.tsx` (impacto alto)

Agregar pruebas unitarias para:
1. `login` y `logout` con éxito y error
2. `getAccessToken` sin cuenta activa
3. Sincronización de cuenta con MSAL

**Archivo sugerido:** `src/auth/AuthContext.test.tsx`

### Prioridad 3: `src/components/States.tsx` (impacto medio)

Agregar pruebas unitarias para:
1. `ErrorState` con y sin `onRetry`
2. `LoadingState` con label por defecto y personalizado

**Archivo sugerido:** `src/components/States.test.tsx`

### Prioridad 4: `src/pages/AwsPortalPage.tsx` (impacto medio)

Agregar pruebas de integración para:
1. Carga exitosa con datos
2. Manejo de errores
3. Renderizado con estados vacíos

**Archivo sugerido:** `src/pages/AwsPortalPage.test.tsx`

### Prioridad 5: `src/pages/LoginPage.tsx` (impacto medio)

Agregar pruebas de integración para:
1. Flujo de login con éxito y error
2. Estado `cognitoRequested`
3. Renderizado condicional

**Archivo sugerido:** `src/pages/LoginPage.test.tsx`

---

## Meta

Al implementar estas pruebas, se espera alcanzar:

| Métrica | Actual | Meta |
|---|---|---|
| Branches | 53.36% | 70%+ |
| Statements | 68.14% | 80%+ |
| Functions | 67.56% | 80%+ |
| Lines | 71.2% | 80%+ |
