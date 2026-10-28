const LOGIN_RETURN_KEY = "pedidos360.login-return";

/**
 * Recuerda a dónde volver después del inicio de sesión. El carrito y este
 * destino viven en la pestaña: sobreviven a la ida y vuelta con Entra ID.
 */
export function rememberLoginReturn(path: string): void {
  try {
    sessionStorage.setItem(LOGIN_RETURN_KEY, path);
  } catch {
    // Sin almacenamiento disponible el inicio de sesión sigue funcionando:
    // simplemente vuelve al panel.
  }
}

/** Devuelve el destino guardado una sola vez; sólo acepta rutas internas. */
export function consumeLoginReturn(): string | null {
  try {
    const value = sessionStorage.getItem(LOGIN_RETURN_KEY);
    sessionStorage.removeItem(LOGIN_RETURN_KEY);
    return value && value.startsWith("/") && !value.startsWith("//")
      ? value
      : null;
  } catch {
    return null;
  }
}
