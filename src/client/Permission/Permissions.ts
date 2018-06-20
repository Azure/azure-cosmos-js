import { CosmosClient } from "../../CosmosClient";
import { SqlQuerySpec } from "../../queryExecutionContext";
import { QueryIterator } from "../../queryIterator";
import { FeedOptions, RequestOptions, Response } from "../../request";
import { User } from "../User";
import { PermissionDefinition } from "./PermissionDefinition";

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
