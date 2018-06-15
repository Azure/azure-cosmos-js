import { Databases } from "./Databases";
import { Offers } from "./Offers";

export class CosmosClient {
    public readonly databases: Databases;
    public readonly offers: Offers;
    constructor(private options: any) {
        this.databases = new Databases(this);
        this.offers = new Offers(this);
    }
}
