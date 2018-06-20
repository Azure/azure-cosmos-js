import { Readable } from "stream";
import { CosmosClient, QueryIterator, Response } from "../..";
import { SqlQuerySpec } from "../../queryExecutionContext";
import { FeedOptions } from "../../request/FeedOptions";
import { RequestOptions } from "../../request/RequestOptions";
import { Item } from "../Item";
import { Attachment } from "./Attachment";
import { AttachmentDefinition } from "./AttachmentDefinition";

export class Attachments {
    private client: CosmosClient;
    constructor(public readonly item: Item) {
        this.client = this.item.container.database.client;
    }

    public getAttachment(id: string): Attachment {
        return new Attachment(this.item, id);
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<AttachmentDefinition> {
        return this.client.documentClient.queryAttachments(this.item.url, query, options);
    }

    public read(options?: FeedOptions): QueryIterator<AttachmentDefinition> {
        return this.client.documentClient.readAttachments(this.item.url, options);
    }

    public create(body: AttachmentDefinition, options?: RequestOptions): Promise<Response<AttachmentDefinition>> {
        return this.client.documentClient.createAttachment(this.item.url, body, options);
    }

    public upsert(body: AttachmentDefinition, options?: RequestOptions): Promise<Response<AttachmentDefinition>> {
        return this.client.documentClient.upsertAttachment(this.item.url, body, options);
    }

    public createAndUploadMedia(
        readableStream: Readable,
        options?: RequestOptions,
    ): Promise<Response<AttachmentDefinition>> {
        return this.client.documentClient.createAttachmentAndUploadMedia(this.item.url, readableStream, options);
    }

    public upsertAndUploadMedia(
        readableStream: Readable,
        options?: RequestOptions,
    ): Promise<Response<AttachmentDefinition>> {
        return this.client.documentClient.upsertAttachmentAndUploadMedia(this.item.url, readableStream, options);
    }
}
