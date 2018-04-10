import { InMemoryCollectionRoutingMap, QueryRange } from "./";
export declare class PartitionKeyRangeCache {
    private documentclient;
    private collectionRoutingMapByCollectionId;
    private sem;
    constructor(documentclient: any);
    onCollectionRoutingMap(collectionLink: string): Promise<InMemoryCollectionRoutingMap>;
    getOverlappingRanges(collectionLink: string, queryRanges: QueryRange): Promise<any[]>;
}
