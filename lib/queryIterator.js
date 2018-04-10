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
const queryExecutionContext_1 = require("./queryExecutionContext");
class QueryIterator {
    constructor(documentclient, query, options, fetchFunctions, resourceLink) {
        this.documentclient = documentclient;
        this.query = query;
        this.options = options;
        this.fetchFunctions = fetchFunctions;
        this.resourceLink = resourceLink;
        this.documentclient = documentclient;
        this.query = query;
        this.fetchFunctions = fetchFunctions;
        this.options = options;
        this.resourceLink = resourceLink;
        this.queryExecutionContext = this._createQueryExecutionContext();
    }
    forEach(callback) {
        this.reset();
        this._forEachImplementation(callback);
    }
    nextItem(callback) {
        const p = this.queryExecutionContext.nextItem();
        if (callback) {
            p.then(({ result, headers }) => { callback(undefined, result, headers); })
                .catch((err) => { callback(err, undefined, err.headers); });
        }
        else {
            return p;
        }
    }
    current(callback) {
        const p = this.queryExecutionContext.current();
        if (callback) {
            p.then(({ result, headers }) => { callback(undefined, result, headers); })
                .catch((err) => { callback(err, undefined, err.headers); });
        }
        else {
            return p;
        }
    }
    hasMoreResults() {
        return this.queryExecutionContext.hasMoreResults();
    }
    toArray(callback) {
        this.reset();
        this.toArrayTempResources = [];
        const p = this._toArrayImplementation();
        if (callback) {
            p.then(({ result, headers }) => { callback(undefined, result, headers); })
                .catch((err) => { callback(err, undefined, err.headers); });
        }
        else {
            return p;
        }
    }
    executeNext(callback) {
        const p = this.queryExecutionContext.fetchMore();
        if (callback) {
            p.then(({ result, headers }) => { callback(undefined, result, headers); })
                .catch((err) => { callback(err, undefined, err.headers); });
        }
        else {
            return p;
        }
    }
    reset() {
        this.queryExecutionContext = this._createQueryExecutionContext();
    }
    _toArrayImplementation() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { result, headers } = yield this.queryExecutionContext.nextItem();
                this.toArrayLastResHeaders = headers;
                if (result === undefined) {
                    return { result: this.toArrayTempResources, headers: this.toArrayLastResHeaders };
                }
                this.toArrayTempResources.push(result);
                return this._toArrayImplementation();
            }
            catch (err) {
                throw err;
            }
        });
    }
    _forEachImplementation(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { result, headers } = yield this.queryExecutionContext.nextItem();
                if (result === undefined) {
                    return callback(undefined, undefined, headers);
                }
                if (callback(undefined, result, headers) === false) {
                    return;
                }
                setImmediate(() => {
                    this._forEachImplementation(callback);
                });
            }
            catch (err) {
                throw err;
            }
        });
    }
    _createQueryExecutionContext() {
        return new queryExecutionContext_1.ProxyQueryExecutionContext(this.documentclient, this.query, this.options, this.fetchFunctions, this.resourceLink);
    }
}
exports.QueryIterator = QueryIterator;
//# sourceMappingURL=queryIterator.js.map