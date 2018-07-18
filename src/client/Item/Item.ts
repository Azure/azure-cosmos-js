import { UriFactory } from "../../common";
import { CosmosClient } from "../../CosmosClient";
import { RequestOptions, Response } from "../../request";
import { headersKey, refKey } from "../../symbols";
import { Container } from "../Container";

export class Item {
  private client: CosmosClient;
  public get url() {
    return UriFactory.createDocumentUri(this.container.database.id, this.container.id, this.id);
  }

  constructor(public readonly container: Container, public readonly id: string, public readonly primaryKey: string) {
    this.client = this.container.database.client;
  }

  public read(options?: RequestOptions): Promise<ItemDef>;
  public read<T>(options?: RequestOptions): Promise<T>;
  public async read<T>(options?: RequestOptions): Promise<T> {
    options = options || {};
    if ((!options || !options.partitionKey) && this.primaryKey) {
      options.partitionKey = this.primaryKey;
    }
    const { result, headers } = await (this.client.documentClient.readDocument(this.url, options) as Promise<any>);
    result[headersKey] = headers;
    result[refKey] = this;
    return result;
  }

  public replace(body: any, options?: RequestOptions): Promise<Response<ItemDef>>;
  public replace<T>(body: T, options?: RequestOptions): Promise<Response<T>>;
  public async replace<T>(body: T, options?: RequestOptions): Promise<Response<T>> {
    options = options || {};
    if ((!options || !options.partitionKey) && this.primaryKey) {
      options.partitionKey = this.primaryKey;
    }
    const { result, headers } = await (this.client.documentClient.replaceDocument(this.url, body, options) as Promise<
      any
    >);
    result[headersKey] = headers;
    result[refKey] = this;
    return result;
  }

  public delete(options?: RequestOptions): Promise<Response<ItemDef>>;
  public delete<T>(options?: RequestOptions): Promise<Response<T>>;
  public async delete<T>(options?: RequestOptions): Promise<Response<T>> {
    options = options || {};
    if ((!options || !options.partitionKey) && this.primaryKey) {
      options.partitionKey = this.primaryKey;
    }
    const response = await (this.client.documentClient.deleteDocument(this.url, options) as Promise<any>);
    const { result = {}, headers } = response;
    result[headersKey] = headers;
    result[refKey] = this;
    return result;
  }
}

export interface ItemDef {
  id: string;
  ttl?: string;
  [key: string]: any;
}
