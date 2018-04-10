import { Response } from "../../request";
import { IExecutionContext } from "../IExecutionContext";
import { IEndpointComponent } from "./IEndpointComponent";
export declare class OrderByEndpointComponent implements IEndpointComponent {
    private executionContext;
    constructor(executionContext: IExecutionContext);
    nextItem(): Promise<Response<any>>;
    current(): Promise<Response<any>>;
    hasMoreResults(): boolean;
}
