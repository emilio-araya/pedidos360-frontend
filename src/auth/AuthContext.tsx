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
  EventType,
  InteractionStatus,
  type AccountInfo,
} from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { environment } from "../config/environment";
import type { AppRole } from "../types";
import {
  claimsFromAccessToken,
  effectiveClaims,
  oidFromClaims,
  rolesFromClaims,
  shouldSetActiveAccount,
} from "../utils/claims";

interface AuthContextValue {
  account: AccountInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  roles: AppRole[];
  oid: string | null;
  displayName: string;
  isClient: boolean;
  canManageCatalog: boolean;
  canManageOrders: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const [accountState, setAccountState] = useState<
    AccountInfo | null | undefined
  >(undefined);
  const [accessClaims, setAccessClaims] = useState<Record<string, unknown>>({});
  const [claimsAccountId, setClaimsAccountId] = useState<string | null>(null);

  useEffect(() => {
    const syncAccount = () => {
      const activeAccount =
        instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
      setAccountState((current) => {
        if (current?.homeAccountId === activeAccount?.homeAccountId)
          return current;
        return activeAccount;
      });
      if (shouldSetActiveAccount(instance.getActiveAccount(), activeAccount)) {
        instance.setActiveAccount(activeAccount);
      }
    };

    syncAccount();
    const callbackId = instance.addEventCallback((message) => {
      if (
        message.eventType === EventType.ACTIVE_ACCOUNT_CHANGED ||
        message.eventType === EventType.LOGIN_SUCCESS ||
        message.eventType === EventType.LOGOUT_SUCCESS ||
        message.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
      ) {
        syncAccount();
      }
    });

    return () => {
      if (callbackId) instance.removeEventCallback(callbackId);
    };
  }, [accounts, instance]);

  const account =
    accountState === undefined
      ? (instance.getActiveAccount() ?? accounts[0] ?? null)
      : accountState;
  const accountId = account?.homeAccountId ?? null;

  useEffect(() => {
    let active = true;
    setAccessClaims({});
    setClaimsAccountId(null);

    if (!account || inProgress === InteractionStatus.Startup) {
      return () => {
        active = false;
      };
    }

    void instance
      .acquireTokenSilent({ account, scopes: [environment.apiScope] })
      .then((result) => {
        if (active) setAccessClaims(claimsFromAccessToken(result.accessToken));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setClaimsAccountId(account.homeAccountId);
      });

    return () => {
      active = false;
    };
  }, [accountId, inProgress, instance]);

  const claims = useMemo(
    () => effectiveClaims(account, accessClaims),
    [account, accessClaims],
  );
  const roles = useMemo(() => rolesFromClaims(claims), [claims]);
  const oid = useMemo(() => oidFromClaims(claims), [claims]);
  const isClient = roles.includes("Cliente");
  const canManageCatalog =
    roles.includes("Admin") || roles.includes("Operador");
  const canManageOrders = canManageCatalog;
  const claimsLoading = account !== null && claimsAccountId !== accountId;
  const isLoading = inProgress !== InteractionStatus.None || claimsLoading;

  const getAccessToken = useCallback(async () => {
    const current = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
    if (!current) throw new Error("No hay una sesión activa.");
    const result = await instance.acquireTokenSilent({
      account: current,
      scopes: [environment.apiScope],
    });
    return result.accessToken;
  }, [instance]);

  const login = useCallback(async () => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    await instance.loginRedirect({
      scopes: [environment.apiScope],
      redirectStartPage: `${origin}/dashboard`,
    });
  }, [instance]);

  const logout = useCallback(async () => {
    setAccessClaims({});
    setClaimsAccountId(null);
    setAccountState(null);
    await instance.logoutRedirect({
      account: account ?? undefined,
      postLogoutRedirectUri: environment.postLogoutRedirectUri,
    });
  }, [account, instance]);

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      isAuthenticated: account !== null,
      isLoading,
      roles,
      oid,
      displayName: account?.name ?? account?.username ?? "Usuario Pedidos360",
      isClient,
      canManageCatalog,
      canManageOrders,
      login,
      logout,
      getAccessToken,
    }),
    [
      account,
      canManageCatalog,
      canManageOrders,
      getAccessToken,
      isClient,
      isLoading,
      login,
      logout,
      oid,
      roles,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return value;
}
