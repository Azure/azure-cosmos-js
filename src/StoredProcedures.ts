import { Container } from "./Container";
import { CosmosClient } from "./CosmosClient";
import { DocumentClient, FeedOptions, RequestOptions } from "./documentclient";
import { SqlQuerySpec } from "./queryExecutionContext";
import { QueryIterator } from "./queryIterator";
import { Response } from "./request";
import { StoredProcedure } from "./StoredProcedure";
import { StoredProcedureDefinition } from "./StoredProcedureDefinition";

export class StoredProcedures {
    private client: CosmosClient;
    constructor(public readonly container: Container) {
        this.client = this.container.database.client;
    }

    public getStoredProcedure(id: string): StoredProcedure {
        return new StoredProcedure(this.container, id);
    }
    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<StoredProcedureDefinition> {
        return this.client.documentClient.queryStoredProcedures(this.container.url, query, options);
    }

    public read(options?: FeedOptions): QueryIterator<StoredProcedureDefinition> {
        return this.client.documentClient.readStoredProcedures(this.container.url, options);
    }

    public async create(
        body: StoredProcedureDefinition,
        options?: RequestOptions,
    ): Promise<Response<StoredProcedureDefinition>> {
        return this.client.documentClient.createStoredProcedure(this.container.url, body, options);
    }

    public async upsert(
        body: StoredProcedureDefinition,
        options?: RequestOptions,
    ): Promise<Response<StoredProcedureDefinition>> {
        return this.client.documentClient.upsertStoredProcedure(this.container.url, body, options);
    }
}
