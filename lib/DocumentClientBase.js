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
const http_1 = require("http");
const tunnel = require("tunnel");
const url = require("url");
const base_1 = require("./base");
const common_1 = require("./common");
const documents_1 = require("./documents");
const globalEndpointManager_1 = require("./globalEndpointManager");
const request_1 = require("./request");
const sessionContainer_1 = require("./sessionContainer");
class DocumentClientBase {
    constructor(urlConnection, auth, connectionPolicy, consistencyLevel) {
        this.urlConnection = urlConnection;
        if (auth !== undefined) {
            this.masterKey = auth.masterKey;
            this.resourceTokens = auth.resourceTokens;
            if (auth.permissionFeed) {
                this.resourceTokens = {};
                for (const permission of auth.permissionFeed) {
                    const resourceId = common_1.Helper.getResourceIdFromPath(permission.resource);
                    if (!resourceId) {
                        throw new Error(`authorization error: ${resourceId} \
                            is an invalid resourceId in permissionFeed`);
                    }
                    this.resourceTokens[resourceId] = permission._token;
                }
            }
            this.tokenProvider = auth.tokenProvider;
        }
        this.connectionPolicy = connectionPolicy || new documents_1.ConnectionPolicy();
        this.consistencyLevel = consistencyLevel;
        this.defaultHeaders = {};
        this.defaultHeaders[common_1.Constants.HttpHeaders.CacheControl] = "no-cache";
        this.defaultHeaders[common_1.Constants.HttpHeaders.Version] = common_1.Constants.CurrentVersion;
        if (consistencyLevel !== undefined) {
            this.defaultHeaders[common_1.Constants.HttpHeaders.ConsistencyLevel] = consistencyLevel;
        }
        const platformDefaultHeaders = common_1.Platform.getPlatformDefaultHeaders() || {};
        for (const platformDefaultHeader of Object.keys(platformDefaultHeaders)) {
            this.defaultHeaders[platformDefaultHeader] = platformDefaultHeaders[platformDefaultHeader];
        }
        this.defaultHeaders[common_1.Constants.HttpHeaders.UserAgent] = common_1.Platform.getUserAgent();
        this.defaultUrlParams = "";
        this.queryCompatibilityMode = documents_1.QueryCompatibilityMode.Default;
        this.partitionResolvers = {};
        this.partitionKeyDefinitionCache = {};
        this._globalEndpointManager = new globalEndpointManager_1.GlobalEndpointManager(this);
        this.sessionContainer = new sessionContainer_1.SessionContainer(this.urlConnection);
        const requestAgentOptions = { keepAlive: true, maxSockets: Infinity };
        if (!!this.connectionPolicy.ProxyUrl) {
            const proxyUrl = url.parse(this.connectionPolicy.ProxyUrl);
            requestAgentOptions.proxy = {
                host: proxyUrl.hostname,
                port: proxyUrl.port,
            };
            if (!!proxyUrl.auth) {
                requestAgentOptions.proxy.proxyAuth = proxyUrl.auth;
            }
            this.requestAgent = proxyUrl.protocol.toLowerCase() === "https:" ?
                tunnel.httpsOverHttps(requestAgentOptions) :
                tunnel.httpsOverHttp(requestAgentOptions);
        }
        else {
            this.requestAgent = new http_1.Agent(requestAgentOptions);
        }
    }
    getDatabaseAccount(options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const urlConnection = options.urlConnection || this.urlConnection;
            const requestHeaders = yield base_1.Base.getHeaders(this, this.defaultHeaders, "get", "", "", "", {});
            try {
                const { result, headers } = yield this.get(urlConnection, "", requestHeaders);
                const databaseAccount = new documents_1.DatabaseAccount();
                databaseAccount.DatabasesLink = "/dbs/";
                databaseAccount.MediaLink = "/media/";
                databaseAccount.MaxMediaStorageUsageInMB =
                    headers[common_1.Constants.HttpHeaders.MaxMediaStorageUsageInMB];
                databaseAccount.CurrentMediaStorageUsageInMB =
                    headers[common_1.Constants.HttpHeaders.CurrentMediaStorageUsageInMB];
                databaseAccount.ConsistencyPolicy = result.userConsistencyPolicy;
                if (common_1.Constants.WritableLocations in result && result.id !== "localhost") {
                    databaseAccount._writableLocations = result[common_1.Constants.WritableLocations];
                }
                if (common_1.Constants.ReadableLocations in result && result.id !== "localhost") {
                    databaseAccount._readableLocations = result[common_1.Constants.ReadableLocations];
                }
                if (callback) {
                    callback(null, databaseAccount, headers);
                    return;
                }
                else {
                    return { result: databaseAccount, headers };
                }
            }
            catch (err) {
                if (callback) {
                    callback(err);
                }
                else {
                    throw err;
                }
            }
        });
    }
    validateOptionsAndCallback(optionsIn, callbackIn) {
        let options;
        let callback;
        if (optionsIn === undefined) {
            options = new Object();
        }
        else if (callbackIn === undefined && typeof optionsIn === "function") {
            callback = optionsIn;
            options = new Object();
        }
        else if (typeof optionsIn !== "object") {
            throw new Error(`The "options" parameter must be of type "object". Actual type is: "${typeof optionsIn}".`);
        }
        else {
            options = optionsIn;
        }
        if (callbackIn !== undefined && typeof callbackIn !== "function") {
        }
        else if (typeof callbackIn === "function") {
            callback = callbackIn;
        }
        return { options, callback };
    }
    get(urlString, request, headers) {
        return request_1.RequestHandler.request(this._globalEndpointManager, this.connectionPolicy, this.requestAgent, "GET", urlString, request, undefined, this.defaultUrlParams, headers);
    }
    post(urlString, request, body, headers) {
        return request_1.RequestHandler.request(this._globalEndpointManager, this.connectionPolicy, this.requestAgent, "POST", urlString, request, body, this.defaultUrlParams, headers);
    }
    put(urlString, request, body, headers) {
        return request_1.RequestHandler.request(this._globalEndpointManager, this.connectionPolicy, this.requestAgent, "PUT", urlString, request, body, this.defaultUrlParams, headers);
    }
    head(urlString, request, headers) {
        return request_1.RequestHandler.request(this._globalEndpointManager, this.connectionPolicy, this.requestAgent, "HEAD", urlString, request, undefined, this.defaultUrlParams, headers);
    }
    delete(urlString, request, headers) {
        return request_1.RequestHandler.request(this._globalEndpointManager, this.connectionPolicy, this.requestAgent, "DELETE", urlString, request, undefined, this.defaultUrlParams, headers);
    }
}
exports.DocumentClientBase = DocumentClientBase;
//# sourceMappingURL=DocumentClientBase.js.map