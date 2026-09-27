import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAuthSession,
  signInWithRedirect,
  signOut,
} from "aws-amplify/auth";
import { cognitoConfigured } from "./cognito";
import { environment } from "../config/environment";
import type { AppRole } from "../types";
import { cognitoRolesFromClaims } from "../utils/claims";

interface CognitoAuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  groups: AppRole[];
  sub: string | null;
  username: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  refresh: () => Promise<boolean>;
}

const CognitoAuthContext = createContext<CognitoAuthContextValue | null>(null);

function decodeClaims(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  if (!payload) return {};
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(
      normalized + "=".repeat((4 - (normalized.length % 4)) % 4),
    );
    const parsed: unknown = JSON.parse(decoded);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function CognitoAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(cognitoConfigured);
  const [groups, setGroups] = useState<AppRole[]>([]);
  const [sub, setSub] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    if (!cognitoConfigured) {
      setIsLoading(false);
      return null;
    }
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken;
    if (!accessToken) {
      setIsLoading(false);
      setIsAuthenticated(false);
      setGroups([]);
      setSub(null);
      setUsername(null);
      return null;
    }
    const claims = decodeClaims(accessToken.toString());
    setIsAuthenticated(true);
    setGroups(cognitoRolesFromClaims(claims));
    setSub(typeof claims.sub === "string" ? claims.sub : null);
    setUsername(
      typeof claims.username === "string"
        ? claims.username
        : typeof claims.email === "string"
          ? claims.email
          : null,
    );
    return session;
  }, []);

  useEffect(() => {
    let active = true;
    if (!cognitoConfigured) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }
    void refreshSession()
      .catch(() => {
        if (active) {
          setIsAuthenticated(false);
          setGroups([]);
          setSub(null);
          setUsername(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshSession]);

  const refresh = useCallback(async () => {
    const session = await refreshSession();
    return Boolean(session?.tokens?.accessToken);
  }, [refreshSession]);

  const login = useCallback(async () => {
    if (!cognitoConfigured) {
      throw new Error("Cognito no está configurado para este ambiente.");
    }
    await signInWithRedirect();
  }, []);

  const logout = useCallback(async () => {
    if (!cognitoConfigured) return;
    await signOut({
      global: false,
      oauth: { redirectUrl: environment.cognitoLogoutUri },
    });
    setIsAuthenticated(false);
    setGroups([]);
    setSub(null);
    setUsername(null);
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!cognitoConfigured) {
      throw new Error("Cognito no está configurado para este ambiente.");
    }
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();
    if (!token) throw new Error("No hay una sesión Cognito activa.");
    return token;
  }, []);

  const value = useMemo<CognitoAuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      isConfigured: cognitoConfigured,
      groups,
      sub,
      username,
      login,
      logout,
      getAccessToken,
      refresh,
    }),
    [groups, getAccessToken, isAuthenticated, isLoading, login, logout, refresh, sub, username],
  );

  return (
    <CognitoAuthContext.Provider value={value}>
      {children}
    </CognitoAuthContext.Provider>
  );
}

export function useCognitoAuth(): CognitoAuthContextValue {
  const value = useContext(CognitoAuthContext);
  if (!value) {
    throw new Error("useCognitoAuth debe usarse dentro de CognitoAuthProvider.");
  }
  return value;
}
