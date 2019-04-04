import { CosmosHeaders } from "../../queryExecutionContext";
import { ResourceResponse } from "../../request";
import { OperationStats } from "../../request/OperationStatistics";
import { Resource } from "../Resource";
import { Offer } from "./Offer";
import { OfferDefinition } from "./OfferDefinition";

export class OfferResponse extends ResourceResponse<OfferDefinition & Resource> {
  constructor(
    resource: OfferDefinition & Resource,
    headers: CosmosHeaders,
    statusCode: number,
    offer: Offer,
    operationStatistics: OperationStats
  ) {
    super(resource, headers, statusCode, operationStatistics);
    this.offer = offer;
  }
  /** A reference to the {@link Offer} corresponding to the returned {@link OfferDefinition}. */
  public readonly offer: Offer;
}
