import { Base } from "./base";
import { Agent, RequestOptions } from "https"; // TODO: Move this to request? 
import * as url from "url";
import * as tunnel from "tunnel";
import { ConnectionPolicy, ConsistencyLevel, QueryCompatibilityMode } from "./documents";
import { QueryIterator } from "./queryIterator";
import { RequestHandler } from "./request";
import { RetryOptions } from "./retry";
import { GlobalEndpointManager } from "./globalEndpointManager";
import { Constants, Helper, Platform } from "./common";
import * as util from "util";
import { SessionContainer } from "./sessionContainer";
import { IHeaders } from "./queryExecutionContext";

// var Base = require("./base")
//     , https = require("https")
//     , url = require("url")
//     , tunnel = require("tunnel")
//     , AzureDocuments = require("./documents")
//     , QueryIterator = require("./queryIterator")
//     , RequestHandler = require("./request")
//     , RetryOptions = require("./retryOptions")
//     , GlobalEndpointManager = require("./globalEndpointManager")
//     , Constants = require("./constants")
//     , Helper = require("./helper").Helper
//     , util = require("util")
//     , Platform = require("./platform")
//     , SessionContainer = require("./sessionContainer");


// if (typeof exports !== "undefined") {
//     exports.DocumentClient = DocumentClient;
//     exports.DocumentBase = AzureDocuments;
//     exports.RetryOptions = RetryOptions;
//     exports.Base = Base;
//     exports.Constants = Constants;
// }

export class DocumentClient {
    masterKey: string;
    resourceTokens: { [key: string]: string };
    tokenProvider: any;
    connectionPolicy: ConnectionPolicy;
    consistencyLevel: ConsistencyLevel;
    defaultHeaders: IHeaders;
    defaultUrlParams: string;
    queryCompatibilityMode: QueryCompatibilityMode;
    partitionResolvers: {};
    partitionKeyDefinitionCache: {};
    _globalEndpointManager: GlobalEndpointManager;
    sessionContainer: SessionContainer;
    requestAgent: Agent;
    /**
     * Provides a client-side logical representation of the Azure Cosmos DB database account.
     * This client is used to configure and execute requests in the Azure Cosmos DB database service.
     * @constructor DocumentClient
     * @param {string} urlConnection           - The service endpoint to use to create the client.
     * @param {object} auth                    - An object that is used for authenticating requests \
     * and must contains one of the options
     * @param {string} [auth.masterKey]        - The authorization master key to use to create the client.
     * @param {Object} [auth.resourceTokens]   - An object that contains resources tokens. Keys for the \
     * object are resource Ids and values are the resource tokens.
     * @param {Array}  [auth.permissionFeed]   - An array of {@link Permission} objects.
     * @param {object} [connectionPolicy]      - An instance of {@link ConnectionPolicy} class. This \
     * parameter is optional and the default connectionPolicy will be used if omitted.
     * @param {string} [consistencyLevel]      - An optional parameter that represents the consistency \
     * level. It can take any value from {@link ConsistencyLevel}.
     */
    constructor(
        private urlConnection: string,
        auth: any, connectionPolicy:
            ConnectionPolicy,
        consistencyLevel: ConsistencyLevel) { // TODO: any auth options
        this.urlConnection = urlConnection;
        if (auth !== undefined) {
            this.masterKey = auth.masterKey;
            this.resourceTokens = auth.resourceTokens;
            if (auth.permissionFeed) {
                this.resourceTokens = {};
                for (var i = 0; i < auth.permissionFeed.length; i++) {
                    var resourceId = Helper.getResourceIdFromPath(auth.permissionFeed[i].resource);
                    if (!resourceId) {
                        throw new Error(`authorization error: ${resourceId} \
                            is an invalid resourceId in permissionFeed`);
                    }

                    this.resourceTokens[resourceId] = auth.permissionFeed[i]._token;
                }
            }
            this.tokenProvider = auth.tokenProvider;
        }

        this.connectionPolicy = connectionPolicy || new ConnectionPolicy();
        this.consistencyLevel = consistencyLevel;
        this.defaultHeaders = {};
        this.defaultHeaders[Constants.HttpHeaders.CacheControl] = "no-cache";
        this.defaultHeaders[Constants.HttpHeaders.Version] = Constants.CurrentVersion;
        if (consistencyLevel !== undefined) {
            this.defaultHeaders[Constants.HttpHeaders.ConsistencyLevel] = consistencyLevel;
        }

        var platformDefaultHeaders = Platform.getPlatformDefaultHeaders() || {};
        for (const platformDefaultHeader of Object.keys(platformDefaultHeaders)) {
            this.defaultHeaders[platformDefaultHeader] = platformDefaultHeaders[platformDefaultHeader];
        }

        this.defaultHeaders[Constants.HttpHeaders.UserAgent] = Platform.getUserAgent();

        // overide this for default query params to be added to the url.
        this.defaultUrlParams = "";

        // Query compatibility mode.
        // Allows to specify compatibility mode used by client when making query requests. Should be removed when
        // application/sql is no longer supported.
        this.queryCompatibilityMode = QueryCompatibilityMode.Default;
        this.partitionResolvers = {};

        this.partitionKeyDefinitionCache = {};

        this._globalEndpointManager = new GlobalEndpointManager(this);

        this.sessionContainer = new SessionContainer(this.urlConnection);

        // Initialize request agent
        var requestAgentOptions: any = { keepAlive: true, maxSockets: Infinity }; // TODO: any
        if (!!this.connectionPolicy.ProxyUrl) {
            var proxyUrl = url.parse(this.connectionPolicy.ProxyUrl);
            requestAgentOptions.proxy = {
                host: proxyUrl.hostname,
                port: proxyUrl.port
            };

            if (!!proxyUrl.auth) {
                requestAgentOptions.proxy.proxyAuth = proxyUrl.auth;
            }

            this.requestAgent = proxyUrl.protocol.toLowerCase() === "https:" ?
                tunnel.httpsOverHttps(requestAgentOptions) :
                tunnel.httpsOverHttp(requestAgentOptions);
        } else {
            this.requestAgent = new Agent(requestAgentOptions); // TODO: Move to request?
        }
    }
    /** 
     * Gets the curent write endpoint for a geo-replicated database account.
     * @memberof DocumentClient
     * @instance
     * @param {function} callback        - The callback function which takes endpoint(string) as an argument.
     */
    public getWriteEndpoint(callback?: (writeEndPoint: string) => void): void | Promise<string> {
        const p = new Promise<string>((resolve, reject) => {
            this._globalEndpointManager.getWriteEndpoint((writeEndpoint: string) => {
                resolve(writeEndpoint);
            });
        });

        if(callback) {
            p.then(callback, callback);
        } else {
            return p;
        }
    }

    /** 
     * Gets the curent read endpoint for a geo-replicated database account.
     * @memberof DocumentClient
     * @instance
     * @param {function} callback        - The callback function which takes endpoint(string) as an argument.
     */
    public getReadEndpoint(callback?: (readEndPoint: string) => void): void | Promise<string> {
        const p = new Promise<string>((resolve, reject) => {
            this._globalEndpointManager.getReadEndpoint((readEndpoint: string) => {
                callback(readEndpoint);
            });
        });
        
        if(callback) {
            p.then(callback, callback);
        } else {
            return p;
        }
    }

    /** 
     * Send a request for creating a database.
     * <p>
     *  A database manages users, permissions and a set of collections.  <br>
     *  Each Azure Cosmos DB Database Account is able to support multiple independent named databases,\
     *  with the database being the logical container for data. <br>
     *  Each Database consists of one or more collections, each of which in turn contain one or more \
     *  documents. Since databases are an an administrative resource, the Service Master Key will be \
     * required in order to access and successfully complete any action using the User APIs. <br>
     * </p>
     * @memberof DocumentClient
     * @instance
     * @param {Object} body              - A json object that represents The database to be created.
     * @param {string} body.id           - The id of the database.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public createDatabase(
        body: object, 
        options: RequestOptions, 
        callback?: (err: any, database?: any)): Promise<any> { // TODO: any
        const optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        let err = {};
        if (!this.isResourceValid(body, err)) {
            callback(err);
            return;
        }

        var path = "/dbs";
        this.create(body, path, "dbs", undefined, undefined, options, callback);
    }

    /**
     * Creates a collection.
     * <p>
     * A collection is a named logical container for documents. <br>
     * A database may contain zero or more named collections and each collection consists of zero or more JSON documents. <br>
     * Being schema-free, the documents in a collection do not need to share the same structure or fields. <br>
     * Since collections are application resources, they can be authorized using either the master key or resource keys. <br>
     * </p>
     * @memberof DocumentClient
     * @instance
     * @param {string} databaseLink                  - The self-link of the database.
     * @param {object} body                          - Represents the body of the collection.
     * @param {string} body.id                       - The id of the collection.
     * @param {IndexingPolicy} body.indexingPolicy   - The indexing policy associated with the collection.
     * @param {number} body.defaultTtl               - The default time to live in seconds for documents in a collection.
     * @param {RequestOptions} [options]             - The request options.
     * @param {RequestCallback} callback             - The callback for the request.
     */
    public createCollection(databaseLink, body, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var err = {};
        if (!this.isResourceValid(body, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(databaseLink);
        var path = this.getPathFromLink(databaseLink, "colls", isNameBased);
        var id = this.getIdFromLink(databaseLink, isNameBased);

        this.create(body, path, "colls", id, undefined, options, callback);
    }

    /**
     * Create a document.
     * <p>
     * There is no set schema for JSON documents. They may contain any number of custom properties as well as an optional list of attachments. <br>
     * A Document is an application resource and can be authorized using the master key or resource keys
     * </p>
     * @memberof DocumentClient
     * @instance
     * @param {string} documentsFeedOrDatabaseLink               - The collection link or database link if using a partition resolver
     * @param {object} body                                      - Represents the body of the document. Can contain any number of user defined properties.
     * @param {string} [body.id]                                 - The id of the document, MUST be unique for each document.
     * @param {number} body.ttl                                  - The time to live in seconds of the document.
     * @param {RequestOptions} [options]                         - The request options.
     * @param {boolean} [options.disableAutomaticIdGeneration]   - Disables the automatic id generation. If id is missing in the body and this option is true, an error will be returned.
     * @param {RequestCallback} callback                         - The callback for the request.
     */
    public createDocument(documentsFeedOrDatabaseLink, body, options, callback) {
        var partitionResolver = this.partitionResolvers[documentsFeedOrDatabaseLink];

        var collectionLink;
        if (partitionResolver === undefined || partitionResolver === null) {
            collectionLink = documentsFeedOrDatabaseLink;
        } else {
            collectionLink = this.resolveCollectionLinkForCreate(partitionResolver, body);
        }

        this.createDocumentPrivate(collectionLink, body, options, callback);
    }

    /**
     * Create an attachment for the document object.
     * <p>
     * Each document may contain zero or more attachments. Attachments can be of any MIME type - text, image, binary data. <br>
     * These are stored externally in Azure Blob storage. Attachments are automatically deleted when the parent document is deleted.
     * </P>
     * @memberof DocumentClient
     * @instance
     * @param {string} documentLink         - The self-link of the document.
     * @param {Object} body                 - The metadata the defines the attachment media like media, contentType. It can include any other properties as part of the metedata.
     * @param {string} body.contentType     - The MIME contentType of the attachment.
     * @param {string} body.media           - Media link associated with the attachment content.
     * @param {RequestOptions} options      - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
    */
    public createAttachment(documentLink, body, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var err = {};
        if (!this.isResourceValid(body, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(documentLink);
        var path = this.getPathFromLink(documentLink, "attachments", isNameBased);
        var id = this.getIdFromLink(documentLink, isNameBased);

        this.create(body, path, "attachments", id, undefined, options, callback);
    }

    /**
     * Create a database user.
     * @memberof DocumentClient
     * @instance
     * @param {string} databaseLink         - The self-link of the database.
     * @param {object} body                 - Represents the body of the user.
     * @param {string} body.id              - The id of the user.
     * @param {RequestOptions} [options]    - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
     */
    public createUser(databaseLink, body, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var err = {};
        if (!this.isResourceValid(body, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(databaseLink);
        var path = this.getPathFromLink(databaseLink, "users", isNameBased);
        var id = this.getIdFromLink(databaseLink, isNameBased);

        this.create(body, path, "users", id, undefined, options, callback);
    }

    /**
     * Create a permission.
     * <p> A permission represents a per-User Permission to access a specific resource e.g. Document or Collection.  </p>
     * @memberof DocumentClient
     * @instance
     * @param {string} userLink             - The self-link of the user.
     * @param {object} body                 - Represents the body of the permission.
     * @param {string} body.id              - The id of the permission
     * @param {string} body.permissionMode  - The mode of the permission, must be a value of {@link PermissionMode}
     * @param {string} body.resource        - The link of the resource that the permission will be applied to.
     * @param {RequestOptions} [options]    - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
     */
    public createPermission(userLink, body, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var err = {};
        if (!this.isResourceValid(body, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(userLink);
        var path = this.getPathFromLink(userLink, "permissions", isNameBased);
        var id = this.getIdFromLink(userLink, isNameBased);

        this.create(body, path, "permissions", id, undefined, options, callback);
    }

    /**
    * Create a trigger.
    * <p>
    * Azure Cosmos DB supports pre and post triggers defined in JavaScript to be executed on creates, updates and deletes. <br>
    * For additional details, refer to the server-side JavaScript API documentation.
    * </p>
    * @memberof DocumentClient
    * @instance
    * @param {string} collectionLink           - The self-link of the collection.
    * @param {object} trigger                  - Represents the body of the trigger.
    * @param {string} trigger.id             - The id of the trigger.
    * @param {string} trigger.triggerType      - The type of the trigger, should be one of the values of {@link TriggerType}.
    * @param {string} trigger.triggerOperation - The trigger operation, should be one of the values of {@link TriggerOperation}.
    * @param {function} trigger.serverScript   - The body of the trigger, it can be passed as stringified too.
    * @param {RequestOptions} [options]        - The request options.
    * @param {RequestCallback} callback        - The callback for the request.
    */
    public createTrigger(collectionLink, trigger, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        if (trigger.serverScript) {
            trigger.body = trigger.serverScript.toString();
        } else if (trigger.body) {
            trigger.body = trigger.body.toString();
        }

        var err = {};
        if (!this.isResourceValid(trigger, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "triggers", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        this.create(trigger, path, "triggers", id, undefined, options, callback);
    }

    /**
     * Create a UserDefinedFunction.
     * <p>
     * Azure Cosmos DB supports JavaScript UDFs which can be used inside queries, stored procedures and triggers. <br>
     * For additional details, refer to the server-side JavaScript API documentation.
     * </p>
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink                - The self-link of the collection.
     * @param {object} udf                           - Represents the body of the userDefinedFunction.
     * @param {string} udf.id                      - The id of the udf.
     * @param {string} udf.userDefinedFunctionType   - The type of the udf, it should be one of the values of {@link UserDefinedFunctionType}
     * @param {function} udf.serverScript            - Represents the body of the udf, it can be passed as stringified too.
     * @param {RequestOptions} [options]             - The request options.
     * @param {RequestCallback} callback             - The callback for the request.
     */
    public createUserDefinedFunction(collectionLink, udf, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        if (udf.serverScript) {
            udf.body = udf.serverScript.toString();
        } else if (udf.body) {
            udf.body = udf.body.toString();
        }

        var err = {};
        if (!this.isResourceValid(udf, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "udfs", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        this.create(udf, path, "udfs", id, undefined, options, callback);
    }

    /**
     * Create a StoredProcedure.
     * <p>
     * Azure Cosmos DB allows stored procedures to be executed in the storage tier, directly against a document collection. The script <br>
     * gets executed under ACID transactions on the primary storage partition of the specified collection. For additional details, <br>
     * refer to the server-side JavaScript API documentation.
     * </p>
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink       - The self-link of the collection.
     * @param {object} sproc                - Represents the body of the stored procedure.
     * @param {string} sproc.id           - The id of the stored procedure.
     * @param {function} sproc.serverScript - The body of the stored procedure, it can be passed as stringified too.
     * @param {RequestOptions} [options]    - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
     */
    public createStoredProcedure(collectionLink, sproc, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        if (sproc.serverScript) {
            sproc.body = sproc.serverScript.toString();
        } else if (sproc.body) {
            sproc.body = sproc.body.toString();
        }

        var err = {};
        if (!this.isResourceValid(sproc, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "sprocs", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        this.create(sproc, path, "sprocs", id, undefined, options, callback);
    }

    /**
     * Create an attachment for the document object.
     * @memberof DocumentClient
     * @instance
     * @param {string} documentLink             - The self-link of the document.
     * @param {stream.Readable} readableStream  - the stream that represents the media itself that needs to be uploaded.
     * @param {MediaOptions} [options]          - The request options.
     * @param {RequestCallback} callback        - The callback for the request.
    */
    public createAttachmentAndUploadMedia(documentLink, readableStream, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var initialHeaders = Base.extend({} this.defaultHeaders);
        initialHeaders = Base.extend(initialHeaders, options && options.initialHeaders);

        // Add required headers slug and content-type.
        if (options.slug) {
            initialHeaders[Constants.HttpHeaders.Slug] = options.slug;
        }

        if (options.contentType) {
            initialHeaders[Constants.HttpHeaders.ContentType] = options.contentType;
        } else {
            initialHeaders[Constants.HttpHeaders.ContentType] = Constants.MediaTypes.OctetStream;
        }

        var isNameBased = Base.isLinkNameBased(documentLink);
        var path = this.getPathFromLink(documentLink, "attachments", isNameBased);
        var id = this.getIdFromLink(documentLink, isNameBased);

        this.create(readableStream, path, "attachments", id, initialHeaders, options, callback);
    }

    /** Reads a database.
     * @memberof DocumentClient
     * @instance
     * @param {string} databaseLink         - The self-link of the database.
     * @param {RequestOptions} [options]    - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
    */
    public readDatabase(databaseLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(databaseLink);
        var path = this.getPathFromLink(databaseLink, "", isNameBased);
        var id = this.getIdFromLink(databaseLink, isNameBased);

        this.read(path, "dbs", id, undefined, options, callback);
    }

    /**
     * Reads a collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink       - The self-link of the collection.
     * @param {RequestOptions} [options]    - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
     */
    public readCollection(collectionLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        var that = this;
        this.read(path, "colls", id, undefined, options, function (err, collection, headers) {
            if (err) return callback(err, collection, headers);
            that.partitionKeyDefinitionCache[collectionLink] = collection.partitionKey;
            callback(err, collection, headers);
        });
    }

    /**
     * Reads a document.
     * @memberof DocumentClient
     * @instance
     * @param {string} documentLink         - The self-link of the document.
     * @param {RequestOptions} [options]    - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
     */
    public readDocument(documentLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(documentLink);
        var path = this.getPathFromLink(documentLink, "", isNameBased);
        var id = this.getIdFromLink(documentLink, isNameBased);

        this.read(path, "docs", id, undefined, options, callback);
    }

    /**
     * Reads an Attachment object.
     * @memberof DocumentClient
     * @instance
     * @param {string} attachmentLink    - The self-link of the attachment.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public readAttachment(attachmentLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(attachmentLink);
        var path = this.getPathFromLink(attachmentLink, "", isNameBased);
        var id = this.getIdFromLink(attachmentLink, isNameBased);

        this.read(path, "attachments", id, undefined, options, callback);
    }

    /**
     * Reads a user.
     * @memberof DocumentClient
     * @instance
     * @param {string} userLink          - The self-link of the user.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public readUser(userLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(userLink);
        var path = this.getPathFromLink(userLink, "", isNameBased);
        var id = this.getIdFromLink(userLink, isNameBased);

        this.read(path, "users", id, undefined, options, callback);
    }

    /**
     * Reads a permission.
     * @memberof DocumentClient
     * @instance
     * @param {string} permissionLink    - The self-link of the permission.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public readPermission(permissionLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(permissionLink);
        var path = this.getPathFromLink(permissionLink, "", isNameBased);
        var id = this.getIdFromLink(permissionLink, isNameBased);

        this.read(path, "permissions", id, undefined, options, callback);
    }

    /**
     * Reads a trigger object.
     * @memberof DocumentClient
     * @instance
     * @param {string} triggerLink       - The self-link of the trigger.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public readTrigger(triggerLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var resourceInfo = Base.parseLink(triggerLink);

        var isNameBased = Base.isLinkNameBased(triggerLink);
        var path = this.getPathFromLink(triggerLink, "", isNameBased);
        var id = this.getIdFromLink(triggerLink, isNameBased);

        this.read(path, "triggers", id, undefined, options, callback);
    }

    /**
     * Reads a udf object.
     * @memberof DocumentClient
     * @instance
     * @param {string} udfLink           - The self-link of the user defined function.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public readUserDefinedFunction(udfLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(udfLink);
        var path = this.getPathFromLink(udfLink, "", isNameBased);
        var id = this.getIdFromLink(udfLink, isNameBased);

        this.read(path, "udfs", id, undefined, options, callback);
    }

    /**
     * Reads a StoredProcedure object.
     * @memberof DocumentClient
     * @instance
     * @param {string} sprocLink         - The self-link of the stored procedure.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public readStoredProcedure(sprocLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(sprocLink);
        var path = this.getPathFromLink(sprocLink, "", isNameBased);
        var id = this.getIdFromLink(sprocLink, isNameBased);

        this.read(path, "sprocs", id, undefined, options, callback);
    }

    /**
     * Reads a conflict.
     * @memberof DocumentClient
     * @instance
     * @param {string} conflictLink      - The self-link of the conflict.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public readConflict(conflictLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(conflictLink);
        var path = this.getPathFromLink(conflictLink, "", isNameBased);
        var id = this.getIdFromLink(conflictLink, isNameBased);

        this.read(path, "conflicts", id, undefined, options, callback);
    }

    /** Lists all databases.
     * @memberof DocumentClient
     * @instance
     * @param {FeedOptions} [options] - The feed options.
     * @returns {QueryIterator}       - An instance of queryIterator to handle reading feed.
    */
    public readDatabases(options) {
        return this.queryDatabases(undefined, options);
    }

    /**
     * Get all collections in this database.
     * @memberof DocumentClient
     * @instance
     * @param {string} databaseLink   - The self-link of the database.
     * @param {FeedOptions} [options] - The feed options.
     * @returns {QueryIterator}       - An instance of queryIterator to handle reading feed.
     */
    public readCollections(databaseLink, options) {
        return this.queryCollections(databaseLink, undefined, options);
    }

    /**
     * Get all documents in this collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink - The self-link of the collection.
     * @param {FeedOptions} [options] - The feed options.
     * @returns {QueryIterator}       - An instance of queryIterator to handle reading feed.
     */
    public readDocuments(collectionLink, options) {
        return this.queryDocuments(collectionLink, undefined, options);
    }

    /**
     * Get all Partition key Ranges in this collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink - The self-link of the collection.
     * @param {FeedOptions} [options] - The feed options.
     * @returns {QueryIterator}       - An instance of queryIterator to handle reading feed.
     * @ignore
     */
    public readPartitionKeyRanges(collectionLink, options) {
        return this.queryPartitionKeyRanges(collectionLink, undefined, options);
    }

    /**
    * Get all attachments for this document.
    * @memberof DocumentClient
    * @instance
    * @param {string} documentLink   - The self-link of the document.
    * @param {FeedOptions} [options] - The feed options.
    * @returns {QueryIterator}       - An instance of queryIterator to handle reading feed.
   */
    public readAttachments(documentLink, options) {
        return this.queryAttachments(documentLink, undefined, options);
    }

    /**
     * Get all users in this database.
     * @memberof DocumentClient
     * @instance
     * @param {string} databaseLink       - The self-link of the database.
     * @param {FeedOptions} [feedOptions] - The feed options.
     * @returns {QueryIterator}           - An instance of queryIterator to handle reading feed.
     */
    public readUsers(databaseLink, options) {
        return this.queryUsers(databaseLink, undefined, options);
    }

    /**
     * Get all permissions for this user.
     * @memberof DocumentClient
     * @instance
     * @param {string} userLink           - The self-link of the user.
     * @param {FeedOptions} [feedOptions] - The feed options.
     * @returns {QueryIterator}           - An instance of queryIterator to handle reading feed.
     */
    public readPermissions(userLink, options) {
        return this.queryPermissions(userLink, undefined, options);
    }

    /**
     * Get all triggers in this collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink   - The self-link of the collection.
     * @param {FeedOptions} [options]   - The feed options.
     * @returns {QueryIterator}         - An instance of queryIterator to handle reading feed.
     */
    public readTriggers(collectionLink, options) {
        return this.queryTriggers(collectionLink, undefined, options);
    }

    /**
     * Get all UserDefinedFunctions in this collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink - The self-link of the collection.
     * @param {FeedOptions} [options] - The feed options.
     * @returns {QueryIterator}       - An instance of queryIterator to handle reading feed.
     */
    public readUserDefinedFunctions(collectionLink, options) {
        return this.queryUserDefinedFunctions(collectionLink, undefined, options);
    }

    /**
     * Get all StoredProcedures in this collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink - The self-link of the collection.
     * @param {FeedOptions} [options] - The feed options.
     * @returns {QueryIterator}       - An instance of queryIterator to handle reading feed.
     */
    public readStoredProcedures(collectionLink, options) {
        return this.queryStoredProcedures(collectionLink, undefined, options);
    }

    /**
     * Get all conflicts in this collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink - The self-link of the collection.
     * @param {FeedOptions} [options] - The feed options.
     * @returns {QueryIterator}       - An instance of QueryIterator to handle reading feed.
     */
    public readConflicts(collectionLink, options) {
        return this.queryConflicts(collectionLink, undefined, options);
    }

    /** Lists all databases that satisfy a query.
     * @memberof DocumentClient
     * @instance
     * @param {SqlQuerySpec | string} query - A SQL query.
     * @param {FeedOptions} [options]       - The feed options.
     * @returns {QueryIterator}             - An instance of QueryIterator to handle reading feed.
    */
    public queryDatabases(query, options) {
        var that = this;
        return new QueryIterator(this, query, options, function (options, callback) {
            that.queryFeed.call(that,
                that,
                "/dbs",
                "dbs",
                "",
                function (result) { return result.Databases; },
                function (parent, body) { return body; },
                query,
                options,
                callback);
        });
    }

    /**
     * Query the collections for the database.
     * @memberof DocumentClient
     * @instance
     * @param {string} databaseLink           - The self-link of the database.
     * @param {SqlQuerySpec | string} query   - A SQL query.
     * @param {FeedOptions} [options]         - Represents the feed options.
     * @returns {QueryIterator}               - An instance of queryIterator to handle reading feed.
     */
    public queryCollections(databaseLink, query, options) {
        var that = this;

        var isNameBased = Base.isLinkNameBased(databaseLink);
        var path = this.getPathFromLink(databaseLink, "colls", isNameBased);
        var id = this.getIdFromLink(databaseLink, isNameBased);

        return new QueryIterator(this, query, options, function (options, callback) {
            that.queryFeed.call(that,
                that,
                path,
                "colls",
                id,
                function (result) { return result.DocumentCollections; },
                function (parent, body) { return body; },
                query,
                options,
                callback);
        });
    }

    /**
     * Query the documents for the collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} documentsFeedOrDatabaseLink          - The collection link or database link if using a partition resolver
     * @param {SqlQuerySpec | string} query                 - A SQL query.
     * @param {FeedOptions} [options]                       - Represents the feed options.
     * @param {object} [options.partitionKey]               - Optional partition key to be used with the partition resolver
     * @returns {QueryIterator}                             - An instance of queryIterator to handle reading feed.
     */
    public queryDocuments(documentsFeedOrDatabaseLink, query, options) {
        var partitionResolver = this.partitionResolvers[documentsFeedOrDatabaseLink];
        var collectionLinks;
        if (partitionResolver === undefined || partitionResolver === null) {
            collectionLinks = [documentsFeedOrDatabaseLink];
        } else {
            collectionLinks = partitionResolver.resolveForRead(options && options.partitionKey);
        }

        return this.queryDocumentsPrivate(collectionLinks, query, options);
    }

    /**
     * Query the partition key ranges
     * @memberof DocumentClient
     * @instance
     * @param {string} databaseLink           - The self-link of the database.
     * @param {SqlQuerySpec | string} query   - A SQL query.
     * @param {FeedOptions} [options]         - Represents the feed options.
     * @returns {QueryIterator}               - An instance of queryIterator to handle reading feed.
     * @ignore
     */
    public queryPartitionKeyRanges(collectionLink, query, options) {
        var that = this;

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "pkranges", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        return new QueryIterator(this, query, options, function (options, callback) {
            that.queryFeed.call(that,
                that,
                path,
                "pkranges",
                id,
                function (result) { return result.PartitionKeyRanges; },
                function (parent, body) { return body; },
                query,
                options,
                callback);
        });
    }


    /**
     * Query the attachments for the document.
     * @memberof DocumentClient
     * @instance
     * @param {string} documentLink           - The self-link of the document.
     * @param {SqlQuerySpec | string} query   - A SQL query.
     * @param {FeedOptions} [options]         - Represents the feed options.
     * @returns {QueryIterator}               - An instance of queryIterator to handle reading feed.
    */
    public queryAttachments(documentLink, query, options) {
        var that = this;

        var isNameBased = Base.isLinkNameBased(documentLink);
        var path = this.getPathFromLink(documentLink, "attachments", isNameBased);
        var id = this.getIdFromLink(documentLink, isNameBased);

        return new QueryIterator(this, query, options, function (options, callback) {
            that.queryFeed.call(that,
                that,
                path,
                "attachments",
                id,
                function (result) { return result.Attachments; },
                function (parent, body) { return body; },
                query,
                options,
                callback);
        });
    }

    /**
     * Query the users for the database.
     * @memberof DocumentClient
     * @instance
     * @param {string} databaseLink           - The self-link of the database.
     * @param {SqlQuerySpec | string} query   - A SQL query.
     * @param {FeedOptions} [options]         - Represents the feed options.
     * @returns {QueryIterator}               - An instance of queryIterator to handle reading feed.
     */
    public queryUsers(databaseLink, query, options) {
        var that = this;

        var isNameBased = Base.isLinkNameBased(databaseLink);
        var path = this.getPathFromLink(databaseLink, "users", isNameBased);
        var id = this.getIdFromLink(databaseLink, isNameBased);

        return new QueryIterator(this, query, options, function (options, callback) {
            that.queryFeed.call(that,
                that,
                path,
                "users",
                id,
                function (result) { return result.Users; },
                function (parent, body) { return body; },
                query,
                options,
                callback);
        });
    }

    /**
     * Query the permission for the user.
     * @memberof DocumentClient
     * @instance
     * @param {string} userLink               - The self-link of the user.
     * @param {SqlQuerySpec | string} query   - A SQL query.
     * @param {FeedOptions} [options]         - Represents the feed options.
     * @returns {QueryIterator}               - An instance of queryIterator to handle reading feed.
     */
    public queryPermissions(userLink, query, options) {
        var that = this;

        var isNameBased = Base.isLinkNameBased(userLink);
        var path = this.getPathFromLink(userLink, "permissions", isNameBased);
        var id = this.getIdFromLink(userLink, isNameBased);

        return new QueryIterator(this, query, options, function (options, callback) {
            that.queryFeed.call(that,
                that,
                path,
                "permissions",
                id,
                function (result) { return result.Permissions; },
                function (parent, body) { return body; },
                query,
                options,
                callback);
        });
    }

    /**
     * Query the triggers for the collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink         - The self-link of the collection.
     * @param {SqlQuerySpec | string} query   - A SQL query.
     * @param {FeedOptions} [options]         - Represents the feed options.
     * @returns {QueryIterator}               - An instance of queryIterator to handle reading feed.
     */
    public queryTriggers(collectionLink, query, options) {
        var that = this;

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "triggers", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        return new QueryIterator(this, query, options, function (options, callback) {
            that.queryFeed.call(that,
                that,
                path,
                "triggers",
                id,
                function (result) { return result.Triggers; },
                function (parent, body) { return body; },
                query,
                options,
                callback);
        });
    }

    /**
     * Query the user defined functions for the collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink         - The self-link of the collection.
     * @param {SqlQuerySpec | string} query   - A SQL query.
     * @param {FeedOptions} [options]         - Represents the feed options.
     * @returns {QueryIterator}               - An instance of queryIterator to handle reading feed.
     */
    public queryUserDefinedFunctions(collectionLink, query, options) {
        var that = this;

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "udfs", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        return new QueryIterator(this, query, options, function (options, callback) {
            that.queryFeed.call(that,
                that,
                path,
                "udfs",
                id,
                function (result) { return result.UserDefinedFunctions; },
                function (parent, body) { return body; },
                query,
                options,
                callback);
        });
    }

    /**
     * Query the storedProcedures for the collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink         - The self-link of the collection.
     * @param {SqlQuerySpec | string} query   - A SQL query.
     * @param {FeedOptions} [options]         - Represents the feed options.
     * @returns {QueryIterator}               - An instance of queryIterator to handle reading feed.
     */
    public queryStoredProcedures(collectionLink, query, options) {
        var that = this;

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "sprocs", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        return new QueryIterator(this, query, options, function (options, callback) {
            that.queryFeed.call(that,
                that,
                path,
                "sprocs",
                id,
                function (result) { return result.StoredProcedures; },
                function (parent, body) { return body; },
                query,
                options,
                callback);
        });
    }

    /**
     * Query the conflicts for the collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink         - The self-link of the collection.
     * @param {SqlQuerySpec | string} query   - A SQL query.
     * @param {FeedOptions} [options]         - Represents the feed options.
     * @returns {QueryIterator}               - An instance of queryIterator to handle reading feed.
     */
    public queryConflicts(collectionLink, query, options) {
        var that = this;

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "conflicts", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        return new QueryIterator(this, query, options, function (options, callback) {
            that.queryFeed.call(that,
                that,
                path,
                "conflicts",
                id,
                function (result) { return result.Conflicts; },
                function (parent, body) { return body; },
                query,
                options,
                callback);
        });
    }

    /**
     * Delete the database object.
     * @memberof DocumentClient
     * @instance
     * @param {string} databaseLink         - The self-link of the database.
     * @param {RequestOptions} [options]    - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
    */
    public deleteDatabase(databaseLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(databaseLink);
        var path = this.getPathFromLink(databaseLink, "", isNameBased);
        var id = this.getIdFromLink(databaseLink, isNameBased);
        this.deleteResource(path, "dbs", id, undefined, options, callback);
    }

    /**
     * Delete the collection object.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink    - The self-link of the collection.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public deleteCollection(collectionLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        this.deleteResource(path, "colls", id, undefined, options, callback);
    }

    /**
     * Delete the document object.
     * @memberof DocumentClient
     * @instance
     * @param {string} documentLink      - The self-link of the document.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public deleteDocument(documentLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(documentLink);
        var path = this.getPathFromLink(documentLink, "", isNameBased);
        var id = this.getIdFromLink(documentLink, isNameBased);

        this.deleteResource(path, "docs", id, undefined, options, callback);
    }

    /**
     * Delete the attachment object.
     * @memberof DocumentClient
     * @instance
     * @param {string} attachmentLink    - The self-link of the attachment.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public deleteAttachment(attachmentLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(attachmentLink);
        var path = this.getPathFromLink(attachmentLink, "", isNameBased);
        var id = this.getIdFromLink(attachmentLink, isNameBased);

        this.deleteResource(path, "attachments", id, undefined, options, callback);
    }

    /**
     * Delete the user object.
     * @memberof DocumentClient
     * @instance
     * @param {string} userLink          - The self-link of the user.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public deleteUser(userLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(userLink);
        var path = this.getPathFromLink(userLink, "", isNameBased);
        var id = this.getIdFromLink(userLink, isNameBased);

        this.deleteResource(path, "users", id, undefined, options, callback);
    }

    /**
     * Delete the permission object.
     * @memberof DocumentClient
     * @instance
     * @param {string} permissionLink    - The self-link of the permission.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public deletePermission(permissionLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(permissionLink);
        var path = this.getPathFromLink(permissionLink, "", isNameBased);
        var id = this.getIdFromLink(permissionLink, isNameBased);

        this.deleteResource(path, "permissions", id, undefined, options, callback);
    }

    /**
     * Delete the trigger object.
     * @memberof DocumentClient
     * @instance
     * @param {string} triggerLink       - The self-link of the trigger.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public deleteTrigger(triggerLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(triggerLink);
        var path = this.getPathFromLink(triggerLink, "", isNameBased);
        var id = this.getIdFromLink(triggerLink, isNameBased);

        this.deleteResource(path, "triggers", id, undefined, options, callback);
    }

    /**
     * Delete the UserDefinedFunction object.
     * @memberof DocumentClient
     * @instance
     * @param {string} udfLink           - The self-link of the user defined function.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public deleteUserDefinedFunction(udfLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(udfLink);
        var path = this.getPathFromLink(udfLink, "", isNameBased);
        var id = this.getIdFromLink(udfLink, isNameBased);

        this.deleteResource(path, "udfs", id, undefined, options, callback);
    }

    /**
     * Delete the StoredProcedure object.
     * @memberof DocumentClient
     * @instance
     * @param {string} sprocLink         - The self-link of the stored procedure.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public deleteStoredProcedure(sprocLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(sprocLink);
        var path = this.getPathFromLink(sprocLink, "", isNameBased);
        var id = this.getIdFromLink(sprocLink, isNameBased);

        this.deleteResource(path, "sprocs", id, undefined, options, callback);
    }

    /**
     * Delete the conflict object.
     * @memberof DocumentClient
     * @instance
     * @param {string} conflictLink      - The self-link of the conflict.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public deleteConflict(conflictLink, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var isNameBased = Base.isLinkNameBased(conflictLink);
        var path = this.getPathFromLink(conflictLink, "", isNameBased);
        var id = this.getIdFromLink(conflictLink, isNameBased);

        this.deleteResource(path, "conflicts", id, undefined, options, callback);
    }

    /**
     * Replace the document collection.
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink    - The self-link of the document collection.
     * @param {object} collection        - Represent the new document collection body.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public replaceCollection(collectionLink, collection, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var err = {};
        if (!this.isResourceValid(collection, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        this.replace(collection, path, "colls", id, undefined, options, callback);
    }

    /**
     * Replace the document object.
     * @memberof DocumentClient
     * @instance
     * @param {string} documentLink      - The self-link of the document.
     * @param {object} document          - Represent the new document body.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public replaceDocument(documentLink, newDocument, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var that = this;

        var task = function () {
            var err = {};
            if (!that.isResourceValid(newDocument, err)) {
                callback(err);
                return;
            }

            var isNameBased = Base.isLinkNameBased(documentLink);
            var path = that.getPathFromLink(documentLink, "", isNameBased);
            var id = that.getIdFromLink(documentLink, isNameBased);

            that.replace(newDocument, path, "docs", id, undefined, options, callback);
        };

        if (options.partitionKey === undefined && options.skipGetPartitionKeyDefinition !== true) {
            this.getPartitionKeyDefinition(Base.getCollectionLink(documentLink), function (err, partitionKeyDefinition, response, headers) {
                if (err) return callback(err, response, headers);
                options.partitionKey = that.extractPartitionKey(newDocument, partitionKeyDefinition);

                task();
            });
        }
        else {
            task();
        }
    }

    /**
     * Replace the attachment object.
     * @memberof DocumentClient
     * @instance
     * @param {string} attachmentLink    - The self-link of the attachment.
     * @param {object} attachment        - Represent the new attachment body.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public replaceAttachment(attachmentLink, attachment, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var err = {};
        if (!this.isResourceValid(attachment, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(attachmentLink);
        var path = this.getPathFromLink(attachmentLink, "", isNameBased);
        var id = this.getIdFromLink(attachmentLink, isNameBased);

        this.replace(attachment, path, "attachments", id, undefined, options, callback);
    }

    /**
     * Replace the user object.
     * @memberof DocumentClient
     * @instance
     * @param {string} userLink          - The self-link of the user.
     * @param {object} user              - Represent the new user body.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public replaceUser(userLink, user, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var err = {};
        if (!this.isResourceValid(user, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(userLink);
        var path = this.getPathFromLink(userLink, "", isNameBased);
        var id = this.getIdFromLink(userLink, isNameBased);

        this.replace(user, path, "users", id, undefined, options, callback);
    }

    /**
     * Replace the permission object.
     * @memberof DocumentClient
     * @instance
     * @param {string} permissionLink    - The self-link of the permission.
     * @param {object} permission        - Represent the new permission body.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public replacePermission(permissionLink, permission, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var err = {};
        if (!this.isResourceValid(permission, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(permissionLink);
        var path = this.getPathFromLink(permissionLink, "", isNameBased);
        var id = this.getIdFromLink(permissionLink, isNameBased);

        this.replace(permission, path, "permissions", id, undefined, options, callback);
    }

    /**
     * Replace the trigger object.
     * @memberof DocumentClient
     * @instance
     * @param {string} triggerLink       - The self-link of the trigger.
     * @param {object} trigger           - Represent the new trigger body.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public replaceTrigger(triggerLink, trigger, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        if (trigger.serverScript) {
            trigger.body = trigger.serverScript.toString();
        } else if (trigger.body) {
            trigger.body = trigger.body.toString();
        }

        var err = {};
        if (!this.isResourceValid(trigger, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(triggerLink);
        var path = this.getPathFromLink(triggerLink, "", isNameBased);
        var id = this.getIdFromLink(triggerLink, isNameBased);

        this.replace(trigger, path, "triggers", id, undefined, options, callback);
    }

    /**
     * Replace the UserDefinedFunction object.
     * @memberof DocumentClient
     * @instance
     * @param {string} udfLink           - The self-link of the user defined function.
     * @param {object} udf               - Represent the new udf body.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public replaceUserDefinedFunction(udfLink, udf, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        if (udf.serverScript) {
            udf.body = udf.serverScript.toString();
        } else if (udf.body) {
            udf.body = udf.body.toString();
        }

        var err = {};
        if (!this.isResourceValid(udf, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(udfLink);
        var path = this.getPathFromLink(udfLink, "", isNameBased);
        var id = this.getIdFromLink(udfLink, isNameBased);

        this.replace(udf, path, "udfs", id, undefined, options, callback);
    }

    /**
     * Replace the StoredProcedure object.
     * @memberof DocumentClient
     * @instance
     * @param {string} sprocLink         - The self-link of the stored procedure.
     * @param {object} sproc             - Represent the new sproc body.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
    */
    public replaceStoredProcedure(sprocLink, sproc, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        if (sproc.serverScript) {
            sproc.body = sproc.serverScript.toString();
        } else if (sproc.body) {
            sproc.body = sproc.body.toString();
        }

        var err = {};
        if (!this.isResourceValid(sproc, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(sprocLink);
        var path = this.getPathFromLink(sprocLink, "", isNameBased);
        var id = this.getIdFromLink(sprocLink, isNameBased);

        this.replace(sproc, path, "sprocs", id, undefined, options, callback);
    }

    /**
     * Upsert a document.
     * <p>
     * There is no set schema for JSON documents. They may contain any number of custom properties as well as an optional list of attachments. <br>
     * A Document is an application resource and can be authorized using the master key or resource keys
     * </p>
     * @memberof DocumentClient
     * @instance
     * @param {string} documentsFeedOrDatabaseLink               - The collection link or database link if using a partition resolver
     * @param {object} body                                      - Represents the body of the document. Can contain any number of user defined properties.
     * @param {string} [body.id]                                 - The id of the document, MUST be unique for each document.
     * @param {number} body.ttl                                  - The time to live in seconds of the document.
     * @param {RequestOptions} [options]                         - The request options.
     * @param {boolean} [options.disableAutomaticIdGeneration]   - Disables the automatic id generation. If id is missing in the body and this option is true, an error will be returned.
     * @param {RequestCallback} callback                         - The callback for the request.
     */
    public upsertDocument(documentsFeedOrDatabaseLink, body, options, callback) {
        var partitionResolver = this.partitionResolvers[documentsFeedOrDatabaseLink];

        var collectionLink;
        if (partitionResolver === undefined || partitionResolver === null) {
            collectionLink = documentsFeedOrDatabaseLink;
        } else {
            collectionLink = this.resolveCollectionLinkForCreate(partitionResolver, body);
        }

        this.upsertDocumentPrivate(collectionLink, body, options, callback);
    }

    /**
     * Upsert an attachment for the document object.
     * <p>
     * Each document may contain zero or more attachments. Attachments can be of any MIME type - text, image, binary data. <br>
     * These are stored externally in Azure Blob storage. Attachments are automatically deleted when the parent document is deleted.
     * </P>
     * @memberof DocumentClient
     * @instance
     * @param {string} documentLink         - The self-link of the document.
     * @param {Object} body                 - The metadata the defines the attachment media like media, contentType. It can include any other properties as part of the metedata.
     * @param {string} body.contentType     - The MIME contentType of the attachment.
     * @param {string} body.media           - Media link associated with the attachment content.
     * @param {RequestOptions} options      - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
     */
    public upsertAttachment(documentLink, body, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var err = {};
        if (!this.isResourceValid(body, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(documentLink);
        var path = this.getPathFromLink(documentLink, "attachments", isNameBased);
        var id = this.getIdFromLink(documentLink, isNameBased);

        this.upsert(body, path, "attachments", id, undefined, options, callback);
    }

    /**
     * Upsert a database user.
     * @memberof DocumentClient
     * @instance
     * @param {string} databaseLink         - The self-link of the database.
     * @param {object} body                 - Represents the body of the user.
     * @param {string} body.id              - The id of the user.
     * @param {RequestOptions} [options]    - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
     */
    public upsertUser(databaseLink, body, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var err = {};
        if (!this.isResourceValid(body, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(databaseLink);
        var path = this.getPathFromLink(databaseLink, "users", isNameBased);
        var id = this.getIdFromLink(databaseLink, isNameBased);

        this.upsert(body, path, "users", id, undefined, options, callback);
    }

    /**
     * Upsert a permission.
     * <p> A permission represents a per-User Permission to access a specific resource e.g. Document or Collection.  </p>
     * @memberof DocumentClient
     * @instance
     * @param {string} userLink             - The self-link of the user.
     * @param {object} body                 - Represents the body of the permission.
     * @param {string} body.id              - The id of the permission
     * @param {string} body.permissionMode  - The mode of the permission, must be a value of {@link PermissionMode}
     * @param {string} body.resource        - The link of the resource that the permission will be applied to.
     * @param {RequestOptions} [options]    - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
     */
    public upsertPermission(userLink, body, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var err = {};
        if (!this.isResourceValid(body, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(userLink);
        var path = this.getPathFromLink(userLink, "permissions", isNameBased);
        var id = this.getIdFromLink(userLink, isNameBased);

        this.upsert(body, path, "permissions", id, undefined, options, callback);
    }

    /**
    * Upsert a trigger.
    * <p>
    * Azure Cosmos DB supports pre and post triggers defined in JavaScript to be executed on creates, updates and deletes. <br>
    * For additional details, refer to the server-side JavaScript API documentation.
    * </p>
    * @memberof DocumentClient
    * @instance
    * @param {string} collectionLink           - The self-link of the collection.
    * @param {object} trigger                  - Represents the body of the trigger.
    * @param {string} trigger.id             - The id of the trigger.
    * @param {string} trigger.triggerType      - The type of the trigger, should be one of the values of {@link TriggerType}.
    * @param {string} trigger.triggerOperation - The trigger operation, should be one of the values of {@link TriggerOperation}.
    * @param {function} trigger.serverScript   - The body of the trigger, it can be passed as stringified too.
    * @param {RequestOptions} [options]        - The request options.
    * @param {RequestCallback} callback        - The callback for the request.
    */
    public upsertTrigger(collectionLink, trigger, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        if (trigger.serverScript) {
            trigger.body = trigger.serverScript.toString();
        } else if (trigger.body) {
            trigger.body = trigger.body.toString();
        }

        var err = {};
        if (!this.isResourceValid(trigger, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "triggers", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        this.upsert(trigger, path, "triggers", id, undefined, options, callback);
    }

    /**
     * Upsert a UserDefinedFunction.
     * <p>
     * Azure Cosmos DB supports JavaScript UDFs which can be used inside queries, stored procedures and triggers. <br>
     * For additional details, refer to the server-side JavaScript API documentation.
     * </p>
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink                - The self-link of the collection.
     * @param {object} udf                           - Represents the body of the userDefinedFunction.
     * @param {string} udf.id                      - The id of the udf.
     * @param {string} udf.userDefinedFunctionType   - The type of the udf, it should be one of the values of {@link UserDefinedFunctionType}
     * @param {function} udf.serverScript            - Represents the body of the udf, it can be passed as stringified too.
     * @param {RequestOptions} [options]             - The request options.
     * @param {RequestCallback} callback             - The callback for the request.
     */
    public upsertUserDefinedFunction(collectionLink, udf, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        if (udf.serverScript) {
            udf.body = udf.serverScript.toString();
        } else if (udf.body) {
            udf.body = udf.body.toString();
        }

        var err = {};
        if (!this.isResourceValid(udf, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "udfs", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        this.upsert(udf, path, "udfs", id, undefined, options, callback);
    }

    /**
     * Upsert a StoredProcedure.
     * <p>
     * Azure Cosmos DB allows stored procedures to be executed in the storage tier, directly against a document collection. The script <br>
     * gets executed under ACID transactions on the primary storage partition of the specified collection. For additional details, <br>
     * refer to the server-side JavaScript API documentation.
     * </p>
     * @memberof DocumentClient
     * @instance
     * @param {string} collectionLink       - The self-link of the collection.
     * @param {object} sproc                - Represents the body of the stored procedure.
     * @param {string} sproc.id           - The id of the stored procedure.
     * @param {function} sproc.serverScript - The body of the stored procedure, it can be passed as stringified too.
     * @param {RequestOptions} [options]    - The request options.
     * @param {RequestCallback} callback    - The callback for the request.
     */
    public upsertStoredProcedure(collectionLink, sproc, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        if (sproc.serverScript) {
            sproc.body = sproc.serverScript.toString();
        } else if (sproc.body) {
            sproc.body = sproc.body.toString();
        }

        var err = {};
        if (!this.isResourceValid(sproc, err)) {
            callback(err);
            return;
        }

        var isNameBased = Base.isLinkNameBased(collectionLink);
        var path = this.getPathFromLink(collectionLink, "sprocs", isNameBased);
        var id = this.getIdFromLink(collectionLink, isNameBased);

        this.upsert(sproc, path, "sprocs", id, undefined, options, callback);
    }

    /**
     * Upsert an attachment for the document object.
     * @memberof DocumentClient
     * @instance
     * @param {string} documentLink             - The self-link of the document.
     * @param {stream.Readable} readableStream  - the stream that represents the media itself that needs to be uploaded.
     * @param {MediaOptions} [options]          - The request options.
     * @param {RequestCallback} callback        - The callback for the request.
    */
    public upsertAttachmentAndUploadMedia(documentLink, readableStream, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var initialHeaders = Base.extend({}, this.defaultHeaders);
        initialHeaders = Base.extend(initialHeaders, options && options.initialHeaders);

        // Add required headers slug and content-type.
        if (options.slug) {
            initialHeaders[Constants.HttpHeaders.Slug] = options.slug;
        }

        if (options.contentType) {
            initialHeaders[Constants.HttpHeaders.ContentType] = options.contentType;
        } else {
            initialHeaders[Constants.HttpHeaders.ContentType] = Constants.MediaTypes.OctetStream;
        }

        var isNameBased = Base.isLinkNameBased(documentLink);
        var path = this.getPathFromLink(documentLink, "attachments", isNameBased);
        var id = this.getIdFromLink(documentLink, isNameBased);

        this.upsert(readableStream, path, "attachments", id, initialHeaders, options, callback);
    }

    /**
      * Read the media for the attachment object.
      * @memberof DocumentClient
      * @instance
      * @param {string} mediaLink         - The media link of the media in the attachment.
      * @param {RequestCallback} callback - The callback for the request, the result parameter can be a buffer or a stream
      *                                     depending on the value of {@link MediaReadMode}.
      */
    public readMedia(mediaLink, callback) {
        var resourceInfo = Base.parseLink(mediaLink);
        var path = "/" + mediaLink;
        var initialHeaders = Base.extend({}, this.defaultHeaders);
        initialHeaders[Constants.HttpHeaders.Accept] = Constants.MediaTypes.Any;
        var attachmentId = Base.getAttachmentIdFromMediaId(resourceInfo.objectBody.id).toLowerCase();

        var headersPromise = Base.getHeaders(this, initialHeaders, "get", path, attachmentId, "media", {});

        var that = this;
        headersPromise.then(function (headers) {
            // readMedia will always use WriteEndpoint since it's not replicated in readable Geo regions
            that._globalEndpointManager.getWriteEndpoint(function (writeEndpoint) {
                that.get(writeEndpoint, path, headers, callback);
            });
        });
    }

    /**
     * Update media for the attachment
     * @memberof DocumentClient
     * @instance
     * @param {string} mediaLink                - The media link of the media in the attachment.
     * @param {stream.Readable} readableStream  - The stream that represents the media itself that needs to be uploaded.
     * @param {MediaOptions} [options]          - options for the media
     * @param {RequestCallback} callback        - The callback for the request.
     */
    public updateMedia(mediaLink, readableStream, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var defaultHeaders = this.defaultHeaders;
        var initialHeaders = Base.extend({}, defaultHeaders);
        initialHeaders = Base.extend(initialHeaders, options && options.initialHeaders);

        // Add required headers slug and content-type in case the body is a stream
        if (options.slug) {
            initialHeaders[Constants.HttpHeaders.Slug] = options.slug;
        }

        if (options.contentType) {
            initialHeaders[Constants.HttpHeaders.ContentType] = options.contentType;
        } else {
            initialHeaders[Constants.HttpHeaders.ContentType] = Constants.MediaTypes.OctetStream;
        }

        initialHeaders[Constants.HttpHeaders.Accept] = Constants.MediaTypes.Any;

        var resourceInfo = Base.parseLink(mediaLink);
        var path = "/" + mediaLink;
        var attachmentId = Base.getAttachmentIdFromMediaId(resourceInfo.objectBody.id).toLowerCase();
        var headersPromise = Base.getHeaders(this, initialHeaders, "put", path, attachmentId, "media", options);

        // updateMedia will use WriteEndpoint since it uses PUT operation
        var that = this;

        headersPromise.then(function (headers) {
            that._globalEndpointManager.getWriteEndpoint(function (writeEndpoint) {
                that.put(writeEndpoint, path, readableStream, headers, callback);
            });
        });
    }

    /**
     * Execute the StoredProcedure represented by the object with partition key.
     * @memberof DocumentClient
     * @instance
     * @param {string} sprocLink            - The self-link of the stored procedure.
     * @param {Array} [params]              - represent the parameters of the stored procedure.
     * @param {Object} [options]            - partition key
     * @param {RequestCallback} callback    - The callback for the request.
    */
    public executeStoredProcedure(sprocLink, params, options, callback) {
        if (!callback && !options) {
            callback = params;
            params = null;
            options = {}
        }
        else if (!callback) {
            callback = options;
            options = {};
        }

        var defaultHeaders = this.defaultHeaders;
        var initialHeaders = {};
        initialHeaders = Base.extend(initialHeaders, defaultHeaders);
        initialHeaders = Base.extend(initialHeaders, options && options.initialHeaders);

        // Accept a single parameter or an array of parameters.
        if (params !== null && params !== undefined && params.constructor !== Array) {
            params = [params];
        }

        var isNameBased = Base.isLinkNameBased(sprocLink);
        var path = this.getPathFromLink(sprocLink, "", isNameBased);
        var id = this.getIdFromLink(sprocLink, isNameBased);

        var headersPromise = Base.getHeaders(this, initialHeaders, "post", path, id, "sprocs", options);

        // executeStoredProcedure will use WriteEndpoint since it uses POST operation
        var that = this;
        headersPromise.then(function (headers) {
            that._globalEndpointManager.getWriteEndpoint(function (writeEndpoint) {
                that.post(writeEndpoint, path, params, headers, callback);
            });
        });
    }

    /**
     * Replace the offer object.
     * @memberof DocumentClient
     * @instance
     * @param {string} offerLink         - The self-link of the offer.
     * @param {object} offer             - Represent the new offer body.
     * @param {RequestCallback} callback - The callback for the request.
     */
    public replaceOffer(offerLink, offer, callback) {
        var err = {};
        if (!this.isResourceValid(offer, err)) {
            callback(err);
            return;
        }

        var path = "/" + offerLink;
        var id = Base.parseLink(offerLink).objectBody.id.toLowerCase();
        this.replace(offer, path, "offers", id, undefined, {}, callback);
    }

    /** Reads an offer.
     * @memberof DocumentClient
     * @instance
     * @param {string} offerLink         - The self-link of the offer.
     * @param {RequestCallback} callback    - The callback for the request.
    */
    public readOffer(offerLink, callback) {
        var path = "/" + offerLink;
        var id = Base.parseLink(offerLink).objectBody.id.toLowerCase();
        this.read(path, "offers", id, undefined, {}, callback);
    }

    /** Lists all offers.
     * @memberof DocumentClient
     * @instance
     * @param {FeedOptions} [options] - The feed options.
     * @returns {QueryIterator}       - An instance of queryIterator to handle reading feed.
    */
    public readOffers(options) {
        return this.queryOffers(undefined, options);
    }

    /** Lists all offers that satisfy a query.
     * @memberof DocumentClient
     * @instance
     * @param {SqlQuerySpec | string} query - A SQL query.
     * @param {FeedOptions} [options]       - The feed options.
     * @returns {QueryIterator}             - An instance of QueryIterator to handle reading feed.
    */
    public queryOffers(query, options) {
        var that = this;
        return new QueryIterator(this, query, options, function (options, callback) {
            that.queryFeed.call(that,
                that,
                "/offers",
                "offers",
                "",
                function (result) { return result.Offers; },
                function (parent, body) { return body; },
                query,
                options,
                callback);
        });
    }

    /** Gets the Database account information.
   * @memberof DocumentClient
   * @instance
   * @param {string} [options.urlConnection]   - The endpoint url whose database account needs to be retrieved. If not present, current client's url will be used.
   * @param {RequestCallback} callback         - The callback for the request. The second parameter of the callback will be of type {@link DatabaseAccount}.
   */
    public getDatabaseAccount(options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var urlConnection = options.urlConnection || this.urlConnection;

        var headersPromise = Base.getHeaders(this, this.defaultHeaders, "get", "", "", "", {});
        var that = this;
        headersPromise.then(function (headers) {
            that.get(urlConnection, "", headers, function (err, result, headers) {
                if (err) return callback(err);

                var databaseAccount = new AzureDocuments.DatabaseAccount();
                databaseAccount.DatabasesLink = "/dbs/";
                databaseAccount.MediaLink = "/media/";
                databaseAccount.MaxMediaStorageUsageInMB = headers[Constants.HttpHeaders.MaxMediaStorageUsageInMB];
                databaseAccount.CurrentMediaStorageUsageInMB = headers[Constants.HttpHeaders.CurrentMediaStorageUsageInMB];
                databaseAccount.ConsistencyPolicy = result.userConsistencyPolicy;

                // WritableLocations and ReadableLocations properties will be available only for geo-replicated database accounts
                if (Constants.WritableLocations in result && result.id !== "localhost") {
                    databaseAccount._writableLocations = result[Constants.WritableLocations];
                }
                if (Constants.ReadableLocations in result && result.id !== "localhost") {
                    databaseAccount._readableLocations = result[Constants.ReadableLocations];
                }

                callback(undefined, databaseAccount, headers);
            });
        });
    }

    /** @ignore */
    public createDocumentPrivate(collectionLink, body, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var that = this;

        var task = function () {
            // Generate random document id if the id is missing in the payload and options.disableAutomaticIdGeneration != true
            if ((body.id === undefined || body.id === "") && !options.disableAutomaticIdGeneration) {
                body.id = Base.generateGuidId();
            }

            var err = {};
            if (!that.isResourceValid(body, err)) {
                callback(err);
                return;
            }

            var isNameBased = Base.isLinkNameBased(collectionLink);
            var path = that.getPathFromLink(collectionLink, "docs", isNameBased);
            var id = that.getIdFromLink(collectionLink, isNameBased);

            that.create(body, path, "docs", id, undefined, options, callback);
        };

        if (options.partitionKey === undefined && options.skipGetPartitionKeyDefinition !== true) {
            this.getPartitionKeyDefinition(collectionLink, function (err, partitionKeyDefinition, response, headers) {
                if (err) return callback(err, response, headers);
                options.partitionKey = that.extractPartitionKey(body, partitionKeyDefinition);

                task();
            });
        }
        else {
            task();
        }
    }

    /** @ignore */
    public upsertDocumentPrivate(collectionLink, body, options, callback) {
        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var that = this;

        var task = function () {
            // Generate random document id if the id is missing in the payload and options.disableAutomaticIdGeneration != true
            if ((body.id === undefined || body.id === "") && !options.disableAutomaticIdGeneration) {
                body.id = Base.generateGuidId();
            }

            var err = {};
            if (!that.isResourceValid(body, err)) {
                callback(err);
                return;
            }

            var isNameBased = Base.isLinkNameBased(collectionLink);
            var path = that.getPathFromLink(collectionLink, "docs", isNameBased);
            var id = that.getIdFromLink(collectionLink, isNameBased);

            that.upsert(body, path, "docs", id, undefined, options, callback);
        };

        if (options.partitionKey === undefined && options.skipGetPartitionKeyDefinition !== true) {
            this.getPartitionKeyDefinition(collectionLink, function (err, partitionKeyDefinition, response, headers) {
                if (err) return callback(err, response, headers);
                options.partitionKey = that.extractPartitionKey(body, partitionKeyDefinition);

                task();
            });
        }
        else {
            task();
        }
    }

    /** @ignore */
    public queryDocumentsPrivate(collectionLinks, query, options) {
        var that = this;

        var fetchFunctions = Base.map(collectionLinks, function (collectionLink) {
            var isNameBased = Base.isLinkNameBased(collectionLink);
            var path = that.getPathFromLink(collectionLink, "docs", isNameBased);
            var id = that.getIdFromLink(collectionLink, isNameBased);

            return function (options, callback) {
                that.queryFeed.call(that,
                    that,
                    path,
                    "docs",
                    id,
                    function (result) { return result ? result.Documents : []; },
                    function (parent, body) { return body; },
                    query,
                    options,
                    callback);
            };
        });

        return new QueryIterator(this, query, options, fetchFunctions, collectionLinks);
    }

    /** @ignore */
    public create(body, path, type, id, initialHeaders, options, callback) {
        initialHeaders = initialHeaders || Base.extend({}, this.defaultHeaders);
        initialHeaders = Base.extend(initialHeaders, options && options.initialHeaders);
        var headersPromise = Base.getHeaders(this, initialHeaders, "post", path, id, type, options);

        var that = this;

        // create will use WriteEndpoint since it uses POST operation
        headersPromise.then(function (headers) {
            that.applySessionToken(path, headers);

            that._globalEndpointManager.getWriteEndpoint(function (writeEndpoint) {
                that.post(writeEndpoint, path, body, headers, function (err, result, resHeaders) {
                    that.captureSessionToken(path, Constants.OperationTypes.Create, headers, resHeaders);
                    callback(err, result, resHeaders);
                });
            });
        });
    }

    /** @ignore */
    public upsert(body, path, type, id, initialHeaders, options, callback) {
        initialHeaders = initialHeaders || Base.extend({}, this.defaultHeaders);
        initialHeaders = Base.extend(initialHeaders, options && options.initialHeaders);
        var headersPromise = Base.getHeaders(this, initialHeaders, "post", path, id, type, options);

        var that = this;

        headersPromise.then(function (headers) {
            that.setIsUpsertHeader(headers);
            that.applySessionToken(path, headers);

            // upsert will use WriteEndpoint since it uses POST operation
            that._globalEndpointManager.getWriteEndpoint(function (writeEndpoint) {
                that.post(writeEndpoint, path, body, headers, function (err, result, resHeaders) {
                    that.captureSessionToken(path, Constants.OperationTypes.Upsert, headers, resHeaders);
                    callback(err, result, resHeaders);
                });
            });
        });
    }

    /** @ignore */
    public replace(resource, path, type, id, initialHeaders, options, callback) {
        initialHeaders = initialHeaders || Base.extend({}, this.defaultHeaders);
        initialHeaders = Base.extend(initialHeaders, options && options.initialHeaders);
        var headersPromise = Base.getHeaders(this, initialHeaders, "put", path, id, type, options);

        var that = this;

        headersPromise.then(function (headers) {
            that.applySessionToken(path, headers);

            // replace will use WriteEndpoint since it uses PUT operation
            that._globalEndpointManager.getWriteEndpoint(function (writeEndpoint) {
                that.put(writeEndpoint, path, resource, headers, function (err, result, resHeaders) {
                    that.captureSessionToken(path, Constants.OperationTypes.Replace, headers, resHeaders);
                    callback(err, result, resHeaders);
                });
            });
        });
    }

    /** @ignore */
    public read(path, type, id, initialHeaders, options, callback) {
        initialHeaders = initialHeaders || Base.extend({}, this.defaultHeaders);
        initialHeaders = Base.extend(initialHeaders, options && options.initialHeaders);
        var headersPromise = Base.getHeaders(this, initialHeaders, "get", path, id, type, options);

        var that = this;

        headersPromise.then(function (headers) {
            that.applySessionToken(path, headers);

            var request = { "path": path, "operationType": Constants.OperationTypes.Read, "client": this, "endpointOverride": null };

            // read will use ReadEndpoint since it uses GET operation
            that._globalEndpointManager.getReadEndpoint(function (readEndpoint) {
                that.get(readEndpoint, request, headers, function (err, result, resHeaders) {
                    that.captureSessionToken(path, Constants.OperationTypes.Read, headers, resHeaders);
                    callback(err, result, resHeaders);
                });
            });
        });
    }

    /** @ignore */
    public deleteResource(path, type, id, initialHeaders, options, callback) {
        initialHeaders = initialHeaders || Base.extend({}, this.defaultHeaders);
        initialHeaders = Base.extend(initialHeaders, options && options.initialHeaders);
        var headersPromise = Base.getHeaders(this, initialHeaders, "delete", path, id, type, options);

        var that = this;
        headersPromise.then(function (headers) {

            that.applySessionToken(path, headers);
            // deleteResource will use WriteEndpoint since it uses DELETE operation
            that._globalEndpointManager.getWriteEndpoint(function (writeEndpoint) {
                that.delete(writeEndpoint, path, headers, function (err, result, resHeaders) {
                    if (Base.parseLink(path).type != "colls")
                        that.captureSessionToken(path, Constants.OperationTypes.Delete, headers, resHeaders);
                    else
                        that.clearSessionToken(path);
                    callback(err, result, resHeaders);
                });
            });
        });
    }

    /** @ignore */
    public get(url, request, headers, callback) {
        return RequestHandler.request(this._globalEndpointManager, this.connectionPolicy, this.requestAgent, "GET", url, request, undefined, this.defaultUrlParams, headers, callback);
    }

    /** @ignore */
    public post(url, request, body, headers, callback) {
        return RequestHandler.request(this._globalEndpointManager, this.connectionPolicy, this.requestAgent, "POST", url, request, body, this.defaultUrlParams, headers, callback);
    }

    /** @ignore */
    public put(url, request, body, headers, callback) {
        return RequestHandler.request(this._globalEndpointManager, this.connectionPolicy, this.requestAgent, "PUT", url, request, body, this.defaultUrlParams, headers, callback);
    }

    /** @ignore */
    public head(url, request, headers, callback) {
        return RequestHandler.request(this._globalEndpointManager, this.connectionPolicy, this.requestAgent, "HEAD", url, request, undefined, this.defaultUrlParams, headers, callback);
    }

    /** @ignore */
    public delete(url, request, headers, callback) {
        return RequestHandler.request(this._globalEndpointManager, this.connectionPolicy, this.requestAgent, "DELETE", url, request, undefined, this.defaultUrlParams, headers, callback);
    }

    /** Gets the partition key definition first by looking into the cache otherwise by reading the collection.
    * @ignore
    * @param {string} collectionLink   - Link to the collection whose partition key needs to be extracted.
    * @param {function} callback       - The arguments to the callback are(in order): error, partitionKeyDefinition, response object and response headers
    */
    public getPartitionKeyDefinition(collectionLink, callback) {
        // $ISSUE-felixfan-2016-03-17: Make name based path and link based path use the same key
        // $ISSUE-felixfan-2016-03-17: Refresh partitionKeyDefinitionCache when necessary
        if (collectionLink in this.partitionKeyDefinitionCache) {
            return callback(undefined, this.partitionKeyDefinitionCache[collectionLink]);
        }

        var that = this;

        this.readCollection(collectionLink, function (err, collection, headers) {
            if (err) return callback(err, undefined, collection, headers);
            callback(err, that.partitionKeyDefinitionCache[collectionLink], collection, headers);
        });
    }

    public extractPartitionKey(document, partitionKeyDefinition) {
        if (partitionKeyDefinition && partitionKeyDefinition.paths && partitionKeyDefinition.paths.length > 0) {
            var partitionKey = [];
            partitionKeyDefinition.paths.forEach(function (path) {
                var pathParts = Base.parsePath(path);

                var obj = document;
                for (var i = 0; i < pathParts.length; ++i) {
                    if (!((typeof obj === "object") && (pathParts[i] in obj))) {
                        obj = {};
                        break;
                    }

                    obj = obj[pathParts[i]];
                }

                partitionKey.push(obj);
            });

            return partitionKey;
        }

        return undefined;
    }

    /** @ignore */
    public queryFeed(documentclient, path, type, id, resultFn, createFn, query, options, callback, partitionKeyRangeId) {
        var that = this;

        var optionsCallbackTuple = this.validateOptionsAndCallback(options, callback);
        options = optionsCallbackTuple.options;
        callback = optionsCallbackTuple.callback;

        var successCallback = function (err, result, responseHeaders) {
            if (err) return callback(err, undefined, responseHeaders);
            var bodies;
            if (query) {
                bodies = resultFn(result);
            }
            else {
                bodies = Base.map(resultFn(result), function (body) {
                    return createFn(that, body);
                });
            }

            callback(undefined, bodies, responseHeaders);
        };

        // Query operations will use ReadEndpoint even though it uses GET(for queryFeed) and POST(for regular query operations)
        this._globalEndpointManager.getReadEndpoint(function (readEndpoint) {

            var request = { "path": path, "operationType": Constants.OperationTypes.Query, "client": this, "endpointOverride": null };

            var initialHeaders = Base.extend({}, documentclient.defaultHeaders);
            initialHeaders = Base.extend(initialHeaders, options && options.initialHeaders);
            if (query === undefined) {
                var headersPromise = Base.getHeaders(documentclient, initialHeaders, "get", path, id, type, options, partitionKeyRangeId);
                headersPromise.then(function (headers) {
                    that.applySessionToken(path, headers);

                    documentclient.get(readEndpoint, request, headers, function (err, result, resHeaders) {
                        that.captureSessionToken(path, Constants.OperationTypes.Query, headers, resHeaders);
                        successCallback(err, result, resHeaders);
                    });
                });
            } else {
                initialHeaders[Constants.HttpHeaders.IsQuery] = "true";
                switch (that.queryCompatibilityMode) {
                    case AzureDocuments.QueryCompatibilityMode.SqlQuery:
                        initialHeaders[Constants.HttpHeaders.ContentType] = Constants.MediaTypes.SQL;
                        break;
                    case AzureDocuments.QueryCompatibilityMode.Query:
                    case AzureDocuments.QueryCompatibilityMode.Default:
                    default:
                        if (typeof query === "string") {
                            query = { query: query };  // Converts query text to query object.
                        }
                        initialHeaders[Constants.HttpHeaders.ContentType] = Constants.MediaTypes.QueryJson;
                        break;
                }

                var headersPromise = Base.getHeaders(documentclient, initialHeaders, "post", path, id, type, options, partitionKeyRangeId);
                headersPromise.then(function (headers) {
                    that.applySessionToken(path, headers);

                    documentclient.post(readEndpoint, request, query, headers, function (err, result, resHeaders) {
                        that.captureSessionToken(path, Constants.OperationTypes.Query, headers, resHeaders);
                        successCallback(err, result, resHeaders);
                    });
                });
            }
        });
    }

    /** @ignore */
    public isResourceValid(resource, err) {
        if (resource.id) {
            if (typeof resource.id !== "string") {
                err.message = "Id must be a string.";
                return false;
            }

            if (resource.id.indexOf("/") !== -1 || resource.id.indexOf("\\") !== -1 || resource.id.indexOf("?") !== -1 || resource.id.indexOf("#") !== -1) {
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

    /** @ignore */
    public resolveCollectionLinkForCreate(partitionResolver, document) {
        var validation = this.isPartitionResolverValid(partitionResolver);
        if (!validation.valid) {
            throw validation.error;
        }

        var partitionKey = partitionResolver.getPartitionKey(document);
        return partitionResolver.resolveForCreate(partitionKey);
    }

    /** @ignore */
    public isPartitionResolverValid(partionResolver) {
        if (partionResolver === null || partionResolver === undefined) {
            return {
                valid: false,
                error: new Error("The partition resolver is null or undefined")
            };
        }

        var validation = this.isPartitionResolveFunctionDefined(partionResolver, "getPartitionKey");
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

    /** @ignore */
    public isPartitionResolveFunctionDefined(partionResolver, functionName) {
        if (partionResolver === null || partionResolver === undefined) {
            return {
                valid: false,
                error: new Error("The partition resolver is null or undefined")
            };
        }

        if (typeof partionResolver[functionName] === "function") {
            return {
                valid: true
            };
        } else {
            return {
                valid: false,
                error: new Error(util.format("The partition resolver does not implement method %s. The type of %s is \"%s\"", functionName, functionName, typeof partionResolver[functionName]))
            };
        }
    }

    /** @ignore */
    public getIdFromLink(resourceLink, isNameBased) {
        if (isNameBased) {
            resourceLink = Base._trimSlashes(resourceLink);
            return resourceLink;
        } else {
            return Base.parseLink(resourceLink).objectBody.id.toLowerCase();
        }
    }

    /** @ignore */
    public getPathFromLink(resourceLink, resourceType, isNameBased) {
        if (isNameBased) {
            resourceLink = Base._trimSlashes(resourceLink);
            if (resourceType) {
                return "/" + encodeURI(resourceLink) + "/" + resourceType;
            } else {
                return "/" + encodeURI(resourceLink);
            }
        } else {
            if (resourceType) {
                return "/" + resourceLink + resourceType + "/";
            } else {
                return "/" + resourceLink;
            }
        }
    }

    /** @ignore */
    public setIsUpsertHeader(headers) {
        if (headers === undefined || headers === null) {
            throw new Error('The "headers" parameter must not be null or undefined');
        }

        if (!(headers instanceof Object)) {
            throw new Error(util.format('The "headers" parameter must be an instance of "Object". Actual type is: "%s".', typeof headers));
        }

        headers[Constants.HttpHeaders.IsUpsert] = true;
    }

    /** @ignore */
    public validateOptionsAndCallback(optionsIn, callbackIn) {
        var options, callback;

        // options
        if (optionsIn === undefined) {
            options = new Object();
        } else if (callbackIn === undefined && typeof optionsIn === 'function') {
            callback = optionsIn;
            options = new Object();
        } else if (typeof optionsIn !== 'object') {
            throw new Error(util.format('The "options" parameter must be of type "object". Actual type is: "%s".', typeof optionsIn));
        } else {
            options = optionsIn;
        }

        // callback
        if (callbackIn !== undefined && typeof callbackIn !== 'function') {
            throw new Error(util.format('The "callback" parameter must be of type "function". Actual type is: "%s".', typeof callbackIn));
        } else if (typeof callbackIn === 'function') {
            callback = callbackIn
        }

        return { options: options, callback: callback };
    }

    /** Gets the SessionToken for a given collectionLink
     * @memberof DocumentClient
     * @instance
     * @param collectionLink              - The link of the collection for which the session token is needed 
    */
    public getSessionToken(collectionLink) {
        if (!collectionLink)
            throw new Error("collectionLink cannot be null");

        var paths = Base.parseLink(collectionLink);

        if (paths == undefined)
            return "";

        var request = this.getSessionParams(collectionLink);
        return this.sessionContainer.resolveGlobalSessionToken(request);
    }

    public applySessionToken(path, reqHeaders) {
        var request = this.getSessionParams(path);

        if (reqHeaders && reqHeaders[Constants.HttpHeaders.SessionToken])
            return;

        var sessionConsistency = reqHeaders[Constants.HttpHeaders.ConsistencyLevel];
        if (!sessionConsistency)
            return;

        if (request['resourceAddress']) {
            var sessionToken = this.sessionContainer.resolveGlobalSessionToken(request);
            if (sessionToken != "")
                reqHeaders[Constants.HttpHeaders.SessionToken] = sessionToken;
        }
    }

    public captureSessionToken(path, opType, reqHeaders, resHeaders) {
        var request = this.getSessionParams(path);
        request['operationType'] = opType;
        this.sessionContainer.setSessionToken(request, reqHeaders, resHeaders);
    }

    public clearSessionToken(path) {
        var request = this.getSessionParams(path);
        this.sessionContainer.clearToken(request);
    }

    public getSessionParams(resourceLink) {
        var isNameBased = Base.isLinkNameBased(resourceLink);
        var resourceId = null;
        var resourceAddress = null;
        var parserOutput = Base.parseLink(resourceLink);
        if (isNameBased)
            resourceAddress = parserOutput.objectBody.self;
        else {
            resourceAddress = parserOutput.objectBody.id;
            resourceId = parserOutput.objectBody.id;
        }
        var resourceType = parserOutput.type;
        return { 'isNameBased': isNameBased, 'resourceId': resourceId, 'resourceAddress': resourceAddress, 'resourceType': resourceType };
    }
}
//SCRIPT END

/**
 * The request options
 * @typedef {Object} RequestOptions                          -         Options that can be specified for a requested issued to the Azure Cosmos DB servers.
 * @property {object} [accessCondition]                      -         Conditions Associated with the request.
 * @property {string} accessCondition.type                   -         Conditional HTTP method header type (IfMatch or IfNoneMatch).
 * @property {string} accessCondition.condition              -         Conditional HTTP method header value (the _etag field from the last version you read).
 * @property {string} [consistencyLevel]                     -         Consistency level required by the client.
 * @property {boolean} [disableRUPerMinuteUsage]             -         DisableRUPerMinuteUsage is used to enable/disable Request Units(RUs)/minute capacity to serve the request if regular provisioned RUs/second is exhausted.
 * @property {boolean} [enableScriptLogging]                 -         Enables or disables logging in JavaScript stored procedures.
 * @property {string} [indexingDirective]                    -         Specifies indexing directives (index, do not index .. etc).
 * @property {boolean} [offerEnableRUPerMinuteThroughput]    -         Represents Request Units(RU)/Minute throughput is enabled/disabled for a collection in the Azure Cosmos DB database service.
 * @property {number} [offerThroughput]                      -         The offer throughput provisioned for a collection in measurement of Requests-per-Unit in the Azure Cosmos DB database service.
 * @property {string} [offerType]                            -         Offer type when creating document collections.
 *                                                                     <p>This option is only valid when creating a document collection.</p>
 * @property {string} [partitionKey]                         -         Specifies a partition key definition for a particular path in the Azure Cosmos DB database service.
 * @property {boolean} [populateQuotaInfo]                   -         Enables/disables getting document collection quota related stats for document collection read requests.
 * @property {string} [postTriggerInclude]                   -         Indicates what is the post trigger to be invoked after the operation.
 * @property {string} [preTriggerInclude]                    -         Indicates what is the pre trigger to be invoked before the operation.
 * @property {number} [resourceTokenExpirySeconds]           -         Expiry time (in seconds) for resource token associated with permission (applicable only for requests on permissions).
 * @property {string} [sessionToken]                         -         Token for use with Session consistency.
 */

/**
 * The feed options
 * @typedef {Object} FeedOptions                    -       The feed options and query methods.
 * @property {string} [continuation]                -       Opaque token for continuing the enumeration.
 * @property {boolean} [disableRUPerMinuteUsage]    -       DisableRUPerMinuteUsage is used to enable/disable Request Units(RUs)/minute capacity to serve the request if regular provisioned RUs/second is exhausted.
 * @property {boolean} [enableCrossPartitionQuery]  -       A value indicating whether users are enabled to send more than one request to execute the query in the Azure Cosmos DB database service.
                                                            <p>More than one request is necessary if the query is not scoped to single partition key value.</p>
 * @property {boolean} [enableScanInQuery]          -       Allow scan on the queries which couldn't be served as indexing was opted out on the requested paths.
 * @property {number} [maxDegreeOfParallelism]      -       The maximum number of concurrent operations that run client side during parallel query execution in the Azure Cosmos DB database service. Negative values make the system automatically decides the number of concurrent operations to run.
 * @property {number} [maxItemCount]                -       Max number of items to be returned in the enumeration operation.
 * @property {string} [partitionKey]                -       Specifies a partition key definition for a particular path in the Azure Cosmos DB database service.
 * @property {string} [sessionToken]                -       Token for use with Session consistency.
 */

/**
* The media options
* @typedef {Object} MediaOptions                                          -         Options associated with upload media.
* @property {string} [slug]                                               -         HTTP Slug header value.
* @property {string} [contentType=application/octet-stream]               -         HTTP ContentType header value.
*
*/

/**
* The callback to execute after the request execution.
* @callback RequestCallback
* @param {object} error            -       Will contain error information if an error occurs, undefined otherwise.
* @param {number} error.code       -       The response code corresponding to the error.
* @param {string} error.body       -       A string represents the error information.
* @param {Object} resource         -       An object that represents the requested resource (Db, collection, document ... etc) if no error happens.
* @param {object} responseHeaders  -       An object that contain the response headers.
*/

/**
* The Indexing Policy represents the indexing policy configuration for a collection.
* @typedef {Object} IndexingPolicy
* @property {boolean} automatic                                           -         Specifies whether automatic indexing is enabled for a collection.
                                                                                   <p>In automatic indexing, documents can be explicitly excluded from indexing using {@link RequestOptions}.
                                                                                   In manual indexing, documents can be explicitly included. </p>
* @property {string} indexingMode                                         -         The indexing mode (consistent or lazy) {@link IndexingMode}.
* @property {Array} IncludedPaths                                         -         An array of {@link IncludedPath} represents the paths to be included for indexing.
* @property {Array} ExcludedPaths                                         -         An array of {@link ExcludedPath} represents the paths to be excluded from indexing.
*
*/

/**
* <p> Included path. <br>
* </p>
* @typedef {Object} IncludedPath
* @property {Array} Indexes                                               -         An array of {@link Indexes}.
* @property {string} Path                                                 -         Path to be indexed.
*
*/

/**
* <p> Index specification. <br>
* </p>
* @typedef {Object} Indexes
* @property {string} Kind                                                  -         The index kind {@link IndexKind}.
* @property {string} DataType                                              -         The data type {@link DataType}.
* @property {number} Precision                                             -         The precision.
*
*/

/**
* <p> Excluded path. <br>
* </p>
* @typedef {Object} ExcludedPath
* @property {string} Path                                                  -         Path to be indexed.
*
*/
