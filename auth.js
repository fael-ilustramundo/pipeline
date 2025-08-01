document.addEventListener('DOMContentLoaded', function() {
  // O código abaixo só será executado depois que TUDO estiver carregado.

  // Verifica se a biblioteca MSAL foi realmente carregada.
  if (typeof msal === 'undefined') {
    console.error('ERRO CRÍTICO: A biblioteca MSAL não foi carregada. Verifique o link no seu HTML.');
    return;
  }

  // Configuração centralizada do MSAL
  window.msalConfig = {
    auth: {
      clientId: "8757d9f5-6832-4ab3-8c95-80c74dee6e56",
      authority: "https://login.microsoftonline.com/dfd0fc8b-d7a6-4326-84cd-4d000b55b9bb",
      redirectUri: window.location.origin + "/home.html"
    }
  };

  // Escopos necessários para a aplicação
  window.scopes = ["https://storage.azure.com/user_impersonation"];

  // Instância única do PublicClientApplication
  // Anexamos ao objeto 'window' para garantir que seja global e acessível aos outros scripts.
  window.msalInstance = new msal.PublicClientApplication(window.msalConfig);
});