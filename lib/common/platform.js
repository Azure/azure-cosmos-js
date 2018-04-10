"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const _1 = require(".");
class Platform {
    static getPlatformDefaultHeaders() {
        const defaultHeaders = {};
        defaultHeaders[_1.Constants.HttpHeaders.UserAgent] = Platform.getUserAgent();
        return defaultHeaders;
    }
    static getDecodedDataLength(encodedData) {
        const buffer = new Buffer(encodedData, "base64");
        return buffer.length;
    }
    static getUserAgent() {
        const osName = Platform._getSafeUserAgentSegmentInfo(os.platform());
        const osVersion = Platform._getSafeUserAgentSegmentInfo(os.release());
        const nodejsVersion = Platform._getSafeUserAgentSegmentInfo(process.version);
        const userAgent = `${osName}/${osVersion} Nodejs/${nodejsVersion} ${_1.Constants.SDKName}/${_1.Constants.SDKVersion}`;
        return userAgent;
    }
    static _getSafeUserAgentSegmentInfo(s) {
        if (typeof (s) !== "string") {
            s = "unknown";
        }
        s = s.replace(/\s+/g, "");
        if (!s) {
            s = "unknown";
        }
        return s;
    }
}
exports.Platform = Platform;
//# sourceMappingURL=platform.js.map