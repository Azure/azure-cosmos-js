import { Container } from "./Container";
import { FeedOptions, RequestOptions } from "./documentclient";
import { SqlQuerySpec } from "./queryExecutionContext";
import { QueryIterator } from "./queryIterator";
import { Response } from "./request";
import { StoredProcedure } from "./StoredProcedure";
import { StoredProcedureDefinition } from "./StoredProcedureDefinition";

export class StoredProcedures {
    constructor(public readonly container: Container) { }

    public getStoredProcedure(id: string): StoredProcedure {
        return new StoredProcedure(this.container, id);
    }
    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<StoredProcedureDefinition> {
        throw new Error("Not yet implemented");
    }

    public read(options?: FeedOptions): QueryIterator<StoredProcedureDefinition> {
        throw new Error("Not yet implemented");
    }

    public async create(
        body: StoredProcedureDefinition,
        options?: RequestOptions,
    ): Promise<Response<StoredProcedureDefinition>> {
        throw new Error("Not yet implemented");
    }

    public async upsert(
        body: StoredProcedureDefinition,
        options?: RequestOptions,
    ): Promise<Response<StoredProcedureDefinition>> {
        throw new Error("Not yet implemented");
    }
}
