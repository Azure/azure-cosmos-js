import { CosmosResponse } from "../../request";
import { UserDefinedFunctionDefinition } from "./UserDefinedFunctionDefinition";
import { UserDefinedFunction } from "./UserDefinedFunction";

export interface UserDefinedFunctionResponse
  extends CosmosResponse<UserDefinedFunctionDefinition, UserDefinedFunction> {
  userDefinedFunction: UserDefinedFunction;
  udf: UserDefinedFunction;
}
