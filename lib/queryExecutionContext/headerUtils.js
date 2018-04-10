"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../common");
class HeaderUtils {
    static getRequestChargeIfAny(headers) {
        if (typeof headers === "number") {
            return headers;
        }
        else if (typeof headers === "string") {
            return parseFloat(headers);
        }
        if (headers) {
            const rc = headers[common_1.Constants.HttpHeaders.RequestCharge];
            if (rc) {
                return parseFloat(rc);
            }
            else {
                return 0;
            }
        }
        else {
            return 0;
        }
    }
    static getInitialHeader() {
        const headers = {};
        headers[common_1.Constants.HttpHeaders.RequestCharge] = 0;
        return headers;
    }
    static mergeHeaders(headers, toBeMergedHeaders) {
        if (headers[common_1.Constants.HttpHeaders.RequestCharge] === undefined) {
            headers[common_1.Constants.HttpHeaders.RequestCharge] = 0;
        }
        if (!toBeMergedHeaders) {
            return;
        }
        headers[common_1.Constants.HttpHeaders.RequestCharge] +=
            HeaderUtils.getRequestChargeIfAny(toBeMergedHeaders);
        if (toBeMergedHeaders[common_1.Constants.HttpHeaders.IsRUPerMinuteUsed]) {
            headers[common_1.Constants.HttpHeaders.IsRUPerMinuteUsed] =
                toBeMergedHeaders[common_1.Constants.HttpHeaders.IsRUPerMinuteUsed];
        }
    }
}
exports.HeaderUtils = HeaderUtils;
//# sourceMappingURL=headerUtils.js.map