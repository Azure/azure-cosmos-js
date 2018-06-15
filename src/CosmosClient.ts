import { CosmosClientOptions } from "./CosmosClientOptions";
import { Databases } from "./Databases";
import { DocumentClient } from "./documentclient";
import { Offers } from "./Offers";

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
