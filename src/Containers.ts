import { Container } from "./Container";
import { ContainerDefinition } from "./ContainerDefinition";
import { Database } from "./Database";
import { SqlQuerySpec } from "./queryExecutionContext";
import { QueryIterator } from "./queryIterator";
import { FeedOptions } from "./request/FeedOptions";
import { Response } from "./request/request";
import { RequestOptions } from "./request/RequestOptions";

export class Containers {
    constructor(public readonly database: Database) { }

    public getContainer(id: string): Container {
        return new Container(this.database, id);
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<ContainerDefinition> {
        return this.database.client.documentClient.queryCollections(this.database.url, query, options);
    }

    public create(body: ContainerDefinition, options?: RequestOptions): Promise<Response<ContainerDefinition>> {
        return this.database.client.documentClient.createCollection(this.database.url, body, options);
    }

    public read(options?: FeedOptions): QueryIterator<ContainerDefinition> {
        return this.database.client.documentClient.readCollections(this.database.url, options);
    }
}
