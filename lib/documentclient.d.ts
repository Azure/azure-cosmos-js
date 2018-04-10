import { ResponseCallback } from "./base";
import { DocumentClientBase } from "./DocumentClientBase";
import { ConnectionPolicy, ConsistencyLevel, Document } from "./documents";
import { IHeaders, SqlQuerySpec } from "./queryExecutionContext";
import { QueryIterator } from "./queryIterator";
import { Response } from "./request";
export declare class DocumentClient extends DocumentClientBase {
    urlConnection: string;
    constructor(urlConnection: string, auth: any, connectionPolicy: ConnectionPolicy, consistencyLevel: ConsistencyLevel);
    getWriteEndpoint(callback?: (writeEndPoint: string) => void): Promise<string>;
    getReadEndpoint(callback?: (readEndPoint: string) => void): void | Promise<string>;
    createDatabase(body: object, options: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    createCollection(databaseLink: string, body: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    createDocument(documentsFeedOrDatabaseLink: string, body: any, options?: RequestOptions, callback?: ResponseCallback<Document>): Promise<Response<Document>>;
    createAttachment(documentLink: string, body: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    createUser(databaseLink: string, body: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    createPermission(userLink: string, body: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    createTrigger(collectionLink: string, trigger: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    createUserDefinedFunction(collectionLink: string, udf: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    createStoredProcedure(collectionLink: string, sproc: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    createAttachmentAndUploadMedia(documentLink: string, readableStream: ReadableStream, options?: MediaOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readDatabase(databaseLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readCollection(collectionLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readDocument(documentLink: string, options?: RequestOptions, callback?: ResponseCallback<Document>): Promise<Response<Document>>;
    readAttachment(attachmentLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readUser(userLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readPermission(permissionLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readTrigger(triggerLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readUserDefinedFunction(udfLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readStoredProcedure(sprocLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readConflict(conflictLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readDatabases(options?: FeedOptions): Promise<QueryIterator>;
    readCollections(databaseLink: string, options?: FeedOptions): QueryIterator;
    readDocuments(collectionLink: string, options?: FeedOptions): QueryIterator;
    readPartitionKeyRanges(collectionLink: string, options?: FeedOptions): QueryIterator;
    readAttachments(documentLink: string, options?: FeedOptions): QueryIterator;
    readUsers(databaseLink: string, options?: FeedOptions): QueryIterator;
    readPermissions(userLink: string, options?: FeedOptions): QueryIterator;
    readTriggers(collectionLink: string, options?: FeedOptions): QueryIterator;
    readUserDefinedFunctions(collectionLink: string, options?: FeedOptions): QueryIterator;
    readStoredProcedures(collectionLink: string, options?: FeedOptions): QueryIterator;
    readConflicts(collectionLink: string, options?: FeedOptions): QueryIterator;
    private processQueryFeedResponse(res, isQuery, result, create);
    queryFeed(documentclient: DocumentClient, path: string, type: string, id: string, resultFn: (result: any) => any, createFn: (parent: DocumentClient, body: any) => any, query: SqlQuerySpec | string, options: FeedOptions, partitionKeyRangeId?: string): Promise<Response<any>>;
    queryDatabases(query: SqlQuerySpec | string, options?: FeedOptions): QueryIterator;
    queryCollections(databaseLink: string, query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    queryDocuments(documentsFeedOrDatabaseLink: string, query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    queryPartitionKeyRanges(collectionLink: string, query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    queryAttachments(documentLink: string, query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    queryUsers(databaseLink: string, query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    queryPermissions(userLink: string, query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    queryTriggers(collectionLink: string, query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    queryUserDefinedFunctions(collectionLink: string, query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    queryStoredProcedures(collectionLink: string, query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    queryConflicts(collectionLink: string, query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    deleteDatabase(databaseLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    deleteCollection(collectionLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    deleteDocument(documentLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    deleteAttachment(attachmentLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    deleteUser(userLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    deletePermission(permissionLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    deleteTrigger(triggerLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    deleteUserDefinedFunction(udfLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    deleteStoredProcedure(sprocLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    deleteConflict(conflictLink: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    replaceCollection(collectionLink: string, collection: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    replaceDocument(documentLink: string, newDocument: string, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<void>;
    replaceAttachment(attachmentLink: string, attachment: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    replaceUser(userLink: string, user: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    replacePermission(permissionLink: string, permission: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    replaceTrigger(triggerLink: string, trigger: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    replaceUserDefinedFunction(udfLink: string, udf: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    replaceStoredProcedure(sprocLink: string, sproc: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    upsertDocument(documentsFeedOrDatabaseLink: string, body: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    upsertAttachment(documentLink: string, body: any, options?: RequestOptions, callback?: ResponseCallback<any>): void;
    upsertUser(databaseLink: string, body: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    upsertPermission(userLink: string, body: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    upsertTrigger(collectionLink: string, trigger: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    upsertUserDefinedFunction(collectionLink: string, udf: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    upsertStoredProcedure(collectionLink: string, sproc: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    upsertAttachmentAndUploadMedia(documentLink: string, readableStream: ReadableStream, options?: MediaOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readMedia(mediaLink: string, callback?: ResponseCallback<any>): Promise<Response<any>>;
    updateMedia(mediaLink: string, readableStream: ReadableStream, options?: MediaOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    executeStoredProcedure(sprocLink: string, params?: string[], options?: RequestOptions, callback?: ResponseCallback<any>): Promise<void>;
    replaceOffer(offerLink: string, offer: any, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readOffer(offerLink: string, callback?: ResponseCallback<any>): Promise<Response<any>>;
    readOffers(options?: FeedOptions): QueryIterator;
    queryOffers(query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    createDocumentPrivate(collectionLink: string, body: any, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    private upsertDocumentPrivate(collectionLink, body, options?, callback?);
    queryDocumentsPrivate(collectionLinks: string[], query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator;
    create<T>(body: T, path: string, type: string, id: string, initialHeaders: IHeaders, options?: RequestOptions, callback?: ResponseCallback<T>): Promise<Response<T>>;
    upsert<T>(body: T, path: string, type: string, id: string, initialHeaders: IHeaders, options?: RequestOptions, callback?: ResponseCallback<T>): Promise<Response<T>>;
    replace<T>(resource: string, path: string, type: string, id: string, initialHeaders: IHeaders, options?: RequestOptions, callback?: ResponseCallback<T>): Promise<Response<T>>;
    read<T>(path: string, type: string, id: string, initialHeaders: IHeaders, options?: RequestOptions): Promise<Response<T>>;
    deleteResource(path: string, type: string, id: string, initialHeaders: IHeaders, options?: RequestOptions, callback?: ResponseCallback<any>): Promise<Response<any>>;
    getPartitionKeyDefinition(collectionLink: string, callback?: ResponseCallback<any>): Promise<Response<any>>;
    extractPartitionKey(document: any, partitionKeyDefinition: any): any;
    private isResourceValid(resource, err);
    resolveCollectionLinkForCreate(partitionResolver: any, document: Document): any;
    isPartitionResolverValid(partionResolver: any): {
        valid: boolean;
        error?: undefined;
    } | {
        valid: boolean;
        error: Error;
    };
    isPartitionResolveFunctionDefined(partionResolver: any, functionName: string): {
        valid: boolean;
        error: Error;
    } | {
        valid: boolean;
        error?: undefined;
    };
    getIdFromLink(resourceLink: string, isNameBased: boolean): string;
    getPathFromLink(resourceLink: string, resourceType: string, isNameBased: boolean): string;
    setIsUpsertHeader(headers: IHeaders): void;
    getSessionToken(collectionLink: string): string;
    applySessionToken(path: string, reqHeaders: IHeaders): void;
    captureSessionToken(path: string, opType: string, reqHeaders: IHeaders, resHeaders: IHeaders): void;
    clearSessionToken(path: string): void;
    getSessionParams(resourceLink: string): {
        isNameBased: boolean;
        resourceId: string;
        resourceAddress: string;
        resourceType: string;
    };
}
export interface RequestOptions {
    accessCondition?: {
        type: string;
        condition: string;
    };
    consistencyLevel?: string;
    disableRUPerMinuteUsage?: boolean;
    enableScriptLogging?: boolean;
    indexingDirective?: string;
    offerEnableRUPerMinuteThroughput?: boolean;
    offerThroughput?: number;
    offerType?: string;
    partitionKey?: string;
    populateQuotaInfo?: boolean;
    postTriggerInclude?: string | string[];
    preTriggerInclude?: string | string[];
    resourceTokenExpirySeconds?: number;
    sessionToken?: string;
    initialHeaders?: IHeaders;
    urlConnection?: string;
    skipGetPartitionKeyDefinition?: boolean;
    disableAutomaticIdGeneration?: boolean;
}
export interface FeedOptions {
    continuation?: string;
    disableRUPerMinuteUsage?: boolean;
    enableCrossPartitionQuery?: boolean;
    enableScanInQuery?: boolean;
    maxDegreeOfParallelism?: number;
    maxItemCount?: number;
    partitionKey?: string;
    sessionToken?: string;
    initialHeaders?: IHeaders;
}
export interface MediaOptions {
    initialHeaders?: IHeaders;
    slug?: string;
    contentType?: string;
}
export interface RequestCallback {
    error?: RequestError;
    resource: any;
    responseHeaders?: IHeaders;
}
export interface RequestError {
    code?: number;
    body: string;
    headers?: IHeaders;
}
export interface Options {
    accessCondition?: {
        type: string;
        condition: string;
    };
    consistencyLevel?: string;
    enableScriptLogging?: boolean;
    indexingDirective?: string;
    offerEnableRUPerMinuteThroughput?: boolean;
    offerThroughput?: number;
    offerType?: string;
    populateQuotaInfo?: boolean;
    postTriggerInclude?: string | string[];
    preTriggerInclude?: string | string[];
    resourceTokenExpirySeconds?: number;
    continuation?: string;
    disableRUPerMinuteUsage?: boolean;
    enableCrossPartitionQuery?: boolean;
    enableScanInQuery?: boolean;
    maxDegreeOfParallelism?: number;
    maxItemCount?: number;
    partitionKey?: string;
    sessionToken?: string;
    slug?: string;
    contentType?: string;
    a_im?: string;
}
