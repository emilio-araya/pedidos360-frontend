import type { SVGProps } from "react";

/** Íconos de la tienda: un mismo trazo y una misma caja de 24 px. */
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}

export function CartIcon() {
  return (
    <Icon>
      <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L20 8H6.1" />
      <circle cx="9.5" cy="19.5" r="1.2" />
      <circle cx="17" cy="19.5" r="1.2" />
    </Icon>
  );
}

export function MinusIcon() {
  return (
    <Icon>
      <path d="M6 12h12" />
    </Icon>
  );
}

export function PlusIcon() {
  return (
    <Icon>
      <path d="M12 6v12M6 12h12" />
    </Icon>
  );
}

export function TrashIcon() {
  return (
    <Icon>
      <path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l.8 12h9.4l.8-12M10 11v5M14 11v5" />
    </Icon>
  );
}

export function ChevronIcon() {
  return (
    <Icon width="16" height="16">
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}
