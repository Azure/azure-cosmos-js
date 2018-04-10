export declare class QueryRange {
    min: string;
    max: string;
    isMinInclusive: boolean;
    isMaxInclusive: boolean;
    constructor(rangeMin: string, rangeMax: string, isMinInclusive: boolean, isMaxInclusive: boolean);
    overlaps(other: QueryRange): boolean;
    isEmpty(): boolean;
    static parsePartitionKeyRange(partitionKeyRange: any): QueryRange;
    static parseFromDict(queryRangeDict: any): QueryRange;
}
