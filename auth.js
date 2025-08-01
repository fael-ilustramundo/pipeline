// As bibliotecas agora são carregadas no HTML e criam objetos globais (ex: window.msal).

// Configuração centralizada do MSAL
const msalConfig = {
  auth: {
    clientId: "8757d9f5-6832-4ab3-8c95-80c74dee6e56",
    authority: "https://login.microsoftonline.com/dfd0fc8b-d7a6-4326-84cd-4d000b55b9bb",
    redirectUri: window.location.origin + "/home.html"
  }
};

// Escopos necessários para a aplicação
const scopes = ["https://storage.azure.com/user_impersonation"];

// Instância única do PublicClientApplication
// Note que agora usamos msal.PublicClientApplication, vindo do objeto global criado pelo script no HTML
const msalInstance = new msal.PublicClientApplication(msalConfig);