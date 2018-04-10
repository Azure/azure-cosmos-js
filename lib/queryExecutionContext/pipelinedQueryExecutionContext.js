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
const _1 = require(".");
const EndpointComponent_1 = require("./EndpointComponent");
class PipelinedQueryExecutionContext {
    constructor(documentclient, collectionLink, query, options, partitionedQueryExecutionInfo) {
        this.documentclient = documentclient;
        this.collectionLink = collectionLink;
        this.query = query;
        this.options = options;
        this.partitionedQueryExecutionInfo = partitionedQueryExecutionInfo;
        this.endpoint = null;
        this.pageSize = options["maxItemCount"];
        if (this.pageSize === undefined) {
            this.pageSize = PipelinedQueryExecutionContext.DEFAULT_PAGE_SIZE;
        }
        const sortOrders = _1.PartitionedQueryExecutionContextInfoParser.parseOrderBy(partitionedQueryExecutionInfo);
        if (Array.isArray(sortOrders) && sortOrders.length > 0) {
            this.endpoint = new EndpointComponent_1.OrderByEndpointComponent(new _1.OrderByQueryExecutionContext(this.documentclient, this.collectionLink, this.query, this.options, this.partitionedQueryExecutionInfo));
        }
        else {
            this.endpoint = new _1.ParallelQueryExecutionContext(this.documentclient, this.collectionLink, this.query, this.options, this.partitionedQueryExecutionInfo);
        }
        const aggregates = _1.PartitionedQueryExecutionContextInfoParser.parseAggregates(partitionedQueryExecutionInfo);
        if (Array.isArray(aggregates) && aggregates.length > 0) {
            this.endpoint = new EndpointComponent_1.AggregateEndpointComponent(this.endpoint, aggregates);
        }
        const top = _1.PartitionedQueryExecutionContextInfoParser.parseTop(partitionedQueryExecutionInfo);
        if (typeof (top) === "number") {
            this.endpoint = new EndpointComponent_1.TopEndpointComponent(this.endpoint, top);
        }
    }
    nextItem() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.endpoint.nextItem();
        });
    }
    current() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.endpoint.current();
        });
    }
    hasMoreResults() {
        return this.endpoint.hasMoreResults();
    }
    fetchMore() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this.endpoint.fetchMore === "function") {
                return this.endpoint.fetchMore();
            }
            else {
                this.fetchBuffer = [];
                this.fetchMoreRespHeaders = _1.HeaderUtils.getInitialHeader();
                return this._fetchMoreImplementation();
            }
        });
    }
    _fetchMoreImplementation() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { result: item, headers } = yield this.endpoint.nextItem();
                if (item === undefined) {
                    if (this.fetchBuffer.length === 0) {
                        return { result: undefined, headers: this.fetchMoreRespHeaders };
                    }
                    else {
                        const temp = this.fetchBuffer;
                        this.fetchBuffer = [];
                        return { result: temp, headers: this.fetchMoreRespHeaders };
                    }
                }
                else {
                    this.fetchBuffer.push(item);
                    if (this.fetchBuffer.length >= this.pageSize) {
                        const temp = this.fetchBuffer.slice(0, this.pageSize);
                        this.fetchBuffer = this.fetchBuffer.splice(this.pageSize);
                        return { result: temp, headers: this.fetchMoreRespHeaders };
                    }
                    else {
                        return this._fetchMoreImplementation();
                    }
                }
            }
            catch (err) {
                _1.HeaderUtils.mergeHeaders(this.fetchMoreRespHeaders, err.headers);
                err.headers = this.fetchMoreRespHeaders;
                if (err) {
                    throw err;
                }
            }
        });
    }
}
PipelinedQueryExecutionContext.DEFAULT_PAGE_SIZE = 10;
exports.PipelinedQueryExecutionContext = PipelinedQueryExecutionContext;
//# sourceMappingURL=pipelinedQueryExecutionContext.js.map