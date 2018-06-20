import { Constants } from "../../common";
import { CosmosClient } from "../../CosmosClient";
import { RequestOptions, Response } from "../../request";
import { Containers } from "../Container";
import { DatabaseDefinition } from "./DatabaseDefinition";

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
