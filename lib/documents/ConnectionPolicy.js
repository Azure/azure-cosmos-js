"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const retry_1 = require("../retry");
class ConnectionPolicy {
    constructor() {
        this.ConnectionMode = _1.ConnectionMode.Gateway;
        this.MediaReadMode = _1.MediaReadMode.Buffered;
        this.MediaRequestTimeout = ConnectionPolicy.defaultMediaRequestTimeout;
        this.RequestTimeout = ConnectionPolicy.defaultRequestTimeout;
        this.EnableEndpointDiscovery = true;
        this.PreferredLocations = [];
        this.RetryOptions = new retry_1.RetryOptions();
        this.DisableSSLVerification = false;
        this.ProxyUrl = "";
    }
}
ConnectionPolicy.defaultRequestTimeout = 60000;
ConnectionPolicy.defaultMediaRequestTimeout = 300000;
exports.ConnectionPolicy = ConnectionPolicy;
//# sourceMappingURL=ConnectionPolicy.js.map