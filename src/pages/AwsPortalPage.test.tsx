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
});
