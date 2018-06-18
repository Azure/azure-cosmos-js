import { Response } from ".";
import { AttachmentDefinition } from "./AttachmentDefinition";
import { Constants } from "./common";
import { CosmosClient } from "./CosmosClient";
import { Item } from "./Item";
import { RequestOptions } from "./request/RequestOptions";

export class Attachment {
    private client: CosmosClient;
    public get url() {
        return `/${this.item.url}/${Constants.Path.AttachmentsPathSegment}/${this.id}`;
    }
    constructor(public readonly item: Item, public readonly id: string) {
        this.client = this.item.container.database.client;
    }

    public read(options?: RequestOptions): Promise<Response<AttachmentDefinition>> {
        return this.client.documentClient.readAttachment(this.url, options);
    }

    public replace(body: AttachmentDefinition, options?: RequestOptions): Promise<Response<AttachmentDefinition>> {
        return this.client.documentClient.replaceAttachment(this.url, body, options);
    }

    public delete(options?: RequestOptions): Promise<Response<AttachmentDefinition>> {
        return this.client.documentClient.deleteAttachment(this.url, options);
    }
}
