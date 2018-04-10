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
const querystring = require("querystring");
const url = require("url");
const common_1 = require("./common");
const documents_1 = require("./documents");
const retry_1 = require("./retry");
const isBrowser = new Function("try {return this===window;}catch(e){ return false;}");
const https = isBrowser ? require("stream-http") : require("https");
function javaScriptFriendlyJSONStringify(s) {
    return JSON.stringify(s).
        replace(/\u2028/g, "\\u2028").
        replace(/\u2029/g, "\\u2029");
}
function bodyFromData(data) {
    if (data.pipe) {
        return data;
    }
    if (Buffer.isBuffer(data)) {
        return data;
    }
    if (typeof data === "string") {
        return data;
    }
    if (typeof data === "object") {
        return javaScriptFriendlyJSONStringify(data);
    }
    return undefined;
}
function parse(urlString) { return url.parse(urlString); }
function createRequestObject(connectionPolicy, requestOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            function onTimeout() {
                httpsRequest.abort();
            }
            const isMedia = (requestOptions.path.indexOf("//media") === 0);
            const httpsRequest = https.request(requestOptions, (response) => {
                if (isMedia && connectionPolicy.MediaReadMode === documents_1.MediaReadMode.Streamed) {
                    return resolve({ result: response, headers: response.headers });
                }
                let data = "";
                if (!isMedia) {
                    response.setEncoding("utf8");
                }
                response.on("data", (chunk) => {
                    data += chunk;
                });
                response.on("end", () => {
                    if (response.statusCode >= 400) {
                        return reject(getErrorBody(response, data, response.headers));
                    }
                    let result;
                    try {
                        result = isMedia ? data : data.length > 0 ? JSON.parse(data) : undefined;
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                    resolve({ result, headers: response.headers });
                });
            });
            httpsRequest.once("socket", (socket) => {
                if (isMedia) {
                    socket.setTimeout(connectionPolicy.MediaRequestTimeout);
                }
                else {
                    socket.setTimeout(connectionPolicy.RequestTimeout);
                }
                socket.once("timeout", onTimeout);
                httpsRequest.once("response", () => {
                    socket.removeListener("timeout", onTimeout);
                });
            });
            httpsRequest.once("error", reject);
        });
    });
}
function getErrorBody(response, data, headers) {
    const errorBody = { code: response.statusCode, body: data, headers };
    if (common_1.Constants.HttpHeaders.ActivityId in response.headers) {
        errorBody.activityId = response.headers[common_1.Constants.HttpHeaders.ActivityId];
    }
    if (common_1.Constants.HttpHeaders.SubStatus in response.headers) {
        errorBody.substatus = parseInt(response.headers[common_1.Constants.HttpHeaders.SubStatus], 10);
    }
    if (common_1.Constants.HttpHeaders.RetryAfterInMilliseconds in response.headers) {
        errorBody.retryAfterInMilliseconds =
            parseInt(response.headers[common_1.Constants.HttpHeaders.RetryAfterInMilliseconds], 10);
    }
    return errorBody;
}
class RequestHandler {
    static createRequestObjectStub(connectionPolicy, requestOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return createRequestObject(connectionPolicy, requestOptions);
        });
    }
    static request(globalEndpointManager, connectionPolicy, requestAgent, method, hostname, request, data, queryParams, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = request.path === undefined ? request : request.path;
            let body;
            if (data) {
                body = bodyFromData(data);
                if (!body) {
                    return {
                        result: {
                            message: "parameter data must be a javascript object, string, Buffer, or stream",
                        },
                        headers: undefined,
                    };
                }
            }
            let buffer;
            let stream;
            if (body) {
                if (Buffer.isBuffer(body)) {
                    buffer = body;
                }
                else if (body.pipe) {
                    stream = body;
                }
                else if (typeof body === "string") {
                    buffer = new Buffer(body, "utf8");
                }
                else {
                    return {
                        result: {
                            message: "body must be string, Buffer, or stream",
                        },
                        headers: undefined,
                    };
                }
            }
            const requestOptions = parse(hostname);
            requestOptions.method = method;
            requestOptions.path += path;
            requestOptions.headers = headers;
            requestOptions.agent = requestAgent;
            requestOptions.secureProtocol = "TLSv1_client_method";
            if (connectionPolicy.DisableSSLVerification === true) {
                requestOptions.rejectUnauthorized = false;
            }
            if (queryParams) {
                requestOptions.path += "?" + querystring.stringify(queryParams);
            }
            if (buffer) {
                requestOptions.headers[common_1.Constants.HttpHeaders.ContentLength] = buffer.length;
                return retry_1.RetryUtility.execute(globalEndpointManager, { buffer, stream: null }, this.createRequestObjectStub, connectionPolicy, requestOptions, request);
            }
            else if (stream) {
                return retry_1.RetryUtility.execute(globalEndpointManager, { buffer: null, stream }, this.createRequestObjectStub, connectionPolicy, requestOptions, request);
            }
            else {
                return retry_1.RetryUtility.execute(globalEndpointManager, { buffer: null, stream: null }, this.createRequestObjectStub, connectionPolicy, requestOptions, request);
            }
        });
    }
}
exports.RequestHandler = RequestHandler;
//# sourceMappingURL=request.js.map