import { CosmosClient } from "../../CosmosClient";
import { SqlQuerySpec } from "../../queryExecutionContext";
import { QueryIterator } from "../../queryIterator";
import { FeedOptions, RequestOptions, Response } from "../../request";
import { Database } from "../Database";
import { User } from "./User";
import { UserDefinition } from "./UserDefinition";

export class Users {
    private client: CosmosClient;
    constructor(public readonly database: Database) {
        this.client = this.database.client;
    }
    public getUser(id: string): User {
        return new User(this.database, id);
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<UserDefinition> {
        return this.client.documentClient.queryUsers(this.database.url, query, options);
    }

    public read(options?: FeedOptions): QueryIterator<UserDefinition> {
        return this.client.documentClient.readUsers(this.database.url, options);
    }

    public create(
        body: UserDefinition,
        options?: RequestOptions,
    ): Promise<Response<UserDefinition>> {
        return this.client.documentClient.createUser(this.database.url, body, options);
    }

    public upsert(
        body: UserDefinition,
        options?: RequestOptions,
    ): Promise<Response<UserDefinition>> {
        return this.client.documentClient.upsertUser(this.database.url, body, options);
    }
}
