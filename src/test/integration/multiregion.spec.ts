import assert from "assert";

import { CosmosClient } from "../../CosmosClient";
import { ConnectionPolicy, DatabaseAccount } from "../../documents";

import { endpoint, masterKey } from "../common/_testConfig";

// This test requires a multi-region write enabled account with at least two regions.
(process.env.TESTS_MULTIREGION ? describe : describe.skip)("Multi-region tests", function() {
  let preferredRegions: string[] = [];
  let dbAccount: DatabaseAccount;

  before(async function() {
    const client = new CosmosClient({ endpoint, auth: { masterKey } });
    ({ body: dbAccount } = await client.getDatabaseAccount());
    // We reverse the order of the preferred locations list to make sure
    // we don't just follow the order we got back from the server
    preferredRegions = dbAccount.readableLocations.map(v => v.name).reverse();
    assert(
      preferredRegions.length > 1,
      "Not a multi-region account. Please add a region before running this test again."
    );
  });

  it("Preferred locations should be honored for readEndpoint", async function() {
    const connectionPolicy = new ConnectionPolicy();
    connectionPolicy.PreferredLocations = preferredRegions;
    const client = new CosmosClient({ endpoint, auth: { masterKey }, connectionPolicy });
    const currentReadendpoint = await client.getReadEndpoint();
    assert(
      currentReadendpoint.includes(preferredRegions[0].toLowerCase().replace(/ /g, "")),
      "The readendpoint should be the first preferred location"
    );
  });

  it("Preferred locations should be honored for writeEndpoint", async function() {
    assert(
      dbAccount.enableMultipleWritableLocations,
      "MultipleWriteableLocations must be set on your database account for this test to work"
    );
    const connectionPolicy = new ConnectionPolicy();
    connectionPolicy.PreferredLocations = preferredRegions;
    connectionPolicy.UseMultipleWriteLocations = true;
    const client = new CosmosClient({ endpoint, auth: { masterKey }, connectionPolicy });
    const currentWriteEndpoint = await client.getWriteEndpoint();
    assert(
      currentWriteEndpoint.includes(preferredRegions[0].toLowerCase().replace(/ /g, "")),
      "The writeendpoint should be the first preferred location"
    );
  });
});
