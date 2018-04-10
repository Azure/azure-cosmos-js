import { IAggregator } from "./IAggregator";
export declare class SumAggregator implements IAggregator<number> {
    sum: number;
    aggregate(other: number): void;
    getResult(): number;
}
