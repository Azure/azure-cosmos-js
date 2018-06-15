import { Constants } from "./common";
import { ConflictDefinition } from "./ConflictDefinition";
import { Container } from "./Container";
import { CosmosClient } from "./CosmosClient";
import { RequestOptions } from "./documentclient";
import { Response } from "./request";

export class Conflict {
    public get url() {
        return `/${this.container.url}/${Constants.Path.ConflictsPathSegment}/${this.id}`;
    }
    private client: CosmosClient;
    constructor(public readonly container: Container, public readonly id: string) {
        this.client = this.container.database.client;
    }

    public read(options?: RequestOptions): Promise<Response<ConflictDefinition>> {
        return this.client.documentClient.readConflict(this.url, options);
    }

    public delete(options?: RequestOptions): Promise<Response<ConflictDefinition>> {
        return this.client.documentClient.deleteConflict(this.url, options);
    }
}
