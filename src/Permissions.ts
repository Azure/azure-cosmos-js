import { QueryIterator, Response } from ".";
import { CosmosClient } from "./CosmosClient";
import { FeedOptions, RequestOptions } from "./documentclient";
import { PermissionDefinition } from "./PermissionDefinition";
import { SqlQuerySpec } from "./queryExecutionContext";
import { User } from "./User";

export class Permissions {
    private client: CosmosClient;
    constructor(public readonly user: User) {
        this.client = this.user.database.client;
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<PermissionDefinition> {
        return this.client.documentClient.queryPermissions(this.user.url, query, options);
    }

    public read(options?: FeedOptions): QueryIterator<PermissionDefinition> {
        return this.client.documentClient.readPermissions(this.user.url, options);
    }

    public create(
        body: PermissionDefinition,
        options?: RequestOptions,
    ): Promise<Response<PermissionDefinition>> {
        return this.client.documentClient.createPermission(this.user.url, body, options);
    }

    public upsert(
        body: PermissionDefinition,
        options?: RequestOptions,
    ): Promise<Response<PermissionDefinition>> {
        return this.client.documentClient.upsertPermission(this.user.id, body, options);
    }
}
