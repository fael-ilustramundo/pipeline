// ===== app.js corrigido =====

// Bibliotecas globais já carregadas no index.html
const { PublicClientApplication } = window.msal;
const azblob = window.azblob;   // <- correção aqui

// --- Config MSAL --------------------------------------------------------
const msalInstance = new PublicClientApplication({
  auth: {
    clientId: "8757d9f5-6832-4ab3-8c95-80c74dee6e56",
    authority: "https://login.microsoftonline.com/dfd0fc8b-d7a6-4326-84cd-4d000b55b9bb",
    redirectUri: window.location.origin
  }
});
const scopes = ["https://storage.azure.com/user_impersonation"];

// --- Storage ------------------------------------------------------------
const accountName   = "ppldrive";
const containerName = "pipeline";

// --- DOM ---------------------------------------------------------------
const dom = {
  signin:  document.getElementById("signin"),
  signout: document.getElementById("signout"),
  user:    document.getElementById("user"),
  fileIn:  document.getElementById("fileInput"),
  upload:  document.getElementById("uploadBtn"),
  list:    document.getElementById("fileList"),
  bar:     document.querySelector("#uploadProgress .progress-bar"),
  progBox: document.getElementById("uploadProgress")
};

function showUI(account) {
  const logged = !!account;
  dom.signin.classList.toggle("d-none", logged);
  dom.signout.classList.toggle("d-none", !logged);
  dom.fileIn.classList.toggle("d-none", !logged);
  dom.upload.classList.toggle("d-none", !logged);
  dom.user.textContent = logged ? account.username : "";
}

// --- Eventos -----------------------------------------------------------
dom.signin.onclick  = () => signIn();
dom.signout.onclick = () => signOut();
dom.upload.onclick  = () => uploadFiles();

// --- Autenticação -------------------------------------------------------
async function signIn() {
  const result = await msalInstance.loginPopup({ scopes });
  msalInstance.setActiveAccount(result.account);      // fixa a conta
  showUI(result.account);
  await refreshList();
}

function signOut() {
  msalInstance.logoutPopup().then(() => {
    msalInstance.setActiveAccount(null);
    showUI(null);
    dom.list.innerHTML = "";
  });
}

// --- Storage helpers ----------------------------------------------------
async function getBlobService() {
  const account = msalInstance.getActiveAccount();
  if (!account) throw new Error("Nenhuma conta ativa – faça login primeiro.");

  const token = (await msalInstance.acquireTokenSilent({
    scopes,
    account
  })).accessToken;

  return new azblob.BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new azblob.TokenCredential(token)
  );
}

// --- Listagem -----------------------------------------------------------
async function refreshList() {
  dom.list.innerHTML = "";
  const cont = (await getBlobService()).getContainerClient(containerName);

  for await (const blob of cont.listBlobsFlat()) {
    const li = document.createElement("li");
    const a  = document.createElement("a");
    a.textContent = blob.name;
    a.href = `${cont.url}/${encodeURIComponent(blob.name)}`;
    a.target = "_blank";
    li.appendChild(a);
    dom.list.appendChild(li);
  }
}

// --- Upload -------------------------------------------------------------
async function uploadFiles() {
  const files = dom.fileIn.files;
  if (!files.length) return;

  dom.progBox.classList.remove("d-none");
  const cont = (await getBlobService()).getContainerClient(containerName);

  for (const file of files) {
    const block = cont.getBlockBlobClient(file.name);
    await block.uploadBrowserData(file, {
      onProgress: ev => {
        const pct = Math.round((ev.loadedBytes / file.size) * 100);
        dom.bar.style.width = pct + "%";
      },
      blobHTTPHeaders: { blobContentType: file.type }
    });
  }

  dom.bar.style.width = "0%";
  dom.progBox.classList.add("d-none");
  await refreshList();
}

// --- Restaurar sessão, se existir --------------------------------------
const remembered = msalInstance.getAllAccounts()[0];
if (remembered) {
  msalInstance.setActiveAccount(remembered);
  showUI(remembered);
  refreshList();
} else {
  showUI(null);
}
