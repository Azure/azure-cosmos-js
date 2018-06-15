import { QueryIterator, Response } from ".";
import { Container } from "./Container";
import { FeedOptions, RequestOptions } from "./documentclient";
import { SqlQuerySpec } from "./queryExecutionContext";
import { UserDefinedFunction } from "./UserDefinedFunction";
import { UserDefinedFunctionDefinition } from "./UserDefinedFunctionDefinition";

export class UserDefinedFunctions {
    constructor(public readonly container: Container) { }

    public getUserDefinedFunction(id: string): UserDefinedFunction {
        return new UserDefinedFunction(this.container, id);
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<UserDefinedFunctionDefinition> {
        throw new Error("Not yet implemented");
    }

    public read(options?: FeedOptions): QueryIterator<UserDefinedFunctionDefinition> {
        throw new Error("Not yet implemented");
    }

    public create(
        body: UserDefinedFunctionDefinition,
        options?: RequestOptions,
    ): Promise<Response<UserDefinedFunctionDefinition>> {
        throw new Error("Not yet implemented");
    }

    public upsert(
        body: UserDefinedFunctionDefinition,
        options?: RequestOptions,
    ): Promise<Response<UserDefinedFunctionDefinition>> {
        throw new Error("Not yet implemented");
    }
}
