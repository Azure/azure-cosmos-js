import { QueryRange } from "./";
export declare const PARITIONKEYRANGE: {
    MinInclusive: string;
    MaxExclusive: string;
    Id: string;
};
export declare class SmartRoutingMapProvider {
    private partitionKeyRangeCache;
    constructor(documentclient: any);
    private static _secondRangeIsAfterFirstRange(range1, range2);
    private static _isSortedAndNonOverlapping(ranges);
    private static _stringMax(a, b);
    private static _stringCompare(a, b);
    private static _subtractRange(r, partitionKeyRange);
    getOverlappingRanges(collectionLink: string, sortedRanges: QueryRange[]): Promise<any[]>;
}
