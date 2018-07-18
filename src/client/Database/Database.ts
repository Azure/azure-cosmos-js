import { UriFactory } from "../../common";
import { CosmosClient } from "../../CosmosClient";
import { IHeaders } from "../../queryExecutionContext";
import { RequestOptions } from "../../request";
import { headersKey, refKey } from "../../symbols";
import { Container, Containers } from "../Container";
import { User, Users } from "../User";
import { DatabaseDefinition } from "./DatabaseDefinition";
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

  public container(id: string): Container {
    return new Container(this, id);
  }

  public user(id: string): User {
    return new User(this, id);
  }

  public async read(options?: RequestOptions): Promise<DatabaseDefinition> {
    const { result, headers } = await this.client.documentClient.readDatabase(this.url, options);
    result[headersKey] = headers;
    result[refKey] = this;
    return result;
  }

  public async delete(options?: RequestOptions): Promise<DatabaseDefinition> {
    const response = await this.client.documentClient.deleteDatabase(this.url, options);
    const { result = {}, headers } = response;
    result[headersKey] = headers;
    result[refKey] = this;
    return result;
  }
}
