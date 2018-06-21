import { ConnectionPolicy, ConsistencyLevel } from "./documents";

export interface CosmosClientOptions {
    endpoint: string;
    auth: {
        masterKey?: string;
        permissionFeed?: any; // TODO: resource tokens
        tokenProvider?: any; // TODO: auth callback
    };
    connectionPolicy?: ConnectionPolicy;
    consistencyLevel?: ConsistencyLevel;
}
