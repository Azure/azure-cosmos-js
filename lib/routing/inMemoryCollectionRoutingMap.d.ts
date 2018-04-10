import { QueryRange } from "./QueryRange";
export declare class InMemoryCollectionRoutingMap {
    private rangeById;
    private rangeByInfo;
    private orderedPartitionKeyRanges;
    private orderedRanges;
    private orderedPartitionInfo;
    private collectionUniqueId;
    constructor(rangeById: string, rangeByInfo: string, orderedPartitionKeyRanges: any[], orderedPartitionInfo: any, collectionUniqueId: string);
    getOrderedParitionKeyRanges(): any[];
    getRangeByEffectivePartitionKey(effectivePartitionKeyValue: string): any;
    private static _vbCompareFunction(x, y);
    private getRangeByPartitionKeyRangeId(partitionKeyRangeId);
    getOverlappingRanges(providedQueryRanges: QueryRange | QueryRange[]): any[];
}
