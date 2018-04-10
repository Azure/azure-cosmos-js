export declare class ResourceThrottleRetryPolicy {
    private maxRetryAttemptCount;
    private fixedRetryIntervalInMilliseconds;
    static readonly THROTTLE_STATUS_CODE: number;
    currentRetryAttemptCount: number;
    cummulativeWaitTimeinMilliseconds: number;
    retryAfterInMilliseconds: number;
    private maxWaitTimeInMilliseconds;
    constructor(maxRetryAttemptCount: number, fixedRetryIntervalInMilliseconds: number, maxWaitTimeInSeconds: number);
    shouldRetry(err: any): Promise<boolean>;
}
