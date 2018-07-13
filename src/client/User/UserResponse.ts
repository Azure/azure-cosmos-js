import { CosmosResponse } from "../../request";
import { UserDefinition } from "./UserDefinition";
import { User } from "./User";

export interface UserResponse extends CosmosResponse<UserDefinition, User> {
  user: User;
}
