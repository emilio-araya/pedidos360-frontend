import "react";

// Permite variables CSS (por ejemplo `--i`) en estilos en línea sin conversiones forzadas.
declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
