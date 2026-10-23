import { Link } from "react-router-dom";

interface BrandProps {
  /** Destino al tocar la marca: el panel en la app, la vitrina en público. */
  to: string;
  tagline?: string;
}

export function Brand({ to, tagline }: BrandProps) {
  return (
    <Link className="brand" to={to}>
      <span className="brand__mark" aria-hidden="true">
        P
      </span>
      <span>
        <strong>Pedidos</strong>
        <b>360</b>
      </span>
      {tagline ? <small>{tagline}</small> : null}
    </Link>
  );
}
