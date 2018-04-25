﻿import * as url from "url";
import { Constants, StatusCodes, SubStatusCodes } from "../common";
import { GlobalEndpointManager } from "../globalEndpointManager";
import { ErrorResponse } from "../request";

/**
 * This class implements the retry policy for session consistent reads.
 * @property {int} _maxRetryAttemptCount                           - Max number of retry attempts to perform.
 * @property {int} currentRetryAttemptCount                        - Current retry attempt count.
 * @property {object} globalEndpointManager                        - The GlobalEndpointManager instance.
 * @property {object} request                                      - The Http request information
 * @property {int} retryAfterInMilliseconds                        - Retry interval in milliseconds.
 */
export class SessionReadRetryPolicy {

    public static readonly maxRetryAttemptCount = 1;
    public static readonly retryAfterInMilliseconds = 0;
    public static readonly NOT_FOUND_STATUS_CODE = StatusCodes.NotFound;
    public static readonly READ_SESSION_NOT_AVAILABLE_SUB_STATUS_CODE = SubStatusCodes.PartitionKeyRangeGone;
    public currentRetryAttemptCount = 0;
    public retryAfterInMilliseconds = SessionReadRetryPolicy.retryAfterInMilliseconds;
    private maxRetryAttemptCount = SessionReadRetryPolicy.maxRetryAttemptCount;

    /**
     * @constructor SessionReadRetryPolicy
     * @param {object} globalEndpointManager                           - The GlobalEndpointManager instance.
     * @property {object} request                                      - The Http request information
     */
    constructor(private globalEndpointManager: GlobalEndpointManager, private request: any) { } // TODO: any request

    /**
     * Determines whether the request should be retried or not.
     * @param {object} err - Error returned by the request.
     * @param {function} callback - The callback function which takes bool argument which specifies whether the request\
     * will be retried or not.
     */
    public async shouldRetry(err: ErrorResponse):
        Promise<boolean | [boolean, url.UrlWithStringQuery]> { // TODO: any custom error
        if (err) {
            if (this.currentRetryAttemptCount <= this.maxRetryAttemptCount
                && (this.request.operationType === Constants.OperationTypes.Read ||
                    this.request.operationType === Constants.OperationTypes.Query)) {
                const readEndpoint = await this.globalEndpointManager.getReadEndpoint();
                const writeEndpoint = await this.globalEndpointManager.getWriteEndpoint();
                if (readEndpoint !== writeEndpoint && this.request.endpointOverride == null) {
                    this.currentRetryAttemptCount++;
                    // TODO: tracing
                    // console.log("Read with session token not available in read region.\
                    // Trying read from write region.");
                    this.request.endpointOverride = writeEndpoint;
                    const newUrl = url.parse(writeEndpoint);
                    return [true, newUrl];
                } else {
                    // TODO: tracing
                    // console.log("Clear the the token for named base request");
                    this.request.client.clearSessionToken(this.request.path);
                    return false;
                }
            }
        }
        return false;
    }
}
