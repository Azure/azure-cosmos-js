﻿import { WriteStream } from "fs";
import { RequestOptions } from "https";
import { Stream } from "stream";
import * as url from "url";
import { EndpointDiscoveryRetryPolicy, ResourceThrottleRetryPolicy, SessionReadRetryPolicy } from ".";
import { Constants } from "../common";
import { ConnectionPolicy } from "../documents";
import { GlobalEndpointManager } from "../globalEndpointManager";
import { IHeaders } from "../queryExecutionContext";

export interface Body {
    buffer?: Buffer;
    stream?: Stream;
}

export type CreateRequestObjectStubFunction =
    (connectionPolicy: ConnectionPolicy, requestOptions: RequestOptions)
        => WriteStream | Promise<[any, IHeaders]>; // TODO: any response

export class RetryUtility {
    /**
     * Executes the retry policy for the created request object.
     * @param {object} globalEndpointManager - an instance of GlobalEndpointManager class.
     * @param {object} body - a dictionary containing 'buffer' and 'stream' keys to hold corresponding buffer or\
     *  stream body, null otherwise.
     * @param {function} createRequestObjectStub - stub function that creates the request object.
     * @param {object} connectionPolicy - an instance of ConnectionPolicy that has the connection configs.
     * @param {RequestOptions} requestOptions - The request options.
     * @param {function} callback - the callback that will be called when the request is finished executing.
     */
    public static async execute(
        globalEndpointManager: GlobalEndpointManager,
        body: Body,
        createRequestObjectFunc: CreateRequestObjectStubFunction,
        connectionPolicy: ConnectionPolicy,
        requestOptions: RequestOptions,
        request: any) { // TODO: any request
        const r = typeof request !== "string" ? request
            : { path: "", operationType: "nonReadOps", client: null };

        const endpointDiscoveryRetryPolicy = new EndpointDiscoveryRetryPolicy(globalEndpointManager);
        const resourceThrottleRetryPolicy =
            new ResourceThrottleRetryPolicy(connectionPolicy.RetryOptions.MaxRetryAttemptCount,
                connectionPolicy.RetryOptions.FixedRetryIntervalInMilliseconds,
                connectionPolicy.RetryOptions.MaxWaitTimeInSeconds);
        const sessionReadRetryPolicy = new SessionReadRetryPolicy(globalEndpointManager, r);

        return this.apply(
            body,
            createRequestObjectFunc,
            connectionPolicy,
            requestOptions,
            endpointDiscoveryRetryPolicy,
            resourceThrottleRetryPolicy,
            sessionReadRetryPolicy);
    }

    /**
     * Applies the retry policy for the created request object.
     * @param {object} body - a dictionary containing 'buffer' and 'stream' keys to hold corresponding buffer or \
     * stream body, null otherwise.
     * @param {function} createRequestObjectFunc - function that creates the request object.
     * @param {object} connectionPolicy - an instance of ConnectionPolicy that has the connection configs.
     * @param {RequestOptions} requestOptions - The request options.
     * @param {EndpointDiscoveryRetryPolicy} endpointDiscoveryRetryPolicy - The endpoint discovery retry policy \
     * instance.
     * @param {ResourceThrottleRetryPolicy} resourceThrottleRetryPolicy - The resource throttle retry policy instance.
     * @param {function} callback - the callback that will be called when the response is retrieved and processed.
     */
    public static async apply(
        body: Body,
        createRequestObjectFunc: CreateRequestObjectStubFunction,
        connectionPolicy: ConnectionPolicy,
        requestOptions: RequestOptions,
        endpointDiscoveryRetryPolicy: EndpointDiscoveryRetryPolicy,
        resourceThrottleRetryPolicy: ResourceThrottleRetryPolicy,
        sessionReadRetryPolicy: SessionReadRetryPolicy): Promise<[any, IHeaders]> { // TODO: any response
        const httpsRequest = createRequestObjectFunc(connectionPolicy, requestOptions);

        if (httpsRequest) {
            if ((httpsRequest as Promise<[any, IHeaders]>).then) {
                try {
                    const [response, headers] = await (httpsRequest as Promise<[any, IHeaders]>);
                    headers[Constants.ThrottleRetryCount] = resourceThrottleRetryPolicy.currentRetryAttemptCount;
                    headers[Constants.ThrottleRetryWaitTimeInMs] =
                        resourceThrottleRetryPolicy.cummulativeWaitTimeinMilliseconds;
                    return [response, headers];
                } catch (err) { // TODO: any error
                    let retryPolicy: any = null; // TODO: any Need an interface
                    const headers = err.headers || {};
                    if (err.code === EndpointDiscoveryRetryPolicy.FORBIDDEN_STATUS_CODE
                        && err.substatus === EndpointDiscoveryRetryPolicy.WRITE_FORBIDDEN_SUB_STATUS_CODE) {
                        retryPolicy = endpointDiscoveryRetryPolicy;
                    } else if (err.code === ResourceThrottleRetryPolicy.THROTTLE_STATUS_CODE) {
                        retryPolicy = resourceThrottleRetryPolicy;
                    } else if (err.code === SessionReadRetryPolicy.NOT_FOUND_STATUS_CODE
                        && err.substatus === SessionReadRetryPolicy.READ_SESSION_NOT_AVAILABLE_SUB_STATUS_CODE) {
                        retryPolicy = sessionReadRetryPolicy;
                    }
                    if (retryPolicy) {
                        retryPolicy.shouldRetry(err, (shouldRetry: boolean, newUrl: url.UrlWithStringQuery) => {
                            if (!shouldRetry) {
                                headers[Constants.ThrottleRetryCount] =
                                    resourceThrottleRetryPolicy.currentRetryAttemptCount;
                                headers[Constants.ThrottleRetryWaitTimeInMs] =
                                    resourceThrottleRetryPolicy.cummulativeWaitTimeinMilliseconds;
                                return [err.response, headers];
                            } else {
                                return new Promise<[any, IHeaders]>((resolve, reject) => {
                                    setTimeout(async () => {
                                        if (typeof newUrl !== "undefined") {
                                            requestOptions = this.modifyRequestOptions(requestOptions, newUrl);
                                        }
                                        resolve(await this.apply(
                                            body,
                                            createRequestObjectFunc,
                                            connectionPolicy,
                                            requestOptions,
                                            endpointDiscoveryRetryPolicy,
                                            resourceThrottleRetryPolicy,
                                            sessionReadRetryPolicy));
                                    }, retryPolicy.retryAfterInMilliseconds);
                                });
                            }
                        });
                        return;
                    }
                }
            }
        } else if (body["stream"] !== null) {
            body["stream"].pipe(httpsRequest as WriteStream);
        } else if (body["buffer"] !== null) {
            (httpsRequest as WriteStream).write(body["buffer"]);
            (httpsRequest as WriteStream).end();
        } else {
            (httpsRequest as WriteStream).end();
        }
    }

    public static modifyRequestOptions(
        oldRequestOptions: RequestOptions | any, // TODO: any hack is bad
        newUrl: url.UrlWithStringQuery | any) { // TODO: any hack is bad
        const properties = Object.keys(newUrl);
        for (const index in properties) {
            if (properties[index] !== "path") {
                oldRequestOptions[properties[index]] = newUrl[properties[index]];
            }
        }
        return oldRequestOptions;
    }
}
