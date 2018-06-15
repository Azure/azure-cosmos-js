import { Response } from ".";
import { Constants } from "./common";
import { Container } from "./Container";
import { CosmosClient } from "./CosmosClient";
import { RequestOptions } from "./documentclient";
import { TriggerDefinition } from "./TriggerDefinition";

export class Trigger {
    public get url() {
        return `${this.container.url}/${Constants.Path.TriggersPathSegment}/${this.id}`;
    }

    private client: CosmosClient;

    constructor(public readonly container: Container, public readonly id: string) {
        this.client = this.container.database.client;
     }

    public read(options?: RequestOptions): Promise<Response<TriggerDefinition>> {
        return this.client.documentClient.readTrigger(this.url, options);
    }

    public replace(body: TriggerDefinition, options?: RequestOptions): Promise<Response<TriggerDefinition>> {
        return this.client.documentClient.replaceTrigger(this.url, body, options);
    }

    public delete(options?: RequestOptions): Promise<Response<TriggerDefinition>> {
        return this.client.documentClient.deleteTrigger(this.url, options);
    }
}
