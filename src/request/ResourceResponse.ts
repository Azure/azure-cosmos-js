import { Constants } from "../common";
import { CosmosHeaders } from "../queryExecutionContext/CosmosHeaders";
import { OperationStats } from "./OperationStatistics";
import { StatusCode } from "./StatusCodes";

export class ResourceResponse<TResource> {
  constructor(
    public readonly resource: TResource,
    public readonly headers: CosmosHeaders,
    public readonly statusCode: StatusCode,
    public readonly operationStatistics: OperationStats
  ) {}
  public get requestCharge(): number {
    return this.headers[Constants.HttpHeaders.RequestCharge] as number;
  }
  public get activityId(): string {
    return this.headers[Constants.HttpHeaders.ActivityId] as string;
  }
  public get etag(): string {
    return this.headers[Constants.HttpHeaders.ETag] as string;
  }
}
