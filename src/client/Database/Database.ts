import { UriFactory } from "../../common";
import { CosmosClient } from "../../CosmosClient";
import { IHeaders } from "../../queryExecutionContext";
import { RequestOptions } from "../../request";
import { bodyKey, headersKey } from "../../symbols";
import { Container, Containers } from "../Container";
import { User, Users } from "../User";
import { DatabaseDefinition } from "./DatabaseDefinition";
import { DatabaseResponse } from "./DatabaseResponse";

export class Database {
  public readonly containers: Containers;
  public readonly users: Users;
  public [headersKey]: IHeaders;
  public [bodyKey]: DatabaseDefinition;

  public get url() {
    return UriFactory.createDatabaseUri(this.id);
  }

  constructor(
    public readonly client: CosmosClient,
    public readonly id: string,
    body?: DatabaseDefinition,
    headers?: IHeaders
  ) {
    this.containers = new Containers(this);
    this.users = new Users(this);
    this[headersKey] = headers;
    this[bodyKey] = body;
  }

  public container(id: string): Container {
    return new Container(this, id);
  }

  public user(id: string): User {
    return new User(this, id);
  }

  public async read(options?: RequestOptions): Promise<Database> {
    const response = await this.client.documentClient.readDatabase(this.url, options);
    this[headersKey] = response.headers;
    this[bodyKey] = response.result;

    return this;
  }

  public async delete(options?: RequestOptions): Promise<Database> {
    const response = await this.client.documentClient.deleteDatabase(this.url, options);
    this[headersKey] = response.headers;
    this[bodyKey] = response.result;

    return this;
  }
}
