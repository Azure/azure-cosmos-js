import { Response } from ".";
import { Database } from "./Database";
import { RequestOptions } from "./documentclient";
import { UserDefinition } from "./UserDefinition";

export class User {
    constructor(public readonly database: Database, public readonly id: string) {

    }

    public read(options?: RequestOptions): Promise<Response<UserDefinition>> {
        throw new Error("Not yet implemented");
    }

    public replace(options?: RequestOptions): Promise<Response<UserDefinition>> {
        throw new Error("Not yet implemented");
    }

    public delete(options?: RequestOptions): Promise<Response<UserDefinition>> {
        throw new Error("Not yet implemented");
    }
}
