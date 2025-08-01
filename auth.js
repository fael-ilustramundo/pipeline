import { PublicClientApplication } from "https://cdn.jsdelivr.net/npm/@azure/msal-browser@2.39.0/dist/index.js";

// Configuração centralizada do MSAL
export const msalConfig = {
  auth: {
    clientId: "8757d9f5-6832-4ab3-8c95-80c74dee6e56",
    authority: "https://login.microsoftonline.com/dfd0fc8b-d7a6-4326-84cd-4d000b55b9bb",
    redirectUri: window.location.origin + "/home.html"
  }
};

// Escopos necessários para a aplicação
export const scopes = ["https://storage.azure.com/user_impersonation"];

// Instância única do PublicClientApplication
export const msalInstance = new PublicClientApplication(msalConfig);