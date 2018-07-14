import { CosmosResponse } from "../../request";
import { PermissionDefinition } from "./PermissionDefinition";
import { Permission } from "./Permission";

export interface PermissionResponse extends CosmosResponse<PermissionDefinition, Permission> {
  permission: Permission;
}
