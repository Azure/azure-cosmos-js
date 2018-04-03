import * as assert from "assert";
import {
    HeaderUtils,
    IExecutionContext,
    IHeaders,
    OrderByQueryExecutionContext,
    ParallelQueryExecutionContext,
    PartitionedQueryExecutionContextInfo,
    PartitionedQueryExecutionContextInfoParser,
} from ".";
import { DocumentClient } from "../documentclient";
import {
    AggregateEndpointComponent,
    IEndpointComponent,
    OrderByEndpointComponent,
    TopEndpointComponent,
} from "./EndpointComponent";

export class PipelinedQueryExecutionContext implements IExecutionContext {
    private fetchBuffer: any[];
    private fetchMoreRespHeaders: IHeaders;
    private endpoint: IEndpointComponent;
    private pageSize: number;
    private static DEFAULT_PAGE_SIZE = 10;
    /**
     * Provides the PipelinedQueryExecutionContext. It piplelines top and orderby execution context if necessary
     * @constructor PipelinedQueryExecutionContext
     * @param {object} documentclient                - The documentclient object.
     * @param {SqlQuerySpec | string} query          - A SQL query.
     * @param {FeedOptions} options                  - Represents the feed options.
     * @param {callback | callback[]} fetchFunctions - A function to retrieve each page of data. \
     * An array of functions may be used to query more than one partition.
     * @param {string} [resourceLink]                - collectionLink for parallelized query execution.
     * @ignore
     */
    constructor(
        private documentclient: DocumentClient,
        private collectionLink: string,
        private query: any, // TODO: any query
        private options: any, // TODO: any options
        private partitionedQueryExecutionInfo: PartitionedQueryExecutionContextInfo) {
        this.endpoint = null;
        this.pageSize = options["maxItemCount"];
        if (this.pageSize === undefined) {
            this.pageSize = PipelinedQueryExecutionContext.DEFAULT_PAGE_SIZE;
        }

        // Pick between parallel vs order by execution context
        const sortOrders = PartitionedQueryExecutionContextInfoParser.parseOrderBy(partitionedQueryExecutionInfo);
        if (Array.isArray(sortOrders) && sortOrders.length > 0) {
            // Need to wrap orderby execution context in endpoint component, since the data is nested as a \
            //      "payload" property.
            this.endpoint = new OrderByEndpointComponent(
                new OrderByQueryExecutionContext(
                    this.documentclient,
                    this.collectionLink,
                    this.query,
                    this.options,
                    this.partitionedQueryExecutionInfo));
        } else {
            this.endpoint = new ParallelQueryExecutionContext(
                this.documentclient,
                this.collectionLink,
                this.query,
                this.options,
                this.partitionedQueryExecutionInfo);
        }

        // If aggregate then add that to the pipeline
        const aggregates = PartitionedQueryExecutionContextInfoParser.parseAggregates(partitionedQueryExecutionInfo);
        if (Array.isArray(aggregates) && aggregates.length > 0) {
            this.endpoint = new AggregateEndpointComponent(this.endpoint, aggregates);
        }

        // If top then add that to the pipeline
        const top = PartitionedQueryExecutionContextInfoParser.parseTop(partitionedQueryExecutionInfo);
        if (typeof (top) === "number") {
            this.endpoint = new TopEndpointComponent(this.endpoint, top);
        }
    }

    public async nextItem() {
        return this.endpoint.nextItem();
    }

    public async current() {
        return this.endpoint.current();
    }

    // Removed callback here beacuse it wouldn't have ever worked...
    public hasMoreResults() {
        return this.endpoint.hasMoreResults();
    }

    public async fetchMore() {
        // if the wrapped endpoint has different implementation for fetchMore use that
        // otherwise use the default implementation
        if (typeof this.endpoint.fetchMore === "function") {
            return this.endpoint.fetchMore();
        } else {
            this.fetchBuffer = [];
            this.fetchMoreRespHeaders = HeaderUtils.getInitialHeader();
            return this._fetchMoreImplementation();
        }
    }

    private async _fetchMoreImplementation(): Promise<[any, IHeaders]> {
        try {
            const [item, headers] = await this.endpoint.nextItem();
            if (item === undefined) {
                // no more results
                if (this.fetchBuffer.length === 0) {
                    return [undefined, this.fetchMoreRespHeaders];
                } else {
                    // Just give what we have
                    const temp = this.fetchBuffer;
                    this.fetchBuffer = [];
                    return [temp, this.fetchMoreRespHeaders];
                }
            } else {
                // append the result
                this.fetchBuffer.push(item);
                if (this.fetchBuffer.length >= this.pageSize) {
                    // fetched enough results
                    const temp = this.fetchBuffer.slice(0, this.pageSize);
                    this.fetchBuffer = this.fetchBuffer.splice(this.pageSize);
                    return [temp, this.fetchMoreRespHeaders];
                } else {
                    // recursively fetch more
                    // TODO: is recursion a good idea?
                    return this._fetchMoreImplementation();
                }
            }
        } catch (err) {
            HeaderUtils.mergeHeaders(this.fetchMoreRespHeaders, err.headers);
            err.headers = this.fetchMoreRespHeaders;
            if (err) {
               throw err;
            }
        }
    }
}
