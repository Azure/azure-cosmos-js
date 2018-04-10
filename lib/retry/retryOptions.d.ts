export declare class RetryOptions {
    readonly MaxRetryAttemptCount: number;
    readonly FixedRetryIntervalInMilliseconds: number;
    readonly MaxWaitTimeInSeconds: number;
    constructor(MaxRetryAttemptCount?: number, FixedRetryIntervalInMilliseconds?: number, MaxWaitTimeInSeconds?: number);
}
