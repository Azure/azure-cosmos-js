﻿import { StatusCodes } from "../common";
import { ErrorResponse } from "../request/request";

/**
 * This class implements the resource throttle retry policy for requests.
 * @property {int} _maxRetryAttemptCount              - Max number of retries to be performed for a request.
 * @property {int} _fixedRetryIntervalInMilliseconds  - Fixed retry interval in milliseconds to wait between each \
 * retry ignoring the retryAfter returned as part of the response.
 * @property {int} _maxWaitTimeInMilliseconds         - Max wait time in milliseconds to wait for a request while \
 * the retries are happening.
 * @property {int} currentRetryAttemptCount           - Current retry attempt count.
 * @property {int} cummulativeWaitTimeinMilliseconds  - Cummulative wait time in milliseconds for a request while \
 * the retries are happening.
 */
export class ResourceThrottleRetryPolicy {
    public currentRetryAttemptCount: number = 0;
    public cummulativeWaitTimeinMilliseconds: number = 0;
    public retryAfterInMilliseconds: number = 0;

    private maxWaitTimeInMilliseconds: number;
    /**
     * @constructor ResourceThrottleRetryPolicy
     * @param {int} maxRetryAttemptCount               - Max number of retries to be performed for a request.
     * @param {int} fixedRetryIntervalInMilliseconds   - Fixed retry interval in milliseconds to wait between each \
     * retry ignoring the retryAfter returned as part of the response.
     * @param {int} maxWaitTimeInSeconds               - Max wait time in seconds to wait for a request while the \
     * retries are happening.
     */
    constructor(
        private maxRetryAttemptCount: number,
        private fixedRetryIntervalInMilliseconds: number,
        maxWaitTimeInSeconds: number) {
        this.maxWaitTimeInMilliseconds = maxWaitTimeInSeconds * 1000;
        this.currentRetryAttemptCount = 0;
        this.cummulativeWaitTimeinMilliseconds = 0;
    }
    /**
     * Determines whether the request should be retried or not.
     * @param {object} err - Error returned by the request.
     */
    public async shouldRetry(err: ErrorResponse): Promise<boolean> { // TODO: any custom error object
        if (err) {
            if (this.currentRetryAttemptCount < this.maxRetryAttemptCount) {
                this.currentRetryAttemptCount++;
                this.retryAfterInMilliseconds = 0;

                if (this.fixedRetryIntervalInMilliseconds) {
                    this.retryAfterInMilliseconds = this.fixedRetryIntervalInMilliseconds;
                } else if (err.retryAfterInMilliseconds) {
                    this.retryAfterInMilliseconds = err.retryAfterInMilliseconds;
                }

                if (this.cummulativeWaitTimeinMilliseconds < this.maxWaitTimeInMilliseconds) {
                    this.cummulativeWaitTimeinMilliseconds += this.retryAfterInMilliseconds;
                    return true;
                }
            }
        }
        return false;
    }
}
