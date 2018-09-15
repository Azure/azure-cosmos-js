import { CosmosClientOptions } from "../../CosmosClientOptions";
import { ConnectionPolicy, DatabaseAccount, Location } from "../../documents";
import { LocationCache } from "../../LocationCache";

import * as assert from "assert";
import { Constants, ResourceType } from "../../common";

const scenarios: Scenario[] = [];
const regions = ["westus", "eastus", "eastus2", "southcentralus", "seasia"];

interface Scenario {
  defaultEndpoint?: string;
  connectionPolicy?: ConnectionPolicy;
  databaseAccount?: DatabaseAccount;
}

function getEndpointFromRegion(regionName?: string) {
  const prefix = "https://test";
  const suffix = ".documents.azure.com:443";
  return `${prefix}${regionName ? `-${regionName}` : ""}${suffix}`;
}

function addScenario(options?: { numberOfRegions?: number; useMultipleWriteLocations?: boolean }) {
  const connectionPolicy = new ConnectionPolicy();
  const databaseAccountConfig: {
    writableLocations?: Location[];
    readableLocations?: Location[];
    enableMultipleWriteLocations?: boolean;
  } = {};
  const defaultEndpoint = getEndpointFromRegion();

  if (options) {
    if (options.numberOfRegions) {
      connectionPolicy.PreferredLocations = regions.slice(0, options.numberOfRegions);
      databaseAccountConfig.readableLocations = connectionPolicy.PreferredLocations.map(locationName => {
        return { name: locationName, databaseAccountEndpoint: getEndpointFromRegion(locationName) };
      });
      if (options.useMultipleWriteLocations) {
        connectionPolicy.UseMultipleWriteLocations = options.useMultipleWriteLocations;
        databaseAccountConfig.writableLocations = connectionPolicy.PreferredLocations.map(locationName => {
          return { name: locationName, databaseAccountEndpoint: getEndpointFromRegion(locationName) };
        }).sort((a, b) => (a.name > b.name ? 1 : -1));
        databaseAccountConfig.enableMultipleWriteLocations = options.useMultipleWriteLocations;
      } else {
        databaseAccountConfig.writableLocations = regions
          .slice(0, 1)
          .map(locationName => {
            return { name: locationName, databaseAccountEndpoint: getEndpointFromRegion(locationName) };
          })
          .sort((a, b) => (a.name > b.name ? 1 : -1));
      }
    }
  }

  scenarios.push({
    connectionPolicy,
    defaultEndpoint,
    databaseAccount: new DatabaseAccount(databaseAccountConfig, {})
  });
}

addScenario(); // Default
addScenario({ numberOfRegions: 1 });
addScenario({ numberOfRegions: 2 });
addScenario({ numberOfRegions: 3 });
addScenario({ numberOfRegions: 5 });
addScenario({ numberOfRegions: 1, useMultipleWriteLocations: true });
addScenario({ numberOfRegions: 2, useMultipleWriteLocations: true });
addScenario({ numberOfRegions: 3, useMultipleWriteLocations: true });
addScenario({ numberOfRegions: 5, useMultipleWriteLocations: true });

describe("Location Cache", function() {
  for (const scenario of scenarios) {
    describe(`when there is a DatabaseAccount refresh and ${
      scenario.connectionPolicy.PreferredLocations.length
    } preferred region and multi-region write is ${scenario.connectionPolicy.UseMultipleWriteLocations}.`, function() {
      const connectionPolicy: ConnectionPolicy = scenario.connectionPolicy;
      const endpoint = scenario.defaultEndpoint;
      const cosmosClientOptions: CosmosClientOptions = { auth: {}, endpoint, connectionPolicy };
      const locationCache = new LocationCache(cosmosClientOptions);

      before(function() {
        locationCache.onDatabaseAccountRead(scenario.databaseAccount);
      });

      it("shouldn't refresh", function() {
        const { shouldRefresh, canRefreshInBackground } = locationCache.shouldRefreshEndpoints();
        assert.equal(shouldRefresh, false, "shouldn't need to refresh");
      });

      it("preferred locations should match the connection policy preferred locations", function() {
        const preferredLocations = locationCache.prefferredLocations;
        assert.equal(
          preferredLocations.length,
          scenario.connectionPolicy.PreferredLocations.length,
          "preffered locations size should match"
        );
      });

      it("read endpoint should match most preferred endpoint", function() {
        const readEndpoint = locationCache.getReadEndpoint();
        assert.equal(
          readEndpoint,
          scenario.connectionPolicy.PreferredLocations.length > 0 ? getEndpointFromRegion(regions[0]) : endpoint,
          "read endpoint should match most preferred endpoint after database account info refresh"
        );
      });

      it("write endpoint should match default endpoint", function() {
        const writeEndpoint = locationCache.getWriteEndpoint();
        const expectedEndpoint =
          scenario.connectionPolicy.PreferredLocations.length > 0
            ? getEndpointFromRegion(scenario.connectionPolicy.PreferredLocations[0])
            : endpoint;
        assert.equal(
          writeEndpoint,
          expectedEndpoint,
          "write endpoint should match most preferred endpoint after database account info refresh"
        );
      });

      it(`read request for resolve endpoint, retry count 0, should match read endpoint`, function() {
        const resolveEndpoint = locationCache.resolveServiceEndpoint({
          operationType: Constants.OperationTypes.Read,
          resourceType: ResourceType.item,
          retryCount: 0
        });

        const readEndpoint = locationCache.getReadEndpoint();
        assert.equal(resolveEndpoint, readEndpoint, "resolve endpoint should match read endpoint");
      });

      it(`write request for resolve endpoint, retry count 0, should match write endpoint`, function() {
        const resolveEndpoint = locationCache.resolveServiceEndpoint({
          operationType: Constants.OperationTypes.Replace,
          resourceType: ResourceType.item,
          retryCount: 0
        });

        const writeEndpoint = locationCache.getWriteEndpoint();
        assert.equal(resolveEndpoint, writeEndpoint, "resolve endpoint should match write endpoint");
      });

      if (
        scenario.connectionPolicy.PreferredLocations.length < 2 ||
        !scenario.connectionPolicy.UseMultipleWriteLocations
      ) {
        it("alternate endpoint should return null", function() {
          const alternateEndpoint = locationCache.getAlternativeWriteEndpoint();
          assert.equal(
            alternateEndpoint,
            null,
            "alternate write endpoint should be non null after database account info refresh"
          );
        });
      } else {
        it("alternate endpoint should return non-null", function() {
          const alternateEndpoint = locationCache.getAlternativeWriteEndpoint();
          assert.equal(
            alternateEndpoint,
            getEndpointFromRegion(scenario.connectionPolicy.PreferredLocations[1]),
            "alternate write endpoint should be non null after database account info refresh"
          );
        });
      }

      // After this, there are side effects. All the "markUnavailable" ones will remove locations from the list.
      // It's probably best to not add new "it"s below here to avoid unreliable tests.
      if (scenario.connectionPolicy.PreferredLocations.length > 0) {
        it("hub endpoint should return non null", function() {
          const hubEndpoint = locationCache.getHubEndpoint();
          assert.equal(
            hubEndpoint,
            scenario.databaseAccount.writableLocations[0].databaseAccountEndpoint,
            "hub endpoint should be non null after database account info refresh"
          );
        });

        if (!scenario.connectionPolicy.UseMultipleWriteLocations) {
          it("write endpoint should match default endpoint even after being marked unavailable", function() {
            locationCache.markCurrentLocationUnavailableForWrite();
            const writeEndpoint = locationCache.getWriteEndpoint();
            assert.equal(
              writeEndpoint,
              scenario.databaseAccount.writableLocations[0].databaseAccountEndpoint,
              "write endpoint should match default endpoint prior to any database account info"
            );
            const resolveEndpoint = locationCache.resolveServiceEndpoint({
              operationType: Constants.OperationTypes.Replace,
              resourceType: ResourceType.item,
              retryCount: 1
            });

            assert.equal(resolveEndpoint, writeEndpoint, "resolve endpoint should match write endpoint");
            const { shouldRefresh, canRefreshInBackground } = locationCache.shouldRefreshEndpoints();
            assert.equal(shouldRefresh, true, "should need to refresh");
          });
        }
      } else {
        it("hub endpoint should return null", function() {
          const hubEndpoint = locationCache.getHubEndpoint();
          assert.equal(hubEndpoint, null, "hub endpoint should be null even after database account info refresh");
        });

        if (!scenario.connectionPolicy.UseMultipleWriteLocations) {
          it("write endpoint should match default endpoint even after being marked unavailable", function() {
            locationCache.markCurrentLocationUnavailableForWrite();
            const writeEndpoint = locationCache.getWriteEndpoint();
            assert.equal(
              writeEndpoint,
              endpoint,
              "write endpoint should match default endpoint prior to any database account info"
            );
            const resolveEndpoint = locationCache.resolveServiceEndpoint({
              operationType: Constants.OperationTypes.Replace,
              resourceType: ResourceType.item,
              retryCount: 1
            });

            assert.equal(resolveEndpoint, writeEndpoint, "resolve endpoint should match write endpoint");
            const { shouldRefresh, canRefreshInBackground } = locationCache.shouldRefreshEndpoints();
            assert.equal(
              shouldRefresh,
              scenario.connectionPolicy.PreferredLocations.length > 0,
              "should need to refresh"
            );
          });
        }
      }

      if (scenario.connectionPolicy.PreferredLocations.length > 1) {
        it("read endpoint should return next endpoint after being marked unavailable", function() {
          locationCache.markCurrentLocationUnavailableForRead();
          const readEndpoint = locationCache.getReadEndpoint();
          assert.equal(
            readEndpoint,
            getEndpointFromRegion(regions[1]),
            "read endpoint should match default endpoint prior to any database account info even if unavailable"
          );
          const resolveEndpoint = locationCache.resolveServiceEndpoint({
            operationType: Constants.OperationTypes.Read,
            resourceType: ResourceType.item,
            retryCount: 1
          });
          assert.equal(resolveEndpoint, readEndpoint, "resolve endpoint should match read endpoint");
          const { shouldRefresh, canRefreshInBackground } = locationCache.shouldRefreshEndpoints();
          assert.equal(shouldRefresh, true, "should need to refresh");
        });

        if (scenario.connectionPolicy.UseMultipleWriteLocations) {
          it("write endpoint should return next endpoint after being marked unavailable", function() {
            locationCache.markCurrentLocationUnavailableForWrite();
            const writeEndpoint = locationCache.getWriteEndpoint();
            assert.equal(
              writeEndpoint,
              getEndpointFromRegion(regions[1]),
              "write endpoint should match default endpoint prior to any database account info"
            );
            const resolveEndpoint = locationCache.resolveServiceEndpoint({
              operationType: Constants.OperationTypes.Replace,
              resourceType: ResourceType.item,
              retryCount: 1
            });

            assert.equal(resolveEndpoint, writeEndpoint, "resolve endpoint should match write endpoint");
            const { shouldRefresh, canRefreshInBackground } = locationCache.shouldRefreshEndpoints();
            assert.equal(
              shouldRefresh,
              scenario.connectionPolicy.PreferredLocations.length > 0,
              "should need to refresh"
            );
          });
        }
      } else {
        it("read endpoint should match default endpoint even after being marked unavailable", function() {
          locationCache.markCurrentLocationUnavailableForRead();
          const readEndpoint = locationCache.getReadEndpoint();
          assert.equal(
            readEndpoint,
            endpoint,
            "read endpoint should match default endpoint prior to any database account info even if unavailable"
          );

          const resolveEndpoint = locationCache.resolveServiceEndpoint({
            operationType: Constants.OperationTypes.Read,
            resourceType: ResourceType.item,
            retryCount: 1
          });
          assert.equal(resolveEndpoint, readEndpoint, "resolve endpoint should match read endpoint");
          const { shouldRefresh, canRefreshInBackground } = locationCache.shouldRefreshEndpoints();
          assert.equal(
            shouldRefresh,
            scenario.connectionPolicy.PreferredLocations.length > 0,
            "shouldn't need to refresh"
          );
        });

        if (scenario.connectionPolicy.UseMultipleWriteLocations) {
          it("write endpoint should match default endpoint even after being marked unavailable", function() {
            locationCache.markCurrentLocationUnavailableForWrite();
            const writeEndpoint = locationCache.getWriteEndpoint();
            assert.equal(
              writeEndpoint,
              endpoint,
              "write endpoint should match default endpoint prior to any database account info"
            );
            const resolveEndpoint = locationCache.resolveServiceEndpoint({
              operationType: Constants.OperationTypes.Replace,
              resourceType: ResourceType.item,
              retryCount: 1
            });

            assert.equal(resolveEndpoint, writeEndpoint, "resolve endpoint should match write endpoint");
            const { shouldRefresh, canRefreshInBackground } = locationCache.shouldRefreshEndpoints();
            assert.equal(shouldRefresh, true, "should need to refresh");
          });
        }
      }
    });

    describe(`when there is not a DatabaseAccount refresh and ${
      scenario.connectionPolicy.PreferredLocations.length
    } preferred regions and multi-region write is ${scenario.connectionPolicy.UseMultipleWriteLocations}.`, function() {
      const connectionPolicy: ConnectionPolicy = scenario.connectionPolicy;
      const endpoint = scenario.defaultEndpoint;
      const cosmosClientOptions: CosmosClientOptions = { auth: {}, endpoint, connectionPolicy };
      const locationCache = new LocationCache(cosmosClientOptions);

      it("shouldn't refresh", function() {
        const { shouldRefresh, canRefreshInBackground } = locationCache.shouldRefreshEndpoints();
        assert.equal(shouldRefresh, false, "shouldn't need to refresh");
      });

      it("preferred locations should match the connection policy preferred locations", function() {
        const preferredLocations = locationCache.prefferredLocations;
        assert.equal(
          preferredLocations.length,
          scenario.connectionPolicy.PreferredLocations.length,
          "preffered locations size should match"
        );
      });

      it("read endpoint should match default endpoint", function() {
        const readEndpoint = locationCache.getReadEndpoint();
        assert.equal(
          readEndpoint,
          endpoint,
          "read endpoint should match default endpoint prior to any database account info"
        );
      });

      it("write endpoint should match default endpoint", function() {
        const writeEndpoint = locationCache.getWriteEndpoint();
        assert.equal(
          writeEndpoint,
          endpoint,
          "write endpoint should match default endpoint prior to any database account info"
        );
      });

      it("alternate endpoint should return null", function() {
        const alternateEndpoint = locationCache.getAlternativeWriteEndpoint();
        assert.equal(
          alternateEndpoint,
          null,
          "alternate write endpoint should be null prior to any database account info"
        );
      });

      it("hub endpoint should return null", function() {
        const hubEndpoint = locationCache.getHubEndpoint();
        assert.equal(hubEndpoint, null, "hub endpoint should be null prior to any database account info");
      });

      it(`read request for resolve endpoint, retry count 0, should match read endpoint`, function() {
        const resolveEndpoint = locationCache.resolveServiceEndpoint({
          operationType: Constants.OperationTypes.Read,
          resourceType: ResourceType.item,
          retryCount: 0
        });

        const readEndpoint = locationCache.getReadEndpoint();
        assert.equal(resolveEndpoint, readEndpoint, "resolve endpoint should match read endpoint");
      });

      it(`write request for resolve endpoint, retry count 0, should match write endpoint`, function() {
        const resolveEndpoint = locationCache.resolveServiceEndpoint({
          operationType: Constants.OperationTypes.Replace,
          resourceType: ResourceType.item,
          retryCount: 0
        });

        const writeEndpoint = locationCache.getWriteEndpoint();
        assert.equal(resolveEndpoint, writeEndpoint, "resolve endpoint should match write endpoint");
      });

      // After this, there are side effects. All the "markUnavailable" ones will remove locations from the list.
      // It's probably best to not add new "it"s below here to avoid unreliable tests.
      it("read endpoint should match default endpoint even after being marked unavailable", function() {
        locationCache.markCurrentLocationUnavailableForRead();
        const readEndpoint = locationCache.getReadEndpoint();
        assert.equal(
          readEndpoint,
          endpoint,
          "read endpoint should match default endpoint prior to any database account info even if unavailable"
        );
        const resolveEndpoint = locationCache.resolveServiceEndpoint({
          operationType: Constants.OperationTypes.Read,
          resourceType: ResourceType.item,
          retryCount: 1
        });
        assert.equal(resolveEndpoint, readEndpoint, "resolve endpoint should match read endpoint");
      });

      it("write endpoint should match default endpoint even after being marked unavailable", function() {
        locationCache.markCurrentLocationUnavailableForWrite();
        const writeEndpoint = locationCache.getWriteEndpoint();
        assert.equal(
          writeEndpoint,
          endpoint,
          "write endpoint should match default endpoint prior to any database account info"
        );
        const resolveEndpoint = locationCache.resolveServiceEndpoint({
          operationType: Constants.OperationTypes.Replace,
          resourceType: ResourceType.item,
          retryCount: 1
        });

        assert.equal(resolveEndpoint, writeEndpoint, "resolve endpoint should match write endpoint");
      });
    });
  }
});
