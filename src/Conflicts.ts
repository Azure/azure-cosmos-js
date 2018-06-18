import { ConflictDefinition } from "./ConflictDefinition";
import { Container } from "./Container";
import { CosmosClient } from "./CosmosClient";
import { SqlQuerySpec } from "./queryExecutionContext";
import { QueryIterator } from "./queryIterator";
import { FeedOptions } from "./request/FeedOptions";

export class Conflicts {
    private client: CosmosClient;
    constructor(public readonly container: Container) {
        this.client = this.container.database.client;
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<ConflictDefinition> {
        return this.client.documentClient.queryConflicts(this.container.url, query, options);
    }

    public read(options?: FeedOptions): QueryIterator<ConflictDefinition> {
        return this.client.documentClient.readConflicts(this.container.url, options);
    }
}
