import { CosmosResponse } from "../../request";
import { OfferDefinition } from "./OfferDefinition";
import { Offer } from "./Offer";

export interface OfferResponse extends CosmosResponse<OfferDefinition, Offer> {
  offer: Offer;
}
