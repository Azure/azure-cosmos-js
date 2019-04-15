/// <reference lib="esnext.asynciterable" />
import { ClientContext } from "./ClientContext";
import { StatusCodes, SubStatusCodes } from "./common";
import {
  CosmosHeaders,
  DefaultQueryExecutionContext,
  FetchFunctionCallback,
  getInitialHeader,
  IExecutionContext,
  mergeHeaders,
  PipelinedQueryExecutionContext,
  SqlQuerySpec
} from "./queryExecutionContext";
import { ErrorResponse, PartitionedQueryExecutionInfo } from "./request/ErrorResponse";
import { FeedOptions } from "./request/FeedOptions";
import { FeedResponse } from "./request/FeedResponse";

/**
 * Represents a QueryIterator Object, an implmenetation of feed or query response that enables
 * traversal and iterating over the response
 * in the Azure Cosmos DB database service.
 */
export class QueryIterator<T> {
  private fetchAllTempResources: T[]; // TODO
  private fetchAllLastResHeaders: CosmosHeaders;
  private queryExecutionContext: IExecutionContext;
  /**
   * @hidden
   */
  constructor(
    private clientContext: ClientContext,
    private query: SqlQuerySpec | string,
    private options: FeedOptions,
    private fetchFunctions: FetchFunctionCallback | FetchFunctionCallback[],
    private resourceLink?: string
  ) {
    this.query = query;
    this.fetchFunctions = fetchFunctions;
    this.options = options;
    this.resourceLink = resourceLink;
    this.fetchAllLastResHeaders = getInitialHeader();
    this.reset();
  }

  /**
   * Calls a specified callback for each item returned from the query.
   * Runs serially; each callback blocks the next.
   *
   * @param callback Specified callback.
   * First param is the result,
   * second param (optional) is the current headers object state,
   * third param (optional) is current index.
   * No more callbacks will be called if one of them results false.
   *
   * @returns Promise<void> - you should await or .catch the Promise in case there are any errors
   *
   * @example Iterate over all databases
   * ```typescript
   * await client.databases.readAll().forEach((db, headers, index) => {
   *   console.log(`Got ${db.id} from forEach`);
   * })
   * ```
   */
  public async forEach(
    callback: (result: T, headers?: CosmosHeaders, index?: number) => boolean | void
  ): Promise<void> {
    this.reset();
    let index = 0;
    while (this.queryExecutionContext.hasMoreResults()) {
      const result = await this.executeMethod("nextItem");
      if (result.result === undefined) {
        return;
      }
      if (callback(result.result, result.headers, index) === false) {
        return;
      } else {
        ++index;
      }
    }
  }

  /**
   * Gets an async iterator that will yield results until completion.
   *
   * NOTE: AsyncIterators are a very new feature and you might need to
   * use polyfils/etc. in order to use them in your code.
   *
   * If you're using TypeScript, you can use the following polyfill as long
   * as you target ES6 or higher and are running on Node 6 or higher.
   *
   * ```typescript
   * if (!Symbol || !Symbol.asyncIterator) {
   *   (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
   * }
   * ```
   *
   * @see QueryIterator.forEach for very similar functionality.
   *
   * @example Iterate over all databases
   * ```typescript
   * for await(const {result: db} in client.databases.readAll().getAsyncIterator()) {
   *   console.log(`Got ${db.id} from AsyncIterator`);
   * }
   * ```
   */
  public async *getAsyncIterator(): AsyncIterable<FeedResponse<T>> {
    this.reset();
    while (this.queryExecutionContext.hasMoreResults()) {
      const result = await this.executeMethod("fetchMore");
      const feedResponse = new FeedResponse<T>(
        result.result,
        result.headers,
        this.queryExecutionContext.hasMoreResults()
      );
      if (result.result === undefined) {
        return;
      }
      yield feedResponse;
    }
  }

  /**
   * Determine if there are still remaining resources to processs based on the value of the continuation token or the\
   * elements remaining on the current batch in the QueryIterator.
   * @returns {Boolean} true if there is other elements to process in the QueryIterator.
   */
  public hasMoreResults(): boolean {
    return this.queryExecutionContext.hasMoreResults();
  }

  /**
   * Fetch all pages for the query and return a single FeedResponse.
   */

  public async fetchAll(): Promise<FeedResponse<T>> {
    this.reset();
    this.fetchAllTempResources = [];
    return this.toArrayImplementation();
  }

  /**
   * Retrieve the next batch from the feed.
   *
   * This may or may not fetch more pages from the backend depending on your settings
   * and the type of query. Aggregate queries will generally fetch all backend pages
   * before returning the first batch of responses.
   */
  public async fetchNext(): Promise<FeedResponse<T>> {
    const response = await this.executeMethod("fetchMore");
    return new FeedResponse<T>(response.result, response.headers, this.queryExecutionContext.hasMoreResults());
  }

  /**
   * Reset the QueryIterator to the beginning and clear all the resources inside it
   */
  public reset() {
    this.queryExecutionContext = new DefaultQueryExecutionContext(this.options, this.fetchFunctions);
  }

  private async toArrayImplementation(): Promise<FeedResponse<T>> {
    while (this.queryExecutionContext.hasMoreResults()) {
      const { result, headers } = await this.executeMethod("nextItem");
      // concatenate the results and fetch more
      mergeHeaders(this.fetchAllLastResHeaders, headers);

      if (result === undefined) {
        // no more results
        break;
      }

      this.fetchAllTempResources.push(result);
    }
    return new FeedResponse(
      this.fetchAllTempResources,
      this.fetchAllLastResHeaders,
      this.queryExecutionContext.hasMoreResults()
    );
  }

  private createPipelinedExecutionContext(partitionedExecutionInfo: PartitionedQueryExecutionInfo) {
    return new PipelinedQueryExecutionContext(
      this.clientContext,
      this.resourceLink,
      this.query,
      this.options,
      partitionedExecutionInfo
    );
  }

  private isPartitionedExecutionError(error: any): error is ErrorResponse {
    return (
      error.code === StatusCodes.BadRequest &&
      "substatus" in error &&
      error["substatus"] === SubStatusCodes.CrossPartitionQueryNotServable
    );
  }

  private async executeMethod(methodName: Exclude<keyof IExecutionContext, "hasMoreResults">) {
    try {
      return await this.queryExecutionContext[methodName]();
    } catch (err) {
      if (this.isPartitionedExecutionError(err)) {
        // if this's a partitioned execution info switches the execution context
        const partitionedExecutionInfo = err.body.additionalErrorInfo;
        this.queryExecutionContext = this.createPipelinedExecutionContext(partitionedExecutionInfo);
        return this.queryExecutionContext[methodName]();
      } else {
        throw err;
      }
    }
  }
}
