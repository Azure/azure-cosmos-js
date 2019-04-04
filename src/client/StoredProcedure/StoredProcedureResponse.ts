import { CosmosHeaders } from "../../queryExecutionContext";
import { ResourceResponse } from "../../request";
import { OperationStats } from "../../request/OperationStatistics";
import { Resource } from "../Resource";
import { StoredProcedure } from "./StoredProcedure";
import { StoredProcedureDefinition } from "./StoredProcedureDefinition";

export class StoredProcedureResponse extends ResourceResponse<StoredProcedureDefinition & Resource> {
  constructor(
    resource: StoredProcedureDefinition & Resource,
    headers: CosmosHeaders,
    statusCode: number,
    storedProcedure: StoredProcedure,
    operationStatistics: OperationStats
  ) {
    super(resource, headers, statusCode, operationStatistics);
    this.storedProcedure = storedProcedure;
  }
  /**
   * A reference to the {@link StoredProcedure} which the {@link StoredProcedureDefinition} corresponds to.
   */
  public readonly storedProcedure: StoredProcedure;

  /**
   * Alias for storedProcedure.
   *
   * A reference to the {@link StoredProcedure} which the {@link StoredProcedureDefinition} corresponds to.
   */
  public get sproc(): StoredProcedure {
    return this.storedProcedure;
  }
}
