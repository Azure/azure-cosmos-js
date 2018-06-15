import { Response } from ".";
import { RequestOptions } from "./documentclient";
import { PermissionDefinition } from "./PermissionDefinition";
import { User } from "./User";

export class Permission {
    constructor(public readonly user: User, public readonly id: string) {}
    public read(options?: RequestOptions): Promise<Response<PermissionDefinition>> {
        throw new Error("Not yet implemented");
    }

    public replace(options?: RequestOptions): Promise<Response<PermissionDefinition>> {
        throw new Error("Not yet implemented");
    }

    public delete(options?: RequestOptions): Promise<Response<PermissionDefinition>> {
        throw new Error("Not yet implemented");
    }
}
