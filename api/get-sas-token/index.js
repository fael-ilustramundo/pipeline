const { StorageSharedKeyCredential, generateAccountSASQueryParameters, AccountSASPermissions, AccountSASServices, AccountSASResourceTypes } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!accountName || !accountKey) {
        context.res = { 
            status: 500, 
            body: "As variáveis de ambiente do Storage não estão configuradas no Static Web App." 
        };
        return;
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    const sasOptions = {
        services: AccountSASServices.parse("b").toString(),         // b = blob
        resourceTypes: AccountSASResourceTypes.parse("co").toString(), // c = container, o = object
        permissions: AccountSASPermissions.parse("racwdl"),          // read, add, create, write, delete, list
        protocol: "https",
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000),  // 1 hora de validade
    };

    try {
        const sasToken = generateAccountSASQueryParameters(sasOptions, sharedKeyCredential).toString();
        context.res = {
            status: 200,
            body: sasToken
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `Erro ao gerar o token SAS: ${error.message}`
        };
    }
};