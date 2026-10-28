import { formatPrice } from "./productDisplay";

export interface LedgerItem {
  key: string;
  label: string;
  amount: number;
}

/**
 * Totales como lista de precios de catálogo impreso: concepto, línea de
 * puntos e importe en cifras tabulares.
 */
export function OrderLedger({
  items,
  total,
}: {
  items: LedgerItem[];
  total: number;
}) {
  return (
    <ul className="store-ledger">
      {items.map((item) => (
        <li className="store-ledger__row" key={item.key}>
          <span className="store-ledger__label">{item.label}</span>
          <span className="store-ledger__value">{formatPrice(item.amount)}</span>
        </li>
      ))}
      <li className="store-ledger__row store-ledger__row--total">
        <span className="store-ledger__label">Total</span>
        <span className="store-ledger__value" data-testid="order-total">
          {formatPrice(total)}
        </span>
      </li>
    </ul>
  );
}
