import { PermissionMode } from "../../documents";

export interface PermissionDefinition {
    id?: string;
    permissionMode: PermissionMode;
    resource: string;
    resourcePartitionKey?: string;
}
