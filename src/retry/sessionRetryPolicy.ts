import * as url from "url";
import { Constants } from "../common";
import { GlobalEndpointManager } from "../globalEndpointManager";
import { ErrorResponse } from "../request/request";

/**
 * This class implements the retry policy for session consistent reads.
 * @hidden
 */
export class SessionReadRetryPolicy {
  /** Max number of retry attempts to perform. */
  public static readonly maxRetryAttemptCount = 1;
  /** Retry interval in milliseconds. */
  public static readonly retryAfterInMilliseconds = 0;
  /** Current retry attempt count. */
  public currentRetryAttemptCount = 0;
  public retryAfterInMilliseconds = SessionReadRetryPolicy.retryAfterInMilliseconds;
  private maxRetryAttemptCount = SessionReadRetryPolicy.maxRetryAttemptCount;

  /**
   * @constructor SessionReadRetryPolicy
   * @param {object} globalEndpointManager                           - The GlobalEndpointManager instance.
   * @property {object} request                                      - The Http request information
   */
  constructor(private globalEndpointManager: GlobalEndpointManager, private request: any) {} // TODO: any request

  /**
   * Determines whether the request should be retried or not.
   * @param {object} err - Error returned by the request.
   * @param {function} callback - The callback function which takes bool argument which specifies whether the request\
   * will be retried or not.
   */
  public async shouldRetry(err: ErrorResponse): Promise<boolean | [boolean, url.UrlWithStringQuery]> {
    if (err) {
      if (
        this.currentRetryAttemptCount <= this.maxRetryAttemptCount &&
        (this.request.operationType === Constants.OperationTypes.Read ||
          this.request.operationType === Constants.OperationTypes.Query)
      ) {
        const readEndpoint = await this.globalEndpointManager.getReadEndpoint();
        const hubEndpoint = await this.globalEndpointManager.getHubEndpoint();
        // TODO: get the hub region instead of using writeEndpoint
        if (readEndpoint !== hubEndpoint && this.request.endpointOverride == null) {
          this.currentRetryAttemptCount++;
          // TODO: tracing
          // console.log("Read with session token not available in read region.\
          // Trying read from hub region.");
          this.request.endpointOverride = hubEndpoint;
          const newUrl = url.parse(hubEndpoint);
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
