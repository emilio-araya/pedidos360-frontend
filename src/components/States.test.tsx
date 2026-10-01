import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorState, LoadingState } from "./States";

describe("States", () => {
  describe("LoadingState", () => {
    it("muestra el label por defecto", () => {
      render(<LoadingState />);
      expect(screen.getByText("Cargando información…")).toBeInTheDocument();
    });

    it("muestra un label personalizado", () => {
      render(<LoadingState label="Cargando pedidos…" />);
      expect(screen.getByText("Cargando pedidos…")).toBeInTheDocument();
    });
  });

  describe("ErrorState", () => {
    it("muestra el mensaje de error", () => {
      render(<ErrorState message="Error de conexión" />);
      expect(screen.getByText("Error de conexión")).toBeInTheDocument();
    });

    it("muestra el botón de reintentar cuando onRetry está definido", async () => {
      const onRetry = vi.fn();
      const user = userEvent.setup();
      render(<ErrorState message="Error" onRetry={onRetry} />);
      const button = screen.getByRole("button", { name: /reintentar/i });
      expect(button).toBeInTheDocument();
      await user.click(button);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("no muestra el botón de reintentar cuando onRetry no está definido", () => {
      render(<ErrorState message="Error" />);
      expect(
        screen.queryByRole("button", { name: /reintentar/i }),
      ).not.toBeInTheDocument();
    });
  });
});
