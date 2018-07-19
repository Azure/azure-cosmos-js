import { UriFactory } from "../../common";
import { CosmosClient } from "../../CosmosClient";
import { RequestOptions } from "../../request";
import { Database } from "../Database";
import { Permission, Permissions } from "../Permission";
import { UserDefinition } from "./UserDefinition";
import { UserResponse } from "./UserResponse";

/**
 * Used to read, replace, and delete Users.
 *
 * Additionally, you can access the permissions for a given user via `user.permission` and `user.permissions`.
 *
 * @see {@link Users} to create, upsert, query, or read all.
 */
export class User {
  /**
   * Operations for creating, upserting, querying, or reading all operations.
   *
   * See `client.permission(id)` to read, replace, or delete a specific Permission by id.
   */
  public readonly permissions: Permissions;
  /**
   * Returns a reference URL to the resource. Used for linking in Permissions.
   */
  public get url() {
    return UriFactory.createUserUri(this.database.id, this.id);
  }
  private client: CosmosClient;
  /**
   * @hidden
   * @param database The parent {@link Database}.
   * @param id
   */
  constructor(public readonly database: Database, public readonly id: string) {
    this.client = this.database.client;
    this.permissions = new Permissions(this);
  }

  /**
   * Operations to read, replace, or delete a specific Permission by id.
   *
   * See `client.permissions` for creating, upserting, querying, or reading all operations.
   * @param id
   */
  public permission(id: string): Permission {
    return new Permission(this, id);
  }

  /**
   * Read the {@link UserDefinition} for the given {@link User}.
   * @param options
   */
  public async read(options?: RequestOptions): Promise<UserResponse> {
    const response = await this.client.documentClient.readUser(this.url, options);
    return { body: response.result, headers: response.headers, ref: this, user: this };
  }

  /**
   * Replace the given {@link User}'s definition with the specified {@link UserDefinition}.
   * @param body The specified {@link UserDefinition} to replace the definition.
   * @param options
   */
  public async replace(body: UserDefinition, options?: RequestOptions): Promise<UserResponse> {
    const response = await this.client.documentClient.replaceUser(this.url, body, options);
    return { body: response.result, headers: response.headers, ref: this, user: this };
  }

  /**
   * Delete the given {@link User}.
   * @param options
   */
  public async delete(options?: RequestOptions): Promise<UserResponse> {
    const response = await this.client.documentClient.deleteUser(this.url, options);
    return { body: response.result, headers: response.headers, ref: this, user: this };
  }
}
