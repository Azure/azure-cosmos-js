import { UriFactory } from "../../common";
import { CosmosClient } from "../../CosmosClient";
import { RequestOptions } from "../../request";
import { Container, Containers } from "../Container";
import { User, Users } from "../User";
import { DatabaseResponse } from "./DatabaseResponse";

/**
 * Operations for reading or deleting an existing database.
 *
 * @see {@link Databases} for creating new databases, and reading/querying all databases; use `client.databases`.
 *
 * Note: all these operations make calls against a fixed budget.
 * You should design your system such that these calls scale sublinearly with your application.
 * For instance, do not call `database.read()` before every single `item.read()` call, to ensure the database exists;
 * do this once on application start up.
 */
export class Database {
  /**
   * Used for creating new containers, or querying/reading all containers.
   *
   * Use `.container(id)` to read, replace, or delete a specific, existing {@link Database} by id.
   *
   * @example Create a new container
   * ```typescript
   * const {body: containerDefinition, container} = await client.database("<db id>").containers.create({id: "<container id>"});
   * ```
   */
  public readonly containers: Containers;
  /**
   * Used for creating new users, or querying/reading all users.
   *
   * Use `.user(id)` to read, replace, or delete a specific, existing {@link User} by id.
   */
  public readonly users: Users;

  /**
   * Returns a reference URL to the resource. Used for linking in Permissions.
   */
  public get url() {
    return UriFactory.createDatabaseUri(this.id);
  }

  /** Returns a new {@link Database} instance.
   *
   * Note: the intention is to get this object from {@link CosmosClient} via `client.databsae(id)`, not to instaniate it yourself.
   */
  constructor(public readonly client: CosmosClient, public readonly id: string) {
    this.containers = new Containers(this);
    this.users = new Users(this);
  }

  /**
   * Used to read, replace, or delete a specific, existing {@link Database} by id.
   *
   * Use `.containers` creating new containers, or querying/reading all containers.
   *
   * @example Delete a container
   * ```typescript
   * await client.database("<db id>").container("<container id>").delete();
   * ```
   */
  public container(id: string): Container {
    return new Container(this, id);
  }

  /**
   * Used to read, replace, or delete a specific, existing {@link User} by id.
   *
   * Use `.users` for creating new users, or querying/reading all users.
   */
  public user(id: string): User {
    return new User(this, id);
  }

  /** Read the definition of the given Database. */
  public async read(options?: RequestOptions): Promise<DatabaseResponse> {
    const response = await this.client.documentClient.readDatabase(this.url, options);
    return {
      body: response.result,
      headers: response.headers,
      ref: this,
      database: this
    };
  }

  /** Delete the given Database. */
  public async delete(options?: RequestOptions): Promise<DatabaseResponse> {
    const response = await this.client.documentClient.deleteDatabase(this.url, options);
    return {
      body: response.result,
      headers: response.headers,
      ref: this,
      database: this
    };
  }
}
