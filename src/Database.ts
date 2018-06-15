import { Response } from ".";
import { Constants } from "./common";
import { Containers } from "./Containers";
import { CosmosClient } from "./CosmosClient";
import { DatabaseDefinition } from "./DatabaseDefinition";
import { RequestOptions } from "./documentclient";

export class Database {
    public readonly containers: Containers;

    public get url() {
        return `/${Constants.Path.DatabasesPathSegment}/${this.id}`;
    }

    constructor(public readonly client: CosmosClient, public readonly id: string) {
        this.containers = new Containers(this);
    }

    public read(options?: RequestOptions): Promise<Response<DatabaseDefinition>> {
        return this.client.documentClient.readDatabase(this.url, options);
    }

    public delete(options?: RequestOptions): Promise<Response<DatabaseDefinition>> {
        return this.client.documentClient.deleteDatabase(this.url, options);
    }
}
