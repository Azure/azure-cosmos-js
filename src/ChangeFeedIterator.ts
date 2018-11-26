/// <reference lib="esnext.asynciterable" />
import { isNumber } from "util";
import { ChangeFeedOptions } from "./ChangeFeedOptions";
import { Resource } from "./client";
import { ClientContext } from "./ClientContext";
import { Constants, ResourceType, StatusCodes } from "./common";
import { FeedOptions } from "./request";
import { Response } from "./request";

export class ChangeFeedIterator<T> {
  private static readonly IfNoneMatchAllHeaderValue = "*";
  private nextIfNoneMatch: string;
  private ifModifiedSince: string;
  private lastStatusCode: number;
  private isPartitionSpecified: boolean;

  constructor(
    private clientContext: ClientContext,
    private resourceId: string,
    private resourceLink: string,
    private isPartitionedContainer: () => Promise<boolean>,
    private changeFeedOptions: ChangeFeedOptions
  ) {
    // partition key XOR partition key range id
    const partitionKeyValid = changeFeedOptions.partitionKey !== undefined;
    const partitionKeyRangeIdValid = !(
      changeFeedOptions.partitionKeyRangeId === null ||
      changeFeedOptions.partitionKeyRangeId === undefined ||
      changeFeedOptions.partitionKeyRangeId === ""
    );
    if (partitionKeyValid && partitionKeyRangeIdValid) {
      throw new Error(
        "PartitionKey and PartitionKeyRangeId cannot be specified at the same time in ChangeFeedOptions."
      );
    }

    this.isPartitionSpecified = partitionKeyRangeIdValid || partitionKeyValid;

    let canUseStartFromBeginning = true;
    if (changeFeedOptions.requestContinuation) {
      this.nextIfNoneMatch = changeFeedOptions.requestContinuation;
      canUseStartFromBeginning = false;
    }

    if (changeFeedOptions.startTime) {
      // .toUTCString() is platform specific, but most platforms use RFC 1123.
      // In ECMAScript 2018, this was standardized to RFC 1123.
      // See for more info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toUTCString
      this.ifModifiedSince = changeFeedOptions.startTime.toUTCString();
      canUseStartFromBeginning = false;
    }

    if (canUseStartFromBeginning && !changeFeedOptions.startFromBeginning) {
      this.nextIfNoneMatch = ChangeFeedIterator.IfNoneMatchAllHeaderValue;
    }
  }

  get hasMoreResults(): boolean {
    return this.lastStatusCode !== StatusCodes.NotModified;
  }

  public async *getAsyncIterator(): AsyncIterable<T[]> {
    while (this.hasMoreResults) {
      const result = await this.executeNext();
      yield result.result;
    }
  }

  public async executeNext(): Promise<Response<Array<T & Resource>>>;
  public async executeNext(): Promise<Response<Array<T & Resource>>> {
    const response = await this.getFeedResponse();
    this.lastStatusCode = response.statusCode;
    this.nextIfNoneMatch = response.headers[Constants.HttpHeaders.ETag];
    return response;
  }

  private async getFeedResponse(): Promise<Response<Array<T & Resource>>> {
    if (!this.isPartitionSpecified && (await this.isPartitionedContainer())) {
      throw new Error("Container is partitioned, but no partition key or partition key range id was specified.");
    }
    const feedOptions: FeedOptions = { initialHeaders: {}, a_im: "Incremental feed" };

    if (isNumber(this.changeFeedOptions.maxItemCount)) {
      feedOptions.maxItemCount = this.changeFeedOptions.maxItemCount;
    }

    if (this.changeFeedOptions.sessionToken) {
      feedOptions.sessionToken = this.changeFeedOptions.sessionToken;
    }

    if (this.nextIfNoneMatch) {
      feedOptions.accessCondition = {
        type: "IfNoneMatch",
        condition: this.nextIfNoneMatch
      };
    }

    if (this.ifModifiedSince) {
      feedOptions.initialHeaders[Constants.HttpHeaders.IfModifiedSince] = this.ifModifiedSince;
    }

    if (this.changeFeedOptions.partitionKey !== undefined) {
      feedOptions.partitionKey = this.changeFeedOptions.partitionKey as any; // TODO: our partition key is too restrictive on the main object
    }

    return this.clientContext.queryFeed<T>(
      this.resourceLink,
      ResourceType.item,
      this.resourceId,
      result => (result ? result.Documents : []),
      undefined,
      feedOptions,
      this.changeFeedOptions.partitionKeyRangeId
    ) as Promise<any>; // TODO: some funky issues with query feed. Probably need to change it up.
  }
}
