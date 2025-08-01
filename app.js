import { PublicClientApplication } from "https://alcdn.msauth.net/browser/2.37.0/js/msal-browser.esm.min.js";
import * as azblob from "https://cdn.jsdelivr.net/npm/@azure/storage-blob@12.16.0/+esm";

const config = {
  auth: {
    clientId: "8757d9f5-6832-4ab3-8c95-80c74dee6e56",
    authority: "https://login.microsoftonline.com/dfd0fc8b-d7a6-4326-84cd-4d000b55b9bb",
    redirectUri: window.location.origin
  }
};
const msalInstance = new PublicClientApplication(config);
const scopes = ["https://storage.azure.com/user_impersonation"];

const accountName = "ppldrive";
const containerName = "pipeline";

const dom = {
  signin:  document.getElementById("signin"),
  signout: document.getElementById("signout"),
  user:    document.getElementById("user"),
  fileIn:  document.getElementById("fileInput"),
  upload:  document.getElementById("uploadBtn"),
  list:    document.getElementById("fileList")
};

dom.signin.onclick = () => signIn();
dom.signout.onclick = () => signOut();
dom.upload.onclick = () => uploadFiles();

async function signIn() {
  const result = await msalInstance.loginPopup({ scopes });
  showUI(result.account);
  await refreshList();
}

function signOut() {
  const account = msalInstance.getActiveAccount();
  if (account) msalInstance.logoutPopup();
}

function showUI(account) {
  const logged = !!account;
  dom.signin.style.display  = logged ? "none" : "inline";
  dom.signout.style.display = logged ? "inline" : "none";
  dom.fileIn.style.display  = logged ? "inline" : "none";
  dom.upload.style.display  = logged ? "inline" : "none";
  dom.user.textContent      = logged ? account.username : "";
}

async function getBlobService() {
  const token = (await msalInstance.acquireTokenSilent({ scopes })).accessToken;
  const cred  = new azblob.TokenCredential(token);
  const url   = `https://${accountName}.blob.core.windows.net`;
  return new azblob.BlobServiceClient(url, cred);
}

async function refreshList() {
  dom.list.innerHTML = "";
  const svc  = await getBlobService();
  const cont = svc.getContainerClient(containerName);
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

async function uploadFiles() {
  const files = dom.fileIn.files;
  if (!files.length) return;
  const svc  = await getBlobService();
  const cont = svc.getContainerClient(containerName);
  for (const file of files) {
    const block = cont.getBlockBlobClient(file.name);
    await block.uploadBrowserData(file, { blobHTTPHeaders: { blobContentType: file.type }});
  }
  await refreshList();
}

showUI(msalInstance.getAllAccounts()[0]);
if (msalInstance.getAllAccounts().length) refreshList();
