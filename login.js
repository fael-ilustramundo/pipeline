document.addEventListener('DOMContentLoaded', function() {
  // As variáveis `msalInstance` e `scopes` agora são lidas do objeto 'window'.

  document.getElementById("signin").onclick = async () => {
    try {
      const result = await window.msalInstance.loginPopup({ scopes: window.scopes });
      window.msalInstance.setActiveAccount(result.account);
      window.location.href = "home.html";
    } catch (error) {
      console.error(error);
    }
  };

  // Redireciona se já estiver logado
  if (window.msalInstance && window.msalInstance.getAllAccounts().length > 0) {
    window.msalInstance.setActiveAccount(window.msalInstance.getAllAccounts()[0]);
    window.location.href = "home.html";
  }
});