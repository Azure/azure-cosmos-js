import { Response } from "../../request";
import { IExecutionContext } from "../IExecutionContext";
import { IEndpointComponent } from "./IEndpointComponent";
export declare class AggregateEndpointComponent implements IEndpointComponent {
    private executionContext;
    private toArrayTempResources;
    private aggregateValues;
    private aggregateValuesIndex;
    private localAggregators;
    constructor(executionContext: IExecutionContext, aggregateOperators: string[]);
    private _getAggregateResult();
    _getQueryResults(): Promise<Response<any>>;
    nextItem(): Promise<Response<any>>;
    current(): Promise<Response<any>>;
    hasMoreResults(): boolean;
}
