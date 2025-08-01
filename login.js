import { PublicClientApplication } from "https://cdn.jsdelivr.net/npm/@azure/msal-browser@2.37.0/dist/msal-browser.esm.min.js";

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: "8757d9f5-6832-4ab3-8c95-80c74dee6e56",
    authority: "https://login.microsoftonline.com/dfd0fc8b-d7a6-4326-84cd-4d000b55b9bb",
    redirectUri: window.location.origin + "/login.html"
  }
});
const scopes = ["https://storage.azure.com/user_impersonation"];

document.getElementById("signin").onclick = async () => {
  const result = await msalInstance.loginPopup({ scopes });
  msalInstance.setActiveAccount(result.account);
  window.location.href = "home.html";
};

if (msalInstance.getAllAccounts().length) {
  window.location.href = "home.html";
}
