import { Amplify } from "aws-amplify";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { environment } from "../config/environment";

interface TokenStorage {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

const memoryStorage = new Map<string, string>();
const storageKeys = new Set<string>();
const sessionTokenStorage: TokenStorage = {
  async setItem(key, value) {
    storageKeys.add(key);
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    } else {
      memoryStorage.set(key, value);
    }
  },
  async getItem(key) {
    if (typeof window !== "undefined" && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
    return memoryStorage.get(key) ?? null;
  },
  async removeItem(key) {
    storageKeys.delete(key);
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem(key);
    } else {
      memoryStorage.delete(key);
    }
  },
  async clear() {
    for (const key of storageKeys) {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      } else {
        memoryStorage.delete(key);
      }
    }
    storageKeys.clear();
  },
};

cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionTokenStorage);

export const cognitoConfigured = Boolean(
  environment.cognitoUserPoolId &&
    environment.cognitoUserPoolClientId &&
    environment.cognitoDomain &&
    environment.cognitoIssuer &&
    environment.cognitoRedirectUri &&
    environment.cognitoLogoutUri,
);

if (cognitoConfigured) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: environment.cognitoUserPoolId,
        userPoolClientId: environment.cognitoUserPoolClientId,
        loginWith: {
          oauth: {
            domain: environment.cognitoDomain,
            scopes: environment.cognitoApiScope.split(/\s+/).filter(Boolean),
            redirectSignIn: [environment.cognitoRedirectUri],
            redirectSignOut: [environment.cognitoLogoutUri],
            responseType: "code",
          },
        },
      },
    },
  });
}

/**
 * Construye la URL de registro en el hosted UI de Cognito.
 *
 * El alta de usuario se delega al formulario alojado por Cognito en lugar de
 * llamar a la API SignUp desde el navegador: el usuario queda creado dentro
 * del User Pool, con la politica de contrasenas del tenant aplicada, y el
 * retorno usa el mismo Authorization Code con PKCE que el inicio de sesion.
 */
export interface CognitoSignupConfig {
  cognitoDomain: string;
  cognitoUserPoolClientId: string;
  cognitoApiScope: string;
  cognitoRedirectUri: string;
}

export function buildCognitoSignupUrl(
  config: CognitoSignupConfig,
): string | null {
  const { cognitoDomain, cognitoUserPoolClientId, cognitoApiScope, cognitoRedirectUri } = config;
  if (!cognitoDomain || !cognitoUserPoolClientId || !cognitoRedirectUri) return null;

  const params = new URLSearchParams({
    client_id: cognitoUserPoolClientId,
    response_type: "code",
    scope: cognitoApiScope,
    redirect_uri: cognitoRedirectUri,
  });
  return `https://${cognitoDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/signup?${params.toString()}`;
}

export const cognitoSignupUrl = buildCognitoSignupUrl(environment);

/**
 * Construye la URL de cierre de sesion en el hosted UI de Cognito.
 *
 * No basta con borrar los tokens locales: la sesion SSO del User Pool
 * sobrevive en el navegador y el proximo "Acceder con Amazon Cognito"
 * reentraria sin pedir credenciales. Hay que pasar por /logout para
 * cerrar la sesion federada de verdad.
 *
 * logoutUri permite encadenar el cierre de Entra: Cognito devuelve el
 * control a esa ruta de la aplicacion, que despues cierra la sesion de
 * Microsoft y recien ahi vuelve al login.
 */
export function buildCognitoSignOutUrl(
  config: CognitoSignupConfig,
  logoutUri: string,
): string | null {
  if (!config.cognitoDomain || !config.cognitoUserPoolClientId || !logoutUri) {
    return null;
  }

  const domain = config.cognitoDomain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const params = new URLSearchParams({
    client_id: config.cognitoUserPoolClientId,
    logout_uri: logoutUri,
  });
  return `https://${domain}/logout?${params.toString()}`;
}
