import { Response } from ".";
import { Container } from "./Container";
import { FeedOptions, RequestOptions } from "./documentclient";
import { Item } from "./Item";
import { SqlQuerySpec } from "./queryExecutionContext";
import { QueryIterator } from "./queryIterator";

export class Items {
    constructor(public readonly container: Container) {

    }

    public getItem(id: string, partitionKey: string): Item {
        return new Item(this.container, id, partitionKey);
    }

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
    public query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T> {
        throw new Error("Not yet implemented");
    }

    public read(options?: FeedOptions): QueryIterator<any>;
    public read<T>(options?: FeedOptions): QueryIterator<T> {
        throw new Error("Not yet implemented");
    }

    public async create(body: any, options?: RequestOptions): Promise<Response<any>>;
    public async create<T>(body: T, options?: RequestOptions): Promise<Response<T>> {
        throw new Error("Not yet implemented");
    }

    public async upsert(body: any, options?: RequestOptions): Promise<Response<any>>;
    public async upsert<T>(body: T, options?: RequestOptions): Promise<Response<T>> {
        throw new Error("Not yet implemented");
    }
}
