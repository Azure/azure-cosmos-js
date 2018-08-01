import { Constants, CosmosClientOptions, IHeaders, QueryIterator, RequestOptions, Response, SqlQuerySpec } from ".";
import { Base } from "./base";
import { Helper, StatusCodes, SubStatusCodes } from "./common";
import { ConnectionPolicy, QueryCompatibilityMode } from "./documents";
import { GlobalEndpointManager } from "./globalEndpointManager";
import { FetchFunctionCallback } from "./queryExecutionContext";
import { FeedOptions, RequestHandler } from "./request";
import { ErrorResponse, getHeaders } from "./request/request";
import { SessionContainer } from "./sessionContainer";

/**
 * @hidden
 * @ignore
 */
export class ClientContext {
  private readonly sessionContainer: SessionContainer;
  private connectionPolicy: ConnectionPolicy;
  private requestHandler: RequestHandler;

  public partitionKeyDefinitionCache: any; // TODO: ParitionKeyDefinitionCache
  public constructor(
    private cosmosClientOptions: CosmosClientOptions,
    private globalEndpointManager: GlobalEndpointManager
  ) {
    this.connectionPolicy = cosmosClientOptions.connectionPolicy || new ConnectionPolicy();
    this.sessionContainer = new SessionContainer(cosmosClientOptions.endpoint);
    this.requestHandler = new RequestHandler(
      globalEndpointManager,
      this.connectionPolicy,
      this.cosmosClientOptions.agent
    );
  }
  /** @ignore */
  public async read<T>(
    path: string,
    type: string,
    id: string,
    initialHeaders: IHeaders,
    options?: RequestOptions
  ): Promise<Response<T>> {
    try {
      const requestHeaders = await getHeaders(
        this.cosmosClientOptions.auth,
        { ...initialHeaders, ...this.cosmosClientOptions.defaultHeaders, ...(options && options.initialHeaders) },
        "get",
        path,
        id,
        type,
        options
      );
      this.applySessionToken(path, requestHeaders);

      const request: any = {
        // TODO: any
        path,
        operationType: Constants.OperationTypes.Read,
        client: this,
        endpointOverride: null
      };
      // read will use ReadEndpoint since it uses GET operation
      const readEndpoint = await this.globalEndpointManager.getReadEndpoint();
      const response = await this.requestHandler.get(readEndpoint, request, requestHeaders);
      this.captureSessionToken(undefined, path, Constants.OperationTypes.Read, response.headers);
      return response;
    } catch (err) {
      this.captureSessionToken(err, path, Constants.OperationTypes.Upsert, (err as ErrorResponse).headers);
      throw err;
    }
  }

  public async queryFeed(
    path: string,
    type: string, // TODO: code smell: enum?
    id: string,
    resultFn: (result: { [key: string]: any }) => any[], // TODO: any
    query: SqlQuerySpec | string,
    options: FeedOptions,
    partitionKeyRangeId?: string
  ): Promise<Response<any>> {
    // Query operations will use ReadEndpoint even though it uses
    // GET(for queryFeed) and POST(for regular query operations)
    const readEndpoint = await this.globalEndpointManager.getReadEndpoint();

    const request: any = {
      // TODO: any request
      path,
      operationType: Constants.OperationTypes.Query,
      client: this,
      endpointOverride: null
    };

    const initialHeaders = { ...this.cosmosClientOptions.defaultHeaders, ...(options && options.initialHeaders) };
    if (query === undefined) {
      const reqHeaders = await getHeaders(
        this.cosmosClientOptions.auth,
        initialHeaders,
        "get",
        path,
        id,
        type,
        options,
        partitionKeyRangeId
      );
      this.applySessionToken(path, reqHeaders);

      const { result, headers: resHeaders } = await this.requestHandler.get(readEndpoint, request, reqHeaders);
      this.captureSessionToken(undefined, path, Constants.OperationTypes.Query, resHeaders);
      return this.processQueryFeedResponse({ result, headers: resHeaders }, !!query, resultFn);
    } else {
      initialHeaders[Constants.HttpHeaders.IsQuery] = "true";
      switch (this.cosmosClientOptions.queryCompatibilityMode) {
        case QueryCompatibilityMode.SqlQuery:
          initialHeaders[Constants.HttpHeaders.ContentType] = Constants.MediaTypes.SQL;
          break;
        case QueryCompatibilityMode.Query:
        case QueryCompatibilityMode.Default:
        default:
          if (typeof query === "string") {
            query = { query }; // Converts query text to query object.
          }
          initialHeaders[Constants.HttpHeaders.ContentType] = Constants.MediaTypes.QueryJson;
          break;
      }

      const reqHeaders = await getHeaders(
        this.cosmosClientOptions.auth,
        initialHeaders,
        "post",
        path,
        id,
        type,
        options,
        partitionKeyRangeId
      );
      this.applySessionToken(path, reqHeaders);

      const response = await this.requestHandler.post(readEndpoint, request, query, reqHeaders);
      const { result, headers: resHeaders } = response;
      this.captureSessionToken(undefined, path, Constants.OperationTypes.Query, resHeaders);
      return this.processQueryFeedResponse({ result, headers: resHeaders }, !!query, resultFn);
    }
  }

  public queryPartitionKeyRanges(collectionLink: string, query?: string | SqlQuerySpec, options?: FeedOptions) {
    const isNameBased = Base.isLinkNameBased(collectionLink);
    const path = Helper.getPathFromLink(collectionLink, "pkranges", isNameBased);
    const id = Helper.getIdFromLink(collectionLink, isNameBased);
    const cb: FetchFunctionCallback = innerOptions => {
      return this.queryFeed(path, "pkranges", id, result => result.PartitionKeyRanges, query, innerOptions);
    };
    return new QueryIterator(this, query, options, cb);
  }

  public async delete<T>(
    path: string,
    type: string,
    id: string,
    initialHeaders: IHeaders,
    options?: RequestOptions
  ): Promise<Response<T>> {
    try {
      const reqHeaders = await getHeaders(
        this.cosmosClientOptions.auth,
        { ...initialHeaders, ...this.cosmosClientOptions.defaultHeaders, ...(options && options.initialHeaders) },
        "delete",
        path,
        id,
        type,
        options
      );

      this.applySessionToken(path, reqHeaders);
      // deleteResource will use WriteEndpoint since it uses DELETE operation
      const writeEndpoint = await this.globalEndpointManager.getWriteEndpoint();
      const response = await this.requestHandler.delete(writeEndpoint, path, reqHeaders);
      if (Base.parseLink(path).type !== "colls") {
        this.captureSessionToken(undefined, path, Constants.OperationTypes.Delete, response.headers);
      } else {
        this.clearSessionToken(path);
      }
      return response;
    } catch (err) {
      this.captureSessionToken(err, path, Constants.OperationTypes.Upsert, (err as ErrorResponse).headers);
      throw err;
    }
  }

  public async create<T>(
    body: T,
    path: string,
    type: string,
    id: string,
    initialHeaders: IHeaders,
    options?: RequestOptions
  ): Promise<Response<T>> {
    try {
      const requestHeaders = await getHeaders(
        this.cosmosClientOptions.auth,
        { ...initialHeaders, ...this.cosmosClientOptions.defaultHeaders, ...(options && options.initialHeaders) },
        "post",
        path,
        id,
        type,
        options
      );

      // create will use WriteEndpoint since it uses POST operation
      this.applySessionToken(path, requestHeaders);

      const writeEndpoint = await this.globalEndpointManager.getWriteEndpoint();
      const response = await this.requestHandler.post(writeEndpoint, path, body, requestHeaders);
      this.captureSessionToken(undefined, path, Constants.OperationTypes.Create, response.headers);
      return response;
    } catch (err) {
      this.captureSessionToken(err, path, Constants.OperationTypes.Upsert, (err as ErrorResponse).headers);
      throw err;
    }
  }

  private processQueryFeedResponse(
    res: Response<any>,
    isQuery: boolean,
    resultFn: (result: { [key: string]: any }) => any[]
  ): Response<any> {
    if (isQuery) {
      return { result: resultFn(res.result), headers: res.headers };
    } else {
      const newResult = resultFn(res.result).map((body: any) => body);
      return { result: newResult, headers: res.headers };
    }
  }

  private applySessionToken(path: string, reqHeaders: IHeaders) {
    const request = this.getSessionParams(path);

    if (reqHeaders && reqHeaders[Constants.HttpHeaders.SessionToken]) {
      return;
    }

    const sessionConsistency = reqHeaders[Constants.HttpHeaders.ConsistencyLevel];
    if (!sessionConsistency) {
      return;
    }

    if (request["resourceAddress"]) {
      const sessionToken = this.sessionContainer.resolveGlobalSessionToken(request);
      if (sessionToken !== "") {
        reqHeaders[Constants.HttpHeaders.SessionToken] = sessionToken;
      }
    }
  }

  private captureSessionToken(err: ErrorResponse, path: string, opType: string, resHeaders: IHeaders) {
    const request: any = this.getSessionParams(path); // TODO: any request
    request.operationType = opType;
    if (
      !err ||
      (!this.isMasterResource(request.resourceType) &&
        (err.code === StatusCodes.PreconditionFailed ||
          err.code === StatusCodes.Conflict ||
          (err.code === StatusCodes.NotFound && err.substatus !== SubStatusCodes.ReadSessionNotAvailable)))
    ) {
      this.sessionContainer.setSessionToken(request, resHeaders);
    }
  }

  private clearSessionToken(path: string) {
    const request = this.getSessionParams(path);
    this.sessionContainer.clearToken(request);
  }

  private getSessionParams(resourceLink: string) {
    const isNameBased = Base.isLinkNameBased(resourceLink);
    let resourceId: string = null;
    let resourceAddress: string = null;
    const parserOutput = Base.parseLink(resourceLink);
    if (isNameBased) {
      resourceAddress = parserOutput.objectBody.self;
    } else {
      resourceAddress = parserOutput.objectBody.id;
      resourceId = parserOutput.objectBody.id;
    }
    const resourceType = parserOutput.type;
    return {
      isNameBased,
      resourceId,
      resourceAddress,
      resourceType
    };
  }

  private isMasterResource(resourceType: string): boolean {
    if (
      resourceType === Constants.Path.OffersPathSegment ||
      resourceType === Constants.Path.DatabasesPathSegment ||
      resourceType === Constants.Path.UsersPathSegment ||
      resourceType === Constants.Path.PermissionsPathSegment ||
      resourceType === Constants.Path.TopologyPathSegment ||
      resourceType === Constants.Path.DatabaseAccountPathSegment ||
      resourceType === Constants.Path.PartitionKeyRangesPathSegment ||
      resourceType === Constants.Path.CollectionsPathSegment
    ) {
      return true;
    }

    return false;
  }
}
