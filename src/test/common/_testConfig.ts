
// [SuppressMessage("Microsoft.Security", "CS002:SecretInNextLine")]
const masterKey = process.env.ACCOUNT_KEY
    || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
const host = process.env.ACCOUNT_HOST
    || "https://localhost:8081";

// TODO: what is this?
const adminUtilitiesPath =
    "../../../../../bin/x64/Debug/Product/AdminUtilities/Microsoft.Azure.Documents.Tools.AdminUtilities.exe";

// This is needed to disable SSL verification for the tests running against emulator.
if (host.includes("https://localhost")) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export default {
    masterKey, host, adminUtilitiesPath,
};
