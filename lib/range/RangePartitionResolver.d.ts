import { CompareFunction, Range } from ".";
import { Document, PartitionKey } from "../documents";
export declare type PartitionKeyExtractorFunction = (obj: object) => PartitionKey;
export declare type PartitionKeyExtractor = string | PartitionKeyExtractorFunction;
export interface PartitionKeyMapItem {
    range: Range;
    link: string;
}
export declare class RangePartitionResolver {
    private partitionKeyExtractor;
    private partitionKeyMap;
    private compareFunction;
    constructor(partitionKeyExtractor: PartitionKeyExtractor, partitionKeyMap: PartitionKeyMapItem[], compareFunction?: CompareFunction);
    getPartitionKey(document: Document): PartitionKey;
    resolveForCreate(partitionKey: PartitionKey): string;
    resolveForRead(partitionKey: PartitionKey): any[];
    private _getFirstContainingMapEntryOrNull(point);
    private _getIntersectingMapEntries(partitionKey);
}
