import { Response } from ".";
import { Constants } from "./common";
import { Container } from "./Container";
import { CosmosClient } from "./CosmosClient";
import { RequestOptions } from "./request/RequestOptions";
import { UserDefinedFunctionDefinition } from "./UserDefinedFunctionDefinition";

export class UserDefinedFunction {

    public get url() {
        return `${this.container.url}/${Constants.Path.UserDefinedFunctionsPathSegment}/${this.id}`;
    }
    private client: CosmosClient;
    constructor(public readonly container: Container, public readonly id: string) {
        this.client = this.container.database.client;
    }

    public read(options?: RequestOptions): Promise<Response<UserDefinedFunctionDefinition>> {
        return this.client.documentClient.readUserDefinedFunction(this.url, options);
    }

    public replace(
        body: UserDefinedFunctionDefinition,
        options?: RequestOptions,
    ): Promise<Response<UserDefinedFunctionDefinition>> {
        return this.client.documentClient.replaceUserDefinedFunction(this.url, body, options);
    }

    public delete(options?: RequestOptions): Promise<Response<UserDefinedFunctionDefinition>> {
        return this.client.documentClient.deleteUserDefinedFunction(this.url, options);
    }
}
