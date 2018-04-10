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
const auth_1 = require("./auth");
const common_1 = require("./common");
class Base {
    static extend(arg0, arg1) {
        throw new Error("Method not implemented.");
    }
    static map(arg0, arg1) {
        throw new Error("Method not implemented.");
    }
    static jsonStringifyAndEscapeNonASCII(arg) {
        return JSON.stringify(arg).replace(/[\u0080-\uFFFF]/g, (m) => {
            return "\\u" + ("0000" + m.charCodeAt(0).toString(16)).slice(-4);
        });
    }
    static getHeaders(documentClient, defaultHeaders, verb, path, resourceId, resourceType, options, partitionKeyRangeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = Object.assign({}, defaultHeaders);
            options = options || {};
            if (options.continuation) {
                headers[common_1.Constants.HttpHeaders.Continuation] = options.continuation;
            }
            if (options.preTriggerInclude) {
                headers[common_1.Constants.HttpHeaders.PreTriggerInclude] =
                    options.preTriggerInclude.constructor === Array
                        ? options.preTriggerInclude.join(",")
                        : options.preTriggerInclude;
            }
            if (options.postTriggerInclude) {
                headers[common_1.Constants.HttpHeaders.PostTriggerInclude] =
                    options.postTriggerInclude.constructor === Array
                        ? options.postTriggerInclude.join(",")
                        : options.postTriggerInclude;
            }
            if (options.offerType) {
                headers[common_1.Constants.HttpHeaders.OfferType] = options.offerType;
            }
            if (options.offerThroughput) {
                headers[common_1.Constants.HttpHeaders.OfferThroughput] = options.offerThroughput;
            }
            if (options.maxItemCount) {
                headers[common_1.Constants.HttpHeaders.PageSize] = options.maxItemCount;
            }
            if (options.accessCondition) {
                if (options.accessCondition.type === "IfMatch") {
                    headers[common_1.Constants.HttpHeaders.IfMatch] = options.accessCondition.condition;
                }
                else {
                    headers[common_1.Constants.HttpHeaders.IfNoneMatch] = options.accessCondition.condition;
                }
            }
            if (options.a_im) {
                headers[common_1.Constants.HttpHeaders.A_IM] = options.a_im;
            }
            if (options.indexingDirective) {
                headers[common_1.Constants.HttpHeaders.IndexingDirective] = options.indexingDirective;
            }
            if (options.consistencyLevel) {
                headers[common_1.Constants.HttpHeaders.ConsistencyLevel] = options.consistencyLevel;
            }
            if (options.resourceTokenExpirySeconds) {
                headers[common_1.Constants.HttpHeaders.ResourceTokenExpiry] = options.resourceTokenExpirySeconds;
            }
            if (options.sessionToken) {
                headers[common_1.Constants.HttpHeaders.SessionToken] = options.sessionToken;
            }
            if (options.enableScanInQuery) {
                headers[common_1.Constants.HttpHeaders.EnableScanInQuery] = options.enableScanInQuery;
            }
            if (options.enableCrossPartitionQuery) {
                headers[common_1.Constants.HttpHeaders.EnableCrossPartitionQuery] = options.enableCrossPartitionQuery;
            }
            if (options.maxDegreeOfParallelism !== undefined) {
                headers[common_1.Constants.HttpHeaders.ParallelizeCrossPartitionQuery] = true;
            }
            if (options.populateQuotaInfo) {
                headers[common_1.Constants.HttpHeaders.PopulateQuotaInfo] = true;
            }
            if (documentClient.partitionResolver === undefined
                || documentClient.partitionResolver === null) {
                if (options.partitionKey !== undefined) {
                    let partitionKey = options.partitionKey;
                    if (partitionKey === null || !Array.isArray(partitionKey)) {
                        partitionKey = [partitionKey];
                    }
                    headers[common_1.Constants.HttpHeaders.PartitionKey] = Base.jsonStringifyAndEscapeNonASCII(partitionKey);
                }
            }
            if (documentClient.masterKey || documentClient.tokenProvider) {
                headers[common_1.Constants.HttpHeaders.XDate] = new Date().toUTCString();
            }
            if (verb === "post" || verb === "put") {
                if (!headers[common_1.Constants.HttpHeaders.ContentType]) {
                    headers[common_1.Constants.HttpHeaders.ContentType] = common_1.Constants.MediaTypes.Json;
                }
            }
            if (!headers[common_1.Constants.HttpHeaders.Accept]) {
                headers[common_1.Constants.HttpHeaders.Accept] = common_1.Constants.MediaTypes.Json;
            }
            if (partitionKeyRangeId !== undefined) {
                headers[common_1.Constants.HttpHeaders.PartitionKeyRangeID] = partitionKeyRangeId;
            }
            if (options.enableScriptLogging) {
                headers[common_1.Constants.HttpHeaders.EnableScriptLogging] = options.enableScriptLogging;
            }
            if (options.offerEnableRUPerMinuteThroughput) {
                headers[common_1.Constants.HttpHeaders.OfferIsRUPerMinuteThroughputEnabled] = true;
            }
            if (options.disableRUPerMinuteUsage) {
                headers[common_1.Constants.HttpHeaders.DisableRUPerMinuteUsage] = true;
            }
            if (documentClient.masterKey || documentClient.resourceTokens || documentClient.tokenProvider) {
                const token = yield auth_1.AuthHandler.getAuthorizationHeader(documentClient, verb, path, resourceId, resourceType, headers);
                headers[common_1.Constants.HttpHeaders.Authorization] = token;
            }
            return headers;
        });
    }
    static parseLink(resourcePath) {
        if (resourcePath.length === 0) {
            return {
                type: undefined,
                objectBody: undefined,
            };
        }
        if (resourcePath[resourcePath.length - 1] !== "/") {
            resourcePath = resourcePath + "/";
        }
        if (resourcePath[0] !== "/") {
            resourcePath = "/" + resourcePath;
        }
        const pathParts = resourcePath.split("/");
        let id;
        let type;
        if (pathParts.length % 2 === 0) {
            id = pathParts[pathParts.length - 2];
            type = pathParts[pathParts.length - 3];
        }
        else {
            id = pathParts[pathParts.length - 3];
            type = pathParts[pathParts.length - 2];
        }
        const result = {
            type,
            objectBody: {
                id,
                self: resourcePath,
            },
        };
        return result;
    }
    static parsePath(path) {
        const pathParts = [];
        let currentIndex = 0;
        const throwError = () => {
            throw new Error("Path " + path + " is invalid at index " + currentIndex);
        };
        const getEscapedToken = () => {
            const quote = path[currentIndex];
            let newIndex = ++currentIndex;
            while (true) {
                newIndex = path.indexOf(quote, newIndex);
                if (newIndex === -1) {
                    throwError();
                }
                if (path[newIndex - 1] !== "\\") {
                    break;
                }
                ++newIndex;
            }
            const token = path.substr(currentIndex, newIndex - currentIndex);
            currentIndex = newIndex + 1;
            return token;
        };
        const getToken = () => {
            const newIndex = path.indexOf("/", currentIndex);
            let token = null;
            if (newIndex === -1) {
                token = path.substr(currentIndex);
                currentIndex = path.length;
            }
            else {
                token = path.substr(currentIndex, newIndex - currentIndex);
                currentIndex = newIndex;
            }
            token = token.trim();
            return token;
        };
        while (currentIndex < path.length) {
            if (path[currentIndex] !== "/") {
                throwError();
            }
            if (++currentIndex === path.length) {
                break;
            }
            if (path[currentIndex] === '\"' || path[currentIndex] === "'") {
                pathParts.push(getEscapedToken());
            }
            else {
                pathParts.push(getToken());
            }
        }
        return pathParts;
    }
    static getDatabaseLink(link) {
        return link.split("/").slice(0, 2).join("/");
    }
    static getCollectionLink(link) {
        return link.split("/").slice(0, 4).join("/");
    }
    static getAttachmentIdFromMediaId(mediaId) {
        const buffer = new Buffer(mediaId.replace(/-/g, "/"), "base64");
        const ResoureIdLength = 20;
        return buffer.length > ResoureIdLength
            ? buffer.toString("base64", 0, ResoureIdLength).replace(/\//g, "-")
            : mediaId;
    }
    static getHexaDigit() {
        return Math.floor(Math.random() * 16).toString(16);
    }
    static generateGuidId() {
        let id = "";
        for (let i = 0; i < 8; i++) {
            id += Base.getHexaDigit();
        }
        id += "-";
        for (let i = 0; i < 4; i++) {
            id += Base.getHexaDigit();
        }
        id += "-";
        for (let i = 0; i < 4; i++) {
            id += Base.getHexaDigit();
        }
        id += "-";
        for (let i = 0; i < 4; i++) {
            id += Base.getHexaDigit();
        }
        id += "-";
        for (let i = 0; i < 12; i++) {
            id += Base.getHexaDigit();
        }
        return id;
    }
    static isLinkNameBased(link) {
        const parts = link.split("/");
        let firstId = "";
        let count = 0;
        for (const part of parts) {
            if (!part) {
                continue;
            }
            ++count;
            if (count === 1 && part.toLowerCase() !== "dbs") {
                return false;
            }
            if (count === 2) {
                firstId = part;
                break;
            }
        }
        if (!firstId) {
            return false;
        }
        if (firstId.length !== 8) {
            return true;
        }
        const decodedDataLength = common_1.Platform.getDecodedDataLength(firstId);
        if (decodedDataLength !== 4) {
            return true;
        }
        return false;
    }
    static _trimSlashes(source) {
        return source.replace(common_1.Constants.RegularExpressions.TrimLeftSlashes, "")
            .replace(common_1.Constants.RegularExpressions.TrimRightSlashes, "");
    }
    static _isValidCollectionLink(link) {
        if (typeof link !== "string") {
            return false;
        }
        const parts = Base._trimSlashes(link).split("/");
        if (parts && parts.length !== 4) {
            return false;
        }
        if (parts[0] !== "dbs") {
            return false;
        }
        if (parts[2] !== "colls") {
            return false;
        }
        return true;
    }
    static ThrowOrCallback(callback, err) {
        if (callback) {
            callback(err);
        }
        else {
            throw err;
        }
    }
    static ResponseOrCallback(callback, value) {
        if (callback) {
            callback(null, value.result, value.headers);
        }
        else {
            return value;
        }
    }
}
Base.NotImplementedException = "NotImplementedException";
exports.Base = Base;
//# sourceMappingURL=base.js.map