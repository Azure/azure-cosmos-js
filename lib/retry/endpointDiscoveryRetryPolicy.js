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
const common_1 = require("../common");
class EndpointDiscoveryRetryPolicy {
    constructor(globalEndpointManager) {
        this.globalEndpointManager = globalEndpointManager;
        this.maxRetryAttemptCount = EndpointDiscoveryRetryPolicy.maxRetryAttemptCount;
        this.currentRetryAttemptCount = 0;
        this.retryAfterInMilliseconds = EndpointDiscoveryRetryPolicy.retryAfterInMilliseconds;
    }
    shouldRetry(err) {
        return __awaiter(this, void 0, void 0, function* () {
            if (err) {
                if (this.currentRetryAttemptCount < this.maxRetryAttemptCount
                    && this.globalEndpointManager.enableEndpointDiscovery) {
                    this.currentRetryAttemptCount++;
                    yield this.globalEndpointManager.refreshEndpointList();
                    return true;
                }
            }
            return false;
        });
    }
}
EndpointDiscoveryRetryPolicy.maxRetryAttemptCount = 120;
EndpointDiscoveryRetryPolicy.retryAfterInMilliseconds = 1000;
EndpointDiscoveryRetryPolicy.FORBIDDEN_STATUS_CODE = common_1.StatusCodes.Forbidden;
EndpointDiscoveryRetryPolicy.WRITE_FORBIDDEN_SUB_STATUS_CODE = 3;
exports.EndpointDiscoveryRetryPolicy = EndpointDiscoveryRetryPolicy;
//# sourceMappingURL=endpointDiscoveryRetryPolicy.js.map