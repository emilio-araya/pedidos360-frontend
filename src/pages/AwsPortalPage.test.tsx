import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../api/client";
import { useCognitoAuth } from "../auth/CognitoAuthContext";
import { AwsPortalPage } from "./AwsPortalPage";

vi.mock("../api/client", () => ({ apiRequest: vi.fn() }));
vi.mock("../auth/CognitoAuthContext", () => ({ useCognitoAuth: vi.fn() }));

const mockedApiRequest = vi.mocked(apiRequest);
const mockedUseCognitoAuth = vi.mocked(useCognitoAuth);

beforeEach(() => {
  vi.clearAllMocks();
  mockedApiRequest.mockResolvedValue([]);
  mockedUseCognitoAuth.mockReturnValue({
    username: "cognito-user",
    groups: ["Cliente"],
    getAccessToken: vi.fn(async () => "cognito-access-token"),
    logout: vi.fn(async () => undefined),
  } as never);
});

describe("AwsPortalPage", () => {
  it("consulta únicamente el namespace /aws/api con el token Cognito", async () => {
    render(
      <MemoryRouter>
        <AwsPortalPage />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(mockedApiRequest).toHaveBeenCalledWith(
        "/aws/api/orders",
        "cognito-access-token",
      ),
    );
    expect(mockedApiRequest).toHaveBeenCalledWith(
      "/aws/api/catalog/products",
      "cognito-access-token",
    );
    expect(screen.getByText(/Módulos AWS/i)).toBeInTheDocument();
  });

  it("muestra estado de carga mientras consulta los datos", () => {
    mockedApiRequest.mockReturnValue(new Promise(() => {})); // Nunca resuelve
    render(
      <MemoryRouter>
        <AwsPortalPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Cargando información…")).toBeInTheDocument();
  });

  it("muestra error cuando la API falla con un Error", async () => {
    mockedApiRequest.mockRejectedValue(new Error("Error de conexión"));
    render(
      <MemoryRouter>
        <AwsPortalPage />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Error de conexión"),
    );
  });

  it("muestra error genérico cuando la API falla con un no-Error", async () => {
    mockedApiRequest.mockRejectedValue("string error");
    render(
      <MemoryRouter>
        <AwsPortalPage />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "No fue posible consultar los módulos AWS.",
      ),
    );
  });

  it("muestra listas vacías cuando la API retorna arrays vacíos", async () => {
    mockedApiRequest.mockResolvedValue([]);
    render(
      <MemoryRouter>
        <AwsPortalPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getAllByText("Pedidos").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Productos").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("normaliza y muestra pedidos y productos correctamente", async () => {
    mockedApiRequest.mockImplementation(async (url: string) => {
      if (url.includes("/orders")) {
        return [
          {
            id: "1",
            orderNumber: "PED-1",
            customerId: "oid-1",
            status: "CREADO",
            items: [],
            total: "100",
            stockReserved: false,
            createdAt: "2026-01-01",
          },
        ];
      }
      if (url.includes("/catalog/products")) {
        return [
          {
            id: "p1",
            sku: "SKU-1",
            name: "Producto Test",
            description: "Descripción",
            price: "50",
            stock: 10,
            active: true,
          },
        ];
      }
      return [];
    });
    render(
      <MemoryRouter>
        <AwsPortalPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("PED-1")).toBeInTheDocument();
      expect(screen.getByText("Producto Test")).toBeInTheDocument();
    });
  });
});
