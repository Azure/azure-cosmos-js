import { DocumentClient } from "../../documentclient";
import { SqlQuerySpec } from "../../queryExecutionContext";
import { QueryIterator } from "../../queryIterator";
import { FeedOptions, RequestOptions, Response } from "../../request";
import { Container } from "../Container";
import { Item } from "./Item";

export class Items {
    private client: DocumentClient;
    constructor(public readonly container: Container) {
        this.client = this.container.database.client.documentClient;
    }

    public getItem(id: string, partitionKey?: string): Item {
        return new Item(this.container, id, partitionKey);
    }

    public query(query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
    public query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
    public query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T> {
        return this.client.queryDocuments(this.container.url, query, options) as QueryIterator<T>;
    }

    public read(options?: FeedOptions): QueryIterator<any>;
    public read<T>(options?: FeedOptions): QueryIterator<T>;
    public read<T>(options?: FeedOptions): QueryIterator<T> {
        return this.client.readDocuments(this.container.url, options) as QueryIterator<T>;
    }

    public async create(body: any, options?: RequestOptions): Promise<Response<any>>;
    public async create<T>(body: T, options?: RequestOptions): Promise<Response<T>>;
    public async create<T>(body: T, options?: RequestOptions): Promise<Response<T>> {
        return this.client.createDocument(this.container.url, body, options) as Promise<Response<T>>;
    }

    public async upsert(body: any, options?: RequestOptions): Promise<Response<any>>;
    public async upsert<T>(body: T, options?: RequestOptions): Promise<Response<T>>;
    public async upsert<T>(body: T, options?: RequestOptions): Promise<Response<T>> {
        return this.client.upsertDocument(this.container.url, body, options);
    }
}
