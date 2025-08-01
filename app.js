// ===== Azure Drive – app.js (versão corrigida) =====

// Bibliotecas globais já carregadas no index.html
const { PublicClientApplication } = window.msal;
const azblob = window.azureStorageBlob;

// --- Configuração MSAL ---------------------------------------------------
const msalInstance = new PublicClientApplication({
  auth: {
    clientId: "8757d9f5-6832-4ab3-8c95-80c74dee6e56",
    authority: "https://login.microsoftonline.com/dfd0fc8b-d7a6-4326-84cd-4d000b55b9bb",
    redirectUri: window.location.origin
  }
});
const scopes = ["https://storage.azure.com/user_impersonation"];

// --- Parâmetros do Storage ----------------------------------------------
const accountName   = "ppldrive";
const containerName = "pipeline";

// --- Referências de UI ---------------------------------------------------
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

// ---------- Funções de interface ----------------------------------------
function showUI(account) {
  const logged = !!account;
  dom.signin.classList.toggle("d-none", logged);
  dom.signout.classList.toggle("d-none", !logged);
  dom.fileIn.classList.toggle("d-none", !logged);
  dom.upload.classList.toggle("d-none", !logged);
  dom.user.textContent = logged ? account.username : "";
}

// ---------- Login / Logout ----------------------------------------------
dom.signin.onclick  = () => signIn();
dom.signout.onclick = () => signOut();
dom.upload.onclick  = () => uploadFiles();

async function signIn() {
  const result = await msalInstance.loginPopup({ scopes });
  msalInstance.setActiveAccount(result.account);           // fixa conta ativa
  showUI(result.account);
  await refreshList();
}

function signOut() {
  msalInstance.logoutPopup().then(() => {
    msalInstance.setActiveAccount(null);                   // limpa conta ativa
    showUI(null);
    dom.list.innerHTML = "";
  });
}

// ---------- Azure Storage helpers ---------------------------------------
async function getBlobService() {
  const account = msalInstance.getActiveAccount();
  if (!account) throw new Error("Nenhuma conta ativa – faça login primeiro.");

  const token = (await msalInstance.acquireTokenSilent({
    scopes,
    account                                              // informa a conta
  })).accessToken;

  const cred = new azblob.TokenCredential(token);
  const url  = `https://${accountName}.blob.core.windows.net`;
  return new azblob.BlobServiceClient(url, cred);
}

// ---------- Listagem de arquivos ----------------------------------------
async function refreshList() {
  dom.list.innerHTML = "";
  const svc  = await getBlobService();
  const cont = svc.getContainerClient(containerName);

  for await (const blob of cont.listBlobsFlat()) {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";

    const a = document.createElement("a");
    a.textContent = blob.name;
    a.href = `${cont.url}/${encodeURIComponent(blob.name)}`;
    a.target = "_blank";

    li.appendChild(a);
    dom.list.appendChild(li);
  }
}

// ---------- Upload -------------------------------------------------------
async function uploadFiles() {
  const files = dom.fileIn.files;
  if (!files.length) return;

  dom.progBox.classList.remove("d-none");
  const svc  = await getBlobService();
  const cont = svc.getContainerClient(containerName);

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

// ---------- Restaura sessão pré-existente -------------------------------
const remembered = msalInstance.getAllAccounts()[0];
if (remembered) {
  msalInstance.setActiveAccount(remembered);
  showUI(remembered);
  refreshList();
} else {
  showUI(null);
}
