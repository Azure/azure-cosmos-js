import { UriFactory } from "../../common";
import { CosmosClient } from "../../CosmosClient";
import { RequestOptions, Response } from "../../request";
import { Container } from "../Container";
import { ItemResponse } from "./ItemResponse";

/**
 * Used to perform operations on a specific item.
 *
 * For operations on all items, see `container.items`.
 */
export class Item {
  private client: CosmosClient;
  /**
   * Returns a reference URL to the resource. Used for linking in Permissions.
   */
  public get url() {
    return UriFactory.createDocumentUri(this.container.database.id, this.container.id, this.id);
  }

  /**
   * @hidden
   * @param container The parent {@link Container}.
   * @param id The id of the given {@link Item}.
   * @param primaryKey The primary key of the given {@link Item} (only for partitioned containers).
   */
  constructor(public readonly container: Container, public readonly id: string, public readonly primaryKey: string) {
    this.client = this.container.database.client;
  }

  /**
   * Read the item's definition.
   *
   * There is no set schema for JSON items. They may contain any number of custom properties.
   *
   * @param options Additional options for the request, such as the partition key.
   * Note, if you provide a partition key here, it will override the primary key on this object.
   */
  public read(options?: RequestOptions): Promise<ItemResponse<any>>;
  /**
   * Read the item's definition.
   *
   * Any provided type, T, is not necessarily enforced by the SDK.
   * You may get more or less properties and it's up to your logic to enforce it.
   *
   * There is no set schema for JSON items. They may contain any number of custom properties.
   *
   * @param options Additional options for the request, such as the partition key.
   * Note, if you provide a partition key here, it will override the primary key on this object.
   */
  public read<T>(options?: RequestOptions): Promise<ItemResponse<T>>;
  public async read<T>(options?: RequestOptions): Promise<ItemResponse<T>> {
    options = options || {};
    if ((!options || !options.partitionKey) && this.primaryKey) {
      options.partitionKey = this.primaryKey;
    }
    const response = await (this.client.documentClient.readDocument(this.url, options) as Promise<Response<T>>);
    return {
      body: response.result,
      headers: response.headers,
      ref: this,
      item: this
    };
  }

  /**
   * Replace the item's definition.
   *
   * There is no set schema for JSON items. They may contain any number of custom properties.
   *
   * @param body The definition to replace the existing {@link Item}'s defintion with.
   * @param options Additional options for the request, such as the partition key.
   */
  public replace(body: any, options?: RequestOptions): Promise<ItemResponse<any>>;
  /**
   * Replace the item's definition.
   *
   * Any provided type, T, is not necessarily enforced by the SDK.
   * You may get more or less properties and it's up to your logic to enforce it.
   *
   * There is no set schema for JSON items. They may contain any number of custom properties.
   *
   * @param body The definition to replace the existing {@link Item}'s defintion with.
   * @param options Additional options for the request, such as the partition key.
   */
  public replace<T>(body: T, options?: RequestOptions): Promise<ItemResponse<T>>;
  public async replace<T>(body: T, options?: RequestOptions): Promise<ItemResponse<T>> {
    options = options || {};
    if ((!options || !options.partitionKey) && this.primaryKey) {
      options.partitionKey = this.primaryKey;
    }
    const response = await (this.client.documentClient.replaceDocument(this.url, body, options) as Promise<
      Response<T>
    >);
    return {
      body: response.result,
      headers: response.headers,
      ref: this,
      item: this
    };
  }

  /**
   * Delete the item.
   * @param options Additional options for the request, such as the partition key.
   */
  public delete(options?: RequestOptions): Promise<ItemResponse<any>>;
  /**
   * Delete the item.
   *
   * Any provided type, T, is not necessarily enforced by the SDK.
   * You may get more or less properties and it's up to your logic to enforce it.
   *
   * @param options Additional options for the request, such as the partition key.
   */
  public delete<T>(options?: RequestOptions): Promise<ItemResponse<T>>;
  public async delete<T>(options?: RequestOptions): Promise<ItemResponse<T>> {
    options = options || {};
    if ((!options || !options.partitionKey) && this.primaryKey) {
      options.partitionKey = this.primaryKey;
    }
    const response = await (this.client.documentClient.deleteDocument(this.url, options) as Promise<Response<T>>);
    return {
      body: response.result,
      headers: response.headers,
      ref: this,
      item: this
    };
  }
}
