/** Tope del servidor para el correo del invitado. */
export const EMAIL_MAX = 254;

/**
 * Forma mínima de un correo: algo, una arroba, un dominio con punto y sin
 * espacios. La validación definitiva la hace el servidor.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mensaje del error, o `null` si el correo se puede enviar. */
export function validateEmail(
  value: string,
  emptyMessage = "Ingresa tu correo para recibir el comprobante.",
): string | null {
  const email = value.trim();
  if (email.length === 0) return emptyMessage;
  if (email.length > EMAIL_MAX)
    return `El correo no puede superar ${EMAIL_MAX} caracteres.`;
  if (!EMAIL_SHAPE.test(email))
    return "Ingresa un correo válido, por ejemplo nombre@dominio.cl.";
  return null;
}
