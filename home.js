document.addEventListener('DOMContentLoaded', function() {
  const accountName   = "ppldrive";
  const containerName = "pipeline";
  const sasTokenUrl   = "/api/get-sas-token";

  const remembered = window.msalInstance.getAllAccounts()[0];
  if (!remembered) {
      window.location.href = "login.html";
  } else {
      window.msalInstance.setActiveAccount(remembered);
  }

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

  dom.signout.onclick = () => {
    window.msalInstance.logoutPopup().then(() => {
      window.msalInstance.setActiveAccount(null);
      window.location.href = "login.html";
    });
  };

  async function getBlobServiceWithSas() {
    const response = await fetch(sasTokenUrl);
    if (!response.ok) {
        throw new Error(`Falha ao obter o Token SAS: ${response.statusText}`);
    }
    const sasToken = await response.text();
    // Usa o objeto global azblob carregado pelo script no HTML
    return new azblob.BlobServiceClient(
      `https://${accountName}.blob.core.windows.net?${sasToken}`
    );
  }

  async function refreshList() {
    dom.list.innerHTML = "<li>Carregando...</li>";
    try {
      const blobService = await getBlobServiceWithSas();
      const cont = blobService.getContainerClient(containerName);
      dom.list.innerHTML = "";
    
      let hasFiles = false;
      for await (const blob of cont.listBlobsFlat()) {
        hasFiles = true;
        const li = document.createElement("li");
        li.className = "list-group-item";
        const a = document.createElement("a");
        a.textContent = blob.name;
        a.href = `${cont.url}/${encodeURIComponent(blob.name)}`;
        a.target = "_blank";
        li.appendChild(a);
        dom.list.appendChild(li);
      }
      if (!hasFiles) {
        dom.list.innerHTML = "<li>Nenhum arquivo encontrado.</li>";
      }
    } catch (error) {
      console.error("Erro ao listar arquivos:", error);
      dom.list.innerHTML = `<li>Erro ao carregar arquivos. Verifique o console.</li>`;
    }
  }
  
  // Chama a função para listar os arquivos
  refreshList();

  dom.upload.onclick = async () => {
    const files = dom.fileIn.files;
    if (!files.length) return;

    dom.progBox.classList.remove("d-none");
    try {
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
    } catch(error) {
      console.error("Erro no upload:", error);
      alert("Ocorreu um erro durante o upload. Verifique o console.");
    }
    
    dom.fileIn.value = "";
    dom.bar.style.width = "0%";
    dom.progBox.classList.add("d-none");
    refreshList();
  };
});