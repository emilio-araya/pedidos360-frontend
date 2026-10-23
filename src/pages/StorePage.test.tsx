import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../api/client";
import { StorePage } from "./StorePage";

vi.mock("../auth/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../api/client")>("../api/client");
  return { ...actual, apiRequest: vi.fn() };
});

const mockedUseAuth = vi.mocked(useAuth);
const mockedApiRequest = vi.mocked(apiRequest);
const login = vi.fn(async () => undefined);

beforeEach(() => {
  login.mockClear();
  mockedApiRequest.mockReset();
  mockedUseAuth.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    login,
  } as never);
});

describe("StorePage", () => {
  it("muestra el catálogo sin sesión y pide login al crear un pedido", async () => {
    mockedApiRequest.mockResolvedValue({
      content: [
        {
          id: "1",
          sku: "SKU-1",
          name: "Teclado",
          description: "Mecánico",
          price: 25000,
          stock: 3,
          active: true,
        },
      ],
      page: 0,
      size: 12,
      totalElements: 1,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <StorePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Teclado")).toBeTruthy();
    expect(mockedApiRequest.mock.calls[0][0]).toBe(
      "/api/catalog/products?page=0&size=12",
    );
    expect(mockedApiRequest.mock.calls[0][1]).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Crear pedido" }));

    expect(login).toHaveBeenCalledTimes(1);
  });

  it("muestra la foto del producto cuando el catálogo la informa", async () => {
    mockedApiRequest.mockResolvedValue({
      content: [
        {
          id: "2",
          sku: "P-001",
          name: "Mouse inalámbrico",
          description: null,
          price: 19990,
          stock: 25,
          active: true,
          imageUrl: "/img/mouse.jpg",
        },
        {
          id: "3",
          sku: "P-009",
          name: "Producto sin foto",
          description: null,
          price: 1000,
          stock: 1,
          active: true,
        },
      ],
      page: 0,
      size: 12,
      totalElements: 2,
      totalPages: 1,
    });

    render(
      <MemoryRouter>
        <StorePage />
      </MemoryRouter>,
    );

    const photo = await screen.findByRole("img", { name: "Mouse inalámbrico" });
    expect(photo.getAttribute("src")).toBe("/img/mouse.jpg");
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });
});
