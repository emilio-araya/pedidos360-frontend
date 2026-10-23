import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Brand } from "./Brand";

function renderBrand(tagline?: string) {
  return render(
    <MemoryRouter>
      <Brand to="/shop" tagline={tagline} />
    </MemoryRouter>,
  );
}

describe("Brand", () => {
  it("lleva a la ruta indicada y omite la bajada si no se pide", () => {
    renderBrand();

    expect(screen.getByRole("link").getAttribute("href")).toBe("/shop");
    expect(screen.getByText("360")).toBeTruthy();
    expect(screen.queryByText("Operación simple, en un solo lugar")).toBeNull();
  });

  it("muestra la bajada cuando la recibe", () => {
    renderBrand("Operación simple, en un solo lugar");

    expect(
      screen.getByText("Operación simple, en un solo lugar"),
    ).toBeTruthy();
  });
});
