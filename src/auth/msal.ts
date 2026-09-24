import {
  BrowserCacheLocation,
  InteractionType,
  PublicClientApplication,
} from "@azure/msal-browser";
import { environment } from "../config/environment";

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: environment.entraClientId,
    authority: `https://login.microsoftonline.com/${environment.entraTenantId}/v2.0`,
    redirectUri: environment.redirectUri,
    postLogoutRedirectUri: environment.postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.SessionStorage,
  },
  system: {
    allowPlatformBroker: false,
  },
});

export const loginRequest = {
  scopes: [environment.apiScope],
};

export const protectedResource = `${environment.apiBaseUrl.replace(/\/+$/, "")}/*`;
export const interactionType = InteractionType.Redirect;
