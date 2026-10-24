import { useId } from "react";
import { MinusIcon, PlusIcon } from "./icons";
import "./QuantityStepper.css";

/** Cantidad entre 1 y el stock disponible, con botones y entrada numérica. */
export function QuantityStepper({
  value,
  max,
  onChange,
  disabled = false,
  compact = false,
}: {
  value: number;
  max: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  /** Sin rótulo visible (sigue disponible para lectores de pantalla). */
  compact?: boolean;
}) {
  const id = useId();
  const clamp = (quantity: number) =>
    Math.min(Math.max(1, Math.floor(quantity) || 1), Math.max(1, max));

  return (
    <div className={`store-stepper${compact ? " store-stepper--compact" : ""}`}>
      <label className="store-stepper__label" htmlFor={id}>
        Cantidad
      </label>
      <div className="store-stepper__control">
        <button
          type="button"
          aria-label="Quitar una unidad"
          disabled={disabled || value <= 1}
          onClick={() => onChange(clamp(value - 1))}
        >
          <MinusIcon />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
        />
        <button
          type="button"
          aria-label="Agregar una unidad"
          disabled={disabled || value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          <PlusIcon />
        </button>
      </div>
      {max > 0 ? (
        <span className="store-stepper__hint">de {max} disponibles</span>
      ) : null}
    </div>
  );
}
