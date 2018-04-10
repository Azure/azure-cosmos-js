import { DocumentClient } from "./documentclient";
import { FetchFunctionCallback, IHeaders, SqlQuerySpec } from "./queryExecutionContext";
import { Response } from "./request";
export declare type QueryIteratorCallback = (err: any, elements?: any, headers?: IHeaders) => boolean | void;
export declare class QueryIterator {
    private documentclient;
    private query;
    private options;
    private fetchFunctions;
    private resourceLink;
    private toArrayTempResources;
    private toArrayLastResHeaders;
    private queryExecutionContext;
    constructor(documentclient: DocumentClient, query: SqlQuerySpec | string, options: any, fetchFunctions: FetchFunctionCallback | FetchFunctionCallback[], resourceLink?: string | string[]);
    forEach(callback: QueryIteratorCallback): void;
    nextItem(callback?: QueryIteratorCallback): Promise<Response<any>>;
    current(callback?: QueryIteratorCallback): Promise<Response<any>>;
    hasMoreResults(): boolean;
    toArray(callback?: QueryIteratorCallback): Promise<Response<any>>;
    executeNext(callback?: QueryIteratorCallback): Promise<Response<any>>;
    reset(): void;
    private _toArrayImplementation();
    private _forEachImplementation(callback);
    private _createQueryExecutionContext();
}
