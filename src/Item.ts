import { Response } from ".";
import { Constants } from "./common";
import { Container } from "./Container";
import { CosmosClient } from "./CosmosClient";
import { RequestOptions } from "./request/RequestOptions";

export class Item {

    private client: CosmosClient;
    public get url() {
        return `${this.container.url}/${Constants.Path.DocumentsPathSegment}/${this.id}`;
    }

    constructor(
        public readonly container: Container,
        public readonly id: string,
        public readonly primaryKey: string) {
        this.client = this.container.database.client;
    }

    public read<T>(options?: RequestOptions): Promise<Response<T>> {
        if (!options.partitionKey && this.primaryKey) {
            options.partitionKey = this.primaryKey;
        }
        return this.client.documentClient.readDocument(this.url, options) as Promise<Response<T>>;
    }

    public replace<T>(body: T, options?: RequestOptions): Promise<Response<T>> {
        if (!options.partitionKey && this.primaryKey) {
            options.partitionKey = this.primaryKey;
        }
        return this.client.documentClient.replaceDocument(this.url, body, options) as Promise<Response<T>>;
    }

    public delete<T>(options?: RequestOptions): Promise<Response<T>> {
        if (!options.partitionKey && this.primaryKey) {
            options.partitionKey = this.primaryKey;
        }
        return this.client.documentClient.deleteDocument(this.url, options) as Promise<Response<T>>;
    }
}
