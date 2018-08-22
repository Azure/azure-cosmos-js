import { Helper } from "./common";
import { CosmosClientOptions } from "./CosmosClientOptions";
import { DatabaseAccount, Location } from "./documents";
import { RequestContext } from "./request/RequestContext";

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
  private availableReadLocations: Map<string, string>;
  private availableWriteLocations: Map<string, string>;
  private writeEndpoints: ReadonlyArray<string>;
  private readEndpoints: ReadonlyArray<string>;
  private lastCacheUpdateTimestamp: Date = new Date(0);
  private canRefreshInBackground: boolean;
  private defaultEndpoint: string;
  private enableMultipleWritableLocations: boolean;
  public constructor(private options: CosmosClientOptions) {
    this.defaultEndpoint = options.endpoint;
    this.writeEndpoints = [this.defaultEndpoint];
    this.readEndpoints = [this.defaultEndpoint];
  }

  public get prefferredLocations(): string[] {
    return this.options.connectionPolicy.PreferredLocations;
  }

  /**
   * Gets list of write endpoints ordered by
   * 1. Preferred location
   * 2. Endpoint availability
   */
  public getWriteEndpoints(): ReadonlyArray<string> {
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
  public getReadEnndpoints(): ReadonlyArray<string> {
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
    this.updateLocationCache(
      databaseAccount.writableLocations,
      databaseAccount.readableLocations,
      databaseAccount.enableMultipleWritableLocations
    );
  }

  public resolveServiceEndpoint(request: RequestContext): string {
    let endpoints: ReadonlyArray<string>;
    let regionIndex = 0;
    if (!Helper.isReadRequest(request)) {
      endpoints = this.writeEndpoints;
      if (!this.canUseMultipleWriteLocations() || request.resourceType !== "docs") {
        // TODO: document should be enum
        // For non-document resource types in case of client can use multiple write locations
        // or when client cannot use multiple write locations, flip-flop between the
        // first and the second writable region in DatabaseAccount (for manual failover)
        regionIndex = request.useAlternateWriteEndpoint ? 1 : 0;
        const availableWriteEndpointsByLocation = this.availableWriteLocations;
        endpoints = this.getPreferredAvailableEndpoints(
          availableWriteEndpointsByLocation,
          EndpointOperationType.None,
          this.defaultEndpoint
        );
      }
    } else {
      endpoints = this.readEndpoints;
    }
    return endpoints[regionIndex % endpoints.length];
  }

  public shouldRefreshEndpoints(): { shouldRefresh: boolean; canRefreshInBackground: boolean } {
    const mostPreferredLocation: string = this.options.connectionPolicy.PreferredLocations
      ? this.options.connectionPolicy.PreferredLocations[0]
      : null;

    let canRefreshInBackground = true;

    if (this.options.connectionPolicy.EnableEndpointDiscovery) {
      if (mostPreferredLocation) {
        if (this.availableReadLocations) {
          const mostPreferredReadEndpoint = this.availableReadLocations.get(mostPreferredLocation);
          if (mostPreferredReadEndpoint && mostPreferredReadEndpoint === this.readEndpoints[0]) {
            return { shouldRefresh: true, canRefreshInBackground };
          } else {
            return { shouldRefresh: false, canRefreshInBackground };
          }
        }
      }

      if (!this.canUseMultipleWriteLocations()) {
        if (this.isEndpointUnavailable(this.writeEndpoints[0], EndpointOperationType.Write)) {
          canRefreshInBackground = this.writeEndpoints.length > 1;
          return { shouldRefresh: true, canRefreshInBackground };
        } else {
          return { shouldRefresh: false, canRefreshInBackground };
        }
      } else if (mostPreferredLocation) {
        const mostPreferredWriteEndpoint = this.availableWriteLocations.get(mostPreferredLocation);
        if (mostPreferredWriteEndpoint) {
          return { shouldRefresh: mostPreferredWriteEndpoint !== this.writeEndpoints[0], canRefreshInBackground };
        } else {
          return { shouldRefresh: true, canRefreshInBackground };
        }
      }
    } else {
      return { shouldRefresh: false, canRefreshInBackground };
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
    writeLocations?: Location[],
    readLocations?: Location[],
    enableMultipleWritableLocations?: boolean
  ) {
    if (enableMultipleWritableLocations) {
      this.enableMultipleWritableLocations = enableMultipleWritableLocations;
    }

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

  public getPreferredAvailableEndpoints(
    endpointsByLocation: Map<string, string>,
    expectedAvailableOperation: EndpointOperationType,
    fallbackEndpoint: string
  ): string[] {
    const endpoints = [];

    if (this.options.connectionPolicy.EnableEndpointDiscovery && endpointsByLocation && endpointsByLocation.size > 0) {
      if (this.canUseMultipleWriteLocations() || expectedAvailableOperation === EndpointOperationType.Read) {
        const unavailableEndpoints: string[] = [];
        if (this.options.connectionPolicy.PreferredLocations) {
          for (const location of this.options.connectionPolicy.PreferredLocations) {
            const endpoint = endpointsByLocation.get(location);
            if (endpoint) {
              if (this.isEndpointUnavailable(endpoint, expectedAvailableOperation)) {
                unavailableEndpoints.push(endpoint);
              } else {
                endpoints.push(endpoint);
              }
            }
          }
        }

        if (endpoints.length === 0) {
          endpoints.push(fallbackEndpoint);
        }
      } else {
        for (const endpoint of endpointsByLocation.values()) {
          endpoints.push(endpoint);
        }
      }
    }

    if (endpoints.length === 0) {
      endpoints.push(fallbackEndpoint);
    }

    return endpoints;
  }

  private getEndpointByLocation(locations: Location[]): Map<string, string> {
    const endpointsByLocation: Map<string, string> = new Map();

    for (const location of locations) {
      if (!location) {
        continue;
      }

      endpointsByLocation.set(location.name.toLowerCase().replace(/ /g, ""), location.databaseAccountEndpoint);
    }
    return endpointsByLocation;
  }

  private canUseMultipleWriteLocations(): boolean {
    return this.options.connectionPolicy.UseMultipleWriteLocations && this.enableMultipleWritableLocations;
  }
}
