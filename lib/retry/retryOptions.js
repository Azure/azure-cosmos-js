"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RetryOptions {
    constructor(MaxRetryAttemptCount = 9, FixedRetryIntervalInMilliseconds = 0, MaxWaitTimeInSeconds = 30) {
        this.MaxRetryAttemptCount = MaxRetryAttemptCount;
        this.FixedRetryIntervalInMilliseconds = FixedRetryIntervalInMilliseconds;
        this.MaxWaitTimeInSeconds = MaxWaitTimeInSeconds;
    }
}
exports.RetryOptions = RetryOptions;
//# sourceMappingURL=retryOptions.js.map