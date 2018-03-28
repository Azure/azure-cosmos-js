/**
 * Represents the Retry policy assocated with throttled requests in the Azure Cosmos DB database service.
 * @property {int} [MaxRetryAttemptCount] - Max number of retries to be performed for a request. Default value 9.
 * @property {int} [FixedRetryIntervalInMilliseconds] - Fixed retry interval in milliseconds to wait \
 *                        between each retry ignoring the retryAfter returned as part of the response.
 * @property {int} [MaxWaitTimeInSeconds] - Max wait time in seconds to wait for a request while \
 *                        the retries are happening. Default value 30 seconds.
 */
export class RetryOptions {
    public readonly FixedRetryIntervalInMilliseconds: number;
    public readonly MaxRetryAttemptCount: number;
    public readonly MaxWaitTimeInSeconds: number;

    constructor(maxRetryAttemptCount: number, fixedRetryIntervalInMilliseconds: number, maxWaitTimeInSeconds: number) {
        this.MaxRetryAttemptCount = maxRetryAttemptCount || 9;
        this.FixedRetryIntervalInMilliseconds = fixedRetryIntervalInMilliseconds;
        this.MaxWaitTimeInSeconds = maxWaitTimeInSeconds || 30;
    }
}
