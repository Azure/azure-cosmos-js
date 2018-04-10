import { GlobalEndpointManager } from "../globalEndpointManager";
export declare class EndpointDiscoveryRetryPolicy {
    private globalEndpointManager;
    currentRetryAttemptCount: number;
    retryAfterInMilliseconds: number;
    private maxRetryAttemptCount;
    private static readonly maxRetryAttemptCount;
    private static readonly retryAfterInMilliseconds;
    static readonly FORBIDDEN_STATUS_CODE: number;
    static readonly WRITE_FORBIDDEN_SUB_STATUS_CODE: number;
    constructor(globalEndpointManager: GlobalEndpointManager);
    shouldRetry(err: Error): Promise<boolean>;
}
