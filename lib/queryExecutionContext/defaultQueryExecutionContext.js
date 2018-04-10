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
var STATES;
(function (STATES) {
    STATES["start"] = "start";
    STATES["inProgress"] = "inProgress";
    STATES["ended"] = "ended";
})(STATES || (STATES = {}));
class DefaultQueryExecutionContext {
    constructor(documentclient, query, options, fetchFunctions) {
        this.documentclient = documentclient;
        this.query = query;
        this.resources = [];
        this.currentIndex = 0;
        this.currentPartitionIndex = 0;
        this.fetchFunctions = (Array.isArray(fetchFunctions)) ? fetchFunctions : [fetchFunctions];
        this.options = options || {};
        this.continuation = this.options.continuation || null;
        this.state = DefaultQueryExecutionContext.STATES.start;
    }
    nextItem() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.current();
            ++this.currentIndex;
            return response;
        });
    }
    current() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentIndex < this.resources.length) {
                return { result: this.resources[this.currentIndex], headers: undefined };
            }
            if (this._canFetchMore()) {
                const { result: resources, headers } = yield this.fetchMore();
                this.resources = resources;
                if (this.resources.length === 0) {
                    if (!this.continuation && this.currentPartitionIndex >= this.fetchFunctions.length) {
                        this.state = DefaultQueryExecutionContext.STATES.ended;
                        return { result: undefined, headers };
                    }
                    else {
                        return this.current();
                    }
                }
                return { result: this.resources[this.currentIndex], headers };
            }
            else {
                this.state = DefaultQueryExecutionContext.STATES.ended;
                return { result: undefined, headers: undefined };
            }
        });
    }
    hasMoreResults() {
        return this.state === DefaultQueryExecutionContext.STATES.start
            || this.continuation !== undefined
            || this.currentIndex < this.resources.length
            || this.currentPartitionIndex < this.fetchFunctions.length;
    }
    fetchMore() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentPartitionIndex >= this.fetchFunctions.length) {
                return { headers: undefined, result: undefined };
            }
            const originalContinuation = this.options.continuation;
            this.options.continuation = this.continuation;
            if (this.currentPartitionIndex >= this.fetchFunctions.length) {
                return { headers: undefined, result: undefined };
            }
            const fetchFunction = this.fetchFunctions[this.currentPartitionIndex];
            let resources;
            let responseHeaders;
            try {
                const response = yield fetchFunction(this.options);
                resources = response.result;
                responseHeaders = response.headers;
            }
            catch (err) {
                this.state = DefaultQueryExecutionContext.STATES.ended;
                throw err;
            }
            this.continuation = responseHeaders[common_1.Constants.HttpHeaders.Continuation];
            if (!this.continuation) {
                ++this.currentPartitionIndex;
            }
            this.state = DefaultQueryExecutionContext.STATES.inProgress;
            this.currentIndex = 0;
            this.options.continuation = originalContinuation;
            return { result: resources, headers: responseHeaders };
        });
    }
    _canFetchMore() {
        const res = (this.state === DefaultQueryExecutionContext.STATES.start
            || (this.continuation && this.state === DefaultQueryExecutionContext.STATES.inProgress)
            || (this.currentPartitionIndex < this.fetchFunctions.length
                && this.state === DefaultQueryExecutionContext.STATES.inProgress));
        return res;
    }
}
DefaultQueryExecutionContext.STATES = STATES;
exports.DefaultQueryExecutionContext = DefaultQueryExecutionContext;
//# sourceMappingURL=defaultQueryExecutionContext.js.map