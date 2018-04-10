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
const url = require("url");
const common_1 = require("../common");
class SessionReadRetryPolicy {
    constructor(globalEndpointManager, request) {
        this.globalEndpointManager = globalEndpointManager;
        this.request = request;
        this.currentRetryAttemptCount = 0;
        this.retryAfterInMilliseconds = SessionReadRetryPolicy.retryAfterInMilliseconds;
        this.maxRetryAttemptCount = SessionReadRetryPolicy.maxRetryAttemptCount;
    }
    shouldRetry(err) {
        return __awaiter(this, void 0, void 0, function* () {
            if (err) {
                if (this.currentRetryAttemptCount <= this.maxRetryAttemptCount
                    && (this.request.operationType === common_1.Constants.OperationTypes.Read ||
                        this.request.operationType === common_1.Constants.OperationTypes.Query)) {
                    const readEndpoint = yield this.globalEndpointManager.getReadEndpoint();
                    const writeEndpoint = yield this.globalEndpointManager.getWriteEndpoint();
                    if (readEndpoint !== writeEndpoint && this.request.endpointOverride == null) {
                        this.currentRetryAttemptCount++;
                        this.request.endpointOverride = writeEndpoint;
                        const newUrl = url.parse(writeEndpoint);
                        return [true, newUrl];
                    }
                    else {
                        this.request.client.clearSessionToken(this.request.path);
                        return false;
                    }
                }
            }
            return false;
        });
    }
}
SessionReadRetryPolicy.maxRetryAttemptCount = 1;
SessionReadRetryPolicy.retryAfterInMilliseconds = 0;
SessionReadRetryPolicy.NOT_FOUND_STATUS_CODE = common_1.StatusCodes.NotFound;
SessionReadRetryPolicy.READ_SESSION_NOT_AVAILABLE_SUB_STATUS_CODE = common_1.SubStatusCodes.PartitionKeyRangeGone;
exports.SessionReadRetryPolicy = SessionReadRetryPolicy;
//# sourceMappingURL=sessionReadRetryPolicy.js.map