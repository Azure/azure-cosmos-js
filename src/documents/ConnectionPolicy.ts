import { RetryOptions } from "../retry";
import { ConnectionMode } from "./index";
/**
 * Represents the Connection policy associated with a CosmosClient in the Azure Cosmos DB database service.
 */
export interface ConnectionPolicy {
  /** Determines which mode to connect to Cosmos with. (Currently only supports Gateway option) */
  ConnectionMode?: ConnectionMode;
  /** Request timeout (time to wait for response from network peer). Represented in milliseconds. */
  RequestTimeout?: number;
  /** Flag to enable/disable automatic redirecting of requests based on read/write operations. */
  EnableEndpointDiscovery?: boolean;
  /** List of azure regions to be used as preferred locations for read requests. */
  PreferredLocations?: string[];
  /** RetryOptions instance which defines several configurable properties used during retry. */
  RetryOptions?: RetryOptions;
  /**
   * Flag to disable SSL verification for the requests. SSL verification is enabled by default. Don't set this when targeting production endpoints.
   * This is intended to be used only when targeting emulator endpoint to avoid failing your requests with SSL related error.
   */
  DisableSSLVerification?: boolean;
  /**
   * The flag that enables writes on any locations (regions) for geo-replicated database accounts in the Azure Cosmos DB service.
   * Default is `false`.
   */
  UseMultipleWriteLocations?: boolean;
}

export const defaultConnectionPolicy: Readonly<ConnectionPolicy> = Object.freeze({
  ConnectionMode: ConnectionMode.Gateway,
  RequestTimeout: 60000,
  EnableEndpointDiscovery: true,
  PreferredLocations: [],
  RetryOptions: new RetryOptions(),
  DisableSSLVerification: false,
  UseMultipleWriteLocations: false
});
