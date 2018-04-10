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
const _1 = require(".");
const common_1 = require("../common");
class ProxyQueryExecutionContext {
    constructor(documentclient, query, options, fetchFunctions, resourceLink) {
        this.documentclient = documentclient;
        this.query = query;
        this.options = options;
        this.fetchFunctions = fetchFunctions;
        this.resourceLink = resourceLink;
        this.documentclient = documentclient;
        this.query = query;
        this.fetchFunctions = fetchFunctions;
        this.options = JSON.parse(JSON.stringify(options || {}));
        this.resourceLink = resourceLink;
        this.queryExecutionContext =
            new _1.DefaultQueryExecutionContext(this.documentclient, this.query, this.options, this.fetchFunctions);
    }
    nextItem() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.queryExecutionContext.nextItem();
            }
            catch (err) {
                if (this._hasPartitionedExecutionInfo(err)) {
                    const partitionedExecutionInfo = this._getParitionedExecutionInfo(err);
                    this.queryExecutionContext = this._createPipelinedExecutionContext(partitionedExecutionInfo);
                    try {
                        return this.nextItem();
                    }
                    catch (e) {
                        throw e;
                    }
                }
                else {
                    throw err;
                }
            }
        });
    }
    _createPipelinedExecutionContext(partitionedExecutionInfo) {
        assert.notStrictEqual(this.resourceLink, undefined, "for top/orderby resourceLink is required.");
        assert.ok(!Array.isArray(this.resourceLink) || this.resourceLink.length === 1, "for top/orderby exactly one collectionLink is required");
        const collectionLink = Array.isArray(this.resourceLink) ? this.resourceLink[0] : this.resourceLink;
        return new _1.PipelinedQueryExecutionContext(this.documentclient, collectionLink, this.query, this.options, partitionedExecutionInfo);
    }
    current() {
        try {
            return this.queryExecutionContext.current();
        }
        catch (err) {
            if (this._hasPartitionedExecutionInfo(err)) {
                const partitionedExecutionInfo = this._getParitionedExecutionInfo(err);
                this.queryExecutionContext = this._createPipelinedExecutionContext(partitionedExecutionInfo);
                try {
                    return this.current();
                }
                catch (e) {
                    throw e;
                }
            }
            else {
                throw err;
            }
        }
    }
    hasMoreResults() {
        return this.queryExecutionContext.hasMoreResults();
    }
    fetchMore() {
        try {
            return this.queryExecutionContext.fetchMore();
        }
        catch (err) {
            if (this._hasPartitionedExecutionInfo(err)) {
                const partitionedExecutionInfo = this._getParitionedExecutionInfo(err);
                this.queryExecutionContext = this._createPipelinedExecutionContext(partitionedExecutionInfo);
                try {
                    return this.queryExecutionContext.fetchMore();
                }
                catch (e) {
                    throw e;
                }
            }
            else {
                throw err;
            }
        }
    }
    _hasPartitionedExecutionInfo(error) {
        return (error.code === common_1.StatusCodes.BadRequest)
            && ("substatus" in error)
            && (error["substatus"] === common_1.SubStatusCodes.CrossPartitionQueryNotServable);
    }
    _getParitionedExecutionInfo(error) {
        return JSON.parse(JSON.parse(error.body).additionalErrorInfo);
    }
}
exports.ProxyQueryExecutionContext = ProxyQueryExecutionContext;
//# sourceMappingURL=proxyQueryExecutionContext.js.map