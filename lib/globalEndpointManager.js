"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const common_1 = require("./common");
class GlobalEndpointManager {
    constructor(client) {
        this.client = client;
        this.defaultEndpoint = client.urlConnection;
        this.readEndpoint = client.urlConnection;
        this.writeEndpoint = client.urlConnection;
        this.enableEndpointDiscovery = client.connectionPolicy.EnableEndpointDiscovery;
        this.preferredLocations = client.connectionPolicy.PreferredLocations;
        this.isEndpointCacheInitialized = false;
    }
    getReadEndpoint() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isEndpointCacheInitialized) {
                yield this.refreshEndpointList();
                return this.readEndpoint;
            }
            else {
                return this.readEndpoint;
            }
        });
    }
    setReadEndpoint(readEndpoint) {
        this.readEndpoint = readEndpoint;
    }
    getWriteEndpoint() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isEndpointCacheInitialized) {
                yield this.refreshEndpointList();
                return this.writeEndpoint;
            }
            else {
                return this.writeEndpoint;
            }
        });
    }
    setWriteEndpoint(writeEndpoint) {
        this.writeEndpoint = writeEndpoint;
    }
    refreshEndpointList() {
        return __awaiter(this, void 0, void 0, function* () {
            let writableLocations = [];
            let readableLocations = [];
            let databaseAccount;
            if (this.enableEndpointDiscovery) {
                databaseAccount = yield this._getDatabaseAccount();
                if (databaseAccount) {
                    writableLocations = databaseAccount.WritableLocations;
                    readableLocations = databaseAccount.ReadableLocations;
                }
                [this.writeEndpoint, this.readEndpoint] =
                    yield this._updateLocationsCache(writableLocations, readableLocations);
                this.isEndpointCacheInitialized = true;
                return [this.writeEndpoint, this.readEndpoint];
            }
            else {
                return [this.writeEndpoint, this.readEndpoint];
            }
        });
    }
    _getDatabaseAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = { urlConnection: this.defaultEndpoint };
            try {
                const { result: databaseAccount } = yield this.client.getDatabaseAccount(options);
                return databaseAccount;
            }
            catch (err) {
            }
            for (const location of this.preferredLocations) {
                try {
                    const locationalEndpoint = GlobalEndpointManager._getLocationalEndpoint(this.defaultEndpoint, location);
                    const innerOptions = { urlConnection: locationalEndpoint };
                    const { result: databaseAccount } = yield this.client.getDatabaseAccount(innerOptions);
                    if (databaseAccount) {
                        return databaseAccount;
                    }
                }
                catch (err) {
                }
            }
        });
    }
    static _getLocationalEndpoint(defaultEndpoint, locationName) {
        const endpointUrl = url.parse(defaultEndpoint, true, true);
        if (endpointUrl.hostname) {
            const hostnameParts = (endpointUrl.hostname).toString().toLowerCase().split(".");
            if (hostnameParts) {
                const globalDatabaseAccountName = hostnameParts[0];
                const locationalDatabaseAccountName = globalDatabaseAccountName + "-" + locationName.replace(" ", "");
                const locationalEndpoint = defaultEndpoint
                    .toLowerCase()
                    .replace(globalDatabaseAccountName, locationalDatabaseAccountName);
                return locationalEndpoint;
            }
        }
        return null;
    }
    _updateLocationsCache(writableLocations, readableLocations) {
        return __awaiter(this, void 0, void 0, function* () {
            let writeEndpoint;
            let readEndpoint;
            if (!this.enableEndpointDiscovery) {
                writeEndpoint = this.defaultEndpoint;
                readEndpoint = this.defaultEndpoint;
                return [writeEndpoint, readEndpoint];
            }
            writeEndpoint = writableLocations.length === 0
                ? this.defaultEndpoint
                : writableLocations[0][common_1.Constants.DatabaseAccountEndpoint];
            if (readableLocations.length === 0) {
                readEndpoint = writeEndpoint;
                return [writeEndpoint, readEndpoint];
            }
            else {
                readEndpoint = writeEndpoint;
                if (!this.preferredLocations) {
                    return [writeEndpoint, readEndpoint];
                }
                for (const preferredLocation of this.preferredLocations) {
                    for (const readLocation of readableLocations) {
                        if (readLocation[common_1.Constants.Name] === preferredLocation) {
                            readEndpoint = readLocation[common_1.Constants.DatabaseAccountEndpoint];
                            return [writeEndpoint, readEndpoint];
                        }
                    }
                    for (const writeLocation of writableLocations) {
                        if (writeLocation[common_1.Constants.Name] === preferredLocation) {
                            readEndpoint = writeLocation[common_1.Constants.DatabaseAccountEndpoint];
                            return [writeEndpoint, readEndpoint];
                        }
                    }
                }
                return [writeEndpoint, readEndpoint];
            }
        });
    }
}
exports.GlobalEndpointManager = GlobalEndpointManager;
//# sourceMappingURL=globalEndpointManager.js.map