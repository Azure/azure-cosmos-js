import { Response } from "../../request";
import { IExecutionContext } from "../IExecutionContext";
import { IEndpointComponent } from "./IEndpointComponent";
export declare class TopEndpointComponent implements IEndpointComponent {
    private executionContext;
    private topCount;
    constructor(executionContext: IExecutionContext, topCount: number);
    nextItem(): Promise<Response<any>>;
    current(): Promise<Response<any>>;
    hasMoreResults(): boolean;
}
