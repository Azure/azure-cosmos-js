import { CosmosResponse } from "../../request";
import { StoredProcedureDefinition } from "./StoredProcedureDefinition";
import { StoredProcedure } from "./StoredProcedure";

export interface StoredProcedureResponse extends CosmosResponse<StoredProcedureDefinition, StoredProcedure> {
  storedProcedure: StoredProcedure;
}
