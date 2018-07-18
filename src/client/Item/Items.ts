import { DocumentClient } from "../../documentclient";
import { SqlQuerySpec } from "../../queryExecutionContext";
import { QueryIterator } from "../../queryIterator";
import { FeedOptions, RequestOptions, Response } from "../../request";
import { headersKey, refKey } from "../../symbols";
import { Container } from "../Container";
import { Item, ItemDef } from "./Item";
import { ItemResponse } from "./ItemResponse";

export class Items {
  private client: DocumentClient;
  constructor(public readonly container: Container) {
    this.client = this.container.database.client.documentClient;
  }

  public query(query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
  public query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
  public query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T> {
    return this.client.queryDocuments(this.container.url, query, options) as QueryIterator<T>;
  }

  public readAll(options?: FeedOptions): QueryIterator<any>;
  public readAll<T>(options?: FeedOptions): QueryIterator<T>;
  public readAll<T>(options?: FeedOptions): QueryIterator<T> {
    return this.client.readDocuments(this.container.url, options) as QueryIterator<T>;
  }

  /**
   * Create a item.
   * <p>
   * There is no set schema for JSON items. They may contain any number of custom properties as \
   * well as an optional list of attachments. <br>
   * A item is an application resource and can be authorized using the master key or resource keys
   * </p>
   * @param body  - Represents the body of the item. Can contain any number of user defined properties.
   */
  public async create(body: any, options?: RequestOptions): Promise<ItemDef>;
  public async create<T>(body: T, options?: RequestOptions): Promise<T>;
  public async create<T>(body: T, options?: RequestOptions): Promise<T> {
    const { result, headers } = await (this.client.createDocument(this.container.url, body, options) as Promise<any>);
    const ref = new Item(this.container, (result as any).id, (options && options.partitionKey) as string);
    result[headersKey] = headers;
    result[refKey] = ref;
    return result;
  }

  /**
   * Upsert an item.
   * <p>
   * There is no set schema for JSON items. They may contain any number of custom properties.<br>
   * An Item is an application resource and can be authorized using the master key or resource keys
   * </p>
   */
  public async upsert(body: any, options?: RequestOptions): Promise<ItemDef>;
  public async upsert<T>(body: T, options?: RequestOptions): Promise<T>;
  public async upsert<T>(body: T, options?: RequestOptions): Promise<T> {
    const { result, headers } = await this.client.upsertDocument(this.container.url, body, options);
    const ref = new Item(this.container, (result as any).id, (options && options.partitionKey) as string);
    result[headersKey] = headers;
    result[refKey] = ref;
    return result;
  }
}
