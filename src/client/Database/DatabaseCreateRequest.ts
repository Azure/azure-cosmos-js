import { DatabaseDefinition } from "./DatabaseDefinition";

export interface DatabaseCreateRequest extends DatabaseDefinition {
  /** Throughput for this database. */
  throughput?: number;
}
