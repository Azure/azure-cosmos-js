import { Databases } from "./client/Database/";
import { Offers } from "./client/Offer/";
import { CosmosClientOptions } from "./CosmosClientOptions";
import { DocumentClient } from "./documentclient";

export class CosmosClient {
    public readonly databases: Databases;
    public readonly offers: Offers;
    public documentClient: DocumentClient; // TODO: This will go away.
    constructor(private options: CosmosClientOptions) {
        this.databases = new Databases(this);
        this.offers = new Offers(this);

        this.documentClient = new DocumentClient(
            options.endpoint,
            options.auth,
            options.connectionPolicy,
            options.consistencyLevel,
        );
    }
}
