import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth/AuthContext";
import { createCatalogService } from "../api/services";
import { CatalogPage } from "./CatalogPage";

vi.mock("../auth/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../api/services", async () => {
  const actual =
    await vi.importActual<typeof import("../api/services")>("../api/services");
  return { ...actual, createCatalogService: vi.fn() };
});

const product = {
  id: "p-1",
  sku: "P-001",
  name: "Mouse inalámbrico",
  description: "Mouse compacto con receptor USB",
  price: 19990,
  stock: 25,
  active: true,
  imageUrl: "/img/mouse.jpg",
};

const update = vi.fn(async () => product);
const create = vi.fn(async () => product);

beforeEach(() => {
  update.mockClear();
  create.mockClear();
  vi.mocked(useAuth).mockReturnValue({
    canManageCatalog: true,
    getAccessToken: vi.fn(async () => "token"),
  } as never);
  vi.mocked(createCatalogService).mockReturnValue({
    list: vi.fn(async () => ({
      content: [product],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    })),
    update,
    create,
  } as never);
});

describe("CatalogPage", () => {
  it("conserva la foto del producto al editarlo", async () => {
    render(<CatalogPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Editar" }));

    expect(screen.getByLabelText("Imagen (URL)")).toHaveProperty(
      "value",
      "/img/mouse.jpg",
    );

    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(update).toHaveBeenCalledWith(
      "p-1",
      expect.objectContaining({ imageUrl: "/img/mouse.jpg" }),
    );
  });

  it("rechaza una imagen que no es https ni ruta del sitio", async () => {
    render(<CatalogPage />);
    await screen.findByRole("button", { name: "Editar" });

    await userEvent.type(screen.getByLabelText("SKU"), "P-010");
    await userEvent.type(screen.getByLabelText("Nombre"), "Producto");
    await userEvent.type(
      screen.getByLabelText("Imagen (URL)"),
      "javascript:alert(1)",
    );
    await userEvent.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(create).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        "La imagen debe ser una URL https:// o una ruta del sitio como /img/foto.jpg.",
      ),
    ).toBeTruthy();
  });
});
