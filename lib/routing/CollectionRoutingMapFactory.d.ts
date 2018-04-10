import { InMemoryCollectionRoutingMap } from ".";
export declare class CollectionRoutingMapFactory {
    static createCompleteRoutingMap(partitionKeyRangeInfoTuppleList: any[], collectionUniqueId: string): InMemoryCollectionRoutingMap;
    private static _isCompleteSetOfRange(partitionKeyOrderedRange);
}
