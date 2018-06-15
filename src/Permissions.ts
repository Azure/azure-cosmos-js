import { QueryIterator, Response } from ".";
import { FeedOptions, RequestOptions } from "./documentclient";
import { PermissionDefinition } from "./PermissionDefinition";
import { SqlQuerySpec } from "./queryExecutionContext";
import { User } from "./User";

export class Permissions {
    constructor(public readonly user: User) {}

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<PermissionDefinition> {
        throw new Error("Not yet implemented");
    }

    public read(options?: FeedOptions): QueryIterator<PermissionDefinition> {
        throw new Error("Not yet implemented");
    }

    public create(
        body: PermissionDefinition,
        options?: RequestOptions,
    ): Promise<Response<PermissionDefinition>> {
        throw new Error("Not yet implemented");
    }

    public upsert(
        body: PermissionDefinition,
        options?: RequestOptions,
    ): Promise<Response<PermissionDefinition>> {
        throw new Error("Not yet implemented");
    }
}
