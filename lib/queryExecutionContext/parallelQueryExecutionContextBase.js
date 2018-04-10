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
const bs = require("binary-search-bounds");
const PriorityQueue = require("priorityqueuejs");
const semaphore = require("semaphore");
const util = require("util");
const _1 = require(".");
const common_1 = require("../common");
const routing_1 = require("../routing");
var ParallelQueryExecutionContextBaseStates;
(function (ParallelQueryExecutionContextBaseStates) {
    ParallelQueryExecutionContextBaseStates["started"] = "started";
    ParallelQueryExecutionContextBaseStates["inProgress"] = "inProgress";
    ParallelQueryExecutionContextBaseStates["ended"] = "ended";
})(ParallelQueryExecutionContextBaseStates = exports.ParallelQueryExecutionContextBaseStates || (exports.ParallelQueryExecutionContextBaseStates = {}));
class ParallelQueryExecutionContextBase {
    constructor(documentclient, collectionLink, query, options, partitionedQueryExecutionInfo) {
        this.documentclient = documentclient;
        this.collectionLink = collectionLink;
        this.query = query;
        this.options = options;
        this.partitionedQueryExecutionInfo = partitionedQueryExecutionInfo;
        this.documentclient = documentclient;
        this.collectionLink = collectionLink;
        this.query = query;
        this.options = options;
        this.partitionedQueryExecutionInfo = partitionedQueryExecutionInfo;
        this.err = undefined;
        this.state = ParallelQueryExecutionContextBase.STATES.started;
        this.routingProvider = new routing_1.SmartRoutingMapProvider(this.documentclient);
        this.sortOrders = _1.PartitionedQueryExecutionContextInfoParser.parseOrderBy(this.partitionedQueryExecutionInfo);
        this.state = ParallelQueryExecutionContextBase.STATES.started;
        if (options === undefined || options["maxItemCount"] === undefined) {
            this.pageSize = ParallelQueryExecutionContextBase.DEFAULT_PAGE_SIZE;
            this.options["maxItemCount"] = this.pageSize;
        }
        else {
            this.pageSize = options["maxItemCount"];
        }
        this.requestContinuation = options ? options.continuation : null;
        this.respHeaders = _1.HeaderUtils.getInitialHeader();
        this.orderByPQ = new PriorityQueue((a, b) => this.documentProducerComparator(b, a));
        this.sem = semaphore(1);
        const createDocumentProducersAndFillUpPriorityQueueFunc = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const targetPartitionRanges = yield this._onTargetPartitionRanges();
                this.waitingForInternalExecutionContexts = targetPartitionRanges.length;
                const maxDegreeOfParallelism = options.maxDegreeOfParallelism > 0
                    ? Math.min(options.maxDegreeOfParallelism, targetPartitionRanges.length)
                    : targetPartitionRanges.length;
                const parallelismSem = semaphore(maxDegreeOfParallelism);
                let filteredPartitionKeyRanges = [];
                const targetPartitionQueryExecutionContextList = [];
                if (this.requestContinuation) {
                    try {
                        const suppliedCompositeContinuationToken = JSON.parse(this.requestContinuation);
                        filteredPartitionKeyRanges =
                            this.getPartitionKeyRangesForContinuation(suppliedCompositeContinuationToken, targetPartitionRanges);
                        if (filteredPartitionKeyRanges.length > 0) {
                            targetPartitionQueryExecutionContextList.push(this._createTargetPartitionQueryExecutionContext(filteredPartitionKeyRanges[0], suppliedCompositeContinuationToken.token));
                            filteredPartitionKeyRanges = filteredPartitionKeyRanges.slice(1);
                        }
                    }
                    catch (e) {
                        this.err = e;
                        this.sem.leave();
                    }
                }
                else {
                    filteredPartitionKeyRanges = targetPartitionRanges;
                }
                filteredPartitionKeyRanges.forEach((partitionTargetRange) => {
                    targetPartitionQueryExecutionContextList.push(this._createTargetPartitionQueryExecutionContext(partitionTargetRange));
                });
                targetPartitionQueryExecutionContextList.forEach((documentProducer) => {
                    const throttledFunc = () => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const [document, headers] = documentProducer.current();
                            this._mergeWithActiveResponseHeaders(headers);
                            if (document === undefined) {
                                return;
                            }
                            try {
                                this.orderByPQ.enq(documentProducer);
                            }
                            catch (e) {
                                this.err = e;
                            }
                        }
                        catch (err) {
                            this._mergeWithActiveResponseHeaders(err.headers);
                            this.err = err;
                            throw err;
                        }
                        finally {
                            parallelismSem.leave();
                            this._decrementInitiationLock();
                        }
                    });
                    parallelismSem.take(throttledFunc);
                });
            }
            catch (err) {
                this.err = err;
                this.sem.leave();
                return;
            }
        });
        this.sem.take(createDocumentProducersAndFillUpPriorityQueueFunc);
    }
    getPartitionKeyRangesForContinuation(suppliedCompositeContinuationToken, partitionKeyRanges) {
        const startRange = {};
        startRange[routing_1.PARITIONKEYRANGE.MinInclusive] = suppliedCompositeContinuationToken.range.min;
        startRange[routing_1.PARITIONKEYRANGE.MaxExclusive] = suppliedCompositeContinuationToken.range.max;
        const vbCompareFunction = (x, y) => {
            if (x[routing_1.PARITIONKEYRANGE.MinInclusive] > y[routing_1.PARITIONKEYRANGE.MinInclusive]) {
                return 1;
            }
            if (x[routing_1.PARITIONKEYRANGE.MinInclusive] < y[routing_1.PARITIONKEYRANGE.MinInclusive]) {
                return -1;
            }
            return 0;
        };
        const minIndex = bs.le(partitionKeyRanges, startRange, vbCompareFunction);
        if (minIndex > 0) {
            throw new Error("BadRequestException: InvalidContinuationToken");
        }
        return partitionKeyRanges.slice(minIndex, partitionKeyRanges.length - minIndex);
    }
    _decrementInitiationLock() {
        this.waitingForInternalExecutionContexts = this.waitingForInternalExecutionContexts - 1;
        if (this.waitingForInternalExecutionContexts === 0) {
            this.sem.leave();
            if (this.orderByPQ.size() === 0) {
                this.state = ParallelQueryExecutionContextBase.STATES.inProgress;
            }
        }
    }
    _mergeWithActiveResponseHeaders(headers) {
        _1.HeaderUtils.mergeHeaders(this.respHeaders, headers);
    }
    _getAndResetActiveResponseHeaders() {
        const ret = this.respHeaders;
        this.respHeaders = _1.HeaderUtils.getInitialHeader();
        return ret;
    }
    _onTargetPartitionRanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const parsedRanges = _1.PartitionedQueryExecutionContextInfoParser.parseQueryRanges(this.partitionedQueryExecutionInfo);
            const queryRanges = parsedRanges.map((item) => routing_1.QueryRange.parseFromDict(item));
            return this.routingProvider.getOverlappingRanges(this.collectionLink, queryRanges);
        });
    }
    _getReplacementPartitionKeyRanges(documentProducer) {
        return __awaiter(this, void 0, void 0, function* () {
            const routingMapProvider = this.documentclient.partitionKeyDefinitionCache;
            const partitionKeyRange = documentProducer.targetPartitionKeyRange;
            this.routingProvider = new routing_1.SmartRoutingMapProvider(this.documentclient);
            const queryRange = routing_1.QueryRange.parsePartitionKeyRange(partitionKeyRange);
            return this.routingProvider.getOverlappingRanges(this.collectionLink, [queryRange]);
        });
    }
    _repairExecutionContext(originFunction) {
        return __awaiter(this, void 0, void 0, function* () {
            const parentDocumentProducer = this.orderByPQ.deq();
            try {
                const replacementPartitionKeyRanges = yield this._getReplacementPartitionKeyRanges(parentDocumentProducer);
                const replacementDocumentProducers = [];
                replacementPartitionKeyRanges.forEach((partitionKeyRange) => {
                    const replacementDocumentProducer = this._createTargetPartitionQueryExecutionContext(partitionKeyRange, parentDocumentProducer.continuationToken);
                    replacementDocumentProducers.push(replacementDocumentProducer);
                });
                const checkAndEnqueueDocumentProducer = (documentProducerToCheck, checkNextDocumentProducerCallback) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const { result: afterItem, headers } = yield documentProducerToCheck.current();
                        if (afterItem === undefined) {
                        }
                        else {
                            this.orderByPQ.enq(documentProducerToCheck);
                        }
                        yield checkNextDocumentProducerCallback();
                    }
                    catch (err) {
                        this.err = err;
                        return;
                    }
                });
                const checkAndEnqueueDocumentProducers = (rdp) => __awaiter(this, void 0, void 0, function* () {
                    if (rdp.length > 0) {
                        const replacementDocumentProducer = rdp.shift();
                        yield checkAndEnqueueDocumentProducer(replacementDocumentProducer, () => __awaiter(this, void 0, void 0, function* () { yield checkAndEnqueueDocumentProducers(rdp); }));
                    }
                    else {
                        return originFunction();
                    }
                });
                checkAndEnqueueDocumentProducers(replacementDocumentProducers);
            }
            catch (err) {
                this.err = err;
                throw err;
            }
        });
    }
    static _needPartitionKeyRangeCacheRefresh(error) {
        return (error.code === common_1.StatusCodes.Gone)
            && ("substatus" in error)
            && (error["substatus"] === common_1.SubStatusCodes.PartitionKeyRangeGone);
    }
    _repairExecutionContextIfNeeded(ifCallback, elseCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentProducer = this.orderByPQ.peek();
            try {
                const { result: element, headers } = yield documentProducer.current();
                elseCallback();
            }
            catch (err) {
                if (ParallelQueryExecutionContextBase._needPartitionKeyRangeCacheRefresh(err)) {
                    return this._repairExecutionContext(ifCallback);
                }
                else {
                    this.err = err;
                    return;
                }
            }
        });
    }
    nextItem() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.err) {
                throw this.err;
            }
            return new Promise((resolve, reject) => {
                this.sem.take(() => {
                    if (this.err) {
                        this.sem.leave();
                        this.err.headers = this._getAndResetActiveResponseHeaders();
                        throw this.err;
                    }
                    if (this.orderByPQ.size() === 0) {
                        this.state = ParallelQueryExecutionContextBase.STATES.ended;
                        this.sem.leave();
                        return resolve({ result: undefined, headers: this._getAndResetActiveResponseHeaders() });
                    }
                    const ifCallback = () => {
                        this.sem.leave();
                        return resolve(this.nextItem());
                    };
                    const elseCallback = () => __awaiter(this, void 0, void 0, function* () {
                        let documentProducer;
                        try {
                            documentProducer = this.orderByPQ.deq();
                        }
                        catch (e) {
                            this.err = e;
                            this.sem.leave();
                            this.err.headers = this._getAndResetActiveResponseHeaders();
                            throw this.err;
                        }
                        let item;
                        let headers;
                        try {
                            const response = yield documentProducer.nextItem();
                            item = response.result;
                            headers = response.headers;
                            this._mergeWithActiveResponseHeaders(headers);
                            if (item === undefined) {
                                this.err =
                                    new Error(util.format(`Extracted DocumentProducer from the priority queue \
                                            doesn't have any buffered item!`));
                                this.sem.leave();
                                return resolve({ result: undefined, headers: this._getAndResetActiveResponseHeaders() });
                            }
                        }
                        catch (err) {
                            this.err =
                                new Error(`Extracted DocumentProducer from the priority queue fails to get the \
                                    buffered item. Due to ${JSON.stringify(err)}`);
                            this.err.headers = this._getAndResetActiveResponseHeaders();
                            this.sem.leave();
                        }
                        try {
                            const { result: afterItem, headers: currentHeaders } = yield documentProducer.current();
                            if (afterItem === undefined) {
                            }
                            else {
                                try {
                                    const headItem = documentProducer.fetchResults[0];
                                    assert.notStrictEqual(headItem, undefined, "Extracted DocumentProducer from PQ is invalid state with no result!");
                                    this.orderByPQ.enq(documentProducer);
                                }
                                catch (e) {
                                    this.err = e;
                                }
                            }
                        }
                        catch (err) {
                            if (ParallelQueryExecutionContextBase._needPartitionKeyRangeCacheRefresh(err)) {
                                this.orderByPQ.enq(documentProducer);
                            }
                            else {
                                this.err = err;
                            }
                        }
                        finally {
                            this.sem.leave();
                        }
                        return resolve({ result: item, headers: this._getAndResetActiveResponseHeaders() });
                    });
                    this._repairExecutionContextIfNeeded(ifCallback, elseCallback);
                });
            });
        });
    }
    current() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.err) {
                this.err.headerse = this._getAndResetActiveResponseHeaders();
                throw this.err;
            }
            return new Promise((resolve, reject) => {
                this.sem.take(() => {
                    try {
                        if (this.err) {
                            this.err = this._getAndResetActiveResponseHeaders();
                            throw this.err;
                        }
                        if (this.orderByPQ.size() === 0) {
                            return resolve({ result: undefined, headers: this._getAndResetActiveResponseHeaders() });
                        }
                        const ifCallback = () => {
                            return resolve(this.current());
                        };
                        const elseCallback = () => {
                            const documentProducer = this.orderByPQ.peek();
                            return resolve(documentProducer.current());
                        };
                        this._repairExecutionContextIfNeeded(ifCallback, elseCallback);
                    }
                    finally {
                        this.sem.leave();
                    }
                });
            });
        });
    }
    hasMoreResults() {
        return !(this.state === ParallelQueryExecutionContextBase.STATES.ended || this.err !== undefined);
    }
    _createTargetPartitionQueryExecutionContext(partitionKeyTargetRange, continuationToken) {
        let rewrittenQuery = _1.PartitionedQueryExecutionContextInfoParser
            .parseRewrittenQuery(this.partitionedQueryExecutionInfo);
        let query = this.query;
        if (typeof (query) === "string") {
            query = { query };
        }
        const formatPlaceHolder = "{documentdb-formattableorderbyquery-filter}";
        if (rewrittenQuery) {
            query = JSON.parse(JSON.stringify(query));
            rewrittenQuery = rewrittenQuery.replace(formatPlaceHolder, "true");
            query["query"] = rewrittenQuery;
        }
        const options = JSON.parse(JSON.stringify(this.options));
        options.continuationToken = continuationToken;
        return new _1.DocumentProducer(this.documentclient, this.collectionLink, query, partitionKeyTargetRange, options);
    }
}
ParallelQueryExecutionContextBase.DEFAULT_PAGE_SIZE = 10;
ParallelQueryExecutionContextBase.STATES = ParallelQueryExecutionContextBaseStates;
exports.ParallelQueryExecutionContextBase = ParallelQueryExecutionContextBase;
//# sourceMappingURL=parallelQueryExecutionContextBase.js.map