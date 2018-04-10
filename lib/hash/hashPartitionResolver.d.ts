import { Document, PartitionKey } from "../documents";
import { PartitionKeyExtractor } from "../range";
export declare class HashPartitionResolver {
    private partitionKeyExtractor;
    private consistentHashRing;
    private collectionLinks;
    constructor(partitionKeyExtractor: PartitionKeyExtractor, collectionLinks: string[], options: any);
    getPartitionKey(document: Document): any;
    resolveForRead(partitionKey: PartitionKey): any[];
    resolveForCreate(partitionKey: PartitionKey): any;
    private _resolve(partitionKey);
    private static _throwIfInvalidPartitionKeyExtractor(partitionKeyExtractor);
    private static _throwIfInvalidPartitionKey(partitionKey);
    private static _throwIfInvalidCollectionLinks(collectionLinks);
}
