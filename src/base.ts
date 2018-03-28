import { AuthHandler } from "./auth";
import { Constants, Platform } from "./common";

/*
//SCRIPT START
function initializeProperties(target, members, prefix) {
    var keys = Object.keys(members);
    var properties;
    var i, len;
    for (i = 0, len = keys.length; i < len; i++) {
        var key = keys[i];
        var enumerable = key.charCodeAt(0) !== 95; // 95 = '_'
        var member = members[key];
        if (member && typeof member === "object") {
            if (member.value !== undefined || typeof member.get === "function" || typeof member.set === "function") {
                if (member.enumerable === undefined) {
                    member.enumerable = enumerable;
                }
                if (prefix && member.setName && typeof member.setName === "function") {
                    member.setName(prefix + "." + key);
                }
                properties = properties || {};
                properties[key] = member;
                continue;
            }
        }
        if (!enumerable) {
            properties = properties || {};
            properties[key] = { value: member, enumerable: enumerable, configurable: true, writable: true };
            continue;
        }
        target[key] = member;
    }
    if (properties) {
        Object.defineProperties(target, properties);
    }
}
*/
/**
*  Defines a new namespace with the specified name under the specified parent namespace.
* @param {Object} parentNamespace - The parent namespace.
* @param {String} name - The name of the new namespace.
* @param {Object} members - The members of the new namespace.
* @returns {Function} - The newly-defined namespace.
*/
/*
function defineWithParent(parentNamespace, name, members) {
    var currentNamespace = parentNamespace || {};

    if (name) {
        var namespaceFragments = name.split(".");
        for (var i = 0, len = namespaceFragments.length; i < len; i++) {
            var namespaceName = namespaceFragments[i];
            if (!currentNamespace[namespaceName]) {
                Object.defineProperty(currentNamespace, namespaceName,
                    { value: {}, writable: false, enumerable: true, configurable: true }
                );
            }
            currentNamespace = currentNamespace[namespaceName];
        }
    }

    if (members) {
        initializeProperties(currentNamespace, members, name || "<ANONYMOUS>");
    }

    return currentNamespace;
}
*/

/**
*  Defines a new namespace with the specified name.
* @param {String} name - The name of the namespace. This could be a dot-separated name for nested namespaces.
* @param {Object} members - The members of the new namespace.
* @returns {Function} - The newly-defined namespace.
*/
/*
function define(name, members) {
    return defineWithParent(undefined, name, members);
}
*/
/**
*  Defines a class using the given constructor and the specified instance members.
* @param {Function} constructor - A constructor function that is used to instantiate this class.
* @param {Object} instanceMembers - The set of instance fields, properties, and methods to be made available on the class.
* @param {Object} staticMembers - The set of static fields, properties, and methods to be made available on the class.
* @returns {Function} - The newly-defined class.
*/
/*
function defineClass(constructor, instanceMembers, staticMembers) {
    constructor = constructor || function () { };
    if (instanceMembers) {
        initializeProperties(constructor.prototype, instanceMembers);
    }
    if (staticMembers) {
        initializeProperties(constructor, staticMembers);
    }
    return constructor;
}
*/
/**
*  Creates a sub-class based on the supplied baseClass parameter, using prototypal inheritance.
* @param {Function} baseClass - The class to inherit from.
* @param {Function} constructor - A constructor function that is used to instantiate this class.
* @param {Object} instanceMembers - The set of instance fields, properties, and methods to be made available on the class.
* @param {Object} staticMembers - The set of static fields, properties, and methods to be made available on the class.
* @returns {Function} - The newly-defined class.
*/
/*
function derive(baseClass, constructor, instanceMembers, staticMembers) {
    if (baseClass) {
        constructor = constructor || function () { };
        var basePrototype = baseClass.prototype;
        constructor.prototype = Object.create(basePrototype);
        Object.defineProperty(constructor.prototype, "constructor", { value: constructor, writable: true, configurable: true, enumerable: true });
        if (instanceMembers) {
            initializeProperties(constructor.prototype, instanceMembers);
        }
        if (staticMembers) {
            initializeProperties(constructor, staticMembers);
        }
        return constructor;
    } else {
        return defineClass(constructor, instanceMembers, staticMembers);
    }
}
*/
export class Base {
    static extend(arg0: any, arg1: any): any {
        throw new Error("Method not implemented.");
    }
    static map(arg0: any, arg1: any): any {
        throw new Error("Method not implemented.");
    }
    public static NotImplementedException: string = "NotImplementedException";

    // TODO: Remove. These aren't needed.
    //defineWithParent: defineWithParent,

    //define: define,

    //defineClass: defineClass,

    //derive: derive,

    /*extend: function (obj, extent) {
        for (var property in extent) {
            if (typeof extent[property] !== "function") {
                obj[property] = extent[property];
            }
        }
        return obj;
    },*/

    /*map: function (list, fn) {
        var result = [];
        for (var i = 0, n = list.length; i < n; i++) {
            result.push(fn(list[i]));
        }
        
        return result;
    },*/

    /** @ignore */
    public static jsonStringifyAndEscapeNonASCII(arg: string) {
        // escapes non-ASCII characters as \uXXXX
        return JSON.stringify(arg).replace(/[\u0080-\uFFFF]/g, function (m) {
            return "\\u" + ("0000" + m.charCodeAt(0).toString(16)).slice(-4);
        });
    }

    public static async getHeaders(
        documentClient: any, // TODO
        defaultHeaders: { [key: string]: string | boolean },
        verb: string, path: string,
        resourceId: string,
        resourceType: string,
        options: any, // TODO 
        partitionKeyRangeId: string): Promise<{ [key: string]: string | boolean }> {

        const headers: { [key: string]: string | boolean } = Object.assign({}, defaultHeaders);
        options = options || {};

        if (options.continuation) {
            headers[Constants.HttpHeaders.Continuation] = options.continuation;
        }

        if (options.preTriggerInclude) {
            headers[Constants.HttpHeaders.PreTriggerInclude] = options.preTriggerInclude.constructor === Array ? options.preTriggerInclude.join(",") : options.preTriggerInclude;
        }

        if (options.postTriggerInclude) {
            headers[Constants.HttpHeaders.PostTriggerInclude] = options.postTriggerInclude.constructor === Array ? options.postTriggerInclude.join(",") : options.postTriggerInclude;
        }

        if (options.offerType) {
            headers[Constants.HttpHeaders.OfferType] = options.offerType;
        }

        if (options.offerThroughput) {
            headers[Constants.HttpHeaders.OfferThroughput] = options.offerThroughput;
        }

        if (options.maxItemCount) {
            headers[Constants.HttpHeaders.PageSize] = options.maxItemCount;
        }

        if (options.accessCondition) {
            if (options.accessCondition.type === "IfMatch") {
                headers[Constants.HttpHeaders.IfMatch] = options.accessCondition.condition;
            } else {
                headers[Constants.HttpHeaders.IfNoneMatch] = options.accessCondition.condition;
            }
        }

        if (options.a_im) {
            headers[Constants.HttpHeaders.A_IM] = options.a_im;
        }

        if (options.indexingDirective) {
            headers[Constants.HttpHeaders.IndexingDirective] = options.indexingDirective;
        }

        // TODO: add consistency level validation.
        if (options.consistencyLevel) {
            headers[Constants.HttpHeaders.ConsistencyLevel] = options.consistencyLevel;
        }

        if (options.resourceTokenExpirySeconds) {
            headers[Constants.HttpHeaders.ResourceTokenExpiry] = options.resourceTokenExpirySeconds;
        }

        // TODO: add session token automatic handling in case of session consistency.
        if (options.sessionToken) {
            headers[Constants.HttpHeaders.SessionToken] = options.sessionToken;
        }

        if (options.enableScanInQuery) {
            headers[Constants.HttpHeaders.EnableScanInQuery] = options.enableScanInQuery;
        }

        if (options.enableCrossPartitionQuery) {
            headers[Constants.HttpHeaders.EnableCrossPartitionQuery] = options.enableCrossPartitionQuery;
        }

        if (options.maxDegreeOfParallelism != undefined) {
            headers[Constants.HttpHeaders.ParallelizeCrossPartitionQuery] = true;
        }

        if (options.populateQuotaInfo) {
            headers[Constants.HttpHeaders.PopulateQuotaInfo] = true;
        }

        // If the user is not using partition resolver, we add options.partitonKey to the header for elastic collections
        if (documentClient.partitionResolver === undefined || documentClient.partitionResolver === null) {
            if (options.partitionKey !== undefined) {
                let partitionKey = options.partitionKey;
                if (partitionKey === null || partitionKey.constructor !== Array) {
                    partitionKey = [partitionKey];
                }
                headers[Constants.HttpHeaders.PartitionKey] = Base.jsonStringifyAndEscapeNonASCII(partitionKey);
            }
        }

        if (documentClient.masterKey || documentClient.tokenProvider) {
            headers[Constants.HttpHeaders.XDate] = new Date().toUTCString();
        }

        if (verb === "post" || verb === "put") {
            if (!headers[Constants.HttpHeaders.ContentType]) {
                headers[Constants.HttpHeaders.ContentType] = Constants.MediaTypes.Json;
            }
        }

        if (!headers[Constants.HttpHeaders.Accept]) {
            headers[Constants.HttpHeaders.Accept] = Constants.MediaTypes.Json;
        }

        if (partitionKeyRangeId !== undefined) {
            headers[Constants.HttpHeaders.PartitionKeyRangeID] = partitionKeyRangeId;
        }

        if (options.enableScriptLogging) {
            headers[Constants.HttpHeaders.EnableScriptLogging] = options.enableScriptLogging;
        }

        if (options.offerEnableRUPerMinuteThroughput) {
            headers[Constants.HttpHeaders.OfferIsRUPerMinuteThroughputEnabled] = true;
        }

        if (options.disableRUPerMinuteUsage) {
            headers[Constants.HttpHeaders.DisableRUPerMinuteUsage] = true;
        }
        if (documentClient.masterKey || documentClient.resourceTokens || documentClient.tokenProvider) {
            const token = await AuthHandler.getAuthorizationHeader(documentClient, verb, path, resourceId, resourceType, headers)
            headers[Constants.HttpHeaders.Authorization] = token;
        }
        return headers;
    }

    public static parseLink(resourcePath: string) {
        if (resourcePath.length === 0) {
            /* for DatabaseAccount case, both type and objectBody will be undefined. */
            return {
                type: undefined,
                objectBody: undefined
            };
        }

        if (resourcePath[resourcePath.length - 1] !== "/") {
            resourcePath = resourcePath + "/";
        }

        if (resourcePath[0] !== "/") {
            resourcePath = "/" + resourcePath;
        }

        /*
        / The path will be in the form of /[resourceType]/[resourceId]/ .... /[resourceType]//[resourceType]/[resourceId]/ .... /[resourceType]/[resourceId]/
        / or /[resourceType]/[resourceId]/ .... /[resourceType]/[resourceId]/[resourceType]/[resourceId]/ .... /[resourceType]/[resourceId]/
        / The result of split will be in the form of [[[resourceType], [resourceId] ... ,[resourceType], [resourceId], ""]
        / In the first case, to extract the resourceId it will the element before last ( at length -2 ) and the the type will before it ( at length -3 )
        / In the second case, to extract the resource type it will the element before last ( at length -2 )
        */
        const pathParts = resourcePath.split("/");
        let id, type;
        if (pathParts.length % 2 === 0) {
            // request in form /[resourceType]/[resourceId]/ .... /[resourceType]/[resourceId].
            id = pathParts[pathParts.length - 2];
            type = pathParts[pathParts.length - 3];
        } else {
            // request in form /[resourceType]/[resourceId]/ .... /[resourceType]/.
            id = pathParts[pathParts.length - 3];
            type = pathParts[pathParts.length - 2];
        }

        const result = {
            type: type,
            objectBody: {
                id: id,
                self: resourcePath
            }
        };

        return result;
    }

    public static parsePath(path: string) {
        const pathParts = [];
        let currentIndex = 0;

        const throwError = function () {
            throw new Error("Path " + path + " is invalid at index " + currentIndex);
        };

        const getEscapedToken = function () {
            const quote = path[currentIndex];
            let newIndex = ++currentIndex;

            while (true) {
                newIndex = path.indexOf(quote, newIndex);
                if (newIndex == -1) {
                    throwError();
                }

                if (path[newIndex - 1] !== '\\') break;

                ++newIndex;
            }

            const token = path.substr(currentIndex, newIndex - currentIndex);
            currentIndex = newIndex + 1;
            return token;
        };

        const getToken = function () {
            var newIndex = path.indexOf('/', currentIndex);
            var token = null;
            if (newIndex == -1) {
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
            if (path[currentIndex] !== '/') {
                throwError();
            }

            if (++currentIndex == path.length) break;

            if (path[currentIndex] === '\"' || path[currentIndex] === '\'') {
                pathParts.push(getEscapedToken());
            }
            else {
                pathParts.push(getToken());
            }
        }

        return pathParts;
    }

    public static getDatabaseLink(link: string) {
        return link.split('/').slice(0, 2).join('/');
    }

    public static getCollectionLink(link: string) {
        return link.split('/').slice(0, 4).join('/');
    }

    public static getAttachmentIdFromMediaId(mediaId: string) {
        // Replace - with / on the incoming mediaId.  This will preserve the / so that we can revert it later.
        const buffer = new Buffer(mediaId.replace(/-/g, "/"), "base64");
        const ResoureIdLength = 20;
        let attachmentId = "";
        if (buffer.length > ResoureIdLength) {
            // After the base64 conversion, change the / back to a - to get the proper attachmentId
            attachmentId = buffer.toString("base64", 0, ResoureIdLength).replace(/\//g, "-");
        } else {
            attachmentId = mediaId;
        }

        return attachmentId;
    }

    public static getHexaDigit() {
        return Math.floor(Math.random() * 16).toString(16);
    }

    // TODO: repalce with well known library?
    public static generateGuidId() {
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

    public static isLinkNameBased(link: string) {
        const parts = link.split("/");
        let firstId = "";
        let count = 0;
        // Get the first id from path.
        for (var i = 0; i < parts.length; ++i) {
            if (!parts[i]) {
                // Skip empty string.
                continue;
            }
            ++count;
            if (count === 1 && parts[i].toLowerCase() !== "dbs") {
                return false;
            }
            if (count === 2) {
                firstId = parts[i];
                break;
            }
        }
        if (!firstId) return false;
        if (firstId.length !== 8) return true;
        var decodedDataLength = Platform.getDecodedDataLength(firstId);
        if (decodedDataLength !== 4) return true;
        return false;
    }

    public static _trimSlashes(source: string) {
        return source.replace(Constants.RegularExpressions.TrimLeftSlashes, "")
            .replace(Constants.RegularExpressions.TrimRightSlashes, "");
    }


    public static _isValidCollectionLink(link: string) {
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
}
