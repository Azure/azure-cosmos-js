import { Response } from ".";
import { CosmosClient } from "./CosmosClient";
import { Database } from "./Database";
import { DatabaseDefinition } from "./DatabaseDefinition";
import { FeedOptions, RequestOptions } from "./documentclient";
import { SqlQuerySpec } from "./queryExecutionContext";
import { QueryIterator } from "./queryIterator";

export class Databases {
    constructor(private readonly client: CosmosClient) {}
    public getDatabase(id: string): Database {
        return new Database(this.client, id);
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<DatabaseDefinition> {
        throw new Error("Not yet implemented");
    }

    public create(body: DatabaseDefinition, options?: RequestOptions): Promise<Response<DatabaseDefinition>> {
        throw new Error("Not yet implemented");
    }

    public read(options?: FeedOptions): QueryIterator<DatabaseDefinition> {
        throw new Error("Not yet implemented");
    }
}
