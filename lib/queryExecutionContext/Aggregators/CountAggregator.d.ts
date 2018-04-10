import { IAggregator } from "./IAggregator";
export declare class CountAggregator implements IAggregator<number> {
    value: number;
    constructor();
    aggregate(other: number): void;
    getResult(): number;
}
