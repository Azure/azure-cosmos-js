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
const assert = require("assert");
const base_1 = require("../base");
const common_1 = require("../common");
const defaultQueryExecutionContext_1 = require("./defaultQueryExecutionContext");
const FetchResult_1 = require("./FetchResult");
const headerUtils_1 = require("./headerUtils");
const HttpHeaders = common_1.Constants;
var DocumentProducerStates;
(function (DocumentProducerStates) {
    DocumentProducerStates["started"] = "started";
    DocumentProducerStates["inProgress"] = "inProgress";
    DocumentProducerStates["ended"] = "ended";
})(DocumentProducerStates || (DocumentProducerStates = {}));
class DocumentProducer {
    constructor(documentclient, collectionLink, query, targetPartitionKeyRange, options) {
        this.documentclient = documentclient;
        this.collectionLink = collectionLink;
        this.query = query;
        this.targetPartitionKeyRange = targetPartitionKeyRange;
        this.fetchResults = [];
        this.state = DocumentProducer.STATES.started;
        this.allFetched = false;
        this.err = undefined;
        this.previousContinuationToken = undefined;
        this.continuationToken = undefined;
        this.respHeaders = headerUtils_1.HeaderUtils.getInitialHeader();
        const isNameBased = base_1.Base.isLinkNameBased(collectionLink);
        const path = this.documentclient.getPathFromLink(collectionLink, "docs", isNameBased);
        const id = this.documentclient.getIdFromLink(collectionLink, isNameBased);
        const fetchFunction = (options) => {
            return new Promise((resolve, reject) => {
                const callback = (err, results) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(results);
                };
                this.documentclient.queryFeed.call(documentclient, documentclient, path, "docs", id, (result) => result.Documents, (parent, body) => body, query, options, callback, this.targetPartitionKeyRange["id"]);
            });
        };
        this.internalExecutionContext = new defaultQueryExecutionContext_1.DefaultQueryExecutionContext(documentclient, query, options, fetchFunction);
        this.state = DocumentProducer.STATES.inProgress;
    }
    peekBufferedItems() {
        const bufferedResults = [];
        for (let i = 0, done = false; i < this.fetchResults.length && !done; i++) {
            const fetchResult = this.fetchResults[i];
            switch (fetchResult.fetchResultType) {
                case FetchResult_1.FetchResultType.Done:
                    done = true;
                    break;
                case FetchResult_1.FetchResultType.Exception:
                    done = true;
                    break;
                case FetchResult_1.FetchResultType.Result:
                    bufferedResults.push(fetchResult.feedResponse);
                    break;
            }
        }
        return bufferedResults;
    }
    hasMoreResults() {
        return this.internalExecutionContext.hasMoreResults() || this.fetchResults.length !== 0;
    }
    gotSplit() {
        const fetchResult = this.fetchResults[0];
        if (fetchResult.fetchResultType === FetchResult_1.FetchResultType.Exception) {
            if (DocumentProducer._needPartitionKeyRangeCacheRefresh(fetchResult.error)) {
                return true;
            }
        }
        return false;
    }
    _getAndResetActiveResponseHeaders() {
        const ret = this.respHeaders;
        this.respHeaders = headerUtils_1.HeaderUtils.getInitialHeader();
        return ret;
    }
    _updateStates(err, allFetched) {
        if (err) {
            this.state = DocumentProducer.STATES.ended;
            this.err = err;
            return;
        }
        if (allFetched) {
            this.allFetched = true;
        }
        if (this.allFetched && this.peekBufferedItems().length === 0) {
            this.state = DocumentProducer.STATES.ended;
        }
        if (this.internalExecutionContext.continuation === this.continuationToken) {
            return;
        }
        this.previousContinuationToken = this.continuationToken;
        this.continuationToken = this.internalExecutionContext.continuation;
    }
    static _needPartitionKeyRangeCacheRefresh(error) {
        return (error.code === common_1.StatusCodes.Gone)
            && ("substatus" in error)
            && (error["substatus"] === common_1.SubStatusCodes.PartitionKeyRangeGone);
    }
    bufferMore() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.err) {
                throw this.err;
            }
            try {
                const { result: resources, headers: headerResponse } = yield this.internalExecutionContext.fetchMore();
                this._updateStates(undefined, resources === undefined);
                if (resources !== undefined) {
                    resources.forEach((element) => {
                        this.fetchResults.push(new FetchResult_1.FetchResult(element, undefined));
                    });
                }
                return { result: resources, headers: headerResponse };
            }
            catch (err) {
                if (DocumentProducer._needPartitionKeyRangeCacheRefresh(err)) {
                    const bufferedError = new FetchResult_1.FetchResult(undefined, err);
                    this.fetchResults.push(bufferedError);
                    return { result: [bufferedError], headers: err.headers };
                }
                else {
                    this._updateStates(err, err.resources === undefined);
                    throw err;
                }
            }
        });
    }
    getTargetParitionKeyRange() {
        return this.targetPartitionKeyRange;
    }
    nextItem() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.err) {
                this._updateStates(this.err, undefined);
                throw this.err;
            }
            try {
                const { result, headers } = yield this.current();
                const fetchResult = this.fetchResults.shift();
                this._updateStates(undefined, result === undefined);
                assert.equal(fetchResult.feedResponse, result);
                switch (fetchResult.fetchResultType) {
                    case FetchResult_1.FetchResultType.Done:
                        return { result: undefined, headers };
                    case FetchResult_1.FetchResultType.Exception:
                        fetchResult.error.headers = headers;
                        throw fetchResult.error;
                    case FetchResult_1.FetchResultType.Result:
                        return { result: fetchResult.feedResponse, headers };
                }
            }
            catch (err) {
                this._updateStates(err, err.item === undefined);
                throw err;
            }
        });
    }
    current() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fetchResults.length > 0) {
                const fetchResult = this.fetchResults[0];
                switch (fetchResult.fetchResultType) {
                    case FetchResult_1.FetchResultType.Done:
                        return { result: undefined, headers: this._getAndResetActiveResponseHeaders() };
                    case FetchResult_1.FetchResultType.Exception:
                        fetchResult.error.headers = this._getAndResetActiveResponseHeaders();
                        throw fetchResult.error;
                    case FetchResult_1.FetchResultType.Result:
                        return { result: fetchResult.feedResponse, headers: this._getAndResetActiveResponseHeaders() };
                }
            }
            if (this.allFetched) {
                return { result: undefined, headers: this._getAndResetActiveResponseHeaders() };
            }
            try {
                const { result, headers } = yield this.bufferMore();
                if (result === undefined) {
                    return { result: undefined, headers };
                }
                headerUtils_1.HeaderUtils.mergeHeaders(this.respHeaders, headers);
                return this.current();
            }
            catch (err) {
                throw err;
            }
        });
    }
}
DocumentProducer.STATES = DocumentProducerStates;
exports.DocumentProducer = DocumentProducer;
//# sourceMappingURL=documentProducer.js.map