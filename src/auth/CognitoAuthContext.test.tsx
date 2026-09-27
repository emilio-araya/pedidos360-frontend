import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAuthSession, signInWithRedirect, signOut } from "aws-amplify/auth";
import { CognitoAuthProvider, useCognitoAuth } from "./CognitoAuthContext";

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("./cognito", () => ({ cognitoConfigured: true }));

const mockedFetchAuthSession = vi.mocked(fetchAuthSession);
const mockedSignIn = vi.mocked(signInWithRedirect);
const mockedSignOut = vi.mocked(signOut);

function token() {
  const payload = btoa(
    JSON.stringify({
      sub: "cognito-user-1",
      username: "test-user",
      "cognito:groups": ["Operador"],
    }),
  ).replace(/=/g, "");
  return `header.${payload}.signature`;
}

function Probe() {
  const { isAuthenticated, groups, username, login, logout } = useCognitoAuth();
  return (
    <div>
      <span data-testid="state">{isAuthenticated ? "authenticated" : "anonymous"}</span>
      <span data-testid="groups">{groups.join(",")}</span>
      <span data-testid="username">{username ?? ""}</span>
      <button onClick={() => void login()}>login</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

describe("CognitoAuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchAuthSession.mockResolvedValue({
      tokens: { accessToken: { toString: token } },
    } as never);
    mockedSignIn.mockResolvedValue(undefined);
    mockedSignOut.mockResolvedValue(undefined);
  });

  it("expone grupos desde el access token", async () => {
    render(
      <CognitoAuthProvider>
        <Probe />
      </CognitoAuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("authenticated"),
    );
    expect(screen.getByTestId("groups")).toHaveTextContent("Operador");
    expect(screen.getByTestId("username")).toHaveTextContent("test-user");
  });

  it("delega login y logout a Amplify", async () => {
    const user = userEvent.setup();
    render(
      <CognitoAuthProvider>
        <Probe />
      </CognitoAuthProvider>,
    );
    await user.click(screen.getByRole("button", { name: "login" }));
    await user.click(screen.getByRole("button", { name: "logout" }));
    expect(mockedSignIn).toHaveBeenCalledTimes(1);
    expect(mockedSignOut).toHaveBeenCalledTimes(1);
  });
});
