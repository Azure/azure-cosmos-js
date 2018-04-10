import { FetchFunctionCallback, IExecutionContext, SqlQuerySpec } from ".";
import { DocumentClient } from "../documentclient";
import { Response } from "../request";
export declare class ProxyQueryExecutionContext implements IExecutionContext {
    private documentclient;
    private query;
    private options;
    private fetchFunctions;
    private resourceLink;
    private queryExecutionContext;
    constructor(documentclient: DocumentClient, query: SqlQuerySpec | string, options: any, fetchFunctions: FetchFunctionCallback | FetchFunctionCallback[], resourceLink: string | string[]);
    nextItem(): Promise<Response<any>>;
    private _createPipelinedExecutionContext(partitionedExecutionInfo);
    current(): Promise<Response<any>>;
    hasMoreResults(): boolean;
    fetchMore(): Promise<Response<any>>;
    private _hasPartitionedExecutionInfo(error);
    private _getParitionedExecutionInfo(error);
}
