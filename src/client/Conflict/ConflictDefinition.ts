import { ItemDefinition } from "../Item";

export interface ConflictDefinition {
  /** The id of the conflict */
  id?: string;
  sourceResourceId?: string;
  conflictLSN?: string;
  operationKind?: string; // TODO: enum
  content?: ItemDefinition;
}
