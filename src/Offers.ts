import { QueryIterator } from ".";
import { CosmosClient } from "./CosmosClient";
import { FeedOptions } from "./documentclient";
import { OfferDefinition } from "./OfferDefinition";
import { SqlQuerySpec } from "./queryExecutionContext";

export class Offers {
    constructor(public readonly client: CosmosClient) {}

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<OfferDefinition> {
        throw new Error("Not yet implemented");
    }

    public read(options?: FeedOptions): QueryIterator<OfferDefinition> {
        throw new Error("Not yet implemented");
    }
}
