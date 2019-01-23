import { ContainerDefinition } from "./ContainerDefinition";

export interface ContainerCreateRequest extends ContainerDefinition {
  /** Throughput for this container. */
  throughput?: number;
}
