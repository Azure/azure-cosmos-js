import { UriFactory } from "../../common";
import { CosmosClient } from "../../CosmosClient";
import { RequestOptions } from "../../request";
import { Containers } from "../Container";
import { Users } from "../User";
import { DatabaseResponse } from "./DatabaseResponse";

export class Database {
    public readonly containers: Containers;
    public readonly users: Users;

    public get url() {
        return UriFactory.createDatabaseUri(this.id);
    }

    constructor(public readonly client: CosmosClient, public readonly id: string) {
        this.containers = new Containers(this);
        this.users = new Users(this);
    }

    public async read(options?: RequestOptions): Promise<DatabaseResponse> {
        const response = await this.client.documentClient.readDatabase(this.url, options);
        return { body: response.result, headers: response.headers, ref: this, database: this };
    }

    public async delete(options?: RequestOptions): Promise<DatabaseResponse> {
        const response = await this.client.documentClient.deleteDatabase(this.url, options);
        return { body: response.result, headers: response.headers, ref: this, database: this };
    }
}
