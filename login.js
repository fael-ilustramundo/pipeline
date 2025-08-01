import { msalInstance, scopes } from "./auth.js";

document.getElementById("signin").onclick = async () => {
  try {
    const result = await msalInstance.loginPopup({ scopes });
    msalInstance.setActiveAccount(result.account);
    window.location.href = "home.html";
  } catch (error) {
    console.error(error);
  }
};

if (msalInstance.getAllAccounts().length > 0) {
  window.location.href = "home.html";
}