export interface PartitionedQueryExecutionContextInfo {
    [key: string]: any;
}
export declare class PartitionedQueryExecutionContextInfoParser {
    static parseRewrittenQuery(partitionedQueryExecutionInfo: {
        [key: string]: any;
    }): any;
    static parseQueryRanges(partitionedQueryExecutionInfo: {
        [key: string]: any;
    }): any;
    static parseOrderBy(partitionedQueryExecutionInfo: {
        [key: string]: any;
    }): any;
    static parseAggregates(partitionedQueryExecutionInfo: {
        [key: string]: any;
    }): any;
    static parseTop(partitionedQueryExecutionInfo: {
        [key: string]: any;
    }): any;
    private static _extract(partitionedQueryExecutionInfo, path);
}
