/**
 * Represents the Retry policy assocated with throttled requests in the Azure Cosmos DB database service.
 */
export interface RetryOptions {
  /** Max number of retries to be performed for a request. Default value 9. */
  MaxRetryAttemptCount: number;
  /** Fixed retry interval in milliseconds to wait between each retry ignoring the retryAfter returned as part of the response. */
  FixedRetryIntervalInMilliseconds: number;
  /** Max wait time in seconds to wait for a request while the retries are happening. Default value 30 seconds. */
  MaxWaitTimeInSeconds: number;
}

export const defaultRetryOptions = Object.freeze({
  MaxRetryAttemptCount: 9,
  FixedRetryIntervalInMilliseconds: 0,
  MaxWaitTimeInSeconds: 30
});
