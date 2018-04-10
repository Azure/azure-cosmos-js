/// <reference types="node" />
import * as url from "url";
import { GlobalEndpointManager } from "../globalEndpointManager";
export declare class SessionReadRetryPolicy {
    private globalEndpointManager;
    private request;
    static readonly maxRetryAttemptCount: number;
    static readonly retryAfterInMilliseconds: number;
    static readonly NOT_FOUND_STATUS_CODE: number;
    static readonly READ_SESSION_NOT_AVAILABLE_SUB_STATUS_CODE: number;
    currentRetryAttemptCount: number;
    retryAfterInMilliseconds: number;
    private maxRetryAttemptCount;
    constructor(globalEndpointManager: GlobalEndpointManager, request: any);
    shouldRetry(err: any): Promise<boolean | [boolean, url.UrlWithStringQuery]>;
}
