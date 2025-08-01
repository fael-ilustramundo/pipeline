import { msalInstance } from "./auth.js";
import * as azblob from "https://cdn.jsdelivr.net/npm/@azure/storage-blob@12.16.0/+esm";

/* ----- CONFIG ------------------------------------------------------- */
const accountName   = "ppldrive"; // <<-- CONFIRME O NOME DA SUA CONTA DE STORAGE
const containerName = "pipeline"; // <<-- CONFIRME O NOME DO SEU CONTAINER
const sasTokenUrl   = "/api/get-sas-token";

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
async function getBlobServiceWithSas() {
  const response = await fetch(sasTokenUrl);
  if (!response.ok) {
      throw new Error(`Falha ao obter o Token SAS: ${response.statusText}`);
  }
  const sasToken = await response.text();
  return new azblob.BlobServiceClient(
    `https://${accountName}.blob.core.windows.net?${sasToken}`
  );
}

/* ----- LISTA --------------------------------------------------------- */
async function refreshList() {
  dom.list.innerHTML = "";
  const blobService = await getBlobServiceWithSas();
  const cont = blobService.getContainerClient(containerName);

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
  const blobService = await getBlobServiceWithSas();
  const cont = blobService.getContainerClient(containerName);

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