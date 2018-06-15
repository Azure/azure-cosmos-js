import { Container } from "./Container";
import { ContainerDefinition } from "./ContainerDefinition";
import { Database } from "./Database";
import { FeedOptions, RequestOptions } from "./documentclient";
import { SqlQuerySpec } from "./queryExecutionContext";
import { QueryIterator } from "./queryIterator";
import { Response } from "./request";

export class Containers {
    constructor(public readonly database: Database) { }

    public getContainer(id: string): Container {
        return new Container(this.database, id);
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<ContainerDefinition> {
        throw new Error("Not yet implemented");
    }

    public create(body: ContainerDefinition, options?: RequestOptions): Promise<Response<ContainerDefinition>> {
        throw new Error("Not yet implemented");
    }

    public read(options?: FeedOptions): QueryIterator<ContainerDefinition> {
        throw new Error("Not yet implemented");
    }
}
