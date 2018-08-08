import { CosmosClientOptions } from "./CosmosClientOptions";
import { DatabaseAccount } from "./documents";

enum EndpointOperationType {
  None = "None",
  Read = "Read",
  Write = "Write"
}

interface LocationUnavailabilityInfo {
  lastUnavailablityCheckTimeStamp: Date;
  operationTypes: Set<keyof typeof EndpointOperationType>;
}

/**
 * Implements the abstraction to resolve target location for geo-replicated Database Account
 * with multiple writable and readable locations.
 */
export class LocationCache {
  private locationUnavailabilityInfoByEndpoint: Map<string, LocationUnavailabilityInfo> = new Map();
  private availableReadLocations: { [location: string]: string };
  private availableWriteLocations: { [location: string]: string };
  private writeEndpoints: string[];
  private readEndpoints: string[];
  private lastCacheUpdateTimestamp: Date = new Date(0);
  private canRefreshInBackground: boolean;
  defaultEndpoint: any;
  public constructor(private options: CosmosClientOptions) {}

  /**
   * Gets list of write endpoints ordered by
   * 1. Preferred location
   * 2. Endpoint availability
   */
  public getWriteEndpoints(): string[] {
    if (
      this.locationUnavailabilityInfoByEndpoint.size > 0 &&
      new Date(Date.now() - this.options.connectionPolicy.backgroundRefreshLocationTimeIntervalMS) >
        this.lastCacheUpdateTimestamp
    ) {
      this.updateLocationCache();
    }
    return this.writeEndpoints;
  }

  /**
   * Gets list of read endpoints ordered by
   * 1. Preferred location
   * 2. Endpoint availability
   */
  public getReadEnndpoints(): string[] {
    if (
      this.locationUnavailabilityInfoByEndpoint.size > 0 &&
      new Date(Date.now() - this.options.connectionPolicy.backgroundRefreshLocationTimeIntervalMS) >
        this.lastCacheUpdateTimestamp
    ) {
      this.updateLocationCache();
    }
    return this.readEndpoints;
  }

  public getWriteEndpoint(): string {
    return this.getWriteEndpoints()[0];
  }

  public getReadEndpoint(): string {
    return this.getReadEnndpoints()[0];
  }

  public getAlternativeWriteEndpoint(): string {
    if (this.writeEndpoints.length >= 2) {
      return this.writeEndpoints[1];
    } else {
      return null;
    }
  }

  public markCurrentLocationUnavailableForRead() {
    this.markEndpointUnavailable(this.readEndpoints[0], EndpointOperationType.Read);
  }

  public markCurrentLocationUnavailableForWrite() {
    this.markEndpointUnavailable(this.writeEndpoints[0], EndpointOperationType.Write);
  }

  /**
   * Invoked when {@link DatabaseAccount} is read
   * @param databaseAccount The DatabaseAccount read
   */
  public onDatabaseAccountRead(databaseAccount: DatabaseAccount) {
    this.updateLocationCache(databaseAccount._writableLocations, databaseAccount._readableLocations, undefined); // TODO: need to update Database account info)
  }

  private resolveServiceEndpoint(request: any): string {}

  private shouldRefreshEndpoints(): boolean {
    const mostPreferredLocation: string = this.options.connectionPolicy.PreferredLocations
      ? this.options.connectionPolicy.PreferredLocations[0]
      : null;

    if (this.options.connectionPolicy.EnableEndpointDiscovery) {
      if (mostPreferredLocation) {
        if (this.availableReadLocations) {
          const mostPreferredReadEndpoint = this.availableReadLocations[mostPreferredLocation];
          if (mostPreferredReadEndpoint && mostPreferredReadEndpoint === this.readEndpoints[0]) {
            return true;
          } else {
            return false;
          }
        }
      }

      if (!this.canUseMultipleWriteLocations()) {
        if (this.isEndpointUnavailable(this.writeEndpoints[0], EndpointOperationType.Write)) {
          this.canRefreshInBackground = this.writeEndpoints.length > 1;
          return true;
        } else {
          return false;
        }
      } else if (mostPreferredLocation) {
        const mostPreferredWriteEndpoint = this.availableWriteLocations[mostPreferredLocation];
        if (mostPreferredWriteEndpoint) {
          return mostPreferredWriteEndpoint !== this.writeEndpoints[0];
        } else {
          return true;
        }
      }
    } else {
      return false;
    }
  }

  private clearStaleEndpointUnavailabilityInfo() {
    if (this.locationUnavailabilityInfoByEndpoint.size > 0) {
      for (const [endpoint, info] of this.locationUnavailabilityInfoByEndpoint.entries()) {
        if (
          info &&
          new Date(Date.now() - this.options.connectionPolicy.backgroundRefreshLocationTimeIntervalMS) >
            info.lastUnavailablityCheckTimeStamp
        ) {
          this.locationUnavailabilityInfoByEndpoint.delete(endpoint);
        }
      }
    }
  }

  private isEndpointUnavailable(endpoint: string, expectedAvailableOperations: EndpointOperationType) {
    const unavailabilityInfo = this.locationUnavailabilityInfoByEndpoint.get(endpoint);

    if (
      expectedAvailableOperations === EndpointOperationType.None ||
      unavailabilityInfo == null ||
      !unavailabilityInfo.operationTypes.has(expectedAvailableOperations)
    ) {
      return false;
    } else {
      if (
        new Date(Date.now() - this.options.connectionPolicy.backgroundRefreshLocationTimeIntervalMS) >
        unavailabilityInfo.lastUnavailablityCheckTimeStamp
      ) {
        return false;
      } else {
        return true;
      }
    }
  }

  private markEndpointUnavailable(unavailableEndpoint: string, unavailableOperationType: EndpointOperationType) {
    const unavailabilityInfo = this.locationUnavailabilityInfoByEndpoint.get(unavailableEndpoint);
    const now = new Date(Date.now());
    if (unavailabilityInfo == null) {
      this.locationUnavailabilityInfoByEndpoint.set(unavailableEndpoint, {
        lastUnavailablityCheckTimeStamp: now,
        operationTypes: new Set<keyof typeof EndpointOperationType>([unavailableOperationType])
      });
    } else {
      const unavailableOperations = new Set<keyof typeof EndpointOperationType>([unavailableOperationType]);
      for (const op of unavailabilityInfo.operationTypes) {
        unavailableOperations.add(op);
      }
      this.locationUnavailabilityInfoByEndpoint.set(unavailableEndpoint, {
        lastUnavailablityCheckTimeStamp: now,
        operationTypes: unavailableOperations
      });
    }

    this.updateLocationCache();
  }

  private updateLocationCache(
    writeLocations?: string[],
    readLocations?: string[],
    enableMultipleWriteLocations?: boolean
  ) {
    this.clearStaleEndpointUnavailabilityInfo();

    if (this.options.connectionPolicy.EnableEndpointDiscovery) {
      if (readLocations) {
        this.availableReadLocations = this.getEndpointByLocation(readLocations);
      }

      if (writeLocations) {
        this.availableWriteLocations = this.getEndpointByLocation(writeLocations);
      }
    }

    this.writeEndpoints = this.getPreferredAvailableEndpoints(
      this.availableWriteLocations,
      EndpointOperationType.Write,
      this.defaultEndpoint
    );

    this.readEndpoints = this.getPreferredAvailableEndpoints(
      this.availableReadLocations,
      EndpointOperationType.Read,
      this.defaultEndpoint
    );

    this.lastCacheUpdateTimestamp = new Date(Date.now());
  }

  private getPreferredAvailableEndpoints(
    endpointsByLocation: Map<string, string>,
    expectedAvailableOperation: EndpointOperationType,
    fallbackEndpoint: string
  ): string[] {
    const endpoints = [];

    if (this.options.connectionPolicy.EnableEndpointDiscovery && endpointsByLocation && endpointsByLocation.size > 0) {
    }
  }

  private getEndpointByLocation(locations: string[]): { [location: string]: string } {}

  private canUseMultipleWriteLocations(): boolean {}
}
