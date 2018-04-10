import { ConnectionMode, MediaReadMode } from ".";
import { RetryOptions } from "../retry";
export declare class ConnectionPolicy {
    private static readonly defaultRequestTimeout;
    private static readonly defaultMediaRequestTimeout;
    ConnectionMode: ConnectionMode;
    MediaReadMode: MediaReadMode;
    MediaRequestTimeout: number;
    RequestTimeout: number;
    EnableEndpointDiscovery: boolean;
    PreferredLocations: string[];
    RetryOptions: RetryOptions;
    DisableSSLVerification: boolean;
    ProxyUrl: string;
}
