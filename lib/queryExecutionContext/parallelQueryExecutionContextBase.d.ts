import { DocumentProducer, IExecutionContext, PartitionedQueryExecutionContextInfo } from ".";
import { DocumentClient } from "../documentclient";
import { Response } from "../request";
export declare enum ParallelQueryExecutionContextBaseStates {
    started = "started",
    inProgress = "inProgress",
    ended = "ended",
}
export declare abstract class ParallelQueryExecutionContextBase implements IExecutionContext {
    private documentclient;
    private collectionLink;
    private query;
    private options;
    private partitionedQueryExecutionInfo;
    private static readonly DEFAULT_PAGE_SIZE;
    private err;
    private state;
    private static STATES;
    private routingProvider;
    protected sortOrders: any;
    private pageSize;
    private requestContinuation;
    private respHeaders;
    private orderByPQ;
    private sem;
    private waitingForInternalExecutionContexts;
    constructor(documentclient: DocumentClient, collectionLink: string, query: any, options: any, partitionedQueryExecutionInfo: PartitionedQueryExecutionContextInfo);
    protected abstract documentProducerComparator(dp1: DocumentProducer, dp2: DocumentProducer): number;
    getPartitionKeyRangesForContinuation(suppliedCompositeContinuationToken: any, partitionKeyRanges: any): any;
    private _decrementInitiationLock();
    private _mergeWithActiveResponseHeaders(headers);
    private _getAndResetActiveResponseHeaders();
    private _onTargetPartitionRanges();
    private _getReplacementPartitionKeyRanges(documentProducer);
    private _repairExecutionContext(originFunction);
    private static _needPartitionKeyRangeCacheRefresh(error);
    private _repairExecutionContextIfNeeded(ifCallback, elseCallback);
    nextItem(): Promise<Response<any>>;
    current(): Promise<Response<any>>;
    hasMoreResults(): boolean;
    private _createTargetPartitionQueryExecutionContext(partitionKeyTargetRange, continuationToken?);
}
