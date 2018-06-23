import { ConnectionPolicy, ConsistencyLevel } from "./documents";

export interface CosmosClientOptions {
    endpoint: string;
    auth: {
        masterKey?: string;
        permissionFeed?: any; // TODO: any
        resourceTokens?: any; // TODO: any
        tokenProvider?: any; // TODO: any
    };
    connectionPolicy?: ConnectionPolicy;
    consistencyLevel?: ConsistencyLevel;
}
