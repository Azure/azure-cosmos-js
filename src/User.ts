import { Response } from ".";
import { Constants } from "./common";
import { CosmosClient } from "./CosmosClient";
import { Database } from "./Database";
import { RequestOptions } from "./request/RequestOptions";
import { UserDefinition } from "./UserDefinition";

export class User {
    public get url() {
        return `${this.database.url}/${Constants.Path.UsersPathSegment}/${this.id}`;
    }
    private client: CosmosClient;
    constructor(public readonly database: Database, public readonly id: string) {
        this.client = this.database.client;
    }

    public read(options?: RequestOptions): Promise<Response<UserDefinition>> {
        return this.client.documentClient.readUser(this.url, options);
    }

    public replace(body: UserDefinition, options?: RequestOptions): Promise<Response<UserDefinition>> {
        return this.client.documentClient.replaceUser(this.url, body, options);
    }

    public delete(options?: RequestOptions): Promise<Response<UserDefinition>> {
        return this.client.documentClient.deleteUser(this.id, options);
    }
}
