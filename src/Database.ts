import { Response } from ".";
import { Containers } from "./Containers";
import { CosmosClient } from "./CosmosClient";
import { DatabaseDefinition } from "./DatabaseDefinition";
import { RequestOptions } from "./documentclient";

export class Database {
    public readonly containers: Containers;

    constructor(public readonly client: CosmosClient, public readonly id: string) {
        this.containers = new Containers(this);
    }

    public read(options?: RequestOptions): Promise<Response<DatabaseDefinition>> {
        throw new Error("Not yet implemented");
    }

    public replace(options?: RequestOptions): Promise<Response<DatabaseDefinition>> {
        throw new Error("Not yet implemented");
    }

    public delete(options?: RequestOptions): Promise<Response<DatabaseDefinition>> {
        throw new Error("Not yet implemented");
    }
}
