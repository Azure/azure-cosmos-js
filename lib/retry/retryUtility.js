"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const common_1 = require("../common");
class RetryUtility {
    static execute(globalEndpointManager, body, createRequestObjectFunc, connectionPolicy, requestOptions, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = typeof request !== "string" ? request
                : { path: "", operationType: "nonReadOps", client: null };
            const endpointDiscoveryRetryPolicy = new _1.EndpointDiscoveryRetryPolicy(globalEndpointManager);
            const resourceThrottleRetryPolicy = new _1.ResourceThrottleRetryPolicy(connectionPolicy.RetryOptions.MaxRetryAttemptCount, connectionPolicy.RetryOptions.FixedRetryIntervalInMilliseconds, connectionPolicy.RetryOptions.MaxWaitTimeInSeconds);
            const sessionReadRetryPolicy = new _1.SessionReadRetryPolicy(globalEndpointManager, r);
            return this.apply(body, createRequestObjectFunc, connectionPolicy, requestOptions, endpointDiscoveryRetryPolicy, resourceThrottleRetryPolicy, sessionReadRetryPolicy);
        });
    }
    static apply(body, createRequestObjectFunc, connectionPolicy, requestOptions, endpointDiscoveryRetryPolicy, resourceThrottleRetryPolicy, sessionReadRetryPolicy) {
        return __awaiter(this, void 0, void 0, function* () {
            const httpsRequest = createRequestObjectFunc(connectionPolicy, requestOptions);
            if (httpsRequest) {
                if (httpsRequest.then) {
                    try {
                        const { result, headers } = yield httpsRequest;
                        headers[common_1.Constants.ThrottleRetryCount] = resourceThrottleRetryPolicy.currentRetryAttemptCount;
                        headers[common_1.Constants.ThrottleRetryWaitTimeInMs] =
                            resourceThrottleRetryPolicy.cummulativeWaitTimeinMilliseconds;
                        return { result, headers };
                    }
                    catch (err) {
                        let retryPolicy = null;
                        const headers = err.headers || {};
                        if (err.code === _1.EndpointDiscoveryRetryPolicy.FORBIDDEN_STATUS_CODE
                            && err.substatus === _1.EndpointDiscoveryRetryPolicy.WRITE_FORBIDDEN_SUB_STATUS_CODE) {
                            retryPolicy = endpointDiscoveryRetryPolicy;
                        }
                        else if (err.code === _1.ResourceThrottleRetryPolicy.THROTTLE_STATUS_CODE) {
                            retryPolicy = resourceThrottleRetryPolicy;
                        }
                        else if (err.code === _1.SessionReadRetryPolicy.NOT_FOUND_STATUS_CODE
                            && err.substatus === _1.SessionReadRetryPolicy.READ_SESSION_NOT_AVAILABLE_SUB_STATUS_CODE) {
                            retryPolicy = sessionReadRetryPolicy;
                        }
                        if (retryPolicy) {
                            retryPolicy.shouldRetry(err, (shouldRetry, newUrl) => {
                                if (!shouldRetry) {
                                    headers[common_1.Constants.ThrottleRetryCount] =
                                        resourceThrottleRetryPolicy.currentRetryAttemptCount;
                                    headers[common_1.Constants.ThrottleRetryWaitTimeInMs] =
                                        resourceThrottleRetryPolicy.cummulativeWaitTimeinMilliseconds;
                                    return { result: err.response, headers };
                                }
                                else {
                                    return new Promise((resolve, reject) => {
                                        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                            if (typeof newUrl !== "undefined") {
                                                requestOptions = this.modifyRequestOptions(requestOptions, newUrl);
                                            }
                                            resolve(yield this.apply(body, createRequestObjectFunc, connectionPolicy, requestOptions, endpointDiscoveryRetryPolicy, resourceThrottleRetryPolicy, sessionReadRetryPolicy));
                                        }), retryPolicy.retryAfterInMilliseconds);
                                    });
                                }
                            });
                            return;
                        }
                    }
                }
            }
            else if (body["stream"] !== null) {
                body["stream"].pipe(httpsRequest);
            }
            else if (body["buffer"] !== null) {
                httpsRequest.write(body["buffer"]);
                httpsRequest.end();
            }
            else {
                httpsRequest.end();
            }
        });
    }
    static modifyRequestOptions(oldRequestOptions, newUrl) {
        const properties = Object.keys(newUrl);
        for (const index in properties) {
            if (properties[index] !== "path") {
                oldRequestOptions[properties[index]] = newUrl[properties[index]];
            }
        }
        return oldRequestOptions;
    }
}
exports.RetryUtility = RetryUtility;
//# sourceMappingURL=retryUtility.js.map