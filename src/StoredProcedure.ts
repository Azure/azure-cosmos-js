import { Container } from "./Container";
import { RequestOptions } from "./documentclient";
import { Response } from "./request";
import { StoredProcedureDefinition } from "./StoredProcedureDefinition";

export class StoredProcedure {
    constructor(public readonly container: Container, public readonly id: string) { }

    public read(options?: RequestOptions): Promise<Response<StoredProcedureDefinition>> {
        throw new Error("Not yet implemented");
    }

    public replace(
        body: StoredProcedureDefinition,
        options?: RequestOptions,
    ): Promise<Response<StoredProcedureDefinition>> {
        throw new Error("Not yet implemented");
    }

    public delete(options?: RequestOptions): Promise<Response<StoredProcedureDefinition>> {
        throw new Error("Not yet implemented");
    }

    public execute(params?: any[], options?: RequestOptions): Promise<Response<any>>;
    public execute<T>(params?: any[], options?: RequestOptions): Promise<Response<T>> {
        throw new Error("Not yet implemented");
    }
}
