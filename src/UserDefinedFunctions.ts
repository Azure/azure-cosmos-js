import { QueryIterator, Response } from ".";
import { Container } from "./Container";
import { CosmosClient } from "./CosmosClient";
import { SqlQuerySpec } from "./queryExecutionContext";
import { FeedOptions } from "./request/FeedOptions";
import { RequestOptions } from "./request/RequestOptions";
import { UserDefinedFunction } from "./UserDefinedFunction";
import { UserDefinedFunctionDefinition } from "./UserDefinedFunctionDefinition";

export class UserDefinedFunctions {
    private client: CosmosClient;
    constructor(public readonly container: Container) {
        this.client = this.container.database.client;
     }

    public getUserDefinedFunction(id: string): UserDefinedFunction {
        return new UserDefinedFunction(this.container, id);
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<UserDefinedFunctionDefinition> {
        return this.client.documentClient.queryUserDefinedFunctions(this.container.url, query, options);
    }

    public read(options?: FeedOptions): QueryIterator<UserDefinedFunctionDefinition> {
        return this.client.documentClient.readUserDefinedFunctions(this.container.url, options);
    }

    public create(
        body: UserDefinedFunctionDefinition,
        options?: RequestOptions,
    ): Promise<Response<UserDefinedFunctionDefinition>> {
        return this.client.documentClient.createUserDefinedFunction(this.container.url, body, options);
    }

    public upsert(
        body: UserDefinedFunctionDefinition,
        options?: RequestOptions,
    ): Promise<Response<UserDefinedFunctionDefinition>> {
        return this.client.documentClient.upsertUserDefinedFunction(this.container.url, body, options);
    }
}
