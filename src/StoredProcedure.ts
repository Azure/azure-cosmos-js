import { Constants } from "./common";
import { Container } from "./Container";
import { DocumentClient, RequestOptions } from "./documentclient";
import { Response } from "./request";
import { StoredProcedureDefinition } from "./StoredProcedureDefinition";

export class StoredProcedure {
    private client: DocumentClient;
    public get url() {
        return `${this.container.url}/${Constants.Path.StoredProceduresPathSegment}/${this.id}`;
    }
    constructor(public readonly container: Container, public readonly id: string) {
        this.client = this.container.database.client.documentClient;
     }

    public read(options?: RequestOptions): Promise<Response<StoredProcedureDefinition>> {
        return this.client.readStoredProcedure(this.url, options);
    }

    public replace(
        body: StoredProcedureDefinition,
        options?: RequestOptions,
    ): Promise<Response<StoredProcedureDefinition>> {
        return this.client.replaceStoredProcedure(this.url, body, options);
    }

    public delete(options?: RequestOptions): Promise<Response<StoredProcedureDefinition>> {
        return this.client.deleteStoredProcedure(this.url, options);
    }

    public execute(params?: any[], options?: RequestOptions): Promise<Response<any>>;
    public execute<T>(params?: any[], options?: RequestOptions): Promise<Response<T>> {
        return this.client.executeStoredProcedure(this.url, params, options);
    }
}
