import { CosmosClient } from "../../CosmosClient";
import { SqlQuerySpec } from "../../queryExecutionContext";
import { QueryIterator } from "../../queryIterator";
import { FeedOptions, RequestOptions, Response } from "../../request";
import { Container } from "../Container";
import { Trigger } from "./Trigger";
import { TriggerDefinition } from "./TriggerDefinition";

export class Triggers {
    private client: CosmosClient;
    constructor(public readonly container: Container) {
        this.client = this.container.database.client;
    }

    public getTrigger(id: string): Trigger {
        return new Trigger(this.container, id);
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<TriggerDefinition> {
        return this.client.documentClient.queryTriggers(this.container.url, query, options);
    }

    public read(options?: FeedOptions): QueryIterator<TriggerDefinition> {
        return this.client.documentClient.readTriggers(this.container.url, options);
    }

    public create(body: TriggerDefinition, options?: RequestOptions): Promise<Response<TriggerDefinition>> {
        return this.client.documentClient.createTrigger(this.container.url, body, options);
    }

    public upsert(body: TriggerDefinition, options?: RequestOptions): Promise<Response<TriggerDefinition>> {
        return this.client.documentClient.upsertTrigger(this.container.url, body, options);
    }
}
