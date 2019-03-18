import { PartitionKeyRange } from "./client/Container/PartitionKeyRange";
import { Resource } from "./client/Resource";
import { Constants, HTTPMethod, OperationType, ResourceType } from "./common/constants";
import { getIdFromLink, getPathFromLink, parseLink, setIsUpsertHeader } from "./common/helper";
import { StatusCodes, SubStatusCodes } from "./common/statusCodes";
import { CosmosClientOptions } from "./CosmosClientOptions";
import { ConnectionPolicy, ConsistencyLevel, DatabaseAccount, QueryCompatibilityMode } from "./documents";
import { GlobalEndpointManager } from "./globalEndpointManager";
import { FetchFunctionCallback, SqlQuerySpec } from "./queryExecutionContext";
import { CosmosHeaders } from "./queryExecutionContext/CosmosHeaders";
import { QueryIterator } from "./queryIterator";
import { FeedOptions, RequestHandler, RequestOptions, Response } from "./request";
import { ErrorResponse } from "./request";
import { getHeaders } from "./request/request";
import { RequestContext } from "./request/RequestContext";
import { SessionContainer } from "./session/sessionContainer";
import { SessionContext } from "./session/SessionContext";

/**
 * @hidden
 * @ignore
 */
export class ClientContext {
  private readonly sessionContainer: SessionContainer;
  private connectionPolicy: ConnectionPolicy;
  private requestHandler: RequestHandler;

  public partitionKeyDefinitionCache: { [containerUrl: string]: any }; // TODO: ParitionKeyDefinitionCache
  public constructor(
    private cosmosClientOptions: CosmosClientOptions,
    private globalEndpointManager: GlobalEndpointManager
  ) {
    this.connectionPolicy = cosmosClientOptions.connectionPolicy;
    this.sessionContainer = new SessionContainer();
    this.requestHandler = new RequestHandler(
      globalEndpointManager,
      this.connectionPolicy,
      this.cosmosClientOptions.agent
    );
    this.partitionKeyDefinitionCache = {};
  }
  /** @ignore */
  public async read<T>(
    path: string,
    type: ResourceType,
    id: string,
    options: RequestOptions = {}
  ): Promise<Response<T & Resource>> {
    try {
      const requestHeaders = await getHeaders({
        authOptions: this.cosmosClientOptions.auth,
        defaultHeaders: { ...this.cosmosClientOptions.defaultHeaders, ...options.initialHeaders },
        verb: HTTPMethod.get,
        path,
        resourceId: id,
        resourceType: type,
        options,
        useMultipleWriteLocations: this.connectionPolicy.useMultipleWriteLocations
      });
      this.applySessionToken(path, requestHeaders);

      const request: RequestContext = {
        path,
        operationType: OperationType.Read,
        client: this
      };
      // read will use ReadEndpoint since it uses GET operation
      const endpoint = await this.globalEndpointManager.resolveServiceEndpoint(request);
      const response = await this.requestHandler.get(endpoint, request, requestHeaders);
      this.captureSessionToken(undefined, path, OperationType.Read, response.headers);
      return response;
    } catch (err) {
      this.captureSessionToken(err, path, OperationType.Upsert, (err as ErrorResponse).headers);
      throw err;
    }
  }

  public async queryFeed<T>(
    path: string,
    type: ResourceType,
    id: string,
    resultFn: (result: { [key: string]: any }) => any[], // TODO: any
    query: SqlQuerySpec | string,
    options: FeedOptions,
    partitionKeyRangeId?: string
  ): Promise<Response<T & Resource>> {
    // Query operations will use ReadEndpoint even though it uses
    // GET(for queryFeed) and POST(for regular query operations)

    const request: RequestContext = {
      path,
      operationType: OperationType.Query,
      client: this
    };

    const endpoint = await this.globalEndpointManager.resolveServiceEndpoint(request);

    const initialHeaders = { ...this.cosmosClientOptions.defaultHeaders, ...options.initialHeaders };
    if (query === undefined) {
      const reqHeaders = await getHeaders({
        authOptions: this.cosmosClientOptions.auth,
        defaultHeaders: { ...this.cosmosClientOptions.defaultHeaders, ...options.initialHeaders },
        verb: HTTPMethod.get,
        path,
        resourceId: id,
        resourceType: type,
        options,
        partitionKeyRangeId,
        useMultipleWriteLocations: this.connectionPolicy.useMultipleWriteLocations
      });
      this.applySessionToken(path, reqHeaders);

      const response = await this.requestHandler.get(endpoint, request, reqHeaders);
      this.captureSessionToken(undefined, path, OperationType.Query, response.headers);
      return this.processQueryFeedResponse(response, !!query, resultFn);
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

      const reqHeaders = await getHeaders({
        authOptions: this.cosmosClientOptions.auth,
        defaultHeaders: initialHeaders,
        verb: HTTPMethod.post,
        path,
        resourceId: id,
        resourceType: type,
        options,
        partitionKeyRangeId,
        useMultipleWriteLocations: this.connectionPolicy.useMultipleWriteLocations
      });
      this.applySessionToken(path, reqHeaders);

      const response = await this.requestHandler.post(endpoint, request, query, reqHeaders);
      this.captureSessionToken(undefined, path, OperationType.Query, response.headers);
      return this.processQueryFeedResponse(response, !!query, resultFn);
    }
  }

  public queryPartitionKeyRanges(collectionLink: string, query?: string | SqlQuerySpec, options?: FeedOptions) {
    const path = getPathFromLink(collectionLink, ResourceType.pkranges);
    const id = getIdFromLink(collectionLink);
    const cb: FetchFunctionCallback = innerOptions => {
      return this.queryFeed(path, ResourceType.pkranges, id, result => result.PartitionKeyRanges, query, innerOptions);
    };
    return new QueryIterator<PartitionKeyRange>(this, query, options, cb);
  }

  public async delete<T>(
    path: string,
    type: ResourceType,
    id: string,
    options: RequestOptions = {}
  ): Promise<Response<T & Resource>> {
    try {
      const reqHeaders = await getHeaders({
        authOptions: this.cosmosClientOptions.auth,
        defaultHeaders: { ...this.cosmosClientOptions.defaultHeaders, ...options.initialHeaders },
        verb: HTTPMethod.delete,
        path,
        resourceId: id,
        resourceType: type,
        options,
        useMultipleWriteLocations: this.connectionPolicy.useMultipleWriteLocations
      });

      const request: RequestContext = {
        client: this,
        operationType: OperationType.Delete,
        path,
        resourceType: type
      };

      this.applySessionToken(path, reqHeaders);
      // deleteResource will use WriteEndpoint since it uses DELETE operation
      const endpoint = await this.globalEndpointManager.resolveServiceEndpoint(request);
      const response = await this.requestHandler.delete(endpoint, request, reqHeaders);
      if (parseLink(path).type !== "colls") {
        this.captureSessionToken(undefined, path, OperationType.Delete, response.headers);
      } else {
        this.clearSessionToken(path);
      }
      return response;
    } catch (err) {
      this.captureSessionToken(err, path, OperationType.Upsert, (err as ErrorResponse).headers);
      throw err;
    }
  }

  // Most cases, things return the definition + the system resource props
  public async create<T>(
    body: T,
    path: string,
    type: ResourceType,
    id: string,
    options: RequestOptions
  ): Promise<Response<T & Resource>>;

  // But a few cases, like permissions, there is additional junk added to the response that isn't in system resource props
  public async create<T, U>(
    body: T,
    path: string,
    type: ResourceType,
    id: string,
    options: RequestOptions
  ): Promise<Response<T & U & Resource>>;
  public async create<T, U>(
    body: T,
    path: string,
    type: ResourceType,
    id: string,
    options: RequestOptions = {}
  ): Promise<Response<T & U & Resource>> {
    try {
      const requestHeaders = await getHeaders({
        authOptions: this.cosmosClientOptions.auth,
        defaultHeaders: { ...this.cosmosClientOptions.defaultHeaders, ...options.initialHeaders },
        verb: HTTPMethod.post,
        path,
        resourceId: id,
        resourceType: type,
        options,
        useMultipleWriteLocations: this.connectionPolicy.useMultipleWriteLocations
      });

      const request: RequestContext = {
        client: this,
        operationType: OperationType.Create,
        path,
        resourceType: type
      };

      // create will use WriteEndpoint since it uses POST operation
      this.applySessionToken(path, requestHeaders);

      const endpoint = await this.globalEndpointManager.resolveServiceEndpoint(request);
      const response = await this.requestHandler.post(endpoint, request, body, requestHeaders);
      this.captureSessionToken(undefined, path, OperationType.Create, response.headers);
      return response;
    } catch (err) {
      this.captureSessionToken(err, path, OperationType.Upsert, (err as ErrorResponse).headers);
      throw err;
    }
  }

  private processQueryFeedResponse(
    res: Response<any>,
    isQuery: boolean,
    resultFn: (result: { [key: string]: any }) => any[]
  ): Response<any> {
    if (isQuery) {
      return { result: resultFn(res.result), headers: res.headers, statusCode: res.statusCode };
    } else {
      const newResult = resultFn(res.result).map((body: any) => body);
      return { result: newResult, headers: res.headers, statusCode: res.statusCode };
    }
  }

  private applySessionToken(path: string, reqHeaders: CosmosHeaders) {
    const request = this.getSessionParams(path);

    if (reqHeaders && reqHeaders[Constants.HttpHeaders.SessionToken]) {
      return;
    }

    const sessionConsistency: ConsistencyLevel = reqHeaders[Constants.HttpHeaders.ConsistencyLevel] as ConsistencyLevel;
    if (!sessionConsistency) {
      return;
    }

    if (sessionConsistency !== ConsistencyLevel.Session) {
      return;
    }

    if (request.resourceAddress) {
      const sessionToken = this.sessionContainer.get(request);
      if (sessionToken) {
        reqHeaders[Constants.HttpHeaders.SessionToken] = sessionToken;
      }
    }
  }

  public async replace<T>(
    resource: any,
    path: string,
    type: ResourceType,
    id: string,
    options: RequestOptions = {}
  ): Promise<Response<T & Resource>> {
    try {
      const requestHeaders = await getHeaders({
        authOptions: this.cosmosClientOptions.auth,
        defaultHeaders: { ...this.cosmosClientOptions.defaultHeaders, ...options.initialHeaders },
        verb: HTTPMethod.put,
        path,
        resourceId: id,
        resourceType: type,
        options,
        useMultipleWriteLocations: this.connectionPolicy.useMultipleWriteLocations
      });

      const request: RequestContext = {
        client: this,
        operationType: OperationType.Replace,
        path,
        resourceType: type
      };

      this.applySessionToken(path, requestHeaders);

      // replace will use WriteEndpoint since it uses PUT operation
      const endpoint = await this.globalEndpointManager.resolveServiceEndpoint(requestHeaders);
      const response = await this.requestHandler.put(endpoint, request, resource, requestHeaders);
      this.captureSessionToken(undefined, path, OperationType.Replace, response.headers);
      return response;
    } catch (err) {
      this.captureSessionToken(err, path, OperationType.Upsert, (err as ErrorResponse).headers);
      throw err;
    }
  }

  public async upsert<T>(
    body: T,
    path: string,
    type: ResourceType,
    id: string,
    options: RequestOptions
  ): Promise<Response<T & Resource>>;
  public async upsert<T, U>(
    body: T,
    path: string,
    type: ResourceType,
    id: string,
    options: RequestOptions
  ): Promise<Response<T & U & Resource>>;
  public async upsert<T>(
    body: T,
    path: string,
    type: ResourceType,
    id: string,
    options: RequestOptions = {}
  ): Promise<Response<T & Resource>> {
    try {
      const requestHeaders = await getHeaders({
        authOptions: this.cosmosClientOptions.auth,
        defaultHeaders: { ...this.cosmosClientOptions.defaultHeaders, ...options.initialHeaders },
        verb: HTTPMethod.post,
        path,
        resourceId: id,
        resourceType: type,
        options,
        useMultipleWriteLocations: this.connectionPolicy.useMultipleWriteLocations
      });

      const request: RequestContext = {
        client: this,
        operationType: OperationType.Upsert,
        path,
        resourceType: type
      };

      setIsUpsertHeader(requestHeaders);
      this.applySessionToken(path, requestHeaders);

      // upsert will use WriteEndpoint since it uses POST operation
      const endpoint = await this.globalEndpointManager.resolveServiceEndpoint(request);
      const response = await this.requestHandler.post(endpoint, request, body, requestHeaders);
      this.captureSessionToken(undefined, path, OperationType.Upsert, response.headers);
      return response;
    } catch (err) {
      this.captureSessionToken(err, path, OperationType.Upsert, (err as ErrorResponse).headers);
      throw err;
    }
  }

  public async execute<T>(
    sprocLink: string,
    params?: any[], // TODO: any
    options: RequestOptions = {}
  ): Promise<Response<T>> {
    // Accept a single parameter or an array of parameters.
    // Didn't add type annotation for this because we should legacy this behavior
    if (params !== null && params !== undefined && !Array.isArray(params)) {
      params = [params];
    }
    const path = getPathFromLink(sprocLink);
    const id = getIdFromLink(sprocLink);

    const headers = await getHeaders({
      authOptions: this.cosmosClientOptions.auth,
      defaultHeaders: { ...this.cosmosClientOptions.defaultHeaders, ...options.initialHeaders },
      verb: HTTPMethod.post,
      path,
      resourceId: id,
      resourceType: ResourceType.sproc,
      options,
      useMultipleWriteLocations: this.connectionPolicy.useMultipleWriteLocations
    });

    const request: RequestContext = {
      client: this,
      operationType: OperationType.Execute,
      path,
      resourceType: ResourceType.sproc
    };

    // executeStoredProcedure will use WriteEndpoint since it uses POST operation
    const endpoint = await this.globalEndpointManager.resolveServiceEndpoint(request);
    return this.requestHandler.post(endpoint, request, params, headers);
  }

  /**
   * Gets the Database account information.
   * @param {string} [options.urlConnection]   - The endpoint url whose database account needs to be retrieved. \
   * If not present, current client's url will be used.
   */
  public async getDatabaseAccount(options: RequestOptions = {}): Promise<Response<DatabaseAccount>> {
    const endpoint = options.urlConnection || this.cosmosClientOptions.endpoint;

    const requestHeaders = await getHeaders({
      authOptions: this.cosmosClientOptions.auth,
      defaultHeaders: this.cosmosClientOptions.defaultHeaders,
      verb: HTTPMethod.get,
      path: "",
      resourceId: "",
      resourceType: ResourceType.none,
      options: {},
      useMultipleWriteLocations: this.connectionPolicy.useMultipleWriteLocations
    });

    const request: RequestContext = {
      client: this,
      operationType: OperationType.Read,
      path: "",
      resourceType: ResourceType.none
    };

    await options.beforeOperation({ endpoint, request, headers: requestHeaders });
    const { result, headers } = await this.requestHandler.get(endpoint, request, requestHeaders);

    const databaseAccount = new DatabaseAccount(result, headers);

    return { result: databaseAccount, headers };
  }

  public getWriteEndpoint(): Promise<string> {
    return this.globalEndpointManager.getWriteEndpoint();
  }

  public getReadEndpoint(): Promise<string> {
    return this.globalEndpointManager.getReadEndpoint();
  }

  private captureSessionToken(
    err: ErrorResponse,
    path: string,
    operationType: OperationType,
    resHeaders: CosmosHeaders
  ) {
    const request = this.getSessionParams(path);
    request.operationType = operationType;
    if (
      !err ||
      (!this.isMasterResource(request.resourceType) &&
        (err.code === StatusCodes.PreconditionFailed ||
          err.code === StatusCodes.Conflict ||
          (err.code === StatusCodes.NotFound && err.substatus !== SubStatusCodes.ReadSessionNotAvailable)))
    ) {
      this.sessionContainer.set(request, resHeaders);
    }
  }

  public clearSessionToken(path: string) {
    const request = this.getSessionParams(path);
    this.sessionContainer.remove(request);
  }

  private getSessionParams(resourceLink: string): SessionContext {
    const resourceId: string = null;
    let resourceAddress: string = null;
    const parserOutput = parseLink(resourceLink);

    resourceAddress = parserOutput.objectBody.self;

    const resourceType = parserOutput.type;
    return {
      resourceId,
      resourceAddress,
      resourceType,
      isNameBased: true
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
