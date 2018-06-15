import { QueryIterator, Response } from ".";
import { Database } from "./Database";
import { FeedOptions, RequestOptions } from "./documentclient";
import { SqlQuerySpec } from "./queryExecutionContext";
import { User } from "./User";
import { UserDefinition } from "./UserDefinition";

export class Users {
    constructor(public readonly database: Database) {}
    public getUser(id: string): User {
        return new User(this.database, id);
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<UserDefinition> {
        throw new Error("Not yet implemented");
    }

    public read(options?: FeedOptions): QueryIterator<UserDefinition> {
        throw new Error("Not yet implemented");
    }

    public create(
        body: UserDefinition,
        options?: RequestOptions,
    ): Promise<Response<UserDefinition>> {
        throw new Error("Not yet implemented");
    }

    public upsert(
        body: UserDefinition,
        options?: RequestOptions,
    ): Promise<Response<UserDefinition>> {
        throw new Error("Not yet implemented");
    }
}
