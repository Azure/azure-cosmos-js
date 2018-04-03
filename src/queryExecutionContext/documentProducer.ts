import * as assert from "assert";
import { FetchFunctionCallback, SqlQuerySpec } from ".";
import { Constants, StatusCodes, SubStatusCodes } from "../common";
import { DocumentClient } from "../documentclient";
import { DefaultQueryExecutionContext } from "./defaultQueryExecutionContext";
import { FetchResult, FetchResultType } from "./FetchResult";
import { HeaderUtils, IHeaders } from "./headerUtils";

const HttpHeaders = Constants;

enum DocumentProducerStates {
    started = "started",
    inProgress = "inProgress",
    ended = "ended",
}

export class DocumentProducer {
    // // Static Members
    // STATES: Object.freeze({ started: "started", inProgress: "inProgress", ended: "ended" })
    private static readonly STATES = DocumentProducerStates;
    private documentclient: any; // TODO: any documentclient
    private collectionLink: string;
    private query: string | SqlQuerySpec;
    public targetPartitionKeyRange: any; // TODO: any partitionkeyrange
    public fetchResults: FetchResult[];
    private state: DocumentProducerStates;
    public allFetched: boolean;
    private err: Error;
    public previousContinuationToken: string;
    public continuationToken: string;
    private respHeaders: IHeaders;
    private internalExecutionContext: DefaultQueryExecutionContext;

    /**
     * Provides the Target Partition Range Query Execution Context.
     * @constructor DocumentProducer
     * @param {DocumentClient} documentclient        - The service endpoint to use to create the client.
     * @param {String} collectionLink                - Represents collection link
     * @param {SqlQuerySpec | string} query          - A SQL query.
     * @param {object} targetPartitionKeyRange       - Query Target Partition key Range
     * @ignore
     */
    constructor(
        documentclient: DocumentClient, // TODO: any documentclient
        collectionLink: string,
        query: SqlQuerySpec,
        targetPartitionKeyRange: any, // TODO: any partition key range
        options: any) { // TODO: any options
        this.documentclient = documentclient;
        this.collectionLink = collectionLink;
        this.query = query;
        this.targetPartitionKeyRange = targetPartitionKeyRange;
        this.fetchResults = [];

        this.state = DocumentProducer.STATES.started;
        this.allFetched = false;
        this.err = undefined;

        this.previousContinuationToken = undefined;
        this.continuationToken = undefined;
        this.respHeaders = HeaderUtils.getInitialHeader();

        const isNameBased = Base.isLinkNameBased(collectionLink);
        const path = this.documentclient.getPathFromLink(collectionLink, "docs", isNameBased);
        const id = this.documentclient.getIdFromLink(collectionLink, isNameBased);

        // tslint:disable-next-line:no-shadowed-variable
        const fetchFunction: FetchFunctionCallback = (options: any) => { // TODO: any
            return new Promise((resolve, reject) => {
                const callback = (err: Error, results: [any, IHeaders]) => {
                    if (err) { return reject(err); }
                    resolve(results);
                };
                this.documentclient.queryFeed.call(documentclient, // TODO: Promisify
                    documentclient,
                    path,
                    "docs",
                    id,
                    (result: any) => result.Documents, // TODO: any
                    (parent: any, body: any) => body, // TODO: any
                    query,
                    options,
                    callback,
                    this.targetPartitionKeyRange["id"]);
            });

        };
        this.internalExecutionContext = new DefaultQueryExecutionContext(documentclient, query, options, fetchFunction);
        this.state = DocumentProducer.STATES.inProgress;
    }
    /**
     * Synchronously gives the contiguous buffered results (stops at the first non result) if any
     * @returns {Object}       - buffered current items if any
     * @ignore
     */
    public peekBufferedItems() {
        const bufferedResults = [];
        for (let i = 0, done = false; i < this.fetchResults.length && !done; i++) {
            const fetchResult = this.fetchResults[i];
            switch (fetchResult.fetchResultType) {
                case FetchResultType.Done:
                    done = true;
                    break;
                case FetchResultType.Exception:
                    done = true;
                    break;
                case FetchResultType.Result:
                    bufferedResults.push(fetchResult.feedResponse);
                    break;
            }
        }
        return bufferedResults;
    }

    public hasMoreResults() {
        return this.internalExecutionContext.hasMoreResults() || this.fetchResults.length !== 0;
    }

    public gotSplit() {
        const fetchResult = this.fetchResults[0];
        if (fetchResult.fetchResultType === FetchResultType.Exception) {
            if (DocumentProducer._needPartitionKeyRangeCacheRefresh(fetchResult.error)) {
                return true;
            }
        }

        return false;
    }

    // no one calls this and it doesn't work, so I'm going to remove it. (Chris A)
    // /**
    //  * Synchronously gives the buffered items if any and moves inner indices.
    //  * @returns {Object}       - buffered current items if any
    //  * @ignore
    //  */
    // public consumeBufferedItems() {
    //     // I don't think this method works...
    //     throw new Error("Not yet implemented");
    //     // const res = this._getBufferedResults(); // _getBufferedResults doesn't exist
    //     // this.fetchResults = [];
    //     // this._updateStates(undefined, this.continuationToken === null || this.continuationToken === undefined);
    //     // return res;
    // }

    private _getAndResetActiveResponseHeaders() {
        const ret = this.respHeaders;
        this.respHeaders = HeaderUtils.getInitialHeader();
        return ret;
    }

    private _updateStates(err: any, allFetched: boolean) { // TODO: any Error
        if (err) {
            this.state = DocumentProducer.STATES.ended;
            this.err = err;
            return;
        }
        if (allFetched) {
            this.allFetched = true;
        }
        if (this.allFetched && this.peekBufferedItems().length === 0) {
            this.state = DocumentProducer.STATES.ended;
        }
        if (this.internalExecutionContext.continuation === this.continuationToken) {
            // nothing changed
            return;
        }
        this.previousContinuationToken = this.continuationToken;
        this.continuationToken = this.internalExecutionContext.continuation;
    }

    private static _needPartitionKeyRangeCacheRefresh(error: any) { // TODO: error
        return (error.code === StatusCodes.Gone)
            && ("substatus" in error)
            && (error["substatus"] === SubStatusCodes.PartitionKeyRangeGone);
    }

    /**
     * Fetches and bufferes the next page of results and executes the given callback
     * @memberof DocumentProducer
     * @instance
     * @param {callback} callback - Function to execute for next page of result.
     *                              the function takes three parameters error, resources, headerResponse.
     */
    public async bufferMore() {
        if (this.err) {
            throw this.err;
        }

        try {
            const [resources, headerResponse] = await this.internalExecutionContext.fetchMore();
            this._updateStates(undefined, resources === undefined);
            if (resources !== undefined) {
                // some more results
                resources.forEach((element: any) => { // TODO: resources any
                    this.fetchResults.push(new FetchResult(element, undefined));
                });
            }

            return [resources, headerResponse];
        } catch (err) { // TODO: any error
            if (DocumentProducer._needPartitionKeyRangeCacheRefresh(err)) {
                // Split just happend
                // Buffer the error so the execution context can still get the feedResponses in the itemBuffer
                const bufferedError = new FetchResult(undefined, err);
                this.fetchResults.push(bufferedError);
                // Putting a dummy result so that the rest of code flows
                return [[bufferedError], err.headers];
            } else {
                this._updateStates(err, err.resources === undefined);
                throw err;
            }
        }
    }

    /**
     * Synchronously gives the bufferend current item if any
     * @returns {Object}       - buffered current item if any
     * @ignore
     */
    public getTargetParitionKeyRange() {
        return this.targetPartitionKeyRange;
    }

    /**
     * Execute a provided function on the next element in the DocumentProducer.
     * @memberof DocumentProducer
     * @instance
     * @param {callback} callback - Function to execute for each element. the function \
     * takes two parameters error, element.
     */
    public async nextItem() {
        if (this.err) {
            this._updateStates(this.err, undefined);
            throw this.err;
        }

        try {
            const [item, headers] = await this.current();

            const fetchResult = this.fetchResults.shift();
            this._updateStates(undefined, item === undefined);
            assert.equal(fetchResult.feedResponse, item);
            switch (fetchResult.fetchResultType) {
                case FetchResultType.Done:
                    return [undefined, headers];
                case FetchResultType.Exception:
                    fetchResult.error.headers = headers;
                    throw fetchResult.error;
                case FetchResultType.Result:
                    return [fetchResult.feedResponse, headers];
            }
        } catch (err) {
            this._updateStates(err, err.item === undefined);
            throw err;
        }
    }

    /**
     * Retrieve the current element on the DocumentProducer.
     * @memberof DocumentProducer
     * @instance
     * @param {callback} callback - Function to execute for the current element. \
     * the function takes two parameters error, element.
     */
    public async current(): Promise<[any, IHeaders]> {
        // If something is buffered just give that
        if (this.fetchResults.length > 0) {
            const fetchResult = this.fetchResults[0];
            // Need to unwrap fetch results
            switch (fetchResult.fetchResultType) {
                case FetchResultType.Done:
                    return [undefined, this._getAndResetActiveResponseHeaders()];
                case FetchResultType.Exception:
                    fetchResult.error.headers = this._getAndResetActiveResponseHeaders();
                    throw fetchResult.error;
                case FetchResultType.Result:
                    return [fetchResult.feedResponse, this._getAndResetActiveResponseHeaders()];
            }
        }

        // If there isn't anymore items left to fetch then let the user know.
        if (this.allFetched) {
            return [undefined, this._getAndResetActiveResponseHeaders()];
        }

        // If there are no more bufferd items and there are still items to be fetched then buffer more
        try {
            const [items, headers] = await this.bufferMore();
            if (items === undefined) {
                return [undefined, headers];
            }
            HeaderUtils.mergeHeaders(this.respHeaders, headers);

            return this.current();
        } catch (err) {
            throw err;
        }
    }
}
