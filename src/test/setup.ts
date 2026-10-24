import "@testing-library/jest-dom/vitest";

// jsdom no implementa el diálogo modal. Este shim sólo marca `open` y dispara
// `close`; el bloqueo del resto de la página, Escape y la devolución del foco
// son del navegador y se verifican en un navegador real, no acá.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
