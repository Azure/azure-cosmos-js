import { QueryIterator } from ".";
import { CosmosClient } from "./CosmosClient";
import { OfferDefinition } from "./OfferDefinition";
import { SqlQuerySpec } from "./queryExecutionContext";
import { FeedOptions } from "./request/FeedOptions";

export class Offers {
    constructor(public readonly client: CosmosClient) {}

    public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<OfferDefinition> {
        return this.client.documentClient.queryOffers(query, options);
    }

    public read(options?: FeedOptions): QueryIterator<OfferDefinition> {
        return this.client.documentClient.readOffers(options);
    }
}
