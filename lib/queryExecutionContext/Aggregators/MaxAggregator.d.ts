import { IAggregator } from "./IAggregator";
export declare class MaxAggregator implements IAggregator<number> {
    private value;
    private comparer;
    constructor();
    aggregate(other: number): void;
    getResult(): number;
}
