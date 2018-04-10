"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const util = require("util");
const PartitionedQueryContants = {
    QueryInfoPath: "queryInfo",
    TopPath: ["queryInfo", "top"],
    OrderByPath: ["queryInfo", "orderBy"],
    AggregatePath: ["queryInfo", "aggregates"],
    QueryRangesPath: "queryRanges",
    RewrittenQueryPath: ["queryInfo", "rewrittenQuery"],
};
class PartitionedQueryExecutionContextInfoParser {
    static parseRewrittenQuery(partitionedQueryExecutionInfo) {
        return this._extract(partitionedQueryExecutionInfo, PartitionedQueryContants.RewrittenQueryPath);
    }
    static parseQueryRanges(partitionedQueryExecutionInfo) {
        return this._extract(partitionedQueryExecutionInfo, PartitionedQueryContants.QueryRangesPath);
    }
    static parseOrderBy(partitionedQueryExecutionInfo) {
        return this._extract(partitionedQueryExecutionInfo, PartitionedQueryContants.OrderByPath);
    }
    static parseAggregates(partitionedQueryExecutionInfo) {
        return this._extract(partitionedQueryExecutionInfo, PartitionedQueryContants.AggregatePath);
    }
    static parseTop(partitionedQueryExecutionInfo) {
        return this._extract(partitionedQueryExecutionInfo, PartitionedQueryContants.TopPath);
    }
    static _extract(partitionedQueryExecutionInfo, path) {
        let item = partitionedQueryExecutionInfo;
        if (typeof path === "string") {
            return item[path];
        }
        assert.ok(Array.isArray(path), util.format("%s is expected to be an array", JSON.stringify(path)));
        for (const p of path) {
            item = item[p];
            if (item === undefined) {
                return;
            }
        }
        return item;
    }
}
exports.PartitionedQueryExecutionContextInfoParser = PartitionedQueryExecutionContextInfoParser;
//# sourceMappingURL=partitionedQueryExecutionContextInfoParser.js.map