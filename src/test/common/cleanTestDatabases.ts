import { removeAllDatabases } from "./TestHelpers";

removeAllDatabases().then((count) => console.log(`Cleaned ${count} databases`)).catch((e) => throw e);
