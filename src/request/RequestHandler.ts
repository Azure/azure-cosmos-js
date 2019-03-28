import { AbortController } from "abort-controller";
import fetch, { RequestInit, Response } from "node-fetch";
import { trimSlashes } from "../common";
import { Constants } from "../common/constants";
import * as RetryUtility from "../retry/retryUtility";
import { ErrorResponse } from "./ErrorResponse";
import { bodyFromData } from "./request";
import { RequestContext } from "./RequestContext";
import { Response as CosmosResponse } from "./Response";
import { TimeoutError } from "./TimeoutError";

/** @hidden */

export async function executeFetch(requestContext: RequestContext) {
  let didTimeout: boolean;
  const controller = new AbortController();
  const signal = controller.signal;
  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, requestContext.connectionPolicy.requestTimeout);

  let response: Response;

  if (requestContext.body) {
    requestContext.body = bodyFromData(requestContext.body);
  }

  try {
    response = await fetch(trimSlashes(requestContext.endpoint) + requestContext.path, {
      method: requestContext.method,
      headers: requestContext.headers as any,
      agent: requestContext.requestAgent,
      signal,
      body: requestContext.body
    } as RequestInit);
  } catch (error) {
    if (error.name === "AbortError") {
      if (didTimeout === true) {
        throw new TimeoutError();
      }
      // TODO handle user requested cancellation here
    }
    throw error;
  }

  clearTimeout(timeout);

  const result = response.status === 204 || response.status === 304 ? null : await response.json();

  const headers = {} as any;
  response.headers.forEach((value: string, key: string) => {
    headers[key] = value;
  });

  if (response.status >= 400) {
    const errorResponse: ErrorResponse = {
      code: response.status,
      // TODO Upstream code expects this as a string.
      // So after parsing to JSON we convert it back to string if there is an error
      body: JSON.stringify(result),
      headers
    };
    if (Constants.HttpHeaders.ActivityId in headers) {
      errorResponse.activityId = headers[Constants.HttpHeaders.ActivityId];
    }

    if (Constants.HttpHeaders.SubStatus in headers) {
      errorResponse.substatus = parseInt(headers[Constants.HttpHeaders.SubStatus], 10);
    }

    if (Constants.HttpHeaders.RetryAfterInMilliseconds in headers) {
      errorResponse.retryAfterInMilliseconds = parseInt(headers[Constants.HttpHeaders.RetryAfterInMilliseconds], 10);
    }

    return Promise.reject(errorResponse);
  }
  return {
    headers,
    result,
    statusCode: response.status
  };
}

export async function request(requestContext: RequestContext): Promise<CosmosResponse<any>> {
  const { globalEndpointManager, connectionPolicy, body, endpoint } = requestContext;

  let parsedBody: any; // TODO: any

  if (body) {
    parsedBody = bodyFromData(body);
    if (!body) {
      return {
        result: {
          message: "parameter data must be a javascript object, string, or Buffer"
        },
        headers: undefined
      };
    }
  }

  return RetryUtility.execute({
    globalEndpointManager,
    body: parsedBody,
    connectionPolicy,
    requestContext
  });
}
