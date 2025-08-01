// Não há mais 'import', pois as variáveis são globais.

document.getElementById("signin").onclick = async () => {
  try {
    const result = await msalInstance.loginPopup({ scopes });
    msalInstance.setActiveAccount(result.account);
    window.location.href = "home.html";
  } catch (error) {
    console.error(error);
  }
};

// Redireciona para a home se já houver uma sessão ativa
if (msalInstance.getAllAccounts().length > 0) {
  // Garante que a conta ativa seja definida ao recarregar a página
  msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
  window.location.href = "home.html";
}