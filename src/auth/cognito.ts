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
