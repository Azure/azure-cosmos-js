import { IHeaders } from ".";
import { Base } from "../base";
import { Constants } from "../common";
import { DocumentClient } from "../documentclient";
import { SqlParameter, SqlQuerySpec } from "./SqlQuerySpec";

export type FetchFunctionCallback = (options: any) => Promise<[any, IHeaders]>;

enum STATES {
    start = "start",
    inProgress = "inProgress",
    ended = "ended",
}

export class DefaultQueryExecutionContext {
    private static readonly STATES = STATES;
    private documentclient: DocumentClient;
    private query: string | SqlQuerySpec;
    private resources: any; // TODO: any resources
    private currentIndex: number;
    private currentPartitionIndex: number;
    private fetchFunctions: FetchFunctionCallback[];
    private options: any; // TODO: any options
    public continuation: any; // TODO: any continuation
    private state: STATES;
    /**
     * Provides the basic Query Execution Context.
     * This wraps the internal logic query execution using provided fetch functions
     * @constructor DefaultQueryExecutionContext
     * @param {DocumentClient} documentclient        - The service endpoint to use to create the client.
     * @param {SqlQuerySpec | string} query          - A SQL query.
     * @param {FeedOptions} [options]                - Represents the feed options.
     * @param {callback | callback[]} fetchFunctions - A function to retrieve each page of data.
     *                          An array of functions may be used to query more than one partition.
     * @ignore
     */
    constructor(documentclient: DocumentClient,
                query: string | SqlQuerySpec,
                options: any,
                fetchFunctions: FetchFunctionCallback | FetchFunctionCallback[]) { // TODO: any options
        this.documentclient = documentclient;
        this.query = query;
        this.resources = [];
        this.currentIndex = 0;
        this.currentPartitionIndex = 0;
        this.fetchFunctions = (Array.isArray(fetchFunctions)) ? fetchFunctions : [fetchFunctions];
        this.options = options || {};
        this.continuation = this.options.continuation || null;
        this.state = DefaultQueryExecutionContext.STATES.start;
    }

    /**
     * Execute a provided callback on the next element in the execution context.
     * @memberof DefaultQueryExecutionContext
     * @instance
     */
    public async nextItem() {
        const [resources, headers] = await this.current();
        ++this.currentIndex;
        return [resources, headers];
    }

    /**
     * Retrieve the current element on the execution context.
     * @memberof DefaultQueryExecutionContext
     * @instance
     */
    public async current(): Promise<[any, IHeaders]> {
        if (this.currentIndex < this.resources.length) {
            return [this.resources[this.currentIndex], undefined];
        }

        if (this._canFetchMore()) {
            const [resources, headers] = await this.fetchMore();
            // if (err) {
            //     return callback(err, undefined, headers);
            // }
            // TODO: returning data and error is an anti-pattern

            this.resources = resources;
            if (this.resources.length === 0) {
                if (!this.continuation && this.currentPartitionIndex >= this.fetchFunctions.length) {
                    this.state = DefaultQueryExecutionContext.STATES.ended;
                    return [undefined, headers];
                } else {
                    return this.current();
                }
            }
            return [this.resources[this.currentIndex], headers];
        } else {
            this.state = DefaultQueryExecutionContext.STATES.ended;
            return [undefined, undefined];
        }
    }

    /**
     * Determine if there are still remaining resources to processs based on
     * the value of the continuation token or the elements remaining on the current batch in the execution context.
     * @memberof DefaultQueryExecutionContext
     * @instance
     * @returns {Boolean} true if there is other elements to process in the DefaultQueryExecutionContext.
     */
    public hasMoreResults() {
        return this.state === DefaultQueryExecutionContext.STATES.start
            || this.continuation !== undefined
            || this.currentIndex < this.resources.length
            || this.currentPartitionIndex < this.fetchFunctions.length;
    }

    /**
     * Fetches the next batch of the feed and pass them as an array to a callback
     * @memberof DefaultQueryExecutionContext
     * @instance
     */
    public async fetchMore() {
        if (this.currentPartitionIndex >= this.fetchFunctions.length) {
            return [];
        }

        // Keep to the original continuation and to restore the value after fetchFunction call
        const originalContinuation = this.options.continuation;
        this.options.continuation = this.continuation;

        // Return undefined if there is no more results
        if (this.currentPartitionIndex >= this.fetchFunctions.length) {
            return [];
        }

        const fetchFunction = this.fetchFunctions[this.currentPartitionIndex];
        let resources;
        let responseHeaders;
        try {
            [resources, responseHeaders] = await fetchFunction(this.options);
        } catch (err) {
            this.state = DefaultQueryExecutionContext.STATES.ended;
            // return callback(err, undefined, responseHeaders);
            // TODO: Error and data being returned is an antipattern, this might broken
            throw err;
        }

        this.continuation = responseHeaders[Constants.HttpHeaders.Continuation];
        if (!this.continuation) {
            ++this.currentPartitionIndex;
        }

        this.state = DefaultQueryExecutionContext.STATES.inProgress;
        this.currentIndex = 0;
        this.options.continuation = originalContinuation;
        return [resources, responseHeaders];
    }

    private _canFetchMore() {
        const res = (this.state === DefaultQueryExecutionContext.STATES.start
            || (this.continuation && this.state === DefaultQueryExecutionContext.STATES.inProgress)
            || (this.currentPartitionIndex < this.fetchFunctions.length
                && this.state === DefaultQueryExecutionContext.STATES.inProgress));
        return res;
    }
}
