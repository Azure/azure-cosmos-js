import { Agent } from "http";
import { Constants, CosmosClientOptions, IHeaders, RequestOptions, Response } from ".";
import { Base } from "./base";
import { StatusCodes, SubStatusCodes } from "./common";
import { ConnectionPolicy } from "./documents";
import { GlobalEndpointManager } from "./globalEndpointManager";
import { RequestHandler } from "./request";
import { ErrorResponse, getHeaders } from "./request/request";
import { SessionContainer } from "./sessionContainer";

export class ClientContext {
  private readonly sessionContainer: SessionContainer;
  private connectionPolicy: ConnectionPolicy;
  private requestHandler: RequestHandler;
  public constructor(
    private cosmosClientOptions: CosmosClientOptions,
    private globalEndpointManager: GlobalEndpointManager,
    private agent: Agent
  ) {
    this.connectionPolicy = cosmosClientOptions.connectionPolicy || new ConnectionPolicy();
    this.sessionContainer = new SessionContainer(cosmosClientOptions.endpoint);
    this.requestHandler = new RequestHandler(globalEndpointManager, this.connectionPolicy, this.agent);
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
