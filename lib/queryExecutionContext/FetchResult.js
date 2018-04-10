"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FetchResultType;
(function (FetchResultType) {
    FetchResultType[FetchResultType["Done"] = 0] = "Done";
    FetchResultType[FetchResultType["Exception"] = 1] = "Exception";
    FetchResultType[FetchResultType["Result"] = 2] = "Result";
})(FetchResultType = exports.FetchResultType || (exports.FetchResultType = {}));
class FetchResult {
    constructor(feedResponse, error) {
        if (feedResponse) {
            this.feedResponse = feedResponse;
            this.fetchResultType = FetchResultType.Result;
        }
        else {
            this.error = error;
            this.fetchResultType = FetchResultType.Exception;
        }
    }
}
exports.FetchResult = FetchResult;
//# sourceMappingURL=FetchResult.js.map