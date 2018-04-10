/// <reference types="node" />
import { Agent } from "http";
import { RequestOptions } from "https";
import { Stream } from "stream";
import { ConnectionPolicy } from "./documents";
import { GlobalEndpointManager } from "./globalEndpointManager";
import { IHeaders } from "./queryExecutionContext";
export interface Response<T> {
    headers?: IHeaders;
    result?: T;
}
export declare class RequestHandler {
    static createRequestObjectStub(connectionPolicy: ConnectionPolicy, requestOptions: RequestOptions): Promise<Response<any>>;
    static request(globalEndpointManager: GlobalEndpointManager, connectionPolicy: ConnectionPolicy, requestAgent: Agent, method: string, hostname: string, request: string | {
        path: string;
    }, data: string | Buffer | Stream, queryParams: any, headers: IHeaders): Promise<Response<any>>;
}
