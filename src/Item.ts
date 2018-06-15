import { Response } from ".";
import { Constants } from "./common";
import { Container } from "./Container";
import { DocumentClient, RequestOptions } from "./documentclient";

export class Item {

    private client: DocumentClient;
    public get url() {
        return `${this.container.url}/${Constants.Path.DocumentsPathSegment}/${this.id}`;
    }

    constructor(
        public readonly container: Container,
        public readonly id: string,
        public readonly primaryKey: string) {
        this.client = this.container.database.client.documentClient;
    }

    public read<T>(options?: RequestOptions): Promise<Response<T>> {
        if (!options.partitionKey && this.primaryKey) {
            options.partitionKey = this.primaryKey;
        }
        return this.client.readDocument(this.url, options) as Promise<Response<T>>;
    }

    public replace<T>(body: T, options?: RequestOptions): Promise<Response<T>> {
        if (!options.partitionKey && this.primaryKey) {
            options.partitionKey = this.primaryKey;
        }
        return this.client.replaceDocument(this.url, body, options) as Promise<Response<T>>;
    }

    public delete<T>(options?: RequestOptions): Promise<Response<T>> {
        if (!options.partitionKey && this.primaryKey) {
            options.partitionKey = this.primaryKey;
        }
        return this.client.deleteDocument(this.url, options) as Promise<Response<T>>;
    }
}
