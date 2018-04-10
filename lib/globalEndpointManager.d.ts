import { DocumentClientBase } from "./DocumentClientBase";
export declare class GlobalEndpointManager {
    private client;
    private defaultEndpoint;
    private readEndpoint;
    private writeEndpoint;
    enableEndpointDiscovery: boolean;
    private preferredLocations;
    private isEndpointCacheInitialized;
    constructor(client: DocumentClientBase);
    getReadEndpoint(): Promise<string>;
    setReadEndpoint(readEndpoint: string): void;
    getWriteEndpoint(): Promise<string>;
    setWriteEndpoint(writeEndpoint: string): void;
    refreshEndpointList(): Promise<string[]>;
    private _getDatabaseAccount();
    private static _getLocationalEndpoint(defaultEndpoint, locationName);
    private _updateLocationsCache(writableLocations, readableLocations);
}
