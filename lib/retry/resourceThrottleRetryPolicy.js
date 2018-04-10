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
class ResourceThrottleRetryPolicy {
    constructor(maxRetryAttemptCount, fixedRetryIntervalInMilliseconds, maxWaitTimeInSeconds) {
        this.maxRetryAttemptCount = maxRetryAttemptCount;
        this.fixedRetryIntervalInMilliseconds = fixedRetryIntervalInMilliseconds;
        this.currentRetryAttemptCount = 0;
        this.cummulativeWaitTimeinMilliseconds = 0;
        this.retryAfterInMilliseconds = 0;
        this.maxWaitTimeInMilliseconds = maxWaitTimeInSeconds * 1000;
        this.currentRetryAttemptCount = 0;
        this.cummulativeWaitTimeinMilliseconds = 0;
    }
    shouldRetry(err) {
        return __awaiter(this, void 0, void 0, function* () {
            if (err) {
                if (this.currentRetryAttemptCount < this.maxRetryAttemptCount) {
                    this.currentRetryAttemptCount++;
                    this.retryAfterInMilliseconds = 0;
                    if (this.fixedRetryIntervalInMilliseconds) {
                        this.retryAfterInMilliseconds = this.fixedRetryIntervalInMilliseconds;
                    }
                    else if (err.retryAfterInMilliseconds) {
                        this.retryAfterInMilliseconds = err.retryAfterInMilliseconds;
                    }
                    if (this.cummulativeWaitTimeinMilliseconds < this.maxWaitTimeInMilliseconds) {
                        this.cummulativeWaitTimeinMilliseconds += this.retryAfterInMilliseconds;
                        return true;
                    }
                }
            }
            return false;
        });
    }
}
ResourceThrottleRetryPolicy.THROTTLE_STATUS_CODE = common_1.StatusCodes.TooManyRequests;
exports.ResourceThrottleRetryPolicy = ResourceThrottleRetryPolicy;
//# sourceMappingURL=resourceThrottleRetryPolicy.js.map