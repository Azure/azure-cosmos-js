import { IExecutionContext, PartitionedQueryExecutionContextInfo } from ".";
import { DocumentClient } from "../documentclient";
import { Response } from "../request";
export declare class PipelinedQueryExecutionContext implements IExecutionContext {
    private documentclient;
    private collectionLink;
    private query;
    private options;
    private partitionedQueryExecutionInfo;
    private fetchBuffer;
    private fetchMoreRespHeaders;
    private endpoint;
    private pageSize;
    private static DEFAULT_PAGE_SIZE;
    constructor(documentclient: DocumentClient, collectionLink: string, query: any, options: any, partitionedQueryExecutionInfo: PartitionedQueryExecutionContextInfo);
    nextItem(): Promise<Response<any>>;
    current(): Promise<Response<any>>;
    hasMoreResults(): boolean;
    fetchMore(): Promise<Response<any>>;
    private _fetchMoreImplementation();
}
