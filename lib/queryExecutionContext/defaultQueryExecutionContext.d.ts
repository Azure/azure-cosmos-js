import { IExecutionContext } from ".";
import { DocumentClient } from "../documentclient";
import { Response } from "../request";
import { SqlQuerySpec } from "./SqlQuerySpec";
export declare type FetchFunctionCallback = (options: any) => Promise<Response<any>>;
export declare class DefaultQueryExecutionContext implements IExecutionContext {
    private static readonly STATES;
    private documentclient;
    private query;
    private resources;
    private currentIndex;
    private currentPartitionIndex;
    private fetchFunctions;
    private options;
    continuation: any;
    private state;
    constructor(documentclient: DocumentClient, query: string | SqlQuerySpec, options: any, fetchFunctions: FetchFunctionCallback | FetchFunctionCallback[]);
    nextItem(): Promise<Response<any>>;
    current(): Promise<Response<any>>;
    hasMoreResults(): boolean;
    fetchMore(): Promise<Response<any>>;
    private _canFetchMore();
}
