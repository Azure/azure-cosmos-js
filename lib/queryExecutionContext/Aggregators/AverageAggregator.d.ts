import { IAggregator } from "./IAggregator";
export interface IAverageAggregator {
    sum: number;
    count: number;
}
export declare class AverageAggregator implements IAverageAggregator, IAggregator<IAverageAggregator> {
    sum: number;
    count: number;
    aggregate(other: IAverageAggregator): void;
    getResult(): number;
}
