/// <reference types="node" />
import { WriteStream } from "fs";
import { RequestOptions } from "https";
import { Stream } from "stream";
import * as url from "url";
import { EndpointDiscoveryRetryPolicy, ResourceThrottleRetryPolicy, SessionReadRetryPolicy } from ".";
import { ConnectionPolicy } from "../documents";
import { GlobalEndpointManager } from "../globalEndpointManager";
import { Response } from "../request";
export interface Body {
    buffer?: Buffer;
    stream?: Stream;
}
export declare type CreateRequestObjectStubFunction = (connectionPolicy: ConnectionPolicy, requestOptions: RequestOptions) => WriteStream | Promise<Response<any>>;
export declare class RetryUtility {
    static execute(globalEndpointManager: GlobalEndpointManager, body: Body, createRequestObjectFunc: CreateRequestObjectStubFunction, connectionPolicy: ConnectionPolicy, requestOptions: RequestOptions, request: any): Promise<Response<any>>;
    static apply(body: Body, createRequestObjectFunc: CreateRequestObjectStubFunction, connectionPolicy: ConnectionPolicy, requestOptions: RequestOptions, endpointDiscoveryRetryPolicy: EndpointDiscoveryRetryPolicy, resourceThrottleRetryPolicy: ResourceThrottleRetryPolicy, sessionReadRetryPolicy: SessionReadRetryPolicy): Promise<Response<any>>;
    static modifyRequestOptions(oldRequestOptions: RequestOptions | any, newUrl: url.UrlWithStringQuery | any): any;
}
