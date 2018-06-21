import { IndexingPolicy, PartitionKey, PartitionKeyDefinition } from "../../documents";

export interface ContainerDefinition {
    id?: string;
    partitionKey?: PartitionKeyDefinition;
    indexingPolicy?: IndexingPolicy;
}
