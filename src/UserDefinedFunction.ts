import { Response } from ".";
import { Container } from "./Container";
import { RequestOptions } from "./documentclient";
import { UserDefinedFunctionDefinition } from "./UserDefinedFunctionDefinition";

export class UserDefinedFunction {
    constructor(public readonly container: Container, public readonly id: string) { }

    public read(options?: RequestOptions): Promise<Response<UserDefinedFunctionDefinition>> {
        throw new Error("Not yet implemented");
    }

    public replace(options?: RequestOptions): Promise<Response<UserDefinedFunctionDefinition>> {
        throw new Error("Not yet implemented");
    }

    public delete(options?: RequestOptions): Promise<Response<UserDefinedFunctionDefinition>> {
        throw new Error("Not yet implemented");
    }
}
