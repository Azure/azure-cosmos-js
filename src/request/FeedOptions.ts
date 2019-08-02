import { SharedOptions } from "./SharedOptions";

/**
 * The feed options and query methods.
 */
export interface FeedOptions extends SharedOptions {
  /** Opaque token for continuing the enumeration. */
  continuation?: string;
  /**
   * Continuation Tokens contain optional data that can be removed from the serialization before writing it out to a header.
   * By default we are capping this to 1kb to avoid long headers (Node.js has a global header size limit).
   * A user may set this field to allow for longer headers, which can help the backend optimize query execution."
   */
  continuationTokenLimitInKB?: number;
  /** Allow scan on the queries which couldn't be served as indexing was opted out on the requested paths. Default: false */
  enableScanInQuery?: boolean;
  /**
   * The maximum number of concurrent operations that run client side during parallel query execution in the
   * Azure Cosmos DB database service. Negative values make the system automatically decides the number of
   * concurrent operations to run. Default: 0 (no parallelism)
   */
  maxDegreeOfParallelism?: number;
  /**
   * Max number of items to be returned in the enumeration operation.
   * Default: undefined (server will defined payload)
   */
  maxItemCount?: number;
  /**
   * Consider using readChangeFeed instead.
   *
   * Indicates a change feed request. Must be set to "Incremental feed", or omitted otherwise. Default: false
   */
  useIncrementalFeed?: boolean;
  /** Conditions Associated with the request. */
  accessCondition?: {
    /** Conditional HTTP method header type (IfMatch or IfNoneMatch). */
    type: string;
    /** Conditional HTTP method header value (the _etag field from the last version you read). */
    condition: string;
  };
  /** Enable returning query metrics in response headers. Default: false */
  populateQueryMetrics?: boolean;
  /** Enable buffering additional items during queries. Default: false */
  bufferItems?: boolean;
}
