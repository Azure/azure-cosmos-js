import { Response } from ".";
import { CosmosClient } from "./CosmosClient";
import { RequestOptions } from "./documentclient";
import { OfferDefinition } from "./OfferDefinition";

export class Offer {
    constructor(public readonly client: CosmosClient, public readonly id: string) {}

    public read(options?: RequestOptions): Promise<Response<OfferDefinition>> {
        throw new Error("Not yet implemented");
    }

    public replace(options?: RequestOptions): Promise<Response<OfferDefinition>> {
        throw new Error("Not yet implemented");
    }
}
