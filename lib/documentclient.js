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
const base_1 = require("./base");
const common_1 = require("./common");
const DocumentClientBase_1 = require("./DocumentClientBase");
const documents_1 = require("./documents");
const queryIterator_1 = require("./queryIterator");
class DocumentClient extends DocumentClientBase_1.DocumentClientBase {
    constructor(urlConnection, auth, connectionPolicy, consistencyLevel) {
        super(urlConnection, auth, connectionPolicy, consistencyLevel);
        this.urlConnection = urlConnection;
    }
    getWriteEndpoint(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const p = this._globalEndpointManager.getWriteEndpoint();
            if (callback) {
                p.then(callback, callback);
            }
            else {
                return p;
            }
        });
    }
    getReadEndpoint(callback) {
        const p = this._globalEndpointManager.getReadEndpoint();
        if (callback) {
            p.then(callback, callback);
        }
        else {
            return p;
        }
    }
    createDatabase(body, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const err = {};
        if (!this.isResourceValid(body, err)) {
            callback(err);
            return;
        }
        const path = "/dbs";
        this.create(body, path, "dbs", undefined, undefined, options);
    }
    createCollection(databaseLink, body, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const err = {};
            if (!this.isResourceValid(body, err)) {
                callback(err);
                return;
            }
            try {
                const isNameBased = base_1.Base.isLinkNameBased(databaseLink);
                const path = this.getPathFromLink(databaseLink, "colls", isNameBased);
                const id = this.getIdFromLink(databaseLink, isNameBased);
                const response = yield this.create(body, path, "colls", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    createDocument(documentsFeedOrDatabaseLink, body, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const partitionResolver = this.partitionResolvers[documentsFeedOrDatabaseLink];
            const collectionLink = (partitionResolver === undefined || partitionResolver === null)
                ? documentsFeedOrDatabaseLink
                : this.resolveCollectionLinkForCreate(partitionResolver, body);
            try {
                const response = yield this.createDocumentPrivate(collectionLink, body, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    createAttachment(documentLink, body, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const err = {};
            if (!this.isResourceValid(body, err)) {
                base_1.Base.ThrowOrCallback(callback, err);
                return;
            }
            const isNameBased = base_1.Base.isLinkNameBased(documentLink);
            const path = this.getPathFromLink(documentLink, "attachments", isNameBased);
            const id = this.getIdFromLink(documentLink, isNameBased);
            try {
                const response = yield this.create(body, path, "attachments", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    createUser(databaseLink, body, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const err = {};
            if (!this.isResourceValid(body, err)) {
                base_1.Base.ThrowOrCallback(callback, err);
                return;
            }
            const isNameBased = base_1.Base.isLinkNameBased(databaseLink);
            const path = this.getPathFromLink(databaseLink, "users", isNameBased);
            const id = this.getIdFromLink(databaseLink, isNameBased);
            try {
                const response = yield this.create(body, path, "users", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    createPermission(userLink, body, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const err = {};
            if (!this.isResourceValid(body, err)) {
                base_1.Base.ThrowOrCallback(callback, err);
                return;
            }
            const isNameBased = base_1.Base.isLinkNameBased(userLink);
            const path = this.getPathFromLink(userLink, "permissions", isNameBased);
            const id = this.getIdFromLink(userLink, isNameBased);
            try {
                const response = yield this.create(body, path, "permissions", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    createTrigger(collectionLink, trigger, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            if (trigger.serverScript) {
                trigger.body = trigger.serverScript.toString();
            }
            else if (trigger.body) {
                trigger.body = trigger.body.toString();
            }
            const err = {};
            if (!this.isResourceValid(trigger, err)) {
                base_1.Base.ThrowOrCallback(callback, err);
                return;
            }
            const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
            const path = this.getPathFromLink(collectionLink, "triggers", isNameBased);
            const id = this.getIdFromLink(collectionLink, isNameBased);
            try {
                const response = yield this.create(trigger, path, "triggers", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    createUserDefinedFunction(collectionLink, udf, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            if (udf.serverScript) {
                udf.body = udf.serverScript.toString();
            }
            else if (udf.body) {
                udf.body = udf.body.toString();
            }
            const err = {};
            if (!this.isResourceValid(udf, err)) {
                base_1.Base.ThrowOrCallback(callback, err);
                return;
            }
            const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
            const path = this.getPathFromLink(collectionLink, "udfs", isNameBased);
            const id = this.getIdFromLink(collectionLink, isNameBased);
            try {
                const response = yield this.create(udf, path, "udfs", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    createStoredProcedure(collectionLink, sproc, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            if (sproc.serverScript) {
                sproc.body = sproc.serverScript.toString();
            }
            else if (sproc.body) {
                sproc.body = sproc.body.toString();
            }
            const err = {};
            if (!this.isResourceValid(sproc, err)) {
                base_1.Base.ThrowOrCallback(callback, err);
                return;
            }
            const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
            const path = this.getPathFromLink(collectionLink, "sprocs", isNameBased);
            const id = this.getIdFromLink(collectionLink, isNameBased);
            try {
                const response = yield this.create(sproc, path, "sprocs", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    createAttachmentAndUploadMedia(documentLink, readableStream, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            let initialHeaders = base_1.Base.extend({}, this.defaultHeaders);
            initialHeaders = base_1.Base.extend(initialHeaders, options && options.initialHeaders);
            if (options.slug) {
                initialHeaders[common_1.Constants.HttpHeaders.Slug] = options.slug;
            }
            initialHeaders[common_1.Constants.HttpHeaders.ContentType] = options.contentType || common_1.Constants.MediaTypes.OctetStream;
            const isNameBased = base_1.Base.isLinkNameBased(documentLink);
            const path = this.getPathFromLink(documentLink, "attachments", isNameBased);
            const id = this.getIdFromLink(documentLink, isNameBased);
            try {
                const response = yield this.create(readableStream, path, "attachments", id, initialHeaders, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    readDatabase(databaseLink, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const isNameBased = base_1.Base.isLinkNameBased(databaseLink);
            const path = this.getPathFromLink(databaseLink, "", isNameBased);
            const id = this.getIdFromLink(databaseLink, isNameBased);
            try {
                const response = yield this.read(path, "dbs", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    readCollection(collectionLink, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
            const path = this.getPathFromLink(collectionLink, "", isNameBased);
            const id = this.getIdFromLink(collectionLink, isNameBased);
            try {
                const response = yield this.read(path, "colls", id, undefined, options);
                this.partitionKeyDefinitionCache[collectionLink] = response.result.partitionKey;
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    readDocument(documentLink, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const isNameBased = base_1.Base.isLinkNameBased(documentLink);
            const path = this.getPathFromLink(documentLink, "", isNameBased);
            const id = this.getIdFromLink(documentLink, isNameBased);
            try {
                const response = yield this.read(path, "docs", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    readAttachment(attachmentLink, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const isNameBased = base_1.Base.isLinkNameBased(attachmentLink);
            const path = this.getPathFromLink(attachmentLink, "", isNameBased);
            const id = this.getIdFromLink(attachmentLink, isNameBased);
            try {
                const response = yield this.read(path, "attachments", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    readUser(userLink, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const isNameBased = base_1.Base.isLinkNameBased(userLink);
            const path = this.getPathFromLink(userLink, "", isNameBased);
            const id = this.getIdFromLink(userLink, isNameBased);
            try {
                const response = yield this.read(path, "users", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    readPermission(permissionLink, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const isNameBased = base_1.Base.isLinkNameBased(permissionLink);
            const path = this.getPathFromLink(permissionLink, "", isNameBased);
            const id = this.getIdFromLink(permissionLink, isNameBased);
            try {
                const response = yield this.read(path, "permissions", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    readTrigger(triggerLink, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const resourceInfo = base_1.Base.parseLink(triggerLink);
            const isNameBased = base_1.Base.isLinkNameBased(triggerLink);
            const path = this.getPathFromLink(triggerLink, "", isNameBased);
            const id = this.getIdFromLink(triggerLink, isNameBased);
            try {
                const response = yield this.read(path, "triggers", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    readUserDefinedFunction(udfLink, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const isNameBased = base_1.Base.isLinkNameBased(udfLink);
            const path = this.getPathFromLink(udfLink, "", isNameBased);
            const id = this.getIdFromLink(udfLink, isNameBased);
            try {
                const response = yield this.read(path, "udfs", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    readStoredProcedure(sprocLink, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const isNameBased = base_1.Base.isLinkNameBased(sprocLink);
            const path = this.getPathFromLink(sprocLink, "", isNameBased);
            const id = this.getIdFromLink(sprocLink, isNameBased);
            try {
                const response = yield this.read(path, "sprocs", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    readConflict(conflictLink, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const isNameBased = base_1.Base.isLinkNameBased(conflictLink);
            const path = this.getPathFromLink(conflictLink, "", isNameBased);
            const id = this.getIdFromLink(conflictLink, isNameBased);
            try {
                const response = yield this.read(path, "users", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    readDatabases(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queryDatabases(undefined, options);
        });
    }
    readCollections(databaseLink, options) {
        return this.queryCollections(databaseLink, undefined, options);
    }
    readDocuments(collectionLink, options) {
        return this.queryDocuments(collectionLink, undefined, options);
    }
    readPartitionKeyRanges(collectionLink, options) {
        return this.queryPartitionKeyRanges(collectionLink, undefined, options);
    }
    readAttachments(documentLink, options) {
        return this.queryAttachments(documentLink, undefined, options);
    }
    readUsers(databaseLink, options) {
        return this.queryUsers(databaseLink, undefined, options);
    }
    readPermissions(userLink, options) {
        return this.queryPermissions(userLink, undefined, options);
    }
    readTriggers(collectionLink, options) {
        return this.queryTriggers(collectionLink, undefined, options);
    }
    readUserDefinedFunctions(collectionLink, options) {
        return this.queryUserDefinedFunctions(collectionLink, undefined, options);
    }
    readStoredProcedures(collectionLink, options) {
        return this.queryStoredProcedures(collectionLink, undefined, options);
    }
    readConflicts(collectionLink, options) {
        return this.queryConflicts(collectionLink, undefined, options);
    }
    processQueryFeedResponse(res, isQuery, result, create) {
        if (isQuery) {
            return { result: result(res.result), headers: res.headers };
        }
        else {
            const newResult = base_1.Base.map(result(res.result), (body) => {
                return create(this, body);
            });
            return { result: newResult, headers: res.headers };
        }
    }
    queryFeed(documentclient, path, type, id, resultFn, createFn, query, options, partitionKeyRangeId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const readEndpoint = yield this._globalEndpointManager.getReadEndpoint();
                const request = {
                    path,
                    operationType: common_1.Constants.OperationTypes.Query,
                    client: this,
                    endpointOverride: null,
                };
                let initialHeaders = base_1.Base.extend({}, documentclient.defaultHeaders);
                initialHeaders = base_1.Base.extend(initialHeaders, options && options.initialHeaders);
                if (query === undefined) {
                    const reqHeaders = yield base_1.Base.getHeaders(documentclient, initialHeaders, "get", path, id, type, options, partitionKeyRangeId);
                    this.applySessionToken(path, reqHeaders);
                    const { result, headers: resHeaders } = yield documentclient.get(readEndpoint, request, reqHeaders);
                    this.captureSessionToken(path, common_1.Constants.OperationTypes.Query, reqHeaders, resHeaders);
                    return this.processQueryFeedResponse({ result, headers: resHeaders }, !!query, resultFn, createFn);
                }
                else {
                    initialHeaders[common_1.Constants.HttpHeaders.IsQuery] = "true";
                    switch (this.queryCompatibilityMode) {
                        case documents_1.QueryCompatibilityMode.SqlQuery:
                            initialHeaders[common_1.Constants.HttpHeaders.ContentType] = common_1.Constants.MediaTypes.SQL;
                            break;
                        case documents_1.QueryCompatibilityMode.Query:
                        case documents_1.QueryCompatibilityMode.Default:
                        default:
                            if (typeof query === "string") {
                                query = { query };
                            }
                            initialHeaders[common_1.Constants.HttpHeaders.ContentType] = common_1.Constants.MediaTypes.QueryJson;
                            break;
                    }
                    const reqHeaders = yield base_1.Base.getHeaders(documentclient, initialHeaders, "post", path, id, type, options, partitionKeyRangeId);
                    this.applySessionToken(path, reqHeaders);
                    const { result, headers: resHeaders } = yield documentclient.post(readEndpoint, request, query, reqHeaders);
                    this.captureSessionToken(path, common_1.Constants.OperationTypes.Query, reqHeaders, resHeaders);
                    return this.processQueryFeedResponse({ result, headers: resHeaders }, !!query, resultFn, createFn);
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    queryDatabases(query, options) {
        const cb = (innerOptions) => {
            return this.queryFeed(this, "/dbs", "dbs", "", (result) => result.Databases, (parent, body) => body, query, innerOptions);
        };
        return new queryIterator_1.QueryIterator(this, query, options, cb);
    }
    queryCollections(databaseLink, query, options) {
        const isNameBased = base_1.Base.isLinkNameBased(databaseLink);
        const path = this.getPathFromLink(databaseLink, "colls", isNameBased);
        const id = this.getIdFromLink(databaseLink, isNameBased);
        return new queryIterator_1.QueryIterator(this, query, options, (innerOptions) => {
            return this.queryFeed(this, path, "colls", id, (result) => result.DocumentCollections, (parent, body) => body, query, innerOptions);
        });
    }
    queryDocuments(documentsFeedOrDatabaseLink, query, options) {
        const partitionResolver = this.partitionResolvers[documentsFeedOrDatabaseLink];
        const collectionLinks = (partitionResolver === undefined || partitionResolver === null)
            ? [documentsFeedOrDatabaseLink]
            : partitionResolver.resolveForRead(options && options.partitionKey);
        return this.queryDocumentsPrivate(collectionLinks, query, options);
    }
    queryPartitionKeyRanges(collectionLink, query, options) {
        const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
        const path = this.getPathFromLink(collectionLink, "pkranges", isNameBased);
        const id = this.getIdFromLink(collectionLink, isNameBased);
        return new queryIterator_1.QueryIterator(this, query, options, (innerOptions) => {
            return this.queryFeed(this, path, "pkranges", id, (result) => result.PartitionKeyRanges, (parent, body) => body, query, innerOptions);
        });
    }
    queryAttachments(documentLink, query, options) {
        const isNameBased = base_1.Base.isLinkNameBased(documentLink);
        const path = this.getPathFromLink(documentLink, "attachments", isNameBased);
        const id = this.getIdFromLink(documentLink, isNameBased);
        return new queryIterator_1.QueryIterator(this, query, options, (innerOptions) => {
            return this.queryFeed(this, path, "attachments", id, (result) => result.Attachments, (parent, body) => body, query, innerOptions);
        });
    }
    queryUsers(databaseLink, query, options) {
        const isNameBased = base_1.Base.isLinkNameBased(databaseLink);
        const path = this.getPathFromLink(databaseLink, "users", isNameBased);
        const id = this.getIdFromLink(databaseLink, isNameBased);
        return new queryIterator_1.QueryIterator(this, query, options, (innerOptions) => {
            return this.queryFeed(this, path, "users", id, (result) => result.Users, (parent, body) => body, query, innerOptions);
        });
    }
    queryPermissions(userLink, query, options) {
        const isNameBased = base_1.Base.isLinkNameBased(userLink);
        const path = this.getPathFromLink(userLink, "permissions", isNameBased);
        const id = this.getIdFromLink(userLink, isNameBased);
        return new queryIterator_1.QueryIterator(this, query, options, (innerOptions) => {
            return this.queryFeed(this, path, "permissions", id, (result) => result.Permissions, (parent, body) => body, query, innerOptions);
        });
    }
    queryTriggers(collectionLink, query, options) {
        const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
        const path = this.getPathFromLink(collectionLink, "triggers", isNameBased);
        const id = this.getIdFromLink(collectionLink, isNameBased);
        return new queryIterator_1.QueryIterator(this, query, options, (innerOptions) => {
            return this.queryFeed(this, path, "triggers", id, (result) => result.Triggers, (parent, body) => body, query, innerOptions);
        });
    }
    queryUserDefinedFunctions(collectionLink, query, options) {
        const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
        const path = this.getPathFromLink(collectionLink, "udfs", isNameBased);
        const id = this.getIdFromLink(collectionLink, isNameBased);
        return new queryIterator_1.QueryIterator(this, query, options, (innerOptions) => {
            return this.queryFeed(this, path, "udfs", id, (result) => result.UserDefinedFunctions, (parent, body) => body, query, innerOptions);
        });
    }
    queryStoredProcedures(collectionLink, query, options) {
        const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
        const path = this.getPathFromLink(collectionLink, "sprocs", isNameBased);
        const id = this.getIdFromLink(collectionLink, isNameBased);
        return new queryIterator_1.QueryIterator(this, query, options, (innerOptions) => {
            return this.queryFeed(this, path, "sprocs", id, (result) => result.StoredProcedures, (parent, body) => body, query, innerOptions);
        });
    }
    queryConflicts(collectionLink, query, options) {
        const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
        const path = this.getPathFromLink(collectionLink, "conflicts", isNameBased);
        const id = this.getIdFromLink(collectionLink, isNameBased);
        return new queryIterator_1.QueryIterator(this, query, options, (innerOptions) => {
            return this.queryFeed(this, path, "conflicts", id, (result) => result.Conflicts, (parent, body) => body, query, innerOptions);
        });
    }
    deleteDatabase(databaseLink, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const isNameBased = base_1.Base.isLinkNameBased(databaseLink);
        const path = this.getPathFromLink(databaseLink, "", isNameBased);
        const id = this.getIdFromLink(databaseLink, isNameBased);
        return this.deleteResource(path, "dbs", id, undefined, options, callback);
    }
    deleteCollection(collectionLink, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
        const path = this.getPathFromLink(collectionLink, "", isNameBased);
        const id = this.getIdFromLink(collectionLink, isNameBased);
        return this.deleteResource(path, "colls", id, undefined, options, callback);
    }
    deleteDocument(documentLink, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const isNameBased = base_1.Base.isLinkNameBased(documentLink);
        const path = this.getPathFromLink(documentLink, "", isNameBased);
        const id = this.getIdFromLink(documentLink, isNameBased);
        return this.deleteResource(path, "docs", id, undefined, options, callback);
    }
    deleteAttachment(attachmentLink, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const isNameBased = base_1.Base.isLinkNameBased(attachmentLink);
        const path = this.getPathFromLink(attachmentLink, "", isNameBased);
        const id = this.getIdFromLink(attachmentLink, isNameBased);
        return this.deleteResource(path, "attachments", id, undefined, options, callback);
    }
    deleteUser(userLink, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const isNameBased = base_1.Base.isLinkNameBased(userLink);
        const path = this.getPathFromLink(userLink, "", isNameBased);
        const id = this.getIdFromLink(userLink, isNameBased);
        return this.deleteResource(path, "users", id, undefined, options, callback);
    }
    deletePermission(permissionLink, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const isNameBased = base_1.Base.isLinkNameBased(permissionLink);
        const path = this.getPathFromLink(permissionLink, "", isNameBased);
        const id = this.getIdFromLink(permissionLink, isNameBased);
        return this.deleteResource(path, "permissions", id, undefined, options, callback);
    }
    deleteTrigger(triggerLink, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const isNameBased = base_1.Base.isLinkNameBased(triggerLink);
        const path = this.getPathFromLink(triggerLink, "", isNameBased);
        const id = this.getIdFromLink(triggerLink, isNameBased);
        return this.deleteResource(path, "triggers", id, undefined, options, callback);
    }
    deleteUserDefinedFunction(udfLink, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const isNameBased = base_1.Base.isLinkNameBased(udfLink);
        const path = this.getPathFromLink(udfLink, "", isNameBased);
        const id = this.getIdFromLink(udfLink, isNameBased);
        return this.deleteResource(path, "udfs", id, undefined, options, callback);
    }
    deleteStoredProcedure(sprocLink, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const isNameBased = base_1.Base.isLinkNameBased(sprocLink);
        const path = this.getPathFromLink(sprocLink, "", isNameBased);
        const id = this.getIdFromLink(sprocLink, isNameBased);
        return this.deleteResource(path, "sprocs", id, undefined, options, callback);
    }
    deleteConflict(conflictLink, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const isNameBased = base_1.Base.isLinkNameBased(conflictLink);
        const path = this.getPathFromLink(conflictLink, "", isNameBased);
        const id = this.getIdFromLink(conflictLink, isNameBased);
        return this.deleteResource(path, "conflicts", id, undefined, options, callback);
    }
    replaceCollection(collectionLink, collection, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const err = {};
        if (!this.isResourceValid(collection, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
        const path = this.getPathFromLink(collectionLink, "", isNameBased);
        const id = this.getIdFromLink(collectionLink, isNameBased);
        return this.replace(collection, path, "colls", id, undefined, options, callback);
    }
    replaceDocument(documentLink, newDocument, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            try {
                if (options.partitionKey === undefined && options.skipGetPartitionKeyDefinition !== true) {
                    const { result: partitionKeyDefinition } = yield this.getPartitionKeyDefinition(base_1.Base.getCollectionLink(documentLink));
                    options.partitionKey = this.extractPartitionKey(newDocument, partitionKeyDefinition);
                }
                const err = {};
                if (!this.isResourceValid(newDocument, err)) {
                    base_1.Base.ThrowOrCallback(callback, err);
                    return;
                }
                const isNameBased = base_1.Base.isLinkNameBased(documentLink);
                const path = this.getPathFromLink(documentLink, "", isNameBased);
                const id = this.getIdFromLink(documentLink, isNameBased);
                this.replace(newDocument, path, "docs", id, undefined, options, callback);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    replaceAttachment(attachmentLink, attachment, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const err = {};
        if (!this.isResourceValid(attachment, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(attachmentLink);
        const path = this.getPathFromLink(attachmentLink, "", isNameBased);
        const id = this.getIdFromLink(attachmentLink, isNameBased);
        return this.replace(attachment, path, "attachments", id, undefined, options, callback);
    }
    replaceUser(userLink, user, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const err = {};
        if (!this.isResourceValid(user, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(userLink);
        const path = this.getPathFromLink(userLink, "", isNameBased);
        const id = this.getIdFromLink(userLink, isNameBased);
        return this.replace(user, path, "users", id, undefined, options, callback);
    }
    replacePermission(permissionLink, permission, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const err = {};
        if (!this.isResourceValid(permission, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(permissionLink);
        const path = this.getPathFromLink(permissionLink, "", isNameBased);
        const id = this.getIdFromLink(permissionLink, isNameBased);
        return this.replace(permission, path, "permissions", id, undefined, options, callback);
    }
    replaceTrigger(triggerLink, trigger, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        if (trigger.serverScript) {
            trigger.body = trigger.serverScript.toString();
        }
        else if (trigger.body) {
            trigger.body = trigger.body.toString();
        }
        const err = {};
        if (!this.isResourceValid(trigger, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(triggerLink);
        const path = this.getPathFromLink(triggerLink, "", isNameBased);
        const id = this.getIdFromLink(triggerLink, isNameBased);
        return this.replace(trigger, path, "triggers", id, undefined, options, callback);
    }
    replaceUserDefinedFunction(udfLink, udf, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        if (udf.serverScript) {
            udf.body = udf.serverScript.toString();
        }
        else if (udf.body) {
            udf.body = udf.body.toString();
        }
        const err = {};
        if (!this.isResourceValid(udf, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(udfLink);
        const path = this.getPathFromLink(udfLink, "", isNameBased);
        const id = this.getIdFromLink(udfLink, isNameBased);
        return this.replace(udf, path, "udfs", id, undefined, options, callback);
    }
    replaceStoredProcedure(sprocLink, sproc, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        if (sproc.serverScript) {
            sproc.body = sproc.serverScript.toString();
        }
        else if (sproc.body) {
            sproc.body = sproc.body.toString();
        }
        const err = {};
        if (!this.isResourceValid(sproc, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(sprocLink);
        const path = this.getPathFromLink(sprocLink, "", isNameBased);
        const id = this.getIdFromLink(sprocLink, isNameBased);
        return this.replace(sproc, path, "sprocs", id, undefined, options, callback);
    }
    upsertDocument(documentsFeedOrDatabaseLink, body, options, callback) {
        const partitionResolver = this.partitionResolvers[documentsFeedOrDatabaseLink];
        const collectionLink = (partitionResolver === undefined || partitionResolver === null)
            ? documentsFeedOrDatabaseLink
            : this.resolveCollectionLinkForCreate(partitionResolver, body);
        return this.upsertDocumentPrivate(collectionLink, body, options, callback);
    }
    upsertAttachment(documentLink, body, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const err = {};
        if (!this.isResourceValid(body, err)) {
            callback(err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(documentLink);
        const path = this.getPathFromLink(documentLink, "attachments", isNameBased);
        const id = this.getIdFromLink(documentLink, isNameBased);
        this.upsert(body, path, "attachments", id, undefined, options, callback);
    }
    upsertUser(databaseLink, body, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const err = {};
        if (!this.isResourceValid(body, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(databaseLink);
        const path = this.getPathFromLink(databaseLink, "users", isNameBased);
        const id = this.getIdFromLink(databaseLink, isNameBased);
        return this.upsert(body, path, "users", id, undefined, options, callback);
    }
    upsertPermission(userLink, body, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        const err = {};
        if (!this.isResourceValid(body, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(userLink);
        const path = this.getPathFromLink(userLink, "permissions", isNameBased);
        const id = this.getIdFromLink(userLink, isNameBased);
        return this.upsert(body, path, "permissions", id, undefined, options, callback);
    }
    upsertTrigger(collectionLink, trigger, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        if (trigger.serverScript) {
            trigger.body = trigger.serverScript.toString();
        }
        else if (trigger.body) {
            trigger.body = trigger.body.toString();
        }
        const err = {};
        if (!this.isResourceValid(trigger, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
        const path = this.getPathFromLink(collectionLink, "triggers", isNameBased);
        const id = this.getIdFromLink(collectionLink, isNameBased);
        return this.upsert(trigger, path, "triggers", id, undefined, options, callback);
    }
    upsertUserDefinedFunction(collectionLink, udf, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        if (udf.serverScript) {
            udf.body = udf.serverScript.toString();
        }
        else if (udf.body) {
            udf.body = udf.body.toString();
        }
        const err = {};
        if (!this.isResourceValid(udf, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
        const path = this.getPathFromLink(collectionLink, "udfs", isNameBased);
        const id = this.getIdFromLink(collectionLink, isNameBased);
        return this.upsert(udf, path, "udfs", id, undefined, options, callback);
    }
    upsertStoredProcedure(collectionLink, sproc, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        if (sproc.serverScript) {
            sproc.body = sproc.serverScript.toString();
        }
        else if (sproc.body) {
            sproc.body = sproc.body.toString();
        }
        const err = {};
        if (!this.isResourceValid(sproc, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
        const path = this.getPathFromLink(collectionLink, "sprocs", isNameBased);
        const id = this.getIdFromLink(collectionLink, isNameBased);
        return this.upsert(sproc, path, "sprocs", id, undefined, options, callback);
    }
    upsertAttachmentAndUploadMedia(documentLink, readableStream, options, callback) {
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;
        let initialHeaders = base_1.Base.extend({}, this.defaultHeaders);
        initialHeaders = base_1.Base.extend(initialHeaders, options && options.initialHeaders);
        if (options.slug) {
            initialHeaders[common_1.Constants.HttpHeaders.Slug] = options.slug;
        }
        initialHeaders[common_1.Constants.HttpHeaders.ContentType] = options.contentType || common_1.Constants.MediaTypes.OctetStream;
        const isNameBased = base_1.Base.isLinkNameBased(documentLink);
        const path = this.getPathFromLink(documentLink, "attachments", isNameBased);
        const id = this.getIdFromLink(documentLink, isNameBased);
        return this.upsert(readableStream, path, "attachments", id, initialHeaders, options, callback);
    }
    readMedia(mediaLink, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const resourceInfo = base_1.Base.parseLink(mediaLink);
            const path = "/" + mediaLink;
            const initialHeaders = base_1.Base.extend({}, this.defaultHeaders);
            initialHeaders[common_1.Constants.HttpHeaders.Accept] = common_1.Constants.MediaTypes.Any;
            const attachmentId = base_1.Base.getAttachmentIdFromMediaId(resourceInfo.objectBody.id).toLowerCase();
            try {
                const reqHeaders = yield base_1.Base.getHeaders(this, initialHeaders, "get", path, attachmentId, "media", {});
                const writeEndpoint = yield this._globalEndpointManager.getWriteEndpoint();
                const results = yield this.get(writeEndpoint, path, reqHeaders);
                return base_1.Base.ResponseOrCallback(callback, results);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    updateMedia(mediaLink, readableStream, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            const defaultHeaders = this.defaultHeaders;
            let initialHeaders = base_1.Base.extend({}, defaultHeaders);
            initialHeaders = base_1.Base.extend(initialHeaders, options && options.initialHeaders);
            if (options.slug) {
                initialHeaders[common_1.Constants.HttpHeaders.Slug] = options.slug;
            }
            initialHeaders[common_1.Constants.HttpHeaders.ContentType] = options.contentType || common_1.Constants.MediaTypes.OctetStream;
            initialHeaders[common_1.Constants.HttpHeaders.Accept] = common_1.Constants.MediaTypes.Any;
            const resourceInfo = base_1.Base.parseLink(mediaLink);
            const path = "/" + mediaLink;
            const attachmentId = base_1.Base.getAttachmentIdFromMediaId(resourceInfo.objectBody.id).toLowerCase();
            try {
                const headers = yield base_1.Base.getHeaders(this, initialHeaders, "put", path, attachmentId, "media", options);
                const writeEndpoint = yield this._globalEndpointManager.getWriteEndpoint();
                const results = yield this.put(writeEndpoint, path, readableStream, headers);
                return base_1.Base.ResponseOrCallback(callback, results);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    executeStoredProcedure(sprocLink, params, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!callback && !options) {
                if (typeof params === "function") {
                    callback = params;
                    params = null;
                    options = {};
                }
            }
            else if (!callback) {
                if (typeof options === "function") {
                    callback = options;
                    options = {};
                }
            }
            const defaultHeaders = this.defaultHeaders;
            let initialHeaders = {};
            initialHeaders = base_1.Base.extend(initialHeaders, defaultHeaders);
            initialHeaders = base_1.Base.extend(initialHeaders, options && options.initialHeaders);
            if (params !== null && params !== undefined && !Array.isArray(params)) {
                params = [params];
            }
            const isNameBased = base_1.Base.isLinkNameBased(sprocLink);
            const path = this.getPathFromLink(sprocLink, "", isNameBased);
            const id = this.getIdFromLink(sprocLink, isNameBased);
            try {
                const headers = yield base_1.Base.getHeaders(this, initialHeaders, "post", path, id, "sprocs", options);
                const writeEndpoint = yield this._globalEndpointManager.getWriteEndpoint();
                const results = yield this.post(writeEndpoint, path, params, headers);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    replaceOffer(offerLink, offer, callback) {
        const err = {};
        if (!this.isResourceValid(offer, err)) {
            base_1.Base.ThrowOrCallback(callback, err);
            return;
        }
        const path = "/" + offerLink;
        const id = base_1.Base.parseLink(offerLink).objectBody.id.toLowerCase();
        return this.replace(offer, path, "offers", id, undefined, {}, callback);
    }
    readOffer(offerLink, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = "/" + offerLink;
            const id = base_1.Base.parseLink(offerLink).objectBody.id.toLowerCase();
            return base_1.Base.ResponseOrCallback(callback, yield this.read(path, "offers", id, undefined, {}));
        });
    }
    readOffers(options) {
        return this.queryOffers(undefined, options);
    }
    queryOffers(query, options) {
        return new queryIterator_1.QueryIterator(this, query, options, (innerOptions) => {
            return this.queryFeed(this, "/offers", "offers", "", (result) => result.Offers, (parent, body) => body, query, innerOptions);
        });
    }
    createDocumentPrivate(collectionLink, body, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            try {
                if (options.partitionKey === undefined && options.skipGetPartitionKeyDefinition !== true) {
                    const { result: partitionKeyDefinition } = yield this.getPartitionKeyDefinition(collectionLink);
                    options.partitionKey = this.extractPartitionKey(body, partitionKeyDefinition);
                }
                if ((body.id === undefined || body.id === "") && !options.disableAutomaticIdGeneration) {
                    body.id = base_1.Base.generateGuidId();
                }
                const err = {};
                if (!this.isResourceValid(body, err)) {
                    base_1.Base.ThrowOrCallback(callback, err);
                    return;
                }
                const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
                const path = this.getPathFromLink(collectionLink, "docs", isNameBased);
                const id = this.getIdFromLink(collectionLink, isNameBased);
                const results = yield this.create(body, path, "docs", id, undefined, options);
                return base_1.Base.ResponseOrCallback(callback, results);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    upsertDocumentPrivate(collectionLink, body, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
            options = optionsCallbackTuple.options;
            callback = optionsCallbackTuple.callback;
            if (options.partitionKey === undefined && options.skipGetPartitionKeyDefinition !== true) {
                const { result: partitionKeyDefinition } = yield this.getPartitionKeyDefinition(collectionLink);
                options.partitionKey = this.extractPartitionKey(body, partitionKeyDefinition);
            }
            if ((body.id === undefined || body.id === "") && !options.disableAutomaticIdGeneration) {
                body.id = base_1.Base.generateGuidId();
            }
            const err = {};
            if (!this.isResourceValid(body, err)) {
                base_1.Base.ThrowOrCallback(callback, err);
                return;
            }
            const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
            const path = this.getPathFromLink(collectionLink, "docs", isNameBased);
            const id = this.getIdFromLink(collectionLink, isNameBased);
            return this.upsert(body, path, "docs", id, undefined, options, callback);
        });
    }
    queryDocumentsPrivate(collectionLinks, query, options) {
        const fetchFunctions = collectionLinks.map((collectionLink) => {
            const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
            const path = this.getPathFromLink(collectionLink, "docs", isNameBased);
            const id = this.getIdFromLink(collectionLink, isNameBased);
            return (innerOptions) => {
                return this.queryFeed(this, path, "docs", id, (result) => result ? result.Documents : [], (parent, body) => body, query, innerOptions);
            };
        });
        return new queryIterator_1.QueryIterator(this, query, options, fetchFunctions, collectionLinks);
    }
    create(body, path, type, id, initialHeaders, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                initialHeaders = initialHeaders || base_1.Base.extend({}, this.defaultHeaders);
                initialHeaders = base_1.Base.extend(initialHeaders, options && options.initialHeaders);
                const requestHeaders = yield base_1.Base.getHeaders(this, initialHeaders, "post", path, id, type, options);
                this.applySessionToken(path, requestHeaders);
                const writeEndpoint = yield this._globalEndpointManager.getWriteEndpoint();
                const { result, headers: resHeaders } = yield this.post(writeEndpoint, path, body, requestHeaders);
                this.captureSessionToken(path, common_1.Constants.OperationTypes.Create, requestHeaders, resHeaders);
                return base_1.Base.ResponseOrCallback(callback, { result, headers: resHeaders });
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    upsert(body, path, type, id, initialHeaders, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                initialHeaders = initialHeaders || base_1.Base.extend({}, this.defaultHeaders);
                initialHeaders = base_1.Base.extend(initialHeaders, options && options.initialHeaders);
                const requestHeaders = yield base_1.Base.getHeaders(this, initialHeaders, "post", path, id, type, options);
                this.setIsUpsertHeader(requestHeaders);
                this.applySessionToken(path, requestHeaders);
                const writeEndpoint = yield this._globalEndpointManager.getWriteEndpoint();
                const { result, headers: resHeaders } = yield this.post(writeEndpoint, path, body, requestHeaders);
                this.captureSessionToken(path, common_1.Constants.OperationTypes.Upsert, requestHeaders, resHeaders);
                return base_1.Base.ResponseOrCallback(callback, { result, headers: resHeaders });
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    replace(resource, path, type, id, initialHeaders, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                initialHeaders = initialHeaders || base_1.Base.extend({}, this.defaultHeaders);
                initialHeaders = base_1.Base.extend(initialHeaders, options && options.initialHeaders);
                const reqHeaders = yield base_1.Base.getHeaders(this, initialHeaders, "put", path, id, type, options);
                this.applySessionToken(path, reqHeaders);
                const writeEndpoint = yield this._globalEndpointManager.getWriteEndpoint();
                const result = yield this.put(writeEndpoint, path, resource, reqHeaders);
                this.captureSessionToken(path, common_1.Constants.OperationTypes.Replace, reqHeaders, result.headers);
                return result;
            }
            catch (err) {
                throw err;
            }
        });
    }
    read(path, type, id, initialHeaders, options) {
        return __awaiter(this, void 0, void 0, function* () {
            initialHeaders = initialHeaders || base_1.Base.extend({}, this.defaultHeaders);
            initialHeaders = base_1.Base.extend(initialHeaders, options && options.initialHeaders);
            try {
                const requestHeaders = yield base_1.Base.getHeaders(this, initialHeaders, "get", path, id, type, options);
                this.applySessionToken(path, requestHeaders);
                const request = {
                    path,
                    operationType: common_1.Constants.OperationTypes.Read,
                    client: this,
                    endpointOverride: null,
                };
                const readEndpoint = yield this._globalEndpointManager.getReadEndpoint();
                const response = yield this.get(readEndpoint, request, requestHeaders);
                this.captureSessionToken(path, common_1.Constants.OperationTypes.Read, requestHeaders, response.headers);
                return response;
            }
            catch (err) {
                throw err;
            }
        });
    }
    deleteResource(path, type, id, initialHeaders, options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                initialHeaders = initialHeaders || base_1.Base.extend({}, this.defaultHeaders);
                initialHeaders = base_1.Base.extend(initialHeaders, options && options.initialHeaders);
                const reqHeaders = yield base_1.Base.getHeaders(this, initialHeaders, "delete", path, id, type, options);
                this.applySessionToken(path, reqHeaders);
                const writeEndpoint = yield this._globalEndpointManager.getWriteEndpoint();
                const response = yield this.delete(writeEndpoint, path, reqHeaders);
                if (base_1.Base.parseLink(path).type !== "colls") {
                    this.captureSessionToken(path, common_1.Constants.OperationTypes.Delete, reqHeaders, response.headers);
                }
                else {
                    this.clearSessionToken(path);
                }
                return base_1.Base.ResponseOrCallback(callback, response);
            }
            catch (err) {
                base_1.Base.ThrowOrCallback(callback, err);
            }
        });
    }
    getPartitionKeyDefinition(collectionLink, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (collectionLink in this.partitionKeyDefinitionCache) {
                return base_1.Base.ResponseOrCallback(callback, { result: this.partitionKeyDefinitionCache[collectionLink] });
            }
            try {
                const { result: collection, headers } = yield this.readCollection(collectionLink);
                return base_1.Base.ResponseOrCallback(callback, { result: this.partitionKeyDefinitionCache[collectionLink], headers });
            }
            catch (err) {
                throw err;
            }
        });
    }
    extractPartitionKey(document, partitionKeyDefinition) {
        if (partitionKeyDefinition && partitionKeyDefinition.paths && partitionKeyDefinition.paths.length > 0) {
            const partitionKey = [];
            partitionKeyDefinition.paths.forEach((path) => {
                const pathParts = base_1.Base.parsePath(path);
                let obj = document;
                for (const part of pathParts) {
                    if (!((typeof obj === "object") && (part in obj))) {
                        obj = {};
                        break;
                    }
                    obj = obj[path];
                }
                partitionKey.push(obj);
            });
            return partitionKey;
        }
        return undefined;
    }
    isResourceValid(resource, err) {
        if (resource.id) {
            if (typeof resource.id !== "string") {
                err.message = "Id must be a string.";
                return false;
            }
            if (resource.id.indexOf("/") !== -1
                || resource.id.indexOf("\\") !== -1
                || resource.id.indexOf("?") !== -1
                || resource.id.indexOf("#") !== -1) {
                err.message = "Id contains illegal chars.";
                return false;
            }
            if (resource.id[resource.id.length - 1] === " ") {
                err.message = "Id ends with a space.";
                return false;
            }
        }
        return true;
    }
    resolveCollectionLinkForCreate(partitionResolver, document) {
        const validation = this.isPartitionResolverValid(partitionResolver);
        if (!validation.valid) {
            throw validation.error;
        }
        const partitionKey = partitionResolver.getPartitionKey(document);
        return partitionResolver.resolveForCreate(partitionKey);
    }
    isPartitionResolverValid(partionResolver) {
        if (partionResolver === null || partionResolver === undefined) {
            return {
                valid: false,
                error: new Error("The partition resolver is null or undefined"),
            };
        }
        let validation = this.isPartitionResolveFunctionDefined(partionResolver, "getPartitionKey");
        if (!validation.valid) {
            return validation;
        }
        validation = this.isPartitionResolveFunctionDefined(partionResolver, "resolveForCreate");
        if (!validation.valid) {
            return validation;
        }
        validation = this.isPartitionResolveFunctionDefined(partionResolver, "resolveForRead");
        return validation;
    }
    isPartitionResolveFunctionDefined(partionResolver, functionName) {
        if (partionResolver === null || partionResolver === undefined) {
            return {
                valid: false,
                error: new Error("The partition resolver is null or undefined"),
            };
        }
        if (typeof partionResolver[functionName] === "function") {
            return {
                valid: true,
            };
        }
        else {
            return {
                valid: false,
                error: new Error(`The partition resolver does not implement method ${functionName}. \
                    The type of ${functionName} is \"${typeof partionResolver[functionName]}\"`),
            };
        }
    }
    getIdFromLink(resourceLink, isNameBased) {
        if (isNameBased) {
            resourceLink = base_1.Base._trimSlashes(resourceLink);
            return resourceLink;
        }
        else {
            return base_1.Base.parseLink(resourceLink).objectBody.id.toLowerCase();
        }
    }
    getPathFromLink(resourceLink, resourceType, isNameBased) {
        if (isNameBased) {
            resourceLink = base_1.Base._trimSlashes(resourceLink);
            if (resourceType) {
                return "/" + encodeURI(resourceLink) + "/" + resourceType;
            }
            else {
                return "/" + encodeURI(resourceLink);
            }
        }
        else {
            if (resourceType) {
                return "/" + resourceLink + resourceType + "/";
            }
            else {
                return "/" + resourceLink;
            }
        }
    }
    setIsUpsertHeader(headers) {
        if (headers === undefined || headers === null) {
            throw new Error('The "headers" parameter must not be null or undefined');
        }
        if (!(headers instanceof Object)) {
            throw new Error(`The "headers" parameter must be an instance of "Object". Actual type is: "${typeof headers}".`);
        }
        headers[common_1.Constants.HttpHeaders.IsUpsert] = true;
    }
    getSessionToken(collectionLink) {
        if (!collectionLink) {
            throw new Error("collectionLink cannot be null");
        }
        const paths = base_1.Base.parseLink(collectionLink);
        if (paths === undefined) {
            return "";
        }
        const request = this.getSessionParams(collectionLink);
        return this.sessionContainer.resolveGlobalSessionToken(request);
    }
    applySessionToken(path, reqHeaders) {
        const request = this.getSessionParams(path);
        if (reqHeaders && reqHeaders[common_1.Constants.HttpHeaders.SessionToken]) {
            return;
        }
        const sessionConsistency = reqHeaders[common_1.Constants.HttpHeaders.ConsistencyLevel];
        if (!sessionConsistency) {
            return;
        }
        if (request["resourceAddress"]) {
            const sessionToken = this.sessionContainer.resolveGlobalSessionToken(request);
            if (sessionToken !== "") {
                reqHeaders[common_1.Constants.HttpHeaders.SessionToken] = sessionToken;
            }
        }
    }
    captureSessionToken(path, opType, reqHeaders, resHeaders) {
        const request = this.getSessionParams(path);
        request.operationType = opType;
        this.sessionContainer.setSessionToken(request, reqHeaders, resHeaders);
    }
    clearSessionToken(path) {
        const request = this.getSessionParams(path);
        this.sessionContainer.clearToken(request);
    }
    getSessionParams(resourceLink) {
        const isNameBased = base_1.Base.isLinkNameBased(resourceLink);
        let resourceId = null;
        let resourceAddress = null;
        const parserOutput = base_1.Base.parseLink(resourceLink);
        if (isNameBased) {
            resourceAddress = parserOutput.objectBody.self;
        }
        else {
            resourceAddress = parserOutput.objectBody.id;
            resourceId = parserOutput.objectBody.id;
        }
        const resourceType = parserOutput.type;
        return {
            isNameBased,
            resourceId,
            resourceAddress,
            resourceType,
        };
    }
}
exports.DocumentClient = DocumentClient;
//# sourceMappingURL=documentclient.js.map