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
const crypto = require("crypto");
class AuthHandler {
    static getAuthorizationHeader(documentClient, verb, path, resourceId, resourceType, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            if (documentClient.masterKey) {
                return encodeURIComponent(AuthHandler.getAuthorizationTokenUsingMasterKey(verb, resourceId, resourceType, headers, documentClient.masterKey));
            }
            else if (documentClient.resourceTokens) {
                return encodeURIComponent(AuthHandler.getAuthorizationTokenUsingResourceTokens(documentClient.resourceTokens, path, resourceId));
            }
            else if (documentClient.tokenProvider) {
                return encodeURIComponent(yield AuthHandler.getAuthorizationTokenUsingTokenProvider(documentClient.tokenProvider, {
                    verb, path, resourceId, resourceType, headers,
                }));
            }
        });
    }
    static getAuthorizationTokenUsingMasterKey(verb, resourceId, resourceType, headers, masterKey) {
        const key = new Buffer(masterKey, "base64");
        const text = (verb || "").toLowerCase() + "\n" +
            (resourceType || "").toLowerCase() + "\n" +
            (resourceId || "") + "\n" +
            (headers["x-ms-date"] || "").toLowerCase() + "\n" +
            (headers["date"] || "").toLowerCase() + "\n";
        const body = new Buffer(text, "utf8");
        const signature = crypto.createHmac("sha256", key).update(body).digest("base64");
        const MasterToken = "master";
        const TokenVersion = "1.0";
        return "type=" + MasterToken + "&ver=" + TokenVersion + "&sig=" + signature;
    }
    static getAuthorizationTokenUsingResourceTokens(resourceTokens, path, resourceId) {
        if (resourceTokens && Object.keys(resourceTokens).length > 0) {
            if (!path && !resourceId) {
                return resourceTokens[Object.keys(resourceTokens)[0]];
            }
            if (resourceId && resourceTokens[resourceId]) {
                return resourceTokens[resourceId];
            }
            if (!path || path.length < 4) {
                return null;
            }
            path = path[0] === "/" ? path.substring(1) : path;
            path = path[path.length - 1] === "/" ? path.substring(0, path.length - 1) : path;
            const pathSegments = (path && path.split("/")) || [];
            let index = pathSegments.length % 2 === 0 ? pathSegments.length - 1 : pathSegments.length - 2;
            for (; index > 0; index -= 2) {
                const id = decodeURI(pathSegments[index]);
                if (resourceTokens[id]) {
                    return resourceTokens[id];
                }
            }
        }
        return null;
    }
    static getAuthorizationTokenUsingTokenProvider(tokenProvider, requestInfo) {
        requestInfo.getAuthorizationTokenUsingMasterKey = AuthHandler.getAuthorizationTokenUsingMasterKey;
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const callback = (err, token) => {
                if (reject) {
                    return reject(err);
                }
                resolve(token);
            };
            const results = tokenProvider.getToken(requestInfo, callback);
            if (results.then && typeof results.then === "function") {
                resolve(yield results);
            }
        }));
    }
}
exports.AuthHandler = AuthHandler;
//# sourceMappingURL=auth.js.map