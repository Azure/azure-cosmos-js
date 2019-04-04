import { CosmosHeaders } from "../../queryExecutionContext";
import { ResourceResponse } from "../../request";
import { OperationStats } from "../../request/OperationStatistics";
import { Resource } from "../Resource";
import { User } from "./User";
import { UserDefinition } from "./UserDefinition";

export class UserResponse extends ResourceResponse<UserDefinition & Resource> {
  constructor(
    resource: UserDefinition & Resource,
    headers: CosmosHeaders,
    statusCode: number,
    user: User,
    operationStatistics: OperationStats
  ) {
    super(resource, headers, statusCode, operationStatistics);
    this.user = user;
  }
  /** A reference to the {@link User} corresponding to the returned {@link UserDefinition}. */
  public readonly user: User;
}
