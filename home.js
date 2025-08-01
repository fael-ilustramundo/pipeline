import { PublicClientApplication } from "https://cdn.jsdelivr.net/npm/@azure/msal-browser@2.37.0/dist/msal-browser.esm.min.js";
import * as azblob from "https://cdn.jsdelivr.net/npm/@azure/storage-blob@12.16.0/+esm";

/* ----- CONFIG ------------------------------------------------------- */
const accountName   = "ppldrive";
const containerName = "pipeline";

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: "8757d9f5-6832-4ab3-8c95-80c74dee6e56",
    authority: "https://login.microsoftonline.com/dfd0fc8b-d7a6-4326-84cd-4d000b55b9bb",
    redirectUri: window.location.origin + "/home.html"
  }
});
const scopes = ["https://storage.azure.com/user_impersonation"];

/* ----- GARANTE SESSÃO ------------------------------------------------ */
const remembered = msalInstance.getAllAccounts()[0];
if (!remembered) window.location.href = "login.html";
msalInstance.setActiveAccount(remembered);

/* ----- DOM ----------------------------------------------------------- */
const dom = {
  signout: document.getElementById("signout"),
  user:    document.getElementById("user"),
  fileIn:  document.getElementById("fileInput"),
  upload:  document.getElementById("uploadBtn"),
  list:    document.getElementById("fileList"),
  bar:     document.querySelector("#uploadProgress .progress-bar"),
  progBox: document.getElementById("uploadProgress")
};
dom.user.textContent = remembered.username;

/* ----- LOGOUT -------------------------------------------------------- */
dom.signout.onclick = () => {
  msalInstance.logoutPopup().then(() => {
    msalInstance.setActiveAccount(null);
    window.location.href = "login.html";
  });
};

/* ----- HELPERS ------------------------------------------------------- */
async function getBlobService() {
  const token = (await msalInstance.acquireTokenSilent({
    scopes,
    account: msalInstance.getActiveAccount()
  })).accessToken;

  return new azblob.BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new azblob.TokenCredential(token)
  );
}

/* ----- LISTA --------------------------------------------------------- */
async function refreshList() {
  dom.list.innerHTML = "";
  const cont = (await getBlobService()).getContainerClient(containerName);

  for await (const blob of cont.listBlobsFlat()) {
    const li = document.createElement("li");
    li.className = "list-group-item";
    const a = document.createElement("a");
    a.textContent = blob.name;
    a.href = `${cont.url}/${encodeURIComponent(blob.name)}`;
    a.target = "_blank";
    li.appendChild(a);
    dom.list.appendChild(li);
  }
}
refreshList();

/* ----- UPLOAD -------------------------------------------------------- */
dom.upload.onclick = async () => {
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
  refreshList();
};
