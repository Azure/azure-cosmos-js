/// <reference types="node" />
import { Agent } from "http";
import { ResponseCallback } from "./base";
import { RequestOptions } from "./documentclient";
import { ConnectionPolicy, ConsistencyLevel, DatabaseAccount, QueryCompatibilityMode } from "./documents";
import { GlobalEndpointManager } from "./globalEndpointManager";
import { IHeaders } from "./queryExecutionContext";
import { Response } from "./request";
import { SessionContainer } from "./sessionContainer";
export declare abstract class DocumentClientBase {
    urlConnection: string;
    masterKey: string;
    resourceTokens: {
        [key: string]: string;
    };
    tokenProvider: any;
    connectionPolicy: ConnectionPolicy;
    consistencyLevel: ConsistencyLevel;
    defaultHeaders: IHeaders;
    defaultUrlParams: string;
    queryCompatibilityMode: QueryCompatibilityMode;
    partitionResolvers: any;
    partitionKeyDefinitionCache: any;
    protected _globalEndpointManager: GlobalEndpointManager;
    sessionContainer: SessionContainer;
    requestAgent: Agent;
    constructor(urlConnection: string, auth: any, connectionPolicy: ConnectionPolicy, consistencyLevel: ConsistencyLevel);
    getDatabaseAccount(options: RequestOptions, callback?: ResponseCallback<DatabaseAccount>): Promise<Response<DatabaseAccount>>;
    validateOptionsAndCallback(optionsIn: any, callbackIn: any): {
        options: any;
        callback: any;
    };
    get(urlString: string, request: any, headers: IHeaders): Promise<Response<any>>;
    post(urlString: string, request: any, body: any, headers: IHeaders): Promise<Response<any>>;
    put(urlString: string, request: any, body: any, headers: IHeaders): Promise<Response<any>>;
    head(urlString: string, request: any, headers: IHeaders): Promise<Response<any>>;
    delete(urlString: string, request: any, headers: IHeaders): Promise<Response<any>>;
}
